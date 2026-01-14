const bchjs = require('@psf/bch-js');

const bchService = new bchjs();

/**
 * Validate BCH address
 */
const validateBchAddress = (address) => {
  try {
    return bchService.Address.isCashAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Validate transaction ID
 */
const validateTxid = (txid) => {
  if (!txid || typeof txid !== 'string') {
    return false;
  }
  // Bitcoin Cash txids are 64 character hex strings
  return /^[a-fA-F0-9]{64}$/.test(txid);
};

/**
 * Validate amount in satoshis
 */
const validateAmount = (amount) => {
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    return false;
  }
  const amountNum = typeof amount === 'string' ? parseInt(amount, 10) : amount;
  return amountNum > 0 && amountNum <= 2100000000000000; // Max BCH supply in sats
};

/**
 * Validate creator ID format
 */
const validateCreatorId = (creatorId) => {
  if (!creatorId || typeof creatorId !== 'string') {
    return false;
  }
  return creatorId.length === 16 && /^[A-Za-z0-9]+$/.test(creatorId);
};

/**
 * Validate payment intent ID format
 */
const validateIntentId = (intentId) => {
  if (!intentId || typeof intentId !== 'string') {
    return false;
  }
  return intentId.length === 16 && /^[A-Za-z0-9]+$/.test(intentId);
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  validateBchAddress,
  validateTxid,
  validateAmount,
  validateCreatorId,
  validateIntentId,
  validateEmail,
  validateUrl
};
