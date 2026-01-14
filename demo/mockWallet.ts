/**
 * Demo Wallet Adapter
 * 
 * Provides a mock wallet interface that works without real wallet connections.
 * Used when DEMO_MODE is enabled.
 */
import { ADDRESSES } from './mockAddresses';
import { getBalanceForAddress } from './mockUtxos';
import { getUTXOsForAddress } from './mockUtxos';

export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  signature?: string;
  message?: string;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  txid?: string;
  error?: string;
}

export interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

/**
 * Demo wallet implementation
 * Uses mock addresses and deterministic responses
 */
export const demoWallet = {
  address: ADDRESSES.userLucy,

  /**
   * Connect to demo wallet
   */
  async connect(): Promise<WalletConnectionResult> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const message = `Sign this message to authenticate with BCH Creator Hub\nTimestamp: ${Date.now()}`;
    const signature = `demo_signature_${btoa(message)}`;
    
    return {
      success: true,
      address: this.address,
      signature,
      message,
    };
  },

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    return `demo_signature_${btoa(message)}`;
  },

  /**
   * Send a payment (mock)
   */
  async sendPayment(to: string, amount: number, payload?: string): Promise<PaymentResult> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const txid = `demo_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      txid,
    };
  },

  /**
   * Get balance for an address
   */
  async getBalance(address: string): Promise<WalletBalance> {
    const balance = getBalanceForAddress(address);
    return {
      confirmed: balance,
      unconfirmed: 0,
      total: balance,
    };
  },

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string) {
    return getUTXOsForAddress(address);
  },

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    // No-op in demo mode
  },
};

/**
 * Switch demo wallet to a different address
 */
export function switchDemoWallet(address: string): void {
  demoWallet.address = address;
}


