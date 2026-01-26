import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  BarChart3,
  ArrowLeft,
  Link2,
  RefreshCw,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { formatBCH, formatDate, truncateAddress } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Breadcrumbs from '@/components/Common/Breadcrumbs';
import AnalyticsSkeleton from '@/components/Common/AnalyticsSkeleton';
import BalanceChart from '@/components/Dashboard/BalanceChart';
import WalletConnectButton from '@/components/Wallet/WalletConnectButton';
import { useWallet } from '@/contexts/WalletContext';
import { apiService } from '@/services/api';
import { isDemoMode } from '@/config/demo';

type PeriodKey = '7d' | '30d' | '90d';

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const AnalyticsPage = () => {
  const { isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodKey>('30d');

  const periodParam = period === '7d' ? '7' : period === '90d' ? '90' : '30';

  const { data: analytics, isLoading: loadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const res = await apiService.getAnalytics({ period: periodParam });
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to load analytics');
      return res.data;
    },
    retry: 1,
  });

  const { data: earningsChart = [], isLoading: loadingChart } = useQuery({
    queryKey: ['analytics-earnings', period],
    queryFn: async () => {
      const res = await apiService.getEarningsChart({ period: periodParam });
      if (!res.success) throw new Error(res.error || 'Failed to load chart');
      return res.data ?? [];
    },
    retry: 1,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const res = await apiService.getDashboardStats(period);
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to load stats');
      return res.data;
    },
    retry: 1,
  });

  const isLoading = loadingAnalytics || loadingChart;

  const chartData = useMemo(() => {
    if (!earningsChart.length) return [];
    return earningsChart.map((d) => ({
      label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      value: d.amount,
    }));
  }, [earningsChart]);

  const topSources = useMemo(() => {
    const txList = (dashboardStats as { recentTransactions?: unknown[] } | null)?.recentTransactions ?? [];
    if (!Array.isArray(txList) || txList.length === 0) return [];
    const byType: Record<string, { amount: number; count: number }> = {};
    for (const tx of txList) {
      const t = (tx.paymentType || tx.payment_type || 'payment') as string;
      if (!byType[t]) byType[t] = { amount: 0, count: 0 };
      byType[t].amount += Number(tx.amountSats ?? tx.amount_sats ?? 0);
      byType[t].count += 1;
    }
    const total = Object.values(byType).reduce((s, x) => s + x.amount, 0);
    return Object.entries(byType)
      .map(([source, { amount }]) => ({
        source: source.charAt(0).toUpperCase() + source.slice(1),
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [dashboardStats]);

  const topSupporters = useMemo(() => {
    const txList = (dashboardStats as { recentTransactions?: unknown[] } | null)?.recentTransactions ?? [];
    if (!Array.isArray(txList)) return [];
    const byAddr: Record<string, { totalAmount: number; count: number; lastAt: string }> = {};
    for (const tx of txList) {
      const addr = (tx.senderAddress ?? tx.sender_address ?? '').trim();
      if (!addr) continue;
      if (!byAddr[addr]) byAddr[addr] = { totalAmount: 0, count: 0, lastAt: tx.createdAt ?? tx.created_at ?? '' };
      byAddr[addr].totalAmount += Number(tx.amountSats ?? tx.amount_sats ?? 0);
      byAddr[addr].count += 1;
      const t = tx.createdAt ?? tx.created_at ?? '';
      if (t > byAddr[addr].lastAt) byAddr[addr].lastAt = t;
    }
    return Object.entries(byAddr)
      .map(([address, d]) => ({ address, ...d }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }, [dashboardStats]);

  const totalEarnings = analytics?.totalEarnings ?? 0;
  const totalTransactions = analytics?.totalTransactions ?? 0;
  const avgTransaction = totalTransactions > 0 ? Math.round(totalEarnings / totalTransactions) : 0;
  const activeSupporters = (dashboardStats as { activeSupporters?: number; active_supporters?: number } | null)?.activeSupporters ?? (dashboardStats as { active_supporters?: number } | null)?.active_supporters ?? new Set(topSupporters.map((s) => s.address)).size;

  const metrics = [
    { label: 'Total Revenue', value: formatBCH(totalEarnings), change: null, trend: 'up' as const, icon: DollarSign },
    { label: 'Total Transactions', value: String(totalTransactions), change: null, trend: 'up' as const, icon: BarChart3 },
    { label: 'Unique Supporters', value: String(activeSupporters), change: null, trend: 'up' as const, icon: Users },
    { label: 'Avg Transaction', value: formatBCH(avgTransaction), change: null, trend: 'up' as const, icon: Clock },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', period] });
    queryClient.invalidateQueries({ queryKey: ['analytics-earnings', period] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', period] });
  };

  if (!isConnected && !isDemoMode()) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 border-border/50"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Connect your wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view analytics, revenue trends, and top supporters.
            </p>
            <WalletConnectButton fullWidth size="lg" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (analyticsError) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs />
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{analyticsError instanceof Error ? analyticsError.message : 'Failed to load analytics'}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              {analytics?.startDate && analytics?.endDate
                ? `${formatDate(analytics.startDate)} – ${formatDate(analytics.endDate)}`
                : 'Track your earnings and performance'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Link to="/links">
              <Button variant="outline" size="sm" className="gap-2">
                <Link2 className="w-4 h-4" />
                View Links
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-xl p-5 border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <metric.icon className="w-5 h-5 text-primary" />
                </div>
                {metric.change != null && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      metric.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {metric.change}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-6 border-border/50"
          >
            <h2 className="text-xl font-semibold text-foreground mb-1">Revenue Over Time</h2>
            <p className="text-sm text-muted-foreground mb-6">Daily earnings for the selected period</p>
            {chartData.length > 0 ? (
              <BalanceChart type="area" data={chartData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground rounded-lg border border-dashed border-border">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No earnings data for this period</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-6 border-border/50"
          >
            <h2 className="text-xl font-semibold text-foreground mb-1">Payment Sources</h2>
            <p className="text-sm text-muted-foreground mb-6">Revenue by payment type</p>
            {topSources.length > 0 ? (
              <div className="space-y-4">
                {topSources.map((source, index) => (
                  <div key={source.source}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground font-medium">{source.source}</span>
                      <span className="text-muted-foreground tabular-nums">{formatBCH(source.amount)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, source.percentage)}%` }}
                        transition={{ delay: index * 0.08 }}
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground rounded-lg border border-dashed border-border">
                <div className="text-center">
                  <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No payment sources in this period</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 border-border/50"
        >
          <h2 className="text-xl font-semibold text-foreground mb-1 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Top Supporters
          </h2>
          <p className="text-sm text-muted-foreground mb-6">By total support in the selected period</p>
          {topSupporters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 -mt-2">
              {topSupporters.map((s, i) => (
                <div
                  key={s.address}
                  className="rounded-lg border border-border/60 bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                    <span className="font-mono text-sm text-foreground truncate" title={s.address}>
                      {truncateAddress(s.address, 6)}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary">{formatBCH(s.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">{s.count} payment{s.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground rounded-lg border border-dashed border-border">
              <div className="text-center">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No supporters in this period</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
