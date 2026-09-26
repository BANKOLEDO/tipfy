import { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// Double-entry money journal.
//
// Every balance change posts legs here in the same transaction that mutates
// User.totalAmount. A failed balance assertion aborts that transaction, so the
// balance and its explanation cannot diverge.
//
// Scope: explains platform and user balances only. It does not model the
// tipper's bank account or the processing fee, so entries are built from
// amount, platformFee and netAmount only and the fee split is never
// double-counted. Tip.totalCharged and Transaction are the provider-side record.
//
// No entry is posted when a withdrawal *settles*: the money already left the
// user's balance when the withdrawal was requested, so settlement changes no
// platform balance. The state change lives on the withdrawal row.
// ---------------------------------------------------------------------------

export type LedgerAccountValue =
  | 'USER_AVAILABLE'
  | 'WITHDRAWAL_PENDING'
  | 'MONNIFY_RECEIVABLE'
  | 'MONNIFY_PAYABLE'
  | 'PLATFORM_FEE_REVENUE'
  | 'WITHDRAWAL_FEE_REVENUE'
  | 'TAX_PAYABLE'

export type LedgerDirectionValue = 'DEBIT' | 'CREDIT'

export interface LedgerLeg {
  account: LedgerAccountValue
  direction: LedgerDirectionValue
  amount: Prisma.Decimal | number | string
  // Only meaningful for USER_AVAILABLE.
  balanceAfter?: Prisma.Decimal | number | string | null
  entryType: string
  userId?: string | null
  tipId?: string | null
  withdrawalId?: string | null
  reference: string
  note?: string | null
}

export class UnbalancedLedgerError extends Error {
  constructor(groupId: string, legs: LedgerLeg[]) {
    const detail = legs
      .map(
        (l) =>
          `  ${l.direction} ${l.account} ${new Prisma.Decimal(l.amount).toFixed(2)} (${l.entryType})`,
      )
      .join('\n')
    super(
      `Ledger entry group "${groupId}" does not balance to zero. Refusing to post:\n${detail}`,
    )
    this.name = 'UnbalancedLedgerError'
  }
}

export function dec(value: Prisma.Decimal | number | string | null | undefined) {
  return new Prisma.Decimal(value ?? 0)
}

/**
 * Signed sum of a group: debits positive, credits negative.
 * Zero means the group is balanced.
 */
export function netOf(legs: LedgerLeg[]): Prisma.Decimal {
  return legs.reduce((total, leg) => {
    const amount = dec(leg.amount)
    return leg.direction === 'DEBIT' ? total.add(amount) : total.sub(amount)
  }, new Prisma.Decimal(0))
}

/**
 * Enforces the zero-sum invariant in application code.
 *
 * A CHECK constraint cannot do this: it only ever sees one row, so it cannot
 * know what the other legs of a group are. A trigger could, but asserting here
 * fails fast with a readable message inside the transaction that was about to
 * move the balance. The reconciliation job re-checks every group independently,
 * which also catches writes made by code that no longer exists.
 */
export function assertBalanced(groupId: string, legs: LedgerLeg[]): void {
  if (legs.length === 0) {
    throw new Error(`Ledger entry group "${groupId}" is empty; nothing to post.`)
  }
  for (const leg of legs) {
    if (dec(leg.amount).lte(0)) {
      throw new Error(
        `Ledger group "${groupId}" has a non-positive amount ` +
          `(${leg.direction} ${leg.account} ${dec(leg.amount).toFixed(2)}). ` +
          `Zero-value legs are skipped, not written.`,
      )
    }
    if (leg.account === 'USER_AVAILABLE' && !leg.userId) {
      throw new Error(
        `Ledger entry group "${groupId}" posts to USER_AVAILABLE without a userId.`,
      )
    }
    if (leg.account !== 'USER_AVAILABLE' && leg.userId) {
      throw new Error(
        `Ledger entry group "${groupId}" posts a userId against the platform ` +
          `account ${leg.account}; only USER_AVAILABLE may name a user.`,
      )
    }
  }
  if (!netOf(legs).isZero()) {
    throw new UnbalancedLedgerError(groupId, legs)
  }
}

type Tx = Prisma.TransactionClient

/** Posts a balanced group. Must be called inside the caller's transaction. */
export async function postLedger(
  tx: Tx,
  groupId: string,
  legs: LedgerLeg[],
): Promise<void> {
  assertBalanced(groupId, legs)
  await tx.ledgerEntry.createMany({ data: legs.map((leg) => ({ ...leg, entryGroupId: groupId, amount: dec(leg.amount), balanceAfter: leg.balanceAfter == null ? null : dec(leg.balanceAfter) })) })
}

export interface TipMoney {
  id: string
  reference: string
  amount: Prisma.Decimal | number
  platformFee: Prisma.Decimal | number
  netAmount: Prisma.Decimal | number
  recipientId: string
}

/** Cash owed by the provider, split into commission and the recipient's cut. */
export function tipSettlementLegs(tip: TipMoney, balanceAfter: Prisma.Decimal | number): LedgerLeg[] {
  return [
    { account: 'MONNIFY_RECEIVABLE', direction: 'DEBIT', amount: tip.amount, entryType: 'TIP_SETTLED', tipId: tip.id, reference: tip.reference, note: 'cash receivable from provider' },
    { account: 'PLATFORM_FEE_REVENUE', direction: 'CREDIT', amount: tip.platformFee, entryType: 'TIP_FEE', tipId: tip.id, reference: tip.reference, note: 'TipFY commission' },
    { account: 'USER_AVAILABLE', direction: 'CREDIT', amount: tip.netAmount, balanceAfter, entryType: 'TIP_CREDIT', userId: tip.recipientId, tipId: tip.id, reference: tip.reference, note: 'recipient credited' },
  ]
}

/** Claw back of a completed tip whose recipient no longer exists. */
export function tipReversalLegs(tip: TipMoney): LedgerLeg[] {
  return [
    { account: 'PLATFORM_FEE_REVENUE', direction: 'DEBIT', amount: tip.platformFee, entryType: 'TIP_FEE_REVERSED', tipId: tip.id, reference: tip.reference, note: 'commission clawed back' },
    { account: 'USER_AVAILABLE', direction: 'DEBIT', amount: tip.netAmount, entryType: 'TIP_CREDIT_REVERSED', userId: tip.recipientId, tipId: tip.id, reference: tip.reference, note: 'recipient debited' },
    { account: 'MONNIFY_RECEIVABLE', direction: 'CREDIT', amount: tip.amount, entryType: 'TIP_SETTLEMENT_REVERSED', tipId: tip.id, reference: tip.reference, note: 'chargeback against provider' },
  ]
}

export interface WithdrawalMoney {
  id: string
  reference: string
  userId: string
  amount: Prisma.Decimal | number
  fee: Prisma.Decimal | number
  estimatedTax: Prisma.Decimal | number
  netAmount: Prisma.Decimal | number
}

/**
 * Withdrawal requested. The full gross amount leaves the spendable balance
 * immediately; the tax is withheld out of the net, so what we expect to land is
 * netAmount less estimatedTax.
 */
export function withdrawalDebitLegs(w: WithdrawalMoney, balanceAfter: Prisma.Decimal | number): LedgerLeg[] {
  const tax = dec(w.estimatedTax)
  const net = dec(w.netAmount)
  const expectedLanding = net.sub(tax)
  return [
    { account: 'USER_AVAILABLE', direction: 'DEBIT', amount: w.amount, balanceAfter, entryType: 'WITHDRAWAL_DEBIT', userId: w.userId, withdrawalId: w.id, reference: w.reference, note: 'withdrawal requested' },
    { account: 'WITHDRAWAL_FEE_REVENUE', direction: 'CREDIT', amount: w.fee, entryType: 'WITHDRAWAL_FEE', withdrawalId: w.id, reference: w.reference, note: 'payout fee' },
    { account: 'TAX_PAYABLE', direction: 'CREDIT', amount: tax, entryType: 'WITHDRAWAL_TAX', withdrawalId: w.id, reference: w.reference, note: 'withholding tax, owed to authority' },
    { account: 'MONNIFY_PAYABLE', direction: 'CREDIT', amount: expectedLanding, entryType: 'WITHDRAWAL_PAYABLE', withdrawalId: w.id, reference: w.reference, note: 'owed to provider' },
  ]
}

/** Exact reverse of withdrawalDebitLegs, used when a payout fails. */
export function withdrawalRefundLegs(w: WithdrawalMoney, balanceAfter: Prisma.Decimal | number): LedgerLeg[] {
  const tax = dec(w.estimatedTax)
  const net = dec(w.netAmount)
  const expectedLanding = net.sub(tax)
  return [
    { account: 'WITHDRAWAL_FEE_REVENUE', direction: 'DEBIT', amount: w.fee, entryType: 'WITHDRAWAL_FEE_REVERSED', withdrawalId: w.id, reference: w.reference, note: 'payout fee reversed' },
    { account: 'TAX_PAYABLE', direction: 'DEBIT', amount: tax, entryType: 'WITHDRAWAL_TAX_REVERSED', withdrawalId: w.id, reference: w.reference, note: 'withholding reversed' },
    { account: 'MONNIFY_PAYABLE', direction: 'DEBIT', amount: expectedLanding, entryType: 'WITHDRAWAL_PAYABLE_REVERSED', withdrawalId: w.id, reference: w.reference, note: 'provider obligation cleared' },
    { account: 'USER_AVAILABLE', direction: 'CREDIT', amount: w.amount, balanceAfter, entryType: 'WITHDRAWAL_REFUND', userId: w.userId, withdrawalId: w.id, reference: w.reference, note: 'withdrawal refunded' },
  ]
}
