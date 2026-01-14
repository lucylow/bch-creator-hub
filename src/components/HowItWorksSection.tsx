import { motion } from 'framer-motion';
import { Twitter, Youtube } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Create Your Router',
    description: 'Connect your BCH wallet (like Electron Cash). We deploy a smart contract that becomes your permanent payment address. No coding required.',
    extra: (
      <div className="bg-background/50 p-3 rounded-lg mt-4 font-mono text-sm">
        <span className="text-primary">Contract deployed:</span> 0x7a3b8c9f12a45d6e...
      </div>
    ),
  },
  {
    number: 2,
    title: 'Share Your Address',
    description: 'Use your single BCH address everywhere: in video descriptions, Twitter bios, blog footers, podcasts. Generate custom QR codes for different content types.',
    extra: (
      <div className="flex gap-3 mt-4 flex-wrap">
        <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm">
          <Twitter className="w-4 h-4" /> Twitter Tip
        </span>
        <span className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm">
          <Youtube className="w-4 h-4" /> YouTube Superchat
        </span>
      </div>
    ),
  },
  {
    number: 3,
    title: 'Earn & Withdraw',
    description: 'Watch payments flow in from all platforms. Withdraw anytime to your personal wallet. Track everything in your unified dashboard with real-time analytics.',
    extra: (
      <div className="flex items-center gap-4 mt-4">
        <div className="flex-grow h-2 bg-background rounded-full overflow-hidden">
          <div className="w-3/4 h-full bg-gradient-primary rounded-full" />
        </div>
        <span className="text-primary font-semibold">$842 earned this month</span>
      </div>
    ),
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works in 3 Steps</h2>
          <p className="text-muted-foreground text-lg">
            Simple setup, powerful results. Get started in under 5 minutes.
          </p>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                {step.number}
              </div>
              <div className="flex-grow glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {step.extra}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
