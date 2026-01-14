import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

interface WalletContextType {
  isConnected: boolean;
  address: string;
  balance: WalletBalance;
  isLoading: boolean;
  connect: (walletType?: string) => Promise<void>;
  disconnect: () => void;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    const savedAddress = localStorage.getItem('wallet_address');
    const token = localStorage.getItem('auth_token');
    
    if (savedAddress && token) {
      setAddress(savedAddress);
      setIsConnected(true);
      fetchBalance(savedAddress);
    }
    setIsLoading(false);
  };

  const fetchBalance = async (addr: string) => {
    // Mock balance for demo
    setBalance({ confirmed: 125000000, unconfirmed: 5000000, total: 130000000 });
  };

  const connect = async (walletType = 'generic') => {
    try {
      setIsLoading(true);
      
      // Demo: Generate mock address
      const mockAddress = 'bitcoincash:qpaq9sh8w7xs5qn4q9c3l8f9k2d4q7s8vga9mpt2vh';
      const mockToken = 'demo_token_' + Date.now();
      
      localStorage.setItem('wallet_address', mockAddress);
      localStorage.setItem('auth_token', mockToken);
      
      setAddress(mockAddress);
      setIsConnected(true);
      await fetchBalance(mockAddress);
      
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = useCallback(() => {
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('auth_token');
    setIsConnected(false);
    setAddress('');
    setBalance({ confirmed: 0, unconfirmed: 0, total: 0 });
    toast.success('Wallet disconnected');
  }, []);

  const refreshBalance = async () => {
    if (address) {
      await fetchBalance(address);
    }
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      address,
      balance,
      isLoading,
      connect,
      disconnect,
      refreshBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
