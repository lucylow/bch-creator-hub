/**
 * Mock Analytics Data
 * 
 * Simulates analytics and chart data for dashboards.
 */
export const MOCK_ANALYTICS = {
  revenue7d: [5000, 12000, 8000, 16000, 22000, 15000, 18000],
  revenue30d: [
    5000, 12000, 8000, 16000, 22000, 15000, 18000,
    14000, 19000, 21000, 17000, 23000, 20000, 16000,
    18000, 22000, 19000, 24000, 21000, 20000, 18000,
    22000, 25000, 23000, 21000, 24000, 22000, 20000,
  ],
  revenue90d: [
    // First 30 days (above)
    5000, 12000, 8000, 16000, 22000, 15000, 18000,
    14000, 19000, 21000, 17000, 23000, 20000, 16000,
    18000, 22000, 19000, 24000, 21000, 20000, 18000,
    22000, 25000, 23000, 21000, 24000, 22000, 20000,
    // Days 31-60
    21000, 26000, 24000, 27000, 25000, 28000, 23000,
    26000, 29000, 27000, 28000, 30000, 27000, 25000,
    26000, 31000, 29000, 30000, 28000, 32000, 29000,
    30000, 33000, 31000, 32000, 30000, 29000, 31000,
    // Days 61-90
    33000, 35000, 34000, 36000, 35000, 38000, 34000,
    37000, 39000, 38000, 40000, 39000, 37000, 38000,
    40000, 42000, 41000, 43000, 42000, 44000, 41000,
    42000, 45000, 44000, 46000, 45000, 44000, 45000,
  ],
  totalCreators: 28,
  totalPayments: 342,
  avgFee: 0.9,
  totalRevenue: 8520000, // sats
  activeUsers: 127,
  contentUnlocks: 234,
  subscriptions: 56,
  tips: 178,
  topCreators: [
    { address: "bitcoincash:qpalice000000000000000000000000", revenue: 2100000, payments: 87 },
    { address: "bitcoincash:qpbbob0000000000000000000000000", revenue: 1850000, payments: 72 },
    { address: "bitcoincash:qpcharlie000000000000000000000", revenue: 1420000, payments: 58 },
    { address: "bitcoincash:qpdiana00000000000000000000000", revenue: 1280000, payments: 51 },
  ],
  topContent: [
    { contentId: "post_ethereum_vs_bch", unlocks: 42, revenue: 420000 },
    { contentId: "video_cashscript_intro", unlocks: 38, revenue: 190000 },
    { contentId: "article_bch_scaling", unlocks: 35, revenue: 525000 },
    { contentId: "tutorial_cashtokens", unlocks: 31, revenue: 620000 },
    { contentId: "guide_slp_tokens", unlocks: 28, revenue: 840000 },
  ],
  paymentMethods: {
    direct: 156,
    subscription: 87,
    unlock: 99,
  },
  platformStats: {
    totalVolume: 12500000,
    platformFees: 112500,
    creatorEarnings: 12387500,
    avgTransactionSize: 36549,
  },
};

/**
 * Get revenue chart data for a period
 */
export function getRevenueChartData(days: 7 | 30 | 90 = 7): number[] {
  if (days === 7) return MOCK_ANALYTICS.revenue7d;
  if (days === 30) return MOCK_ANALYTICS.revenue30d;
  return MOCK_ANALYTICS.revenue90d;
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary() {
  return MOCK_ANALYTICS;
}

/**
 * Get top creators
 */
export function getTopCreators(limit: number = 10) {
  return MOCK_ANALYTICS.topCreators.slice(0, limit);
}

/**
 * Get top content
 */
export function getTopContent(limit: number = 10) {
  return MOCK_ANALYTICS.topContent.slice(0, limit);
}

/**
 * Get payment method breakdown
 */
export function getPaymentMethodBreakdown() {
  return MOCK_ANALYTICS.paymentMethods;
}

/**
 * Get platform statistics
 */
export function getPlatformStats() {
  return MOCK_ANALYTICS.platformStats;
}

