const Stripe = require('stripe');
const logger = require('../utils/logger');
const { AppError, ValidationError } = require('../utils/errors');

let stripe = null;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError('Stripe is not configured (missing STRIPE_SECRET_KEY)', 503);
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  }
  return stripe;
}

function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create a Stripe Checkout Session for a one-time payment.
 * @param {Object} params
 * @param {string} params.creatorId - Internal creator ID
 * @param {number} params.amountCents - Amount in cents (e.g. 500 = $5.00)
 * @param {string} [params.currency='usd']
 * @param {string} params.successUrl - Redirect after success
 * @param {string} params.cancelUrl - Redirect if user cancels
 * @param {string} [params.paymentIntentId] - Optional payment intent ID for linking to existing intent
 * @param {Object} [params.metadata] - Extra metadata to attach to the session
 * @param {string} [params.description] - Line item description
 * @param {string} [params.customerEmail] - Prefill customer email
 */
async function createCheckoutSession({
  creatorId,
  amountCents,
  currency = 'usd',
  successUrl,
  cancelUrl,
  paymentIntentId,
  metadata = {},
  description = 'Creator support payment',
  customerEmail
}) {
  if (!creatorId || amountCents == null || amountCents < 50) {
    throw new ValidationError('creatorId and amountCents (min 50) are required');
  }
  if (!successUrl || !cancelUrl) {
    throw new ValidationError('successUrl and cancelUrl are required');
  }

  const s = getStripe();
  const sessionParams = {
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(amountCents),
          product_data: {
            name: 'Creator support',
            description: description || 'Payment to creator',
            images: metadata.imageUrl ? [metadata.imageUrl] : undefined
          }
        },
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      creator_id: String(creatorId),
      ...metadata
    },
    payment_intent_data: {
      metadata: {
        creator_id: String(creatorId),
        ...metadata
      }
    }
  };

  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  const session = await s.checkout.sessions.create(sessionParams);
  return {
    sessionId: session.id,
    url: session.url
  };
}

module.exports = {
  getStripe,
  isStripeConfigured,
  createCheckoutSession
};
