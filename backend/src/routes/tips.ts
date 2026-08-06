import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { tipSchema, feedbackSchema, tipFeeQuoteSchema } from '~/lib/validations'
import { validate } from '~/middleware/validate'
import { authenticate, optionalAuth } from '~/middleware/auth'
import { tipRateLimit, feesRateLimit } from '~/middleware/rateLimit'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import {
  initializePayment,
  verifyTransaction,
  type MonnifyWebhookPayload,
} from '~/services/monnify'
import { verifyWebhookSignature } from '~/services/monnify'
import { notifyTipReceived, notifyTipFailed, notifyFeedbackReceived } from '~/services/notifications'
import { computeTipFees } from '~/lib/fees'
import { getEnv } from '~/config/env'

const router = Router()

// Create a new tip
router.post(
  '/',
  optionalAuth,
  tipRateLimit,
  validate(tipSchema),
  async (req, res, next) => {
    try {
      const { recipientId, amount, message, isAnonymous, senderName, senderEmail, category } =
        req.body

      const recipient = await db.user.findUnique({
        where: { id: recipientId },
        select: { id: true, displayName: true, email: true, isActive: true, plan: true, planExpiresAt: true },
      })

      if (!recipient || !recipient.isActive) {
        throw AppError.notFound('Recipient not found')
      }

      const reference = `TF-${uuid().slice(0, 8).toUpperCase()}`
      const senderId = req.user?.userId || null

      if (senderId === recipientId) {
        throw AppError.badRequest('Cannot tip yourself')
      }

      // Fee breakdown: the tipper pays amount + processing fee; the recipient
      // is credited amount minus TipFY's commission.
      const fees = computeTipFees(amount, recipient.plan, recipient.planExpiresAt)

      const tip = await db.tip.create({
        data: {
          reference,
          senderId,
          senderName: isAnonymous ? null : senderName || null,
          recipientId,
          amount,
          platformFee: fees.platformFee,
          processingFee: fees.processingFee,
          netAmount: fees.netToRecipient,
          totalCharged: fees.totalCharge,
          message: message || null,
          category: category || 'general',
          isAnonymous: isAnonymous || false,
          status: 'pending',
        },
      })

      const env = getEnv()
      if (!env.MONNIFY_CONTRACT_CODE) {
        throw AppError.internal('MONNIFY_CONTRACT_CODE is not configured. Get it from your Monnify dashboard.')
      }

      const redirectUrl = `${env.FRONTEND_URL}/tip/payment-complete?ref=${reference}`

      let paymentResponse: Awaited<ReturnType<typeof initializePayment>>
      try {
        paymentResponse = await initializePayment({
          amount: fees.totalCharge,
          customerName: isAnonymous ? 'Anonymous' : senderName || 'TipFY User',
          customerEmail: senderEmail || `tip-${reference.toLowerCase()}@tipfy.app`,
          transactionReference: reference,
          paymentDescription: `Tip to ${recipient.displayName}`,
          redirectUrl,
          metadata: {
            tipId: tip.id,
            recipientId,
            senderId: senderId || '',
          },
        })
      } catch (err) {
        console.error('[TIP] Monnify error:', err)
        await db.tip.update({ where: { id: tip.id }, data: { status: 'failed' } })
        throw AppError.internal('Payment gateway error: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }

      if (!paymentResponse.requestSuccessful) {
        console.error('[TIP] Monnify init failed:', paymentResponse.responseMessage, paymentResponse.responseCode)
        await db.tip.update({
          where: { id: tip.id },
          data: { status: 'failed' },
        })
        throw AppError.badRequest('Payment initialization failed: ' + paymentResponse.responseMessage)
      }

      await logAuditEvent({
        userId: senderId || undefined,
        action: AuditActions.TIP_CREATE,
        resource: 'tip',
        resourceId: tip.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { amount, recipientId },
      })

      res.status(201).json({
        success: true,
        data: {
          tip: {
            id: tip.id,
            reference: tip.reference,
            amount: tip.amount,
            status: tip.status,
          },
          fees: {
            amount: fees.amount,
            processingFee: fees.processingFee,
            totalCharge: fees.totalCharge,
            platformFee: fees.platformFee,
            netToRecipient: fees.netToRecipient,
          },
          checkoutUrl: paymentResponse.responseBody?.checkoutUrl || null,
          monnifyReference:
            paymentResponse.responseBody?.transactionReference || null,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Live fee quote so the checkout breakdown never drifts from the real formula.
router.get('/fees', feesRateLimit, validate(tipFeeQuoteSchema, 'query'), async (req, res, next) => {
  try {
    const { recipientId, amount } = req.query as unknown as { recipientId: string; amount: number }

    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { plan: true, planExpiresAt: true },
    })
    if (!recipient) throw AppError.notFound('Recipient not found')

    res.json({
      success: true,
      data: { fees: computeTipFees(Number(amount), recipient.plan, recipient.planExpiresAt) },
    })
  } catch (error) {
    next(error)
  }
})

// Get tips for current user (convenience route)
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    const status = req.query.status as string | undefined

    const where: any = { recipientId: userId, status: { notIn: ['failed', 'expired'] } }

    const [tips, total] = await Promise.all([
      db.tip.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          reference: true,
          senderId: true,
          senderName: true,
          recipientId: true,
          amount: true,
          platformFee: true,
          processingFee: true,
          netAmount: true,
          totalCharged: true,
          message: true,
          category: true,
          isAnonymous: true,
          status: true,
          completedAt: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              username: true,
            },
          },
          feedback: {
            select: { rating: true, comment: true },
          },
        },
      }),
      db.tip.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        tips: tips.map((tip: any) => ({
          ...tip,
          sender: tip.isAnonymous ? null : (tip.sender || (tip.senderName ? { displayName: tip.senderName } : null)),
          amount: Number(tip.amount),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// Get tip stats for current user (convenience route)
router.get('/stats/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalStats,
      todayStats,
      weekStats,
      monthStats,
      prevWeekStats,
    ] = await Promise.all([
      db.tip.aggregate({
        where: { recipientId: userId, status: 'completed' },
        _count: true,
        _sum: { netAmount: true },
      }),
      db.tip.aggregate({
        where: {
          recipientId: userId,
          status: 'completed',
          completedAt: { gte: todayStart },
        },
        _sum: { netAmount: true },
      }),
      db.tip.aggregate({
        where: {
          recipientId: userId,
          status: 'completed',
          completedAt: { gte: weekStart },
        },
        _sum: { netAmount: true },
      }),
      db.tip.aggregate({
        where: {
          recipientId: userId,
          status: 'completed',
          completedAt: { gte: monthStart },
        },
        _sum: { netAmount: true },
      }),
      db.tip.aggregate({
        where: {
          recipientId: userId,
          status: 'completed',
          completedAt: {
            gte: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: weekStart,
          },
        },
        _sum: { netAmount: true },
      }),
    ])

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { rating: true },
    })

    const weekAmount = Number(weekStats._sum.netAmount || 0)
    const prevWeekAmount = Number(prevWeekStats._sum.netAmount || 0)
    const growthPercent =
      prevWeekAmount > 0
        ? Math.round(((weekAmount - prevWeekAmount) / prevWeekAmount) * 100)
        : weekAmount > 0
        ? 100
        : 0

    res.json({
      success: true,
      data: {
        totalTips: totalStats._count,
        totalAmount: Number(totalStats._sum.netAmount || 0),
        todayAmount: Number(todayStats._sum.netAmount || 0),
        weekAmount,
        monthAmount: Number(monthStats._sum.netAmount || 0),
        averageRating: Number(user?.rating || 0),
        growthPercent,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Get tips for a recipient (by userId param)
router.get(
  '/recipient/:userId',
  authenticate,
  async (req, res, next) => {
    try {
      const { userId } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
      const status = req.query.status as string | undefined

      if (req.user!.userId !== userId) {
        throw AppError.forbidden('Access denied')
      }

      const where: any = { recipientId: userId }
      if (status) where.status = status

      const [tips, total] = await Promise.all([
        db.tip.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            reference: true,
            senderId: true,
            senderName: true,
            recipientId: true,
            amount: true,
            platformFee: true,
            processingFee: true,
            netAmount: true,
            totalCharged: true,
            message: true,
            isAnonymous: true,
            status: true,
            completedAt: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                username: true,
              },
            },
            feedback: {
              select: { rating: true, comment: true },
            },
          },
        }),
        db.tip.count({ where }),
      ])

      res.json({
        success: true,
        data: {
          tips: tips.map((tip: any) => ({
            ...tip,
            sender: tip.isAnonymous ? null : (tip.sender || (tip.senderName ? { displayName: tip.senderName } : null)),
            amount: Number(tip.amount),
            platformFee: Number(tip.platformFee || 0),
            processingFee: Number(tip.processingFee || 0),
            netAmount: Number(tip.netAmount || 0),
            totalCharged: Number(tip.totalCharged || 0),
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get tip stats for a user
router.get(
  '/stats/:userId',
  authenticate,
  async (req, res, next) => {
    try {
      const { userId } = req.params

      if (req.user!.userId !== userId) {
        throw AppError.forbidden('Access denied')
      }

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - 7)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const [
        totalStats,
        todayStats,
        weekStats,
        monthStats,
        prevWeekStats,
      ] = await Promise.all([
        db.tip.aggregate({
          where: { recipientId: userId, status: 'completed' },
          _count: true,
          _sum: { netAmount: true },
        }),
        db.tip.aggregate({
          where: {
            recipientId: userId,
            status: 'completed',
            completedAt: { gte: todayStart },
          },
          _sum: { netAmount: true },
        }),
        db.tip.aggregate({
          where: {
            recipientId: userId,
            status: 'completed',
            completedAt: { gte: weekStart },
          },
          _sum: { netAmount: true },
        }),
        db.tip.aggregate({
          where: {
            recipientId: userId,
            status: 'completed',
            completedAt: { gte: monthStart },
          },
          _sum: { netAmount: true },
        }),
        db.tip.aggregate({
          where: {
            recipientId: userId,
            status: 'completed',
            completedAt: {
              gte: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
              lt: weekStart,
            },
          },
          _sum: { netAmount: true },
        }),
      ])

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { rating: true },
      })

      const weekAmount = Number(weekStats._sum.netAmount || 0)
      const prevWeekAmount = Number(prevWeekStats._sum.netAmount || 0)
      const growthPercent =
        prevWeekAmount > 0
          ? Math.round(((weekAmount - prevWeekAmount) / prevWeekAmount) * 100)
          : weekAmount > 0
          ? 100
          : 0

      res.json({
        success: true,
        data: {
          totalTips: totalStats._count,
          totalAmount: Number(totalStats._sum.netAmount || 0),
          todayAmount: Number(todayStats._sum.netAmount || 0),
          weekAmount,
          monthAmount: Number(monthStats._sum.netAmount || 0),
          averageRating: Number(user?.rating || 0),
          growthPercent,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// ─── Shared payment completion helpers ─────────────────────────
// Used by both the Monnify webhook and the manual verify route so
// a tip is completed exactly once regardless of which path fires.

// Completes a tip atomically. The `status: 'pending'` guard lives INSIDE
// the transaction (via updateMany) so concurrent webhook + verify requests
// can't both pass the check and double-credit the recipient.
// Returns true if this call performed the completion, false if it was a no-op
// (tip was already completed/failed by a racing request).
async function completeTip(tip: any, paymentMethod: string, monnifyReference: string): Promise<boolean> {
  const applied = await db.$transaction(async (tx) => {
    const claim = await tx.tip.updateMany({
      where: { id: tip.id, status: 'pending' },
      data: {
        status: 'completed',
        paymentMethod,
        monnifyReference,
        completedAt: new Date(),
      },
    })

    if (claim.count === 0) return false

    const netCredit = Number(tip.amount) - Number(tip.platformFee || 0)

    await tx.transaction.create({
      data: {
        tipId: tip.id,
        amount: tip.totalCharged,
        currency: tip.currency,
        paymentMethod,
        monnifyResponse: {
          monnifyReference,
          platformFee: Number(tip.platformFee || 0),
          processingFee: Number(tip.processingFee || 0),
          netAmount: netCredit,
        } as any,
        status: 'completed',
        completedAt: new Date(),
      },
    })

    await tx.user.update({
      where: { id: tip.recipientId },
      data: {
        totalTipsReceived: { increment: 1 },
        totalAmount: { increment: netCredit },
      },
    })

    return true
  })

  if (!applied) return false

  await logAuditEvent({
    action: AuditActions.TIP_COMPLETE,
    resource: 'tip',
    resourceId: tip.id,
    metadata: { amount: Number(tip.amount) },
  })

  const sender = tip.senderId
    ? await db.user.findUnique({ where: { id: tip.senderId }, select: { displayName: true } })
    : null
  await notifyTipReceived(
    tip.recipientId,
    sender?.displayName || 'Anonymous',
    Number(tip.amount),
    tip.message,
  )

  return true
}

// Marks a tip failed atomically — same concurrency-safe guard as completeTip.
async function failTip(tip: any): Promise<boolean> {
  const applied = await db.tip.updateMany({
    where: { id: tip.id, status: 'pending' },
    data: { status: 'failed' },
  })

  if (applied.count === 0) return false

  await notifyTipFailed(tip.recipientId, Number(tip.amount))
  await logAuditEvent({
    action: AuditActions.TIP_FAIL,
    resource: 'tip',
    resourceId: tip.id,
  })

  return true
}

// Verify a tip's payment status against Monnify.
// Reliable fallback when the webhook is delayed or never delivered
// (e.g. sandbox mode pointing at localhost).
router.get('/:tipReference/verify', tipRateLimit, async (req, res, next) => {
  try {
    const tipReference = req.params.tipReference as string

    const tip = await db.tip.findFirst({
      where: { reference: tipReference },
      select: {
        id: true,
        reference: true,
        amount: true,
        platformFee: true,
        processingFee: true,
        netAmount: true,
        totalCharged: true,
        status: true,
        recipientId: true,
        senderId: true,
        message: true,
        currency: true,
        recipient: { select: { displayName: true } },
      },
    })
    if (!tip) throw AppError.notFound('Tip not found')

    const tipSummary = {
      amount: Number(tip.amount),
      platformFee: Number(tip.platformFee || 0),
      processingFee: Number(tip.processingFee || 0),
      netAmount: Number(tip.netAmount || 0),
      totalCharged: Number(tip.totalCharged || 0),
      recipientName: tip.recipient.displayName,
    }

    if (tip.status === 'completed') {
      return res.json({ success: true, data: { status: tip.status, tip: tipSummary } })
    }

    if (tip.status === 'failed') {
      return res.json({ success: true, data: { status: tip.status, tip: tipSummary } })
    }

    // Tip is still pending — check Monnify directly
    const verification = await verifyTransaction(tipReference)

    const paymentStatus = verification.responseBody?.paymentStatus
    const paymentReference = verification.responseBody?.paymentReference || tipReference

    if (verification.requestSuccessful && paymentStatus === 'PAID') {
      if (tip.status === 'pending') {
        await completeTip(tip, verification.responseBody?.paymentMethod || 'CARD', paymentReference)
      }
      return res.json({ success: true, data: { status: 'completed', tip: tipSummary } })
    }

    if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') {
      if (tip.status === 'pending') await failTip(tip)
      return res.json({ success: true, data: { status: 'failed', tip: tipSummary } })
    }

    // Still not paid / not confirmed — leave as pending
    return res.json({ success: true, data: { status: tip.status, tip: tipSummary } })
  } catch (error) {
    next(error)
  }
})

// Webhook handler for Monnify
router.post(
  '/webhook',
  async (req, res, next) => {
    try {
      const signature = req.headers['monnify-signature'] as string
      const rawBody = (req as any).rawBody || JSON.stringify(req.body)

      if (!verifyWebhookSignature(rawBody, signature)) {
        throw AppError.badRequest('Invalid webhook signature')
      }

      const payload: MonnifyWebhookPayload = req.body
      const { eventType, eventData } = payload

      await logAuditEvent({
        action: AuditActions.PAYMENT_WEBHOOK,
        resource: 'payment',
        resourceId: eventData.transactionReference,
        ipAddress: req.ip,
        metadata: { eventType, paymentStatus: eventData.paymentStatus },
      })

      if (eventType === 'SUCCESSFUL_TRANSACTION') {
        const tip = await db.tip.findFirst({
          where: {
            OR: [
              { reference: eventData.paymentReference },
              { monnifyReference: eventData.transactionReference },
            ],
          },
        })

        if (tip && tip.status === 'pending') {
          await completeTip(tip, eventData.paymentMethod, eventData.transactionReference)
        }
      }

      if (eventType === 'FAILED_TRANSACTION') {
        const tip = await db.tip.findFirst({
          where: {
            OR: [
              { reference: eventData.paymentReference },
              { monnifyReference: eventData.transactionReference },
            ],
          },
        })

        if (tip && tip.status === 'pending') {
          await failTip(tip)
        }
      }

      res.json({ success: true })
    } catch (error) {
      next(error)
    }
  }
)

// Submit feedback for a tip
router.post(
  '/:tipReference/feedback',
  authenticate,
  validate(feedbackSchema),
  async (req, res, next) => {
    try {
      const tipReference = req.params.tipReference as string
      const { rating, comment } = req.body

      const tip = await db.tip.findFirst({
        where: { reference: tipReference, status: 'completed' },
        select: { id: true, recipientId: true, senderId: true },
      })

      if (!tip) {
        throw AppError.notFound('Tip not found or not completed')
      }

      // Only the person who sent the tip may rate the recipient. This also
      // stops strangers from rewriting a recipient's public rating.
      if (!tip.senderId || tip.senderId !== req.user?.userId) {
        throw AppError.forbidden('Only the sender of a tip can leave feedback')
      }

      const existing = await db.feedback.findUnique({
        where: { tipId: tip.id },
      })

      if (existing) {
        throw AppError.badRequest('Feedback already submitted for this tip')
      }

      const feedback = await db.feedback.create({
        data: {
          tipId: tip.id,
          senderId: req.user.userId,
          recipientId: tip.recipientId,
          rating,
          comment: comment || null,
        },
      })

      // Recalculate average rating for the recipient
      const agg = await db.feedback.aggregate({
        where: { recipientId: tip.recipientId },
        _avg: { rating: true },
      })

      await db.user.update({
        where: { id: tip.recipientId },
        data: { rating: Number(agg._avg.rating || 0) },
      })

      await notifyFeedbackReceived(tip.recipientId, rating)

      await logAuditEvent({
        userId: req.user?.userId || undefined,
        action: 'tip.feedback',
        resource: 'feedback',
        resourceId: feedback.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { tipId: tip.id, rating },
      })

      res.status(201).json({ success: true, data: { feedback: { id: feedback.id, rating: feedback.rating } } })
    } catch (error) {
      next(error)
    }
  }
)

export default router
