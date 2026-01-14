import { isDemoMode } from '@/config/demo';
import { demoWallet } from '@/demo';
import { logger } from '@/utils/logger';
import { bchProvider } from '@/lib/web3/providers/BCHProvider';

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
  total?: number;
}

// Declare global window interface for wallet providers
declare global {
  interface Window {
    paytaca?: {
      getAccounts?: () => Promise<string[]>;
      signMessage?: (address: string, message: string, format?: string) => Promise<string>;
      sendTransaction?: (tx: any) => Promise<string>;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, handler: (data: any) => void) => void;
      isConnected?: () => boolean;
    };
    electronCash?: {
      requestDevice?: () => Promise<any>;
    };
    bitcoinCash?: {
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      signMessage?: (address: string, message: string, format?: string) => Promise<string>;
      sendTransaction?: (tx: any) => Promise<string>;
      getAccounts?: () => Promise<string[]>;
    };
    libauth?: {
      sign?: (message: string, address: string) => Promise<string>;
      requestAccounts?: () => Promise<string[]>;
    };
  }
}

interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  supportsBIP322: boolean;
  available: boolean;
  downloadUrl?: string;
}

class WalletService {
  private generateAuthMessage(address: string): string {
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    return `Sign this message to authenticate with BCH Creator Hub\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any fees.`;
  }

  async getBalance(address: string): Promise<WalletBalance> {
    // Use demo wallet if demo mode is enabled
    if (isDemoMode()) {
      return demoWallet.getBalance(address);
    }

    try {
      // Try using BCH provider first
      try {
        const balance = await bchProvider.getBalance(address);
        if (balance && balance.total >= 0) {
          return balance;
        }
      } catch (providerError) {
        logger.warn('BCH provider balance check failed, trying API', providerError);
      }

      // Fallback to API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wallet/balance/${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      return {
        confirmed: data.confirmed || 0,
        unconfirmed: data.unconfirmed || 0,
        total: (data.confirmed || 0) + (data.unconfirmed || 0)
      };
    } catch (error) {
      logger.error('Balance fetch error', error instanceof Error ? error : new Error(String(error)), { address });
      // Return zero balance on error
      return { confirmed: 0, unconfirmed: 0, total: 0 };
    }
  }

  async connectWallet(walletType: string = 'generic'): Promise<WalletConnectionResult> {
    // Use demo wallet if demo mode is enabled
    if (isDemoMode()) {
      return demoWallet.connect();
    }

    try {
      // Check if wallet is available
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection not available in this environment');
      }

      // Use BCH provider for connection
      try {
        const walletData = await bchProvider.connectWallet(walletType);
        
        if (walletData && walletData.address) {
          // Generate authentication message
          const message = this.generateAuthMessage(walletData.address);
          
          // Sign message for authentication
          let signature: string;
          const wallets = await bchProvider.checkWalletInjection();
          const wallet = wallets[walletType];
          
          if (wallet && wallet.supportsBIP322) {
            try {
              // Try BIP-322 signing
              signature = await this.signMessageBIP322(walletData.address, message, wallet.instance);
            } catch (bipError) {
              logger.warn('BIP-322 signing failed, falling back to legacy', bipError);
              signature = await this.signMessageLegacy(walletData.address, message, wallet.instance);
            }
          } else {
            signature = await this.signMessageLegacy(walletData.address, message, wallet?.instance);
          }
          
          return {
            success: true,
            address: walletData.address,
            signature,
            message
          };
        }
        
        throw new Error('Failed to get address from wallet');
      } catch (providerError) {
        // Fallback to direct wallet connection
        return await this.connectWalletDirect(walletType);
      }
    } catch (error) {
      logger.error('Wallet connection error', error instanceof Error ? error : new Error(String(error)), { walletType });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async connectWalletDirect(walletType: string): Promise<WalletConnectionResult> {
    const win = window as any;
    let address: string;
    
    try {
      switch (walletType) {
        case 'paytaca':
          if (!win.paytaca) {
            throw new Error('Paytaca wallet not detected. Please install the Paytaca browser extension.');
          }
          
          // Paytaca connection
          if (win.paytaca.getAccounts) {
            const accounts = await win.paytaca.getAccounts();
            address = Array.isArray(accounts) ? accounts[0] : accounts;
          } else if (win.paytaca.request) {
            const accounts = await win.paytaca.request({ method: 'bch_requestAccounts' });
            address = Array.isArray(accounts) ? accounts[0] : accounts;
          } else {
            throw new Error('Paytaca wallet does not support connection');
          }
          break;
          
        case 'electron-cash':
          if (!win.electronCash) {
            throw new Error('Electron Cash not detected');
          }
          
          const device = await win.electronCash.requestDevice();
          await device.open();
          const ecAccounts = await device.getAccounts();
          address = ecAccounts[0]?.address || ecAccounts[0];
          break;
          
        case 'generic':
        default:
          if (win.bitcoinCash) {
            if (win.bitcoinCash.request) {
              const accounts = await win.bitcoinCash.request({ method: 'bch_requestAccounts' });
              address = Array.isArray(accounts) ? accounts[0] : accounts;
            } else if (win.bitcoinCash.getAccounts) {
              const accounts = await win.bitcoinCash.getAccounts();
              address = Array.isArray(accounts) ? accounts[0] : accounts;
            } else {
              throw new Error('Generic wallet does not support connection');
            }
          } else {
            throw new Error('No Bitcoin Cash wallet detected. Please install a compatible wallet extension.');
          }
          break;
      }
      
      if (!address) {
        throw new Error('No address returned from wallet');
      }
      
      // Generate and sign message
      const message = this.generateAuthMessage(address);
      let signature: string;
      
      const wallet = win.paytaca || win.bitcoinCash || win.electronCash;
      if (walletType === 'paytaca' || walletType === 'generic') {
        try {
          signature = await this.signMessageBIP322(address, message, wallet);
        } catch {
          signature = await this.signMessageLegacy(address, message, wallet);
        }
      } else {
        signature = await this.signMessageLegacy(address, message, wallet);
      }
      
      return {
        success: true,
        address,
        signature,
        message
      };
      
    } catch (error) {
      throw error;
    }
  }

  private async signMessageBIP322(address: string, message: string, wallet: any): Promise<string> {
    try {
      // Try BIP-322 signing (preferred method)
      if (wallet.signMessage && wallet.signMessage.length === 3) {
        return await wallet.signMessage(address, message, 'bip322');
      }
      
      if (wallet.request) {
        const signature = await wallet.request({
          method: 'bch_signMessage',
          params: [address, message, 'bip322']
        });
        return signature;
      }
      
      throw new Error('BIP-322 signing not supported');
    } catch (error) {
      throw new Error('BIP-322 signature failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async signMessageLegacy(address: string, message: string, wallet: any): Promise<string> {
    try {
      // Legacy signing methods
      if (wallet.signMessage) {
        if (typeof wallet.signMessage === 'function') {
          if (wallet.signMessage.length === 3) {
            return await wallet.signMessage(address, message, 'legacy');
          } else {
            return await wallet.signMessage(message);
          }
        }
      }
      
      if (wallet.request) {
        const signature = await wallet.request({
          method: 'bch_signMessage',
          params: [address, message]
        });
        return signature;
      }
      
      // Generate a demo signature for development
      logger.warn('Using demo signature - wallet does not support signing');
      return this.generateDemoSignature(message);
      
    } catch (error) {
      throw new Error('Message signing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private generateDemoSignature(message: string): string {
    // Demo signature for development/testing
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = Array.from(new Uint8Array(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `demo_sig:${hash.substring(0, 64)}`;
  }

  async sendPayment(toAddress: string, amountSats: number, payload?: string): Promise<PaymentResult> {
    // Use demo wallet if demo mode is enabled
    if (isDemoMode()) {
      return demoWallet.sendPayment(toAddress, amountSats, payload);
    }

    try {
      // Try using BCH provider first
      const currentWallet = bchProvider.getCurrentWallet();
      if (currentWallet) {
        try {
          const result = await bchProvider.sendTransaction(toAddress, amountSats, { payload });
          return {
            success: result.success,
            txid: result.txid,
            error: result.success ? undefined : 'Transaction failed'
          };
        } catch (providerError) {
          logger.warn('BCH provider send failed, trying API', providerError);
        }
      }

      // Fallback to API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wallet/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress,
          amountSats,
          payload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Payment failed');
      }

      const data = await response.json();
      return {
        success: true,
        txid: data.txid
      };
    } catch (error) {
      logger.error('Payment error', error instanceof Error ? error : new Error(String(error)), { toAddress, amountSats });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  getAvailableWallets(): string[] {
    // In demo mode, always return demo wallet
    if (isDemoMode()) {
      return ['demo'];
    }

    const wallets: string[] = [];
    
    if (typeof window !== 'undefined') {
      const win = window as any;
      
      // Check for Paytaca wallet (most common BCH wallet)
      if (win.paytaca) {
        wallets.push('paytaca');
      }
      
      // Check for Electron Cash
      if (win.electronCash) {
        wallets.push('electron-cash');
      }
      
      // Check for generic Bitcoin Cash wallet
      if (win.bitcoinCash) {
        wallets.push('generic');
      }
      
      // Check for Libauth-based wallets
      if (win.libauth) {
        wallets.push('libauth');
      }
    }
    
    // Always include generic as fallback if no wallets detected
    if (wallets.length === 0) {
      wallets.push('generic');
    }
    
    return wallets;
  }

  getWalletInfo(walletId: string): WalletInfo {
    const win = typeof window !== 'undefined' ? window as any : null;
    
    const walletInfoMap: Record<string, WalletInfo> = {
      'paytaca': {
        id: 'paytaca',
        name: 'Paytaca',
        icon: '🦜',
        supportsBIP322: true,
        available: !!win?.paytaca,
        downloadUrl: 'https://paytaca.com'
      },
      'electron-cash': {
        id: 'electron-cash',
        name: 'Electron Cash',
        icon: '⚡',
        supportsBIP322: false,
        available: !!win?.electronCash,
        downloadUrl: 'https://electroncash.org'
      },
      'generic': {
        id: 'generic',
        name: 'Browser Wallet',
        icon: '₿',
        supportsBIP322: true,
        available: !!win?.bitcoinCash || true,
        downloadUrl: undefined
      },
      'libauth': {
        id: 'libauth',
        name: 'Libauth Wallet',
        icon: '🔐',
        supportsBIP322: true,
        available: !!win?.libauth
      },
      'demo': {
        id: 'demo',
        name: 'Demo Wallet',
        icon: '🧪',
        supportsBIP322: true,
        available: isDemoMode()
      }
    };
    
    return walletInfoMap[walletId] || {
      id: walletId,
      name: walletId,
      icon: '👛',
      supportsBIP322: false,
      available: false
    };
  }
}

export const walletService = new WalletService();

