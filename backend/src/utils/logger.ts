import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Enterprise-grade logging configuration using Winston
 * Supports multiple log levels, file rotation, and structured logging
 */

// Custom log format for better readability
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Log level configuration based on environment
const getLogLevel = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info';
    case 'test':
      return 'error';
    case 'development':
    default:
      return process.env.LOG_LEVEL || 'debug';
  }
};

// Create the logger instance
export const logger = winston.createLogger({
  level: getLogLevel(),
  format: logFormat,
  defaultMeta: {
    service: 'satoshiquest-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 20971520, // 20MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
    
    // File transport for combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 20971520, // 20MB
      maxFiles: 14,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 20971520,
      maxFiles: 5,
    }),
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 20971520,
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: getLogLevel(),
    })
  );
}

// Add console transport for production with minimal formatting
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: 'info',
    })
  );
}

/**
 * Structured logging helper functions
 */
export const loggers = {
  // API request logging
  apiRequest: (method: string, url: string, statusCode: number, responseTime: number, userId?: string) => {
    logger.info('API Request', {
      type: 'api_request',
      method,
      url,
      statusCode,
      responseTime,
      userId,
    });
  },

  // Database operation logging
  dbOperation: (operation: string, collection: string, duration: number, error?: Error) => {
    if (error) {
      logger.error('Database Operation Failed', {
        type: 'db_operation',
        operation,
        collection,
        duration,
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.debug('Database Operation', {
        type: 'db_operation',
        operation,
        collection,
        duration,
      });
    }
  },

  // Blockchain event logging
  blockchainEvent: (eventType: string, txId: string, blockHeight: number, contractAddress: string, data?: any) => {
    logger.info('Blockchain Event', {
      type: 'blockchain_event',
      eventType,
      txId,
      blockHeight,
      contractAddress,
      data,
    });
  },

  // WebSocket connection logging
  websocketEvent: (event: string, socketId: string, userId?: string, data?: any) => {
    logger.info('WebSocket Event', {
      type: 'websocket_event',
      event,
      socketId,
      userId,
      data,
    });
  },

  // Game event logging
  gameEvent: (eventType: string, playerId: string, characterName?: string, data?: any) => {
    logger.info('Game Event', {
      type: 'game_event',
      eventType,
      playerId,
      characterName,
      data,
    });
  },

  // Security event logging
  securityEvent: (eventType: string, ip: string, userId?: string, details?: any) => {
    logger.warn('Security Event', {
      type: 'security_event',
      eventType,
      ip,
      userId,
      details,
    });
  },

  // Performance monitoring
  performance: (operation: string, duration: number, metadata?: any) => {
    const level = duration > 1000 ? 'warn' : 'info'; // Warn if operation takes more than 1 second
    logger.log(level, 'Performance Metric', {
      type: 'performance',
      operation,
      duration,
      metadata,
    });
  },

  // Error logging with context
  error: (message: string, error: Error, context?: any) => {
    logger.error(message, {
      type: 'application_error',
      error: error.message,
      stack: error.stack,
      context,
    });
  },
};

// Create a child logger for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

export default logger;
