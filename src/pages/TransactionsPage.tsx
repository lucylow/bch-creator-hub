import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Filter, Search, Download, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TransactionList from '@/components/Dashboard/TransactionList';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { apiService } from '@/services/api';
import { formatBCH } from '@/utils/formatters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const TransactionsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  // Fetch transactions with React Query
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['transactions', dateRange],
    queryFn: async () => {
      const response = await apiService.getTransactions({ limit: 100, page: 1 });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load transactions');
      }
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
  });

  // Filter transactions
  const filteredTransactions = data?.transactions?.filter((tx: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        tx.txid?.toLowerCase().includes(query) ||
        tx.senderAddress?.toLowerCase().includes(query) ||
        tx.recipientAddress?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'incoming' && tx.type !== 5) return false;
      if (filterType === 'outgoing' && tx.type === 5) return false;
      if (filterType !== 'incoming' && filterType !== 'outgoing') {
        if (tx.paymentType !== filterType) return false;
      }
    }

    // Status filter
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;

    return true;
  }) || [];

  const totalAmount = filteredTransactions.reduce((sum: number, tx: any) => {
    return sum + (tx.amountSats || 0);
  }, 0);

  if (isLoading) {
    return <LoadingSpinner />;
  }

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
            <div className="flex items-center gap-3 mb-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Transactions</h1>
            <p className="text-muted-foreground text-lg">
              View and manage all your payment transactions
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load transactions'}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6 border-border/50 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground">{filteredTransactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-primary">{formatBCH(totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Transaction</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredTransactions.length > 0 
                  ? formatBCH(totalAmount / filteredTransactions.length)
                  : formatBCH(0)
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-xl p-6 border-border/50 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none text-foreground"
            >
              <option value="all">All Types</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
              <option value="tip">Tips</option>
              <option value="subscription">Subscriptions</option>
              <option value="donation">Donations</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none text-foreground"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Date Range */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 pl-10 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none text-foreground w-full"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Transaction List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 border-border/50"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">Transaction History</h2>
          <TransactionList 
            transactions={filteredTransactions} 
            loading={isRefetching}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default TransactionsPage;

