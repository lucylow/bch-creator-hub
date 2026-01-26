// Hook for contract operations
import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { API } from '../api/client';
import { toast } from 'sonner';
import { getUserFriendlyMessage } from '@/utils/errorUtils';
import { logger } from '@/utils/logger';

export const useContracts = () => {
  const { isConnected, address } = useWallet();
  const [deploying, setDeploying] = useState(false);
  const [interacting, setInteracting] = useState(false);

  const deployContract = useCallback(async (contractType: string, params: Record<string, unknown>) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setDeploying(true);
    
    try {
      const response = await API.post('/contracts/deploy', {
        contractType,
        params,
        creatorAddress: address
      });

      if (!response.success) {
        throw new Error(response.error || 'Contract deployment failed');
      }

      return response.data;
      
    } catch (error) {
      const msg = getUserFriendlyMessage(error, 'Contract deployment failed');
      logger.error('Contract deployment failed', error instanceof Error ? error : new Error(String(error)), { contractType });
      toast.error(msg);
      throw error;
    } finally {
      setDeploying(false);
    }
  }, [isConnected, address]);

  const callContract = useCallback(async (contractAddress: string, functionName: string, params: unknown[] = []) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setInteracting(true);
    
    try {
      const response = await API.post(`/contracts/${contractAddress}/call`, {
        functionName,
        params
      });

      if (!response.success) {
        throw new Error(response.error || 'Contract call failed');
      }

      return response.data;
      
    } catch (error) {
      const msg = getUserFriendlyMessage(error, 'Contract call failed');
      logger.error('Contract call failed', error instanceof Error ? error : new Error(String(error)), { contractAddress, functionName });
      toast.error(msg);
      throw error;
    } finally {
      setInteracting(false);
    }
  }, [isConnected]);

  const getContractInfo = useCallback(async (contractAddress: string) => {
    try {
      const response = await API.get(`/contracts/${contractAddress}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Contract not found');
    } catch (error) {
      const msg = getUserFriendlyMessage(error, 'Failed to get contract info');
      logger.error('Failed to get contract info', error instanceof Error ? error : new Error(String(error)), { contractAddress });
      toast.error(msg);
      throw error;
    }
  }, []);

  const verifyContract = useCallback(async (contractAddress: string, expectedType: string) => {
    try {
      const response = await API.post('/contracts/verify', {
        address: contractAddress,
        expectedType
      });

      return response.success;
      
    } catch (error) {
      logger.error('Contract verification failed', error instanceof Error ? error : new Error(String(error)), { contractAddress, expectedType });
      return false;
    }
  }, []);

  return {
    deployContract,
    callContract,
    getContractInfo,
    verifyContract,
    deploying,
    interacting
  };
};


