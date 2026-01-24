import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'gold';
  size?: 'sm' | 'md' | 'lg';
};

const colorMap: Record<string, { bg: string; text: string; iconBg: string; hoverBorder: string }> = {
  primary: { 
    bg: 'bg-primary/10', 
    text: 'text-primary', 
    iconBg: 'bg-primary/15',
    hoverBorder: 'hover:border-primary/40'
  },
  green: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-500', 
    iconBg: 'bg-emerald-500/15',
    hoverBorder: 'hover:border-emerald-500/40'
  },
  blue: { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-500', 
    iconBg: 'bg-blue-500/15',
    hoverBorder: 'hover:border-blue-500/40'
  },
  purple: { 
    bg: 'bg-violet-500/10', 
    text: 'text-violet-500', 
    iconBg: 'bg-violet-500/15',
    hoverBorder: 'hover:border-violet-500/40'
  },
  orange: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-500', 
    iconBg: 'bg-amber-500/15',
    hoverBorder: 'hover:border-amber-500/40'
  },
  red: { 
    bg: 'bg-red-500/10', 
    text: 'text-red-500', 
    iconBg: 'bg-red-500/15',
    hoverBorder: 'hover:border-red-500/40'
  },
  gold: { 
    bg: 'bg-amber-400/10', 
    text: 'text-amber-400', 
    iconBg: 'bg-gradient-to-br from-amber-400/20 to-amber-500/20',
    hoverBorder: 'hover:border-amber-400/40'
  },
};

const StatCard: React.FC<Props> = ({ 
  title, 
  value, 
  subValue, 
  icon, 
  trend, 
  color = 'primary',
  size = 'md'
}) => {
  const colorScheme = colorMap[color] || colorMap.primary;

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-11 h-11',
    lg: 'w-12 h-12',
  };

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={cn(
        'glass-card-elevated rounded-2xl transition-all duration-300 cursor-default group',
        'focus-within:ring-2 focus-within:ring-primary/50 focus-within:outline-none',
        colorScheme.hoverBorder,
        sizeClasses[size]
      )}
      tabIndex={0}
      role="article"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'rounded-xl flex items-center justify-center transition-all duration-300',
          'group-hover:scale-110 group-hover:shadow-md',
          colorScheme.iconBg,
          colorScheme.text,
          iconSizes[size]
        )}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            {title}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <motion.span 
              key={String(value)}
              initial={{ opacity: 0.7, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'font-bold font-mono text-foreground transition-colors',
                'group-hover:text-foreground',
                valueSizes[size]
              )}
            >
              {value}
            </motion.span>
            {subValue && (
              <span className="text-sm text-muted-foreground">{subValue}</span>
            )}
          </div>
        </div>

        {/* Trend badge */}
        {trend && (
          <div className={cn(
            'text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
            'transition-transform group-hover:scale-105',
            colorScheme.bg,
            colorScheme.text
          )}>
            {trend}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
