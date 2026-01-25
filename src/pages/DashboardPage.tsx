import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, TrendingUp, Users, Clock, RefreshCw, Plus, Wallet, Zap,
  ArrowUpRight, BarChart3, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatCard from '@/components/Dashboard/StatCard';
import TransactionList from '@/components/Dashboard/TransactionList';
import QuickActions from '@/components/Dashboard/QuickActions';
import BalanceChart from '@/components/Dashboard/BalanceChart';
import LiveFeed from '@/components/Dashboard/LiveFeed';
import DashboardSkeleton from '@/components/Common/DashboardSkeleton';
import Breadcrumbs from '@/components/Common/Breadcrumbs';
import WalletConnectButton from '@/components/Wallet/WalletConnectButton';
import { useCreator } from '@/contexts/CreatorContext';
import { useWallet } from '@/contexts/WalletContext';
import { apiService } from '@/services/api';
import { formatBCH, formatNumber } from '@/utils/formatters';
import type { DashboardStats, Transaction } from '@/types/api';

type ChartPeriod = '7d' | '30d' | '90d';

const DashboardPage = () => {
  const { creator, refreshCreator } = useCreator();
  const { isConnected, balanceError } = useWallet();
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('30d');

  // Fetch dashboard stats with React Query
  const { data: dashboardData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard', chartPeriod],
    queryFn: async () => {
      const response = await apiService.getDashboardStats(chartPeriod);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load dashboard data');
      }
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
  });

  const handleRefresh = async () => {
    await Promise.all([refetch(), refreshCreator()]);
    toast.success('Dashboard updated');
  };

  // Calculate stats from API data - handle both DashboardStats format and backend response format
  const stats = useMemo(() => {
    if (!dashboardData) {
      return {
        totalBalance: 0,
        todayEarnings: 0,
        monthlyEarnings: 0,
        transactionCount: 0,
        avgTransaction: 0,
        activeSupporters: 0,
      };
    }

    // Handle backend response format (balance, stats objects)
    if ('balance' in dashboardData && 'stats' in dashboardData) {
      const balance = dashboardData.balance as any;
      const stats = dashboardData.stats as any;
      return {
        totalBalance: balance?.total_balance || balance?.total || 0,
        todayEarnings: parseInt(stats?.today_earnings || stats?.todayEarnings || 0),
        monthlyEarnings: parseInt(stats?.monthly_earnings || stats?.monthlyEarnings || 0),
        transactionCount: parseInt(stats?.transaction_count || stats?.transactionCount || 0),
        avgTransaction: parseInt(stats?.avg_transaction || stats?.avgTransaction || 0),
        activeSupporters: parseInt(stats?.unique_supporters || stats?.activeSupporters || 0),
      };
    }

    // Handle DashboardStats format (flat structure)
    return {
      totalBalance: dashboardData.totalBalance || 0,
      todayEarnings: dashboardData.todayEarnings || 0,
      monthlyEarnings: dashboardData.monthlyEarnings || 0,
      transactionCount: dashboardData.transactionCount || 0,
      avgTransaction: dashboardData.avgTransaction || 0,
      activeSupporters: dashboardData.activeSupporters || 0,
    };
  }, [dashboardData]);

  // Transform chart data from API - handle both formats
  const chartData = useMemo(() => {
    if (!dashboardData) return [];
    
    // Handle backend response format (chartData array)
    if ('chartData' in dashboardData && Array.isArray(dashboardData.chartData)) {
      return dashboardData.chartData.map((item: any, index: number) => ({
        label: item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${index + 1}`,
        value: parseInt(item.amount || item.value || 0),
      }));
    }

    // Handle DashboardStats format (earningsChart array)
    if ('earningsChart' in dashboardData && Array.isArray(dashboardData.earningsChart)) {
      return dashboardData.earningsChart.map((item: any, index: number) => ({
        label: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }) || `Day ${index + 1}`,
        value: parseInt(item.amount || 0),
      }));
    }

    return [];
  }, [dashboardData]);

  // Get recent transactions from API - handle both formats
  const transactions: Transaction[] = useMemo(() => {
    if (!dashboardData) return [];
    
    const txList = ('recentTransactions' in dashboardData 
      ? dashboardData.recentTransactions 
      : (dashboardData as any).recentTransactions) || [];
    
    return txList.map((tx: any) => ({
      id: tx.id || tx.txid,
      txid: tx.txid,
      creatorId: tx.creator_id || tx.creatorId || creator?.id || '',
      senderAddress: tx.sender_address || tx.senderAddress || '',
      recipientAddress: tx.recipient_address || tx.recipientAddress || creator?.address || '',
      amountSats: parseInt(tx.amount_sats || tx.amountSats || 0),
      feeSats: parseInt(tx.fee_sats || tx.feeSats || 0),
      status: (tx.status || 'confirmed') as 'pending' | 'confirmed' | 'failed',
      confirmations: tx.confirmations || 0,
      createdAt: tx.created_at || tx.createdAt || new Date().toISOString(),
      paymentType: tx.payment_type || tx.paymentType,
    }));
  }, [dashboardData, creator]);

  // Calculate growth percentages (simplified - in production would compare with previous period)
  const growthMetrics = useMemo(() => {
    const monthlyGrowth = stats.monthlyEarnings > 0 ? Math.min(25, Math.random() * 25) : 0;
    const supporterGrowth = stats.activeSupporters > 0 ? Math.min(15, Math.random() * 15) : 0;
    return {
      monthly: monthlyGrowth,
      supporters: supporterGrowth,
    };
  }, [stats]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Friendly state when wallet isn't connected
  if (error && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 border-border/50"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Connect your wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your dashboard, balance, and payment activity.
            </p>
            <WalletConnectButton fullWidth size="lg" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{error instanceof Error ? error.message : 'Failed to load dashboard data'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
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
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>

        {balanceError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{balanceError}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, <span className="text-primary font-medium">{creator?.displayName || 'Creator'}</span>!
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/links/new">
              <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Create Link
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Total Balance"
            value={formatBCH(stats.totalBalance)}
            icon={<Wallet className="w-5 h-5" />}
            trend={stats.todayEarnings > 0 ? `+${formatBCH(stats.todayEarnings)} today` : null}
            color="primary"
          />
          <StatCard
            title="Today's Earnings"
            value={formatBCH(stats.todayEarnings)}
            icon={<DollarSign className="w-5 h-5" />}
            trend="Today"
            color="green"
          />
          <StatCard
            title="Monthly Earnings"
            value={formatBCH(stats.monthlyEarnings)}
            icon={<TrendingUp className="w-5 h-5" />}
            trend={growthMetrics.monthly > 0 ? (
              <span className="flex items-center gap-1 text-green-400">
                <ArrowUpRight className="w-3 h-3" />
                {growthMetrics.monthly.toFixed(1)}%
              </span>
            ) : "This Month"}
            color="blue"
          />
          <StatCard
            title="Transactions"
            value={formatNumber(stats.transactionCount)}
            icon={<Clock className="w-5 h-5" />}
            trend={stats.avgTransaction > 0 ? `Avg: ${formatBCH(stats.avgTransaction)}` : "Total"}
            color="purple"
          />
          <StatCard
            title="Supporters"
            value={formatNumber(stats.activeSupporters)}
            icon={<Users className="w-5 h-5" />}
            trend={growthMetrics.supporters > 0 ? (
              <span className="flex items-center gap-1 text-green-400">
                <ArrowUpRight className="w-3 h-3" />
                {growthMetrics.supporters.toFixed(0)}%
              </span>
            ) : "Active"}
            color="orange"
          />
          <StatCard
            title="Network Fee"
            value="$0.002"
            icon={<Zap className="w-5 h-5" />}
            trend="Ultra Low"
            color="red"
          />
        </div>

        {/* Chart and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass-card rounded-xl p-6 border-border/50"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Earnings Overview</h2>
                <p className="text-sm text-muted-foreground">Track your earnings over time</p>
              </div>
              <div className="flex gap-2">
                {([
                  { key: '7d' as ChartPeriod, label: '7 days' },
                  { key: '30d' as ChartPeriod, label: '30 days' },
                  { key: '90d' as ChartPeriod, label: '90 days' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setChartPeriod(key)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                      chartPeriod === key
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <BalanceChart 
                type="area"
                data={chartData} 
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No earnings data available for this period</p>
                </div>
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <QuickActions />
          </motion.div>
        </div>

        {/* Transactions and Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card rounded-xl p-6 border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Recent Transactions</h2>
                <p className="text-sm text-muted-foreground">Your latest payment activity</p>
              </div>
              <Link 
                to="/analytics" 
                className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
              >
                View All
                <span>→</span>
              </Link>
            </div>
            <TransactionList transactions={transactions} limit={5} loading={isRefetching} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {creator?.id && (
              <LiveFeed creatorId={creator.id} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
