import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { withdrawSchema, accountValidateSchema } from '~/lib/validations'
import { validate } from '~/middleware/validate'
import { authenticate } from '~/middleware/auth'
import { pinRateLimit, accountLookupRateLimit } from '~/middleware/rateLimit'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { initiateDisbursement, verifyWebhookSignature, validateAccount } from '~/services/monnify'
import { notifyWithdrawalCompleted, notifyWithdrawalProcessing, notifyWithdrawalFailed } from '~/services/notifications'
import { computeWithdrawalFee, estimateWithholdingTax } from '~/lib/fees'
import { getEnv } from '~/config/env'

const router = Router()

// Get withdrawal info (balance, history)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totalAmount: true,
        totalTipsReceived: true,
      },
    })

    const pendingTips = await db.tip.aggregate({
      where: { recipientId: userId, status: 'pending' },
      _sum: { amount: true },
    })

    const availableBalance = Number(user?.totalAmount || 0)
    const pendingAmount = Number(pendingTips._sum.amount || 0)

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthlyWithdrawals = await db.withdrawal.count({
      where: { userId, createdAt: { gte: monthStart }, status: { not: 'failed' } },
    })

    const withdrawals = await db.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    res.json({
      success: true,
      data: {
        balance: availableBalance,
        pendingAmount,
        totalTips: user?.totalTipsReceived || 0,
        monthlyWithdrawals,
        withdrawalFee: computeWithdrawalFee(monthlyWithdrawals),
        freeWithdrawalsPerMonth: getEnv().FREE_WITHDRAWALS_PER_MONTH,
        withdrawals: withdrawals.map((w) => ({
          ...w,
          amount: Number(w.amount),
          fee: Number(w.fee || 0),
          netAmount: Number(w.netAmount || 0),
          estimatedTax: Number(w.estimatedTax || 0),
          accountNumber:
            w.accountNumber.slice(0, 3) + '****' + w.accountNumber.slice(-3),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Look up a bank account name (Monnify name enquiry) so the user can
// confirm their details before submitting a withdrawal.
router.post(
  '/validate-account',
  authenticate,
  validate(accountValidateSchema),
  accountLookupRateLimit,
  async (req, res, next) => {
    try {
      const { bankCode, accountNumber } = req.body

      const result = await validateAccount(bankCode, accountNumber)

      if (!result.requestSuccessful || !result.responseBody?.accountName) {
        throw AppError.badRequest(result.responseMessage || 'Could not verify account details')
      }

      res.json({
        success: true,
        data: {
          accountNumber: result.responseBody.accountNumber,
          accountName: result.responseBody.accountName,
          bankCode: result.responseBody.bankCode,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Create withdrawal request
router.post(
  '/',
  authenticate,
  validate(withdrawSchema),
  pinRateLimit,
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const { amount, bankCode, accountNumber, pin } = req.body

      // Verify the withdrawal PIN before doing anything
      const pinUser = await db.user.findUnique({
        where: { id: userId },
        select: { withdrawalPinHash: true },
      })

      if (!pinUser?.withdrawalPinHash) {
        throw new AppError('Withdrawal PIN not set. Set a PIN first.', 403, 'PIN_NOT_SET')
      }

      const pinValid = await bcrypt.compare(pin, pinUser.withdrawalPinHash)
      if (!pinValid) {
        throw AppError.unauthorized('Incorrect withdrawal PIN')
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          totalAmount: true,
          displayName: true,
        },
      })

      if (!user) throw AppError.notFound('User not found')

      const pendingWithdrawals = await db.withdrawal.aggregate({
        where: {
          userId,
          status: { in: ['pending', 'processing'] },
        },
        _sum: { amount: true },
      })

      const pendingAmount = Number(pendingWithdrawals._sum.amount || 0)
      const available = Number(user.totalAmount) - pendingAmount

      if (amount > available) {
        throw AppError.badRequest(
          `Insufficient balance. Available: ₦${available.toLocaleString()}`
        )
      }

      if (amount < 1000) {
        throw AppError.badRequest('Minimum withdrawal is ₦1,000')
      }

      if (amount > 500000) {
        throw AppError.badRequest('Maximum withdrawal is ₦500,000')
      }

      // Resolve the beneficiary account name via Monnify name enquiry —
      // it's now a mandatory field for disbursements and must match.
      const accountCheck = await validateAccount(bankCode, accountNumber)
      if (!accountCheck.requestSuccessful || !accountCheck.responseBody?.accountName) {
        throw AppError.badRequest(
          accountCheck.responseMessage || 'Unable to verify bank account details'
        )
      }
      const resolvedAccountName = accountCheck.responseBody.accountName

      // Withdrawal fee: first N withdrawals per month are free, then a flat fee
      // comes out of the payout. WHT is recorded as an estimate for reconciliation.
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const monthlyWithdrawals = await db.withdrawal.count({
        where: { userId, createdAt: { gte: monthStart }, status: { not: 'failed' } },
      })
      const withdrawalFee = computeWithdrawalFee(monthlyWithdrawals)
      const netAmount = amount - withdrawalFee
      const estimatedTax = estimateWithholdingTax(netAmount)

      const BANKS: Record<string, string> = {
        '044': 'Access Bank',
        '033': 'United Bank for Africa',
        '057': 'Zenith Bank',
        '011': 'First Bank of Nigeria',
        '070': 'Guaranty Trust Bank',
        '214': 'First City Monument Bank',
        '032': 'Union Bank',
        '035': 'Wema Bank',
        '069': 'Heritage Bank',
        '076': 'Polaris Bank',
        '090': 'Keystone Bank',
        '101': 'Providus Bank',
        '221': 'Stanbic IBTC Bank',
        '068': 'Standard Chartered Bank',
      }

      const bankName = BANKS[bankCode] || 'Unknown Bank'
      const reference = `WD-${uuid().slice(0, 8).toUpperCase()}`

      // Atomically debit balance and create withdrawal. The conditional
      // updateMany guards against concurrent withdrawals racing past each
      // other (TOCTOU) and driving the balance negative.
      const withdrawal = await db.$transaction(async (tx) => {
        const debited = await tx.user.updateMany({
          where: { id: userId, totalAmount: { gte: amount } },
          data: { totalAmount: { decrement: amount } },
        })

        if (debited.count === 0) {
          const current = await tx.user.findUnique({
            where: { id: userId },
            select: { totalAmount: true },
          })

          const pending = await tx.withdrawal.aggregate({
            where: {
              userId,
              status: { in: ['pending', 'processing'] },
            },
            _sum: { amount: true },
          })

          const available =
            Number(current?.totalAmount || 0) - Number(pending._sum.amount || 0)

          throw AppError.badRequest(
            `Insufficient balance. Available: ₦${available.toLocaleString()}`
          )
        }

        return tx.withdrawal.create({
          data: {
            userId,
            amount,
            fee: withdrawalFee,
            netAmount,
            estimatedTax,
            bankCode,
            bankName,
            accountNumber,
            accountName: resolvedAccountName,
            reference,
            status: 'pending',
          },
        })
      })

      let finalStatus = withdrawal.status

      // Mark the payout as "in flight" BEFORE calling Monnify. If the call
      // throws (timeout/network) the outcome is unknown, so we must NOT refund
      // — the webhook or the staleness reaper settles it from Monnify's status.
      await db.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: 'processing' },
      })

      try {
        const disbursement = await initiateDisbursement({
          amount: netAmount,
          bankCode,
          accountNumber,
          accountName: resolvedAccountName,
          reference,
          narration: 'TipFY Withdrawal',
        })

        if (disbursement.requestSuccessful) {
          await db.withdrawal.update({
            where: { id: withdrawal.id },
            data: { monnifyResponse: disbursement as any },
          })
          finalStatus = 'processing'
          await notifyWithdrawalProcessing(userId, amount)
        } else {
          // Monnify explicitly rejected the payout — safe to refund balance.
          await db.$transaction([
            db.user.update({
              where: { id: userId },
              data: { totalAmount: { increment: amount } },
            }),
            db.withdrawal.update({
              where: { id: withdrawal.id },
              data: {
                status: 'failed',
                failureReason: disbursement.responseMessage,
              },
            }),
          ])
          finalStatus = 'failed'
          await notifyWithdrawalFailed(userId, amount, disbursement.responseMessage)
        }
      } catch (err) {
        // Ambiguous outcome — do not refund. The webhook or the reaper will
        // settle this once Monnify reports the final disbursement status.
        const message = err instanceof Error ? err.message : 'Disbursement service error'

        await db.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            monnifyResponse: { outcome: 'ambiguous', error: message },
          },
        })

        await logAuditEvent({
          userId,
          action: 'withdrawal.ambiguous',
          resource: 'withdrawal',
          resourceId: withdrawal.id,
          ipAddress: req.ip,
          metadata: { amount, message },
        })

        finalStatus = 'processing'
        await notifyWithdrawalProcessing(userId, amount)
      }

      await logAuditEvent({
        userId,
        action: AuditActions.WITHDRAWAL_REQUEST,
        resource: 'withdrawal',
        resourceId: withdrawal.id,
        ipAddress: req.ip,
        metadata: { amount, bankCode },
      })

      res.status(201).json({
        success: true,
        data: {
          withdrawal: {
            id: withdrawal.id,
            reference: withdrawal.reference,
            amount: Number(withdrawal.amount),
            fee: Number(withdrawal.fee || 0),
            netAmount: Number(withdrawal.netAmount || 0),
            estimatedTax: Number(withdrawal.estimatedTax || 0),
            status: finalStatus,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Webhook handler for Monnify disbursements
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['monnify-signature'] as string
    const rawBody = (req as any).rawBody || JSON.stringify(req.body)

    if (!verifyWebhookSignature(rawBody, signature)) {
      throw AppError.badRequest('Invalid webhook signature')
    }

    const payload = req.body
    const { eventType, eventData } = payload

    await logAuditEvent({
      action: 'withdrawal.webhook',
      resource: 'withdrawal',
      resourceId: eventData?.reference || 'unknown',
      ipAddress: req.ip,
      metadata: { eventType, payload },
    })

    if (eventType === 'SUCCESSFUL_DISBURSEMENT' || eventType === 'DISBURSEMENT_SUCCESS') {
      if (!eventData?.reference) {
        return res.status(400).json({ success: false, message: 'Missing reference' })
      }

      const withdrawal = await db.withdrawal.findFirst({
        where: { reference: eventData.reference },
      })

        if (withdrawal && withdrawal.status === 'processing') {
          await db.withdrawal.update({
            where: { id: withdrawal.id },
            data: {
              status: 'completed',
              processedAt: new Date(),
            },
          })
        await notifyWithdrawalCompleted(withdrawal.userId, Number(withdrawal.amount))
      }
    }

    if (eventType === 'FAILED_DISBURSEMENT' || eventType === 'DISBURSEMENT_FAILED') {
      if (!eventData?.reference) {
        return res.status(400).json({ success: false, message: 'Missing reference' })
      }

      const withdrawal = await db.withdrawal.findFirst({
        where: { reference: eventData.reference },
      })

      if (withdrawal && withdrawal.status === 'processing') {
        // Refund balance on confirmed failure
        await db.$transaction([
          db.withdrawal.update({
            where: { id: withdrawal.id },
            data: {
              status: 'failed',
              failureReason: eventData?.responseMessage || 'Disbursement failed',
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
          eventData?.responseMessage || 'Disbursement failed'
        )
      }
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
