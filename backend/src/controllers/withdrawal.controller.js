const WithdrawalService = require('../services/withdrawal.service');
const Withdrawal = require('../models/Withdrawal');
const { validationResult } = require('express-validator');
const { ValidationError, NotFoundError, AppError } = require('../utils/errors');

class WithdrawalController {
  // Get withdrawal preview/calculation
  async getWithdrawalPreview(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { amountSats } = req.query;

      if (!amountSats || isNaN(parseInt(amountSats))) {
        throw new ValidationError('Invalid amount');
      }

      const preview = await WithdrawalService.getWithdrawalPreview(
        creatorId,
        parseInt(amountSats)
      );

      res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      next(error);
    }
  }

  // Create withdrawal
  async createWithdrawal(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid withdrawal data', errors.array());
      }

      const creatorId = req.creator.creator_id;
      const { amountSats, toAddress, includeServiceFee } = req.body;

      // Calculate withdrawal amounts
      const calculation = await WithdrawalService.calculateWithdrawal({
        creatorId,
        totalSats: amountSats,
        includeServiceFee
      });

      // Create withdrawal record
      const withdrawal = await WithdrawalService.createWithdrawal({
        creatorId,
        amountSats: calculation.payoutSats,
        feeSats: calculation.serviceSats,
        toAddress,
        metadata: {
          calculation,
          tier: calculation.tier,
          feeType: calculation.feeType
        }
      });

      res.json({
        success: true,
        data: {
          withdrawal,
          calculation: {
            breakdown: calculation.breakdown,
            feeInfo: {
              type: calculation.feeType,
              basisPoints: calculation.feeBasisPoints
            }
          }
        },
        message: 'Withdrawal created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get withdrawal history
  async getWithdrawals(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { limit = 50, offset = 0, status } = req.query;

      const withdrawals = await Withdrawal.findByCreator(creatorId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status
      });

      res.json({
        success: true,
        data: withdrawals
      });
    } catch (error) {
      next(error);
    }
  }

  // Get withdrawal by ID
  async getWithdrawal(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { id } = req.params;

      const withdrawal = await Withdrawal.findById(id);
      if (!withdrawal) {
        throw new NotFoundError('Withdrawal');
      }

      if (withdrawal.creator_id !== creatorId) {
        throw new AppError('Not authorized', 403);
      }

      res.json({
        success: true,
        data: withdrawal
      });
    } catch (error) {
      next(error);
    }
  }

  // Update fee opt-in preference
  async updateFeeOptIn(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { optIn } = req.body;

      if (typeof optIn !== 'boolean') {
        throw new ValidationError('optIn must be a boolean');
      }

      await WithdrawalService.updateFeeOptIn(creatorId, optIn);

      res.json({
        success: true,
        message: `Fee opt-in ${optIn ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WithdrawalController();
