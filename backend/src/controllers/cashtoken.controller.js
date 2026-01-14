/**
 * CashToken Controller
 * 
 * Handles API requests for CashToken operations
 */

const CashTokenService = require('../services/cashtoken.service');
const CashTokenUtils = require('../utils/cashtoken');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

class CashTokenController {
  /**
   * Get tokens owned by an address
   * GET /api/cashtokens/owner/:address
   */
  async getTokensByOwner(req, res, next) {
    try {
      const { address } = req.params;
      const { categoryId } = req.query;

      if (!address) {
        throw new ValidationError('Address is required');
      }

      const tokens = await CashTokenService.getTokensByOwner(address, categoryId || null);

      res.json({
        success: true,
        data: {
          address,
          tokens,
          count: tokens.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify token ownership
   * GET /api/cashtokens/verify/:address/:categoryId
   */
  async verifyOwnership(req, res, next) {
    try {
      const { address, categoryId } = req.params;
      const { tokenId } = req.query;

      if (!address || !categoryId) {
        throw new ValidationError('Address and category ID are required');
      }

      const owns = await CashTokenService.verifyOwnership(
        address,
        categoryId,
        tokenId || null
      );

      res.json({
        success: true,
        data: {
          address,
          categoryId,
          tokenId: tokenId || null,
          owns
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check subscription validity
   * GET /api/cashtokens/subscription/:address/:categoryId/:tokenId
   */
  async checkSubscription(req, res, next) {
    try {
      const { address, categoryId, tokenId } = req.params;

      if (!address || !categoryId || !tokenId) {
        throw new ValidationError('Address, category ID, and token ID are required');
      }

      const validity = await CashTokenService.checkSubscriptionValidity(
        address,
        categoryId,
        tokenId
      );

      res.json({
        success: true,
        data: {
          address,
          categoryId,
          tokenId,
          ...validity
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get token details
   * GET /api/cashtokens/:categoryId
   */
  async getTokenDetails(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { tokenId } = req.query;

      if (!categoryId) {
        throw new ValidationError('Category ID is required');
      }

      const token = await CashTokenService.getTokenDetails(categoryId, tokenId || null);

      if (!token) {
        throw new NotFoundError('Token not found');
      }

      res.json({
        success: true,
        data: token
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mint NFT (queues minting)
   * POST /api/cashtokens/mint
   * Requires authentication
   */
  async mintNFT(req, res, next) {
    try {
      const { categoryId, recipientAddress, commitment, metadata } = req.body;
      const creatorId = req.creator?.creator_id;

      if (!creatorId) {
        throw new ValidationError('Creator authentication required');
      }

      if (!categoryId || !recipientAddress) {
        throw new ValidationError('Category ID and recipient address are required');
      }

      const result = await CashTokenService.mintNFT({
        creatorId,
        categoryId,
        recipientAddress,
        commitment,
        metadata: metadata || {}
      });

      logger.info(`NFT mint queued by creator ${creatorId}:`, {
        tokenId: result.tokenId,
        recipientAddress
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get creator's subscription tokens
   * GET /api/cashtokens/creator/subscriptions
   * Requires authentication
   */
  async getCreatorSubscriptionTokens(req, res, next) {
    try {
      const creatorId = req.creator?.creator_id;

      if (!creatorId) {
        throw new ValidationError('Creator authentication required');
      }

      const tokens = await CashTokenService.getCreatorSubscriptionTokens(creatorId);

      res.json({
        success: true,
        data: {
          creatorId,
          tokens,
          count: tokens.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Parse tokens from transaction
   * POST /api/cashtokens/parse
   */
  async parseTransactionTokens(req, res, next) {
    try {
      const { transaction } = req.body;

      if (!transaction) {
        throw new ValidationError('Transaction data is required');
      }

      const tokens = CashTokenUtils.extractTokensFromTransaction(transaction);

      res.json({
        success: true,
        data: {
          tokens,
          count: tokens.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CashTokenController();



