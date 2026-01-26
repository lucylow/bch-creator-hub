import { demoWallet } from '@/demo';
import { logger } from '@/utils/logger';
import { normalizeError, getUserFriendlyMessage } from '@/utils/errorUtils';
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
      sendTransaction?: (tx: unknown) => Promise<string>;
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (data: unknown) => void) => void;
      isConnected?: () => boolean;
    };
    electronCash?: {
      requestDevice?: () => Promise<{ open: () => Promise<void>; getAccounts: () => Promise<Array<{ address?: string } | string>> }>;
    };
    bitcoinCash?: {
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      signMessage?: (address: string, message: string, format?: string) => Promise<string>;
      sendTransaction?: (tx: unknown) => Promise<string>;
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
    // Try web3 first
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

      // Fallback to API (backend returns { success, data: { confirmed, unconfirmed, total } })
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${base}/api/wallet/balance/${encodeURIComponent(address)}`);
      
      if (!response.ok) {
        const body = await response.text();
        let detail = response.statusText;
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (parsed?.error || parsed?.message) detail = String(parsed.error ?? parsed.message);
        } catch {
          // ignore
        }
        throw new Error(detail || `Failed to fetch balance (${response.status})`);
      }
      
      let json: Record<string, unknown>;
      try {
        json = await response.json();
      } catch {
        throw new Error('Invalid response from balance API');
      }
      const bal = (json?.data ?? json) as Record<string, unknown> | undefined;
      const confirmed = Number(bal?.confirmed ?? 0) || 0;
      const unconfirmed = Number(bal?.unconfirmed ?? 0) || 0;
      return {
        confirmed,
        unconfirmed,
        total: Number(bal?.total ?? 0) || confirmed + unconfirmed
      };
    } catch (error) {
      const err = normalizeError(error);
      logger.warn('Web3 balance fetch failed, falling back to mock data', { error: err.message, address });
      return demoWallet.getBalance(address);
    }
  }

  async connectWallet(walletType: string = 'generic'): Promise<WalletConnectionResult> {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Wallet connection is not available in this environment.' };
    }

    // Demo wallet: skip provider and use mock adapter
    if (walletType === 'demo') {
      return demoWallet.connect();
    }

    try {
      try {
        const walletData = await bchProvider.connectWallet(walletType);

        if (walletData && walletData.address) {
          const message = this.generateAuthMessage(walletData.address);
          const wallets = await bchProvider.checkWalletInjection();
          const wallet = wallets[walletType];

          let signature: string;
          if (wallet && wallet.supportsBIP322) {
            try {
              signature = await this.signMessageBIP322(walletData.address, message, wallet.instance);
            } catch (bipError) {
              logger.warn('BIP-322 signing failed, falling back to legacy', bipError);
              signature = await this.signMessageLegacy(walletData.address, message, wallet.instance);
            }
          } else {
            signature = await this.signMessageLegacy(walletData.address, message, wallet?.instance);
          }

          return { success: true, address: walletData.address, signature, message };
        }
        return { success: false, error: 'Wallet did not return an address.' };
      } catch (providerError) {
        return await this.connectWalletDirect(walletType);
      }
    } catch (error) {
      const err = normalizeError(error);
      const msg = getUserFriendlyMessage(err, 'Wallet connection failed');
      logger.warn('Wallet connection failed', { error: err.message, walletType });
      return { success: false, error: msg };
    }
  }

  private async connectWalletDirect(walletType: string): Promise<WalletConnectionResult> {
    const win = window;
    let address: string;

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

      case 'electron-cash': {
        if (!win.electronCash) {
          throw new Error('Electron Cash not detected');
        }

        const device = await win.electronCash.requestDevice();
        await device.open();
        const ecAccounts = await device.getAccounts();
        address = ecAccounts[0]?.address || ecAccounts[0];
        break;
      }

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
            throw new Error('This wallet does not support connection. Try Paytaca or Demo Wallet.');
          }
        } else {
          throw new Error('No Bitcoin Cash wallet detected. Use Demo Wallet to explore, or install Paytaca from paytaca.com and refresh.');
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
  }

  private async signMessageBIP322(address: string, message: string, wallet: Window['paytaca'] | Window['bitcoinCash']): Promise<string> {
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

  private async signMessageLegacy(address: string, message: string, wallet: Window['paytaca'] | Window['bitcoinCash'] | Window['electronCash']): Promise<string> {
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
    // Try web3 first
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
        const text = await response.text();
        let msg = 'Payment failed';
        try {
          const errorData = text ? JSON.parse(text) : {};
          if (errorData?.error || errorData?.message) msg = String(errorData.error ?? errorData.message);
        } catch {
          if (text) msg = `${response.status}: ${response.statusText}`;
        }
        throw new Error(msg);
      }

      let data: { txid?: string };
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from payment API');
      }
      return {
        success: true,
        txid: data.txid
      };
    } catch (error) {
      const err = normalizeError(error);
      logger.warn('Web3 payment failed, falling back to mock data', { error: err.message, toAddress, amountSats });
      return demoWallet.sendPayment(toAddress, amountSats, payload);
    }
  }

  getAvailableWallets(): string[] {
    const wallets: string[] = [];
    
    if (typeof window !== 'undefined') {
      const win = window;
      
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
    
    // Always include demo as fallback if no wallets detected
    if (wallets.length === 0) {
      wallets.push('demo');
    } else {
      // Also include demo as an option even when wallets are available
      wallets.push('demo');
    }
    
    return wallets;
  }

  getWalletInfo(walletId: string): WalletInfo {
    const win = typeof window !== 'undefined' ? window : null;
    
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
        available: true
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

