import { Router } from 'express'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { authenticate } from '~/middleware/auth'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { notifyTeamJoined, notifyTeamRemoved } from '~/services/notifications'

const router = Router()

// Get team members
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isBusiness: true },
    })

    if (!user?.isBusiness) {
      throw AppError.forbidden('Only business accounts can manage teams')
    }

    const teams = await db.team.findMany({
      where: { businessId: userId },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
      orderBy: { totalAmount: 'desc' },
    })

    res.json({
      success: true,
      data: {
        team: teams.map((t) => ({
          ...t,
          totalAmount: Number(t.totalAmount),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Add team member
router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const { username, role } = req.body

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isBusiness: true },
    })

    if (!user?.isBusiness) {
      throw AppError.forbidden('Only business accounts can manage teams')
    }

    if (!username) {
      throw AppError.badRequest('Username is required')
    }

    const member = await db.user.findUnique({
      where: { username },
      select: { id: true, username: true, displayName: true },
    })

    if (!member) {
      throw AppError.notFound('User not found')
    }

    if (member.id === userId) {
      throw AppError.badRequest('Cannot add yourself to the team')
    }

    const existing = await db.team.findUnique({
      where: {
        businessId_memberId: {
          businessId: userId,
          memberId: member.id,
        },
      },
    })

    if (existing) {
      throw AppError.conflict('User is already a team member')
    }

    const team = await db.team.create({
      data: {
        businessId: userId,
        memberId: member.id,
        role: role || 'staff',
      },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    await logAuditEvent({
      userId,
      action: AuditActions.TEAM_ADD,
      resource: 'team',
      resourceId: team.id,
      ipAddress: req.ip,
      metadata: { memberId: member.id },
    })

    await notifyTeamJoined(userId, member.displayName)

    res.status(201).json({
      success: true,
      data: { team },
    })
  } catch (error) {
    next(error)
  }
})

// Remove team member
router.delete('/:memberId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const { memberId } = req.params

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isBusiness: true },
    })

    if (!user?.isBusiness) {
      throw AppError.forbidden('Only business accounts can manage teams')
    }

    const team = await db.team.findUnique({
      where: {
        businessId_memberId: {
          businessId: userId,
          memberId: memberId as string,
        },
      },
    })

    if (!team) {
      throw AppError.notFound('Team member not found')
    }

    const member = await db.user.findUnique({
      where: { id: memberId as string },
      select: { displayName: true },
    })

    await db.team.delete({
      where: {
        businessId_memberId: {
          businessId: userId,
          memberId: memberId as string,
        },
      },
    })

    await notifyTeamRemoved(userId, member?.displayName || 'Member')

    await logAuditEvent({
      userId,
      action: AuditActions.TEAM_REMOVE,
      resource: 'team',
      resourceId: team.id,
      ipAddress: req.ip,
      metadata: { memberId: memberId as string },
    })

    res.json({ success: true, data: { message: 'Team member removed' } })
  } catch (error) {
    next(error)
  }
})

// Get team performance (analytics)
router.get('/analytics', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isBusiness: true },
    })

    if (!user?.isBusiness) {
      throw AppError.forbidden('Only business accounts can view team analytics')
    }

    const teams = await db.team.findMany({
      where: { businessId: userId },
      include: {
        member: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { totalAmount: 'desc' },
    })

    const totalTeamTips = teams.reduce(
      (sum, t) => sum + Number(t.totalAmount),
      0
    )

    res.json({
      success: true,
      data: {
        totalTeamTips,
        teamSize: teams.length,
        members: teams.map((t, i) => ({
          rank: i + 1,
          ...t,
          totalAmount: Number(t.totalAmount),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
