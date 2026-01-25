// Hook for payment operations
import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { API } from '../api/client';
import { toast } from 'sonner';

const defaultTxSize = { inputs: 1, outputs: 2, overhead: 10 };
const bytesPerInput = 148;
const bytesPerOutput = 34;
const defaultFeePerByte = 1.0;

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

      const intent = intentRes.data as { contractAddress?: string; creatorAddress?: string; contentId?: string };
      
      // Send payment to creator's contract
      const result = await sendPayment(intent.contractAddress || intent.creatorAddress || '', amountSatoshis, JSON.stringify({
        type: 'content_unlock',
        intentId: paymentIntentId,
        contentId: intent.contentId || '',
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
    const estimatedSize = numInputs * bytesPerInput + numOutputs * bytesPerOutput + defaultTxSize.overhead;
    const fee = Math.ceil(estimatedSize * defaultFeePerByte);
    const safeAmount = Math.max(amountSatoshis, 1);
    return {
      satoshis: fee,
      percentage: ((fee / safeAmount) * 100).toFixed(2),
    };
  }, []);

  /** Fetch fee estimate from backend when API is available (public endpoint, no auth). */
  const estimateFeeFromServer = useCallback(
    async (amountSatoshis: number, numInputs = 1, numOutputs = 2): Promise<{ satoshis: number; percentage: string } | null> => {
      try {
        const params = new URLSearchParams({
          numInputs: String(numInputs),
          numOutputs: String(numOutputs),
          amountSats: String(amountSatoshis),
        });
        const res = await API.get<{ sats: number; feePerByte?: number; size?: number }>(
          `payments/fee/estimate?${params}`
        );
        if (res.success && res.data && typeof (res.data as { sats?: number }).sats === 'number') {
          const d = res.data as { sats: number };
          const safeAmount = Math.max(amountSatoshis, 1);
          return {
            satoshis: d.sats,
            percentage: ((d.sats / safeAmount) * 100).toFixed(2),
          };
        }
      } catch {
        // ignore; caller falls back to local estimate
      }
      return null;
    },
    []
  );

  return {
    sendTip,
    unlockContent,
    purchaseSubscription,
    estimateFee,
    estimateFeeFromServer,
    isProcessing,
  };
};


