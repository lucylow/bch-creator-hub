import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { liveSocket } from '@/lib/web3/api/socketio';
import type {
  PaymentReceivedPayload,
  PaymentsBatchPayload,
  PaymentConfirmedPayload,
  BalanceUpdatePayload,
  WithdrawalStatusPayload,
} from '@/lib/web3/api/socketio';
import { useCreator } from '@/contexts/CreatorContext';

type LiveTransactionsContextValue = {
  isConnected: boolean;
  onPaymentReceived: (cb: (payload: PaymentReceivedPayload) => void) => () => void;
  onPaymentsBatch: (cb: (payload: PaymentsBatchPayload) => void) => () => void;
  onPaymentConfirmed: (cb: (payload: PaymentConfirmedPayload) => void) => () => void;
  onBalanceUpdate: (cb: (payload: BalanceUpdatePayload) => void) => () => void;
  onWithdrawalStatus: (cb: (payload: WithdrawalStatusPayload) => void) => () => void;
};

const LiveTransactionsContext = createContext<LiveTransactionsContextValue | undefined>(undefined);

export function useLiveTransactions(): LiveTransactionsContextValue {
  const ctx = useContext(LiveTransactionsContext);
  if (ctx === undefined) {
    throw new Error('useLiveTransactions must be used within LiveTransactionsProvider');
  }
  return ctx;
}

type LiveTransactionsProviderProps = {
  children: ReactNode;
  creatorId: string | null;
};

/**
 * Provides WebSocket-based live transaction notifications for the current creator.
 * Connects when creatorId is set, disconnects when it is cleared.
 * Must be rendered inside CreatorProvider (or receive creatorId from somewhere).
 */
export function LiveTransactionsProvider({ children, creatorId }: LiveTransactionsProviderProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    liveSocket.setConnectionStateCallback(setIsConnected);
    return () => liveSocket.setConnectionStateCallback(null);
  }, []);

  useEffect(() => {
    if (creatorId && creatorId.trim().length === 16) {
      liveSocket.connect(creatorId);
    } else {
      liveSocket.disconnect();
    }
    return () => {
      liveSocket.disconnect();
    };
  }, [creatorId]);

  const onPaymentReceived = useCallback((cb: (payload: PaymentReceivedPayload) => void) => {
    return liveSocket.on('payment:received', cb);
  }, []);

  const onPaymentConfirmed = useCallback((cb: (payload: PaymentConfirmedPayload) => void) => {
    return liveSocket.on('payment:confirmed', cb);
  }, []);

  const onBalanceUpdate = useCallback((cb: (payload: BalanceUpdatePayload) => void) => {
    return liveSocket.on('balance:update', cb);
  }, []);

  const onWithdrawalStatus = useCallback((cb: (payload: WithdrawalStatusPayload) => void) => {
    return liveSocket.on('withdrawal:status', cb);
  }, []);

  const value = useMemo<LiveTransactionsContextValue>(
    () => ({
      isConnected,
      onPaymentReceived,
      onPaymentsBatch,
      onPaymentConfirmed,
      onBalanceUpdate,
      onWithdrawalStatus,
    }),
    [isConnected, onPaymentReceived, onPaymentConfirmed, onBalanceUpdate, onWithdrawalStatus]
  );

  return (
    <LiveTransactionsContext.Provider value={value}>
      {children}
    </LiveTransactionsContext.Provider>
  );
}

/**
 * Wrapper that provides live transactions using the current creator from CreatorContext.
 * Use this inside CreatorProvider when you want creatorId to be inferred automatically.
 */
export function LiveTransactionsProviderFromCreator({ children }: { children: ReactNode }) {
  const { creator } = useCreator();
  const creatorId = creator?.id ?? null;
  return <LiveTransactionsProvider creatorId={creatorId}>{children}</LiveTransactionsProvider>;
}
