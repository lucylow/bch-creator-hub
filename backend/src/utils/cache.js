const redis = require('../config/redis');
const logger = require('./logger');

class Cache {
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      return await redis.get(key);
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = 3600) {
    try {
      return await redis.set(key, value, 'EX', ttl);
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    try {
      return await redis.del(key);
    } catch (error) {
      logger.error(`Cache DEL error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      logger.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet(key, fetchFn, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch and cache
      const value = await fetchFn();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      // If cache fails, still try to fetch
      return await fetchFn();
    }
  }

  /**
   * Invalidate pattern
   */
  async invalidatePattern(pattern) {
    // For simplicity, we'll use a prefix-based approach
    // In production, you might want to use Redis SCAN
    logger.warn(`Cache invalidation for pattern ${pattern} not fully implemented`);
  }
}

module.exports = new Cache();
