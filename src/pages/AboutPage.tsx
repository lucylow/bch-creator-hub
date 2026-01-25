import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Route, Zap, Shield, Globe, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingLayout from '@/components/Layout/MarketingLayout';

const values = [
  {
    icon: Zap,
    title: 'Fast & low-cost',
    description: 'Bitcoin Cash transactions settle in seconds with fees under a cent. No chargebacks, no intermediaries.',
  },
  {
    icon: Shield,
    title: 'Non-custodial',
    description: 'Your keys, your coins. Funds live in smart contracts you control. We never hold your money.',
  },
  {
    icon: Globe,
    title: 'Permissionless',
    description: 'Anyone, anywhere can receive and send. No gatekeepers, no account freezes, no borders.',
  },
  {
    icon: Heart,
    title: 'Creator-first',
    description: 'Built for artists, streamers, and builders who want a single address for tips, subs, and paywalls.',
  },
];

const AboutPage = () => {
  return (
    <MarketingLayout>
      <div className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Route className="w-4 h-4" />
              About BCH Paywall Router
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
              One address for all your creator payments
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're building the financial rails for the decentralized creator economy—powered by Bitcoin Cash.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-8 sm:p-10 border-border/50 mb-16"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">Our mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Creators today juggle Patreon, Ko-fi, Streamlabs, and platform payouts. Each has its own address, dashboard, and fees. 
              BCH Paywall Router gives you a single smart-contract address that accepts tips, subscriptions, paywall payments, and donations—all on Bitcoin Cash.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We're part of the BCH ecosystem, committed to low fees, fast settlement, and putting control back in creators' hands.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">What we stand for</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="glass-card rounded-xl p-6 border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-muted-foreground mb-6">
              Ready to unify your creator payments?
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2">
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">See pricing</Button>
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default AboutPage;
