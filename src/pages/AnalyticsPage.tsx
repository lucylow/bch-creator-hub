import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, BarChart3, ArrowLeft, Link2 } from 'lucide-react';
import { formatBCH } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import Breadcrumbs from '@/components/Common/Breadcrumbs';

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('30');

  const metrics = [
    { label: 'Total Revenue', value: formatBCH(450000000), change: '+23%', trend: 'up', icon: DollarSign },
    { label: 'Total Transactions', value: '142', change: '+18%', trend: 'up', icon: BarChart3 },
    { label: 'Unique Supporters', value: '67', change: '+12%', trend: 'up', icon: Users },
    { label: 'Avg Transaction', value: formatBCH(3169014), change: '-5%', trend: 'down', icon: Clock },
  ];

  const topSources = [
    { source: 'Twitter Tips', amount: 180000000, percentage: 40 },
    { source: 'Article Unlocks', amount: 135000000, percentage: 30 },
    { source: 'YouTube Superchats', amount: 90000000, percentage: 20 },
    { source: 'Direct Donations', amount: 45000000, percentage: 10 },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track your earnings and performance
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
            <Link to="/links">
              <Button variant="outline" size="sm" className="gap-2">
                <Link2 className="w-4 h-4" />
                View Links
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <metric.icon className="w-5 h-5 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {metric.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Revenue Over Time</h2>
            <div className="h-64 flex items-end justify-between gap-1">
              {Array.from({ length: 30 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${20 + Math.random() * 60}%` }}
                  transition={{ delay: i * 0.02 }}
                  className="flex-1 bg-gradient-to-t from-primary to-primary/30 rounded-t"
                />
              ))}
            </div>
          </motion.div>

          {/* Top Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Top Payment Sources</h2>
            <div className="space-y-4">
              {topSources.map((source, index) => (
                <div key={source.source}>
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground">{source.source}</span>
                    <span className="text-muted-foreground">{formatBCH(source.amount)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.percentage}%` }}
                      transition={{ delay: index * 0.1 }}
                      className="h-full bg-gradient-primary rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
