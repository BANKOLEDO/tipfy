import type { CorsOptions } from 'cors'
import { getEnv } from './env'

export function getCorsOptions(): CorsOptions {
  const env = getEnv()
  return {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400,
  }
}
