import React, { useState, useEffect } from 'react';
import { Wallet, Loader2, Copy, Check, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { truncateAddress, formatBCH } from '@/utils/formatters';
import { toast } from 'sonner';
import WalletConnectModal from './WalletConnectModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const EXPLORER_URL = 'https://blockchair.com/bitcoin-cash/address';

type Props = { fullWidth?: boolean; size?: 'default' | 'sm' | 'lg' };

const WalletConnectButton: React.FC<Props> = ({ fullWidth = false, size = 'default' }) => {
  const { isConnected, address, balance, walletType, disconnect, isLoading, refreshBalance } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
    } catch {
      toast.error('Could not copy address');
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
    toast.success('Balance updated');
  };

  if (isConnected && address) {
    const total = balance?.total ?? (balance?.confirmed ?? 0) + (balance?.unconfirmed ?? 0);
    return (
      <div className={`flex items-center gap-2 ${fullWidth ? 'w-full flex-wrap' : ''}`}>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
          <span className="text-sm font-medium tabular-nums">{formatBCH(total)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshBalance}
            disabled={refreshing}
            className="h-6 w-6 p-0"
            title="Refresh balance"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={size} className="gap-2 min-w-0">
              <span className="font-mono text-sm truncate max-w-[120px]">{truncateAddress(address, 6)}</span>
              <span className="text-xs text-muted-foreground capitalize shrink-0">{walletType || 'Wallet'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1.5">
              <div className="text-xs text-muted-foreground">Balance</div>
              <div className="font-semibold tabular-nums">{formatBCH(total)}</div>
            </div>
            <div className="px-2 py-1">
              <div className="text-xs font-mono break-all text-muted-foreground">{address}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied' : 'Copy address'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.open(`${EXPLORER_URL}/${address}`, '_blank')}
              className="cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => disconnect()} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold ${fullWidth ? 'w-full' : ''}`}
        size={size}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4 mr-2" />
        )}
        Connect Wallet
      </Button>
      
      <WalletConnectModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};

export default WalletConnectButton;
