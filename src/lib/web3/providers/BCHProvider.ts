// BCH Provider - Core Web3 integration layer
import { API } from '../api/client';

interface WalletInfo {
  name: string;
  icon: string;
  supportsBIP322: boolean;
  instance: any;
}

interface WalletData {
  type: string;
  address: string;
  balance: {
    confirmed: number;
    unconfirmed: number;
    total: number;
  };
  utxos: any[];
  wallet: any;
  authenticated: boolean;
  authToken?: string;
}

interface Balance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

type EventListener = (data?: any) => void;

export class BCHProvider {
  private network: string;
  private connected = false;
  private wallets: Record<string, WalletInfo> = {};
  private contracts: Record<string, any> = {};
  private currentWallet: WalletData | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();

  constructor() {
    this.network = import.meta.env.VITE_BCH_NETWORK || 'testnet';
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      this.checkWalletInjection();
      
      window.addEventListener('message', (event) => {
        if (event.data.type === 'BCH_WALLET_CONNECTED') {
          this.onWalletConnected(event.data);
        }
      });
    }
  }

  private onWalletConnected(data: any) {
    // Handle wallet connection event from browser extension
    this.emit('walletConnected', data);
  }

  private getRestURL(): string {
    const urls: Record<string, string> = {
      mainnet: 'https://api.fullstack.cash/v5/',
      testnet: 'https://api.fullstack.cash/v5/',
      regtest: 'http://localhost:3000/v5/'
    };
    return urls[this.network] || urls.testnet;
  }

  async checkWalletInjection(): Promise<Record<string, WalletInfo>> {
    const wallets: Record<string, WalletInfo> = {};
    
    if (typeof window === 'undefined') return wallets;

    const win = window as any;
    
    // Check for Paytaca wallet (most popular BCH wallet)
    if (win.paytaca) {
      try {
        // Verify Paytaca is actually functional
        const isConnected = typeof win.paytaca.isConnected === 'function' 
          ? win.paytaca.isConnected() 
          : true;
        
        wallets.paytaca = {
          name: 'Paytaca',
          icon: '🦜',
          supportsBIP322: true,
          instance: win.paytaca
        };
      } catch (error) {
        console.warn('Paytaca wallet detected but not functional:', error);
      }
    }
    
    // Check for Electron Cash via WebUSB
    if (win.electronCash) {
      wallets.electronCash = {
        name: 'Electron Cash',
        icon: '⚡',
        supportsBIP322: false,
        instance: win.electronCash
      };
    }
    
    // Check for generic Bitcoin Cash wallet
    if (win.bitcoinCash) {
      wallets.generic = {
        name: 'Bitcoin Cash Wallet',
        icon: '₿',
        supportsBIP322: true,
        instance: win.bitcoinCash
      };
    }
    
    // Check for Libauth-based wallets
    if (win.libauth) {
      wallets.libauth = {
        name: 'Libauth Wallet',
        icon: '🔐',
        supportsBIP322: true,
        instance: win.libauth
      };
    }
    
    // Check for Wallet Connect
    if (win.walletConnectProvider) {
      wallets.walletConnect = {
        name: 'WalletConnect',
        icon: '🔗',
        supportsBIP322: false,
        instance: win.walletConnectProvider
      };
    }
    
    this.wallets = wallets;
    this.emit('walletsDetected', wallets);
    
    return wallets;
  }

  async connectWallet(walletType = 'generic'): Promise<WalletData> {
    try {
      // Refresh wallet detection first
      await this.checkWalletInjection();
      
      const wallet = this.wallets[walletType];
      
      if (!wallet) {
        // Provide helpful error message based on wallet type
        if (walletType === 'paytaca') {
          throw new Error('Paytaca wallet not detected. Please install the Paytaca browser extension from https://paytaca.com');
        } else if (walletType === 'electron-cash') {
          throw new Error('Electron Cash not detected. Please connect your hardware device or install the Electron Cash app.');
        } else {
          throw new Error(`Wallet "${walletType}" not available. Please ensure a compatible Bitcoin Cash wallet is installed.`);
        }
      }

      let accounts: string[] = [];
      
      switch (walletType) {
        case 'paytaca':
          accounts = await this.connectPaytaca(wallet.instance);
          break;
        case 'electronCash':
        case 'electron-cash':
          accounts = await this.connectElectronCash(wallet.instance);
          break;
        case 'walletConnect':
          accounts = await this.connectWalletConnect(wallet.instance);
          break;
        case 'libauth':
          accounts = await this.connectLibauth(wallet.instance);
          break;
        default:
          accounts = await this.connectGeneric(wallet.instance);
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet. Please ensure your wallet is unlocked and contains at least one account.');
      }

      // Validate address format
      const address = accounts[0];
      if (!this.isValidAddress(address)) {
        throw new Error('Invalid Bitcoin Cash address returned from wallet');
      }
      
      // Authenticate with backend
      let authResult: { token?: string } = {};
      try {
        authResult = await this.authenticate(address, walletType);
      } catch (authError) {
        console.warn('Backend authentication failed, continuing with local connection', authError);
        // Continue without backend auth for demo/offline mode
      }
      
      // Load wallet balance
      const balance = await this.getBalance(address);
      
      // Get UTXOs (non-blocking)
      let utxos: any[] = [];
      try {
        utxos = await this.getUTXOs(address);
      } catch (utxoError) {
        console.warn('UTXO fetch failed, continuing without UTXO data', utxoError);
      }
      
      const walletData: WalletData = {
        type: walletType,
        address,
        balance,
        utxos,
        wallet: wallet.instance,
        authenticated: !!authResult.token,
        authToken: authResult.token
      };
      
      this.connected = true;
      this.currentWallet = walletData;
      
      // Store in localStorage
      this.persistWalletState(walletData);
      
      // Set up account change listeners
      this.setupAccountChangeListeners(walletType, wallet.instance);
      
      // Emit events
      this.emit('connected', walletData);
      this.emit('balanceUpdate', balance);
      
      return walletData;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Wallet connection failed:', errorMessage);
      this.emit('error', { type: 'connection', message: errorMessage, walletType });
      throw error;
    }
  }

  private isValidAddress(address: string): boolean {
    // Basic CashAddr validation
    const cashAddrRegex = /^(bitcoincash:|bchtest:|bchreg:)?[qp][a-z0-9]{41}$/i;
    return cashAddrRegex.test(address);
  }

  private async connectLibauth(libauth: any): Promise<string[]> {
    try {
      if (typeof libauth.requestAccounts === 'function') {
        const accounts = await libauth.requestAccounts();
        return Array.isArray(accounts) ? accounts : [accounts];
      }
      
      throw new Error('Libauth wallet does not support connection');
    } catch (error) {
      throw new Error('Libauth connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private setupAccountChangeListeners(walletType: string, walletInstance: any) {
    try {
      // Listen for account changes from wallet
      if (typeof walletInstance.on === 'function') {
        walletInstance.on('accountsChanged', (accounts: string[]) => {
          if (accounts && accounts.length > 0 && this.currentWallet) {
            const newAddress = Array.isArray(accounts) ? accounts[0] : accounts;
            if (newAddress !== this.currentWallet.address) {
              this.handleAccountChange(newAddress);
            }
          }
        });
      }
      
      // Also listen for disconnect events
      if (typeof walletInstance.on === 'function') {
        walletInstance.on('disconnect', () => {
          this.handleDisconnect();
        });
      }
    } catch (error) {
      console.debug('Could not set up account change listeners:', error);
    }
  }

  private async handleAccountChange(newAddress: string) {
    if (!this.currentWallet) return;
    
    try {
      this.currentWallet.address = newAddress;
      
      // Update balance
      const balance = await this.getBalance(newAddress);
      this.currentWallet.balance = balance;
      
      // Persist new state
      this.persistWalletState(this.currentWallet);
      
      // Emit events
      this.emit('accountChanged', { address: newAddress });
      this.emit('balanceUpdate', balance);
      
      // Dispatch custom event for other parts of the app
      window.dispatchEvent(new CustomEvent('walletAccountChanged', { detail: newAddress }));
    } catch (error) {
      console.error('Failed to handle account change:', error);
    }
  }

  private handleDisconnect() {
    this.connected = false;
    this.currentWallet = null;
    this.emit('disconnected');
    
    // Clear localStorage
    localStorage.removeItem('bch_wallet_state');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }

  private async connectGeneric(wallet: any): Promise<string[]> {
    try {
      // Request accounts using EIP-1193 style
      if (wallet.request) {
        const accounts = await wallet.request({
          method: 'bch_requestAccounts'
        });
        return Array.isArray(accounts) ? accounts : [accounts];
      }
      
      // Fallback to legacy method
      if (wallet.enable) {
        const accounts = await wallet.enable();
        return Array.isArray(accounts) ? accounts : [accounts];
      }
      
      throw new Error('Wallet does not support connection');
    } catch (error) {
      throw new Error('Generic wallet connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async connectPaytaca(paytaca: any): Promise<string[]> {
    try {
      // Try multiple connection methods for Paytaca
      let accounts: string[] = [];
      
      // Method 1: Direct getAccounts
      if (typeof paytaca.getAccounts === 'function') {
        try {
          const result = await paytaca.getAccounts();
          accounts = Array.isArray(result) ? result : [result];
          if (accounts.length > 0) return accounts;
        } catch (e) {
          console.debug('Paytaca getAccounts failed, trying request method');
        }
      }
      
      // Method 2: EIP-1193 style request
      if (typeof paytaca.request === 'function') {
        try {
          const result = await paytaca.request({ method: 'bch_requestAccounts' });
          accounts = Array.isArray(result) ? result : [result];
          if (accounts.length > 0) return accounts;
        } catch (e) {
          console.debug('Paytaca request method failed, trying enable');
        }
      }
      
      // Method 3: Legacy enable method
      if (typeof paytaca.enable === 'function') {
        try {
          const result = await paytaca.enable();
          accounts = Array.isArray(result) ? result : [result];
          if (accounts.length > 0) return accounts;
        } catch (e) {
          console.debug('Paytaca enable method failed');
        }
      }
      
      if (accounts.length === 0) {
        throw new Error('No accounts returned from Paytaca wallet. Please ensure the wallet is unlocked.');
      }
      
      return accounts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful error messages
      if (errorMessage.includes('User rejected') || errorMessage.includes('denied')) {
        throw new Error('Connection rejected. Please approve the connection in your Paytaca wallet.');
      }
      
      if (errorMessage.includes('locked') || errorMessage.includes('unlocked')) {
        throw new Error('Please unlock your Paytaca wallet and try again.');
      }
      
      throw new Error(`Paytaca connection failed: ${errorMessage}`);
    }
  }

  private async connectElectronCash(electron: any): Promise<string[]> {
    try {
      const device = await electron.requestDevice();
      await device.open();
      const accounts = await device.getAccounts();
      return accounts.map((acc: any) => acc.address);
    } catch (error) {
      throw new Error('Electron Cash connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async connectWalletConnect(provider: any): Promise<string[]> {
    try {
      await provider.enable();
      const accounts = provider.accounts;
      return Array.isArray(accounts) ? accounts : [accounts];
    } catch (error) {
      throw new Error('WalletConnect connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async authenticate(address: string, walletType: string): Promise<{ token?: string }> {
    try {
      const message = this.generateChallenge(address);
      
      // Sign message
      let signature: string;
      const wallet = this.wallets[walletType];
      
      if (wallet.supportsBIP322) {
        signature = await this.signMessageBIP322(address, message, wallet.instance);
      } else {
        signature = await this.signMessageLegacy(address, message, wallet.instance);
      }
      
      // Send to backend for verification
      const response = await API.post('/auth/login', {
        address,
        signature,
        message,
        walletType,
        timestamp: Date.now()
      });
      
      const responseData = response.data as { token?: string } | undefined;
      if (response.success && responseData?.token) {
        localStorage.setItem('auth_token', responseData.token);
        localStorage.setItem('wallet_address', address);
        
        return { token: responseData.token };
      } else {
        throw new Error('Authentication failed');
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  private generateChallenge(address: string): string {
    const nonce = Math.random().toString(36).substring(2);
    const timestamp = Date.now();
    return `BCH Paywall Router Authentication\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  }

  private async signMessageBIP322(address: string, message: string, wallet: any): Promise<string> {
    try {
      // Method 1: Direct signMessage with 3 parameters (address, message, format)
      if (typeof wallet.signMessage === 'function' && wallet.signMessage.length >= 2) {
        try {
          // Try with 3 params first (address, message, 'bip322')
          if (wallet.signMessage.length >= 3) {
            return await wallet.signMessage(address, message, 'bip322');
          }
          // Try with 2 params (address, message) - some wallets auto-detect format
          return await wallet.signMessage(address, message);
        } catch (e) {
          console.debug('Direct signMessage failed, trying request method');
        }
      }
      
      // Method 2: EIP-1193 style request
      if (typeof wallet.request === 'function') {
        try {
          const signature = await wallet.request({
            method: 'bch_signMessage',
            params: [address, message, 'bip322']
          });
          if (signature) return signature;
        } catch (e) {
          console.debug('Request method BIP-322 failed, trying without format specifier');
          try {
            // Try without explicit format - wallet may default to BIP-322
            const signature = await wallet.request({
              method: 'bch_signMessage',
              params: [address, message]
            });
            if (signature) return signature;
          } catch (e2) {
            console.debug('Request method without format failed');
          }
        }
      }
      
      // Method 3: Legacy signing (some wallets support BIP-322 but don't expose it)
      return await this.signMessageLegacy(address, message, wallet);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('BIP-322 signing failed, using fallback:', errorMessage);
      return this.signMessageLegacy(address, message, wallet);
    }
  }

  private async signMessageLegacy(address: string, message: string, wallet: any): Promise<string> {
    try {
      if (wallet.signMessage) {
        return await wallet.signMessage(message);
      }
      
      // Generate a mock signature for demo purposes
      console.log('Using mock signature for demo');
      return this.generateMockSignature(message);
    } catch (error) {
      console.log('Using mock signature for demo');
      return this.generateMockSignature(message);
    }
  }

  private generateMockSignature(message: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = Array.from(new Uint8Array(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `mock:${hash}`;
  }

  async getBalance(address: string): Promise<Balance> {
    try {
      const response = await fetch(`${this.getRestURL()}electrumx/balance/${address}`);
      
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
      console.error('Balance check error:', error);
      return { confirmed: 0, unconfirmed: 0, total: 0 };
    }
  }

  async getUTXOs(address: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.getRestURL()}blockbook/utxo/${address}`);
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        satoshis: utxo.satoshis,
        confirmations: utxo.confirmations
      })) : [];
    } catch (error) {
      console.error('UTXO fetch error:', error);
      return [];
    }
  }

  async sendTransaction(toAddress: string, amountSatoshis: number, options: any = {}): Promise<{ success: boolean; txid?: string; amount: number }> {
    try {
      const wallet = this.currentWallet?.wallet;
      
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const txParams = {
        to: toAddress,
        value: amountSatoshis,
        ...options
      };

      // Send transaction
      let txHash: string;
      
      if (wallet.request) {
        const result = await wallet.request({
          method: 'bch_sendTransaction',
          params: [txParams]
        });
        txHash = result;
      } else if (wallet.sendTransaction) {
        txHash = await wallet.sendTransaction(txParams);
      } else {
        throw new Error('Wallet does not support sending transactions');
      }

      if (!txHash || txHash.length !== 64) {
        throw new Error('Invalid transaction hash returned');
      }

      // Wait for transaction to propagate
      await this.waitForTransaction(txHash);

      // Update balance
      if (this.currentWallet) {
        const newBalance = await this.getBalance(this.currentWallet.address);
        this.emit('balanceUpdate', newBalance);
      }

      return {
        success: true,
        txid: txHash,
        amount: amountSatoshis
      };

    } catch (error) {
      console.error('Transaction failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private async waitForTransaction(txid: string, timeout = 60000): Promise<any> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const response = await fetch(`${this.getRestURL()}blockbook/tx/${txid}`);
          
          if (response.ok) {
            const tx = await response.json();
            
            if (tx && tx.confirmations > 0) {
              clearInterval(checkInterval);
              resolve(tx);
            }
          }
          
          if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            reject(new Error('Transaction confirmation timeout'));
          }
        } catch (error) {
          // Transaction might not be in mempool yet
        }
      }, 2000);
    });
  }

  private persistWalletState(walletData: WalletData) {
    const state = {
      address: walletData.address,
      walletType: walletData.type,
      connected: true,
      timestamp: Date.now()
    };
    
    localStorage.setItem('bch_wallet_state', JSON.stringify(state));
  }

  disconnect() {
    this.connected = false;
    this.currentWallet = null;
    this.contracts = {};
    
    // Clean up listeners if possible
    if (this.currentWallet?.wallet && typeof this.currentWallet.wallet.removeListener === 'function') {
      try {
        this.currentWallet.wallet.removeListener('accountsChanged', () => {});
        this.currentWallet.wallet.removeListener('disconnect', () => {});
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    localStorage.removeItem('bch_wallet_state');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
    
    this.emit('disconnected');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }

  async reconnect(): Promise<WalletData | null> {
    try {
      const savedState = localStorage.getItem('bch_wallet_state');
      if (!savedState) {
        return null;
      }
      
      const state = JSON.parse(savedState);
      if (!state.walletType || !state.address) {
        return null;
      }
      
      // Check if wallet is still available
      await this.checkWalletInjection();
      if (!this.wallets[state.walletType]) {
        // Wallet no longer available, clear state
        localStorage.removeItem('bch_wallet_state');
        return null;
      }
      
      // Attempt to reconnect
      return await this.connectWallet(state.walletType);
    } catch (error) {
      console.error('Reconnection failed:', error);
      localStorage.removeItem('bch_wallet_state');
      return null;
    }
  }

  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
  }

  off(event: string, listener: EventListener) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(listener);
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(listener => {
        listener(data);
      });
    }
  }

  getNetwork(): string {
    return this.network;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getCurrentWallet(): WalletData | null {
    return this.currentWallet;
  }

  getContract(address: string): any {
    return this.contracts[address];
  }
}

// Singleton instance
export const bchProvider = new BCHProvider();
