const cron = require('node-cron');
const { query } = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class CleanupJob {
  init() {
    // Clean up expired cache entries daily
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupExpiredCache();
    });

    // Clean up old rate limit entries daily
    cron.schedule('0 3 * * *', async () => {
      await this.cleanupExpiredRateLimits();
    });

    // Clean up old transactions (optional, for data retention)
    cron.schedule('0 4 * * 0', async () => {
      await this.archiveOldTransactions();
    });

    logger.info('Cleanup jobs initialized');
  }

  async cleanupExpiredCache() {
    try {
      // Clean up PostgreSQL cache table
      await query(
        'DELETE FROM cache WHERE expires_at < NOW()'
      );

      // Redis cleanup is handled automatically with TTL
      logger.info('Expired cache entries cleaned up');
    } catch (error) {
      logger.error('Error cleaning up cache:', error);
    }
  }

  async cleanupExpiredRateLimits() {
    try {
      await query(
        'DELETE FROM rate_limits WHERE expires_at < NOW()'
      );
      
      logger.info('Expired rate limit entries cleaned up');
    } catch (error) {
      logger.error('Error cleaning up rate limits:', error);
    }
  }

  async archiveOldTransactions() {
    try {
      // Archive transactions older than 1 year (optional)
      // This is just a placeholder - in production, you might want to
      // archive to a separate table or delete based on your data retention policy
      logger.info('Transaction archiving not implemented');
    } catch (error) {
      logger.error('Error archiving transactions:', error);
    }
  }
}

module.exports = new CleanupJob();
