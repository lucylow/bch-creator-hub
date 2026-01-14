import { logger } from '@/utils/logger';

// WebSocket client for real-time updates
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(token: string): void {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const url = `${wsUrl}?token=${token}`;
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        logger.info('WebSocket connected');
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type: string; payload: unknown };
          this.emit(data.type, data.payload);
        } catch (error) {
          logger.error('WebSocket message error', error instanceof Error ? error : new Error(String(error)));
        }
      };
      
      this.ws.onerror = () => {
        logger.error('WebSocket error occurred');
      };
      
      this.ws.onclose = () => {
        logger.info('WebSocket disconnected');
        this.attemptReconnect(token);
      };
    } catch (error) {
      logger.error('WebSocket connection error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback);
    }
  }

  private emit(event: string, data: unknown): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => {
        callback(data);
      });
    }
  }

  send(type: string, payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      logger.info(`Reconnecting in ${delay}ms...`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect(token);
      }, delay);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }
}

export const wsClient = new WebSocketClient();
