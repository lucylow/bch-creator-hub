import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBCH } from '@/utils/formatters';
import { isDemoMode } from '@/config/demo';
import LiveIndicator from '@/components/Common/LiveIndicator';

type PaymentEvent = {
  txid: string;
  creatorId: string;
  paymentType: number;
  contentId: number;
  amountSats: number;
  blockHeight: number;
  blockHash?: string;
  timestamp?: string;
};

type LiveFeedProps = {
  creatorId: string;
  apiUrl?: string;
};

// Generate mock events for demo mode
const generateMockEvent = (): PaymentEvent => {
  const types = [1, 2, 3];
  const chars = '0123456789abcdef';
  let txid = '';
  for (let i = 0; i < 64; i++) {
    txid += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return {
    txid,
    creatorId: 'demo-creator',
    paymentType: types[Math.floor(Math.random() * types.length)],
    contentId: Math.floor(Math.random() * 100),
    amountSats: Math.floor(Math.random() * 500000) + 10000,
    blockHeight: 900000 + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
  };
};

/**
 * LiveFeed - Real-time payment feed component for creator dashboard
 * 
 * In demo mode, generates simulated payment events
 * In production, subscribes to WebSocket events for a specific creator
 */
export default function LiveFeed({ creatorId, apiUrl }: LiveFeedProps) {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Demo mode: generate mock events periodically
    if (isDemoMode()) {
      // Start with a few events
      setEvents([generateMockEvent(), generateMockEvent(), generateMockEvent()]);
      setIsConnected(true);
      
      // Add new events periodically
      const interval = setInterval(() => {
        if (Math.random() > 0.5) { // 50% chance of new event
          setEvents((prev) => [generateMockEvent(), ...prev].slice(0, 20));
        }
      }, 8000);
      
      return () => clearInterval(interval);
    }

    // Production mode: try WebSocket connection
    const wsUrl = apiUrl?.replace(/^https?/, 'ws') || 
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(`${wsUrl}/ws`);
      
      ws.onopen = () => {
        setIsConnected(true);
        ws?.send(JSON.stringify({ type: 'subscribe', creatorId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'payment') {
            setEvents((prev) => [data.payload, ...prev].slice(0, 50));
          }
        } catch (err) {
          console.warn('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket connection failed:', err);
      setIsConnected(false);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [creatorId, apiUrl]);

  const getPaymentTypeLabel = (type: number) => {
    switch (type) {
      case 1: return 'Tip';
      case 2: return 'Unlock';
      case 3: return 'Subscription';
      default: return 'Payment';
    }
  };

  const getPaymentTypeColor = (type: number) => {
    switch (type) {
      case 1: return 'bg-accent/20 text-accent border-accent/30';
      case 2: return 'bg-secondary/20 text-secondary border-secondary/30';
      case 3: return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTxid = (txid: string) => {
    return `${txid.slice(0, 8)}…${txid.slice(-6)}`;
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Live Payments
            </CardTitle>
            <CardDescription className="mt-1">
              Real-time payment notifications
            </CardDescription>
          </div>
          <LiveIndicator 
            isLive={isConnected} 
            label={isConnected ? 'Live' : 'Offline'} 
          />
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No payments yet</p>
            <p className="text-sm mt-1">Payments will appear here as they're received</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {events.map((event) => (
                <motion.div
                  key={event.txid}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPaymentTypeColor(event.paymentType)}`}>
                        {getPaymentTypeLabel(event.paymentType)}
                      </span>
                      <span className="font-bold text-primary font-mono">
                        {formatBCH(event.amountSats)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="bg-muted/50 px-1.5 py-0.5 rounded">{formatTxid(event.txid)}</code>
                      {event.blockHeight > 0 && (
                        <>
                          <span>•</span>
                          <span>Block {event.blockHeight.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <a
                    href={`https://blockchair.com/bitcoin-cash/transaction/${event.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="View on Blockchair"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
