import { db } from '~/lib/db'
import { verifyTransaction } from '~/services/monnify'
import { completeTip } from '~/routes/tips'
import { runIfLeader } from '~/jobs/leaderLock'

const PENDING_TTL_MS = 24 * 60 * 60 * 1000
const RUN_INTERVAL_MS = 30 * 60 * 1000

// Monnify checkout links expire, so abandoned tips should be marked expired
// instead of lingering as 'pending' forever (admin noise + misleading counts).
//
// The provider is consulted first. Expiring purely on age used to swallow real
// money: a tipper who finished checkout more than 24h after starting was
// flipped to 'expired', which blocked completeTip's 'pending' guard, so the
// recipient was never credited and no Transaction row was ever written.
export async function expirePendingTips(): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_TTL_MS)

  const candidates = await db.tip.findMany({
    where: { status: 'pending', createdAt: { lt: cutoff } },
    select: {
      id: true,
      reference: true,
      monnifyReference: true,
      amount: true,
      totalCharged: true,
      platformFee: true,
      processingFee: true,
      netAmount: true,
      currency: true,
      recipientId: true,
      senderId: true,
      message: true,
      category: true,
      isAnonymous: true,
      senderName: true,
    },
    take: 100,
  })

  let expired = 0
  let recovered = 0

  for (const tip of candidates) {
    try {
      const verification = await verifyTransaction(tip.reference)
      const paymentStatus = verification.responseBody?.paymentStatus

      if (verification.requestSuccessful && paymentStatus === 'PAID') {
        // The money is real — credit it rather than expiring it.
        const settled = await completeTip(
          tip,
          verification.responseBody?.paymentMethod || 'CARD',
          verification.responseBody?.paymentReference || tip.monnifyReference || tip.reference
        )
        if (settled) recovered++
        continue
      }

      if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED') {
        // Confirmed dead at the provider: safe to expire.
        const result = await db.tip.updateMany({
          where: { id: tip.id, status: 'pending' },
          data: { status: 'expired' },
        })
        expired += result.count
        continue
      }

      // Provider says nothing conclusive (not started, or unreachable). Leave
      // it pending so it stays visible for reconciliation rather than being
      // silently discarded.
    } catch (err) {
      // Provider unreachable — leave the tip pending and retry next tick.
      console.error(
        `[JOBS] Could not verify stale tip ${tip.reference} before expiry:`,
        err
      )
    }
  }

  if (expired > 0 || recovered > 0) {
    console.log(
      `[JOBS] Expired ${expired} stale pending tip(s); recovered ${recovered} late-paid tip(s)`
    )
  }

  return expired
}

export function startPendingTipReaper(): NodeJS.Timeout {
  const timer = setInterval(() => {
    runIfLeader(expirePendingTips, 'expire pending tips')
  }, RUN_INTERVAL_MS)
  timer.unref()
  return timer
}
