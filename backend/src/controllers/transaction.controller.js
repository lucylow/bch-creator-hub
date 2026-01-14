const Transaction = require('../models/Transaction');
const Creator = require('../models/Creator');
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

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransactionController();
