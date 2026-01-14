const BusinessMetric = require('../models/BusinessMetric');
const Creator = require('../models/Creator');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const { query } = require('../config/database');
const { BUSINESS_METRICS, SUBSCRIPTION_TIERS, SUBSCRIPTION_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

class BusinessMetricsService {
  /**
   * Calculate ARPU (Average Revenue Per User)
   */
  static async calculateARPU(startDate, endDate) {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT creator_id) as total_creators,
        COALESCE(SUM(payment_amount_sats), 0) as total_revenue_sats
       FROM subscriptions 
       WHERE billing_period_start >= $1 
         AND billing_period_start <= $2
         AND payment_amount_sats > 0`,
      [startDate, endDate]
    );

    const { total_creators, total_revenue_sats } = result.rows[0];
    const arpu = total_creators > 0 ? total_revenue_sats / total_creators : 0;

    return {
      arpu,
      totalCreators: parseInt(total_creators),
      totalRevenue: parseInt(total_revenue_sats)
    };
  }

  /**
   * Calculate conversion rate (Free -> Pro/Business)
   */
  static async calculateConversionRate(startDate, endDate) {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN tier IN ('${SUBSCRIPTION_TIERS.PRO}', '${SUBSCRIPTION_TIERS.BUSINESS}') THEN creator_id END) as paid_subscribers,
        COUNT(DISTINCT creator_id) as total_creators
       FROM subscriptions 
       WHERE billing_period_start >= $1 
         AND billing_period_start <= $2`,
      [startDate, endDate]
    );

    const { paid_subscribers, total_creators } = result.rows[0];
    const conversionRate = total_creators > 0 ? (paid_subscribers / total_creators) * 100 : 0;

    return {
      conversionRate,
      paidSubscribers: parseInt(paid_subscribers),
      totalCreators: parseInt(total_creators)
    };
  }

  /**
   * Calculate churn rate
   */
  static async calculateChurnRate(startDate, endDate) {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN status = '${SUBSCRIPTION_STATUS.CANCELED}' THEN creator_id END) as canceled_count,
        COUNT(DISTINCT creator_id) as active_count
       FROM subscriptions 
       WHERE (billing_period_start >= $1 AND billing_period_start <= $2)
         OR (canceled_at >= $1 AND canceled_at <= $2)`,
      [startDate, endDate]
    );

    const { canceled_count, active_count } = result.rows[0];
    const churnRate = active_count > 0 ? (canceled_count / active_count) * 100 : 0;

    return {
      churnRate,
      canceledCount: parseInt(canceled_count),
      activeCount: parseInt(active_count)
    };
  }

  /**
   * Calculate fee collection rate
   */
  static async calculateFeeCollectionRate(startDate, endDate) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_withdrawals,
        COALESCE(SUM(fee_sats), 0) as total_fees_collected,
        COALESCE(SUM(amount_sats + fee_sats), 0) as total_withdrawal_amount
       FROM withdrawals 
       WHERE created_at >= $1 
         AND created_at <= $2
         AND status = 'completed'`,
      [startDate, endDate]
    );

    const { total_withdrawals, total_fees_collected, total_withdrawal_amount } = result.rows[0];
    const feeCollectionRate = total_withdrawal_amount > 0 
      ? (total_fees_collected / total_withdrawal_amount) * 100 
      : 0;

    return {
      feeCollectionRate,
      totalWithdrawals: parseInt(total_withdrawals),
      totalFeesCollected: parseInt(total_fees_collected),
      totalWithdrawalAmount: parseInt(total_withdrawal_amount)
    };
  }

  /**
   * Track ARPU metric
   */
  static async trackARPU(date = null) {
    const metricDate = date || new Date().toISOString().split('T')[0];
    const startDate = new Date(metricDate);
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    const endDate = new Date(metricDate);

    const { arpu } = await this.calculateARPU(startDate, endDate);

    await BusinessMetric.create({
      metricDate,
      metricType: BUSINESS_METRICS.ARPU,
      value: arpu
    });

    logger.info(`ARPU tracked for ${metricDate}: ${arpu}`);
    return arpu;
  }

  /**
   * Track conversion rate
   */
  static async trackConversionRate(date = null) {
    const metricDate = date || new Date().toISOString().split('T')[0];
    const startDate = new Date(metricDate);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(metricDate);

    const { conversionRate } = await this.calculateConversionRate(startDate, endDate);

    await BusinessMetric.create({
      metricDate,
      metricType: BUSINESS_METRICS.CONVERSION_RATE,
      value: conversionRate
    });

    logger.info(`Conversion rate tracked for ${metricDate}: ${conversionRate}%`);
    return conversionRate;
  }

  /**
   * Track fee collection rate
   */
  static async trackFeeCollectionRate(date = null) {
    const metricDate = date || new Date().toISOString().split('T')[0];
    const startDate = new Date(metricDate);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(metricDate);

    const { feeCollectionRate } = await this.calculateFeeCollectionRate(startDate, endDate);

    await BusinessMetric.create({
      metricDate,
      metricType: BUSINESS_METRICS.FEE_COLLECTION_RATE,
      value: feeCollectionRate
    });

    logger.info(`Fee collection rate tracked for ${metricDate}: ${feeCollectionRate}%`);
    return feeCollectionRate;
  }

  /**
   * Get comprehensive business metrics
   */
  static async getBusinessMetrics(startDate, endDate) {
    const [arpu, conversionRate, churnRate, feeCollectionRate] = await Promise.all([
      this.calculateARPU(startDate, endDate),
      this.calculateConversionRate(startDate, endDate),
      this.calculateChurnRate(startDate, endDate),
      this.calculateFeeCollectionRate(startDate, endDate)
    ]);

    // Get subscription revenue
    const subscriptionRevenue = await query(
      `SELECT COALESCE(SUM(payment_amount_sats), 0) as total_revenue
       FROM subscriptions 
       WHERE billing_period_start >= $1 
         AND billing_period_start <= $2
         AND payment_amount_sats > 0`,
      [startDate, endDate]
    );

    // Get withdrawal fee revenue
    const withdrawalFeeRevenue = await query(
      `SELECT COALESCE(SUM(fee_sats), 0) as total_fees
       FROM withdrawals 
       WHERE created_at >= $1 
         AND created_at <= $2
         AND status = 'completed'`,
      [startDate, endDate]
    );

    return {
      arpu,
      conversionRate,
      churnRate,
      feeCollectionRate,
      revenue: {
        subscription: parseInt(subscriptionRevenue.rows[0].total_revenue),
        withdrawalFees: parseInt(withdrawalFeeRevenue.rows[0].total_fees),
        total: parseInt(subscriptionRevenue.rows[0].total_revenue) + parseInt(withdrawalFeeRevenue.rows[0].total_fees)
      }
    };
  }

  /**
   * Track withdrawal fee revenue
   */
  static async trackWithdrawalFeeRevenue(creatorId, feeSats, date = null) {
    const metricDate = date || new Date().toISOString().split('T')[0];

    await BusinessMetric.create({
      metricDate,
      metricType: BUSINESS_METRICS.WITHDRAWAL_FEE_REVENUE,
      creatorId,
      value: feeSats
    });
  }
}

module.exports = BusinessMetricsService;
