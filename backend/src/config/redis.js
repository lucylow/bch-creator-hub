const redis = require('redis');
const logger = require('../utils/logger');
const { ExternalServiceError, NetworkError, TimeoutError } = require('../utils/errors');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

let isConnected = false;
let connectionRetries = 0;

client.on('error', (err) => {
  logger.error('Redis Client Error:', {
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    }
  });
  isConnected = false;
});

client.on('connect', () => {
  logger.info('Redis client connecting...');
  connectionRetries = 0;
});

client.on('ready', () => {
  logger.info('Redis client ready');
  isConnected = true;
  connectionRetries = 0;
});

client.on('reconnecting', () => {
  connectionRetries++;
  logger.warn(`Redis reconnecting (attempt ${connectionRetries})...`);
});

client.on('end', () => {
  logger.warn('Redis connection ended');
  isConnected = false;
});

// Connect to Redis with error handling
client.connect().catch((err) => {
  logger.error('Redis initial connection error:', {
    error: {
      name: err.name,
      message: err.message,
      code: err.code
    }
  });
  isConnected = false;
});

// Helper to check connection and throw appropriate error
const ensureConnection = () => {
  if (!isConnected && !client.isOpen) {
    throw new ExternalServiceError('Redis', 'Redis client is not connected', {
      retryable: true,
      context: { connectionRetries }
    });
  }
};

// Helper to handle Redis errors with proper error types
const handleRedisError = (error, operation, key = null) => {
  const context = { operation, key };
  
  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    isConnected = false;
    throw new NetworkError(`Redis connection failed: ${error.message}`, {
      context,
      retryable: true
    });
  }
  
  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    throw new TimeoutError(`Redis operation timed out: ${error.message}`, {
      context,
      retryable: true,
      timeout: 5000
    });
  }
  
  // Command errors
  if (error.message?.includes('WRONGTYPE') || error.message?.includes('NOAUTH')) {
    throw new ExternalServiceError('Redis', `Redis command error: ${error.message}`, {
      context,
      retryable: false
    });
  }
  
  // Generic Redis errors
  logger.error(`Redis ${operation} error:`, {
    error: {
      name: error.name,
      message: error.message,
      code: error.code
    },
    context
  });
  
  throw new ExternalServiceError('Redis', `Redis operation failed: ${error.message}`, {
    context,
    retryable: true
  });
};

// Wrapper methods with enhanced error handling
const redisClient = {
  get: async (key) => {
    try {
      ensureConnection();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // If it's already an AppError, rethrow it
      if (error instanceof ExternalServiceError || error instanceof NetworkError || error instanceof TimeoutError) {
        throw error;
      }
      handleRedisError(error, 'GET', key);
    }
  },
  
  set: async (key, value, expiryMode, time) => {
    try {
      ensureConnection();
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (expiryMode && time) {
        return await client.setEx(key, time, stringValue);
      }
      return await client.set(key, stringValue);
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof NetworkError || error instanceof TimeoutError) {
        throw error;
      }
      handleRedisError(error, 'SET', key);
    }
  },
  
  del: async (key) => {
    try {
      ensureConnection();
      return await client.del(key);
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof NetworkError || error instanceof TimeoutError) {
        throw error;
      }
      handleRedisError(error, 'DEL', key);
    }
  },
  
  exists: async (key) => {
    try {
      ensureConnection();
      return await client.exists(key);
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof NetworkError || error instanceof TimeoutError) {
        throw error;
      }
      // For exists, return false on error rather than throwing
      logger.warn(`Redis EXISTS error for key ${key}, returning false:`, error);
      return false;
    }
  },
  
  expire: async (key, seconds) => {
    try {
      ensureConnection();
      return await client.expire(key, seconds);
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof NetworkError || error instanceof TimeoutError) {
        throw error;
      }
      handleRedisError(error, 'EXPIRE', key);
    }
  },
  
  quit: async () => {
    try {
      if (client.isOpen) {
        return await client.quit();
      }
    } catch (error) {
      logger.error('Redis QUIT error:', error);
      // Don't throw on quit errors
    }
  },
  
  // Health check method
  isHealthy: () => {
    return isConnected && client.isOpen;
  }
};

module.exports = redisClient;
