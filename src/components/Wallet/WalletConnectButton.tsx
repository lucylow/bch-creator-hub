import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

interface WalletConnectButtonProps {
  fullWidth?: boolean;
  size?: 'default' | 'sm' | 'lg';
}

const WalletConnectButton = ({ fullWidth = false, size = 'default' }: WalletConnectButtonProps) => {
  const { connect, isLoading } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading || isConnecting}
      className={`bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold ${fullWidth ? 'w-full' : ''}`}
      size={size}
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4 mr-2" />
      )}
      Connect Wallet
    </Button>
  );
};

export default WalletConnectButton;
