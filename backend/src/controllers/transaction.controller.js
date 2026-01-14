const Transaction = require('../models/Transaction');
const Creator = require('../models/Creator');
const MicropaymentService = require('../services/micropayment.service');
const logger = require('../utils/logger');
const { NotFoundError, AppError } = require('../utils/errors');

class TransactionController {
  // Get transactions for creator
  async getTransactions(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { limit = 50, offset = 0, confirmedOnly = false } = req.query;

      const transactions = await Transaction.findByCreator(creatorId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        confirmedOnly: confirmedOnly === 'true'
      });

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  }

  // Get transaction by ID
  async getTransaction(req, res, next) {
    try {
      const { txid } = req.params;
      const creatorId = req.creator.creator_id;

      const transaction = await Transaction.findByTxid(txid);
      
      if (!transaction) {
        throw new NotFoundError('Transaction');
      }

      // Verify ownership
      if (transaction.creator_id !== creatorId) {
        throw new AppError('Not authorized to view this transaction', 403);
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  // Get transaction stats
  async getStats(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { period = '30d' } = req.query;

      // Calculate date range
      let startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'all':
          startDate = null;
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const stats = await Transaction.getStats(
        creatorId,
        startDate,
        period === 'all' ? null : new Date()
      );

      // Get micro-payment stats
      const micropaymentStats = await MicropaymentService.getMicropaymentStats(
        creatorId,
        startDate,
        period === 'all' ? null : new Date()
      );

      res.json({
        success: true,
        data: {
          ...stats,
          micropayments: micropaymentStats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get micro-payment analytics
  async getMicropaymentStats(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { period = '30d' } = req.query;

      // Calculate date range
      let startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'all':
          startDate = null;
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const stats = await MicropaymentService.getMicropaymentStats(
        creatorId,
        startDate,
        period === 'all' ? null : new Date()
      );

      // Get recommendations
      const recommendations = await MicropaymentService.getRecommendations(creatorId);

      res.json({
        success: true,
        data: {
          stats,
          recommendations: recommendations.recommendations,
          batchSummary: recommendations.batchSummary
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get batchable payments
  async getBatchablePayments(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { limit = 10 } = req.query;

      const batchablePayments = await MicropaymentService.getBatchablePayments(
        creatorId,
        parseInt(limit)
      );

      const batchSummary = batchablePayments.length > 0
        ? MicropaymentService.calculateBatchSummary(batchablePayments)
        : null;

      res.json({
        success: true,
        data: {
          payments: batchablePayments,
          batchSummary
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Analyze payment efficiency
  async analyzePaymentEfficiency(req, res, next) {
    try {
      const { amountSats, feeSats } = req.body;

      if (!amountSats) {
        throw new AppError('Amount is required', 400);
      }

      const BCHService = require('../services/bch.service');
      const estimatedFee = feeSats || BCHService.estimateFee().sats;
      
      const analysis = MicropaymentService.analyzePaymentEfficiency(amountSats, estimatedFee);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransactionController();
