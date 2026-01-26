// Payment Flow component for Web3 payments
import React, { useState, useEffect, useMemo } from 'react';
import { usePayments } from '@/lib/web3/hooks/usePayments';
import { useWallet } from '@/contexts/WalletContext';
import { useBCHNetwork } from '@/lib/web3/hooks/useBCHNetwork';
import { Send, Lock, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getUserFriendlyMessage } from '@/utils/errorUtils';
import { formatBCH, formatUSD, generatePaymentURI, truncateAddress } from '@/lib/web3/utils/bch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeModal } from '@/components/Common/QRCodeDisplay';

export interface PaymentResult {
  txid?: string;
  success?: boolean;
  error?: string;
}

interface PaymentFlowProps {
  recipientAddress: string;
  amount?: string;
  paymentType?: 'tip' | 'content_unlock' | 'subscription' | 'donation';
  metadata?: Record<string, unknown>;
  onComplete?: (result: PaymentResult) => void;
}

const PaymentFlow: React.FC<PaymentFlowProps> = ({
  recipientAddress,
  amount: initialAmount,
  paymentType = 'tip',
  metadata = {},
  onComplete
}) => {
  const { isConnected, address, balance } = useWallet();
  const { getTxExplorerUrl } = useBCHNetwork();
  const { sendTip, unlockContent, purchaseSubscription, estimateFee, estimateFeeFromServer, isProcessing } = usePayments();
  
  const [amount, setAmount] = useState(initialAmount || '');
  const [step, setStep] = useState(1);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [txid, setTxid] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [memo, setMemo] = useState('');
  const [serverFee, setServerFee] = useState<{ satoshis: number; percentage: string } | null>(null);

  useEffect(() => {
    if (initialAmount) setAmount(initialAmount);
  }, [initialAmount]);

  const amountSats = useMemo(() => Math.round((parseFloat(amount) || 0) * 100000000), [amount]);

  useEffect(() => {
    if (amountSats <= 0) {
      setServerFee(null);
      return;
    }
    let cancelled = false;
    estimateFeeFromServer(amountSats)
      .then((fee) => {
        if (!cancelled && fee) setServerFee(fee);
        else if (!cancelled) setServerFee(null);
      })
      .catch(() => {
        if (!cancelled) setServerFee(null);
      });
    return () => { cancelled = true; };
  }, [amountSats, estimateFeeFromServer]);

  const handlePayment = async () => {
    try {
      if (!isConnected) {
        toast.error('Please connect your wallet first');
        return;
      }

      const amountSatoshis = amountSats;
      if (isNaN(amountSatoshis) || amountSatoshis <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (amountSatoshis > balance.total) {
        toast.error('Insufficient balance');
        return;
      }

      setStep(2);

    } catch (error) {
      const msg = getUserFriendlyMessage(error, 'Payment preparation failed');
      toast.error(msg);
    }
  };

  const confirmPayment = async () => {
    try {
      const amountSatoshis = amountSats;
      
      let result;
      
      switch (paymentType) {
        case 'content_unlock':
          result = await unlockContent(String(metadata.paymentIntentId || ''), amountSatoshis);
          break;
        case 'subscription':
          result = await purchaseSubscription(recipientAddress, amountSatoshis, Number(metadata.periods) || 1);
          break;
        default:
          result = await sendTip(recipientAddress, amountSatoshis, {
            ...metadata,
            memo
          });
      }

      if (result && result.txid) {
        setTxid(result.txid);
        setPaymentComplete(true);
        setStep(3);
        
        if (onComplete) {
          onComplete(result);
        }
        
        toast.success('Payment successful!');
      }
      
    } catch (error) {
      const msg = getUserFriendlyMessage(error, 'Payment failed');
      toast.error(msg);
      setStep(1);
    }
  };

  const getPaymentTitle = () => {
    const titles: Record<string, string> = {
      tip: 'Send Tip',
      content_unlock: 'Unlock Content',
      subscription: 'Purchase Subscription',
      donation: 'Make Donation'
    };
    return titles[paymentType] || 'Make Payment';
  };

  const getPaymentIcon = () => {
    const icons: Record<string, React.ReactNode> = {
      tip: <Send className="w-6 h-6" />,
      content_unlock: <Lock className="w-6 h-6" />,
      subscription: <Calendar className="w-6 h-6" />,
      donation: <Send className="w-6 h-6" />
    };
    return icons[paymentType] || <Send className="w-6 h-6" />;
  };

  const getFeeEstimate = () => {
    if (serverFee) return serverFee;
    return estimateFee(amountSats || 0);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          {getPaymentIcon()}
        </div>
        <h2 className="text-2xl font-bold mb-2">{getPaymentTitle()}</h2>
        {metadata.recipientName && (
          <p className="text-muted-foreground">To: {String(metadata.recipientName)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amount (BCH)</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.00000001"
          min="0.00000546"
          className="text-2xl font-bold"
        />
        <div className="mt-2 text-sm text-muted-foreground text-right">
          ≈ {formatUSD((parseFloat(amount) || 0) * 100000000)}
        </div>
      </div>

      {paymentType === 'tip' && (
        <div>
          <label className="block text-sm font-medium mb-2">Optional Message</label>
          <Input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a message..."
          />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Balance:</span>
              <span>{formatBCH(balance.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee:</span>
              <span>{formatBCH(getFeeEstimate().satoshis)}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total:</span>
              <span>
                {formatBCH(amountSats + getFeeEstimate().satoshis)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-3">
        <Button
          onClick={() => setShowQR(true)}
          variant="outline"
          className="flex-1"
        >
          Show QR Code
        </Button>
        <Button
          onClick={handlePayment}
          disabled={!amount || isProcessing}
          className="flex-1 bg-gradient-primary"
        >
          {isConnected ? 'Continue' : 'Connect Wallet'}
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Confirm Payment</h2>
        <p className="text-muted-foreground">Review details before confirming</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipient:</span>
            <span className="font-mono text-sm">{truncateAddress(recipientAddress)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-bold">{formatBCH(amountSats)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee:</span>
            <span>{formatBCH(getFeeEstimate().satoshis)}</span>
          </div>
          {memo && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Message:</span>
              <span className="text-right">{memo}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-3 border-t">
            <span>Total:</span>
            <span>
              {formatBCH(amountSats + getFeeEstimate().satoshis)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-3">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={confirmPayment}
          disabled={isProcessing}
          className="flex-1 bg-gradient-primary"
        >
          {isProcessing ? 'Processing...' : 'Confirm & Send'}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      
      <h2 className="text-2xl font-bold">Payment Successful!</h2>
      <p className="text-muted-foreground">
        Your payment has been sent successfully.
      </p>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction ID:</span>
            <a
              href={getTxExplorerUrl(txid)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {truncateAddress(txid)}
            </a>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span>{formatBCH(amountSats)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className="text-green-500">Confirmed</span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => {
          setStep(1);
          setPaymentComplete(false);
          setAmount('');
          setMemo('');
        }}
        className="w-full bg-gradient-primary"
      >
        Make Another Payment
      </Button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      {/* Progress Indicator */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10"></div>
        <div 
          className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-300"
          style={{ width: `${(step - 1) * 50}%` }}
        ></div>
        
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= stepNumber 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {stepNumber}
            </div>
            <div className="text-xs mt-2 capitalize">
              {stepNumber === 1 ? 'Details' : stepNumber === 2 ? 'Confirm' : 'Complete'}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Form */}
      <Card>
        <CardContent className="pt-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQR}
        onOpenChange={setShowQR}
        value={generatePaymentURI(recipientAddress, amountSats, String(metadata.recipientName || ''), memo)}
        title="Scan to Pay"
        description={`Pay ${formatBCH(amountSats)} to ${truncateAddress(recipientAddress)}`}
        size={256}
        level="H"
      />
    </div>
  );
};

export default PaymentFlow;
