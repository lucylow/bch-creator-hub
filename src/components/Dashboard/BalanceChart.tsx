import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type DataPoint = { label: string; value: number };

type Props = { data?: DataPoint[] };

const BalanceChart: React.FC<Props> = ({ data = [] }) => {
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

  return (
    <div style={{ height: 260, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;

