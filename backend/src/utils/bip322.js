const bchjs = require('@psf/bch-js');
const crypto = require('crypto');

class BIP322 {
  constructor() {
    this.bchjs = new bchjs();
  }

  // Simple message signing verification for hackathon
  // In production, implement full BIP-322
  async verifySignature(address, message, signature) {
    try {
      // For hackathon demo, we'll use a simplified approach
      // In production, implement proper BIP-322 verification
      
      // Check if it's a valid BCH address
      if (!this.bchjs.Address.isCashAddress(address)) {
        return false;
      }

      // For demo purposes, we'll accept any signature from known wallets
      // and just verify the message matches expected format
      const expectedPrefix = 'BCH Paywall Router Login';
      if (!message.startsWith(expectedPrefix)) {
        return false;
      }

      // Extract timestamp from message
      const lines = message.split('\n');
      if (lines.length < 2) {
        return false;
      }

      const timestamp = parseInt(lines[1]);
      if (isNaN(timestamp)) {
        return false;
      }

      // Check if timestamp is recent (within 5 minutes)
      const now = Date.now();
      if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
        return false;
      }

      // For demo, we'll trust the signature
      // In production, verify using bchjs.ECPair or similar
      return true;
    } catch (error) {
      console.error('BIP-322 verification error:', error);
      return false;
    }
  }

  // Generate challenge message
  generateChallenge(address) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `BCH Paywall Router Login\n${timestamp}\n${nonce}\n${address}`;
  }

  // Extract address from message
  extractAddress(message) {
    const lines = message.split('\n');
    if (lines.length >= 4) {
      return lines[3]; // Address is on 4th line
    }
    return null;
  }
}

module.exports = new BIP322();
