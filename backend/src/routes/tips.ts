import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { tipSchema, feedbackSchema } from '~/lib/validations'
import { validate } from '~/middleware/validate'
import { authenticate, optionalAuth } from '~/middleware/auth'
import { tipRateLimit } from '~/middleware/rateLimit'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import {
  initializePayment,
  type MonnifyWebhookPayload,
} from '~/services/monnify'
import { verifyWebhookSignature } from '~/services/monnify'
import { notifyTipReceived, notifyTipFailed, notifyFeedbackReceived } from '~/services/notifications'
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
        select: { id: true, displayName: true, email: true, isActive: true },
      })

      if (!recipient || !recipient.isActive) {
        throw AppError.notFound('Recipient not found')
      }

      const reference = `TF-${uuid().slice(0, 8).toUpperCase()}`
      const senderId = req.user?.userId || null

      if (senderId === recipientId) {
        throw AppError.badRequest('Cannot tip yourself')
      }

      const tip = await db.tip.create({
        data: {
          reference,
          senderId,
          senderName: isAnonymous ? null : senderName || null,
          recipientId,
          amount,
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
          amount,
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

// Get tips for current user (convenience route)
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    const status = req.query.status as string | undefined

    const where: any = { recipientId: userId, status: { not: 'failed' } }

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
        _sum: { amount: true },
      }),
      db.tip.aggregate({
        where: {
          recipientId: userId,
          status: 'completed',
          completedAt: { gte: todayStart },
        },
        _sum: { amount: true },
      }),
      db.tip.aggregate({
        where: {
          recipientId: userId,
          status: 'completed',
          completedAt: { gte: weekStart },
        },
        _sum: { amount: true },
      }),
      db.tip.aggregate({
        where: {
          recipientId: userId,
          status: 'completed',
          completedAt: { gte: monthStart },
        },
        _sum: { amount: true },
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
        _sum: { amount: true },
      }),
    ])

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { rating: true },
    })

    const weekAmount = Number(weekStats._sum.amount || 0)
    const prevWeekAmount = Number(prevWeekStats._sum.amount || 0)
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
        totalAmount: Number(totalStats._sum.amount || 0),
        todayAmount: Number(todayStats._sum.amount || 0),
        weekAmount,
        monthAmount: Number(monthStats._sum.amount || 0),
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
          _sum: { amount: true },
        }),
        db.tip.aggregate({
          where: {
            recipientId: userId,
            status: 'completed',
            completedAt: { gte: todayStart },
          },
          _sum: { amount: true },
        }),
        db.tip.aggregate({
          where: {
            recipientId: userId,
            status: 'completed',
            completedAt: { gte: weekStart },
          },
          _sum: { amount: true },
        }),
        db.tip.aggregate({
          where: {
            recipientId: userId,
            status: 'completed',
            completedAt: { gte: monthStart },
          },
          _sum: { amount: true },
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
          _sum: { amount: true },
        }),
      ])

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { rating: true },
      })

      const weekAmount = Number(weekStats._sum.amount || 0)
      const prevWeekAmount = Number(prevWeekStats._sum.amount || 0)
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
          totalAmount: Number(totalStats._sum.amount || 0),
          todayAmount: Number(todayStats._sum.amount || 0),
          weekAmount,
          monthAmount: Number(monthStats._sum.amount || 0),
          averageRating: Number(user?.rating || 0),
          growthPercent,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

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
          where: { reference: eventData.transactionReference },
        })

        if (tip && tip.status === 'pending') {
          await db.$transaction([
            db.tip.update({
              where: { id: tip.id },
              data: {
                status: 'completed',
                paymentMethod: eventData.paymentMethod,
                monnifyReference: eventData.transactionReference,
                completedAt: new Date(),
              },
            }),
            db.transaction.create({
              data: {
                tipId: tip.id,
                amount: tip.amount,
                currency: tip.currency,
                paymentMethod: eventData.paymentMethod,
                monnifyResponse: eventData as any,
                status: 'completed',
                completedAt: new Date(),
              },
            }),
            db.user.update({
              where: { id: tip.recipientId },
              data: {
                totalTipsReceived: { increment: 1 },
                totalAmount: { increment: tip.amount },
              },
            }),
          ])

          await logAuditEvent({
            action: AuditActions.TIP_COMPLETE,
            resource: 'tip',
            resourceId: tip.id,
            metadata: { amount: Number(tip.amount) },
          })

          // Create notification for recipient
          const sender = tip.senderId
            ? await db.user.findUnique({ where: { id: tip.senderId }, select: { displayName: true } })
            : null
          await notifyTipReceived(
            tip.recipientId,
            sender?.displayName || 'Anonymous',
            Number(tip.amount),
            tip.message,
          )
        }
      }

      if (eventType === 'FAILED_TRANSACTION') {
        const tip = await db.tip.findFirst({
          where: { reference: eventData.transactionReference },
        })

        if (tip && tip.status === 'pending') {
          await db.tip.update({
            where: { id: tip.id },
            data: { status: 'failed' },
          })

          await notifyTipFailed(tip.recipientId, Number(tip.amount))

          await logAuditEvent({
            action: AuditActions.TIP_FAIL,
            resource: 'tip',
            resourceId: tip.id,
          })
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
  optionalAuth,
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

      const existing = await db.feedback.findUnique({
        where: { tipId: tip.id },
      })

      if (existing) {
        throw AppError.badRequest('Feedback already submitted for this tip')
      }

      const feedback = await db.feedback.create({
        data: {
          tipId: tip.id,
          senderId: req.user?.userId || null,
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
