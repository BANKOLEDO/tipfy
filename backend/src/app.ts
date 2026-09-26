import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import morgan from 'morgan'
import { getEnv } from '~/config/env'
import { getCorsOptions } from '~/config/cors'
import { globalRateLimit } from '~/middleware/rateLimit'
import { errorHandler, notFoundHandler } from '~/middleware/errorHandler'

import authRoutes from '~/routes/auth'
import tipRoutes from '~/routes/tips'
import userRoutes from '~/routes/users'
import withdrawalRoutes from '~/routes/withdrawals'
import teamRoutes from '~/routes/teams'
import notificationRoutes from '~/routes/notifications'
import adminRoutes from '~/routes/admin'

export function createApp() {
  const env = getEnv()
  const app = express()

  app.set('trust proxy', 1)

  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  )

  app.use(cors(getCorsOptions()))
  // The webhook signature is computed over the exact bytes Monnify sent, so we
  // must keep the raw body. This has to be captured inside body-parser's
  // `verify` hook: a later req.on('end') listener would attach to an already
  // consumed stream, never fire, and hang the request.
  app.use(
    express.json({
      limit: '10kb',
      verify: (req, _res, buf) => {
        ;(req as any).rawBody = buf.toString('utf8')
      },
    })
  )
  app.use(express.urlencoded({ extended: false, limit: '10kb' }))

  app.use(hpp())

  if (env.NODE_ENV !== 'test') {
    app.use(globalRateLimit)
  }

  app.use(morgan(env.NODE_ENV === 'test' ? 'none' : env.LOG_LEVEL === 'prod' ? 'combined' : 'dev'))

  app.use((req, _res, next) => {
    req.headers['x-request-id'] =
      req.headers['x-request-id'] || crypto.randomUUID()
    next()
  })

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    })
  })

  const apiPrefix = '/api/v1'

  app.use(`${apiPrefix}/auth`, authRoutes)
  app.use(`${apiPrefix}/tips`, tipRoutes)
  app.use(`${apiPrefix}/users`, userRoutes)
  app.use(`${apiPrefix}/withdrawals`, withdrawalRoutes)
  app.use(`${apiPrefix}/teams`, teamRoutes)
  app.use(`${apiPrefix}/notifications`, notificationRoutes)
  app.use(`${apiPrefix}/admin`, adminRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
