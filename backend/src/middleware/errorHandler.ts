import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * Global error handling middleware
 * Provides consistent error responses and logging across the application
 */

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: any) {
    super(`${service} service unavailable`, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Main error handling middleware
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';
  const details = error.details;

  // Log error with context
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    requestId: (req as any).requestId,
    body: req.body,
    query: req.query,
    params: req.params,
  };

  if (statusCode >= 500) {
    logger.error('Server Error', error, errorContext);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', error, errorContext);
  }

  // Prepare error response
  const errorResponse: any = {
    success: false,
    message,
    error: code,
    timestamp: new Date().toISOString(),
  };

  // Include details in development or for validation errors
  if (details && (process.env.NODE_ENV === 'development' || statusCode === 400)) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  
  logger.warn('Route Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    message,
    error: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and forwards them to error middleware
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Development error handler with detailed stack traces
 */
export function developmentErrorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';

  logger.error('Development Error', error, {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  res.status(statusCode).json({
    success: false,
    message: error.message,
    error: code,
    details: error.details,
    stack: error.stack,
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Production error handler with minimal information disclosure
 */
export function productionErrorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';

  // Only log operational errors in production
  if (error.isOperational !== false) {
    logger.error('Production Error', error, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: (req as any).user?.id,
    });
  }

  // Generic message for 5xx errors in production
  const message = statusCode >= 500 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    success: false,
    message,
    error: code,
    timestamp: new Date().toISOString(),
  });
}
