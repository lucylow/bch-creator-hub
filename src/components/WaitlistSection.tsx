import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const WaitlistSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setIsSubmitted(true);
    toast.success("You're on the list! We'll contact you when we launch.");
  };

  return (
    <section id="waitlist" className="py-24 px-6 bg-gradient-to-br from-primary/5 to-secondary/5" aria-labelledby="waitlist-heading">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 id="waitlist-heading" className="font-heading section-title mb-4">Join the Creator Economy Revolution</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Be among the first 500 creators to get lifetime 0.5% fees. Limited spots available.
          </p>

          {!isSubmitted ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
              aria-label="Join waitlist"
            >
              <label htmlFor="waitlist-email" className="sr-only">
                Email address
              </label>
              <Input
                id="waitlist-email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="flex-grow bg-background/50 border-border focus:border-primary h-12 rounded-xl"
                aria-invalid={!!email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold h-12 px-6 rounded-xl shrink-0"
              >
                {isLoading ? (
                  'Joining...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Join Waitlist
                  </>
                )}
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="bg-primary/10 border border-primary/30 rounded-2xl p-8 max-w-lg mx-auto shadow-lg shadow-primary/5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 12 }}
                className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle className="w-8 h-8 text-primary" aria-hidden />
              </motion.div>
              <p className="font-semibold text-lg text-foreground mb-1">You're on the list!</p>
              <p className="text-muted-foreground text-sm">We'll contact you when we launch. Check your email for confirmation.</p>
            </motion.div>
          )}

          <p className="text-muted-foreground text-sm mt-4 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            We respect your privacy. No spam, ever.
          </p>

          <div className="flex justify-center gap-8 mt-12 flex-wrap">
            {[
              { value: '500+', label: 'Creators Waiting' },
              { value: '$20k+', label: 'Prize Pool' },
              { value: 'BCH-1', label: 'Hackcelerator' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WaitlistSection;
