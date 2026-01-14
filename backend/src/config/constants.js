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
  
  BUSINESS_METRICS: {
    ARPU: 'arpu',
    CONVERSION_RATE: 'conversion_rate',
    CHURN_RATE: 'churn_rate',
    FEE_COLLECTION_RATE: 'fee_collection_rate',
    SUBSCRIPTION_REVENUE: 'subscription_revenue',
    WITHDRAWAL_FEE_REVENUE: 'withdrawal_fee_revenue'
  }
};
