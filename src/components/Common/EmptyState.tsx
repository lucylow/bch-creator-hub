import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const iconSize = iconSizes[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('text-center py-12 px-6', className)}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className={cn(
          'mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center',
          iconSize
        )}
      >
        <Icon className={cn('text-muted-foreground/60', size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10')} />
      </motion.div>
      
      <h3 className={cn(
        'font-semibold mb-2 text-foreground',
        size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
      )}>
        {title}
      </h3>
      
      <p className={cn(
        'text-muted-foreground mb-6 max-w-md mx-auto',
        size === 'sm' ? 'text-sm' : 'text-base'
      )}>
        {description}
      </p>
      
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className={size === 'lg' ? 'px-8 py-6 text-lg' : ''}
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;



