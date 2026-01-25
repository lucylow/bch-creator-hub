/**
 * Creator session cache: short-lived Redis cache for creator profile used in verifyToken.
 * Reduces DB reads when the same creator hits multiple API requests within the TTL.
 */
const redis = require('../config/redis');
const Creator = require('../models/Creator');
const { sessionKey, SESSION_TTL_SEC } = require('../config/cacheKeys');
const logger = require('../utils/logger');

/**
 * Get creator from cache or DB. On cache miss, fetches from DB and populates cache.
 * @param {string} creatorId
 * @returns {Promise<object|null>} Creator row or null
 */
async function getCreator(creatorId) {
  try {
    const key = sessionKey(creatorId);
    const cached = await redis.get(key);
    if (cached !== null && typeof cached === 'object') {
      return cached;
    }
  } catch (err) {
    logger.warn('Creator session cache get failed, falling back to DB', { creatorId, err: err?.message });
  }

  const creator = await Creator.findByCreatorId(creatorId);
  if (creator) {
    try {
      await redis.set(sessionKey(creatorId), creator, 'EX', SESSION_TTL_SEC);
    } catch (err) {
      logger.warn('Creator session cache set failed', { creatorId, err: err?.message });
    }
  }
  return creator;
}

/**
 * Invalidate cached creator (e.g. after profile update or deactivation).
 * @param {string} creatorId
 */
async function invalidateCreator(creatorId) {
  try {
    await redis.del(sessionKey(creatorId));
  } catch (err) {
    logger.warn('Creator session cache invalidate failed', { creatorId, err: err?.message });
  }
}

module.exports = {
  getCreator,
  invalidateCreator
};
