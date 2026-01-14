const Subscription = require('../models/Subscription');
const Creator = require('../models/Creator');
const BusinessMetric = require('../models/BusinessMetric');
const { SUBSCRIPTION_TIERS, SUBSCRIPTION_STATUS, SUBSCRIPTION_PRICING, BUSINESS_METRICS } = require('../config/constants');
const logger = require('../utils/logger');

class SubscriptionService {
  /**
   * Get subscription pricing info for a tier
   */
  static getPricing(tier) {
    return SUBSCRIPTION_PRICING[tier] || SUBSCRIPTION_PRICING.free;
  }

  /**
   * Check if creator has access to a feature
   */
  static async hasFeature(creatorId, feature) {
    const creator = await Creator.findByCreatorId(creatorId);
    if (!creator) return false;

    const tier = creator.subscription_tier || SUBSCRIPTION_TIERS.FREE;
    const pricing = this.getPricing(tier);
    
    return pricing.features[feature] || false;
  }

  /**
   * Create or upgrade subscription
   */
  static async createSubscription({
    creatorId,
    tier,
    paymentTxid = null,
    paymentAmountSats = null
  }) {
    const creator = await Creator.findByCreatorId(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    const pricing = this.getPricing(tier);
    if (tier !== SUBSCRIPTION_TIERS.FREE && !paymentAmountSats && !paymentTxid) {
      throw new Error('Payment required for paid tiers');
    }

    // Calculate billing period (30 days for monthly subscriptions)
    const billingPeriodStart = new Date();
    const billingPeriodEnd = new Date();
    billingPeriodEnd.setDate(billingPeriodEnd.getDate() + 30);

    // Cancel existing active subscription
    const existingSubscription = await Subscription.findActiveByCreatorId(creatorId);
    if (existingSubscription) {
      await Subscription.cancel(existingSubscription.id);
    }

    // Create new subscription
    const subscription = await Subscription.create({
      creatorId,
      tier,
      paymentTxid,
      paymentAmountSats,
      billingPeriodStart,
      billingPeriodEnd,
      status: tier === SUBSCRIPTION_TIERS.FREE ? SUBSCRIPTION_STATUS.ACTIVE : SUBSCRIPTION_STATUS.ACTIVE
    });

    // Update creator tier
    await Creator.update(creatorId, {
      subscription_tier: tier,
      subscription_status: SUBSCRIPTION_STATUS.ACTIVE,
      subscription_expires_at: billingPeriodEnd
    });

    // Track business metric
    if (paymentAmountSats) {
      await BusinessMetric.create({
        metricDate: new Date().toISOString().split('T')[0],
        metricType: BUSINESS_METRICS.SUBSCRIPTION_REVENUE,
        creatorId,
        value: paymentAmountSats
      });
    }

    logger.info(`Subscription created: ${creatorId} -> ${tier}`);
    return subscription;
  }

  /**
   * Renew subscription
   */
  static async renewSubscription(creatorId) {
    const subscription = await Subscription.findActiveByCreatorId(creatorId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const newBillingPeriodEnd = new Date(subscription.billing_period_end);
    newBillingPeriodEnd.setDate(newBillingPeriodEnd.getDate() + 30);

    await Subscription.renew(subscription.id, newBillingPeriodEnd);
    await Creator.update(creatorId, {
      subscription_expires_at: newBillingPeriodEnd
    });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(creatorId) {
    const subscription = await Subscription.findActiveByCreatorId(creatorId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    await Subscription.cancel(subscription.id);
    await Creator.update(creatorId, {
      subscription_status: SUBSCRIPTION_STATUS.CANCELED,
      subscription_tier: SUBSCRIPTION_TIERS.FREE
    });

    logger.info(`Subscription canceled: ${creatorId}`);
    return subscription;
  }

  /**
   * Get creator's current subscription
   */
  static async getCreatorSubscription(creatorId) {
    const subscription = await Subscription.findActiveByCreatorId(creatorId);
    const creator = await Creator.findByCreatorId(creatorId);
    
    if (!subscription && creator) {
      // Return free tier if no subscription
      return {
        tier: creator.subscription_tier || SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        features: this.getPricing(creator.subscription_tier || SUBSCRIPTION_TIERS.FREE).features
      };
    }

    if (!subscription) return null;

    const pricing = this.getPricing(subscription.tier);
    return {
      ...subscription,
      features: pricing.features,
      pricing: {
        priceSats: pricing.priceSats,
        priceBCH: pricing.priceBCH
      }
    };
  }

  /**
   * Check if subscription is expired and update status
   */
  static async checkAndUpdateExpiredSubscriptions() {
    const expired = await Subscription.findExpiring(0);
    
    for (const sub of expired) {
      if (new Date(sub.billing_period_end) < new Date()) {
        await Subscription.update(sub.id, { status: SUBSCRIPTION_STATUS.EXPIRED });
        await Creator.update(sub.creator_id, {
          subscription_status: SUBSCRIPTION_STATUS.EXPIRED,
          subscription_tier: SUBSCRIPTION_TIERS.FREE
        });
        logger.info(`Subscription expired: ${sub.creator_id}`);
      }
    }
  }

  /**
   * Get subscription features for a tier
   */
  static getFeatures(tier) {
    const pricing = this.getPricing(tier);
    return pricing.features;
  }
}

module.exports = SubscriptionService;

