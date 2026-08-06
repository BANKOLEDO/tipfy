import { db } from '~/lib/db'

const PENDING_TTL_MS = 24 * 60 * 60 * 1000
const RUN_INTERVAL_MS = 30 * 60 * 1000

// Monnify checkout links expire, so abandoned tips should be marked expired
// instead of lingering as 'pending' forever (admin noise + misleading counts).
export async function expirePendingTips(): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_TTL_MS)
  const result = await db.tip.updateMany({
    where: { status: 'pending', createdAt: { lt: cutoff } },
    data: { status: 'expired' },
  })
  if (result.count > 0) {
    console.log(`[JOBS] Expired ${result.count} stale pending tip(s)`)
  }
  return result.count
}

export function startPendingTipReaper(): NodeJS.Timeout {
  const timer = setInterval(() => {
    expirePendingTips().catch((err) => {
      console.error('[JOBS] Failed to expire pending tips:', err)
    })
  }, RUN_INTERVAL_MS)
  timer.unref()
  return timer
}
