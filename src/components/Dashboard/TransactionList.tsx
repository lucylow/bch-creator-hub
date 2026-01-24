import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Coins, Sparkles, Zap } from 'lucide-react';
import { formatBCH, formatDate, truncateAddress, formatTransactionType } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/Common/EmptyState';
import StatusBadge from '@/components/Common/StatusBadge';
import { cn } from '@/lib/utils';

type Tx = {
  id?: string;
  txid: string;
  type?: number;
  description?: string;
  to?: string;
  from?: string;
  amountSats: number;
  timestamp?: string | number;
  createdAt?: string | number;
  paymentType?: string;
  senderAddress?: string;
  status?: string;
  isNew?: boolean;
};

type Props = { 
  transactions?: Tx[]; 
  loading?: boolean; 
  limit?: number;
  showEmptyState?: boolean;
};

const getTypeIcon = (type: number | string) => {
  if (type === 'tip' || type === 0) return Coins;
  if (type === 'unlock' || type === 1) return Sparkles;
  return Zap;
};

const TransactionList: React.FC<Props> = ({ 
  transactions = [], 
  loading = false, 
  limit,
  showEmptyState = true 
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/50 rounded w-24" />
                <div className="h-3 bg-muted/50 rounded w-32" />
              </div>
              <div className="h-5 bg-muted/50 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!transactions.length && showEmptyState) {
    return (
      <EmptyState
        icon={ArrowDownLeft}
        title="No transactions yet"
        description="Share your payment links to start receiving BCH payments."
        size="sm"
      />
    );
  }

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <ul className="space-y-2">
      <AnimatePresence mode="popLayout">
        {displayTransactions.map((tx, index) => {
          const timestamp = tx.timestamp || tx.createdAt || 0;
          const address = tx.to || tx.from || tx.senderAddress || '';
          const type = tx.type || (tx.paymentType ? 0 : 5);
          const isIncoming = type === 5 || tx.amountSats > 0;
          const TypeIcon = getTypeIcon(tx.paymentType || type);
          
          return (
            <motion.li
              key={tx.txid || tx.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
              className="group"
            >
              <div className={cn(
                'flex items-center justify-between p-4 rounded-xl',
                'bg-card/50 hover:bg-card border border-border/30 hover:border-primary/30',
                'transition-all duration-200 hover-lift',
                tx.isNew && 'ring-2 ring-primary/30 data-wave'
              )}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                    'transition-all duration-200 group-hover:scale-110',
                    isIncoming 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-blue-500/10 text-blue-500'
                  )}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {formatTransactionType(tx.paymentType || type)}
                      </span>
                      {tx.status && tx.status !== 'confirmed' && (
                        <StatusBadge 
                          status={tx.status === 'pending' ? 'pending' : 'success'} 
                          size="sm"
                          showIcon={false}
                        />
                      )}
                      {tx.isNew && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-none">
                      {tx.description || (address ? `From ${truncateAddress(address, 8)}` : 'Payment received')}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {formatDate(timestamp)}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <span className={cn(
                      'font-bold font-mono text-lg',
                      isIncoming ? 'text-primary' : 'text-blue-500'
                    )}>
                      {isIncoming ? '+' : ''}{formatBCH(tx.amountSats)}
                    </span>
                  </div>
                  
                  {/* External link */}
                  {tx.txid && (
                    <a
                      href={`https://blockchair.com/bitcoin-cash/transaction/${tx.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        'text-muted-foreground hover:text-primary hover:bg-primary/10',
                        'opacity-0 group-hover:opacity-100 transition-all'
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
};

export default TransactionList;
