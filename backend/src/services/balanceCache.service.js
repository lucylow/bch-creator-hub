/**
 * Balance cache service: fast balance reads with Redis cache-aside.
 * All balance reads should go through getBalance(); balance invalidation
 * and updates use invalidateBalance() / setBalance().
 */
const redis = require('../config/redis');
const Creator = require('../models/Creator');
const { balanceKey, BALANCE_TTL_SEC } = require('../config/cacheKeys');
const logger = require('../utils/logger');

/**
 * Get creator balance: cache-aside (Redis first, then DB, then repopulate cache).
 * @param {string} creatorId
 * @returns {Promise<{ total_balance: string, unconfirmed_balance: string }>}
 */
async function getBalance(creatorId) {
  try {
    const key = balanceKey(creatorId);
    const cached = await redis.get(key);
    if (cached !== null && typeof cached === 'object') {
      return cached;
    }
  } catch (err) {
    logger.warn('Balance cache get failed, falling back to DB', { creatorId, err: err?.message });
  }

  const balance = await Creator.getBalance(creatorId);
  try {
    await setBalance(creatorId, balance);
  } catch (err) {
    logger.warn('Balance cache set after miss failed', { creatorId, err: err?.message });
  }
  return balance;
}

/**
 * Write balance to Redis (e.g. after scanner or payment processing).
 * @param {string} creatorId
 * @param {{ total_balance, unconfirmed_balance }|object} balance
 */
async function setBalance(creatorId, balance) {
  const key = balanceKey(creatorId);
  await redis.set(key, balance, 'EX', BALANCE_TTL_SEC);
}

/**
 * Invalidate cached balance so next read refetches from DB.
 * Call after payouts, manual balance changes, or when you know the balance changed.
 * @param {string} creatorId
 */
async function invalidateBalance(creatorId) {
  try {
    const key = balanceKey(creatorId);
    await redis.del(key);
  } catch (err) {
    logger.warn('Balance cache invalidate failed', { creatorId, err: err?.message });
  }
}

/**
 * Recompute balance from DB, update Redis, and return the new balance.
 * Used by the transaction scanner after new transactions.
 * @param {string} creatorId
 * @returns {Promise<{ total_balance, unconfirmed_balance }>}
 */
async function refreshBalance(creatorId) {
  const balance = await Creator.getBalance(creatorId);
  await setBalance(creatorId, balance);
  return balance;
}

module.exports = {
  getBalance,
  setBalance,
  invalidateBalance,
  refreshBalance
};
