import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';

interface Creator {
  id: string;
  displayName: string;
  bio: string;
  address: string;
  contractAddress: string;
  avatarUrl?: string;
  createdAt: string;
}

interface CreatorContextType {
  creator: Creator | null;
  isLoading: boolean;
  refreshCreator: () => Promise<void>;
  updateCreator: (data: Partial<Creator>) => Promise<void>;
}

const CreatorContext = createContext<CreatorContextType | undefined>(undefined);

export const useCreator = () => {
  const context = useContext(CreatorContext);
  if (!context) {
    throw new Error('useCreator must be used within CreatorProvider');
  }
  return context;
};

export const CreatorProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, address } = useWallet();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadCreator();
    } else {
      setCreator(null);
    }
  }, [isConnected, address]);

  const loadCreator = async () => {
    setIsLoading(true);
    // Demo creator data
    setTimeout(() => {
      setCreator({
        id: 'creator_1',
        displayName: 'Demo Creator',
        bio: 'Building the future of creator monetization',
        address: address,
        contractAddress: 'bitcoincash:qpz9sh8w7xs5qn4q9c3l8f9k2d4q7s8vga9mpt2vh',
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 500);
  };

  const refreshCreator = async () => {
    await loadCreator();
  };

  const updateCreator = async (data: Partial<Creator>) => {
    if (creator) {
      setCreator({ ...creator, ...data });
    }
  };

  return (
    <CreatorContext.Provider value={{
      creator,
      isLoading,
      refreshCreator,
      updateCreator,
    }}>
      {children}
    </CreatorContext.Provider>
  );
};
