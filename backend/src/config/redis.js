const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

client.on('connect', () => {
  logger.info('Redis client connected');
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

// Connect to Redis
client.connect().catch((err) => {
  logger.error('Redis connection error:', err);
});

// Wrapper methods for easier use
const redisClient = {
  get: async (key) => {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  },
  
  set: async (key, value, expiryMode, time) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (expiryMode && time) {
        return await client.setEx(key, time, stringValue);
      }
      return await client.set(key, stringValue);
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return null;
    }
  },
  
  del: async (key) => {
    try {
      return await client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return null;
    }
  },
  
  exists: async (key) => {
    try {
      return await client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  },
  
  expire: async (key, seconds) => {
    try {
      return await client.expire(key, seconds);
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return null;
    }
  },
  
  quit: async () => {
    try {
      return await client.quit();
    } catch (error) {
      logger.error('Redis QUIT error:', error);
    }
  }
};

module.exports = redisClient;
