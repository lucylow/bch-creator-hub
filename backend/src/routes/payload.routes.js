const express = require('express');
const router = express.Router();
const payloadController = require('../controllers/payload.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Generate OP_RETURN payment link (authenticated)
router.post('/creator/:creatorId/payment-link', verifyToken, payloadController.generatePayloadLink);

// Get creator metadata (public, for payment page)
router.get('/creator/:creatorId/meta', payloadController.getCreatorMeta);

// Broadcast transaction (authenticated)
router.post('/tx/broadcast', verifyToken, payloadController.broadcastTransaction);

module.exports = router;

