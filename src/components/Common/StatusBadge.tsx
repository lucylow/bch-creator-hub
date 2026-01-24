import { CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'success' | 'pending' | 'failed' | 'warning' | 'processing';

interface StatusBadgeProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<Status, {
  icon: typeof CheckCircle;
  bg: string;
  text: string;
  border: string;
  glow?: string;
}> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  pending: {
    icon: Clock,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'pending-glow',
  },
  processing: {
    icon: Loader2,
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  failed: {
    icon: XCircle,
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/20',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
};

const StatusBadge = ({ 
  status, 
  label,
  size = 'md',
  showIcon = true,
  className 
}: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-all',
        config.bg,
        config.text,
        config.border,
        config.glow,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          iconSizes[size],
          status === 'processing' && 'animate-spin'
        )} />
      )}
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
