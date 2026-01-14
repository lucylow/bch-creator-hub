import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, CheckCircle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBCH, truncateAddress, bchToSats } from '@/utils/formatters';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

const PaymentPage = () => {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('0.01');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [txHash, setTxHash] = useState('');

  const creatorInfo = {
    displayName: 'Demo Creator',
    bio: 'Building the future of creator monetization',
    address: 'bitcoincash:qpaq9sh8w7xs5qn4q9c3l8f9k2d4q7s8vga9mpt2vh',
  };

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment
    setTimeout(() => {
      setTxHash('abc123def456789...');
      setPaymentComplete(true);
      setIsProcessing(false);
      toast.success('Payment sent successfully!');
    }, 2000);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(creatorInfo.address);
    toast.success('Address copied!');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-2xl p-8 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for supporting {creatorInfo.displayName}
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-primary">{amount} BCH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span>{truncateAddress(creatorInfo.address, 6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction:</span>
              <a href="#" className="text-primary hover:underline flex items-center gap-1">
                View <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
            <Button
              className="flex-1 bg-gradient-primary text-primary-foreground"
              onClick={() => {
                navigator.clipboard.writeText(txHash);
                toast.success('Transaction ID copied!');
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy TX ID
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Creator Info */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {creatorInfo.displayName[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold">{creatorInfo.displayName}</h1>
                <p className="text-muted-foreground">{creatorInfo.bio}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Creator</span>
                </div>
                <span>{creatorInfo.displayName}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground font-mono text-sm truncate flex-1 mr-2">
                  {truncateAddress(creatorInfo.address, 12)}
                </span>
                <Button variant="ghost" size="sm" onClick={copyAddress}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center p-6 rounded-xl bg-white">
              <QRCode
                value={`bitcoincash:${creatorInfo.address}?amount=${amount}`}
                size={200}
                level="M"
              />
              <p className="text-sm text-gray-500 mt-4">
                Scan to pay from mobile wallet
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Send Payment</h2>
              <span className="text-2xl">₿</span>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (BCH)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.001"
                  min="0.00001"
                  className="text-2xl font-bold h-14 bg-muted/50"
                />
              </div>

              <div className="flex gap-2">
                {['0.001', '0.01', '0.05', '0.1'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      amount === preset
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {preset} BCH
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing || !amount}
              className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${amount} BCH`
              )}
            </Button>

            {/* Fee Info */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Fee:</span>
                <span>~$0.002</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee:</span>
                <span className="text-primary">0%</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-primary">{amount} BCH</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              🔒 Secure Payment: Funds go directly to the creator's smart contract.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentPage;
