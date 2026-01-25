import { motion } from 'framer-motion';
import {
  QrCode,
  BarChart3,
  Shield,
  Zap,
  Tags,
  Code,
  Video,
  Palette,
  Rocket,
  CheckCircle2,
  Lock,
  KeyRound,
  FileCheck,
  Timer,
} from 'lucide-react';

const securityFeatures = [
  { icon: Lock, title: 'Non-Custodial', description: 'Your keys, your funds. We never hold or move your BCH.' },
  { icon: FileCheck, title: 'Audited Contracts', description: 'Smart contracts reviewed for security and correctness.' },
  { icon: KeyRound, title: 'Creator-Signed', description: 'Withdrawals require your signature. No admin override.' },
  { icon: Timer, title: 'Time Locks', description: 'Optional cooldowns and multi-sig for large withdrawals.' },
  { icon: Shield, title: 'No Backdoors', description: 'Immutable logic, no upgradeable proxies or hidden keys.' },
];

const audiences = [
  {
    icon: Video,
    title: 'Content Creators',
    description: 'Streamers, YouTubers, podcasters, writers.',
    benefits: [
      'One QR or link for tips, memberships, and paywalled content',
      'Real-time dashboard so you see what drives revenue',
      'No platform lock-in—keep your audience and your keys',
    ],
    accent: 'primary',
  },
  {
    icon: Palette,
    title: 'Artists',
    description: 'Illustrators, musicians, 3D artists, photographers.',
    benefits: [
      'Sell digital art & music as NFTs with CashTokens',
      'Subscription passes so collectors unlock drops and perks',
      'Low fees and instant payouts in BCH to your wallet',
    ],
    accent: 'secondary',
  },
  {
    icon: Code,
    title: 'Developers',
    description: 'Builders, indie devs, open-source maintainers.',
    benefits: [
      'REST API for custom payment flows and analytics',
      'Embeddable widgets, webhooks, and no-code payment links',
      'Open-source stack—audit, fork, and self-host if you want',
    ],
    accent: 'primary',
  },
  {
    icon: Rocket,
    title: 'Entrepreneurs',
    description: 'Solopreneurs, coaches, course creators, small teams.',
    benefits: [
      'Unified earnings and payouts without middlemen or chargebacks',
      'NFT passes for gated communities, courses, or early access',
      'Professional payment links and branding you fully control',
    ],
    accent: 'secondary',
  },
];

const platformFeatures = [
  {
    icon: QrCode,
    title: 'One QR Code',
    description: 'A single QR or link for all payments. Print it, share it, embed it. Supporters pay in seconds.',
  },
  {
    icon: BarChart3,
    title: 'Unified Dashboard',
    description: 'Real-time analytics and earnings in one place. Know what drives revenue and when.',
  },
  {
    icon: Shield,
    title: 'Security by Design',
    description: 'Non-custodial, no admin keys, no upgradeable backdoors. Audited contracts, time locks, and creator-signed withdrawals.',
  },
  {
    icon: Zap,
    title: 'Instant Withdrawals',
    description: 'Withdraw BCH anytime to your wallet. No weekly payouts or holds. 1% fee or less.',
  },
  {
    icon: Tags,
    title: 'CashToken NFTs',
    description: 'NFT-based passes and subscriptions. Supporters hold the token; you control the gate.',
  },
  {
    icon: Code,
    title: 'Developer API',
    description: 'REST API, webhooks, and embeds. Build custom flows, analytics, and automations.',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)] pointer-events-none" aria-hidden />
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-3">For Creators</span>
          <h2 className="font-heading section-title mb-4">Built for everyone who creates</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Whether you make videos, art, code, or businesses—get paid in BCH without platforms taking a cut.
          </p>
        </motion.div>

        {/* Audience-specific benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-6 flex flex-col hover:border-primary/40 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.12)] transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  audience.accent === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                }`}
              >
                <audience.icon
                  className={`w-6 h-6 ${audience.accent === 'primary' ? 'text-primary' : 'text-secondary'}`}
                />
              </div>
              <h3 className="text-lg font-semibold mb-1">{audience.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">{audience.description}</p>
              <ul className="space-y-2 mt-auto">
                {audience.benefits.map((benefit, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2
                      className={`shrink-0 w-4 h-4 mt-0.5 ${
                        audience.accent === 'primary' ? 'text-primary' : 'text-secondary'
                      }`}
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Platform features */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-xl font-semibold text-foreground/90">One platform. Every tool.</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl mx-auto">
            Shared infrastructure that works for creators, artists, developers, and entrepreneurs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-6 hover:border-primary/50 hover:shadow-[0_12px_40px_hsl(var(--primary)/0.1)] transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 ring-1 ring-primary/10">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Security features — detailed */}
        <motion.div
          id="security"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] to-transparent px-6 py-10 md:px-10 md:py-12 shadow-[0_0_0_1px_hsl(var(--primary)/0.05)_inset]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Security Features</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Your keys, your funds, your control. No backdoors.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {securityFeatures.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                viewport={{ once: true }}
                className="rounded-xl bg-background/80 dark:bg-background/40 border border-border/80 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
