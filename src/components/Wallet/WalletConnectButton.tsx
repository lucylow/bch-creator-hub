import React, { useState } from 'react';
import { Wallet, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { truncateAddress } from '@/utils/formatters';
import { toast } from 'sonner';
import WalletConnectModal from './WalletConnectModal';

type Props = { fullWidth?: boolean; size?: 'default' | 'sm' | 'lg' };

const WalletConnectButton: React.FC<Props> = ({ fullWidth = false, size = 'default' }) => {
  const { isConnected, address, disconnect, isLoading } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy address');
    }
  };

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-3 ${fullWidth ? 'w-full flex-wrap' : ''}`}>
        <button
          type="button"
          onClick={copyAddress}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title="Copy address"
        >
          {truncateAddress(address, 6)}
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
        <Button
          onClick={() => disconnect()}
          variant="destructive"
          size={size}
        >
          Disconnect
        </Button>
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
