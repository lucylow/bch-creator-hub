const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticateCreator } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { SUBSCRIPTION_TIERS } = require('../config/constants');

// All routes require authentication
router.use(authenticateCreator);

// Get current subscription
router.get('/', subscriptionController.getSubscription);

// Get pricing for all tiers
router.get('/pricing', subscriptionController.getPricing);

// Create or upgrade subscription
router.post(
  '/',
  [
    body('tier')
      .isIn(Object.values(SUBSCRIPTION_TIERS))
      .withMessage('Invalid subscription tier'),
    body('paymentTxid').optional().isString(),
    body('paymentAmountSats').optional().isInt({ min: 0 })
  ],
  subscriptionController.createSubscription
);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// Renew subscription
router.post('/renew', subscriptionController.renewSubscription);

// Check feature access
router.get('/features/:feature', subscriptionController.checkFeature);

module.exports = router;

