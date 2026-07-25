import type { Request, Response, NextFunction } from 'express'
import { getEnv } from '~/config/env'
import { AppError } from '~/lib/errors'

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.expiresAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 300000)

export function rateLimit(options: {
  windowMs?: number
  maxRequests: number
  keyGenerator?: (req: Request) => string
  message?: string
}) {
  const env = getEnv()
  const windowMs = options.windowMs || env.RATE_LIMIT_WINDOW_MS

  return (req: Request, _res: Response, next: NextFunction) => {
    if (env.NODE_ENV === 'test') return next()
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : `${req.ip}:${req.path}`

    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (entry && entry.expiresAt > now) {
      if (entry.count >= options.maxRequests) {
        const retryAfter = Math.ceil((entry.expiresAt - now) / 1000)
        _res.setHeader('Retry-After', retryAfter.toString())
        return next(
          AppError.tooMany(
            options.message || `Rate limit exceeded. Try again in ${retryAfter}s`
          )
        )
      }
      entry.count++
    } else {
      rateLimitStore.set(key, { count: 1, expiresAt: now + windowMs })
    }

    next()
  }
}

export const globalRateLimit = rateLimit({
  maxRequests: 100,
  message: 'Too many requests from this IP',
})

export const authRateLimit = rateLimit({
  maxRequests: 10,
  windowMs: 900000,
  keyGenerator: (req) => `auth:${req.ip}`,
  message: 'Too many authentication attempts',
})

export const tipRateLimit = rateLimit({
  maxRequests: 20,
  windowMs: 3600000,
  keyGenerator: (req) => `tip:${req.ip}`,
  message: 'Too many tip attempts',
})

export const webhookRateLimit = rateLimit({
  maxRequests: 50,
  windowMs: 60000,
  keyGenerator: (req) => `webhook:${req.ip}`,
  message: 'Too many webhook requests',
})
