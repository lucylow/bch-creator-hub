import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { formatBCH, formatDate, truncateAddress, formatTransactionType } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/Common/EmptyState';

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
};

type Props = { transactions?: Tx[]; loading?: boolean; limit?: number };

const TransactionList: React.FC<Props> = ({ transactions = [], loading = false, limit }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <EmptyState
        icon={ArrowDownLeft}
        title="No transactions yet"
        description="Share your payment links to start receiving BCH payments from your supporters."
        size="sm"
      />
    );
  }

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <ul className="space-y-2">
      {displayTransactions.map((tx, index) => {
        const timestamp = tx.timestamp || tx.createdAt || 0;
        const address = tx.to || tx.from || tx.senderAddress || '';
        const type = tx.type || (tx.paymentType ? 0 : 5);
        const isIncoming = type === 5;
        
        return (
          <motion.li
            key={tx.txid || tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
          >
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/40 border border-border/50 hover:border-primary/30 transition-all duration-200">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isIncoming 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-blue-500/10 text-blue-400'
                  }
                  group-hover:scale-110 transition-transform duration-200
                `}>
                  {isIncoming ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {formatTransactionType(tx.paymentType || type)}
                    </div>
                    {tx.status && (
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${tx.status === 'confirmed' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-yellow-500/10 text-yellow-400'
                        }
                      `}>
                        {tx.status}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {tx.description || truncateAddress(address, 12)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(timestamp)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <div className={`font-bold text-lg ${isIncoming ? 'text-green-400' : 'text-blue-400'}`}>
                    {isIncoming ? '+' : ''}{formatBCH(tx.amountSats)}
                  </div>
                </div>
                {tx.txid && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    asChild
                  >
                    <a
                      href={`https://blockchair.com/bitcoin-cash/transaction/${tx.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
};

export default TransactionList;
