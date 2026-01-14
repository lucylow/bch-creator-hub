const express = require('express');
const router = express.Router();
const payloadController = require('../controllers/payload.controller');
const { verifyToken, paymentLimiter } = require('../middleware/auth.middleware');
const { validatePayloadLink, validateTransactionBroadcast, validateCreatorId } = require('../middleware/validation.middleware');

/**
 * Generate OP_RETURN payment link (authenticated)
 * POST /api/creator/:creatorId/payment-link
 * Requires: Bearer token, creator can only create links for themselves
 */
router.post(
  '/creator/:creatorId/payment-link', 
  verifyToken, 
  validatePayloadLink, 
  payloadController.generatePayloadLink
);

/**
 * Get creator metadata (public, for payment page)
 * GET /api/creator/:creatorId/meta
 * Public endpoint - no authentication required
 */
router.get(
  '/creator/:creatorId/meta', 
  validateCreatorId, 
  payloadController.getCreatorMeta
);

/**
 * Broadcast transaction (authenticated)
 * POST /api/tx/broadcast
 * Requires: Bearer token, rate limited
 */
router.post(
  '/tx/broadcast', 
  verifyToken, 
  paymentLimiter, 
  validateTransactionBroadcast, 
  payloadController.broadcastTransaction
);

module.exports = router;
