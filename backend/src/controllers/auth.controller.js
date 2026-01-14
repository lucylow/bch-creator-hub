const jwt = require('jsonwebtoken');
const bip322 = require('../utils/bip322');
const Creator = require('../models/Creator');
const { ValidationError, AuthenticationError } = require('../utils/errors');

class AuthController {
  // Wallet authentication
  async authenticate(req, res, next) {
    try {
      const { address, signature, message } = req.body;

      if (!address || !signature || !message) {
        throw new ValidationError('Missing authentication parameters');
      }

      // Verify signature
      const isValid = await bip322.verifySignature(address, message, signature);
      if (!isValid) {
        throw new AuthenticationError('Invalid signature');
      }

      // Find or create creator
      let creator = await Creator.findByWalletAddress(address);
      
      if (!creator) {
        const displayName = `Creator_${address.slice(-6)}`;
        
        creator = await Creator.create({
          walletAddress: address,
          pubKeyHex: signature.slice(0, 130), // Simplified for demo
          displayName,
          feeBasisPoints: 100
        });
      }

      // Update last login
      await Creator.updateLastLogin(creator.creator_id);

      // Generate JWT token
      const token = jwt.sign(
        {
          creatorId: creator.creator_id,
          address: creator.wallet_address,
          isVerified: creator.is_verified
        },
        process.env.JWT_SECRET || 'hackathon-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        data: {
          creator: {
            creator_id: creator.creator_id,
            wallet_address: creator.wallet_address,
            display_name: creator.display_name,
            contract_address: creator.contract_address,
            is_verified: creator.is_verified
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get challenge for signing
  async getChallenge(req, res, next) {
    try {
      const { address } = req.query;

      if (!address) {
        throw new ValidationError('Address is required');
      }

      const challenge = bip322.generateChallenge(address);

      res.json({
        success: true,
        data: {
          challenge,
          expiresIn: 300 // 5 minutes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify token
  async verify(req, res, next) {
    try {
      const creator = req.creator;

      res.json({
        success: true,
        data: {
          creator: {
            creator_id: creator.creator_id,
            wallet_address: creator.wallet_address,
            display_name: creator.display_name,
            contract_address: creator.contract_address,
            is_verified: creator.is_verified
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
