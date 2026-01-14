const logger = require('../utils/logger');
const { 
  AppError, 
  DatabaseError, 
  ValidationError,
  NetworkError,
  TimeoutError
} = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate request ID for tracking
 */
const generateRequestId = (req) => {
  if (!req.id) {
    req.id = req.headers['x-request-id'] || uuidv4();
  }
  return req.id;
};

/**
 * Enhanced error handler with detailed error information
 */
const errorHandler = (err, req, res, next) => {
  const requestId = generateRequestId(req);
  
  // Default error properties
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let details = err.details || null;
  let retryable = err.retryable || false;
  let context = err.context || {};

  // Enhanced log data with request context
  const logData = {
    requestId,
    message: err.message,
    statusCode,
    errorCode,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id || req.creator?.creator_id || null,
    stack: err.stack,
    name: err.name,
    context: {
      ...context,
      query: req.query,
      params: req.params,
      body: sanitizeRequestBody(req.body)
    },
    timestamp: new Date().toISOString()
  };

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
    details = err.details;
    retryable = err.retryable;
    context = err.context;
    
    // Log operational errors at warn level, programming errors at error level
    if (err.isOperational) {
      logger.warn('Operational Error:', logData);
    } else {
      logger.error('Application Error:', logData);
    }
  } else {
    // Handle PostgreSQL errors
    if (err.code && err.code.match(/^[0-9A-Z]{5}$/)) {
      const dbError = DatabaseError.fromPostgresError(err, {
        requestId,
        url: req.url,
        method: req.method
      });
      statusCode = dbError.statusCode;
      message = dbError.message;
      errorCode = dbError.errorCode;
      details = dbError.details;
      retryable = dbError.retryable;
      context = dbError.context;
      
      logger.error('Database Error:', {
        ...logData,
        pgCode: err.code,
        constraint: err.constraint,
        table: err.table,
        column: err.column
      });
    }
    // Handle JWT errors
    else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Authentication failed';
      errorCode = 'AUTHENTICATION_ERROR';
      logger.warn('Authentication Error:', logData);
    }
    // Handle validation errors from express-validator
    else if (err.name === 'ValidationError' || err.name === 'ValidatorError') {
      statusCode = 400;
      message = err.message || 'Validation error';
      errorCode = 'VALIDATION_ERROR';
      logger.warn('Validation Error:', logData);
    }
    // Handle cast errors (invalid ID format)
    else if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
      errorCode = 'INVALID_ID_FORMAT';
      context = { path: err.path, value: err.value };
      logger.warn('Cast Error:', logData);
    }
    // Handle JSON parse errors
    else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
      statusCode = 400;
      message = 'Invalid JSON in request body';
      errorCode = 'INVALID_JSON';
      logger.warn('JSON Parse Error:', logData);
    }
    // Handle network/axios errors
    else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      statusCode = 503;
      message = 'External service unavailable';
      errorCode = 'SERVICE_UNAVAILABLE';
      retryable = true;
      context = { code: err.code, host: err.hostname || err.address };
      logger.error('Network Error:', logData);
    }
    // Handle timeout errors
    else if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      statusCode = 504;
      message = 'Request timeout';
      errorCode = 'TIMEOUT_ERROR';
      retryable = true;
      logger.error('Timeout Error:', logData);
    }
    // Handle Redis errors
    else if (err.message?.includes('Redis') || err.code === 'ECONNREFUSED') {
      statusCode = 503;
      message = 'Cache service unavailable';
      errorCode = 'CACHE_UNAVAILABLE';
      retryable = true;
      logger.error('Redis Error:', logData);
    }
    // Unknown/unexpected errors - log at error level
    else {
      logger.error('Unexpected Error:', {
        ...logData,
        originalError: {
          name: err.name,
          message: err.message,
          code: err.code,
          stack: err.stack
        }
      });
      
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        message = 'An unexpected error occurred';
        errorCode = 'INTERNAL_SERVER_ERROR';
      }
    }
  }

  // Build detailed response object
  const response = {
    success: false,
    error: {
      message,
      code: errorCode,
      requestId
    }
  };

  // Add details if available (for validation errors)
  if (details) {
    response.error.details = details;
  }

  // Add context if available and in development
  if (Object.keys(context).length > 0 && process.env.NODE_ENV !== 'production') {
    response.error.context = context;
  }

  // Add retry information
  if (retryable) {
    response.error.retryable = true;
    if (process.env.NODE_ENV !== 'production') {
      response.error.retryAfter = '30s'; // Suggested retry delay
    }
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.error.stack = err.stack;
  }

  // Set retry-after header for retryable errors
  if (retryable && statusCode >= 500) {
    res.set('Retry-After', '30');
  }

  res.status(statusCode).json(response);
};

/**
 * Sanitize request body to remove sensitive information for logging
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'privateKey', 'mnemonic'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * 404 handler with detailed information
 */
const notFoundHandler = (req, res) => {
  const requestId = generateRequestId(req);
  
  logger.warn('Route Not Found:', {
    requestId,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      requestId,
      path: req.url,
      method: req.method
    }
  });
};

/**
 * Async error handler wrapper with enhanced context
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    const requestId = generateRequestId(req);
    
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Add request context to error if it's an AppError
      if (err instanceof AppError && !err.requestId) {
        err.requestId = requestId;
        err.context = {
          ...err.context,
          url: req.url,
          method: req.method
        };
      }
      next(err);
    });
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  generateRequestId
};
