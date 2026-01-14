// Hook for payment operations
import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { API } from '../api/client';
import { toast } from 'sonner';

export const usePayments = () => {
  const { isConnected, address, sendPayment } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const sendTip = useCallback(async (creatorAddress: string, amountSatoshis: number, metadata: Record<string, any> = {}) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);
    
    try {
      const result = await sendPayment(creatorAddress, amountSatoshis, JSON.stringify({
        type: 'tip',
        metadata,
        timestamp: Date.now()
      }));

      return result;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tip failed');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected, sendPayment]);

  const unlockContent = useCallback(async (paymentIntentId: string, amountSatoshis: number) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);
    
    try {
      // Get payment intent details
      const intentRes = await API.get(`/payment-intents/${paymentIntentId}`);
      
      if (!intentRes.success || !intentRes.data) {
        throw new Error('Payment intent not found');
      }

      const intent = intentRes.data;
      
      // Send payment to creator's contract
      const result = await sendPayment(intent.contractAddress || intent.creatorAddress, amountSatoshis, JSON.stringify({
        type: 'content_unlock',
        intentId: paymentIntentId,
        contentId: intent.contentId,
        timestamp: Date.now()
      }));

      // Update payment intent status
      await API.post(`/payment-intents/${paymentIntentId}/complete`, {
        txid: result.txid,
        amountSatoshis
      });

      return result;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Content unlock failed');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected, sendPayment]);

  const purchaseSubscription = useCallback(async (subscriptionContractAddress: string, amountSatoshis: number, periods = 1) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);
    
    try {
      const result = await sendPayment(subscriptionContractAddress, amountSatoshis, JSON.stringify({
        type: 'subscription_purchase',
        periods,
        timestamp: Date.now()
      }));

      return result;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Subscription purchase failed');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected, sendPayment]);

  const estimateFee = useCallback((amountSatoshis: number, numInputs = 1, numOutputs = 2) => {
    // Simple fee estimation
    const typicalTxSize = 226;
    const estimatedSize = (numInputs * 148) + (numOutputs * 34) + 10;
    const feePerByte = 1.0; // satoshis per byte
    const fee = Math.ceil(estimatedSize * feePerByte);
    
    return {
      satoshis: fee,
      percentage: ((fee / amountSatoshis) * 100).toFixed(2)
    };
  }, []);

  return {
    sendTip,
    unlockContent,
    purchaseSubscription,
    estimateFee,
    isProcessing
  };
};

