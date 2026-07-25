import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { withdrawSchema } from '~/lib/validations'
import { validate } from '~/middleware/validate'
import { authenticate } from '~/middleware/auth'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { initiateDisbursement, verifyWebhookSignature } from '~/services/monnify'
import { notifyWithdrawalCompleted, notifyWithdrawalFailed } from '~/services/notifications'

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
        withdrawals: withdrawals.map((w) => ({
          ...w,
          amount: Number(w.amount),
          accountNumber:
            w.accountNumber.slice(0, 3) + '****' + w.accountNumber.slice(-3),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Create withdrawal request
router.post(
  '/',
  authenticate,
  validate(withdrawSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const { amount, bankCode, accountNumber } = req.body

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

      const BANKS: Record<string, string> = {
        '044': 'Access Bank',
        '033': 'United Bank for Africa',
        '057': 'Zenith Bank',
        '011': 'First Bank of Nigeria',
        '070': 'Guaranty Trust Bank',
        '058': 'Guaranty Trust Bank',
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

      // Atomically debit balance and create withdrawal
      const withdrawal = await db.$transaction(async (tx) => {
        // Re-check balance inside transaction (row-level lock via Prisma)
        const lockedUser = await tx.user.findUnique({
          where: { id: userId },
          select: { totalAmount: true },
        })

        const lockedPending = await tx.withdrawal.aggregate({
          where: {
            userId,
            status: { in: ['pending', 'processing'] },
          },
          _sum: { amount: true },
        })

        const lockedAvailable = Number(lockedUser?.totalAmount || 0) - Number(lockedPending._sum.amount || 0)

        if (amount > lockedAvailable) {
          throw AppError.badRequest(
            `Insufficient balance. Available: ₦${lockedAvailable.toLocaleString()}`
          )
        }

        // Debit balance immediately
        await tx.user.update({
          where: { id: userId },
          data: { totalAmount: { decrement: amount } },
        })

        return tx.withdrawal.create({
          data: {
            userId,
            amount,
            bankCode,
            bankName,
            accountNumber,
            accountName: user.displayName,
            reference,
            status: 'pending',
          },
        })
      })

      // Initiate disbursement
      try {
        const disbursement = await initiateDisbursement({
          amount,
          bankCode,
          accountNumber,
          accountName: user.displayName,
          reference,
          narration: 'TipFY Withdrawal',
        })

        if (disbursement.requestSuccessful) {
          await db.withdrawal.update({
            where: { id: withdrawal.id },
            data: {
              status: 'processing',
              monnifyResponse: disbursement as any,
            },
          })
          await notifyWithdrawalCompleted(userId, amount)
        } else {
          // Refund balance on failure
          await db.user.update({
            where: { id: userId },
            data: { totalAmount: { increment: amount } },
          })

          await db.withdrawal.update({
            where: { id: withdrawal.id },
            data: {
              status: 'failed',
              failureReason: disbursement.responseMessage,
            },
          })
          await notifyWithdrawalFailed(userId, amount, disbursement.responseMessage)
        }
      } catch (err) {
        // Refund balance on service error
        await db.user.update({
          where: { id: userId },
          data: { totalAmount: { increment: amount } },
        })

        await db.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: 'failed',
            failureReason: err instanceof Error ? err.message : 'Disbursement service error',
          },
        })

        await notifyWithdrawalFailed(userId, amount, 'Disbursement service unavailable')
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
            status: withdrawal.status,
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
      const withdrawal = await db.withdrawal.findFirst({
        where: { reference: eventData?.reference },
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
      const withdrawal = await db.withdrawal.findFirst({
        where: { reference: eventData?.reference },
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
