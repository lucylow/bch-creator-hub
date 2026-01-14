/**
 * Payload Controller
 * Handles OP_RETURN payment link generation and transaction broadcasting
 */

const { pool } = require('../config/database');
const BCHService = require('../services/bch.service');
const { encodePayload } = require('../lib/payload');
const logger = require('../utils/logger');
const crypto = require('crypto');

class PayloadController {
  /**
   * Generate OP_RETURN payment link
   * POST /api/creator/:creatorId/payment-link
   */
  async generatePayloadLink(req, res) {
    try {
      const { creatorId } = req.params;
      const { paymentType = 1, contentId, amountSats, metadata } = req.body;

      // Verify creator exists
      const creatorRes = await pool.query(
        'SELECT creator_id, contract_address FROM creators WHERE creator_id = $1',
        [creatorId]
      );

      if (creatorRes.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Creator not found'
        });
      }

      const creator = creatorRes.rows[0];

      // Encode payload
      const payloadBuf = encodePayload({
        creatorId,
        paymentType,
        contentId,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      });

      const payloadHex = payloadBuf.toString('hex');

      // Generate payment URL
      const dashboardUrl = process.env.DASHBOARD_URL || process.env.FRONTEND_URL || 'https://paywall.local';
      const url = `${dashboardUrl}/pay/${creatorId}?payload=${payloadHex}&amt=${amountSats || ''}`;

      // Optionally store payment intent
      if (amountSats || contentId) {
        await pool.query(
          `INSERT INTO payment_intents (creator_id, intent_type, content_id, amount_sats, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT DO NOTHING`,
          [
            creatorId,
            paymentType,
            contentId ? String(contentId) : null,
            amountSats || null,
            metadata ? JSON.stringify(metadata) : null
          ]
        );
      }

      res.json({
        success: true,
        data: {
          url,
          payloadHex,
          contractAddress: creator.contract_address,
          amountSats: amountSats || null
        }
      });
    } catch (error) {
      logger.error('Generate payload link error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate payment link'
      });
    }
  }

  /**
   * Get creator metadata (contract address, etc.)
   * GET /api/creator/:creatorId/meta
   */
  async getCreatorMeta(req, res) {
    try {
      const { creatorId } = req.params;

      const result = await pool.query(
        `SELECT creator_id, contract_address, payout_pubkey, service_pubkey, fee_basis_points, display_name
         FROM creators WHERE creator_id = $1`,
        [creatorId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Creator not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Get creator meta error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get creator metadata'
      });
    }
  }

  /**
   * Broadcast signed transaction
   * POST /api/tx/broadcast
   */
  async broadcastTransaction(req, res) {
    try {
      const { signedTxHex } = req.body;

      if (!signedTxHex) {
        return res.status(400).json({
          success: false,
          error: 'signedTxHex is required'
        });
      }

      const result = await BCHService.broadcastTransaction(signedTxHex);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Broadcast failed'
        });
      }

      res.json({
        success: true,
        data: {
          txid: result.txid
        }
      });
    } catch (error) {
      logger.error('Broadcast transaction error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Broadcast failed'
      });
    }
  }
}

module.exports = new PayloadController();

