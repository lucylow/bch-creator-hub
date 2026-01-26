import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, ExternalLink, Globe, Calendar, Zap, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatBCH, truncateAddress } from '@/utils/formatters';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import PageTransition from '@/components/Common/PageTransition';
import PaymentForm from '@/components/Payment/PaymentForm';
import UnifiedPaymentInterface, { type UnifiedPaymentType } from '@/components/Payment/UnifiedPaymentInterface';
import WalletConnectModal from '@/components/Wallet/WalletConnectModal';
import { useWallet } from '@/contexts/WalletContext';

const CREATOR_INFO = {
  displayName: 'Demo Creator',
  bio: 'Building the future of creator monetization',
  address: 'bitcoincash:qpaq9sh8w7xs5qn4q9c3l8f9k2d4q7s8vga9mpt2vh',
  contractAddress: 'bitcoincash:qpaq9sh8w7xs5qn4q9c3l8f9k2d4q7s8vga9mpt2vh',
};

function paymentTypeFromSlug(slug: string | undefined): UnifiedPaymentType {
  if (slug === 'subscription' || slug === 'sub') return 'subscription';
  if (slug === 'paywall' || slug === 'unlock') return 'paywall';
  return 'tip';
}

const PaymentPage = () => {
  const { creatorId, paymentId } = useParams<{ creatorId?: string; paymentId?: string }>();
  const navigate = useNavigate();
  const { isConnected, address, sendPayment } = useWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeRedirecting, setStripeRedirecting] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [paymentType, setPaymentType] = useState<UnifiedPaymentType>(() => paymentTypeFromSlug(paymentId));
  const [paymentDetails, setPaymentDetails] = useState({
    recipient: '',
    amountSats: 0,
    description: '',
    contentUrl: '',
    createdAt: new Date().toISOString(),
  });

  const creatorInfo = CREATOR_INFO;

  const unifiedPaymentLink = useMemo(
    () => (creatorId ? `${window.location.origin}/pay/${creatorId}` : undefined),
    [creatorId]
  );

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    setTimeout(() => {
      setPaymentDetails({
        recipient: creatorInfo.address,
        amountSats: 0,
        description: paymentId ? `Payment ${paymentId}` : 'Support this creator',
        contentUrl: '',
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 500);
  }, [paymentId, creatorInfo.address]);

  useEffect(() => {
    if (creatorId) loadDetails();
  }, [creatorId, loadDetails]);

  useEffect(() => {
    setPaymentType(paymentTypeFromSlug(paymentId));
  }, [paymentId]);

  const handlePayWithCard = async () => {
    const amountCents = Math.round((parseFloat(amount) || 0) * 100);
    if (amountCents < 50) {
      toast.error('Minimum amount for card is $0.50');
      return;
    }
    if (!creatorId) {
      toast.error('Invalid payment link');
      return;
    }
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const origin = window.location.origin;
    try {
      setStripeRedirecting(true);
      const res = await fetch(`${apiBase}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          amountCents,
          currency: 'usd',
          successUrl: `${origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/pay/${creatorId}`,
          description: paymentDetails.description || 'Creator support'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || (data?.data ? JSON.stringify(data.data) : 'Card payment unavailable');
        toast.error(typeof msg === 'string' ? msg : 'Card payment failed');
        return;
      }
      const url = data?.data?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      toast.error('Could not start checkout');
    } catch {
      toast.error('Card payment failed');
    } finally {
      setStripeRedirecting(false);
    }
  };

  const handlePayment = async () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }

    try {
      setIsProcessing(true);
      const amountSats = paymentDetails.amountSats || Math.round(parseFloat(amount) * 100000000);

      const result = await sendPayment(
        creatorInfo.contractAddress,
        amountSats,
        JSON.stringify({
          creatorId,
          paymentType,
          metadata: {},
        })
      );

      if (result?.txid) {
        setTxHash(result.txid);
        setPaymentComplete(true);
        toast.success('Payment sent successfully!');
      } else {
        throw new Error('Payment may not have completed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const amountSatsForQR = useMemo(() => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return Math.round(n * 100000000);
  }, [amount]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (paymentComplete) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center px-6 py-24">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
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
      </PageTransition>
    );
  }

  return (
    <PageTransition>
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
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment For</p>
                    <p className="font-medium text-foreground">{paymentDetails.description}</p>
                  </div>
                </div>
                {paymentDetails.contentUrl && (
                  <a 
                    href={paymentDetails.contentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                  >
                    <Globe className="w-4 h-4" />
                    <span>View Content</span>
                  </a>
                )}
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground">
                      {new Date(paymentDetails.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unified: one QR + address for tips, subscriptions, paywalls */}
            <UnifiedPaymentInterface
              address={creatorInfo.address}
              creatorName={creatorInfo.displayName}
              amountSats={amountSatsForQR}
              paymentType={paymentType}
              onPaymentTypeChange={setPaymentType}
              paymentLinkUrl={unifiedPaymentLink}
              qrSize={200}
            />
          </div>

          {/* Payment Form */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Complete Payment</h2>
              <span className="text-2xl">₿</span>
            </div>

            <PaymentForm
              amount={amount}
              setAmount={setAmount}
              fixedAmount={paymentDetails.amountSats > 0}
              paymentDetails={paymentDetails}
              isConnected={isConnected}
              address={address}
              isProcessing={isProcessing}
              onPayment={handlePayment}
              onConnectWallet={() => setShowWalletModal(true)}
            />

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
                <span className="text-primary">
                  {formatBCH(paymentDetails.amountSats || Math.round((parseFloat(amount || '0') || 0) * 100000000))}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Or pay with card (amount in USD)</p>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handlePayWithCard}
                disabled={stripeRedirecting || !amount || parseFloat(amount || '0') < 0.5}
              >
                <CreditCard className="w-4 h-4" />
                {stripeRedirecting ? 'Redirecting…' : 'Pay with card'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              🔒 Secure Payment: Funds go directly to the creator's smart contract. We never hold your BCH.
            </p>
          </div>
        </motion.div>
      </div>

      {showWalletModal && (
        <WalletConnectModal 
          open={showWalletModal} 
          onClose={() => setShowWalletModal(false)} 
        />
      )}
      </div>
    </PageTransition>
  );
};

export default PaymentPage;
