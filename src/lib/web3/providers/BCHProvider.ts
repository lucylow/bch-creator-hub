// BCH Provider - Core Web3 integration layer
import { API } from '../api/client';
import { getBlockExplorerUrl } from '../utils/bch';
import { logger } from '@/utils/logger';
import { normalizeError, getUserFriendlyMessage } from '@/utils/errorUtils';

interface WalletInfo {
  name: string;
  icon: string;
  supportsBIP322: boolean;
  instance: unknown;
}

interface WalletData {
  type: string;
  address: string;
  balance: {
    confirmed: number;
    unconfirmed: number;
    total: number;
  };
  utxos: unknown[];
  wallet: unknown;
  authenticated: boolean;
  authToken?: string;
}

interface Balance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

type EventListener = (data?: unknown) => void;

export class BCHProvider {
  private network: string;
  private connected = false;
  private wallets: Record<string, WalletInfo> = {};
  private contracts: Record<string, unknown> = {};
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

  private onWalletConnected(data: { type: string } & Record<string, unknown>) {
    // Handle wallet connection event from browser extension
    this.emit('walletConnected', data);
  }

  private getRestURL(): string {
    const urls: Record<string, string> = {
      mainnet: 'https://api.fullstack.cash/v5/',
      testnet: 'https://tapi.fullstack.cash/v5/',
      regtest: 'http://localhost:3000/v5/'
    };
    return urls[this.network] || urls.testnet;
  }

  async checkWalletInjection(): Promise<Record<string, WalletInfo>> {
    const wallets: Record<string, WalletInfo> = {};
    
    if (typeof window === 'undefined') return wallets;

    const win = window as Window & { paytaca?: unknown; electronCash?: unknown; [key: string]: unknown };
    
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
        logger.warn('Paytaca wallet detected but not functional', { error: normalizeError(error).message });
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

  /** Resolve wallet key to handle electron-cash vs electronCash from walletService */
  private resolveWalletKey(walletType: string): string {
    if (walletType === 'electron-cash' && this.wallets.electronCash) return 'electronCash';
    return walletType;
  }

  async connectWallet(walletType = 'generic'): Promise<WalletData> {
    try {
      // Refresh wallet detection first
      await this.checkWalletInjection();
      const resolvedKey = this.resolveWalletKey(walletType);
      const wallet = this.wallets[resolvedKey];
      
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
      
      switch (resolvedKey) {
        case 'paytaca':
          accounts = await this.connectPaytaca(wallet.instance);
          break;
        case 'electronCash':
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
      
      // Authenticate with backend (use resolvedKey for wallet lookup)
      let authResult: { token?: string } = {};
      try {
        authResult = await this.authenticate(address, resolvedKey);
      } catch (authError) {
        logger.warn('Backend authentication failed, continuing with local connection', { error: normalizeError(authError).message });
      }
      
      // Load wallet balance
      const balance = await this.getBalance(address);
      
      // Get UTXOs (non-blocking)
      let utxos: unknown[] = [];
      try {
        utxos = await this.getUTXOs(address);
      } catch (utxoError) {
        logger.warn('UTXO fetch failed, continuing without UTXO data', { error: normalizeError(utxoError).message });
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
      const err = normalizeError(error);
      const userMsg = getUserFriendlyMessage(err, 'Wallet connection failed');
      logger.error('Wallet connection failed', err, { walletType });
      this.emit('error', { type: 'connection', message: userMsg, walletType });
      throw err;
    }
  }

  private isValidAddress(address: string): boolean {
    // Basic CashAddr validation
    const cashAddrRegex = /^(bitcoincash:|bchtest:|bchreg:)?[qp][a-z0-9]{41}$/i;
    return cashAddrRegex.test(address);
  }

  private async connectLibauth(libauth: { requestAccounts?: () => Promise<unknown> }): Promise<string[]> {
    try {
      if (typeof libauth.requestAccounts === 'function') {
        const accounts = await lib.requestAccounts();
        return Array.isArray(accounts) ? accounts as string[] : [accounts] as string[];
      }
      
      throw new Error('Libauth wallet does not support connection');
    } catch (error) {
      throw new Error('Libauth connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private setupAccountChangeListeners(walletType: string, walletInstance: unknown) {
    const w = walletInstance as { on?: (event: string, cb: (accounts: unknown) => void) => void };
    try {
      // Listen for account changes from wallet
      if (typeof w?.on === 'function') {
        w.on('accountsChanged', (accounts: unknown) => {
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
      logger.debug('Could not set up account change listeners', { error: normalizeError(error).message });
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
      logger.error('Failed to handle account change', normalizeError(error), { newAddress });
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

  private async connectGeneric(wallet: { request?: (opts: { method: string }) => Promise<unknown>; enable?: () => Promise<unknown> }): Promise<string[]> {
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

  private async connectPaytaca(paytaca: unknown): Promise<string[]> {
    const p = paytaca as { getAccounts?: () => Promise<unknown>; request?: (args: { method: string }) => Promise<unknown>; enable?: () => Promise<unknown> };
    try {
      let accounts: string[] = [];
      if (typeof p?.getAccounts === 'function') {
        try {
          const result = await p.getAccounts();
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
      if (typeof p?.enable === 'function') {
        try {
          const result = await p.enable!();
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

  private async connectElectronCash(electron: unknown): Promise<string[]> {
    const e = electron as { requestDevice: () => Promise<{ open: () => Promise<void>; getAccounts: () => Promise<Array<{ address: string }>> }> };
    try {
      const device = await e.requestDevice();
      await device.open();
      const accounts = await device.getAccounts();
      return accounts.map((acc: { address: string }) => acc.address);
    } catch (error) {
      throw new Error('Electron Cash connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async connectWalletConnect(provider: unknown): Promise<string[]> {
    const p = provider as { enable: () => Promise<unknown>; accounts?: string[] | string };
    try {
      await p.enable();
      const accounts = p.accounts;
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
      const err = normalizeError(error);
      logger.error('Authentication error', err, { address });
      throw err;
    }
  }

  private generateChallenge(address: string): string {
    const nonce = Math.random().toString(36).substring(2);
    const timestamp = Date.now();
    return `BCH Paywall Router Authentication\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  }

  private async signMessageBIP322(address: string, message: string, wallet: unknown): Promise<string> {
    const w = wallet as { signMessage?: (a: string, b: string, c?: string) => Promise<string>; request?: (args: { method: string; params?: unknown[] }) => Promise<string> };
    try {
      // Method 1: Direct signMessage with 3 parameters (address, message, format)
      if (typeof w?.signMessage === 'function') {
        try {
          return await w.signMessage(address, message, 'bip322');
        } catch {
          try {
            return await w.signMessage(address, message);
          } catch (e) {
            console.debug('Direct signMessage failed, trying request method');
          }
        }
      }

      // Method 2: EIP-1193 style request
      if (typeof w?.request === 'function') {
        try {
          const signature = await w.request({ method: 'bch_signMessage', params: [address, message, 'bip322'] });
          if (signature) return signature;
        } catch {
          try {
            const signature = await w.request({ method: 'bch_signMessage', params: [address, message] });
            if (signature) return signature;
          } catch {
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

  private async signMessageLegacy(address: string, message: string, wallet: unknown): Promise<string> {
    try {
      const w = wallet as { signMessage?: (message: string) => Promise<string> };
      if (w?.signMessage) {
        return await w.signMessage(message);
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
      const base = this.getRestURL();
      const url = `${base}electrumx/balance/${encodeURIComponent(address)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Balance fetch failed: ${response.status} ${response.statusText}`);
      }
      
      let data: Record<string, unknown>;
      try {
        data = await response.json();
      } catch {
        logger.warn('Balance API returned invalid JSON', { address });
        return { confirmed: 0, unconfirmed: 0, total: 0 };
      }
      const balanceObj = (data?.balance ?? data) as Record<string, unknown> | undefined;
      const confirmed = Number(balanceObj?.confirmed ?? data?.confirmed ?? 0) || 0;
      const unconfirmed = Number(balanceObj?.unconfirmed ?? data?.unconfirmed ?? 0) || 0;
      
      return {
        confirmed,
        unconfirmed,
        total: confirmed + unconfirmed
      };
    } catch (error) {
      logger.warn('Balance check failed', { error: normalizeError(error).message, address });
      return { confirmed: 0, unconfirmed: 0, total: 0 };
    }
  }

  async getUTXOs(address: string): Promise<Array<{ txid: string; vout?: number; satoshis?: number; value?: number; confirmations?: number }>> {
    try {
      const base = this.getRestURL();
      const url = `${base}blockbook/utxo/${encodeURIComponent(address)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }
      
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        logger.warn('UTXO API returned invalid JSON', { address });
        return [];
      }
      const list = Array.isArray(data) ? data : ((data as Record<string, unknown>)?.utxos ?? (data as Record<string, unknown>)?.data ?? []);
      return Array.isArray(list) ? list.map((utxo: { txid?: string; vout?: number; vOut?: number; satoshis?: number; value?: number; confirmations?: number }) => ({
        txid: utxo.txid,
        vout: utxo.vout ?? utxo.vOut,
        satoshis: utxo.satoshis ?? utxo.value ?? 0,
        confirmations: utxo.confirmations ?? 0
      })) : [];
    } catch (error) {
      logger.warn('UTXO fetch failed', { error: normalizeError(error).message, address });
      return [];
    }
  }

  async sendTransaction(toAddress: string, amountSatoshis: number, options: Record<string, unknown> = {}): Promise<{ success: boolean; txid?: string; amount: number }> {
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
      const err = normalizeError(error);
      const userMsg = getUserFriendlyMessage(err, 'Transaction failed');
      logger.error('Transaction failed', err, { toAddress, amountSatoshis });
      this.emit('error', { message: userMsg, original: err });
      throw err;
    }
  }

  private async waitForTransaction(txid: string, timeout = 60000): Promise<unknown> {
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
    const walletRef = this.currentWallet;
    this.connected = false;
    this.currentWallet = null;
    this.contracts = {};
    
    if (typeof window !== 'undefined') {
      if (walletRef?.wallet && typeof walletRef.wallet.removeListener === 'function') {
        try {
          walletRef.wallet.removeListener('accountsChanged', () => {});
          walletRef.wallet.removeListener('disconnect', () => {});
        } catch {
          // Ignore cleanup errors
        }
      }
      localStorage.removeItem('bch_wallet_state');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
    }
    
    this.emit('disconnected');
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
      logger.error('Reconnection failed', normalizeError(error));
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

  private emit(event: string, data?: unknown) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(listener => {
        listener(data);
      });
    }
  }

  getNetwork(): string {
    return this.network;
  }

  /** Network-aware block explorer URL for a transaction (mainnet/testnet/regtest). */
  getBlockExplorerTxUrl(txid: string): string {
    return getBlockExplorerUrl(this.network, 'tx', txid);
  }

  /** Network-aware block explorer URL for an address. */
  getBlockExplorerAddressUrl(address: string): string {
    return getBlockExplorerUrl(this.network, 'address', address);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getCurrentWallet(): WalletData | null {
    return this.currentWallet;
  }

  getContract(address: string): unknown {
    return this.contracts[address];
  }
}

// Singleton instance
export const bchProvider = new BCHProvider();
