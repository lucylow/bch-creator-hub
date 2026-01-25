/**
 * Centralized Redis cache key builders and TTLs.
 * Use these constants everywhere to keep balance and session caching consistent.
 */

/** TTL in seconds for creator balance cache (5 min) */
const BALANCE_TTL_SEC = 300;

/** TTL in seconds for creator session/profile cache (5 min) */
const SESSION_TTL_SEC = 300;

const PREFIX_BALANCE = 'creator:';
const SUFFIX_BALANCE = ':balance';
const PREFIX_SESSION = 'creator:session:';

/**
 * @param {string} creatorId
 * @returns {string} Redis key for creator balance
 */
function balanceKey(creatorId) {
  return `${PREFIX_BALANCE}${creatorId}${SUFFIX_BALANCE}`;
}

/**
 * Glob pattern to match all creator balance keys (for SCAN / invalidatePattern).
 * @returns {string}
 */
function balancePattern() {
  return `${PREFIX_BALANCE}*${SUFFIX_BALANCE}`;
}

/**
 * @param {string} creatorId
 * @returns {string} Redis key for creator session (cached profile for auth)
 */
function sessionKey(creatorId) {
  return `${PREFIX_SESSION}${creatorId}`;
}

/**
 * Glob pattern for all creator session keys.
 * @returns {string}
 */
function sessionPattern() {
  return `${PREFIX_SESSION}*`;
}

module.exports = {
  BALANCE_TTL_SEC,
  SESSION_TTL_SEC,
  balanceKey,
  balancePattern,
  sessionKey,
  sessionPattern
};
