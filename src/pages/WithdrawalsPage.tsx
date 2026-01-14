import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, RefreshCw, ArrowUpRight, Clock, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { apiService } from '@/services/api';
import { formatBCH, formatDate, truncateAddress } from '@/utils/formatters';
import { useCreator } from '@/contexts/CreatorContext';

const WithdrawalsPage = () => {
  const { creator } = useCreator();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch withdrawals with React Query
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const response = await apiService.getWithdrawals();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load withdrawals');
      }
      return response.data;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const withdrawals = data?.withdrawals || [];
  const filteredWithdrawals = filterStatus === 'all' 
    ? withdrawals 
    : withdrawals.filter((w: any) => w.status === filterStatus);

  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === 'confirmed')
    .reduce((sum: number, w: any) => sum + (w.amountSats || 0), 0);

  const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'pending');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

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
            <h1 className="text-4xl font-bold text-foreground mb-2">Withdrawals</h1>
            <p className="text-muted-foreground text-lg">
              View and manage your withdrawal history
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
            <Link to="/settings">
              <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2">
                <Wallet className="w-4 h-4" />
                New Withdrawal
              </Button>
            </Link>
          </div>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load withdrawals'}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-6 border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <ArrowUpRight className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatBCH(totalWithdrawn)}</p>
            <p className="text-xs text-muted-foreground mt-2">All confirmed withdrawals</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-6 border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{pendingWithdrawals.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Awaiting confirmation</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-6 border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Withdrawals</p>
              <Download className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground">{withdrawals.length}</p>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-xl p-6 border-border/50 mb-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Withdrawal History</h2>
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
          </div>
        </motion.div>

        {/* Withdrawals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 border-border/50"
        >
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">No withdrawals yet</p>
              <p className="text-sm mb-4">Start withdrawing your earnings to your wallet</p>
              <Link to="/settings">
                <Button className="gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Create Withdrawal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWithdrawals.map((withdrawal: any, index: number) => (
                <motion.div
                  key={withdrawal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-4 bg-muted/20 rounded-xl hover:bg-muted/40 border border-border/50 hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-foreground">
                            {formatBCH(withdrawal.amountSats)}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          To: {truncateAddress(withdrawal.toAddress || '', 16)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(withdrawal.createdAt)}
                        </div>
                        {withdrawal.feeSats > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Fee: {formatBCH(withdrawal.feeSats)}
                          </div>
                        )}
                      </div>
                    </div>
                    {withdrawal.txid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        asChild
                      >
                        <a
                          href={`https://blockchair.com/bitcoin-cash/transaction/${withdrawal.txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
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

export default WithdrawalsPage;

