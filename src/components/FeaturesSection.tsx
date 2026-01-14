import { motion } from 'framer-motion';
import { QrCode, BarChart3, Shield, Zap, Tags, Code } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'One QR Code',
    description: 'A single QR code for all payments. Print it, share it, embed it anywhere. Your supporters can scan and pay in seconds.',
  },
  {
    icon: BarChart3,
    title: 'Unified Dashboard',
    description: 'See all earnings in one place with real-time analytics. Know exactly what content drives revenue and when.',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Non-custodial by design. We never hold your funds. Smart contract audited and open-source for transparency.',
  },
  {
    icon: Zap,
    title: 'Instant Withdrawals',
    description: 'No waiting for weekly payouts. Withdraw your BCH anytime, directly to your wallet. 1% fee or less.',
  },
  {
    icon: Tags,
    title: 'CashToken Subscriptions',
    description: 'Create NFT-based subscription passes. Supporters hold a token that grants access to premium content.',
  },
  {
    icon: Code,
    title: 'Developer API',
    description: 'Build your own integrations with our REST API. Create custom payment flows, analytics, and automations.',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Creator Freedom</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Everything you need to monetize your content, nothing you don't.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card rounded-xl p-6 hover:border-primary transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
