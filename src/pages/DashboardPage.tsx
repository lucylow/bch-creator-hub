import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Users, Clock, RefreshCw, Plus, Wallet, Zap, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/Dashboard/StatCard';
import TransactionList from '@/components/Dashboard/TransactionList';
import QuickActions from '@/components/Dashboard/QuickActions';
import BalanceChart from '@/components/Dashboard/BalanceChart';
import LiveFeed from '@/components/Dashboard/LiveFeed';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useCreator } from '@/contexts/CreatorContext';
import { formatBCH } from '@/utils/formatters';

const mockTransactions = [
  { id: '1', txid: 'abc123', amountSats: 10000000, senderAddress: 'bitcoincash:qpz9...', paymentType: 'Twitter Tip', createdAt: new Date().toISOString(), status: 'confirmed' as const },
  { id: '2', txid: 'def456', amountSats: 5000000, senderAddress: 'bitcoincash:qrx8...', paymentType: 'Article Unlock', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'confirmed' as const },
  { id: '3', txid: 'ghi789', amountSats: 20000000, senderAddress: 'bitcoincash:qvw7...', paymentType: 'YouTube Superchat', createdAt: new Date(Date.now() - 7200000).toISOString(), status: 'confirmed' as const },
];

const DashboardPage = () => {
  const { creator, refreshCreator } = useCreator();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'7 days' | '30 days' | '90 days'>('30 days');
  const [stats, setStats] = useState({
    totalBalance: 125000000,
    todayEarnings: 35000000,
    monthlyEarnings: 450000000,
    transactionCount: 42,
    avgTransaction: 10714285,
    activeSupporters: 28
  });

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCreator();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Dashboard updated');
    }, 1000);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const chartData = [
    { label: 'Mon', value: 40000000 },
    { label: 'Tue', value: 65000000 },
    { label: 'Wed', value: 45000000 },
    { label: 'Thu', value: 80000000 },
    { label: 'Fri', value: 55000000 },
    { label: 'Sat', value: 90000000 },
    { label: 'Sun', value: 70000000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, <span className="text-primary font-medium">{creator?.displayName || 'Creator'}</span>!
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
            trend={stats.todayEarnings > 0 ? `+${formatBCH(stats.todayEarnings)}` : null}
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
            trend="This Month"
            color="blue"
          />
          <StatCard
            title="Transactions"
            value={stats.transactionCount.toString()}
            icon={<Clock className="w-5 h-5" />}
            trend={`Avg: ${formatBCH(stats.avgTransaction)}`}
            color="purple"
          />
          <StatCard
            title="Supporters"
            value={stats.activeSupporters.toString()}
            icon={<Users className="w-5 h-5" />}
            trend="Active"
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Earnings Overview</h2>
                <p className="text-sm text-muted-foreground">Track your earnings over time</p>
              </div>
              <div className="flex gap-2">
                {(['7 days', '30 days', '90 days'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                      chartPeriod === period
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            <BalanceChart 
              type="area"
              data={chartData} 
            />
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
                <h2 className="text-xl font-semibold text-foreground mb-1">Recent Transactions</h2>
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
            <TransactionList transactions={mockTransactions} limit={5} />
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
