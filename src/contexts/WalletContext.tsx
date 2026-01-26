import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { toast } from 'sonner';
import { walletService } from '@/services/walletService';
import { apiService } from '@/services/api';
import { logger } from '@/utils/logger';
import { getUserFriendlyMessage } from '@/utils/errorUtils';
import { isDemoMode } from '@/config/demo';
import { bchProvider } from '@/lib/web3/providers/BCHProvider';

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

interface WalletContextType {
  isConnected: boolean;
  address: string;
  balance: WalletBalance;
  /** Last error from fetchBalance/refreshBalance, cleared on next success */
  balanceError: string | null;
  availableWallets: string[];
  isLoading: boolean;
  walletType?: string;
  connect: (walletType?: string) => Promise<{ success: boolean; address?: string; error?: string }>;
  disconnect: () => void;
  sendPayment: (toAddress: string, amountSats: number, payload?: string) => Promise<{ success: boolean; txid?: string; error?: string }>;
  fetchBalance: (addr: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<WalletBalance>({ confirmed: 0, unconfirmed: 0, total: 0 });
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletType, setWalletType] = useState<string | undefined>();

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      setBalanceError(null);
      const bal = await walletService.getBalance(addr);
      setBalance({
        confirmed: bal.confirmed,
        unconfirmed: bal.unconfirmed,
        total: bal.total ?? bal.confirmed + bal.unconfirmed
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to fetch balance', err, { address: addr });
      setBalanceError(getUserFriendlyMessage(error, 'Could not load balance'));
    }
  }, []);

  const checkConnection = useCallback(() => {
    const savedAddress = localStorage.getItem('wallet_address');
    const token = localStorage.getItem('auth_token');
    const savedState = localStorage.getItem('bch_wallet_state');
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.walletType) {
          setWalletType(state.walletType);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    if (savedAddress && token) {
      setAddress(savedAddress);
      setIsConnected(true);
      fetchBalance(savedAddress);
    }
    setIsLoading(false);
  }, [fetchBalance]);

  const connect = useCallback(async (walletType = 'generic'): Promise<{ success: boolean; address?: string; error?: string }> => {
    try {
      setIsLoading(true);
      
      const result = await walletService.connectWallet(walletType);
      
      if (result.success && result.address && result.signature && result.message) {
        setWalletType(walletType);
        const persistState = () => {
          try {
            localStorage.setItem('bch_wallet_state', JSON.stringify({
              address: result.address,
              walletType,
              connected: true,
              timestamp: Date.now()
            }));
          } catch (e) {
            logger.warn('Could not persist wallet state', e);
          }
        };

        const isUsingMockData = result.signature.startsWith('demo_signature_') || walletType === 'demo';
        
        if (isUsingMockData || isDemoMode()) {
          setAddress(result.address);
          setIsConnected(true);
          localStorage.setItem('wallet_address', result.address);
          localStorage.setItem('auth_token', 'demo_token_' + btoa(result.address));
          persistState();
          await fetchBalance(result.address);
          toast.success('Wallet connected (using demo data)');
          return { success: true, address: result.address };
        }
        
        try {
          const authRes = await apiService.authenticateWallet({
            address: result.address,
            signature: result.signature,
            message: result.message,
          });
          
          if (authRes.success && authRes.data?.token) {
            setAddress(result.address);
            setIsConnected(true);
            localStorage.setItem('wallet_address', result.address);
            persistState();
            await fetchBalance(result.address);
            toast.success('Wallet connected successfully!');
            return { success: true, address: result.address };
          } else {
            throw new Error(authRes.error || 'Authentication failed');
          }
        } catch (authError) {
          logger.warn('Backend authentication failed, using mock data mode', authError);
          setAddress(result.address);
          setIsConnected(true);
          localStorage.setItem('wallet_address', result.address);
          localStorage.setItem('auth_token', 'demo_token_' + btoa(result.address));
          persistState();
          await fetchBalance(result.address);
          toast.success('Wallet connected (using demo data)');
          return { success: true, address: result.address };
        }
      }
      
      throw new Error(result.error || 'Authentication failed');
      
    } catch (error) {
      const errorMessage = getUserFriendlyMessage(error, 'Failed to connect wallet');
      logger.error('Wallet connection failed', error instanceof Error ? error : new Error(errorMessage), { walletType });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance]);

  useEffect(() => {
    // Initialize wallet detection
    const initializeWallets = async () => {
      // Refresh available wallets
      const wallets = walletService.getAvailableWallets();
      setAvailableWallets(wallets);
      
      // Check for saved connection and attempt auto-reconnect
      const savedState = localStorage.getItem('bch_wallet_state');
      if (savedState && !isDemoMode()) {
        try {
          const state = JSON.parse(savedState);
          if (state.walletType && state.address) {
            // Verify wallet is still available before auto-connecting
            if (wallets.includes(state.walletType) || state.walletType === 'generic') {
              setIsLoading(true);
              const result = await connect(state.walletType);
              if (result.success) {
                // Successfully reconnected
                logger.info('Auto-reconnected to wallet', { walletType: state.walletType });
              } else {
                // Clear invalid state
                localStorage.removeItem('bch_wallet_state');
                localStorage.removeItem('wallet_address');
                localStorage.removeItem('auth_token');
              }
            } else {
              // Wallet no longer available, clear state
              localStorage.removeItem('bch_wallet_state');
            }
          }
        } catch (error) {
          logger.error('Auto-reconnect failed', error instanceof Error ? error : new Error(String(error)));
          localStorage.removeItem('bch_wallet_state');
        } finally {
          setIsLoading(false);
        }
      } else {
        // Fallback to old connection check
        checkConnection();
        setIsLoading(false);
      }
    };

    initializeWallets();

    // Listen for account changes
    const handleAccountChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newAddress = customEvent.detail;
      if (newAddress && newAddress !== address) {
        setAddress(newAddress);
        localStorage.setItem('wallet_address', newAddress);
        fetchBalance(newAddress);
        toast.info('Wallet account changed');
      }
    };

    // Listen for wallet disconnection
    const handleDisconnect = () => {
      setAddress('');
      setIsConnected(false);
      setBalance({ confirmed: 0, unconfirmed: 0, total: 0 });
    };

    // Listen for balance updates
    const handleBalanceUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setBalance({
          confirmed: customEvent.detail.confirmed || 0,
          unconfirmed: customEvent.detail.unconfirmed || 0,
          total: customEvent.detail.total || 0
        });
      }
    };

    window.addEventListener('walletAccountChanged', handleAccountChange);
    window.addEventListener('walletDisconnected', handleDisconnect);
    
    // Set up periodic balance refresh if connected
    const balanceInterval = setInterval(() => {
      if (isConnected && address) {
        fetchBalance(address);
      }
    }, 30000); // Refresh every 30 seconds

    return () => {
      window.removeEventListener('walletAccountChanged', handleAccountChange);
      window.removeEventListener('walletDisconnected', handleDisconnect);
      clearInterval(balanceInterval);
    };
  }, [checkConnection, fetchBalance, address, isConnected, connect]);

  const disconnect = useCallback(() => {
    setAddress('');
    setIsConnected(false);
    setBalance({ confirmed: 0, unconfirmed: 0, total: 0 });
    setWalletType(undefined);
    
    // Clear all wallet-related storage
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('bch_wallet_state');
    
    // Also disconnect from BCH provider
    try {
      bchProvider.disconnect();
    } catch (error) {
      // Provider disconnect may fail, ignore
      logger.warn('BCH provider disconnect error', { message: error instanceof Error ? error.message : String(error) });
    }
    
    toast.success('Wallet disconnected');
  }, []);

  const sendPayment = useCallback(async (toAddress: string, amountSats: number, payload?: string) => {
    try {
      const result = await walletService.sendPayment(toAddress, amountSats, payload);
      
      if (result.success) {
        // Update balance
        await fetchBalance(address);
        return result;
      }
      
      throw new Error(result.error || 'Payment failed');
    } catch (error) {
      const message = getUserFriendlyMessage(error, 'Payment failed');
      logger.error('Payment error', error instanceof Error ? error : new Error(message), { toAddress, amountSats });
      throw error;
    }
  }, [address, fetchBalance]);

  const refreshBalance = useCallback(async () => {
    if (address) {
      await fetchBalance(address);
    }
  }, [address, fetchBalance]);

  const value = useMemo(() => ({
    isConnected,
    address,
    balance,
    balanceError,
    availableWallets,
    isLoading,
    walletType,
    connect,
    disconnect,
    sendPayment,
    fetchBalance,
    refreshBalance
  }), [
    isConnected,
    address,
    balance,
    balanceError,
    availableWallets,
    isLoading,
    walletType,
    connect,
    disconnect,
    sendPayment,
    fetchBalance,
    refreshBalance
  ]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
