import { db } from '~/lib/db'
import { getDisbursementStatus } from '~/services/monnify'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { runIfLeader } from '~/jobs/leaderLock'
import {
  notifyWithdrawalCompleted,
  notifyWithdrawalFailed,
} from '~/services/notifications'

const STUCK_AFTER_MS = 30 * 60 * 1000
const RUN_INTERVAL_MS = 30 * 60 * 1000

// Safety net for withdrawals whose Monnify call threw (ambiguous outcome).
// The webhook is the primary settlement path; this reconciles anything still
// stuck in 'processing' by asking Monnify for the real disbursement status.
export async function resolveStuckWithdrawals(): Promise<number> {
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS)

  const stuck = await db.withdrawal.findMany({
    where: { status: 'processing', updatedAt: { lt: cutoff } },
  })

  for (const withdrawal of stuck) {
    try {
      const result = await getDisbursementStatus(withdrawal.reference)
      const records = Array.isArray(result?.responseBody?.content)
        ? result.responseBody.content
        : []
      const match = records.find(
        (r) => r.reference === withdrawal.reference
      )

      if (match?.status === 'SUCCESSFUL') {
        // Guarded claim: the webhook (and a second reaper instance) may settle
        // this row first. Only the request that actually flips it out of
        // 'processing' may notify.
        const claimed = await db.withdrawal.updateMany({
          where: { id: withdrawal.id, status: 'processing' },
          data: { status: 'completed', processedAt: new Date() },
        })

        if (claimed.count === 0) continue

        await logAuditEvent({
          action: AuditActions.WITHDRAWAL_COMPLETE,
          resource: 'withdrawal',
          resourceId: withdrawal.reference,
          metadata: { amount: Number(withdrawal.amount), source: 'reaper' },
        })
        await notifyWithdrawalCompleted(
          withdrawal.userId,
          Number(withdrawal.amount)
        )
        console.log(`[JOBS] Resolved stuck withdrawal ${withdrawal.reference} as completed`)
      } else if (match?.status === 'FAILED' || match?.status === 'FAILED_CREDIT') {
        const reason = match.responseMessage || 'Disbursement failed'

        const refunded = await db.$transaction(async (tx) => {
          const claim = await tx.withdrawal.updateMany({
            where: { id: withdrawal.id, status: 'processing' },
            data: { status: 'failed', failureReason: reason },
          })
          if (claim.count === 0) return false
          await tx.user.update({
            where: { id: withdrawal.userId },
            data: { totalAmount: { increment: withdrawal.amount } },
          })
          return true
        })

        if (!refunded) continue

        await logAuditEvent({
          action: AuditActions.WITHDRAWAL_FAIL,
          resource: 'withdrawal',
          resourceId: withdrawal.reference,
          metadata: {
            amount: Number(withdrawal.amount),
            reason,
            source: 'reaper',
          },
        })
        await notifyWithdrawalFailed(
          withdrawal.userId,
          Number(withdrawal.amount),
          reason
        )
        console.log(`[JOBS] Resolved stuck withdrawal ${withdrawal.reference} as failed (refunded)`)
      } else {
        // Still in flight or status unknown — note the check and move on.
        // Merge rather than overwrite: monnifyResponse holds the original
        // initiateDisbursement response, which is the only evidence of what
        // the provider was actually told.
        const existing =
          typeof withdrawal.monnifyResponse === 'object' &&
          withdrawal.monnifyResponse !== null &&
          !Array.isArray(withdrawal.monnifyResponse)
            ? (withdrawal.monnifyResponse as Record<string, unknown>)
            : {}

        await db.withdrawal.updateMany({
          where: { id: withdrawal.id, status: 'processing' },
          data: {
            monnifyResponse: {
              ...existing,
              lastCheckAt: new Date().toISOString(),
              lastKnownStatus: match?.status || 'unknown',
            },
          },
        })
      }
    } catch (err) {
      // Monnify unreachable — retry on the next interval.
      console.error(
        `[JOBS] Failed to resolve stuck withdrawal ${withdrawal.reference}:`,
        err
      )
    }
  }

  return stuck.length
}

export function startWithdrawalReaper(): NodeJS.Timeout {
  const timer = setInterval(() => {
    runIfLeader(resolveStuckWithdrawals, 'resolve stuck withdrawals')
  }, RUN_INTERVAL_MS)
  timer.unref()
  return timer
}
