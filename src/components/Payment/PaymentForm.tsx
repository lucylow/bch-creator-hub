import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBCH, validateBCHAddress, calculateFee } from '@/utils/formatters';
import { logger } from '@/utils/logger';

type PaymentDetails = {
  recipient?: string;
  amountSats?: number;
};

type Props = {
  amount?: string;
  setAmount?: (a: string) => void;
  fixedAmount?: boolean;
  paymentDetails: PaymentDetails;
  isConnected: boolean;
  address?: string;
  isProcessing?: boolean;
  onPayment: () => Promise<any>;
  onConnectWallet?: () => void;
};

const PaymentForm: React.FC<Props> = ({
  amount,
  setAmount,
  fixedAmount = false,
  paymentDetails,
  isConnected,
  address,
  isProcessing = false,
  onPayment,
  onConnectWallet
}) => {
  const [localAmount, setLocalAmount] = useState(amount || '');
  const [note, setNote] = useState('');
  const [toAddress, setToAddress] = useState(paymentDetails?.recipient || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (amount) setLocalAmount(amount);
  }, [amount]);

  const presets = [0.001, 0.005, 0.01, 0.05];

  const handleAmountChange = (v: string) => {
    setLocalAmount(v);
    setAmount && setAmount(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!toAddress || !validateBCHAddress(toAddress)) {
      setError('Invalid recipient address');
      return;
    }

    const parsed = parseFloat(localAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount');
      return;
    }

    if (!isConnected) {
      onConnectWallet && onConnectWallet();
      return;
    }

    try {
      const id = toast.loading('Sending payment…');
      const result = await onPayment();
      if (result?.txid) {
        toast.success('Payment sent', { id });
      } else {
        toast.error('Payment may not have completed', { id });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Payment form submission failed', error);
      toast.error(error.message || 'Payment failed');
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(toAddress);
    toast.success('Address copied');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Amount (BCH)</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {presets.map(p => (
            <button
              type="button"
              key={p}
              onClick={() => handleAmountChange(String(p))}
              className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                localAmount === String(p)
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105 active:scale-95'
              }`}
            >
              {p} BCH
            </button>
          ))}
        </div>
        <Input
          disabled={fixedAmount}
          className="text-lg font-semibold"
          value={localAmount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="e.g. 0.01"
          type="number"
          step="0.001"
          min="0.00001"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Recipient</label>
        <div className="flex gap-2">
          <Input 
            className="flex-1 font-mono text-sm" 
            value={toAddress} 
            onChange={(e) => setToAddress(e.target.value)}
            readOnly={!!paymentDetails?.recipient}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={copyAddress}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Note (optional)</label>
        <Input 
          className="w-full"
          value={note} 
          onChange={(e) => setNote(e.target.value)} 
          placeholder="Thanks for your support!" 
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20"
        >
          {error}
        </motion.div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
        <div>Est. Network Fee</div>
        <div>{formatBCH(calculateFee(Math.round((parseFloat(localAmount || '0') || 0) * 1e8)))}</div>
      </div>

      <div className="flex gap-3">
        <Button 
          type="submit" 
          className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground" 
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing…' : 'Pay'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => { 
            setLocalAmount(''); 
            setNote(''); 
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;

