import { getEnv } from '~/config/env'

const MONNIFY_MDR_RATE = 0.015
const MONNIFY_MDR_CAP = 2000
const VAT_RATE = 0.075
const WHT_RATE = 0.05

export function isPlanActive(
  plan: string | null | undefined,
  planExpiresAt: Date | null | undefined
): boolean {
  return plan === 'pro' && !!planExpiresAt && planExpiresAt > new Date()
}

export function getPlatformFeeRate(
  plan?: string,
  planExpiresAt?: Date | null
): number {
  const env = getEnv()
  return isPlanActive(plan, planExpiresAt)
    ? env.PRO_PLATFORM_FEE_PERCENT
    : env.PLATFORM_FEE_PERCENT
}

// Monnify's 1.5% MDR (capped at ₦2,000) + 7.5% VAT on the fee + a small
// convenience markup. This is charged to the tipper on top of the tip amount.
export function computeProcessingFee(amount: number): number {
  const env = getEnv()
  const mdr = Math.min(Math.ceil(amount * MONNIFY_MDR_RATE), MONNIFY_MDR_CAP)
  const vat = Math.ceil(mdr * VAT_RATE)
  return mdr + vat + env.PROCESSING_FEE_MARKUP
}

// TipFY's commission, taken out of the tip before the recipient is credited.
export function computePlatformFee(
  amount: number,
  plan?: string,
  planExpiresAt?: Date | null
): number {
  const rate = getPlatformFeeRate(plan, planExpiresAt) / 100
  return Math.round(amount * rate * 100) / 100
}

export interface TipFeeBreakdown {
  amount: number // base tip amount
  processingFee: number // added to what the tipper pays
  totalCharge: number // what the tipper actually pays at checkout
  platformFee: number // TipFY commission
  netToRecipient: number // credited to the recipient
}

export function computeTipFees(
  amount: number,
  plan?: string,
  planExpiresAt?: Date | null
): TipFeeBreakdown {
  const processingFee = computeProcessingFee(amount)
  const platformFee = computePlatformFee(amount, plan, planExpiresAt)
  return {
    amount,
    processingFee,
    totalCharge: amount + processingFee,
    platformFee,
    netToRecipient: Math.round((amount - platformFee) * 100) / 100,
  }
}

// Flat fee on payouts. The first N withdrawals each month are free.
export function computeWithdrawalFee(monthlyWithdrawals: number): number {
  const env = getEnv()
  return monthlyWithdrawals >= env.FREE_WITHDRAWALS_PER_MONTH
    ? env.WITHDRAWAL_FEE
    : 0
}

// Estimate of the 5% withholding tax Monnify may withhold on payouts.
// Recorded for reconciliation — Monnify's actual deduction should be verified.
export function estimateWithholdingTax(amount: number): number {
  return Math.round(amount * WHT_RATE * 100) / 100
}
