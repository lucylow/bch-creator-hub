import React, { useState } from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { truncateAddress } from '@/utils/formatters';
import WalletConnectModal from './WalletConnectModal';

type Props = { fullWidth?: boolean; size?: 'default' | 'sm' | 'lg' };

const WalletConnectButton: React.FC<Props> = ({ fullWidth = false, size = 'default' }) => {
  const { isConnected, address, disconnect, isLoading } = useWallet();
  const [showModal, setShowModal] = useState(false);

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-3 ${fullWidth ? 'w-full' : ''}`}>
        <div className="px-3 py-2 rounded-lg bg-muted/50 text-sm font-mono">
          {truncateAddress(address, 6)}
        </div>
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
