import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { walletService } from '@/services/walletService';
import { toast } from 'sonner';

type Props = { onClose: () => void; open: boolean };

const WalletConnectModal: React.FC<Props> = ({ onClose, open }) => {
  const { connect, availableWallets } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (walletId: string) => {
    setConnecting(walletId);
    setError(null);
    
    try {
      const result = await connect(walletId);
      
      if (result.success) {
        toast.success('Wallet connected successfully!');
        onClose();
      } else {
        setError(result.error || 'Connection failed');
        toast.error(result.error || 'Failed to connect wallet');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  const walletInfoMap: Record<string, { 
    name: string; 
    icon: string;
    description: string;
    downloadUrl?: string;
    recommended?: boolean;
  }> = {
    'paytaca': { 
      name: 'Paytaca', 
      icon: '🦜',
      description: 'Popular BCH wallet with full BIP-322 support',
      downloadUrl: 'https://paytaca.com',
      recommended: true
    },
    'electron-cash': { 
      name: 'Electron Cash', 
      icon: '⚡',
      description: 'Desktop wallet with hardware support',
      downloadUrl: 'https://electroncash.org'
    },
    'generic': { 
      name: 'Browser Wallet', 
      icon: '₿',
      description: 'Generic Bitcoin Cash wallet extension',
      recommended: false
    },
    'libauth': {
      name: 'Libauth Wallet',
      icon: '🔐',
      description: 'Libauth-based BCH wallet',
      recommended: false
    },
    'demo': {
      name: 'Demo Wallet',
      icon: '🧪',
      description: 'Demo mode wallet for testing',
      recommended: false
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">Connect Wallet</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose your Bitcoin Cash wallet</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
                disabled={!!connecting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Connection Error</p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {availableWallets.length === 0 && (
                <div className="p-4 bg-muted/50 rounded-xl text-sm text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-foreground mb-1">No wallet detected</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Install a Bitcoin Cash wallet to get started
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://paytaca.com', '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Install Paytaca Wallet
                  </Button>
                </div>
              )}

              {availableWallets.map((walletId) => {
                const walletInfo = walletInfoMap[walletId] || { 
                  name: walletId, 
                  icon: '👛',
                  description: 'Bitcoin Cash wallet'
                };
                const walletDetails = walletService.getWalletInfo(walletId);
                const isConnecting = connecting === walletId;
                const isRecommended = walletInfo.recommended || walletId === 'paytaca';

                return (
                  <motion.div
                    key={walletId}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative flex items-center justify-between p-4 rounded-xl transition-all
                      ${isConnecting 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
                      }
                      ${isRecommended ? 'ring-2 ring-primary/20' : ''}
                    `}
                  >
                    {isRecommended && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Recommended
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                        ${isRecommended 
                          ? 'bg-gradient-to-br from-primary to-secondary' 
                          : 'bg-muted'
                        }
                      `}>
                        {walletInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-foreground">{walletInfo.name}</div>
                          {walletDetails.supportsBIP322 && (
                            <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded font-medium">
                              BIP-322
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {walletInfo.description}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleConnect(walletId)} 
                      variant="outline"
                      size="sm"
                      disabled={!!connecting}
                      className="ml-3 flex-shrink-0"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="mb-1">
                    <strong>New to Bitcoin Cash wallets?</strong>
                  </p>
                  <p>
                    We recommend installing{' '}
                    <a 
                      className="text-primary hover:underline font-medium" 
                      href="https://paytaca.com" 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      Paytaca
                    </a>
                    {' '}for the best experience with BIP-322 signing.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WalletConnectModal;

