/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Enhanced with better error context and logging
 */
const logger = require('./logger');
const { DatabaseError, AppError } = require('./errors');
const { generateRequestId } = require('../middleware/error.middleware');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    const requestId = generateRequestId(req);
    
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Enhance error with request context
      if (err instanceof AppError) {
        if (!err.requestId) {
          err.requestId = requestId;
        }
        if (!err.context) {
          err.context = {};
        }
        err.context = {
          ...err.context,
          url: req.url,
          method: req.method,
          ip: req.ip
        };
      }
      
      // Handle database errors
      if (err.code && err.code.match(/^[0-9A-Z]{5}$/)) {
        const dbError = DatabaseError.fromPostgresError(err, {
          requestId,
          url: req.url,
          method: req.method
        });
        return next(dbError);
      }
      
      // Log unexpected errors
      if (!(err instanceof AppError)) {
        logger.error('Unhandled error in async handler:', {
          requestId,
          error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code
          },
          request: {
            url: req.url,
            method: req.method,
            ip: req.ip
          }
        });
      }
      
      next(err);
    });
  };
};

module.exports = asyncHandler;

