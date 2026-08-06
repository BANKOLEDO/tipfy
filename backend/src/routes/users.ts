import { Router } from 'express'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { profileSchema } from '~/lib/validations'
import { validate } from '~/middleware/validate'
import { authenticate, optionalAuth } from '~/middleware/auth'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { getPlatformFeeRate } from '~/lib/fees'

const router = Router()

// Check username availability
router.get(
  '/check/:username',
  async (req, res, next) => {
    try {
      const username = req.params.username as string
      const exists = await db.user.findUnique({
        where: { username },
        select: { id: true },
      })

      res.json({
        success: true,
        data: { available: !exists },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get public profile by username
router.get(
  '/:username',
  optionalAuth,
  async (req, res, next) => {
    try {
      const { username } = req.params as { username: string }

      const user = await db.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          location: true,
          isBusiness: true,
          businessName: true,
          businessCategory: true,
          totalTipsReceived: true,
          totalAmount: true,
          rating: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          plan: true,
          planExpiresAt: true,
        },
      })

      if (!user || !user.isActive) {
        throw AppError.notFound('User not found')
      }

      const { plan, planExpiresAt, ...publicUser } = user
      const platformFeePercent = getPlatformFeeRate(plan, planExpiresAt)

      const recentTips = await db.tip.findMany({
        where: {
          recipientId: user.id,
          status: 'completed',
          isAnonymous: false,
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          message: true,
          createdAt: true,
          sender: {
            select: {
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      })

      res.json({
        success: true,
        data: {
          user: { ...publicUser, platformFeePercent },
          recentTips: recentTips.map((tip) => ({
            ...tip,
            amount: Number(tip.amount),
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Update profile
router.put(
  '/profile',
  authenticate,
  validate(profileSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const { displayName, username, bio, location, isBusiness, businessName, businessCategory } =
        req.body

      // Check username uniqueness if changing
      if (username) {
        const existing = await db.user.findFirst({
          where: { username, id: { not: userId } },
          select: { id: true },
        })
        if (existing) {
          throw AppError.conflict('Username already taken')
        }
      }

      const updated = await db.user.update({
        where: { id: userId },
        data: {
          ...(displayName && { displayName }),
          ...(username && { username }),
          ...(bio !== undefined && { bio: bio || null }),
          ...(location !== undefined && { location: location || null }),
          ...(isBusiness !== undefined && { isBusiness }),
          ...(businessName !== undefined && {
            businessName: businessName || null,
          }),
          ...(businessCategory !== undefined && {
            businessCategory: businessCategory || null,
          }),
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          location: true,
          isBusiness: true,
          businessName: true,
          businessCategory: true,
        },
      })

      await logAuditEvent({
        userId,
        action: AuditActions.USER_UPDATE,
        resource: 'user',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.json({ success: true, data: { user: updated } })
    } catch (error) {
      next(error)
    }
  }
)

export default router
