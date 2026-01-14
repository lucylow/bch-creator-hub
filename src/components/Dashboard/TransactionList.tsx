import { motion } from 'framer-motion';
import { ArrowDownLeft, ExternalLink } from 'lucide-react';
import { formatBCH, truncateAddress, formatDate } from '@/utils/formatters';

interface Transaction {
  id: string;
  txid: string;
  amountSats: number;
  senderAddress: string;
  paymentType: string;
  createdAt: string;
  status: 'confirmed' | 'pending';
}

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList = ({ transactions }: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No transactions yet</p>
        <p className="text-sm mt-2">Share your payment links to start receiving BCH!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx, index) => (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{tx.paymentType}</p>
              <p className="text-sm text-muted-foreground">
                From: {truncateAddress(tx.senderAddress, 6)}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-semibold text-primary">+{formatBCH(tx.amountSats)}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatDate(tx.createdAt)}</span>
              <a
                href={`https://blockchair.com/bitcoin-cash/transaction/${tx.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TransactionList;
