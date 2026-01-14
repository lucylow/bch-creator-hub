/**
 * Payload Controller
 * Handles OP_RETURN payment link generation and transaction broadcasting
 */

const { pool } = require('../config/database');
const BCHService = require('../services/bch.service');
const { encodePayload } = require('../lib/payload');
const logger = require('../utils/logger');
const { 
  NotFoundError, 
  ValidationError, 
  AuthorizationError, 
  ExternalServiceError
} = require('../utils/errors');

class PayloadController {
  /**
   * Generate OP_RETURN payment link
   * POST /api/creator/:creatorId/payment-link
   * Requires authentication and authorization (creator can only create links for themselves)
   */
  async generatePayloadLink(req, res, next) {
    try {
      const { creatorId } = req.params;
      const { paymentType = 1, contentId, amountSats, metadata } = req.body;

      // Authorization check: ensure creator can only create payloads for themselves
      if (req.creator && req.creator.creator_id !== creatorId) {
        throw new AuthorizationError('You can only create payment links for your own account');
      }

      // Verify creator exists
      const creatorRes = await pool.query(
        'SELECT creator_id, contract_address, display_name FROM creators WHERE creator_id = $1',
        [creatorId]
      );

      if (creatorRes.rowCount === 0) {
        throw new NotFoundError('Creator');
      }

      const creator = creatorRes.rows[0];

      // Validate and encode payload
      let payloadBuf;
      try {
        payloadBuf = encodePayload({
          creatorId,
          paymentType,
          contentId,
          metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : undefined
        });
      } catch (error) {
        throw new ValidationError(`Invalid payload parameters: ${error.message}`);
      }

      const payloadHex = payloadBuf.toString('hex');

      // Generate payment URL
      const dashboardUrl = process.env.DASHBOARD_URL || process.env.FRONTEND_URL || 'https://paywall.local';
      const url = `${dashboardUrl}/pay/${creatorId}?payload=${payloadHex}${amountSats ? `&amt=${amountSats}` : ''}`;

      // Optionally store payment intent if amount or contentId is provided
      if (amountSats || contentId) {
        try {
          await pool.query(
            `INSERT INTO payment_intents (creator_id, intent_type, content_id, amount_sats, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT DO NOTHING`,
            [
              creatorId,
              paymentType,
              contentId ? String(contentId) : null,
              amountSats || null,
              metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null
            ]
          );
        } catch (error) {
          logger.warn('Failed to store payment intent (non-critical):', error);
          // Don't throw error as this is optional
        }
      }

      res.json({
        success: true,
        data: {
          url,
          payloadHex,
          contractAddress: creator.contract_address,
          amountSats: amountSats || null,
          paymentType,
          contentId: contentId || null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get creator metadata (contract address, etc.)
   * GET /api/creator/:creatorId/meta
   * Public endpoint - no authentication required
   */
  async getCreatorMeta(req, res, next) {
    try {
      const { creatorId } = req.params;

      const result = await pool.query(
        `SELECT creator_id, contract_address, payout_pubkey, service_pubkey, fee_basis_points, display_name, created_at
         FROM creators WHERE creator_id = $1`,
        [creatorId]
      );

      if (result.rowCount === 0) {
        throw new NotFoundError('Creator');
      }

      const creator = result.rows[0];

      res.json({
        success: true,
        data: {
          creatorId: creator.creator_id,
          contractAddress: creator.contract_address,
          payoutPubkey: creator.payout_pubkey,
          servicePubkey: creator.service_pubkey,
          feeBasisPoints: creator.fee_basis_points,
          displayName: creator.display_name,
          createdAt: creator.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Broadcast signed transaction
   * POST /api/tx/broadcast
   * Requires authentication
   */
  async broadcastTransaction(req, res, next) {
    try {
      const { signedTxHex } = req.body;

      // Validation should be handled by middleware, but double-check
      if (!signedTxHex || typeof signedTxHex !== 'string') {
        throw new ValidationError('Signed transaction hex is required and must be a string');
      }

      // Normalize hex string (remove whitespace, convert to lowercase)
      const normalizedTxHex = signedTxHex.trim().toLowerCase();

      // Validate hex format
      if (!/^[0-9a-f]+$/.test(normalizedTxHex)) {
        throw new ValidationError('Transaction hex must contain only hexadecimal characters');
      }

      // Broadcast transaction via BCH service
      const result = await BCHService.broadcastTransaction(normalizedTxHex);

      if (!result.success) {
        // BCH service returns success: false on error
        throw new ExternalServiceError('BCH Network', result.error || 'Transaction broadcast failed');
      }

      logger.info(`Transaction broadcast successful: ${result.txid}`, {
        txid: result.txid,
        creatorId: req.creator?.creator_id
      });

      res.json({
        success: true,
        data: {
          txid: result.txid,
          message: 'Transaction broadcast successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PayloadController();
