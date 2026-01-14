import React from 'react';
import clsx from 'clsx';

type Props = {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: string | null;
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'orange' | 'red';
};

const colorMap: Record<string, string> = {
  primary: 'from-primary to-secondary',
  green: 'bg-green-600/10 text-green-300',
  blue: 'bg-blue-600/10 text-blue-300',
  purple: 'bg-purple-600/10 text-purple-300',
  orange: 'bg-yellow-600/10 text-yellow-300',
  red: 'bg-red-600/10 text-red-300',
};

const StatCard: React.FC<Props> = ({ title, value, subValue, icon, trend, color = 'primary' }) => {
  return (
    <div className="glass-card rounded-xl p-5 flex items-center gap-4">
      <div 
        className={clsx(
          'w-14 h-14 rounded-xl flex items-center justify-center', 
          color === 'primary' ? 'bg-gradient-to-br' : ''
        )}
      >
        {color === 'primary' ? (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground">
            {icon}
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || ''}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-xl font-bold text-foreground">{value}</div>
          {subValue && <div className="text-sm text-muted-foreground">{subValue}</div>}
        </div>
      </div>

      {trend && <div className="text-sm text-muted-foreground">{trend}</div>}
    </div>
  );
};

export default StatCard;
