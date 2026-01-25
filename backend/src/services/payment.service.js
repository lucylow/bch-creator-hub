const Transaction = require('../models/Transaction');
const PaymentIntent = require('../models/PaymentIntent');
const BCHService = require('./bch.service');
const MicropaymentService = require('./micropayment.service');
const NotificationService = require('./notification.service');
const WebhookService = require('./webhook.service');
const balanceCache = require('./balanceCache.service');
const logger = require('../utils/logger');
const { AppError, ValidationError } = require('../utils/errors');
const { TRANSACTION_STATUS, MIN_CONFIRMATIONS } = require('../config/constants');

/**
 * Unified Payment Service
 * 
 * Consolidates all payment-related operations including:
 * - Payment intent creation and management
 * - Transaction processing and verification
 * - Payment status tracking
 * - Fee calculation and optimization
 * - Payment batching for micropayments
 * - Blockchain confirmation tracking
 */
class PaymentService {
  constructor() {
    this.pendingPayments = new Map(); // In-memory cache for pending payments
    this.confirmationCheckInterval = null;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent({
    creatorId,
    intentType = 1,
    amountSats,
    amountUsd,
    title,
    description,
    contentUrl,
    contentId,
    metadata = {},
    isRecurring = false,
    recurrenceInterval,
    expiresInHours
  }) {
    try {
      // Validate micro-payment amount
      if (amountSats) {
        const validation = MicropaymentService.validateAmount(amountSats);
        if (!validation.valid) {
          throw new ValidationError(validation.error);
        }

        // Add micro-payment metadata
        if (MicropaymentService.isMicropayment(amountSats)) {
          metadata.isMicropayment = true;
          metadata.shouldBatch = MicropaymentService.shouldBatch(amountSats);
          
          // Calculate fee efficiency
          const feeEstimate = BCHService.estimateFee();
          const efficiency = MicropaymentService.analyzePaymentEfficiency(amountSats, feeEstimate.sats);
          metadata.feeEfficiency = efficiency;
        }
      }

      // Calculate expiration
      let expiresAt = null;
      if (expiresInHours) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);
      }

      // Create payment intent
      const paymentIntent = await PaymentIntent.create({
        creatorId,
        intentType,
        amountSats,
        amountUsd,
        title,
        description,
        contentUrl,
        contentId,
        metadata,
        isRecurring,
        recurrenceInterval,
        expiresAt
      });

      // Generate payment URL
      const paymentUrl = `${process.env.FRONTEND_URL}/pay/${creatorId}/${paymentIntent.intent_id}`;

      return {
        ...paymentIntent,
        paymentUrl,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Process and record a payment transaction
   */
  async processPayment({
    txid,
    paymentId,
    creatorId,
    amountSats,
    senderAddress,
    receiverAddress,
    metadata = {}
  }) {
    try {
      // Verify transaction doesn't already exist
      const existingTx = await Transaction.findByTxid(txid);
      if (existingTx) {
        throw new AppError('Transaction already recorded', 409);
      }

      // Get payment intent if provided
      let paymentIntent = null;
      if (paymentId) {
        paymentIntent = await PaymentIntent.findById(paymentId);
        if (!paymentIntent) {
          throw new AppError('Payment intent not found', 404);
        }
        if (paymentIntent.creator_id !== creatorId) {
          throw new AppError('Payment intent does not belong to creator', 403);
        }
      }

      // Validate micro-payment amount
      const validation = MicropaymentService.validateAmount(amountSats);
      if (!validation.valid) {
        throw new ValidationError(validation.error);
      }

      // Calculate fee estimate
      const feeEstimate = BCHService.estimateFee();
      
      // Verify transaction on blockchain
      const txVerification = await this.verifyTransaction(txid, {
        expectedAmount: amountSats,
        expectedReceiver: receiverAddress,
        expectedSender: senderAddress
      });

      if (!txVerification.valid) {
        throw new ValidationError(`Transaction verification failed: ${txVerification.error}`);
      }

      // Create transaction record
      const transaction = await Transaction.create({
        txid,
        creatorId,
        paymentIntentId: paymentIntent?.id,
        intentId: paymentIntent?.intent_id,
        amountSats,
        feeSats: feeEstimate.sats,
        senderAddress: txVerification.senderAddress || senderAddress,
        receiverAddress: txVerification.receiverAddress || receiverAddress,
        paymentType: paymentIntent?.intent_type || 1,
        contentId: paymentIntent?.content_id,
        payloadJson: {
          ...txVerification.payload,
          ...metadata
        },
        blockHeight: txVerification.blockHeight,
        confirmations: txVerification.confirmations,
        isConfirmed: txVerification.isConfirmed,
        confirmedAt: txVerification.isConfirmed ? new Date() : null,
        metadata: {
          recordedVia: 'payment_service',
          isMicropayment: MicropaymentService.isMicropayment(amountSats),
          feeEfficiency: MicropaymentService.analyzePaymentEfficiency(amountSats, feeEstimate.sats),
          verification: txVerification,
          ...metadata
        }
      });

      await balanceCache.invalidateBalance(creatorId);

      // Send notifications
      if (txVerification.isConfirmed) {
        await NotificationService.notifyPaymentConfirmed(creatorId, transaction);
        await WebhookService.triggerPaymentWebhooks(creatorId, transaction);
      } else {
        await NotificationService.notifyPaymentReceived(creatorId, transaction);
        await WebhookService.triggerPaymentWebhooks(creatorId, transaction);
        
        // Track pending payment for confirmation
        this.trackPendingPayment(transaction);
      }

      logger.info(`Payment processed: ${txid} for creator ${creatorId}`);

      return transaction;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Verify a transaction on the blockchain
   */
  async verifyTransaction(txid, options = {}) {
    const {
      expectedAmount,
      expectedReceiver,
      expectedSender,
      minConfirmations = MIN_CONFIRMATIONS
    } = options;

    try {
      // Get transaction from blockchain
      const tx = await BCHService.getTransaction(txid);

      if (!tx) {
        return {
          valid: false,
          error: 'Transaction not found on blockchain'
        };
      }

      // Extract transaction details
      const vout = tx.vout || [];
      const vin = tx.vin || [];
      
      // Find outputs to receiver address
      const receiverOutputs = vout.filter(output => 
        output.scriptPubKey?.addresses?.includes(expectedReceiver) ||
        output.cashAddr === expectedReceiver
      );

      const totalReceived = receiverOutputs.reduce((sum, output) => 
        sum + (output.value || output.valueSat || 0), 0
      );

      // Find sender address (from first input if available)
      const senderAddress = vin[0]?.addresses?.[0] || vin[0]?.cashAddr || expectedSender;

      // Check amount if specified
      if (expectedAmount && totalReceived < expectedAmount) {
        return {
          valid: false,
          error: `Insufficient amount: received ${totalReceived}, expected ${expectedAmount}`
        };
      }

      // Extract OP_RETURN payload
      const opReturnOutputs = vout.filter(output => 
        output.scriptPubKey?.hex?.startsWith('6a')
      );
      
      let payload = null;
      if (opReturnOutputs.length > 0) {
        payload = BCHService.decodeOpReturn(opReturnOutputs[0].scriptPubKey.hex);
      }

      // Check confirmations
      const confirmations = tx.confirmations || 0;
      const isConfirmed = confirmations >= minConfirmations;

      return {
        valid: true,
        txid,
        senderAddress,
        receiverAddress: expectedReceiver,
        amount: totalReceived,
        blockHeight: tx.blockHeight,
        confirmations,
        isConfirmed,
        confirmedAt: isConfirmed ? new Date() : null,
        payload,
        transaction: tx
      };
    } catch (error) {
      logger.error(`Error verifying transaction ${txid}:`, error);
      return {
        valid: false,
        error: error.message || 'Transaction verification failed'
      };
    }
  }

  /**
   * Track pending payment for confirmation monitoring
   */
  trackPendingPayment(transaction) {
    this.pendingPayments.set(transaction.txid, {
      txid: transaction.txid,
      creatorId: transaction.creator_id,
      indexedAt: new Date(),
      checkCount: 0
    });
  }

  /**
   * Check and update pending payments
   */
  async checkPendingPayments() {
    if (this.pendingPayments.size === 0) {
      return;
    }

    const pendingTxids = Array.from(this.pendingPayments.keys());
    
    for (const txid of pendingTxids) {
      try {
        const pending = this.pendingPayments.get(txid);
        
        // Get transaction from blockchain
        const tx = await BCHService.getTransaction(txid);
        
        if (!tx) {
          continue;
        }

        const confirmations = tx.confirmations || 0;
        const isConfirmed = confirmations >= MIN_CONFIRMATIONS;

        // Get current transaction record
        const transaction = await Transaction.findByTxid(txid);
        
        if (!transaction) {
          this.pendingPayments.delete(txid);
          continue;
        }

        // Update if confirmations changed
        if (transaction.confirmations !== confirmations || transaction.is_confirmed !== isConfirmed) {
          await Transaction.update(txid, {
            confirmations,
            is_confirmed: isConfirmed,
            confirmed_at: isConfirmed ? new Date() : null,
            block_height: tx.blockHeight
          });

          // Send notifications if confirmed
          if (isConfirmed && !transaction.is_confirmed) {
            const updatedTx = await Transaction.findByTxid(txid);
            await NotificationService.notifyPaymentConfirmed(pending.creatorId, updatedTx);
            await WebhookService.triggerPaymentWebhooks(pending.creatorId, updatedTx);
            await balanceCache.invalidateBalance(pending.creatorId);
          }
        }

        // Remove if confirmed or too many checks
        if (isConfirmed || pending.checkCount >= 20) {
          this.pendingPayments.delete(txid);
        } else {
          pending.checkCount++;
          this.pendingPayments.set(txid, pending);
        }
      } catch (error) {
        logger.error(`Error checking pending payment ${txid}:`, error);
        // Remove on persistent errors
        this.pendingPayments.delete(txid);
      }
    }
  }

  /**
   * Start confirmation monitoring
   */
  startConfirmationMonitoring() {
    if (this.confirmationCheckInterval) {
      return;
    }

    // Check pending payments every 30 seconds
    this.confirmationCheckInterval = setInterval(() => {
      this.checkPendingPayments().catch(error => {
        logger.error('Error in confirmation monitoring:', error);
      });
    }, 30000);

    logger.info('Payment confirmation monitoring started');
  }

  /**
   * Stop confirmation monitoring
   */
  stopConfirmationMonitoring() {
    if (this.confirmationCheckInterval) {
      clearInterval(this.confirmationCheckInterval);
      this.confirmationCheckInterval = null;
      logger.info('Payment confirmation monitoring stopped');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(txid) {
    try {
      // Check database first
      const transaction = await Transaction.findByTxid(txid);
      
      if (transaction) {
        return {
          txid,
          status: transaction.is_confirmed ? TRANSACTION_STATUS.CONFIRMED : TRANSACTION_STATUS.PENDING,
          confirmations: transaction.confirmations,
          isConfirmed: transaction.is_confirmed,
          amountSats: transaction.amount_sats,
          createdAt: transaction.indexed_at
        };
      }

      // Check blockchain if not in database
      const verification = await this.verifyTransaction(txid);
      
      if (verification.valid) {
        return {
          txid,
          status: verification.isConfirmed ? TRANSACTION_STATUS.CONFIRMED : TRANSACTION_STATUS.PENDING,
          confirmations: verification.confirmations,
          isConfirmed: verification.isConfirmed,
          amountSats: verification.amount,
          createdAt: null
        };
      }

      return {
        txid,
        status: TRANSACTION_STATUS.FAILED,
        error: verification.error
      };
    } catch (error) {
      logger.error(`Error getting payment status for ${txid}:`, error);
      return {
        txid,
        status: TRANSACTION_STATUS.FAILED,
        error: error.message
      };
    }
  }

  /**
   * Batch payments for a creator
   */
  async batchPayments(creatorId, paymentIds) {
    try {
      // Get batchable payments
      const payments = await MicropaymentService.getBatchablePayments(creatorId);
      
      if (payments.length === 0) {
        throw new AppError('No batchable payments found', 404);
      }

      // Calculate batch summary
      const batchSummary = MicropaymentService.calculateBatchSummary(payments);

      if (!batchSummary.recommended) {
        throw new AppError('Batching not recommended for these payments', 400);
      }

      // TODO: Implement actual batching logic
      // This would create a single transaction combining multiple payments
      
      return {
        batchId: `batch_${Date.now()}`,
        payments: payments.length,
        totalAmount: batchSummary.totalAmount,
        estimatedFee: batchSummary.estimatedBatchFee,
        estimatedSavings: batchSummary.estimatedSavings,
        summary: batchSummary
      };
    } catch (error) {
      logger.error('Error batching payments:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics for a creator
   */
  async getPaymentStats(creatorId, startDate, endDate) {
    try {
      const stats = await Transaction.getStats(creatorId, startDate, endDate);
      const micropaymentStats = await MicropaymentService.getMicropaymentStats(creatorId, startDate, endDate);
      
      return {
        ...stats,
        micropayments: micropaymentStats
      };
    } catch (error) {
      logger.error(`Error getting payment stats for creator ${creatorId}:`, error);
      throw error;
    }
  }

  /**
   * Estimate payment fee with dynamic rates
   */
  async estimateFee(options = {}) {
    const {
      numInputs = 1,
      numOutputs = 2,
      priority = 'normal',
      amountSats = null
    } = options;

    try {
      // Get base fee estimate
      const feeEstimate = BCHService.estimateFee(numInputs, numOutputs, priority);
      
      // Add efficiency analysis for micropayments
      if (amountSats && MicropaymentService.isMicropayment(amountSats)) {
        const efficiency = MicropaymentService.analyzePaymentEfficiency(amountSats, feeEstimate.sats);
        
        return {
          ...feeEstimate,
          efficiency,
          recommendation: efficiency.recommendation,
          shouldBatch: MicropaymentService.shouldBatch(amountSats)
        };
      }

      return feeEstimate;
    } catch (error) {
      logger.error('Error estimating fee:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();

