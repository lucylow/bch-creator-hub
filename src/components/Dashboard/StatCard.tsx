import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string | null;
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  primary: 'from-primary/20 to-primary/5 text-primary',
  green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
  purple: 'from-secondary/20 to-secondary/5 text-secondary',
  orange: 'from-orange-500/20 to-orange-500/5 text-orange-400',
  red: 'from-red-500/20 to-red-500/5 text-red-400',
};

const StatCard = ({ title, value, icon, trend, color = 'primary' }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl p-5 bg-gradient-to-br ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-background/50">
          {icon}
        </div>
        {trend && (
          <span className="text-xs px-2 py-1 rounded-full bg-background/50 text-muted-foreground">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </motion.div>
  );
};

export default StatCard;
