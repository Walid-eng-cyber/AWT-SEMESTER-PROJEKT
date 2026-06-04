import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../lib/api-error.js'

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      type: 'validation_error',
      message: 'Invalid request payload.',
      issues: error.issues,
    })
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      type: 'api_error',
      message: error.message,
    })
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled server error:', error)

  return res.status(500).json({
    type: 'internal_error',
    message: 'Unexpected server error.',
  })
}
