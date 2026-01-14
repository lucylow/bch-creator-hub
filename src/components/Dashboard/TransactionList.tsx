import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatBCH, formatDate, truncateAddress, formatTransactionType } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';

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
};

type Props = { transactions?: Tx[]; loading?: boolean };

const TransactionList: React.FC<Props> = ({ transactions = [], loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No transactions yet.</p>
        <p className="text-sm mt-2">Share your payment links to start receiving BCH!</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {transactions.map((tx) => {
        const timestamp = tx.timestamp || tx.createdAt || 0;
        const address = tx.to || tx.from || tx.senderAddress || '';
        const type = tx.type || (tx.paymentType ? 0 : 5);
        
        return (
          <li 
            key={tx.txid || tx.id} 
            className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                {type === 5 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {formatTransactionType(tx.paymentType || type)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {tx.description || truncateAddress(address, 8)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-foreground">{formatBCH(tx.amountSats)}</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(timestamp)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default TransactionList;
