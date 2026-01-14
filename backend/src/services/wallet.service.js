const BCHJS = require('@psf/bch-js');
const logger = require('../utils/logger');

class WalletService {
  constructor() {
    this.bchjs = new BCHJS({
      restURL: process.env.BCH_REST_URL || 'https://api.fullstack.cash/v5/',
      apiToken: process.env.BCH_API_TOKEN
    });
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
      logger.error('Error generating wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet info from private key
   */
  async getWalletFromPrivateKey(privateKeyWIF) {
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
      logger.error('Error getting wallet from private key:', error);
      throw error;
    }
  }

  /**
   * Sign message with private key (for BIP-322)
   */
  async signMessage(privateKeyWIF, message) {
    try {
      const ecPair = this.bchjs.ECPair.fromWIF(privateKeyWIF);
      const signature = this.bchjs.BitcoinCash.signMessage(ecPair, message);
      return signature;
    } catch (error) {
      logger.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Validate address format
   */
  validateAddress(address) {
    try {
      return this.bchjs.Address.isCashAddress(address);
    } catch {
      return false;
    }
  }
}

module.exports = new WalletService();
