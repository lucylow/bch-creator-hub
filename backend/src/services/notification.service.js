const WebSocket = require('../websocket/server');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Notify creator of payment received
   */
  async notifyPaymentReceived(creatorId, transaction) {
    try {
      const wsServer = require('../websocket/server');
      
      // Send WebSocket notification
      wsServer.broadcastToCreator(creatorId, 'payment:received', {
        transaction: {
          txid: transaction.txid,
          amount_sats: transaction.amount_sats,
          sender_address: transaction.sender_address,
          confirmations: transaction.confirmations,
          is_confirmed: transaction.is_confirmed
        }
      });

      // In production, could also send email/SMS notifications here
      
      logger.info(`Payment notification sent to creator ${creatorId}`);
    } catch (error) {
      logger.error(`Error sending payment notification:`, error);
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
          confirmations: transaction.confirmations
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

