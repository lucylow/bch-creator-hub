const PaymentIntent = require('../models/PaymentIntent');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const { generateRandomId } = require('../utils/generators');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, ConflictError, AppError } = require('../utils/errors');

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

      // Calculate expiration
      let expiresAt = null;
      if (expiresInHours) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);
      }

      const paymentIntent = await PaymentIntent.create({
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
        expiresAt
      });

      // Generate payment URL
      const paymentUrl = `${process.env.FRONTEND_URL}/pay/${creatorId}/${paymentIntent.intent_id}`;

      res.status(201).json({
        success: true,
        data: {
          ...paymentIntent,
          paymentUrl,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
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

      // Get payment intent
      const paymentIntent = await PaymentIntent.findById(paymentId);
      if (!paymentIntent) {
        throw new NotFoundError('Payment intent');
      }
      if (paymentIntent.creator_id !== creatorId) {
        throw new AppError('Not authorized to record payment for this intent', 403);
      }

      // Check if transaction already exists
      const existingTx = await Transaction.findByTxid(txid);
      if (existingTx) {
        throw new ConflictError('Transaction already recorded');
      }

      // Create transaction record
      const transaction = await Transaction.create({
        txid,
        creatorId,
        paymentIntentId: paymentIntent.id,
        intentId: paymentIntent.intent_id,
        amountSats,
        senderAddress,
        receiverAddress: req.creator.contract_address,
        paymentType: paymentIntent.intent_type,
        contentId: paymentIntent.content_id,
        payloadJson: metadata,
        isConfirmed: false,
        metadata: {
          recordedVia: 'frontend',
          ...metadata
        }
      });

      // Update creator balance cache
      const redis = require('../config/redis');
      await redis.del(`creator:${creatorId}:balance`);

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

      res.json({
        success: true,
        data: {
          paymentUrl,
          intentId: paymentIntent.intent_id,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
