const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken, paymentLimiter } = require('../middleware/auth.middleware');
const { validatePaymentIntent, validateTransaction, validateIntentId } = require('../middleware/validation.middleware');

// Public routes (no auth required)
router.get('/intent/:intentId', validateIntentId, paymentController.getIntent);
router.get('/fee/estimate', paymentController.estimateFee);

// Protected routes (require auth)
router.use(verifyToken);

// Create payment intent
router.post('/intent', validatePaymentIntent, paymentController.createIntent);

// Get creator's payment intents
router.get('/intents', paymentController.getCreatorIntents);

// Update payment intent
router.put('/intent/:intentId', validateIntentId, validatePaymentIntent, paymentController.updateIntent);

// Record payment
router.post('/record', paymentLimiter, validateTransaction, paymentController.recordPayment);

// Generate payment link
router.post('/link', paymentController.generatePaymentLink);

// Get payment status (public)
router.get('/status/:txid', paymentController.getPaymentStatus);

// Get payment stats (protected)
router.get('/stats', paymentController.getPaymentStats);

module.exports = router;
