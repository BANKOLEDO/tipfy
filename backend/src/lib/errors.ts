export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message: string, code?: string) {
    return new AppError(message, 400, code || 'BAD_REQUEST')
  }

  static unauthorized(message: string = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHORIZED')
  }

  static forbidden(message: string = 'Access denied') {
    return new AppError(message, 403, 'FORBIDDEN')
  }

  static notFound(message: string = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND')
  }

  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT')
  }

  static tooMany(message: string = 'Too many requests') {
    return new AppError(message, 429, 'RATE_LIMITED')
  }

  static internal(message: string = 'Internal server error') {
    return new AppError(message, 500, 'INTERNAL_ERROR', false)
  }
}
