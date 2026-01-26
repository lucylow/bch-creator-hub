import React, { forwardRef } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBCH } from '@/utils/formatters';

type DataPoint = { label: string; value: number };

type Props = { data?: DataPoint[]; type?: 'line' | 'area' };

type TooltipPayload = { active?: boolean; payload?: Array<{ value?: number }>; label?: string };
// Using forwardRef to avoid React warning with Recharts Tooltip
const CustomTooltip = forwardRef<HTMLDivElement, TooltipPayload>(({ active, payload, label }, ref) => {
  if (active && payload && payload.length) {
    return (
      <div ref={ref} className="glass-card rounded-lg p-3 border border-border shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <p className="text-lg font-bold text-primary">
          {formatBCH((payload[0].value || 0) * 1e8)}
        </p>
      </div>
    );
  }
  return null;
});
CustomTooltip.displayName = 'CustomTooltip';

const BalanceChart: React.FC<Props> = ({ data = [], type = 'area' }) => {
  const chartData = data.map(d => ({
    date: d.label,
    value: d.value / 1e8, // Convert sats to BCH
  }));

  // Default empty data if none provided
  const displayData = chartData.length > 0 ? chartData : [
    { date: 'Mon', value: 0 },
    { date: 'Tue', value: 0 },
    { date: 'Wed', value: 0 },
    { date: 'Thu', value: 0 },
    { date: 'Fri', value: 0 },
    { date: 'Sat', value: 0 },
    { date: 'Sun', value: 0 },
  ];

  const primaryColor = 'hsl(var(--primary))';
  const secondaryColor = 'hsl(var(--secondary))';

  return (
    <div style={{ height: 300, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={primaryColor}
              strokeWidth={2}
              fill="url(#colorEarnings)"
              activeDot={{ r: 5, fill: primaryColor }}
            />
          </AreaChart>
        ) : (
          <LineChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={primaryColor} 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: primaryColor }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;

