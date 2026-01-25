/**
 * Security configuration and runtime checks.
 * In production, required secrets must be set via environment variables.
 */
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Required env vars in production. App will not start if any are missing.
 */
const REQUIRED_IN_PRODUCTION = [
  'JWT_SECRET'
];

/**
 * Validate that required production env vars are set.
 * Call during app bootstrap (e.g. in server.js or app.initialize).
 */
function assertProductionSecrets() {
  if (!isProduction) return;
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');
  if (missing.length > 0) {
    logger.error('Missing required environment variables in production', { missing });
    throw new Error(`Security: Missing required env in production: ${missing.join(', ')}. Do not use default secrets.`);
  }
}

/**
 * Get JWT secret. In production must be set; in dev allow fallback only if explicitly allowed.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && String(secret).trim().length > 0) return secret.trim();
  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production');
  }
  // Development fallback – warn only
  logger.warn('Using default JWT secret. Set JWT_SECRET in production.');
  return 'dev-fallback-secret-change-in-production';
}

/**
 * Get allowed CORS origins. In production with credentials:true, avoid '*' for security.
 */
function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw && String(raw).trim().length > 0) {
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  }
  if (isProduction) {
    logger.warn('ALLOWED_ORIGINS not set in production. Consider restricting origins when using credentials.');
  }
  return ['*'];
}

/**
 * JWT expiration. Prefer env, then default 7d.
 */
function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

module.exports = {
  isProduction,
  assertProductionSecrets,
  getJwtSecret,
  getAllowedOrigins,
  getJwtExpiresIn
};
