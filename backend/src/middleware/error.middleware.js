const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  // Default error properties
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Log error with context
  const logData = {
    message: err.message,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
    name: err.name
  };

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
    
    // Log operational errors at info level, programming errors at error level
    if (err.isOperational) {
      logger.warn('Operational Error:', logData);
    } else {
      logger.error('Application Error:', logData);
    }
  } else {
    // Handle other error types
    if (err.name === 'ValidationError' || err.name === 'ValidatorError') {
      statusCode = 400;
      message = err.message || 'Validation error';
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Authentication failed';
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
    } else if (err.name === 'MongoError' && err.code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
    } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
      statusCode = 400;
      message = 'Invalid JSON';
    } else {
      // Unknown/unexpected errors - log at error level
      logger.error('Unexpected Error:', logData);
    }
  }

  // Build response object
  const response = {
    success: false,
    error: message
  };

  // Add details if available (for validation errors)
  if (details) {
    response.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
