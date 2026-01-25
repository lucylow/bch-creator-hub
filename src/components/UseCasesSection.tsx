import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Video,
  Mic2,
  PenLine,
  Code2,
  Cloud,
  Plug,
  GraduationCap,
  Palette,
  Music2,
  Brush,
  Package,
  Rocket,
  Briefcase,
  MessageCircle,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type PersonaId = 'creators' | 'developers' | 'artists' | 'entrepreneurs';

interface UseCase {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Persona {
  id: PersonaId;
  label: string;
  shortLabel: string;
  tagline: string;
  useCases: UseCase[];
}

const personas: Persona[] = [
  {
    id: 'creators',
    label: 'Content Creators',
    shortLabel: 'Creators',
    tagline: 'Tips, paywalls, and subscriptions—one link for every platform.',
    useCases: [
      { icon: FileText, title: 'Bloggers', description: 'Accept tips and unlock premium articles' },
      { icon: Video, title: 'YouTubers', description: 'Receive donations and subscription payments' },
      { icon: Mic2, title: 'Podcasters', description: 'Monetize episodes with pay-per-listen' },
      { icon: PenLine, title: 'Writers', description: 'Sell individual articles or subscription access' },
    ],
  },
  {
    id: 'developers',
    label: 'Developers',
    shortLabel: 'Developers',
    tagline: 'Monetize code, APIs, and courses without gatekeepers.',
    useCases: [
      { icon: Code2, title: 'Open Source', description: 'Accept donations and sponsor payments' },
      { icon: Cloud, title: 'SaaS', description: 'Subscription-based access to tools and services' },
      { icon: Plug, title: 'APIs', description: 'Pay-per-use API access' },
      { icon: GraduationCap, title: 'Courses', description: 'Sell educational content and tutorials' },
    ],
  },
  {
    id: 'artists',
    label: 'Artists & Musicians',
    shortLabel: 'Artists',
    tagline: 'NFTs, memberships, commissions, and drops—all in one place.',
    useCases: [
      { icon: Palette, title: 'Digital Art', description: 'Sell NFT subscriptions and access to exclusive content' },
      { icon: Music2, title: 'Music', description: 'Subscription-based access to music library' },
      { icon: Brush, title: 'Commissions', description: 'Accept payments for custom work' },
      { icon: Package, title: 'Merchandise', description: 'Pre-orders and limited edition sales' },
    ],
  },
  {
    id: 'entrepreneurs',
    label: 'Entrepreneurs',
    shortLabel: 'Entrepreneurs',
    tagline: 'Early adopters, retainers, consulting, and events—get paid in BCH.',
    useCases: [
      { icon: Rocket, title: 'Startups', description: 'Accept early adopter payments' },
      { icon: Briefcase, title: 'Services', description: 'Subscription-based services' },
      { icon: MessageCircle, title: 'Consulting', description: 'Payment for consulting hours' },
      { icon: Ticket, title: 'Events', description: 'Ticket sales and registration fees' },
    ],
  },
];

const UseCasesSection = () => {
  const [activePersona, setActivePersona] = useState<PersonaId>('creators');
  const current = personas.find((p) => p.id === activePersona)!;

  const scrollToWaitlist = () => {
    const el = document.querySelector('#waitlist');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="use-cases" className="py-28 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.06),transparent)] pointer-events-none"
        aria-hidden
      />
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-3">
            Use Cases
          </span>
          <h2 className="font-heading section-title mb-4">Built for how you create and sell</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            One payment layer for bloggers, developers, artists, and entrepreneurs. Pick your role to see how it fits.
          </p>
        </motion.div>

        {/* Persona pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePersona(p.id)}
              className={`relative px-4 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                activePersona === p.id
                  ? 'text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
              }`}
              aria-pressed={activePersona === p.id}
              aria-label={`View use cases for ${p.label}`}
            >
              {activePersona === p.id && (
                <motion.div
                  layoutId="personaPill"
                  className="absolute inset-0 rounded-full bg-primary"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{p.shortLabel}</span>
            </button>
          ))}
        </motion.div>

        {/* Content for selected persona */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">{current.tagline}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {current.useCases.map((uc, i) => (
                <motion.div
                  key={uc.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-5 flex items-start gap-4 hover:border-primary/40 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.08)] transition-all duration-300 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <uc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground mb-0.5">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{uc.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={scrollToWaitlist}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
              >
                Get started as a {current.shortLabel.toLowerCase()}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default UseCasesSection;
