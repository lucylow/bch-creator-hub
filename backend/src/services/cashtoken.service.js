/**
 * CashToken Service
 * 
 * Service for managing CashToken operations: minting, transferring, verifying
 */

const BCHService = require('./bch.service');
const CashTokenUtils = require('../utils/cashtoken');
const CashToken = require('../models/CashToken');
const logger = require('../utils/logger');
const { AppError, ExternalServiceError } = require('../utils/errors');

class CashTokenService {
  /**
   * Mint a new CashToken NFT
   * @param {Object} params - Minting parameters
   * @param {String} params.creatorId - Creator ID
   * @param {String} params.categoryId - Token category ID (hex)
   * @param {String} params.recipientAddress - Address to receive the NFT
   * @param {Buffer|String} params.commitment - Commitment data (for subscription expiration, etc.)
   * @param {Number} params.metadata - Optional metadata to store
   * @returns {Promise<Object>} Transaction details
   */
  static async mintNFT({
    creatorId,
    categoryId,
    recipientAddress,
    commitment,
    metadata = {}
  }) {
    try {
      // Validate inputs
      if (!categoryId || categoryId.length !== 40) {
        throw new AppError('Invalid category ID', 400);
      }

      if (!recipientAddress || !BCHService.validateAddress(recipientAddress)) {
        throw new AppError('Invalid recipient address', 400);
      }

      // Generate unique token ID
      const genesisTxid = metadata.genesisTxid || '0000000000000000000000000000000000000000000000000000000000000000';
      const outputIndex = metadata.outputIndex || 0;
      const tokenId = CashTokenUtils.generateNFTTokenId(categoryId, genesisTxid, outputIndex);

      // Store token metadata in database
      const tokenRecord = await CashToken.create({
        creatorId,
        categoryId,
        tokenId,
        type: 'NFT',
        ownerAddress: recipientAddress,
        commitment: Buffer.isBuffer(commitment) ? commitment.toString('hex') : commitment,
        metadata,
        status: 'pending_mint'
      });

      logger.info(`NFT mint queued: ${tokenId} for creator ${creatorId}`);

      return {
        success: true,
        tokenId,
        categoryId,
        recipientAddress,
        tokenRecord
      };
    } catch (error) {
      logger.error('Error minting NFT:', error);
      throw error;
    }
  }

  /**
   * Verify token ownership
   * @param {String} address - Address to check
   * @param {String} categoryId - Token category ID
   * @param {String} tokenId - Token ID (for NFT)
   * @returns {Promise<Boolean>}
   */
  static async verifyOwnership(address, categoryId, tokenId = null) {
    try {
      // Check database first
      const token = await CashToken.findByOwnerAndCategory(address, categoryId, tokenId);
      if (token && token.status === 'active') {
        return true;
      }

      // Verify on-chain by checking UTXOs
      const utxos = await BCHService.getUtxos(address);
      
      for (const utxo of utxos) {
        const tokenData = CashTokenUtils.parseTokenOutput(utxo);
        if (tokenData) {
          if (tokenData.categoryId.toLowerCase() === categoryId.toLowerCase()) {
            if (!tokenId || (tokenData.tokenId && tokenData.tokenId.toLowerCase() === tokenId.toLowerCase())) {
              // Update database if found on-chain
              if (!token) {
                await CashToken.create({
                  categoryId: tokenData.categoryId,
                  tokenId: tokenData.tokenId,
                  type: tokenData.type,
                  ownerAddress: address,
                  commitment: tokenData.commitment,
                  status: 'active',
                  txid: utxo.txid,
                  outputIndex: utxo.vout || 0
                });
              }
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('Error verifying ownership:', error);
      return false;
    }
  }

  /**
   * Get all tokens owned by an address
   * @param {String} address - Address to query
   * @param {String} categoryId - Optional category filter
   * @returns {Promise<Array>}
   */
  static async getTokensByOwner(address, categoryId = null) {
    try {
      // Get from database
      const dbTokens = await CashToken.findByOwner(address, categoryId);

      // Also check on-chain for any missing tokens
      const utxos = await BCHService.getUtxos(address);
      const onChainTokens = [];

      for (const utxo of utxos) {
        const tokenData = CashTokenUtils.parseTokenOutput(utxo);
        if (tokenData) {
          if (!categoryId || tokenData.categoryId.toLowerCase() === categoryId.toLowerCase()) {
            onChainTokens.push({
              ...tokenData,
              address
            });
          }
        }
      }

      // Merge and deduplicate
      const allTokens = [...dbTokens];
      for (const token of onChainTokens) {
        const exists = dbTokens.find(
          t => t.tokenId === token.tokenId && t.categoryId === token.categoryId
        );
        if (!exists) {
          allTokens.push(token);
        }
      }

      return allTokens;
    } catch (error) {
      logger.error('Error getting tokens by owner:', error);
      throw error;
    }
  }

  /**
   * Get token details
   * @param {String} categoryId - Token category ID
   * @param {String} tokenId - Token ID (for NFT)
   * @returns {Promise<Object|null>}
   */
  static async getTokenDetails(categoryId, tokenId = null) {
    try {
      const token = await CashToken.findByCategoryAndToken(categoryId, tokenId);
      return token;
    } catch (error) {
      logger.error('Error getting token details:', error);
      throw error;
    }
  }

  /**
   * Check if subscription NFT is valid (not expired)
   * @param {String} address - Token owner address
   * @param {String} categoryId - Subscription token category ID
   * @param {String} tokenId - Token ID
   * @returns {Promise<Object>} { valid: boolean, expiration: number|null }
   */
  static async checkSubscriptionValidity(address, categoryId, tokenId) {
    try {
      const token = await CashToken.findByOwnerAndCategory(address, categoryId, tokenId);
      
      if (!token || token.status !== 'active') {
        return { valid: false, expiration: null };
      }

      // Decode expiration from commitment
      if (token.commitment) {
        const expiration = CashTokenUtils.decodeExpirationCommitment(token.commitment);
        if (expiration) {
          const now = Math.floor(Date.now() / 1000);
          return {
            valid: expiration > now,
            expiration,
            expiresIn: expiration > now ? expiration - now : 0
          };
        }
      }

      return { valid: true, expiration: null };
    } catch (error) {
      logger.error('Error checking subscription validity:', error);
      return { valid: false, expiration: null };
    }
  }

  /**
   * Process token transfer from transaction
   * Updates database when tokens are transferred
   * @param {Object} transaction - Transaction object
   * @returns {Promise<Array>} Array of processed token transfers
   */
  static async processTokenTransfers(transaction) {
    try {
      const tokens = CashTokenUtils.extractTokensFromTransaction(transaction);
      const transfers = [];

      for (const token of tokens) {
        // Find token inputs (being spent)
        if (transaction.vin) {
          for (const input of transaction.vin) {
            // Update spent status in database
            if (input.txid && input.vout !== undefined) {
              await CashToken.markAsSpent(input.txid, input.vout);
            }
          }
        }

        // Find token outputs (new ownership)
        if (token.type === 'NFT' || token.type === 'FUNGIBLE') {
          // Extract recipient address from output
          const output = transaction.vout[token.outputIndex];
          let recipientAddress = null;

          if (output && output.scriptPubKey && output.scriptPubKey.addresses) {
            recipientAddress = output.scriptPubKey.addresses[0];
          }

          if (recipientAddress) {
            // Create or update token record
            const existingToken = await CashToken.findByCategoryAndToken(
              token.categoryId,
              token.tokenId
            );

            if (existingToken) {
              // Update ownership
              await CashToken.update(existingToken.id, {
                ownerAddress: recipientAddress,
                txid: token.txid,
                outputIndex: token.outputIndex,
                status: 'active'
              });
            } else {
              // Create new record
              await CashToken.create({
                categoryId: token.categoryId,
                tokenId: token.tokenId,
                type: token.type,
                ownerAddress: recipientAddress,
                commitment: token.commitment,
                status: 'active',
                txid: token.txid,
                outputIndex: token.outputIndex
              });
            }

            transfers.push({
              tokenId: token.tokenId,
              categoryId: token.categoryId,
              from: null, // Could be determined from inputs
              to: recipientAddress,
              txid: token.txid
            });
          }
        }
      }

      return transfers;
    } catch (error) {
      logger.error('Error processing token transfers:', error);
      throw error;
    }
  }

  /**
   * Get subscription tokens for a creator
   * @param {String} creatorId - Creator ID
   * @returns {Promise<Array>}
   */
  static async getCreatorSubscriptionTokens(creatorId) {
    try {
      return await CashToken.findByCreator(creatorId, 'NFT');
    } catch (error) {
      logger.error('Error getting creator subscription tokens:', error);
      throw error;
    }
  }
}

module.exports = CashTokenService;



