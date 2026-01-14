const crypto = require('crypto');

/**
 * Generate a random alphanumeric ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
const generateRandomId = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
};

/**
 * Generate a random hex string
 * @param {number} length - Length in bytes
 * @returns {string} Hex string
 */
const generateRandomHex = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate API key
 * @returns {string} API key
 */
const generateApiKey = () => {
  return `bch_${generateRandomHex(32)}`;
};

module.exports = {
  generateRandomId,
  generateRandomHex,
  generateApiKey
};

