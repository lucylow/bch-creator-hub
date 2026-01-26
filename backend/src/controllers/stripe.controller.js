const stripeService = require('../services/stripe.service');
const PaymentService = require('../services/payment.service');
const logger = require('../utils/logger');
const { AppError, ValidationError } = require('../utils/errors');

/**
 * Create a Stripe Checkout Session and return the URL to redirect the customer.
 * Public route (no auth). Body: creatorId, amountCents, successUrl, cancelUrl, optional description, customerEmail.
 */
async function createCheckoutSession(req, res, next) {
  try {
    const { creatorId, amountCents, currency, successUrl, cancelUrl, description, customerEmail, paymentIntentId, metadata } = req.body || {};
    if (!creatorId || amountCents == null) {
      throw new ValidationError('creatorId and amountCents are required');
    }
    const amount = Math.round(Number(amountCents));
    if (amount < 50) {
      throw new ValidationError('amountCents must be at least 50');
    }
    const base = (req.protocol && req.get('host'))
      ? `${req.protocol}://${req.get('host')}`
      : (process.env.FRONTEND_URL || 'http://localhost:8080');
    const success = successUrl || `${base}/pay/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel = cancelUrl || `${base}/pay/cancel`;

    const result = await stripeService.createCheckoutSession({
      creatorId,
      amountCents: amount,
      currency: currency || 'usd',
      successUrl: success,
      cancelUrl: cancel,
      paymentIntentId: paymentIntentId || undefined,
      metadata: metadata || {},
      description: description || 'Creator support payment',
      customerEmail: customerEmail || undefined
    });

    res.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        url: result.url
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Stripe webhook handler. Must receive raw body (express.raw for this route).
 * Verifies signature and on checkout.session.completed records the payment.
 */
async function webhook(req, res, next) {
  const rawBody = req.body;
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set');
    return res.status(503).json({ error: 'Stripe webhooks not configured' });
  }

  let event;
  try {
    const stripe = stripeService.getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { message: err.message });
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const creatorId = session.metadata?.creator_id;
    const amountTotal = session.amount_total; // in cents
    const currency = (session.currency || 'usd').toLowerCase();
    const customerEmail = session.customer_details?.email || session.customer_email || null;
    const paymentIntentId = session.payment_intent || null;

    if (!creatorId) {
      logger.warn('Stripe checkout.session.completed missing creator_id in metadata', { sessionId: session.id });
      return res.status(200).send(); // acknowledge to avoid retries
    }

    try {
      await PaymentService.recordStripePayment({
        sessionId: session.id,
        paymentIntentId: typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId?.id || null,
        creatorId,
        amountCents: amountTotal || 0,
        currency,
        customerEmail,
        metadata: session.metadata || {}
      });
    } catch (err) {
      logger.error('Failed to record Stripe payment', { sessionId: session.id, creatorId, error: err.message });
      return res.status(500).json({ error: 'Failed to record payment' });
    }
  }

  res.status(200).send();
}

/**
 * Check if Stripe is configured (for frontend feature flag).
 */
async function config(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        stripeEnabled: stripeService.isStripeConfigured()
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCheckoutSession,
  webhook,
  config
};
