import { db } from '~/lib/db'

// Postgres advisory locks are session-scoped and released automatically when
// the connection drops, which is exactly the property a leader lease needs.
const ADVISORY_LOCK_KEY = 0x74697066 // "tipf"

type ReleaseLock = () => Promise<void>

async function tryAcquireAdvisoryLock(): Promise<ReleaseLock | null> {
  const rows = await db.$queryRaw<{ locked: boolean }[]>`
    SELECT pg_try_advisory_lock(${ADVISORY_LOCK_KEY}) AS locked
  `

  if (!rows[0]?.locked) return null

  return async () => {
    await db.$queryRaw`SELECT pg_advisory_unlock(${ADVISORY_LOCK_KEY})`
  }
}

/**
 * Runs `task` only if this process wins the advisory lock.
 *
 * Every replica used to start both reapers unconditionally, so on a
 * horizontally-scaled or serverless deploy N processes polled the same rows
 * simultaneously — which is what turned the unguarded status writes in the
 * withdrawal reaper into repeatable double refunds.
 */
export async function runIfLeader(task: () => Promise<unknown>, label: string) {
  let release: (() => Promise<void>) | null = null
  try {
    release = await tryAcquireAdvisoryLock()
  } catch (err) {
    // If we cannot determine leadership, do not run money-moving jobs.
    console.error(`[JOBS] Could not acquire leadership for ${label}:`, err)
    return
  }

  if (!release) return

  try {
    await task()
  } catch (err) {
    console.error(`[JOBS] ${label} failed:`, err)
  } finally {
    await release().catch(() => {})
  }
}
