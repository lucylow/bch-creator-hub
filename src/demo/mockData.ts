/**
 * Mock data generators for demo mode
 * These provide realistic-looking data when the backend is not available
 */

import type { DashboardStats, Transaction, PaymentIntent, Analytics, EarningsChartData, TransactionStats } from '@/types/api';
import { ADDRESSES } from './mockAddresses';

// Deterministic id/tx hash helpers (seeded by index for stable demo data)
const chars = '0123456789abcdef';
const generateId = (seed?: number) =>
  seed != null
    ? `demo_${seed.toString(36)}`
    : Math.random().toString(36).substring(2, 15);
const generateTxHash = (seed?: number) => {
  if (seed == null) {
    let hash = '';
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
    return hash;
  }
  let h = seed;
  let hash = '';
  for (let i = 0; i < 64; i++) {
    h = (h * 31 + i) >>> 0;
    hash += chars[h % 16];
  }
  return hash;
};

const SENDER_POOL = [ADDRESSES.userLucy, ADDRESSES.userJudge, ADDRESSES.userMark, ADDRESSES.userNina];
const RECIPIENT = ADDRESSES.creatorAlice;
const PAYMENT_TYPES = ['tip', 'subscription', 'unlock', 'donation'] as const;
const STATUSES: Array<'pending' | 'confirmed' | 'failed'> = ['confirmed', 'confirmed', 'confirmed', 'pending'];

/** Prebuilt pool of 120 deterministic transactions so dashboard, list, and supporters stay consistent */
function buildTransactionPool(): Transaction[] {
  const out: Transaction[] = [];
  const now = Date.now();
  for (let i = 0; i < 120; i++) {
    const h = (i * 2654435761) >>> 0;
    const date = new Date(now - (i * 7 + (i % 11)) * 3600000);
    const amountSats = 10000 + (h % 25) * 18000;
    out.push({
      id: generateId(i),
      txid: generateTxHash(i),
      creatorId: 'demo-creator',
      senderAddress: SENDER_POOL[i % SENDER_POOL.length],
      recipientAddress: RECIPIENT,
      amountSats,
      feeSats: 100 + (i % 5) * 50,
      status: STATUSES[i % STATUSES.length],
      confirmations: i % 3 === 0 ? 0 : 3 + (i % 8),
      createdAt: date.toISOString(),
      paymentType: PAYMENT_TYPES[i % PAYMENT_TYPES.length],
    });
  }
  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

let _transactionPool: Transaction[] | null = null;
function getTransactionPool(): Transaction[] {
  if (!_transactionPool) _transactionPool = buildTransactionPool();
  return _transactionPool;
}

/**
 * Generate mock transactions (from consistent pool so supporters/analytics align)
 */
export function generateMockTransactions(count: number = 10): Transaction[] {
  return getTransactionPool().slice(0, Math.min(count, 120));
}

/**
 * Generate mock dashboard stats with totals that match the chart
 */
export function generateMockDashboardStats(period: '7d' | '30d' | '90d' = '30d'): DashboardStats {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const base = 132; // seed for stable numbers
  const earningsChart: Array<{ date: string; amount: number }> = [];
  let totalFromChart = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const amount = 40000 + ((base + i) * 317) % 480000;
    earningsChart.push({ date: date.toISOString().split('T')[0], amount });
    totalFromChart += amount;
  }
  const todayEarnings = earningsChart[earningsChart.length - 1]?.amount ?? 0;
  const pool = getTransactionPool();
  const recentCount = Math.min(30, pool.length);
  const txCount = 28 + (base % 40);
  const avgTx = totalFromChart > 0 && txCount > 0 ? Math.floor(totalFromChart / txCount) : 120000;
  const supporters = new Set(pool.slice(0, 80).map((t) => t.senderAddress)).size;

  return {
    totalBalance: 185000000, // ~1.85 BCH
    todayEarnings,
    monthlyEarnings: totalFromChart,
    transactionCount: txCount,
    avgTransaction: avgTx,
    activeSupporters: Math.max(supporters, 4),
    earningsChart,
    recentTransactions: pool.slice(0, Math.min(5, recentCount)),
  };
}

const PAYMENT_INTENT_TITLES: { title: string; description: string; amount?: number }[] = [
  { title: 'Premium Article Access', description: 'Unlock the full analysis and charts.', amount: 50000 },
  { title: 'Monthly Supporter Tier', description: 'Support monthly and get Discord access.', amount: 500000 },
  { title: 'Video Tutorial Bundle', description: 'All BCH developer videos in one pass.', amount: 250000 },
  { title: 'Quick Tip', description: 'Leave a tip to support the channel.' },
  { title: 'Exclusive Content Pass', description: 'Access members-only posts and threads.', amount: 100000 },
  { title: 'Community Membership', description: 'Join the private community and calls.', amount: 300000 },
  { title: 'Workshop Recording', description: 'Full recording of the latest workshop.', amount: 150000 },
  { title: 'Twitter Tips', description: 'Support my threads and breakdowns on X.', amount: 0 },
  { title: 'YouTube Superchat', description: 'Support during livestreams.', amount: 0 },
  { title: 'Newsletter Unlock', description: 'Weekly deep-dives on BCH ecosystem.', amount: 75000 },
  { title: 'Annual Pass', description: 'Year-long access to all premium content.', amount: 2000000 },
  { title: 'Code Repository Access', description: 'Private repos and early code drops.', amount: 200000 },
  { title: 'One-on-One Call', description: '30-minute consultation slot.', amount: 500000 },
  { title: 'Research Paper', description: 'Full research document and data.', amount: 120000 },
  { title: 'Podcast Premium Feed', description: 'Ad-free episodes + bonus content.', amount: 100000 },
];

/**
 * Generate mock payment intents
 */
export function generateMockPaymentIntents(count: number = 12): PaymentIntent[] {
  const intents: PaymentIntent[] = [];
  const now = new Date();
  for (let i = 0; i < Math.min(count, PAYMENT_INTENT_TITLES.length); i++) {
    const row = PAYMENT_INTENT_TITLES[i];
    const d = new Date(now);
    d.setDate(d.getDate() - (i * 2 + 1));
    const id = `pi_demo_${i}`;
    intents.push({
      id,
      intentId: id,
      creatorId: 'demo-creator',
      type: row.amount != null && row.amount > 0 ? 1 : 2,
      title: row.title,
      description: row.description,
      amountSats: row.amount ?? 0,
      status: 'active',
      isRecurring: row.title.toLowerCase().includes('monthly') || row.title.toLowerCase().includes('annual'),
      metadata: {},
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
      paymentUrl: `https://bchpaywallrouter.lovable.app/pay/demo/${id}`,
    });
  }
  return intents;
}

/**
 * Legacy analytics shape (for components that use topSources etc.)
 */
export function generateMockAnalytics() {
  const sources = ['Twitter', 'YouTube', 'Article Unlocks', 'Direct', 'Discord'];
  const amounts = [180000000, 135000000, 90000000, 45000000, 22000000];
  return {
    totalRevenue: 450000000,
    totalTransactions: 142,
    uniqueSupporters: 67,
    avgTransactionValue: 3169014,
    topSources: sources.map((name, i) => ({
      name,
      amount: amounts[i] ?? 0,
      count: 12 + i * 8,
    })),
  };
}

/**
 * Analytics API shape (totalEarnings, totalTransactions, period, dates)
 */
export function generateMockAnalyticsApi(period: string = '30d'): Analytics {
  const pool = getTransactionPool();
  const totalEarnings = pool.slice(0, 80).reduce((s, t) => s + t.amountSats, 0);
  return {
    totalEarnings,
    totalTransactions: pool.length,
    period,
    startDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  };
}

/**
 * Earnings chart for analytics API
 */
export function generateMockEarningsChart(period: '7d' | '30d' | '90d' = '30d'): EarningsChartData[] {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const pool = getTransactionPool();
  const byDate = new Map<string, { amount: number; count: number }>();
  const cutoff = Date.now() - days * 24 * 3600000;
  for (const t of pool) {
    const tms = new Date(t.createdAt).getTime();
    if (tms < cutoff) continue;
    const d = t.createdAt.split('T')[0];
    const cur = byDate.get(d) ?? { amount: 0, count: 0 };
    cur.amount += t.amountSats;
    cur.count += 1;
    byDate.set(d, cur);
  }
  const out: EarningsChartData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    const v = byDate.get(key) ?? { amount: 0, count: 0 };
    out.push({ date: key, amount: v.amount, count: v.count });
  }
  return out;
}

/**
 * Transaction stats consistent with the transaction pool
 */
export function generateMockTransactionStats(): TransactionStats {
  const pool = getTransactionPool();
  const totalVolume = pool.reduce((s, t) => s + t.amountSats, 0);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = pool.filter((t) => new Date(t.createdAt) >= todayStart);
  return {
    totalTransactions: pool.length,
    totalVolume,
    avgTransaction: pool.length ? Math.floor(totalVolume / pool.length) : 0,
    todayCount: today.length,
    todayVolume: today.reduce((s, t) => s + t.amountSats, 0),
  };
}

const WITHDRAWAL_STATUSES = ['completed', 'completed', 'completed', 'pending', 'processing'] as const;
const WITHDRAWAL_AMOUNTS = [2500000, 5000000, 1200000, 8000000, 3100000, 4500000, 6000000, 1900000];

/**
 * Generate mock withdrawals
 */
export function generateMockWithdrawals(count: number = 8): ReturnType<typeof buildWithdrawals> {
  return buildWithdrawals().slice(0, Math.min(count, 8));
}

function buildWithdrawals() {
  const base = 9912;
  return WITHDRAWAL_AMOUNTS.map((amount, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i * 4 + 1));
    return {
      id: `wd_${i}`,
      amount,
      fee: 10000 + (i % 5) * 5000,
      status: WITHDRAWAL_STATUSES[i % WITHDRAWAL_STATUSES.length],
      txid: generateTxHash(base + i),
      createdAt: d.toISOString(),
      completedAt: d.toISOString(),
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
