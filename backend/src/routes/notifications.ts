import { Router } from 'express'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { authenticate } from '~/middleware/auth'

const router = Router()

// Get all notifications for the current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50)
    const unreadOnly = req.query.unread === 'true'

    const where: any = { userId: req.user!.userId }
    if (unreadOnly) where.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId: req.user!.userId, isRead: false } }),
    ])

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

// Get unread count only
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await db.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    })
    res.json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
})

// Mark single notification as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await db.notification.findUnique({
      where: { id: req.params.id as string },
    })

    if (!notification) throw AppError.notFound('Notification not found')
    if (notification.userId !== req.user!.userId) throw AppError.forbidden('Access denied')

    const updated = await db.notification.update({
      where: { id: req.params.id as string },
      data: { isRead: true },
    })

    res.json({ success: true, data: { notification: updated } })
  } catch (error) {
    next(error)
  }
})

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await db.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    })

    res.json({ success: true, data: { message: 'All notifications marked as read' } })
  } catch (error) {
    next(error)
  }
})

// Delete a single notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const notification = await db.notification.findUnique({
      where: { id: req.params.id as string },
    })

    if (!notification) throw AppError.notFound('Notification not found')
    if (notification.userId !== req.user!.userId) throw AppError.forbidden('Access denied')

    await db.notification.delete({ where: { id: req.params.id as string } })

    res.json({ success: true, data: { message: 'Notification deleted' } })
  } catch (error) {
    next(error)
  }
})

export default router
