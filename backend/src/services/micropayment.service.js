const Transaction = require('../models/Transaction');
const PaymentIntent = require('../models/PaymentIntent');
const { query } = require('../config/database');
const { MICROPAYMENT } = require('../config/constants');
const BCHService = require('./bch.service');
const logger = require('../utils/logger');

class MicropaymentService {
  /**
   * Check if a payment amount qualifies as a micro-payment
   */
  static isMicropayment(amountSats) {
    return amountSats <= MICROPAYMENT.MAX_AMOUNT;
  }

  /**
   * Check if payment should be batched
   */
  static shouldBatch(amountSats) {
    return amountSats < MICROPAYMENT.BATCH_THRESHOLD;
  }

  /**
   * Validate micro-payment amount against dust limit
   */
  static validateAmount(amountSats) {
    if (amountSats < MICROPAYMENT.DUST_LIMIT) {
      return {
        valid: false,
        error: `Amount below dust limit of ${MICROPAYMENT.DUST_LIMIT} satoshis`,
        minAmount: MICROPAYMENT.DUST_LIMIT
      };
    }
    return { valid: true };
  }

  /**
   * Calculate optimized fee for micro-payments
   */
  static calculateOptimizedFee(numInputs = 1, numOutputs = 2, priority = 'normal') {
    const typicalTxSize = (numInputs * 148) + (numOutputs * 34) + 10;
    
    let feePerByte;
    switch (priority) {
      case 'fast':
        feePerByte = MICROPAYMENT.FAST_FEE_PER_BYTE;
        break;
      case 'low':
        feePerByte = MICROPAYMENT.MIN_FEE_PER_BYTE;
        break;
      default:
        feePerByte = MICROPAYMENT.RECOMMENDED_FEE_PER_BYTE;
    }

    const fee = Math.ceil(typicalTxSize * feePerByte);
    
    return {
      sats: fee,
      usd: fee / 100000000 * 250, // Assuming $250/BCH
      size: typicalTxSize,
      feePerByte,
      priority
    };
  }

  /**
   * Get micro-payment statistics for a creator
   */
  static async getMicropaymentStats(creatorId, startDate, endDate) {
    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE amount_sats <= $4) as micropayment_count,
        COUNT(*) FILTER (WHERE amount_sats > $4 AND amount_sats <= $5) as small_payment_count,
        COUNT(*) FILTER (WHERE amount_sats > $5) as regular_payment_count,
        COALESCE(SUM(amount_sats) FILTER (WHERE amount_sats <= $4), 0) as micropayment_total,
        COALESCE(AVG(amount_sats) FILTER (WHERE amount_sats <= $4), 0) as micropayment_avg,
        COALESCE(SUM(fee_sats) FILTER (WHERE amount_sats <= $4), 0) as micropayment_fees,
        COUNT(DISTINCT sender_address) FILTER (WHERE amount_sats <= $4) as micropayment_senders
      FROM transactions 
      WHERE creator_id = $1 
        AND is_confirmed = true
        AND ($2::timestamp IS NULL OR indexed_at >= $2)
        AND ($3::timestamp IS NULL OR indexed_at <= $3)`,
      [
        creatorId,
        startDate,
        endDate,
        MICROPAYMENT.MAX_AMOUNT,
        MICROPAYMENT.BATCH_THRESHOLD * 10 // Small payments threshold
      ]
    );

    const stats = result.rows[0];
    
    // Calculate efficiency metrics
    const totalMicropayments = parseInt(stats.micropayment_count) || 0;
    const totalMicropaymentAmount = parseInt(stats.micropayment_total) || 0;
    const avgMicropaymentFee = totalMicropayments > 0 
      ? parseInt(stats.micropayment_fees) / totalMicropayments 
      : 0;
    const avgMicropaymentAmount = parseFloat(stats.micropayment_avg) || 0;
    const feeRatio = avgMicropaymentAmount > 0 
      ? (avgMicropaymentFee / avgMicropaymentAmount) * 100 
      : 0;

    return {
      ...stats,
      efficiency: {
        avgFeeRatio: feeRatio,
        avgFeePerTx: avgMicropaymentFee,
        avgAmount: avgMicropaymentAmount,
        batchingRecommendation: feeRatio > 5 // If fees are > 5% of amount, recommend batching
      }
    };
  }

  /**
   * Get pending payments that could be batched
   */
  static async getBatchablePayments(creatorId, limit = MICROPAYMENT.BATCH_SIZE) {
    const result = await query(
      `SELECT t.*, pi.intent_id, pi.title, pi.description
      FROM transactions t
      LEFT JOIN payment_intents pi ON t.intent_id = pi.intent_id
      WHERE t.creator_id = $1
        AND t.amount_sats < $2
        AND t.is_confirmed = false
        AND t.indexed_at > NOW() - INTERVAL '1 hour'
      ORDER BY t.indexed_at ASC
      LIMIT $3`,
      [creatorId, MICROPAYMENT.BATCH_THRESHOLD, limit]
    );

    return result.rows;
  }

  /**
   * Calculate batch payment summary
   */
  static calculateBatchSummary(payments) {
    const totalAmount = payments.reduce((sum, p) => sum + parseInt(p.amount_sats || 0), 0);
    const totalFees = payments.reduce((sum, p) => sum + parseInt(p.fee_sats || 0), 0);
    const estimatedBatchFee = MicropaymentService.calculateOptimizedFee(1, payments.length + 1);

    const savings = totalFees - estimatedBatchFee.sats;

    return {
      paymentCount: payments.length,
      totalAmount,
      individualFees: totalFees,
      estimatedBatchFee: estimatedBatchFee.sats,
      estimatedSavings: savings,
      savingsPercentage: totalFees > 0 ? (savings / totalFees) * 100 : 0,
      recommended: savings > 0
    };
  }

  /**
   * Get micro-payment recommendations for a creator
   */
  static async getRecommendations(creatorId) {
    const stats = await MicropaymentService.getMicropaymentStats(creatorId, null, null);
    const batchablePayments = await MicropaymentService.getBatchablePayments(creatorId);
    const batchSummary = batchablePayments.length > 0 
      ? MicropaymentService.calculateBatchSummary(batchablePayments)
      : null;

    const recommendations = [];

    // Check if batching is recommended
    if (stats.efficiency?.batchingRecommendation) {
      recommendations.push({
        type: 'batching',
        priority: 'high',
        message: `Your micro-payments have high fee ratios. Consider batching payments.`,
        savings: batchSummary?.estimatedSavings || 0
      });
    }

    // Check if there are batchable payments
    if (batchSummary && batchSummary.recommended) {
      recommendations.push({
        type: 'batch_now',
        priority: 'medium',
        message: `You have ${batchSummary.paymentCount} payments that could be batched, saving ~${batchSummary.estimatedSavings} sats.`,
        batchSummary
      });
    }

    // Check minimum amount compliance
    if (parseInt(stats.micropayment_avg || 0) < MICROPAYMENT.DUST_LIMIT) {
      recommendations.push({
        type: 'minimum_amount',
        priority: 'low',
        message: `Some payments are below the dust limit. Consider setting a minimum payment amount.`
      });
    }

    return {
      stats,
      batchSummary,
      recommendations
    };
  }

  /**
   * Analyze payment efficiency
   */
  static analyzePaymentEfficiency(amountSats, feeSats) {
    const feeRatio = (feeSats / amountSats) * 100;
    const isMicropayment = this.isMicropayment(amountSats);
    const shouldBatch = this.shouldBatch(amountSats);

    return {
      amountSats,
      feeSats,
      feeRatio,
      isMicropayment,
      shouldBatch,
      efficiency: feeRatio < 1 ? 'excellent' : feeRatio < 5 ? 'good' : feeRatio < 10 ? 'fair' : 'poor',
      recommendation: shouldBatch && feeRatio > 5 
        ? 'Batch with other small payments to reduce fees'
        : feeRatio > 10 
        ? 'Consider increasing payment amount or using batching'
        : 'Payment efficiency is acceptable'
    };
  }
}

module.exports = MicropaymentService;

