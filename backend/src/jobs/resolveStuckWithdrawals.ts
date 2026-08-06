import { db } from '~/lib/db'
import { getDisbursementStatus } from '~/services/monnify'
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
        await db.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: 'completed', processedAt: new Date() },
        })
        await notifyWithdrawalCompleted(
          withdrawal.userId,
          Number(withdrawal.amount)
        )
        console.log(`[JOBS] Resolved stuck withdrawal ${withdrawal.reference} as completed`)
      } else if (match?.status === 'FAILED' || match?.status === 'FAILED_CREDIT') {
        await db.$transaction([
          db.withdrawal.update({
            where: { id: withdrawal.id },
            data: {
              status: 'failed',
              failureReason:
                match.responseMessage || 'Disbursement failed',
            },
          }),
          db.user.update({
            where: { id: withdrawal.userId },
            data: { totalAmount: { increment: withdrawal.amount } },
          }),
        ])
        await notifyWithdrawalFailed(
          withdrawal.userId,
          Number(withdrawal.amount),
          match.responseMessage || 'Disbursement failed'
        )
        console.log(`[JOBS] Resolved stuck withdrawal ${withdrawal.reference} as failed (refunded)`)
      } else {
        // Still in flight or status unknown — note the check and move on.
        await db.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            monnifyResponse: {
              lastCheckAt: new Date().toISOString(),
              status: match?.status || 'unknown',
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
    resolveStuckWithdrawals().catch((err) => {
      console.error('[JOBS] Failed to resolve stuck withdrawals:', err)
    })
  }, RUN_INTERVAL_MS)
  timer.unref()
  return timer
}
