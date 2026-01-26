import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageTransition from '@/components/Common/PageTransition';

/**
 * Shown after a successful Stripe Checkout redirect.
 * URL: /pay/success?session_id=...
 */
const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your support. Your card payment has been completed.
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground font-mono mb-4 break-all">
              Session: {sessionId.slice(0, 24)}…
            </p>
          )}
          <Button asChild className="w-full bg-gradient-primary text-primary-foreground">
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default PaymentSuccessPage;
