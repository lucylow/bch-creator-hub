import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { formatBCH } from '@/utils/formatters';

type PaymentEvent = {
  txid: string;
  creatorId: string;
  paymentType: number;
  contentId: number;
  amountSats: number;
  blockHeight: number;
  blockHash?: string;
};

type LiveFeedProps = {
  creatorId: string;
  apiUrl?: string;
};

/**
 * LiveFeed - Real-time payment feed component for creator dashboard
 * 
 * Subscribes to WebSocket events for a specific creator and displays
 * live payment events as they are indexed from the blockchain
 */
export default function LiveFeed({ creatorId, apiUrl }: LiveFeedProps) {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsUrl = apiUrl?.replace(/^https?/, 'ws') || (typeof window !== 'undefined' 
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : 'ws://localhost:3001');

  useEffect(() => {
    // Use socket.io-client if available, otherwise fallback to native WebSocket
    let socket: any = null;

    try {
      // Try to use socket.io if available
      const io = require('socket.io-client');
      socket = io(wsUrl, { transports: ['websocket', 'polling'] });
      
      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('authenticate', { creatorId });
      });

      socket.on('authenticated', () => {
        console.log('Authenticated for creator:', creatorId);
      });

      socket.on('payment', (evt: PaymentEvent) => {
        setEvents((prev) => [evt, ...prev].slice(0, 50)); // Keep last 50 events
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
      });
    } catch (err) {
      console.warn('Socket.IO not available, falling back to polling', err);
      // Fallback to polling if socket.io not available
      const pollInterval = setInterval(async () => {
        try {
          const apiBase = apiUrl || '/api';
          const res = await fetch(`${apiBase}/transactions?limit=20`);
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              setEvents(data.data.slice(0, 20));
            }
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 5000);

      return () => clearInterval(pollInterval);
    }

    return () => {
      if (socket) {
        socket.emit('unsubscribe_creator', creatorId);
        socket.disconnect();
      }
    };
  }, [creatorId, wsUrl, apiUrl]);

  const getPaymentTypeLabel = (type: number) => {
    switch (type) {
      case 1: return 'Tip';
      case 2: return 'Unlock';
      case 3: return 'Subscription';
      default: return 'Payment';
    }
  };

  const formatTxid = (txid: string) => {
    return `${txid.slice(0, 8)}…${txid.slice(-6)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Payments</CardTitle>
            <CardDescription>
              Real-time payment notifications
            </CardDescription>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No payments yet</p>
            <p className="text-sm mt-2">Payments will appear here as they're received</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.txid}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{getPaymentTypeLabel(event.paymentType)}</Badge>
                    <span className="font-semibold text-primary">
                      {formatBCH(event.amountSats)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <code className="text-xs">{formatTxid(event.txid)}</code>
                    {event.contentId && (
                      <>
                        <span>•</span>
                        <span>Content #{event.contentId}</span>
                      </>
                    )}
                    {event.blockHeight && (
                      <>
                        <span>•</span>
                        <span>Block {event.blockHeight}</span>
                      </>
                    )}
                  </div>
                </div>
                <a
                  href={`https://blockchair.com/bitcoin-cash/transaction/${event.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

