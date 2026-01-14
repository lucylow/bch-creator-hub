import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

type Props = {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: string | null;
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'orange' | 'red';
};

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', iconBg: 'bg-gradient-to-br from-primary to-secondary' },
  green: { bg: 'bg-green-600/10', text: 'text-green-400', iconBg: 'bg-green-600/20' },
  blue: { bg: 'bg-blue-600/10', text: 'text-blue-400', iconBg: 'bg-blue-600/20' },
  purple: { bg: 'bg-purple-600/10', text: 'text-purple-400', iconBg: 'bg-purple-600/20' },
  orange: { bg: 'bg-yellow-600/10', text: 'text-yellow-400', iconBg: 'bg-yellow-600/20' },
  red: { bg: 'bg-red-600/10', text: 'text-red-400', iconBg: 'bg-red-600/20' },
};

const StatCard: React.FC<Props> = ({ title, value, subValue, icon, trend, color = 'primary' }) => {
  const colorScheme = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card rounded-xl p-5 hover:border-primary/50 transition-all duration-300 cursor-default group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
          color === 'primary' ? colorScheme.iconBg : `${colorScheme.iconBg} ${colorScheme.text}`
        )}>
          <div className={clsx(
            'flex items-center justify-center',
            color === 'primary' ? 'text-primary-foreground' : colorScheme.text
          )}>
            {icon}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {value}
            </div>
            {subValue && (
              <div className="text-sm text-muted-foreground">{subValue}</div>
            )}
          </div>
        </div>

        {trend && (
          <div className={clsx(
            'text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap',
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
