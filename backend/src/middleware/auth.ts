import type { Request, Response, NextFunction } from 'express'
import { verifyTokenAsync, type JWTPayload } from '~/lib/jwt'
import { AppError } from '~/lib/errors'
import { db } from '~/lib/db'
import { hashToken } from '~/lib/crypto'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

async function resolveLiveSession(req: Request, token: string) {
  const payload = await verifyTokenAsync(token)

  const [session, user] = await Promise.all([
    db.session.findUnique({ where: { tokenHash: hashToken(token) } }),
    db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true },
    }),
  ])

  if (!session || session.expiresAt <= new Date()) {
    return null
  }
  if (!user || !user.isActive) {
    return null
  }

  return payload
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return next(
        AppError.unauthorized('Missing or invalid authorization header')
      )
    }

    const token = authHeader.slice(7)

    if (!token || token.length < 10) {
      return next(AppError.unauthorized('Invalid token format'))
    }

    const payload = await resolveLiveSession(req, token)
    if (!payload) {
      return next(AppError.unauthorized('Session expired, please log in again'))
    }

    req.user = payload
    next()
  } catch {
    return next(AppError.unauthorized('Invalid or expired token'))
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const payload = await resolveLiveSession(req, token)
      if (payload) {
        req.user = payload
      }
    }
  } catch {
    // Token invalid, continue without auth
  }
  next()
}
