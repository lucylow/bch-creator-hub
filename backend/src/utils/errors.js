/**
 * Custom Error Classes for better error handling
 * Includes error codes, context, and detailed metadata
 */

class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = options.isOperational !== false;
    this.errorCode = options.errorCode || this.getDefaultErrorCode();
    this.name = this.constructor.name;
    this.context = options.context || {};
    this.details = options.details || null;
    this.retryable = options.retryable || false;
    this.timestamp = new Date().toISOString();
    this.requestId = options.requestId || null;
    
    Error.captureStackTrace(this, this.constructor);
  }

  getDefaultErrorCode() {
    // Generate error code based on class name and status code
    const className = this.constructor.name.replace('Error', '').toUpperCase();
    return `${className}_${this.statusCode}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      context: this.context,
      details: this.details,
      retryable: this.retryable,
      timestamp: this.timestamp
    };
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', details = null, options = {}) {
    super(message, 400, {
      errorCode: 'VALIDATION_ERROR',
      details,
      ...options
    });
    this.details = details || [];
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', options = {}) {
    super(message, 401, {
      errorCode: 'AUTHENTICATION_ERROR',
      ...options
    });
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Not authorized to perform this action', options = {}) {
    super(message, 403, {
      errorCode: 'AUTHORIZATION_ERROR',
      ...options
    });
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', options = {}) {
    super(`${resource} not found`, 404, {
      errorCode: 'NOT_FOUND',
      context: { resource },
      ...options
    });
    this.resource = resource;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists', options = {}) {
    super(message, 409, {
      errorCode: 'CONFLICT_ERROR',
      ...options
    });
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', options = {}) {
    super(message, 429, {
      errorCode: 'RATE_LIMIT_EXCEEDED',
      retryable: true,
      ...options
    });
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error', options = {}) {
    super(`${service}: ${message}`, 502, {
      errorCode: 'EXTERNAL_SERVICE_ERROR',
      context: { service },
      retryable: true,
      ...options
    });
    this.service = service;
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', options = {}) {
    super(message, 500, {
      errorCode: 'DATABASE_ERROR',
      retryable: options.retryable !== false,
      ...options
    });
    this.query = options.query || null;
    this.constraint = options.constraint || null;
    this.code = options.code || null; // PostgreSQL error code
  }

  static fromPostgresError(err, context = {}) {
    const options = {
      context,
      code: err.code,
      query: err.query || null,
      constraint: err.constraint || null,
      retryable: isRetryablePostgresError(err.code)
    };

    // Map PostgreSQL error codes to specific messages
    let message = 'Database operation failed';
    let statusCode = 500;

    switch (err.code) {
      case '23505': // unique_violation
        message = 'Duplicate entry: record already exists';
        statusCode = 409;
        options.errorCode = 'DUPLICATE_ENTRY';
        break;
      case '23503': // foreign_key_violation
        message = 'Referenced record does not exist';
        statusCode = 400;
        options.errorCode = 'FOREIGN_KEY_VIOLATION';
        break;
      case '23502': // not_null_violation
        message = 'Required field is missing';
        statusCode = 400;
        options.errorCode = 'NOT_NULL_VIOLATION';
        break;
      case '23514': // check_violation
        message = 'Data validation failed';
        statusCode = 400;
        options.errorCode = 'CHECK_VIOLATION';
        break;
      case '42P01': // undefined_table
        message = 'Database table does not exist';
        statusCode = 500;
        options.errorCode = 'UNDEFINED_TABLE';
        options.retryable = false;
        break;
      case '08000': // connection_exception
      case '08003': // connection_does_not_exist
      case '08006': // connection_failure
        message = 'Database connection failed';
        statusCode = 503;
        options.errorCode = 'DATABASE_CONNECTION_ERROR';
        options.retryable = true;
        break;
      case '40001': // serialization_failure
      case '40P01': // deadlock_detected
        message = 'Database transaction conflict';
        statusCode = 409;
        options.errorCode = 'TRANSACTION_CONFLICT';
        options.retryable = true;
        break;
      case '53300': // too_many_connections
        message = 'Database connection limit exceeded';
        statusCode = 503;
        options.errorCode = 'TOO_MANY_CONNECTIONS';
        options.retryable = true;
        break;
      default:
        message = err.message || message;
    }

    return new DatabaseError(message, { ...options, originalError: err.message });
  }
}

class NetworkError extends AppError {
  constructor(message = 'Network request failed', options = {}) {
    super(message, 503, {
      errorCode: 'NETWORK_ERROR',
      retryable: true,
      ...options
    });
    this.url = options.url || null;
    this.method = options.method || null;
  }
}

class TimeoutError extends AppError {
  constructor(message = 'Request timeout', options = {}) {
    super(message, 504, {
      errorCode: 'TIMEOUT_ERROR',
      retryable: true,
      ...options
    });
    this.timeout = options.timeout || null;
  }
}

class ConfigurationError extends AppError {
  constructor(message = 'Configuration error', options = {}) {
    super(message, 500, {
      errorCode: 'CONFIGURATION_ERROR',
      retryable: false,
      isOperational: false,
      ...options
    });
  }
}

class BusinessLogicError extends AppError {
  constructor(message, statusCode = 400, options = {}) {
    super(message, statusCode, {
      errorCode: 'BUSINESS_LOGIC_ERROR',
      ...options
    });
  }
}

// Helper function to determine if PostgreSQL error is retryable
function isRetryablePostgresError(code) {
  const retryableCodes = [
    '08000', // connection_exception
    '08003', // connection_does_not_exist
    '08006', // connection_failure
    '40001', // serialization_failure
    '40P01', // deadlock_detected
    '53300', // too_many_connections
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '57P03', // cannot_connect_now
  ];
  return retryableCodes.includes(code);
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
  BusinessLogicError
};

