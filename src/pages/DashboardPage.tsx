import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Users, Clock, RefreshCw, Plus, Wallet, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/Dashboard/StatCard';
import TransactionList from '@/components/Dashboard/TransactionList';
import QuickActions from '@/components/Dashboard/QuickActions';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useCreator } from '@/contexts/CreatorContext';
import { formatBCH, formatUSD } from '@/utils/formatters';

const mockTransactions = [
  { id: '1', txid: 'abc123', amountSats: 10000000, senderAddress: 'bitcoincash:qpz9...', paymentType: 'Twitter Tip', createdAt: new Date().toISOString(), status: 'confirmed' as const },
  { id: '2', txid: 'def456', amountSats: 5000000, senderAddress: 'bitcoincash:qrx8...', paymentType: 'Article Unlock', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'confirmed' as const },
  { id: '3', txid: 'ghi789', amountSats: 20000000, senderAddress: 'bitcoincash:qvw7...', paymentType: 'YouTube Superchat', createdAt: new Date(Date.now() - 7200000).toISOString(), status: 'confirmed' as const },
];

const DashboardPage = () => {
  const { creator, refreshCreator } = useCreator();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {creator?.displayName || 'Creator'}!
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
              <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Create Link
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Total Balance"
            value={formatBCH(stats.totalBalance)}
            icon={<Wallet className="w-5 h-5" />}
            trend={stats.todayEarnings > 0 ? '+' + formatBCH(stats.todayEarnings) : null}
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
            trend="Monthly"
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
            trend="1% Fee"
            color="red"
          />
        </div>

        {/* Chart and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass-card rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Earnings Overview</h2>
              <div className="flex gap-2">
                {['7 days', '30 days', '90 days'].map((period) => (
                  <button
                    key={period}
                    className="px-3 py-1 text-sm rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Simple chart placeholder */}
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1 }}
                  className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t-lg"
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 px-4 text-sm text-muted-foreground">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </motion.div>
          
          <QuickActions />
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Link to="/analytics" className="text-sm text-primary hover:underline">
              View All →
            </Link>
          </div>
          <TransactionList transactions={mockTransactions} />
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
