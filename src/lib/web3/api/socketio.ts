import { io, Socket } from 'socket.io-client';
import { logger } from '@/utils/logger';

/** Server URL for Socket.io (HTTP/HTTPS, same origin as API) */
function getServerUrl(): string {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return url.replace(/^ws/, 'http').replace(/^wss/, 'https');
}

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export type PaymentReceivedPayload = {
  transaction: {
    txid: string;
    amount_sats: number;
    sender_address?: string;
    confirmations?: number;
    is_confirmed?: boolean;
    payment_type?: number;
    block_height?: number;
    content_id?: number;
    indexed_at?: string;
    created_at?: string;
  };
};

export type PaymentConfirmedPayload = {
  transaction: {
    txid: string;
    amount_sats: number;
    confirmations?: number;
  };
};

export type BalanceUpdatePayload = Record<string, unknown> & { total_balance?: number; total?: number };

export type WithdrawalStatusPayload = {
  withdrawal: {
    id: string;
    status: string;
    txid?: string;
    amount_sats?: number;
  };
};

export type PaymentsBatchPayload = {
  transactions: PaymentReceivedPayload['transaction'][];
};

export type LiveEventType =
  | 'payment:received'
  | 'payments:batch'
  | 'payment:confirmed'
  | 'balance:update'
  | 'withdrawal:status'
  | 'authenticated'
  | 'error';

export type LiveEventHandler =
  | ((payload: PaymentReceivedPayload) => void)
  | ((payload: PaymentsBatchPayload) => void)
  | ((payload: PaymentConfirmedPayload) => void)
  | ((payload: BalanceUpdatePayload) => void)
  | ((payload: WithdrawalStatusPayload) => void)
  | ((payload: { creatorId: string }) => void)
  | ((payload: { message: string; code?: string }) => void);

/** Heartbeat interval to detect stale connections (ms) */
const CLIENT_HEARTBEAT_INTERVAL_MS = 25_000;

/**
 * Socket.io-based real-time client that matches the backend WebSocket server.
 * - Connects to the same origin as the API
 * - Authenticates with creatorId via 'authenticate' event
 * - Listens for payment:received, payments:batch, payment:confirmed, balance:update, withdrawal:status
 * - Reconnects with exponential backoff and reports connection state
 * - Optional heartbeat to detect stale connections
 */
export class SocketIOClient {
  private socket: Socket | null = null;
  private creatorId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Map<LiveEventType, Set<LiveEventHandler>>();
  private connectionStateCallback: ((connected: boolean) => void) | null = null;

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  setConnectionStateCallback(cb: ((connected: boolean) => void) | null): void {
    this.connectionStateCallback = cb;
  }

  connect(creatorId: string): void {
    if (this.creatorId === creatorId && this.socket?.connected) {
      return;
    }
    this.disconnect();
    this.creatorId = creatorId;
    const serverUrl = getServerUrl();
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: false, // we implement our own backoff
      timeout: 10_000,
      withCredentials: true,
      upgrade: true,
      rememberUpgrade: true,
    });

    this.socket.on('connect', () => {
      logger.info('Socket.io connected');
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.socket?.emit('authenticate', { creatorId });
      this.connectionStateCallback?.(true);
      this.startHeartbeat();
    });

    this.socket.on('authenticated', (data: { creatorId: string }) => {
      logger.info('Socket.io authenticated', data);
      this.emit('authenticated', data);
    });

    this.socket.on('error', (data: { message?: string; code?: string }) => {
      logger.error('Socket.io server error', data);
      this.emit('error', { message: data?.message ?? 'Unknown error', code: data?.code });
    });

    this.socket.on('payment:received', (data: PaymentReceivedPayload) => {
      this.emit('payment:received', data);
    });

    this.socket.on('payments:batch', (data: PaymentsBatchPayload) => {
      this.emit('payments:batch', data);
    });

    this.socket.on('payment:confirmed', (data: PaymentConfirmedPayload) => {
      this.emit('payment:confirmed', data);
    });

    this.socket.on('balance:update', (data: BalanceUpdatePayload) => {
      this.emit('balance:update', data);
    });

    this.socket.on('withdrawal:status', (data: WithdrawalStatusPayload) => {
      this.emit('withdrawal:status', data);
    });

    this.socket.on('disconnect', (reason) => {
      logger.info('Socket.io disconnected', { reason });
      this.connectionStateCallback?.(false);
      if (this.creatorId && reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (err) => {
      logger.error('Socket.io connect_error', err);
      this.connectionStateCallback?.(false);
      if (this.creatorId) {
        this.scheduleReconnect();
      }
    });
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, CLIENT_HEARTBEAT_INTERVAL_MS);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.creatorId) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.warn('Socket.io max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
      MAX_RECONNECT_DELAY_MS
    );
    logger.info(`Socket.io reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.creatorId) this.connect(this.creatorId);
    }, delay);
  }

  on(event: LiveEventType, callback: LiveEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: LiveEventType, callback: LiveEventHandler): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: LiveEventType, payload: unknown): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        (cb as (p: unknown) => void)(payload);
      } catch (e) {
        logger.error('Socket.io handler error', e);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearHeartbeat();
    this.reconnectAttempts = 0;
    this.creatorId = null;
    this.connectionStateCallback?.(false);
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    logger.info('Socket.io client disconnected');
  }
}

export const liveSocket = new SocketIOClient();
