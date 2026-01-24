import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Download, RefreshCw, ArrowUpRight, Clock, 
  CheckCircle, XCircle, Wallet, TrendingUp, ExternalLink,
  ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import StatusBadge from '@/components/Common/StatusBadge';
import LiveIndicator from '@/components/Common/LiveIndicator';
import { apiService } from '@/services/api';
import { formatBCH, formatDate, truncateAddress } from '@/utils/formatters';
import { useCreator } from '@/contexts/CreatorContext';
import { cn } from '@/lib/utils';

const WithdrawalsPage = () => {
  const { creator } = useCreator();
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
  const pendingAmount = pendingWithdrawals.reduce((sum: number, w: any) => sum + (w.amountSats || 0), 0);

  const getStatusType = (status: string): 'success' | 'pending' | 'failed' => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'pending';
      case 'failed': return 'failed';
      default: return 'pending';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Withdrawals</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Manage your BCH withdrawals
                <LiveIndicator isLive={pendingWithdrawals.length > 0} label={pendingWithdrawals.length > 0 ? 'Processing' : ''} size="sm" />
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="gap-2 hover-lift"
              >
                <RefreshCw className={cn('w-4 h-4', isRefetching && 'animate-spin')} />
                Refresh
              </Button>
              <Link to="/settings">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2 hover-lift glow-effect">
                  <Wallet className="w-4 h-4" />
                  Withdraw
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-6 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load withdrawals'}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards - Cleaner design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Withdrawn */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-elevated rounded-2xl p-6 hover-lift group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">All Time</span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mb-1">{formatBCH(totalWithdrawn)}</p>
            <p className="text-sm text-muted-foreground">Total Withdrawn</p>
          </motion.div>

          {/* Pending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cn(
              'glass-card-elevated rounded-2xl p-6 hover-lift group',
              pendingWithdrawals.length > 0 && 'border-amber-500/30'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform',
                pendingWithdrawals.length > 0 ? 'bg-amber-500/10 pending-glow' : 'bg-muted/50'
              )}>
                <Clock className={cn('w-5 h-5', pendingWithdrawals.length > 0 ? 'text-amber-400' : 'text-muted-foreground')} />
              </div>
              {pendingWithdrawals.length > 0 && (
                <StatusBadge status="pending" label={`${pendingWithdrawals.length} pending`} size="sm" />
              )}
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mb-1">
              {pendingWithdrawals.length > 0 ? formatBCH(pendingAmount) : '—'}
            </p>
            <p className="text-sm text-muted-foreground">Awaiting Confirmation</p>
          </motion.div>

          {/* Transaction Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-elevated rounded-2xl p-6 hover-lift group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mb-1">{withdrawals.length}</p>
            <p className="text-sm text-muted-foreground">Withdrawals Made</p>
          </motion.div>
        </div>

        {/* Filters - Pill style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-2"
        >
          {['all', 'confirmed', 'pending', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                filterStatus === status
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  ({withdrawals.filter((w: any) => status === 'all' || w.status === status).length})
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Withdrawals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-elevated rounded-2xl overflow-hidden"
        >
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-16 px-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-5"
              >
                <Sparkles className="w-10 h-10 text-muted-foreground/40" />
              </motion.div>
              <p className="text-xl font-semibold text-foreground mb-2">
                {filterStatus !== 'all' ? `No ${filterStatus} withdrawals` : 'No withdrawals yet'}
              </p>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {filterStatus !== 'all' 
                  ? 'Try selecting a different filter above.'
                  : 'When you withdraw your earnings, they\'ll appear here.'}
              </p>
              {filterStatus === 'all' && (
                <Link to="/settings">
                  <Button className="gap-2 hover-lift">
                    <Wallet className="w-4 h-4" />
                    Make Your First Withdrawal
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <AnimatePresence mode="popLayout">
                {filteredWithdrawals.map((withdrawal: any, index: number) => (
                  <motion.div
                    key={withdrawal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.03 }}
                    className="group p-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Status indicator */}
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
                        withdrawal.status === 'confirmed' && 'bg-primary/10',
                        withdrawal.status === 'pending' && 'bg-amber-500/10 pending-glow',
                        withdrawal.status === 'failed' && 'bg-destructive/10'
                      )}>
                        {withdrawal.status === 'confirmed' && <CheckCircle className="w-5 h-5 text-primary" />}
                        {withdrawal.status === 'pending' && <Clock className="w-5 h-5 text-amber-400" />}
                        {withdrawal.status === 'failed' && <XCircle className="w-5 h-5 text-destructive" />}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-semibold font-mono text-foreground">
                            {formatBCH(withdrawal.amountSats)}
                          </span>
                          <StatusBadge status={getStatusType(withdrawal.status)} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono truncate max-w-[200px]">
                            → {truncateAddress(withdrawal.toAddress || '', 12)}
                          </span>
                          <span className="text-muted-foreground/50">•</span>
                          <span>{formatDate(withdrawal.createdAt)}</span>
                        </div>
                        {withdrawal.feeSats > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Network fee: {formatBCH(withdrawal.feeSats)}
                          </p>
                        )}
                      </div>

                      {/* Action */}
                      {withdrawal.txid && (
                        <a
                          href={`https://blockchair.com/bitcoin-cash/transaction/${withdrawal.txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <span className="hidden sm:inline">View</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Fee info card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-0.5">Low Fees, Fast Withdrawals</p>
              <p className="text-sm text-muted-foreground">
                Only 1% service fee on withdrawals. Your BCH is sent directly to your wallet with minimal network fees (~$0.002).
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WithdrawalsPage;
