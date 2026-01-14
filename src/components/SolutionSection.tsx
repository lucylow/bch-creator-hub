import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const benefits = [
  { title: 'Non-Custodial', desc: 'Funds go directly to your contract, not our servers' },
  { title: 'Cross-Platform', desc: 'Works on Twitter, YouTube, blogs, podcasts—anywhere' },
  { title: 'Micro-Payment Ready', desc: 'Send $0.01 tips without $3 fees' },
];

const SolutionSection = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="solution" className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">The Bitcoin Cash Solution</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A protocol-first approach that puts creators back in control of their monetization.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass-card rounded-xl p-6 shadow-2xl">
              <div className="flex justify-between mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">0.5 BCH</div>
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">42</div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-4 space-y-3">
                {[
                  { source: 'Twitter Tip', amount: '+0.01 BCH' },
                  { source: 'Article Unlock', amount: '+0.005 BCH' },
                  { source: 'YouTube Superchat', amount: '+0.02 BCH' },
                ].map((tx) => (
                  <div key={tx.source} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-foreground/80">{tx.source}</span>
                    <span className="text-primary font-medium">{tx.amount}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 px-4 py-2 rounded-full bg-primary/10 text-primary font-mono text-sm inline-block">
                bitcoincash:qpaq9sh8w7... (your single address)
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-6">Unified Payment Layer</h3>
            <p className="text-muted-foreground mb-8">
              We deploy a smart contract on Bitcoin Cash that becomes your permanent payment address. 
              Every tip, unlock, or subscription goes to this single address, while our system 
              intelligently routes and categorizes each payment based on its source.
            </p>

            <ul className="space-y-4 mb-8">
              {benefits.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">{benefit.title}:</span>{' '}
                    <span className="text-muted-foreground">{benefit.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => scrollToSection('#how-it-works')}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold"
            >
              See How It Works
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
