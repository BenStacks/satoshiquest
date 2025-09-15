import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request logging middleware for API monitoring and debugging
 */

interface RequestWithId extends Request {
  requestId?: string;
  startTime?: number;
}

/**
 * Generate unique request ID and add to request object
 */
export function requestId(req: RequestWithId, res: Response, next: NextFunction): void {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * Log incoming requests with timing and metadata
 */
export function requestLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  // Skip logging for health checks and static assets
  if (req.url === '/health' || req.url.startsWith('/static')) {
    return next();
  }

  req.startTime = Date.now();
  
  // Generate request ID if not already present
  if (!req.requestId) {
    req.requestId = uuidv4();
    res.setHeader('X-Request-ID', req.requestId);
  }

  // Extract useful request information
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    userId: (req as any).user?.id,
  };

  // Log request start
  logger.info('Incoming Request', {
    type: 'request_start',
    ...requestInfo,
  });

  // Capture response finish event
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    
    // Log response completion
    logger.info('Request Completed', {
      type: 'request_complete',
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userId: (req as any).user?.id,
      ip: requestInfo.ip,
      contentLength: res.get('Content-Length'),
    });

    // Add response headers for monitoring
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Enhanced request logger with body logging (for development)
 */
export function verboseRequestLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'development') {
    return requestLogger(req, res, next);
  }

  req.startTime = Date.now();
  
  if (!req.requestId) {
    req.requestId = uuidv4();
    res.setHeader('X-Request-ID', req.requestId);
  }

  // Log detailed request information including body
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    query: req.query,
    params: req.params,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };

  logger.debug('Verbose Request', {
    type: 'verbose_request',
    ...requestInfo,
  });

  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    
    logger.debug('Verbose Response', {
      type: 'verbose_response',
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      headers: res.getHeaders(),
      body: process.env.NODE_ENV === 'development' ? data : undefined,
    });

    res.setHeader('X-Response-Time', `${responseTime}ms`);
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Security-focused request logger for suspicious activity
 */
export function securityLogger(req: Request, res: Response, next: NextFunction): void {
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /exec\(/i,  // Code execution
    /eval\(/i,  // Code evaluation
  ];

  const requestData = JSON.stringify({
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    headers: req.headers,
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

  if (isSuspicious) {
    logger.warn('Suspicious Request Detected', {
      type: 'security_alert',
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      headers: req.headers,
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * API analytics logger for performance monitoring
 */
export function analyticsLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  req.startTime = Date.now();

  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    
    // Log analytics data
    logger.info('API Analytics', {
      type: 'api_analytics',
      timestamp: new Date().toISOString(),
      method: req.method,
      endpoint: req.route?.path || req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
      requestSize: parseInt(req.get('Content-Length') || '0', 10),
      responseSize: data ? Buffer.byteLength(data, 'utf8') : 0,
    });

    return originalSend.call(this, data);
  };

  next();
}
