const BCHJS = require('@psf/bch-js');
const logger = require('../utils/logger');
const { ValidationError, AppError, ConfigurationError } = require('../utils/errors');

class WalletService {
  constructor() {
    try {
      this.bchjs = new BCHJS({
        restURL: process.env.BCH_REST_URL || 'https://api.fullstack.cash/v5/',
        apiToken: process.env.BCH_API_TOKEN
      });
    } catch (error) {
      logger.error('Error initializing BCHJS:', error);
      throw new ConfigurationError('Failed to initialize BCH library', {
        context: { error: error.message }
      });
    }
  }

  /**
   * Generate a new wallet (for testing/demo purposes only)
   * In production, users should use their own wallets
   */
  generateWallet() {
    try {
      const mnemonic = this.bchjs.Mnemonic.generate(128); // 12 word mnemonic
      const rootSeed = this.bchjs.Mnemonic.toSeed(mnemonic);
      const masterHDNode = this.bchjs.HDNode.fromSeed(rootSeed);
      const childNode = masterHDNode.derivePath("m/44'/145'/0'/0/0");
      const cashAddress = this.bchjs.HDNode.toCashAddress(childNode);
      const privateKey = this.bchjs.HDNode.toWIF(childNode);
      const publicKey = this.bchjs.HDNode.toPublicKey(childNode);

      return {
        mnemonic,
        cashAddress,
        privateKey,
        publicKey: publicKey.toString('hex'),
        slpAddress: this.bchjs.HDNode.toSLPAddress(childNode)
      };
    } catch (error) {
      logger.error('Error generating wallet:', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      });
      throw new AppError('Failed to generate wallet', 500, {
        context: { error: error.message },
        isOperational: false
      });
    }
  }

  /**
   * Get wallet info from private key
   */
  async getWalletFromPrivateKey(privateKeyWIF) {
    if (!privateKeyWIF || typeof privateKeyWIF !== 'string') {
      throw new ValidationError('Private key must be a valid WIF string');
    }

    try {
      const ecPair = this.bchjs.ECPair.fromWIF(privateKeyWIF);
      const cashAddress = this.bchjs.ECPair.toCashAddress(ecPair);
      const publicKey = ecPair.publicKey.toString('hex');

      return {
        cashAddress,
        privateKey: privateKeyWIF,
        publicKey
      };
    } catch (error) {
      logger.error('Error getting wallet from private key:', {
        error: {
          name: error.name,
          message: error.message
        }
      });
      
      if (error.message?.includes('Invalid') || error.message?.includes('WIF')) {
        throw new ValidationError('Invalid private key format', {
          context: { error: error.message }
        });
      }
      
      throw new AppError('Failed to extract wallet from private key', 500, {
        context: { error: error.message },
        isOperational: false
      });
    }
  }

  /**
   * Sign message with private key (for BIP-322)
   */
  async signMessage(privateKeyWIF, message) {
    if (!privateKeyWIF || typeof privateKeyWIF !== 'string') {
      throw new ValidationError('Private key must be a valid WIF string');
    }

    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message must be a non-empty string');
    }

    try {
      const ecPair = this.bchjs.ECPair.fromWIF(privateKeyWIF);
      const signature = this.bchjs.BitcoinCash.signMessage(ecPair, message);
      
      if (!signature) {
        throw new AppError('Failed to generate signature', 500);
      }
      
      return signature;
    } catch (error) {
      logger.error('Error signing message:', {
        error: {
          name: error.name,
          message: error.message
        }
      });
      
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      
      if (error.message?.includes('Invalid') || error.message?.includes('WIF')) {
        throw new ValidationError('Invalid private key format for signing', {
          context: { error: error.message }
        });
      }
      
      throw new AppError('Failed to sign message', 500, {
        context: { error: error.message },
        isOperational: false
      });
    }
  }

  /**
   * Validate address format
   */
  validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }

    try {
      return this.bchjs.Address.isCashAddress(address);
    } catch (error) {
      logger.warn('Address validation error:', {
        address,
        error: error.message
      });
      return false;
    }
  }
}

module.exports = new WalletService();
