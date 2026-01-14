const axios = require('axios');
const crypto = require('crypto');
const Webhook = require('../models/Webhook');
const logger = require('../utils/logger');

class WebhookService {
  /**
   * Trigger webhook for a creator
   */
  async triggerWebhook(webhookId, event, data) {
    try {
      const webhook = await Webhook.findById(webhookId);
      
      if (!webhook || !webhook.is_active) {
        return { success: false, error: 'Webhook not found or inactive' };
      }

      // Check if webhook subscribes to this event
      if (!webhook.events.includes(event)) {
        return { success: false, error: 'Event not subscribed' };
      }

      // Create signature
      const signature = this.createSignature(webhook.secret, JSON.stringify(data));

      // Send webhook
      const response = await axios.post(webhook.url, {
        event,
        data,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      // Update last triggered
      await Webhook.updateLastTriggered(webhookId);

      return {
        success: true,
        status: response.status,
        response: response.data
      };
    } catch (error) {
      logger.error(`Webhook trigger error for ${webhookId}:`, error);
      
      // Increment failure count
      await Webhook.incrementFailureCount(webhookId);
      
      // Deactivate webhook after 10 failures
      const webhook = await Webhook.findById(webhookId);
      if (webhook && webhook.failure_count >= 10) {
        await Webhook.deactivate(webhookId);
        logger.warn(`Webhook ${webhookId} deactivated after 10 failures`);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Trigger payment webhooks for a creator
   */
  async triggerPaymentWebhooks(creatorId, transaction) {
    try {
      const webhooks = await Webhook.findByCreator(creatorId, true);
      
      const event = transaction.is_confirmed ? 'payment.confirmed' : 'payment.received';
      
      const promises = webhooks
        .filter(wh => wh.events.includes(event))
        .map(wh => this.triggerWebhook(wh.id, event, {
          transaction: {
            txid: transaction.txid,
            amount_sats: transaction.amount_sats,
            sender_address: transaction.sender_address,
            receiver_address: transaction.receiver_address,
            confirmations: transaction.confirmations,
            is_confirmed: transaction.is_confirmed
          },
          creator_id: creatorId
        }));

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error(`Error triggering payment webhooks for creator ${creatorId}:`, error);
    }
  }

  /**
   * Trigger withdrawal webhooks
   */
  async triggerWithdrawalWebhooks(creatorId, withdrawal) {
    try {
      const webhooks = await Webhook.findByCreator(creatorId, true);
      
      const event = withdrawal.status === 'completed' 
        ? 'withdrawal.completed' 
        : withdrawal.status === 'failed'
        ? 'withdrawal.failed'
        : null;

      if (!event) return;

      const promises = webhooks
        .filter(wh => wh.events.includes(event))
        .map(wh => this.triggerWebhook(wh.id, event, {
          withdrawal: {
            id: withdrawal.id,
            txid: withdrawal.txid,
            amount_sats: withdrawal.amount_sats,
            fee_sats: withdrawal.fee_sats,
            to_address: withdrawal.to_address,
            status: withdrawal.status
          },
          creator_id: creatorId
        }));

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error(`Error triggering withdrawal webhooks for creator ${creatorId}:`, error);
    }
  }

  /**
   * Create HMAC signature for webhook
   */
  createSignature(secret, payload) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(secret, payload, signature) {
    const expectedSignature = this.createSignature(secret, payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = new WebhookService();
