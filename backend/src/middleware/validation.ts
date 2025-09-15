import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body } from 'express-validator';
import { ValidationError } from '@/middleware/errorHandler';

/**
 * Validation middleware for request validation using express-validator
 */

/**
 * Process validation results and return formatted errors
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
      location: error.type === 'field' ? (error as any).location : undefined,
    }));

    throw new ValidationError('Validation failed', {
      errors: formattedErrors,
      count: formattedErrors.length,
    });
  }

  next();
}

/**
 * Helper function to create validation middleware with error handling
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    validateRequest(req, res, next);
  };
}

/**
 * Common validation schemas
 */
export const validationSchemas = {
  // MongoDB ObjectId validation
  mongoId: {
    in: ['params', 'query', 'body'],
    matches: {
      options: /^[0-9a-fA-F]{24}$/,
      errorMessage: 'Invalid MongoDB ObjectId format',
    },
  },

  // Stacks address validation
  stacksAddress: {
    in: ['params', 'query', 'body'],
    matches: {
      options: /^S[TP][A-Z0-9]{39}$/,
      errorMessage: 'Invalid Stacks address format',
    },
  },

  // Transaction ID validation
  txId: {
    in: ['params', 'query', 'body'],
    matches: {
      options: /^0x[0-9a-fA-F]{64}$/,
      errorMessage: 'Invalid transaction ID format',
    },
  },

  // Pagination parameters
  page: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: 'Page must be a positive integer',
    },
    toInt: true,
  },

  limit: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: 'Limit must be between 1 and 100',
    },
    toInt: true,
  },

  // Character name validation
  characterName: {
    in: ['body', 'params'],
    isLength: {
      options: { min: 1, max: 32 },
      errorMessage: 'Character name must be between 1 and 32 characters',
    },
    matches: {
      options: /^[a-zA-Z0-9_\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
      errorMessage: 'Character name contains invalid characters',
    },
    trim: true,
  },

  // Game statistics validation
  level: {
    in: ['body'],
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: 'Level must be between 1 and 100',
    },
    toInt: true,
  },

  score: {
    in: ['body'],
    isInt: {
      options: { min: 0 },
      errorMessage: 'Score must be a non-negative integer',
    },
    toInt: true,
  },

  floor: {
    in: ['body'],
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: 'Floor must be between 1 and 100',
    },
    toInt: true,
  },

  experience: {
    in: ['body'],
    isInt: {
      options: { min: 0 },
      errorMessage: 'Experience must be a non-negative integer',
    },
    toInt: true,
  },

  playTime: {
    in: ['body'],
    isInt: {
      options: { min: 0 },
      errorMessage: 'Play time must be a non-negative integer',
    },
    toInt: true,
  },

  // Death cause validation
  deathCause: {
    in: ['body'],
    isLength: {
      options: { min: 1, max: 128 },
      errorMessage: 'Death cause must be between 1 and 128 characters',
    },
    trim: true,
  },

  // Token ID validation
  tokenId: {
    in: ['params', 'query', 'body'],
    isInt: {
      options: { min: 1 },
      errorMessage: 'Token ID must be a positive integer',
    },
    toInt: true,
  },

  // Username validation
  username: {
    in: ['body'],
    optional: true,
    isLength: {
      options: { min: 3, max: 20 },
      errorMessage: 'Username must be between 3 and 20 characters',
    },
    matches: {
      options: /^[a-zA-Z0-9_]+$/,
      errorMessage: 'Username can only contain letters, numbers, and underscores',
    },
    trim: true,
  },

  // Email validation
  email: {
    in: ['body'],
    optional: true,
    isEmail: {
      errorMessage: 'Invalid email format',
    },
    normalizeEmail: true,
  },

  // Sorting validation
  sortBy: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['score', 'level', 'createdAt', 'updatedAt', 'totalScore', 'gamesPlayed']],
      errorMessage: 'Invalid sort field',
    },
  },

  sortOrder: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['asc', 'desc', '1', '-1']],
      errorMessage: 'Sort order must be asc or desc',
    },
  },

  // Date range validation
  startDate: {
    in: ['query'],
    optional: true,
    isISO8601: {
      errorMessage: 'Start date must be a valid ISO 8601 date',
    },
    toDate: true,
  },

  endDate: {
    in: ['query'],
    optional: true,
    isISO8601: {
      errorMessage: 'End date must be a valid ISO 8601 date',
    },
    toDate: true,
    custom: {
      options: (value: Date, { req }: any) => {
        if (req.query.startDate && new Date(req.query.startDate) > value) {
          throw new Error('End date must be after start date');
        }
        return true;
      },
    },
  },

  // Boolean validation
  boolean: {
    in: ['query', 'body'],
    optional: true,
    isBoolean: {
      errorMessage: 'Value must be a boolean',
    },
    toBoolean: true,
  },

  // JSON validation
  metadata: {
    in: ['body'],
    custom: {
      options: (value: any) => {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Metadata must be a valid object');
        }
        return true;
      },
    },
  },
};

/**
 * Game-specific validation schemas
 */
export const gameValidationSchemas = {
  updatePlayerState: [
    body('level').optional().isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('score').optional().isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
    body('position.x').optional().isNumeric().withMessage('Position X must be a number'),
    body('position.y').optional().isNumeric().withMessage('Position Y must be a number'),
    body('health').optional().isInt({ min: 0, max: 100 }).withMessage('Health must be between 0 and 100'),
  ],

  playerDeath: [
    body('finalScore').isInt({ min: 0 }).withMessage('Final score must be a non-negative integer'),
    body('finalLevel').isInt({ min: 1 }).withMessage('Final level must be a positive integer'),
    body('deathPosition').isObject().withMessage('Death position must be an object'),
    body('deathPosition.x').isNumeric().withMessage('Death position X must be a number'),
    body('deathPosition.y').isNumeric().withMessage('Death position Y must be a number'),
    body('killedBy').optional().isString().withMessage('Killed by must be a string'),
  ],
};

/**
 * Sanitization helpers
 */
export const sanitize = {
  // Remove HTML tags
  stripTags: (value: string): string => {
    return value.replace(/<[^>]*>/g, '');
  },

  // Escape special characters
  escapeHtml: (value: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return value.replace(/[&<>"'/]/g, (s) => map[s]);
  },

  // Normalize whitespace
  normalizeSpace: (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
  },
};
