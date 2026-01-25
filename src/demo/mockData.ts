/**
 * Mock data generators for demo mode
 * These provide realistic-looking data when the backend is not available
 */

import type { DashboardStats, Transaction, PaymentIntent } from '@/types/api';

// Helper to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper to generate random BCH address
const generateBCHAddress = () => `bitcoincash:qr${generateId()}${generateId()}`.substring(0, 42);

// Helper to generate random transaction hash
const generateTxHash = () => {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

/**
 * Generate mock dashboard stats
 */
export function generateMockDashboardStats(period: '7d' | '30d' | '90d' = '30d'): DashboardStats {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  
  // Generate chart data
  const earningsChart = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    earningsChart.push({
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 500000) + 50000, // 0.0005 - 0.0055 BCH
    });
  }

  // Calculate totals from chart data
  const totalFromChart = earningsChart.reduce((sum, item) => sum + item.amount, 0);
  const todayEarnings = earningsChart[earningsChart.length - 1]?.amount || 0;

  return {
    totalBalance: Math.floor(Math.random() * 50000000) + 10000000, // 0.1 - 0.6 BCH
    todayEarnings,
    monthlyEarnings: totalFromChart,
    transactionCount: Math.floor(Math.random() * 150) + 25,
    avgTransaction: Math.floor(totalFromChart / (Math.floor(Math.random() * 50) + 10)),
    activeSupporters: Math.floor(Math.random() * 50) + 5,
    earningsChart,
    recentTransactions: generateMockTransactions(5),
  };
}

/**
 * Generate mock transactions
 */
export function generateMockTransactions(count: number = 10): Transaction[] {
  const statuses: Array<'pending' | 'confirmed' | 'failed'> = ['confirmed', 'confirmed', 'confirmed', 'pending'];
  const paymentTypes = ['tip', 'subscription', 'unlock', 'donation'];
  
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 72));
    
    return {
      id: generateId(),
      txid: generateTxHash(),
      creatorId: 'demo-creator',
      senderAddress: generateBCHAddress(),
      recipientAddress: generateBCHAddress(),
      amountSats: Math.floor(Math.random() * 500000) + 10000, // 0.0001 - 0.005 BCH
      feeSats: Math.floor(Math.random() * 500) + 100,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      confirmations: Math.floor(Math.random() * 10),
      createdAt: date.toISOString(),
      paymentType: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Generate mock payment intents
 */
export function generateMockPaymentIntents(count: number = 5): PaymentIntent[] {
  const titles = [
    'Premium Article Access',
    'Monthly Supporter Tier',
    'Video Tutorial Bundle',
    'Quick Tip',
    'Exclusive Content Pass',
    'Community Membership',
    'Workshop Recording',
  ];

  return Array.from({ length: count }, () => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const isFixedAmount = Math.random() > 0.3;
    const id = generateId();
    
    return {
      id,
      intentId: id,
      creatorId: 'demo-creator',
      type: isFixedAmount ? 1 : 2,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: 'Support my creative work and get exclusive access.',
      amountSats: isFixedAmount ? Math.floor(Math.random() * 1000000) + 50000 : 0,
      status: 'active',
      isRecurring: false,
      metadata: {},
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      paymentUrl: `https://bchpaywallrouter.lovable.app/pay/demo/${id}`,
    };
  });
}

/**
 * Generate mock analytics data
 */
export function generateMockAnalytics() {
  const sources = ['Twitter', 'YouTube', 'Blog', 'Direct', 'Discord'];
  
  return {
    totalRevenue: Math.floor(Math.random() * 100000000) + 10000000,
    totalTransactions: Math.floor(Math.random() * 500) + 50,
    uniqueSupporters: Math.floor(Math.random() * 100) + 10,
    avgTransactionValue: Math.floor(Math.random() * 200000) + 50000,
    topSources: sources.map(name => ({
      name,
      amount: Math.floor(Math.random() * 10000000) + 1000000,
      count: Math.floor(Math.random() * 50) + 5,
    })).sort((a, b) => b.amount - a.amount),
  };
}

/**
 * Generate mock withdrawals
 */
export function generateMockWithdrawals(count: number = 5) {
  const statuses = ['completed', 'pending', 'processing'];
  
  return Array.from({ length: count }, () => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    
    return {
      id: generateId(),
      amount: Math.floor(Math.random() * 10000000) + 1000000,
      fee: Math.floor(Math.random() * 100000) + 10000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      txid: generateTxHash(),
      createdAt: date.toISOString(),
      completedAt: date.toISOString(),
    };
  });
}
