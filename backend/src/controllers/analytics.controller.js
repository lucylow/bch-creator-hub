const Creator = require('../models/Creator');
const Transaction = require('../models/Transaction');
const PaymentIntent = require('../models/PaymentIntent');
const balanceCache = require('../services/balanceCache.service');

class AnalyticsController {
  // Get comprehensive analytics
  async getAnalytics(req, res, next) {
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

      const [balance, creatorStats, transactionStats, paymentIntentStats] = await Promise.all([
        balanceCache.getBalance(creatorId),
        Creator.getStats(creatorId, startDate, period === 'all' ? null : new Date()),
        Transaction.getStats(creatorId, startDate, period === 'all' ? null : new Date()),
        PaymentIntent.getStats(creatorId)
      ]);

      // Calculate growth metrics
      const growthMetrics = await this.calculateGrowthMetrics(creatorId, period);

      res.json({
        success: true,
        data: {
          balance,
          creator: creatorStats,
          transactions: transactionStats,
          paymentIntents: paymentIntentStats,
          growth: growthMetrics
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async calculateGrowthMetrics(_creatorId, _period) {
    // Simplified for hackathon
    // In production, calculate actual growth percentages
    return {
      revenueGrowth: 0, // Percentage
      transactionGrowth: 0,
      supporterGrowth: 0
    };
  }

  // Get earnings chart data
  async getEarningsChart(req, res, next) {
    try {
      const { period = '30d' } = req.query;

      // Simplified for hackathon - in production, query actual data grouped by interval
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          earnings: Math.floor(Math.random() * 100000) + 50000,
          transactions: Math.floor(Math.random() * 10) + 1
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get top supporters
  async getTopSupporters(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { limit = 10 } = req.query;

      // Simplified for hackathon - in production, query actual top supporters
      const { query } = require('../config/database');
      
      const result = await query(
        `SELECT 
          sender_address,
          COUNT(*) as transaction_count,
          SUM(amount_sats) as total_sats
         FROM transactions
         WHERE creator_id = $1 AND is_confirmed = true
         GROUP BY sender_address
         ORDER BY total_sats DESC
         LIMIT $2`,
        [creatorId, limit]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
