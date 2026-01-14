const PaymentIntent = require('../models/PaymentIntent');
const PaymentService = require('../services/payment.service');
const { validationResult } = require('express-validator');
const { ValidationError, NotFoundError, AppError } = require('../utils/errors');
const MicropaymentService = require('../services/micropayment.service');
const QRCodeUtil = require('../utils/qrcode.util');

class PaymentController {
  // Create payment intent
  async createIntent(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid payment intent data', errors.array());
      }

      const creatorId = req.creator.creator_id;
      const {
        type = 1,
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
      } = req.body;

      // Use unified payment service
      const paymentIntent = await PaymentService.createPaymentIntent({
        creatorId,
        intentType: type,
        amountSats,
        amountUsd,
        title,
        description,
        contentUrl,
        contentId,
        metadata,
        isRecurring,
        recurrenceInterval,
        expiresInHours
      });

      // Generate QR code server-side
      let qrCodeUrl = paymentIntent.qrCodeUrl;
      try {
        qrCodeUrl = await QRCodeUtil.generatePaymentQR(paymentIntent.paymentUrl, {
          size: 256,
          errorCorrectionLevel: 'M'
        });
      } catch (error) {
        logger.warn('Failed to generate QR code for payment intent', { error: error.message, intentId: paymentIntent.intent_id });
        // Continue with fallback QR code if generation fails
      }

      res.status(201).json({
        success: true,
        data: {
          ...paymentIntent,
          qrCodeUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment intent details (public)
  async getIntent(req, res, next) {
    try {
      const { intentId } = req.params;
      
      const paymentIntent = await PaymentIntent.findById(intentId);
      
      if (!paymentIntent) {
        throw new NotFoundError('Payment intent');
      }

      // Hide sensitive data
      delete paymentIntent.metadata?.internal;
      
      res.json({
        success: true,
        data: paymentIntent
      });
    } catch (error) {
      next(error);
    }
  }

  // Get creator's payment intents
  async getCreatorIntents(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { limit = 50, offset = 0, activeOnly = true } = req.query;

      const paymentIntents = await PaymentIntent.findByCreator(creatorId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        activeOnly: activeOnly === 'true'
      });

      res.json({
        success: true,
        data: paymentIntents
      });
    } catch (error) {
      next(error);
    }
  }

  // Update payment intent
  async updateIntent(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid payment intent data', errors.array());
      }

      const { intentId } = req.params;
      const creatorId = req.creator.creator_id;
      
      // Verify ownership
      const intent = await PaymentIntent.findById(intentId);
      if (!intent) {
        throw new NotFoundError('Payment intent');
      }
      if (intent.creator_id !== creatorId) {
        throw new AppError('Not authorized to update this payment intent', 403);
      }

      const updates = {};
      const { title, description, amountSats, amountUsd, contentUrl, metadata } = req.body;
      
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (amountSats !== undefined) updates.amount_sats = amountSats;
      if (amountUsd !== undefined) updates.amount_usd = amountUsd;
      if (contentUrl !== undefined) updates.content_url = contentUrl;
      if (metadata !== undefined) updates.metadata = metadata;

      const updatedIntent = await PaymentIntent.update(intentId, updates);

      res.json({
        success: true,
        data: updatedIntent
      });
    } catch (error) {
      next(error);
    }
  }

  // Record payment (called by frontend after payment)
  async recordPayment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid transaction data', errors.array());
      }

      const {
        txid,
        paymentId,
        amountSats,
        senderAddress,
        metadata = {}
      } = req.body;

      const creatorId = req.creator.creator_id;

      // Use unified payment service
      const transaction = await PaymentService.processPayment({
        txid,
        paymentId,
        creatorId,
        amountSats,
        senderAddress,
        receiverAddress: req.creator.contract_address,
        metadata
      });

      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate payment link with custom parameters
  async generatePaymentLink(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { amountSats, description, metadata = {} } = req.body;

      // Validate micro-payment amount (dust limit check)
      if (amountSats) {
        const validation = MicropaymentService.validateAmount(amountSats);
        if (!validation.valid) {
          throw new ValidationError(validation.error, [{ msg: validation.error, param: 'amountSats' }]);
        }

        // Add micro-payment metadata
        if (MicropaymentService.isMicropayment(amountSats)) {
          metadata.isMicropayment = true;
          metadata.shouldBatch = MicropaymentService.shouldBatch(amountSats);
          
          // Calculate fee efficiency
          const BCHService = require('../services/bch.service');
          const feeEstimate = BCHService.estimateFee();
          const efficiency = MicropaymentService.analyzePaymentEfficiency(amountSats, feeEstimate.sats);
          metadata.feeEfficiency = efficiency;
        }
      }

      // Create a one-time payment intent
      const paymentIntent = await PaymentIntent.create({
        creatorId,
        amountSats,
        description: description || 'Quick Payment',
        metadata: {
          isQuickPayment: true,
          ...metadata
        }
      });

      const paymentUrl = `${process.env.FRONTEND_URL}/pay/${creatorId}/${paymentIntent.intent_id}`;

      // Generate QR code server-side
      let qrCode = null;
      try {
        qrCode = await QRCodeUtil.generatePaymentQR(paymentUrl, {
          size: 256,
          errorCorrectionLevel: 'M'
        });
      } catch (error) {
        logger.warn('Failed to generate QR code for payment link', { error: error.message, intentId: paymentIntent.intent_id });
        // Continue without QR code if generation fails
      }

      res.json({
        success: true,
        data: {
          paymentUrl,
          intentId: paymentIntent.intent_id,
          qrCode,
          micropaymentInfo: amountSats && MicropaymentService.isMicropayment(amountSats) ? {
            isMicropayment: true,
            shouldBatch: MicropaymentService.shouldBatch(amountSats),
            efficiency: metadata.feeEfficiency
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment status
  async getPaymentStatus(req, res, next) {
    try {
      const { txid } = req.params;
      const status = await PaymentService.getPaymentStatus(txid);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }

  // Estimate payment fee
  async estimateFee(req, res, next) {
    try {
      const { numInputs, numOutputs, priority, amountSats } = req.query;
      
      const feeEstimate = await PaymentService.estimateFee({
        numInputs: numInputs ? parseInt(numInputs) : undefined,
        numOutputs: numOutputs ? parseInt(numOutputs) : undefined,
        priority,
        amountSats: amountSats ? parseInt(amountSats) : undefined
      });

      res.json({
        success: true,
        data: feeEstimate
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment stats
  async getPaymentStats(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { startDate, endDate } = req.query;

      const stats = await PaymentService.getPaymentStats(
        creatorId,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
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

module.exports = new PaymentController();
