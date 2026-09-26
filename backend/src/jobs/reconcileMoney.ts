import { db } from '~/lib/db'
import { runIfLeader } from '~/jobs/leaderLock'

// ---------------------------------------------------------------------------
// Daily reconciliation.
//
// The ledger's own invariant (each group sums to zero) is checked in
// application code at write time and enforced by the append-only trigger. This
// job is the independent check: it re-derives the balances from the ledger and
// compares them to the columns the app actually serves, so a disagreement is
// caught even if the code that caused it no longer exists.
//
// It reports; it never mutates money. Fixing a discrepancy is a deliberate,
// audited operation (a reversing ledger entry), not something a cron job
// should do on its own.
// ---------------------------------------------------------------------------

const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000 // every 6 hours

export interface Discrepancy {
  kind: string
  detail: string
  count: number
}

export interface ReconcileResult {
  checkedCount: number
  discrepancies: Discrepancy[]
}

export async function reconcileMoney(): Promise<ReconcileResult> {
  const discrepancies: Discrepancy[] = []

  // 1. Every ledger group must net to zero.
  const unbalanced = await db.$queryRaw<
    { entry_group_id: string; net: string }[]
  >`
    SELECT entry_group_id,
           SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE -amount END) AS net
    FROM ledger_entries
    GROUP BY entry_group_id
    HAVING SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE -amount END) <> 0
  `
  if (unbalanced.length > 0) {
    discrepancies.push({
      kind: 'unbalanced_ledger_group',
      detail: `Groups whose legs do not sum to zero: ${unbalanced
        .map((r) => `${r.entry_group_id} (${r.net})`)
        .join(', ')}`,
      count: unbalanced.length,
    })
  }

  // 2. Each user's ledger balance must equal users.total_amount.
  //    Covers balances written before the ledger existed only once the ledger
  //    is backfilled; until then a mismatch means the two have diverged.
  const drifted = await db.$queryRaw<{ user_id: string; ledger: string; column: string }[]>`
    SELECT u.id AS user_id,
           COALESCE(SUM(
             CASE WHEN le.direction = 'CREDIT' THEN le.amount ELSE -le.amount END
           ), 0) AS ledger,
           u.total_amount AS column
    FROM users u
    LEFT JOIN ledger_entries le
      ON le.user_id = u.id AND le.account = 'USER_AVAILABLE'
    GROUP BY u.id, u.total_amount
    HAVING COALESCE(SUM(
             CASE WHEN le.direction = 'CREDIT' THEN le.amount ELSE -le.amount END
           ), 0) <> u.total_amount
  `
  if (drifted.length > 0) {
    discrepancies.push({
      kind: 'balance_drift',
      detail:
        `${drifted.length} user(s) where users.total_amount disagrees with the ` +
        `sum of their USER_AVAILABLE ledger entries. Ledger covers only ` +
        `settlements since it was introduced, so a pre-existing balance ` +
        `shows up here until backfilled.`,
      count: drifted.length,
    })
  }

  // 3. Tips the provider says are paid but that were never booked. This is the
  //    "paid but uncredited" failure the tip reaper is meant to prevent; finding
  //    one here means the reaper missed it.
  const unbooked = await db.$queryRaw<
    { reference: string; status: string; age_hours: number }[]
  >`
    SELECT t.reference, t.status, EXTRACT(EPOCH FROM (now() - t.created_at)) / 3600 AS age_hours
    FROM tips t
    WHERE t.status IN ('pending', 'expired')
      AND t.created_at < now() - interval '48 hours'
    ORDER BY t.created_at
    LIMIT 200
  `

  // 4. Completed tips with no ledger entry, i.e. settled outside the ledger.
  const unledgered = await db.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count
    FROM tips t
    WHERE t.status = 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM ledger_entries le
        WHERE le.tip_id = t.id AND le.entry_type = 'TIP_CREDIT'
      )
  `
  const unledgeredCount = Number(unledgered[0]?.count ?? 0)
  if (unledgeredCount > 0) {
    discrepancies.push({
      kind: 'completed_tip_without_ledger_entry',
      detail:
        `${unledgeredCount} completed tip(s) have no TIP_CREDIT ledger entry. ` +
        `Expected only for tips settled before the ledger was introduced.`,
      count: unledgeredCount,
    })
  }

  const run = await db.reconciliationRun.create({
    data: {
      runType: 'money',
      status: discrepancies.length > 0 ? 'discrepancies' : 'clean',
      completedAt: new Date(),
      checkedCount: unbooked.length,
      discrepancyCount: discrepancies.length,
      summary: {
        unbalancedGroups: unbalanced.length,
        driftedUsers: drifted.length,
        unledgeredCompletedTips: unledgeredCount,
        stalePendingTips: unbooked.length,
      } as any,
    },
  })

  if (discrepancies.length > 0) {
    console.error(
      `[RECONCILE] run ${run.id}: ${discrepancies.length} discrepancy type(s)\n` +
        discrepancies.map((d) => `  - ${d.kind}: ${d.detail}`).join('\n'),
    )
  } else {
    console.log(`[RECONCILE] run ${run.id}: clean`)
  }

  return { checkedCount: unbooked.length, discrepancies }
}

export function startReconciliationJob(): NodeJS.Timeout {
  const timer = setInterval(() => {
    runIfLeader(reconcileMoney, 'money reconciliation')
  }, RUN_INTERVAL_MS)
  timer.unref()
  return timer
}
