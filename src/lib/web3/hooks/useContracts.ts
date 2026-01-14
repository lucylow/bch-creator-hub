// Hook for contract operations
import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { API } from '../api/client';
import { toast } from 'sonner';

export const useContracts = () => {
  const { isConnected, address } = useWallet();
  const [deploying, setDeploying] = useState(false);
  const [interacting, setInteracting] = useState(false);

  const deployContract = useCallback(async (contractType: string, params: Record<string, any>) => {
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
      toast.error(error instanceof Error ? error.message : 'Contract deployment failed');
      throw error;
    } finally {
      setDeploying(false);
    }
  }, [isConnected, address]);

  const callContract = useCallback(async (contractAddress: string, functionName: string, params: any[] = []) => {
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
      toast.error(error instanceof Error ? error.message : 'Contract call failed');
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
      toast.error(error instanceof Error ? error.message : 'Failed to get contract info');
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
      console.error('Contract verification error:', error);
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

