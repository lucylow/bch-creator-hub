const Creator = require('../models/Creator');
const Transaction = require('../models/Transaction');
const ContractService = require('../services/contract.service');
const { validationResult } = require('express-validator');
const { ValidationError, AppError } = require('../utils/errors');

class CreatorController {
  // Get creator profile
  async getProfile(req, res, next) {
    try {
      const creator = req.creator;
      
      // Get balance
      const balance = await Creator.getBalance(creator.creator_id);
      
      // Get stats
      const stats = await Creator.getStats(creator.creator_id);
      
      res.json({
        success: true,
        data: {
          ...creator,
          balance,
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update creator profile
  async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid profile data', errors.array());
      }

      const { displayName, email, avatarUrl, bio, website, twitterHandle } = req.body;
      const creatorId = req.creator.creator_id;

      const updates = {};
      if (displayName) updates.display_name = displayName;
      if (email) updates.email = email;
      if (avatarUrl) updates.avatar_url = avatarUrl;
      if (bio !== undefined) updates.bio = bio;
      if (website) updates.website = website;
      if (twitterHandle) updates.twitter_handle = twitterHandle;

      const updatedCreator = await Creator.update(creatorId, updates);

      res.json({
        success: true,
        data: updatedCreator
      });
    } catch (error) {
      next(error);
    }
  }

  // Deploy contract for creator
  async deployContract(req, res, next) {
    try {
      const creator = req.creator;
      
      // Check if already has contract
      if (creator.contract_address) {
        throw new AppError('Contract already deployed', 400);
      }

      // For hackathon, use mock deployment
      const result = await ContractService.deployMockContract(creator.wallet_address);
      
      // Update creator with contract address
      await Creator.updateContractAddress(creator.creator_id, result.address);

      res.json({
        success: true,
        data: {
          contractAddress: result.address,
          isMock: result.isMock,
          message: result.isMock ? 
            'Mock contract deployed for demo purposes' : 
            'Contract deployed successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get creator dashboard stats
  async getDashboardStats(req, res, next) {
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
        default:
          startDate = null;
      }

      const [balance, stats, recentTransactions] = await Promise.all([
        Creator.getBalance(creatorId),
        Creator.getStats(creatorId, startDate, new Date()),
        Transaction.getRecentByCreator(creatorId, 10)
      ]);

      // Format for charts
      const earningsByDay = await this.getEarningsChartData(creatorId, period);

      res.json({
        success: true,
        data: {
          balance,
          stats,
          recentTransactions,
          chartData: earningsByDay
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getEarningsChartData(creatorId, period) {
    // Simplified for hackathon
    // In production, query database for daily earnings
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Mock data for demo - in production, query actual data
      data.push({
        date: date.toISOString().split('T')[0],
        earnings: Math.floor(Math.random() * 100000) + 50000 // Random satoshis
      });
    }
    
    return data;
  }

  // Search creators (public)
  async searchCreators(req, res, next) {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const creators = await Creator.search(q, limit);
      
      res.json({
        success: true,
        data: creators
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CreatorController();
