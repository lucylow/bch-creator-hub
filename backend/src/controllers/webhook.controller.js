const Webhook = require('../models/Webhook');
const { validationResult } = require('express-validator');
const { ValidationError, NotFoundError, AppError } = require('../utils/errors');

class WebhookController {
  // Create webhook
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid webhook data', errors.array());
      }

      const creatorId = req.creator.creator_id;
      const { url, events = ['payment.received', 'payment.confirmed', 'withdrawal.completed'] } = req.body;

      const webhook = await Webhook.create({
        creatorId,
        url,
        events
      });

      res.status(201).json({
        success: true,
        data: webhook
      });
    } catch (error) {
      next(error);
    }
  }

  // Get webhooks for creator
  async getWebhooks(req, res, next) {
    try {
      const creatorId = req.creator.creator_id;
      const { activeOnly = true } = req.query;

      const webhooks = await Webhook.findByCreator(creatorId, activeOnly === 'true');

      res.json({
        success: true,
        data: webhooks
      });
    } catch (error) {
      next(error);
    }
  }

  // Update webhook
  async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid webhook data', errors.array());
      }

      const { id } = req.params;
      const creatorId = req.creator.creator_id;

      // Verify ownership
      const webhook = await Webhook.findById(id);
      if (!webhook) {
        throw new NotFoundError('Webhook');
      }
      if (webhook.creator_id !== creatorId) {
        throw new AppError('Not authorized to update this webhook', 403);
      }

      const { url, events, isActive } = req.body;
      const updates = {};
      if (url) updates.url = url;
      if (events) updates.events = events;
      if (isActive !== undefined) updates.is_active = isActive;

      const updatedWebhook = await Webhook.update(id, updates);

      res.json({
        success: true,
        data: updatedWebhook
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete webhook
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const creatorId = req.creator.creator_id;

      // Verify ownership
      const webhook = await Webhook.findById(id);
      if (!webhook) {
        throw new NotFoundError('Webhook');
      }
      if (webhook.creator_id !== creatorId) {
        throw new AppError('Not authorized to delete this webhook', 403);
      }

      await Webhook.deactivate(id);

      res.json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WebhookController();
