const SubscriptionService = require('../services/subscription.service');
const { SUBSCRIPTION_TIERS, SUBSCRIPTION_PRICING } = require('../config/constants');
const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

class SubscriptionController {
  // Get current subscription
  async getSubscription(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const subscription = await SubscriptionService.getCreatorSubscription(creatorId);

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      next(error);
    }
  }

  // Get pricing for all tiers
  async getPricing(req, res, next) {
    try {
      const pricing = {
        free: {
          ...SUBSCRIPTION_PRICING.free,
          tier: SUBSCRIPTION_TIERS.FREE
        },
        pro: {
          ...SUBSCRIPTION_PRICING.pro,
          tier: SUBSCRIPTION_TIERS.PRO
        },
        business: {
          ...SUBSCRIPTION_PRICING.business,
          tier: SUBSCRIPTION_TIERS.BUSINESS
        }
      };

      res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      next(error);
    }
  }

  // Create or upgrade subscription
  async createSubscription(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid subscription data', errors.array());
      }

      const creatorId = req.creator.creator_id;
      const { tier, paymentTxid, paymentAmountSats } = req.body;

      if (!Object.values(SUBSCRIPTION_TIERS).includes(tier)) {
        throw new ValidationError('Invalid subscription tier');
      }

      const subscription = await SubscriptionService.createSubscription({
        creatorId,
        tier,
        paymentTxid,
        paymentAmountSats
      });

      res.json({
        success: true,
        data: subscription,
        message: `Subscription ${tier} activated successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel subscription
  async cancelSubscription(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const subscription = await SubscriptionService.cancelSubscription(creatorId);

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription canceled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Renew subscription
  async renewSubscription(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const subscription = await SubscriptionService.renewSubscription(creatorId);

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription renewed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Check feature access
  async checkFeature(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { feature } = req.params;

      const hasAccess = await SubscriptionService.hasFeature(creatorId, feature);

      res.json({
        success: true,
        data: {
          feature,
          hasAccess
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionController();
