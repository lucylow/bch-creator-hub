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
  totalCreators: 12,
  totalPayments: 142,
  avgFee: 0.9,
  totalRevenue: 1250000, // sats
  activeUsers: 45,
  contentUnlocks: 89,
};

/**
 * Get revenue chart data for a period
 */
export function getRevenueChartData(days: 7 | 30 = 7): number[] {
  return days === 7 ? MOCK_ANALYTICS.revenue7d : MOCK_ANALYTICS.revenue30d;
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary() {
  return MOCK_ANALYTICS;
}

