const Creator = require('../models/Creator');
const Withdrawal = require('../models/Withdrawal');
const BusinessMetricsService = require('./business-metrics.service');
const { DEFAULT_FEE_BASIS_POINTS, SUBSCRIPTION_TIERS } = require('../config/constants');
const { calculateWithdrawalAmounts } = require('../lib/withdraw');
const logger = require('../utils/logger');
const { NotFoundError, BusinessLogicError } = require('../utils/errors');

class WithdrawalService {
  /**
   * Calculate withdrawal amounts with fee logic
   * Supports both fee-on-withdrawal (mandatory for Pro/Business) and voluntary tip
   */
  static async calculateWithdrawal({
    creatorId,
    totalSats,
    includeServiceFee = null, // null = auto-detect, true = force include, false = force exclude
    networkFeeSats = 250
  }) {
    if (!creatorId) {
      throw new BusinessLogicError('Creator ID is required', 400, {
        context: { creatorId, totalSats }
      });
    }

    if (!totalSats || totalSats <= 0) {
      throw new BusinessLogicError('Total amount must be greater than 0', 400, {
        context: { creatorId, totalSats }
      });
    }

    const creator = await Creator.findByCreatorId(creatorId);
    if (!creator) {
      throw new NotFoundError('Creator', {
        context: { creatorId }
      });
    }

    const tier = creator.subscription_tier || SUBSCRIPTION_TIERS.FREE;
    const feeOptIn = creator.fee_opt_in !== false; // Default to true
    const feeBasisPoints = creator.fee_basis_points || DEFAULT_FEE_BASIS_POINTS;

    // Determine if fee should be included
    let shouldIncludeFee = false;
    
    if (includeServiceFee !== null) {
      // Explicit override
      shouldIncludeFee = includeServiceFee;
    } else {
      // Auto-detect based on tier and opt-in
      if (tier === SUBSCRIPTION_TIERS.PRO || tier === SUBSCRIPTION_TIERS.BUSINESS) {
        // Pro/Business tiers: fee-on-withdrawal is default (can be opted out)
        shouldIncludeFee = feeOptIn;
      } else {
        // Free tier: voluntary tip (defaults to opt-in but can be toggled)
        shouldIncludeFee = feeOptIn;
      }
    }

    // Calculate amounts
    const amounts = calculateWithdrawalAmounts(
      totalSats,
      shouldIncludeFee ? feeBasisPoints : 0,
      networkFeeSats
    );

    return {
      ...amounts,
      feeBasisPoints: shouldIncludeFee ? feeBasisPoints : 0,
      feeType: tier === SUBSCRIPTION_TIERS.FREE ? 'voluntary' : 'mandatory',
      tier,
      feeOptIn,
      breakdown: {
        total: amounts.totalSats,
        serviceFee: amounts.serviceSats,
        networkFee: amounts.networkFeeSats,
        payout: amounts.payoutSats
      }
    };
  }

  /**
   * Create withdrawal record
   */
  static async createWithdrawal({
    creatorId,
    amountSats,
    feeSats,
    toAddress,
    metadata = {}
  }) {
    const withdrawal = await Withdrawal.create({
      creatorId,
      amountSats,
      feeSats,
      toAddress,
      metadata
    });

    // Track fee revenue if applicable
    if (feeSats > 0) {
      await BusinessMetricsService.trackWithdrawalFeeRevenue(creatorId, feeSats);
    }

    logger.info(`Withdrawal created: ${creatorId} - ${amountSats} sats (fee: ${feeSats} sats)`);
    return withdrawal;
  }

  /**
   * Get withdrawal calculation preview (for UI)
   */
  static async getWithdrawalPreview(creatorId, totalSats) {
    const calculation = await this.calculateWithdrawal({
      creatorId,
      totalSats
    });

    return {
      totalSats: calculation.totalSats,
      breakdown: calculation.breakdown,
      feeInfo: {
        type: calculation.feeType,
        basisPoints: calculation.feeBasisPoints,
        optIn: calculation.feeOptIn,
        tier: calculation.tier,
        message: this.getFeeMessage(calculation.tier, calculation.feeOptIn)
      }
    };
  }

  /**
   * Get fee message for UI display
   */
  static getFeeMessage(tier, feeOptIn) {
    if (tier === SUBSCRIPTION_TIERS.FREE) {
      return feeOptIn
        ? '1% voluntary tip supports ongoing hosting, indexers, and audits. You can opt out.'
        : 'Add a 1% tip to support ongoing development (optional)';
    } else {
      return feeOptIn
        ? '1% service fee funds infrastructure and development'
        : 'Service fee waived';
    }
  }

  /**
   * Update creator fee opt-in preference
   */
  static async updateFeeOptIn(creatorId, optIn) {
    await Creator.update(creatorId, { fee_opt_in: optIn });
    logger.info(`Fee opt-in updated: ${creatorId} -> ${optIn}`);
  }
}

module.exports = WithdrawalService;
