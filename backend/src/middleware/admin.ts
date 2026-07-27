import type { Request, Response, NextFunction } from 'express'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { authenticate } from './auth'

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  authenticate(req, res, async () => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'))
      }

      const user = await db.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true, isActive: true },
      })

      if (!user || !user.isActive) {
        return next(AppError.forbidden('Account not found or deactivated'))
      }

      if (user.role !== 'admin' && user.role !== 'support') {
        return next(AppError.forbidden('Insufficient permissions'))
      }

      ;(req as any).userRole = user.role
      next()
    } catch {
      next(AppError.forbidden('Access denied'))
    }
  })
}

export async function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  authenticate(req, res, async () => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'))
      }

      const user = await db.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true, isActive: true },
      })

      if (!user || !user.isActive) {
        return next(AppError.forbidden('Account not found or deactivated'))
      }

      if (user.role !== 'admin') {
        return next(AppError.forbidden('Super admin access required'))
      }

      ;(req as any).userRole = user.role
      next()
    } catch {
      next(AppError.forbidden('Access denied'))
    }
  })
}
