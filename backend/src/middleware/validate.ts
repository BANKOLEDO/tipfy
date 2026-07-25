import type { Request, Response, NextFunction } from 'express'
import { type ZodSchema, ZodError } from 'zod'
import { AppError } from '~/lib/errors'

type ValidationSource = 'body' | 'query' | 'params'

export function validate(
  schema: ZodSchema,
  source: ValidationSource = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source])
      req[source] = data
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        )
        return next(
          AppError.badRequest(`Validation failed: ${messages.join('; ')}`)
        )
      }
      next(error)
    }
  }
}
