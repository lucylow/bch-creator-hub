# Business Model Implementation

This document summarizes the implementation of the business model features for BCH Paywall Router.

## Overview

The business model implementation includes:
1. **Freemium Subscription Tiers** (Free, Pro, Business)
2. **Fee Collection System** (fee-on-withdrawal and voluntary tips)
3. **Business Metrics Tracking** (ARPU, conversion rates, churn, fee collection)
4. **Withdrawal Management** with fee calculation

## Database Schema Changes

### Creators Table Updates
Added the following fields to the `creators` table:
- `subscription_tier` (VARCHAR, default: 'free')
- `subscription_status` (VARCHAR, default: 'active')
- `subscription_expires_at` (TIMESTAMP)
- `service_pubkey` (VARCHAR) - for fee collection address
- `payout_pubkey` (VARCHAR)
- `fee_opt_in` (BOOLEAN, default: true)

### New Tables

#### Subscriptions Table
Tracks subscription payments and billing periods:
- `id` (UUID, primary key)
- `creator_id` (references creators)
- `tier` (free, pro, business)
- `status` (active, trial, expired, canceled, past_due)
- `payment_txid` (transaction ID for subscription payment)
- `payment_amount_sats` (payment amount)
- `billing_period_start` / `billing_period_end`
- `canceled_at`
- `metadata` (JSONB)

#### Business Metrics Table
Tracks business KPIs:
- `id` (UUID, primary key)
- `metric_date` (DATE)
- `metric_type` (VARCHAR) - arpu, conversion_rate, churn_rate, fee_collection_rate, etc.
- `creator_id` (optional, for creator-specific metrics)
- `value` (DECIMAL)
- `metadata` (JSONB)

## Subscription Tiers & Pricing

### Free Tier
- Price: $0
- Features:
  - Basic dashboard
  - One universal address
  - Basic widget with standard branding
  - Unlimited basic payment links

### Pro Tier
- Price: 0.005 BCH (~$5/month)
- Features:
  - Premium analytics
  - Custom branding for widgets
  - 10 webhooks
  - Priority email support
  - 3 custom payment intents

### Business Tier
- Price: 0.025 BCH (~$25/month)
- Features:
  - All Pro features
  - API access
  - 100 webhooks
  - SLA
  - Team accounts
  - Onboarding help
  - Unlimited custom payment intents

## API Endpoints

### Subscription Management
- `GET /api/subscriptions` - Get current subscription
- `GET /api/subscriptions/pricing` - Get pricing for all tiers
- `POST /api/subscriptions` - Create/upgrade subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/renew` - Renew subscription
- `GET /api/subscriptions/features/:feature` - Check feature access

### Withdrawal Management
- `GET /api/withdrawals/preview?amountSats=<amount>` - Get withdrawal calculation preview
- `POST /api/withdrawals` - Create withdrawal
- `GET /api/withdrawals` - Get withdrawal history
- `GET /api/withdrawals/:id` - Get withdrawal by ID
- `POST /api/withdrawals/fee-opt-in` - Update fee opt-in preference

## Fee Collection System

### Fee-on-Withdrawal (Recommended for Pro/Business)
- Default for Pro and Business tiers
- 1% fee automatically calculated and included in withdrawal transaction
- Fee sent to service address (service_pubkey)
- Transparent and auditable on-chain

### Voluntary Tip (For Free Tier)
- Optional 1% tip for Free tier creators
- Can be toggled on/off via `fee_opt_in` setting
- Displayed as "Support the service (1%)" checkbox in UI

### Fee Calculation
The withdrawal service (`WithdrawalService`) calculates:
- Total withdrawal amount
- Service fee (1% if opted in)
- Network fee (estimated 250 sats)
- Net payout amount

## Business Metrics Service

The `BusinessMetricsService` tracks:
- **ARPU** (Average Revenue Per User)
- **Conversion Rate** (Free -> Pro/Business)
- **Churn Rate** (subscription cancellations)
- **Fee Collection Rate** (percentage of withdrawals with fees)
- **Revenue** (subscription revenue + withdrawal fees)

### Usage Example
```javascript
const BusinessMetricsService = require('./services/business-metrics.service');

// Get comprehensive metrics
const metrics = await BusinessMetricsService.getBusinessMetrics(startDate, endDate);

// Track specific metrics
await BusinessMetricsService.trackARPU();
await BusinessMetricsService.trackConversionRate();
await BusinessMetricsService.trackFeeCollectionRate();
```

## Models

### Subscription Model
- `create()` - Create new subscription
- `findByCreatorId()` - Get creator's subscription
- `findActiveByCreatorId()` - Get active subscription
- `cancel()` - Cancel subscription
- `renew()` - Renew subscription
- `findExpiring()` - Find subscriptions expiring soon

### BusinessMetric Model
- `create()` - Create metric record (upsert on conflict)
- `findByType()` - Get metrics by type
- `getAggregate()` - Get aggregated metrics
- `getLatest()` - Get latest metric value

## Services

### SubscriptionService
Manages subscription lifecycle:
- `createSubscription()` - Create or upgrade subscription
- `renewSubscription()` - Renew existing subscription
- `cancelSubscription()` - Cancel subscription
- `getCreatorSubscription()` - Get creator's current subscription
- `hasFeature()` - Check if creator has access to a feature
- `getFeatures()` - Get features for a tier
- `checkAndUpdateExpiredSubscriptions()` - Check for expired subscriptions

### WithdrawalService
Handles withdrawal fee calculation:
- `calculateWithdrawal()` - Calculate withdrawal amounts with fees
- `createWithdrawal()` - Create withdrawal record
- `getWithdrawalPreview()` - Get withdrawal preview for UI
- `updateFeeOptIn()` - Update fee opt-in preference

### BusinessMetricsService
Tracks business KPIs:
- `calculateARPU()` - Calculate average revenue per user
- `calculateConversionRate()` - Calculate conversion rate
- `calculateChurnRate()` - Calculate churn rate
- `calculateFeeCollectionRate()` - Calculate fee collection rate
- `getBusinessMetrics()` - Get comprehensive metrics
- `trackWithdrawalFeeRevenue()` - Track withdrawal fee revenue

## Configuration

Subscription pricing is configured in `src/config/constants.js`:
- `SUBSCRIPTION_TIERS` - Tier constants
- `SUBSCRIPTION_STATUS` - Status constants
- `SUBSCRIPTION_PRICING` - Pricing and features for each tier
- `BUSINESS_METRICS` - Metric type constants
- `DEFAULT_FEE_BASIS_POINTS` - Default fee (100 = 1%)

## Usage Examples

### Creating a Subscription
```javascript
const SubscriptionService = require('./services/subscription.service');

await SubscriptionService.createSubscription({
  creatorId: 'creator123',
  tier: 'pro',
  paymentTxid: 'txid...',
  paymentAmountSats: 500000 // 0.005 BCH
});
```

### Calculating Withdrawal with Fees
```javascript
const WithdrawalService = require('./services/withdrawal.service');

const calculation = await WithdrawalService.calculateWithdrawal({
  creatorId: 'creator123',
  totalSats: 1000000,
  includeServiceFee: null // auto-detect
});

console.log(calculation.breakdown);
// {
//   total: 1000000,
//   serviceFee: 10000,  // 1%
//   networkFee: 250,
//   payout: 989750
// }
```

### Getting Business Metrics
```javascript
const BusinessMetricsService = require('./services/business-metrics.service');

const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');

const metrics = await BusinessMetricsService.getBusinessMetrics(startDate, endDate);
console.log(metrics);
// {
//   arpu: { arpu: 5000, totalCreators: 100, totalRevenue: 500000 },
//   conversionRate: { conversionRate: 5, paidSubscribers: 5, totalCreators: 100 },
//   churnRate: { churnRate: 2, canceledCount: 2, activeCount: 100 },
//   feeCollectionRate: { feeCollectionRate: 30, ... },
//   revenue: { subscription: 500000, withdrawalFees: 10000, total: 510000 }
// }
```

## Next Steps

1. **Frontend Integration**: Implement subscription management UI
2. **Payment Processing**: Integrate subscription payment handling
3. **Automated Renewals**: Set up cron jobs for subscription renewals
4. **Expired Subscription Check**: Run periodic checks for expired subscriptions
5. **Business Metrics Dashboard**: Build admin dashboard for metrics
6. **Webhook Integration**: Add webhooks for subscription events
7. **Email Notifications**: Send emails for subscription events (expiring, canceled, etc.)

## Notes

- All subscription payments are in BCH (satoshis)
- Fee collection is non-custodial (fees included in withdrawal transaction)
- Business metrics are tracked daily
- Subscription expiration is checked via cron job (to be implemented)
- Fee opt-in defaults to `true` for all tiers



