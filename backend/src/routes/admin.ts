import { Router } from 'express'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { requireAdmin, requireSuperAdmin } from '~/middleware/admin'
import { validate } from '~/middleware/validate'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { updateTipSchema, withdrawalAdminActionSchema } from '~/lib/validations'
import { notifyWithdrawalFailed } from '~/services/notifications'

const router = Router()

// All admin routes require admin or support role
router.use(requireAdmin)

// ─── Dashboard Stats ───────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsersToday,
      newUsers7d,
      totalTips,
      tipsToday,
      tips7d,
      totalTipVolume,
      tipVolumeToday,
      totalWithdrawals,
      pendingWithdrawals,
      processingWithdrawals,
      failedWithdrawals,
      activeUsers,
      platformFees,
      withdrawalFees,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: yesterday } } }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.tip.count(),
      db.tip.count({ where: { createdAt: { gte: yesterday } } }),
      db.tip.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.tip.aggregate({ where: { status: 'completed' }, _sum: { amount: true } }),
      db.tip.aggregate({ where: { status: 'completed', createdAt: { gte: yesterday } }, _sum: { amount: true } }),
      db.withdrawal.count(),
      db.withdrawal.count({ where: { status: 'pending' } }),
      db.withdrawal.count({ where: { status: 'processing' } }),
      db.withdrawal.count({ where: { status: 'failed' } }),
      db.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
      db.tip.aggregate({ where: { status: 'completed' }, _sum: { platformFee: true } }),
      db.withdrawal.aggregate({ where: { status: { in: ['completed', 'processing'] } }, _sum: { fee: true } }),
    ])

    const totalRevenue = Number(totalTipVolume._sum.amount || 0)
    const revenueToday = Number(tipVolumeToday._sum.amount || 0)
    const platformRevenue = Number(platformFees._sum.platformFee || 0)
    const withdrawalRevenue = Number(withdrawalFees._sum.fee || 0)

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, newToday: newUsersToday, new7d: newUsers7d, active7d: activeUsers },
        tips: { total: totalTips, today: tipsToday, new7d: tips7d, totalVolume: totalRevenue, volumeToday: revenueToday },
        withdrawals: { total: totalWithdrawals, pending: pendingWithdrawals, processing: processingWithdrawals, failed: failedWithdrawals },
        revenue: { platform: platformRevenue, withdrawalFees: withdrawalRevenue, total: platformRevenue + withdrawalRevenue },
      },
    })
  } catch (error) {
    next(error)
  }
})

// ─── Revenue Chart Data (daily for last 30 days) ──────────────
router.get('/stats/revenue', async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const tips = await db.tip.findMany({
      where: { status: 'completed', createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group by day
    const daily: Record<string, { revenue: number; count: number }> = {}
    for (const tip of tips) {
      const day = tip.createdAt.toISOString().split('T')[0]
      if (!daily[day]) daily[day] = { revenue: 0, count: 0 }
      daily[day].revenue += Number(tip.amount)
      daily[day].count += 1
    }

    // Fill in missing days
    const chart = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      chart.push({ date: key, revenue: daily[key]?.revenue || 0, tips: daily[key]?.count || 0 })
    }

    res.json({ success: true, data: chart })
  } catch (error) {
    next(error)
  }
})

// ─── User Growth Chart Data ────────────────────────────────────
router.get('/stats/users', async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const users = await db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const daily: Record<string, number> = {}
    for (const u of users) {
      const day = u.createdAt.toISOString().split('T')[0]
      daily[day] = (daily[day] || 0) + 1
    }

    const chart = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      chart.push({ date: key, users: daily[key] || 0 })
    }

    res.json({ success: true, data: chart })
  } catch (error) {
    next(error)
  }
})

// ─── Users Management ──────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20)
    const search = (req.query.search as string) || ''
    const role = req.query.role as string | undefined
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) where.role = role

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, email: true, username: true, displayName: true, role: true,
          isBusiness: true, businessName: true, isVerified: true, isActive: true,
          totalTipsReceived: true, totalAmount: true, rating: true,
          lastLoginAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      db.user.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        users: users.map(u => ({ ...u, totalAmount: Number(u.totalAmount), rating: Number(u.rating) })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    next(error)
  }
})

// Get single user detail
router.get('/users/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId as string

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, displayName: true, avatarUrl: true,
        bio: true, location: true, role: true, isBusiness: true, businessName: true,
        businessCategory: true, isVerified: true, isActive: true,
        totalTipsReceived: true, totalAmount: true, rating: true,
        lastLoginAt: true, createdAt: true,
      },
    })

    if (!user) throw AppError.notFound('User not found')

    const [tipsReceived, tipsSent, withdrawals, feedbackCount] = await Promise.all([
      db.tip.count({ where: { recipientId: userId } }),
      db.tip.count({ where: { senderId: userId } }),
      db.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      db.feedback.count({ where: { recipientId: userId } }),
    ])

    res.json({
      success: true,
      data: {
        user: { ...user, totalAmount: Number(user.totalAmount), rating: Number(user.rating) },
        stats: { tipsReceived, tipsSent, withdrawals: withdrawals.length, feedbackCount },
        recentWithdrawals: withdrawals.map(w => ({
          ...w,
          amount: Number(w.amount),
          accountNumber: w.accountNumber.slice(0, 3) + '****' + w.accountNumber.slice(-3),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Toggle user active status
router.post('/users/:userId/toggle-active', async (req, res, next) => {
  try {
    const userId = req.params.userId as string
    const adminId = req.user!.userId

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true, role: true } })
    if (!user) throw AppError.notFound('User not found')
    if (userId === adminId) throw AppError.badRequest('Cannot deactivate yourself')
    if (user.role === 'admin') throw AppError.badRequest('Cannot deactivate another admin')

    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    })

    await logAuditEvent({
      userId: adminId,
      action: user.isActive ? 'admin.user.deactivate' : 'admin.user.activate',
      resource: 'user',
      resourceId: userId,
      ipAddress: req.ip,
    })

    res.json({ success: true, data: { isActive: updated.isActive } })
  } catch (error) {
    next(error)
  }
})

// Change user role (super admin only)
router.post('/users/:userId/role', requireSuperAdmin, async (req, res, next) => {
  try {
    const userId = req.params.userId as string
    const { role } = req.body
    const adminId = req.user!.userId

    if (!['user', 'support', 'admin'].includes(role)) {
      throw AppError.badRequest('Invalid role. Must be: user, support, or admin')
    }

    if (userId === adminId) throw AppError.badRequest('Cannot change your own role')

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) throw AppError.notFound('User not found')

    await db.user.update({ where: { id: userId }, data: { role } })

    await logAuditEvent({
      userId: adminId,
      action: 'admin.user.role_change',
      resource: 'user',
      resourceId: userId,
      ipAddress: req.ip,
      metadata: { newRole: role },
    })

    res.json({ success: true, data: { role } })
  } catch (error) {
    next(error)
  }
})

// ─── Tips Monitoring ───────────────────────────────────────────
router.get('/tips', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20)
    const search = (req.query.search as string) || ''
    const status = req.query.status as string | undefined
    const category = req.query.category as string | undefined
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tips, total] = await Promise.all([
      db.tip.findMany({
        where,
        select: {
          id: true, reference: true, amount: true, status: true, category: true,
          platformFee: true, netAmount: true, totalCharged: true,
          senderName: true, message: true, isAnonymous: true,
          paymentMethod: true, completedAt: true, createdAt: true,
          recipient: { select: { id: true, username: true, displayName: true } },
          sender: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      db.tip.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        tips: tips.map(t => ({
          ...t,
          amount: Number(t.amount),
          platformFee: Number(t.platformFee || 0),
          netAmount: Number(t.netAmount || 0),
          totalCharged: Number(t.totalCharged || 0),
          recipientName: t.recipient?.displayName || 'Unknown',
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    next(error)
  }
})

// ─── Tip Admin Actions ─────────────────────────────────────────
// Update safe, non-monetary fields of a tip. Amounts and money fields
// are intentionally NOT editable — they reflect settled payments.
router.patch(
  '/tips/:tipId',
  validate(updateTipSchema),
  async (req, res, next) => {
    try {
      const tipId = req.params.tipId as string
      const { message, category, isAnonymous } = req.body

      const tip = await db.tip.findUnique({
        where: { id: tipId },
        select: { id: true },
      })
      if (!tip) throw AppError.notFound('Tip not found')

      const updated = await db.tip.update({
        where: { id: tipId },
        data: {
          ...(message !== undefined ? { message } : {}),
          ...(category !== undefined ? { category } : {}),
          ...(isAnonymous !== undefined ? { isAnonymous } : {}),
        },
        select: {
          id: true,
          reference: true,
          message: true,
          category: true,
          isAnonymous: true,
        },
      })

      await logAuditEvent({
        userId: req.user!.userId,
        action: AuditActions.ADMIN_TIP_UPDATE,
        resource: 'tip',
        resourceId: tipId,
        ipAddress: req.ip,
        metadata: req.body,
      })

      res.json({ success: true, data: { tip: updated } })
    } catch (error) {
      next(error)
    }
  }
)

// Delete a tip. For completed tips the recipient was already credited,
// so the ledger (balance + tip count + transaction record) is reversed
// in the same transaction to keep accounting consistent.
router.delete('/tips/:tipId', async (req, res, next) => {
  try {
    const tipId = req.params.tipId as string

    const tip = await db.tip.findUnique({
      where: { id: tipId },
      select: {
        id: true,
        reference: true,
        status: true,
        amount: true,
        platformFee: true,
        recipientId: true,
      },
    })
    if (!tip) throw AppError.notFound('Tip not found')

    if (tip.status === 'completed') {
      const netCredit = Number(tip.amount) - Number(tip.platformFee || 0)

      await db.$transaction(async (tx) => {
        const recipient = await tx.user.findUnique({
          where: { id: tip.recipientId },
          select: { totalAmount: true, totalTipsReceived: true },
        })

        if (recipient) {
          const newBalance = Math.max(
            0,
            Number(recipient.totalAmount) - netCredit
          )
          await tx.user.update({
            where: { id: tip.recipientId },
            data: {
              totalAmount: newBalance,
              totalTipsReceived: Math.max(0, recipient.totalTipsReceived - 1),
            },
          })
        }

        await tx.transaction.deleteMany({ where: { tipId } })
        await tx.feedback.deleteMany({ where: { tipId } })
        await tx.tip.delete({ where: { id: tipId } })
      })
    } else {
      await db.$transaction(async (tx) => {
        await tx.feedback.deleteMany({ where: { tipId } })
        await tx.tip.delete({ where: { id: tipId } })
      })
    }

    await logAuditEvent({
      userId: req.user!.userId,
      action: AuditActions.ADMIN_TIP_DELETE,
      resource: 'tip',
      resourceId: tipId,
      ipAddress: req.ip,
      metadata: { reference: tip.reference, status: tip.status },
    })

    res.json({ success: true, data: { message: 'Tip deleted' } })
  } catch (error) {
    next(error)
  }
})

// ─── Withdrawals Monitoring ────────────────────────────────────
router.get('/withdrawals', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20)
    const search = (req.query.search as string) || ''
    const status = req.query.status as string | undefined
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search } },
        { bankName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [withdrawals, total] = await Promise.all([
      db.withdrawal.findMany({
        where,
        select: {
          id: true, amount: true, fee: true, netAmount: true, estimatedTax: true,
          bankCode: true, bankName: true,
          accountNumber: true, accountName: true, reference: true,
          status: true, failureReason: true, processedAt: true, createdAt: true,
          user: { select: { id: true, username: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      db.withdrawal.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        withdrawals: withdrawals.map(w => ({
          ...w,
          amount: Number(w.amount),
          fee: Number(w.fee || 0),
          netAmount: Number(w.netAmount || 0),
          estimatedTax: Number(w.estimatedTax || 0),
          accountNumber: w.accountNumber.slice(0, 3) + '****' + w.accountNumber.slice(-3),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    next(error)
  }
})

// ─── Withdrawal Admin Actions ──────────────────────────────────
// Cancel a withdrawal that has never left the platform (status
// 'pending') and refund the debited balance. Withdrawals that are
// 'processing' are refused — their final state must come from Monnify
// (webhook or staleness reaper) to avoid double-paying a payout.
router.post(
  '/withdrawals/:withdrawalId/cancel',
  validate(withdrawalAdminActionSchema),
  async (req, res, next) => {
    try {
      const withdrawalId = req.params.withdrawalId as string
      const { reason } = req.body

      const withdrawal = await db.withdrawal.findUnique({
        where: { id: withdrawalId },
        select: { id: true, reference: true, status: true, amount: true, userId: true },
      })
      if (!withdrawal) throw AppError.notFound('Withdrawal not found')

      if (withdrawal.status === 'processing') {
        throw AppError.conflict(
          'This withdrawal is in flight. Its status must be resolved with Monnify before it can be cancelled.'
        )
      }
      if (withdrawal.status !== 'pending') {
        throw AppError.conflict(
          `Only pending withdrawals can be cancelled (current status: ${withdrawal.status})`
        )
      }

      // Atomically claim the cancellation; refund only if this call won.
      const refunded = await db.$transaction(async (tx) => {
        const claim = await tx.withdrawal.updateMany({
          where: { id: withdrawalId, status: 'pending' },
          data: {
            status: 'failed',
            failureReason: reason || 'Cancelled by admin',
          },
        })

        if (claim.count === 0) return false

        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { totalAmount: { increment: withdrawal.amount } },
        })
        return true
      })

      if (!refunded) {
        throw AppError.conflict('Withdrawal has already been processed')
      }

      await notifyWithdrawalFailed(
        withdrawal.userId,
        Number(withdrawal.amount),
        reason || 'Your withdrawal request was cancelled by support'
      )

      await logAuditEvent({
        userId: req.user!.userId,
        action: AuditActions.ADMIN_WITHDRAWAL_CANCEL,
        resource: 'withdrawal',
        resourceId: withdrawalId,
        ipAddress: req.ip,
        metadata: { reference: withdrawal.reference, reason },
      })

      res.json({
        success: true,
        data: {
          message: 'Withdrawal cancelled and balance refunded',
          refunded: Number(withdrawal.amount),
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Remove a failed withdrawal record (used to clean up junk entries).
// Only 'failed' withdrawals can be deleted — money is already refunded
// or was never disbursed, so no ledger changes are needed.
router.delete('/withdrawals/:withdrawalId', async (req, res, next) => {
  try {
    const withdrawalId = req.params.withdrawalId as string

    const withdrawal = await db.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: { id: true, reference: true, status: true },
    })
    if (!withdrawal) throw AppError.notFound('Withdrawal not found')

    if (withdrawal.status !== 'failed') {
      throw AppError.conflict(
        `Only failed withdrawals can be deleted (current status: ${withdrawal.status})`
      )
    }

    await db.withdrawal.delete({ where: { id: withdrawalId } })

    await logAuditEvent({
      userId: req.user!.userId,
      action: AuditActions.ADMIN_WITHDRAWAL_DELETE,
      resource: 'withdrawal',
      resourceId: withdrawalId,
      ipAddress: req.ip,
      metadata: { reference: withdrawal.reference },
    })

    res.json({ success: true, data: { message: 'Withdrawal record deleted' } })
  } catch (error) {
    next(error)
  }
})

// ─── Fraud Detection ───────────────────────────────────────────
router.get('/fraud', async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Users with high withdrawal volume in 24h
    const highWithdrawalUsers = await db.withdrawal.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: twentyFourHoursAgo }, status: { in: ['pending', 'processing', 'completed'] } },
      _sum: { amount: true },
      _count: true,
      having: { amount: { _sum: { gte: 100000 } } },
    })

    // Users with many failed withdrawals
    const failedWithdrawalUsers = await db.withdrawal.groupBy({
      by: ['userId'],
      where: { status: 'failed', createdAt: { gte: sevenDaysAgo } },
      _count: true,
      having: { id: { _count: { gte: 3 } } },
    })

    // Tips from same sender to same recipient (potential abuse)
    const duplicateTips = await db.tip.groupBy({
      by: ['senderId', 'recipientId'],
      where: { createdAt: { gte: sevenDaysAgo }, status: 'completed' },
      _count: true,
      _sum: { amount: true },
      having: { id: { _count: { gte: 5 } } },
    })

    // Get user details for flagged users
    const flaggedUserIds = [
      ...highWithdrawalUsers.map(w => w.userId),
      ...failedWithdrawalUsers.map(w => w.userId),
    ]

    const flaggedUsers = flaggedUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: [...new Set(flaggedUserIds)] } },
          select: { id: true, username: true, displayName: true, email: true, role: true },
        })
      : []

    const flaggedMap = new Map(flaggedUsers.map(u => [u.id, u]))

    res.json({
      success: true,
      data: {
        highWithdrawal: highWithdrawalUsers.map(w => ({
          user: flaggedMap.get(w.userId),
          totalWithdrawn: Number(w._sum.amount || 0),
          withdrawalCount: w._count,
        })),
        frequentFailures: failedWithdrawalUsers.map(w => ({
          user: flaggedMap.get(w.userId),
          failureCount: w._count,
        })),
        duplicateTips: duplicateTips.map(d => ({
          senderId: d.senderId,
          recipientId: d.recipientId,
          count: d._count,
          totalAmount: Number(d._sum.amount || 0),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// ─── Audit Logs ────────────────────────────────────────────────
router.get('/audit', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20)
    const action = req.query.action as string | undefined
    const userId = req.query.userId as string | undefined
    const skip = (page - 1) * limit

    const where: any = {}
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (userId) where.userId = userId

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        select: {
          id: true, action: true, resource: true, resourceId: true,
          ipAddress: true, metadata: true, createdAt: true,
          user: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    next(error)
  }
})

// ─── Health / System Info ──────────────────────────────────────
router.get('/health', async (_req, res, next) => {
  try {
    const dbOk = await db.$queryRaw`SELECT 1`.then(() => true).catch(() => false)

    res.json({
      success: true,
      data: {
        database: dbOk ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
