const express = require('express');
const stripeController = require('../controllers/stripe.controller');

const router = express.Router();

// Public: create checkout session (call from payment page)
router.post('/create-checkout-session', stripeController.createCheckoutSession);

// Public: whether Stripe is enabled (for frontend)
router.get('/config', stripeController.config);

module.exports = router;
