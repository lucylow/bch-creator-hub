import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, TrendingUp, DollarSign, Gift, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { apiService } from '@/services/api';
import { formatBCH, formatDate, truncateAddress, formatNumber } from '@/utils/formatters';

const SupportersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch supporters/transactions to analyze supporter data
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['supporters'],
    queryFn: async () => {
      // This would typically come from a supporters/analytics endpoint
      // For now, we'll use transactions to derive supporter data
      const response = await apiService.getTransactions({ limit: 500, page: 1 });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load supporters');
      }
      return response.data;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  // Process transactions to get supporter stats
  const supportersMap = new Map();
  if (data?.transactions) {
    data.transactions.forEach((tx: any) => {
      const address = tx.senderAddress || tx.from;
      if (address && tx.amountSats) {
        if (!supportersMap.has(address)) {
          supportersMap.set(address, {
            address,
            totalAmount: 0,
            transactionCount: 0,
            firstSeen: tx.createdAt || tx.timestamp,
            lastSeen: tx.createdAt || tx.timestamp,
          });
        }
        const supporter = supportersMap.get(address);
        supporter.totalAmount += tx.amountSats || 0;
        supporter.transactionCount += 1;
        const txDate = new Date(tx.createdAt || tx.timestamp);
        if (txDate > new Date(supporter.lastSeen)) {
          supporter.lastSeen = tx.createdAt || tx.timestamp;
        }
        if (txDate < new Date(supporter.firstSeen)) {
          supporter.firstSeen = tx.createdAt || tx.timestamp;
        }
      }
    });
  }

  const supporters = Array.from(supportersMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const filteredSupporters = searchQuery
    ? supporters.filter((s: any) =>
        s.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : supporters;

  const totalSupporters = supporters.length;
  const totalAmount = supporters.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
  const avgSupport = totalSupporters > 0 ? totalAmount / totalSupporters : 0;
  const topSupporter = supporters[0];

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
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Supporters</h1>
            <p className="text-muted-foreground text-lg">
              View your community and top supporters
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <Users className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load supporters'}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-6 border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Supporters</p>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatNumber(totalSupporters)}</p>
            <p className="text-xs text-muted-foreground mt-2">Unique addresses</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-6 border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Support</p>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatBCH(totalAmount)}</p>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-6 border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Average Support</p>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatBCH(avgSupport)}</p>
            <p className="text-xs text-muted-foreground mt-2">Per supporter</p>
          </motion.div>

          {topSupporter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card rounded-xl p-6 border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Top Supporter</p>
                <Gift className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-lg font-bold text-foreground truncate">{formatBCH(topSupporter.totalAmount)}</p>
              <p className="text-xs text-muted-foreground mt-2 truncate">{truncateAddress(topSupporter.address, 12)}</p>
            </motion.div>
          )}
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 border-border/50 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search supporters by address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
        </motion.div>

        {/* Supporters List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-xl p-6 border-border/50"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">Supporter List</h2>
          {filteredSupporters.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">No supporters yet</p>
              <p className="text-sm">Share your payment links to start building your community!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSupporters.map((supporter: any, index: number) => (
                <motion.div
                  key={supporter.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-4 bg-muted/20 rounded-xl hover:bg-muted/40 border border-border/50 hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-foreground">
                            {truncateAddress(supporter.address, 20)}
                          </div>
                          {index === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                              Top Supporter
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {supporter.transactionCount} {supporter.transactionCount === 1 ? 'payment' : 'payments'} • 
                          Total: {formatBCH(supporter.totalAmount)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          First seen: {formatDate(supporter.firstSeen)} • 
                          Last seen: {formatDate(supporter.lastSeen)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-primary">
                        {formatBCH(supporter.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total support
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SupportersPage;

