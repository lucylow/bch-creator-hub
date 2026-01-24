import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  isLive?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LiveIndicator = ({ 
  isLive = true, 
  label = 'Live',
  size = 'md',
  className 
}: LiveIndicatorProps) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex">
        <motion.span
          animate={isLive ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={cn(
            'absolute inline-flex rounded-full',
            sizeClasses[size],
            isLive ? 'bg-primary/50' : 'bg-muted-foreground/30'
          )}
        />
        <span
          className={cn(
            'relative inline-flex rounded-full',
            sizeClasses[size],
            isLive ? 'bg-primary pulse-glow' : 'bg-muted-foreground/50'
          )}
        />
      </span>
      {label && (
        <span className={cn(
          'font-medium',
          textSizeClasses[size],
          isLive ? 'text-primary' : 'text-muted-foreground'
        )}>
          {label}
        </span>
      )}
    </div>
  );
};

export default LiveIndicator;
