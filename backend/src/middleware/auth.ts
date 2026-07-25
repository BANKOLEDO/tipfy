import type { Request, Response, NextFunction } from 'express'
import { verifyTokenAsync, type JWTPayload } from '~/lib/jwt'
import { AppError } from '~/lib/errors'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
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

    const payload = await verifyTokenAsync(token)
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
      const payload = await verifyTokenAsync(token)
      req.user = payload
    }
  } catch {
    // Token invalid, continue without auth
  }
  next()
}
