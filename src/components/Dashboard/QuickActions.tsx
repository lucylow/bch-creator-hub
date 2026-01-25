import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Download, Share2, BarChart3, Settings, Link2, Wallet, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCreator } from '@/contexts/CreatorContext';
import { cn } from '@/lib/utils';

type Props = { creatorAddress?: string };

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  delay?: number;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  to,
  variant = 'outline',
  delay = 0
}) => {
  const baseClasses = cn(
    'w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl',
    'transition-all duration-200 group',
    variant === 'primary' && 'bg-gradient-primary text-primary-foreground shadow-md hover:shadow-lg hover:opacity-95',
    variant === 'secondary' && 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15',
    variant === 'outline' && 'bg-card hover:bg-muted/50 border border-border/50 hover:border-primary/30 text-foreground'
  );

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.05 }}
      className={baseClasses}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110',
        variant === 'primary' && 'bg-white/20',
        variant === 'secondary' && 'bg-primary/10',
        variant === 'outline' && 'bg-muted/50'
      )}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
      <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );

  if (to) {
    return <Link to={to} className="block hover-lift">{content}</Link>;
  }

  return (
    <button onClick={onClick} className="w-full hover-lift">
      {content}
    </button>
  );
};

const QuickActions: React.FC<Props> = ({ creatorAddress }) => {
  const { creator } = useCreator();

  const handleExport = () => {
    toast.success('Export queued. Check your email shortly.');
  };

  const handleShare = async () => {
    // Single unified link: one URL for tips, subscriptions, and paywalls
    const url = `${window.location.origin}/pay/${creator?.id || 'creator'}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Support me', url });
      } catch {
        navigator.clipboard.writeText(url);
        toast.success('Payment link copied!');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Payment link copied!');
    }
  };

  return (
    <div className="glass-card-elevated rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-foreground">Quick Actions</h3>
      </div>

      <div className="space-y-2">
        <QuickActionButton
          icon={<Plus className="w-4 h-4" />}
          label="Create Payment Link"
          to="/links/new"
          variant="primary"
          delay={0}
        />

        <QuickActionButton
          icon={<Wallet className="w-4 h-4 text-primary" />}
          label="Withdraw Funds"
          to="/withdrawals"
          variant="secondary"
          delay={1}
        />

        <div className="h-px bg-border/50 my-3" />

        <QuickActionButton
          icon={<Link2 className="w-4 h-4 text-muted-foreground" />}
          label="Manage Links"
          to="/links"
          delay={2}
        />

        <QuickActionButton
          icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
          label="Analytics"
          to="/analytics"
          delay={3}
        />

        <QuickActionButton
          icon={<Share2 className="w-4 h-4 text-muted-foreground" />}
          label="Share Payment Link"
          onClick={handleShare}
          delay={4}
        />

        <QuickActionButton
          icon={<Download className="w-4 h-4 text-muted-foreground" />}
          label="Export Data"
          onClick={handleExport}
          delay={5}
        />

        <QuickActionButton
          icon={<Settings className="w-4 h-4 text-muted-foreground" />}
          label="Settings"
          to="/settings"
          delay={6}
        />
      </div>
    </div>
  );
};

export default QuickActions;
