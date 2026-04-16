import { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  NotFoundError,
  RoomNotAvailableError,
  DatabaseError,
  UnauthorizedError
} from '../utils/errors';

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Validation Error (400)
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.details,
      timestamp: new Date().toISOString()
    });
  }

  // Not Found Error (404)
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: `${err.resourceType} not found`,
      code: 'NOT_FOUND',
      resourceType: err.resourceType,
      resourceId: err.resourceId,
      timestamp: new Date().toISOString()
    });
  }

  // Room Not Available Error (409 Conflict)
  if (err instanceof RoomNotAvailableError) {
    return res.status(409).json({
      error: 'Room is not available during this time',
      code: 'ROOM_NOT_AVAILABLE',
      conflictingAppointment: err.conflictingAppointment,
      timestamp: new Date().toISOString()
    });
  }

  // Database Error (500)
  if (err instanceof DatabaseError) {
    return res.status(500).json({
      error: 'Database operation failed',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Unauthorized Error (401)
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      error: err.message,
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
  }

  // Catch-all for unexpected errors (500)
  return res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
