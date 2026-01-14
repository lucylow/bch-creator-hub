// Enhanced Wallet Connect component with Web3 integration
import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { bchProvider } from '@/lib/web3/providers/BCHProvider';
import { Wallet, LogOut, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatBCH, truncateAddress } from '@/lib/web3/utils/bch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface WalletInfo {
  name: string;
  icon: string;
  supportsBIP322: boolean;
}

const WalletConnect: React.FC = () => {
  const {
    isConnected,
    address,
    balance,
    walletType,
    availableWallets,
    isLoading,
    connect,
    disconnect,
    refreshBalance
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState<Record<string, WalletInfo>>({});

  useEffect(() => {
    const loadWallets = async () => {
      const detectedWallets = await bchProvider.checkWalletInjection();
      setWallets(detectedWallets);
    };
    loadWallets();
  }, []);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleConnect = async (walletType: string) => {
    try {
      await connect(walletType);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Wallet disconnected');
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
    toast.success('Balance updated');
  };

  const handleViewOnExplorer = () => {
    if (address) {
      const explorerUrl = `https://blockchair.com/bitcoin-cash/address/${address}`;
      window.open(explorerUrl, '_blank');
    }
  };

  const getWalletIcon = (type: string) => {
    const icons: Record<string, string> = {
      paytaca: '🦜',
      electronCash: '⚡',
      generic: '₿',
      walletConnect: '🔗'
    };
    return icons[type] || '👛';
  };

  if (isLoading && !isConnected) {
    return (
      <div className="px-4 py-2 rounded-lg bg-muted/50 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded"></div>
      </div>
    );
  }

  if (!isConnected) {
    const walletEntries = Object.entries(wallets);
    
    if (walletEntries.length === 0) {
      return (
        <Button
          onClick={() => handleConnect('generic')}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5 text-sm font-semibold">Available Wallets</div>
          <DropdownMenuSeparator />
          {walletEntries.map(([key, wallet]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => handleConnect(key)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{wallet.icon}</span>
                <div>
                  <div className="font-medium">{wallet.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {wallet.supportsBIP322 ? 'BIP-322' : 'Legacy'} signing
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Balance Display */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="font-bold text-sm">{formatBCH(balance.total)}</div>
            <div className="text-xs text-muted-foreground">Balance</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshBalance}
            disabled={refreshing}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Address Display */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <span className="text-xl">{getWalletIcon(walletType || 'generic')}</span>
            <div className="text-left">
              <div className="font-mono text-sm">{truncateAddress(address || '', 6, 4)}</div>
              <div className="text-xs text-muted-foreground capitalize">{walletType || 'generic'}</div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5">
            <div className="text-sm font-mono break-all">{address}</div>
            <div className="text-xs text-muted-foreground mt-1">Wallet Address</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewOnExplorer} className="cursor-pointer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default WalletConnect;
