import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { toast } from 'sonner';
import { walletService } from '@/services/walletService';
import { apiService } from '@/services/api';
import { logger } from '@/utils/logger';
import { isDemoMode } from '@/config/demo';

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

interface WalletContextType {
  isConnected: boolean;
  address: string;
  balance: WalletBalance;
  availableWallets: string[];
  isLoading: boolean;
  connect: (walletType?: string) => Promise<{ success: boolean; address?: string; error?: string }>;
  disconnect: () => void;
  sendPayment: (toAddress: string, amountSats: number, payload?: string) => Promise<any>;
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
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      const bal = await walletService.getBalance(addr);
      setBalance({
        confirmed: bal.confirmed,
        unconfirmed: bal.unconfirmed,
        total: bal.total || bal.confirmed + bal.unconfirmed
      });
    } catch (error) {
      logger.error('Failed to fetch balance', error instanceof Error ? error : new Error(String(error)), { address: addr });
    }
  }, []);

  const checkConnection = useCallback(() => {
    const savedAddress = localStorage.getItem('wallet_address');
    const token = localStorage.getItem('auth_token');
    
    if (savedAddress && token) {
      setAddress(savedAddress);
      setIsConnected(true);
      fetchBalance(savedAddress);
    }
    setIsLoading(false);
  }, [fetchBalance]);

  useEffect(() => {
    checkConnection();
    setAvailableWallets(walletService.getAvailableWallets());

    // Listen for account changes
    const handleAccountChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newAddress = customEvent.detail;
      setAddress(newAddress);
      localStorage.setItem('wallet_address', newAddress);
      fetchBalance(newAddress);
      toast.info('Wallet account changed');
    };

    window.addEventListener('walletAccountChanged', handleAccountChange);

    return () => {
      window.removeEventListener('walletAccountChanged', handleAccountChange);
    };
  }, [checkConnection, fetchBalance]);

  const connect = async (walletType = 'generic'): Promise<{ success: boolean; address?: string; error?: string }> => {
    try {
      setIsLoading(true);
      
      const result = await walletService.connectWallet(walletType);
      
      if (result.success && result.address && result.signature && result.message) {
        // In demo mode, skip backend authentication and use mock token
        if (isDemoMode()) {
          setAddress(result.address);
          setIsConnected(true);
          localStorage.setItem('wallet_address', result.address);
          localStorage.setItem('auth_token', 'demo_token_' + btoa(result.address));
          
          await fetchBalance(result.address);
          
          toast.success('Demo wallet connected successfully!');
          return { success: true, address: result.address };
        }
        
        // Real mode: Authenticate with backend
        const authRes = await apiService.authenticateWallet({
          address: result.address,
          signature: result.signature,
          message: result.message,
        });
        
        if (authRes.success && authRes.data?.token) {
          setAddress(result.address);
          setIsConnected(true);
          localStorage.setItem('wallet_address', result.address);
          
          await fetchBalance(result.address);
          
          toast.success('Wallet connected successfully!');
          return { success: true, address: result.address };
        } else {
          throw new Error(authRes.error || 'Authentication failed');
        }
      }
      
      throw new Error(result.error || 'Authentication failed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      logger.error('Wallet connection failed', error instanceof Error ? error : new Error(errorMessage), { walletType });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = useCallback(() => {
    setAddress('');
    setIsConnected(false);
    setBalance({ confirmed: 0, unconfirmed: 0, total: 0 });
    
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('auth_token');
    
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
      logger.error('Payment error', error instanceof Error ? error : new Error(String(error)), { toAddress, amountSats });
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
    availableWallets,
    isLoading,
    connect,
    disconnect,
    sendPayment,
    fetchBalance,
    refreshBalance
  }), [
    isConnected,
    address,
    balance,
    availableWallets,
    isLoading,
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
