import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { toast } from 'sonner';
import { useWallet } from './WalletContext';
import { apiService } from '@/services/api';
import type { Creator } from '@/types/api';
import { logger } from '@/utils/logger';
import { getUserFriendlyMessage } from '@/utils/errorUtils';

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

// Helper to transform backend creator object (snake_case) to frontend format (camelCase)
const transformCreator = (backendCreator: any): Creator | null => {
  if (!backendCreator) return null;
  
  // Handle both snake_case and camelCase formats
  return {
    id: backendCreator.creator_id || backendCreator.id || '',
    creatorId: backendCreator.creator_id || backendCreator.creatorId || '',
    address: backendCreator.wallet_address || backendCreator.address || '',
    displayName: backendCreator.display_name || backendCreator.displayName,
    email: backendCreator.email,
    avatarUrl: backendCreator.avatar_url || backendCreator.avatarUrl,
    bio: backendCreator.bio || '',
    website: backendCreator.website,
    twitterHandle: backendCreator.twitter_handle || backendCreator.twitterHandle,
    contractAddress: backendCreator.contract_address || backendCreator.contractAddress,
    feeBasisPoints: backendCreator.fee_basis_points || backendCreator.feeBasisPoints || 100,
    isVerified: backendCreator.is_verified || backendCreator.isVerified || false,
    balance: backendCreator.balance,
    stats: backendCreator.stats,
    createdAt: backendCreator.created_at || backendCreator.createdAt || new Date().toISOString(),
    lastLogin: backendCreator.last_login || backendCreator.lastLogin,
  };
};

export const CreatorProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, address } = useWallet();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCreator = useCallback(async () => {
    if (!isConnected || !address) {
      setCreator(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getCreatorProfile();
      
      if (response.success && response.data) {
        const transformedCreator = transformCreator(response.data);
        setCreator(transformedCreator);
      } else {
        logger.error('Failed to load creator profile', new Error(response.error || 'Unknown error'));
        setCreator(null);
      }
    } catch (error) {
      logger.error('Error loading creator profile', error instanceof Error ? error : new Error(String(error)));
      setCreator(null);
      toast.error(getUserFriendlyMessage(error, 'Failed to load creator profile'));
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    loadCreator();
  }, [loadCreator]);

  const refreshCreator = useCallback(async () => {
    await loadCreator();
  }, [loadCreator]);

  const updateCreator = useCallback(async (data: Partial<Creator>) => {
    if (!creator) return;

    try {
      // Map camelCase to backend format
      const updateData: any = {};
      if (data.displayName !== undefined) updateData.displayName = data.displayName;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.website !== undefined) updateData.website = data.website;
      if (data.twitterHandle !== undefined) updateData.twitterHandle = data.twitterHandle;

      const response = await apiService.updateCreatorProfile(updateData);
      
      if (response.success && response.data) {
        const transformedCreator = transformCreator(response.data);
        setCreator(transformedCreator);
        toast.success('Profile updated successfully');
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      logger.error('Error updating creator profile', error instanceof Error ? error : new Error(String(error)));
      toast.error(getUserFriendlyMessage(error, 'Failed to update profile'));
      throw error;
    }
  }, [creator]);

  const value = useMemo(() => ({
    creator,
    isLoading,
    refreshCreator,
    updateCreator,
  }), [creator, isLoading, refreshCreator, updateCreator]);

  return (
    <CreatorContext.Provider value={value}>
      {children}
    </CreatorContext.Provider>
  );
};
