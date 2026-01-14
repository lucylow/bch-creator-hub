/**
 * CashToken Utilities
 * 
 * Utilities for parsing, encoding, and working with BCH CashTokens (BCH-2023-02)
 * CashTokens use OP_RETURN outputs with specific encoding for token data
 */

const logger = require('./logger');

class CashTokenUtils {
  /**
   * Parse CashToken data from transaction output
   * CashTokens are encoded in OP_RETURN or in token-bearing outputs
   * 
   * @param {Object} output - Transaction output object from indexer
   * @returns {Object|null} Parsed token data or null if not a token output
   */
  static parseTokenOutput(output) {
    try {
      if (!output || !output.scriptPubKey || !output.scriptPubKey.hex) {
        return null;
      }

      const scriptHex = output.scriptPubKey.hex;
      
      // Check for token-bearing output (has token prefix)
      // BCH-2023-02 CashToken format: OP_1 <category_id> <token_id> <amount> <commitment>
      if (scriptHex.startsWith('51')) { // OP_1
        return this.parseTokenBearingOutput(scriptHex, output);
      }

      // Check for token genesis output (OP_GROUP)
      if (scriptHex.startsWith('59')) { // OP_GROUP (0x59)
        return this.parseGenesisOutput(scriptHex, output);
      }

      return null;
    } catch (error) {
      logger.error('Error parsing token output:', error);
      return null;
    }
  }

  /**
   * Parse token-bearing output
   * Format: OP_1 <category_id (20 bytes)> <nft_id (32 bytes) or fungible_amount> <commitment>
   */
  static parseTokenBearingOutput(scriptHex, output) {
    try {
      const bytes = Buffer.from(scriptHex, 'hex');
      let offset = 2; // Skip OP_1 (0x51) and length byte

      if (offset >= bytes.length) return null;

      // Read category ID (20 bytes)
      if (offset + 20 > bytes.length) return null;
      const categoryId = bytes.slice(offset, offset + 20);
      offset += 20;

      // Check if this is NFT (has token ID) or fungible (has amount)
      // NFT: category + 32-byte token ID + commitment
      // Fungible: category + amount (8 bytes) + commitment
      
      // Try NFT format first (token ID is 32 bytes)
      if (offset + 32 <= bytes.length) {
        const tokenId = bytes.slice(offset, offset + 32);
        offset += 32;

        // Remaining bytes are commitment
        const commitment = offset < bytes.length ? bytes.slice(offset) : Buffer.alloc(0);

        return {
          type: 'NFT',
          categoryId: categoryId.toString('hex'),
          tokenId: tokenId.toString('hex'),
          commitment: commitment.toString('hex'),
          amount: null,
          outputIndex: output.n || 0,
          satoshis: output.value ? Math.round(output.value * 1e8) : 0
        };
      }

      // Try fungible format (amount is 8 bytes, little-endian)
      if (offset + 8 <= bytes.length) {
        const amountBytes = bytes.slice(offset, offset + 8);
        const amount = amountBytes.readBigUInt64LE(0);
        offset += 8;

        const commitment = offset < bytes.length ? bytes.slice(offset) : Buffer.alloc(0);

        return {
          type: 'FUNGIBLE',
          categoryId: categoryId.toString('hex'),
          tokenId: null,
          commitment: commitment.toString('hex'),
          amount: amount.toString(),
          outputIndex: output.n || 0,
          satoshis: output.value ? Math.round(output.value * 1e8) : 0
        };
      }

      return null;
    } catch (error) {
      logger.error('Error parsing token-bearing output:', error);
      return null;
    }
  }

  /**
   * Parse token genesis output (OP_GROUP)
   * Format: OP_GROUP <category_id>
   */
  static parseGenesisOutput(scriptHex, output) {
    try {
      const bytes = Buffer.from(scriptHex, 'hex');
      let offset = 2; // Skip OP_GROUP and length

      if (offset + 20 > bytes.length) return null;

      const categoryId = bytes.slice(offset, offset + 20);

      return {
        type: 'GENESIS',
        categoryId: categoryId.toString('hex'),
        tokenId: null,
        commitment: null,
        amount: null,
        outputIndex: output.n || 0,
        satoshis: output.value ? Math.round(output.value * 1e8) : 0
      };
    } catch (error) {
      logger.error('Error parsing genesis output:', error);
      return null;
    }
  }

  /**
   * Extract all CashTokens from a transaction
   * @param {Object} transaction - Full transaction object from indexer
   * @returns {Array} Array of parsed token objects
   */
  static extractTokensFromTransaction(transaction) {
    const tokens = [];

    if (!transaction || !transaction.vout) {
      return tokens;
    }

    for (const output of transaction.vout) {
      const tokenData = this.parseTokenOutput(output);
      if (tokenData) {
        tokenData.txid = transaction.txid;
        tokenData.blockHeight = transaction.blockHeight;
        tokenData.timestamp = transaction.blockTime || Date.now() / 1000;
        tokens.push(tokenData);
      }
    }

    return tokens;
  }

  /**
   * Check if an output contains a specific token
   * @param {Object} output - Transaction output
   * @param {String} categoryId - Token category ID (hex)
   * @param {String} tokenId - Token ID for NFT (hex, optional)
   * @returns {Boolean}
   */
  static outputHasToken(output, categoryId, tokenId = null) {
    const tokenData = this.parseTokenOutput(output);
    if (!tokenData) return false;

    if (tokenData.categoryId.toLowerCase() !== categoryId.toLowerCase()) {
      return false;
    }

    if (tokenId && tokenData.tokenId) {
      return tokenData.tokenId.toLowerCase() === tokenId.toLowerCase();
    }

    return true;
  }

  /**
   * Generate token category ID from commitment
   * Category ID is the hash160 of the genesis commitment
   * 
   * @param {String|Buffer} commitment - Genesis commitment data
   * @returns {String} Category ID (hex)
   */
  static generateCategoryId(commitment) {
    const crypto = require('crypto');
    const buf = Buffer.isBuffer(commitment) ? commitment : Buffer.from(commitment, 'hex');
    
    // Hash160 = RIPEMD160(SHA256(data))
    const sha256 = crypto.createHash('sha256').update(buf).digest();
    const ripemd160 = crypto.createHash('ripemd160').update(sha256).digest();
    
    return ripemd160.toString('hex');
  }

  /**
   * Generate unique NFT token ID
   * @param {String} categoryId - Token category ID
   * @param {String} genesisTxid - Genesis transaction ID
   * @param {Number} outputIndex - Output index in genesis transaction
   * @returns {String} Token ID (hex)
   */
  static generateNFTTokenId(categoryId, genesisTxid, outputIndex) {
    const crypto = require('crypto');
    const data = `${categoryId}${genesisTxid}${outputIndex}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Encode commitment data for subscription expiration
   * @param {Number} expirationTimestamp - Unix timestamp
   * @returns {Buffer} Encoded commitment
   */
  static encodeExpirationCommitment(expirationTimestamp) {
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigUInt64BE(BigInt(Math.floor(expirationTimestamp)), 0);
    return buf;
  }

  /**
   * Decode expiration timestamp from commitment
   * @param {String|Buffer} commitment - Commitment bytes (hex or Buffer)
   * @returns {Number|null} Unix timestamp or null if invalid
   */
  static decodeExpirationCommitment(commitment) {
    try {
      const buf = Buffer.isBuffer(commitment) ? commitment : Buffer.from(commitment, 'hex');
      if (buf.length < 8) return null;
      return Number(buf.readBigUInt64BE(0));
    } catch (error) {
      logger.error('Error decoding expiration commitment:', error);
      return null;
    }
  }

  /**
   * Validate token structure
   * @param {Object} tokenData - Parsed token data
   * @returns {Boolean}
   */
  static validateTokenData(tokenData) {
    if (!tokenData || !tokenData.categoryId) return false;
    
    if (tokenData.type === 'NFT') {
      return tokenData.tokenId && tokenData.tokenId.length === 64; // 32 bytes = 64 hex chars
    }
    
    if (tokenData.type === 'FUNGIBLE') {
      return tokenData.amount && BigInt(tokenData.amount) > 0n;
    }
    
    return true;
  }

  /**
   * Format token ID for display
   * @param {String} tokenId - Full token ID (hex)
   * @returns {String} Shortened format
   */
  static formatTokenId(tokenId) {
    if (!tokenId || tokenId.length < 12) return tokenId;
    return `${tokenId.slice(0, 6)}...${tokenId.slice(-6)}`;
  }

  /**
   * Get token amount as string (for fungible tokens)
   * @param {String|BigInt} amount - Token amount
   * @param {Number} decimals - Token decimals (default 0 for NFTs)
   * @returns {String}
   */
  static formatTokenAmount(amount, decimals = 0) {
    try {
      const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
      if (decimals === 0) return amountBigInt.toString();
      
      const divisor = BigInt(10 ** decimals);
      const whole = amountBigInt / divisor;
      const fraction = amountBigInt % divisor;
      
      if (fraction === 0n) return whole.toString();
      
      const fractionStr = fraction.toString().padStart(decimals, '0');
      return `${whole}.${fractionStr}`;
    } catch (error) {
      logger.error('Error formatting token amount:', error);
      return amount.toString();
    }
  }
}

module.exports = CashTokenUtils;



