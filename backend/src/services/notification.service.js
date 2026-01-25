const WebSocket = require('../websocket/server');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Notify creator of payment received
   */
  async notifyPaymentReceived(creatorId, transaction) {
    try {
      const wsServer = require('../websocket/server');
      
      // Send WebSocket notification (enriched for live feed and dashboard)
      wsServer.broadcastToCreator(creatorId, 'payment:received', {
        transaction: {
          txid: transaction.txid,
          amount_sats: transaction.amount_sats,
          sender_address: transaction.sender_address,
          confirmations: transaction.confirmations,
          is_confirmed: transaction.is_confirmed,
          payment_type: transaction.payment_type,
          block_height: transaction.block_height,
          content_id: transaction.content_id,
          indexed_at: transaction.indexed_at,
          created_at: transaction.indexed_at || transaction.created_at
        }
      });

      // In production, could also send email/SMS notifications here
      
      logger.info(`Payment notification sent to creator ${creatorId}`);
    } catch (error) {
      logger.error(`Error sending payment notification:`, error);
    }
  }

  /**
   * Notify creator of multiple payments in one message (efficient batch).
   */
  async notifyPaymentsBatch(creatorId, transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) return;
    try {
      const wsServer = require('../websocket/server');
      const items = transactions.map((t) => ({
        txid: t.txid,
        amount_sats: t.amount_sats,
        sender_address: t.sender_address,
        confirmations: t.confirmations,
        is_confirmed: t.is_confirmed,
        payment_type: t.payment_type,
        block_height: t.block_height,
        content_id: t.content_id,
        indexed_at: t.indexed_at,
        created_at: t.indexed_at || t.created_at
      }));
      wsServer.broadcastBatchToCreator(creatorId, 'payments:batch', items);
      logger.info(`Payments batch notification sent to creator ${creatorId} (${items.length} txns)`);
    } catch (error) {
      logger.error('Error sending payments batch notification:', error);
    }
  }

  /**
   * Notify creator of payment confirmed
   */
  async notifyPaymentConfirmed(creatorId, transaction) {
    try {
      const wsServer = require('../websocket/server');
      
      wsServer.broadcastToCreator(creatorId, 'payment:confirmed', {
        transaction: {
          txid: transaction.txid,
          amount_sats: transaction.amount_sats,
          confirmations: transaction.confirmations,
          is_confirmed: true
        }
      });
    } catch (error) {
      logger.error(`Error sending confirmation notification:`, error);
    }
  }

  /**
   * Notify creator of withdrawal status
   */
  async notifyWithdrawalStatus(creatorId, withdrawal) {
    try {
      const wsServer = require('../websocket/server');
      
      wsServer.broadcastToCreator(creatorId, 'withdrawal:status', {
        withdrawal: {
          id: withdrawal.id,
          status: withdrawal.status,
          txid: withdrawal.txid,
          amount_sats: withdrawal.amount_sats
        }
      });
    } catch (error) {
      logger.error(`Error sending withdrawal notification:`, error);
    }
  }

  /**
   * Notify creator of balance update
   */
  async notifyBalanceUpdate(creatorId, balance) {
    try {
      const wsServer = require('../websocket/server');
      
      wsServer.broadcastToCreator(creatorId, 'balance:update', balance);
    } catch (error) {
      logger.error(`Error sending balance update:`, error);
    }
  }
}

module.exports = new NotificationService();


