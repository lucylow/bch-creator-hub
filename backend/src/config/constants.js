module.exports = {
  PAYMENT_TYPES: {
    ONE_TIME: 1,
    RECURRING: 2,
    TIP: 3,
    SUBSCRIPTION: 4
  },
  
  INTENT_TYPES: {
    PAYMENT: 1,
    TIP: 2,
    SUBSCRIPTION: 3,
    DONATION: 4
  },
  
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },
  
  WITHDRAWAL_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },
  
  WEBHOOK_EVENTS: {
    PAYMENT_RECEIVED: 'payment.received',
    PAYMENT_CONFIRMED: 'payment.confirmed',
    WITHDRAWAL_COMPLETED: 'withdrawal.completed',
    WITHDRAWAL_FAILED: 'withdrawal.failed',
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_RENEWED: 'subscription.renewed',
    SUBSCRIPTION_CANCELED: 'subscription.canceled'
  },
  
  SUBSCRIPTION_TIERS: {
    FREE: 'free',
    PRO: 'pro',
    BUSINESS: 'business'
  },
  
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    TRIAL: 'trial',
    EXPIRED: 'expired',
    CANCELED: 'canceled',
    PAST_DUE: 'past_due'
  },
  
  // Subscription pricing in BCH (sats equivalent)
  SUBSCRIPTION_PRICING: {
    free: {
      priceSats: 0,
      priceBCH: 0,
      features: {
        analytics: false,
        customBranding: false,
        apiAccess: false,
        webhooks: 0,
        prioritySupport: false,
        customPaymentIntents: 0
      }
    },
    pro: {
      priceSats: 500000, // 0.005 BCH (~$5/month)
      priceBCH: 0.005,
      features: {
        analytics: true,
        customBranding: true,
        apiAccess: false,
        webhooks: 10,
        prioritySupport: true,
        customPaymentIntents: 3
      }
    },
    business: {
      priceSats: 2500000, // 0.025 BCH (~$25/month)
      priceBCH: 0.025,
      features: {
        analytics: true,
        customBranding: true,
        apiAccess: true,
        webhooks: 100,
        prioritySupport: true,
        customPaymentIntents: -1, // unlimited
        sla: true,
        teamAccounts: true,
        onboarding: true
      }
    }
  },
  
  DEFAULT_FEE_BASIS_POINTS: 100, // 1%
  MIN_CONFIRMATIONS: 3,
  CACHE_TTL: {
    BALANCE: 300, // 5 minutes
    CREATOR_PROFILE: 600, // 10 minutes
    TRANSACTION: 1800 // 30 minutes
  },
  
  // Micro-payment settings
  MICROPAYMENT: {
    DUST_LIMIT: 546, // Minimum BCH output (dust limit)
    MIN_AMOUNT: 546, // Minimum payment amount in satoshis
    MAX_AMOUNT: 100000, // 0.001 BCH - typical micro-payment upper bound
    BATCH_THRESHOLD: 10000, // 0.0001 BCH - below this, suggest batching
    BATCH_SIZE: 10, // Number of payments to batch together
    BATCH_TIMEOUT: 300000, // 5 minutes - max time to wait for batching
    FEE_OPTIMIZATION_THRESHOLD: 5000, // 0.00005 BCH - optimize fees below this
    MIN_FEE_PER_BYTE: 1.0, // Minimum fee per byte for micro-payments
    RECOMMENDED_FEE_PER_BYTE: 1.0, // Recommended fee per byte
    FAST_FEE_PER_BYTE: 1.5 // Fast confirmation fee per byte
  },
  
  BUSINESS_METRICS: {
    ARPU: 'arpu',
    CONVERSION_RATE: 'conversion_rate',
    CHURN_RATE: 'churn_rate',
    FEE_COLLECTION_RATE: 'fee_collection_rate',
    SUBSCRIPTION_REVENUE: 'subscription_revenue',
    WITHDRAWAL_FEE_REVENUE: 'withdrawal_fee_revenue'
  }
};
