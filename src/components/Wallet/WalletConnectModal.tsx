import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle2, AlertCircle, Loader2, Shield, Smartphone, Monitor, HardDrive, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { walletService } from '@/services/walletService';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Props = { onClose: () => void; open: boolean };

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'mobile' | 'desktop' | 'hardware' | 'demo';
  downloadUrl?: string;
  recommended?: boolean;
  features?: string[];
}

const walletOptions: WalletOption[] = [
  {
    id: 'demo',
    name: 'Demo Wallet',
    icon: '🧪',
    description: 'Try the app without a real wallet',
    type: 'demo',
    recommended: true,
    features: ['No setup required', 'Explore all features', 'Test transactions']
  },
  {
    id: 'bitcoincom',
    name: 'Bitcoin.com Wallet',
    icon: '💚',
    description: 'User-friendly mobile & desktop wallet',
    type: 'mobile',
    downloadUrl: 'https://wallet.bitcoin.com',
    recommended: true,
    features: ['Buy/sell/swap BCH', 'Beginner friendly', 'Multi-asset support']
  },
  {
    id: 'electron-cash',
    name: 'Electron Cash',
    icon: '⚡',
    description: 'Popular secure light client',
    type: 'desktop',
    downloadUrl: 'https://electroncash.org',
    features: ['Advanced features', 'CashFusion privacy', 'Hardware wallet support']
  },
  {
    id: 'selene',
    name: 'Selene Wallet',
    icon: '🌙',
    description: 'Modern BCH mobile wallet',
    type: 'mobile',
    downloadUrl: 'https://selene.cash',
    features: ['Clean interface', 'Fast payments', 'QR support']
  },
  {
    id: 'paytaca',
    name: 'Paytaca',
    icon: '🦜',
    description: 'BCH wallet with BIP-322 signing',
    type: 'mobile',
    downloadUrl: 'https://paytaca.com',
    features: ['BIP-322 support', 'CashTokens ready', 'Browser extension']
  },
  {
    id: 'atomic',
    name: 'Atomic Wallet',
    icon: '⚛️',
    description: 'Non-custodial multi-asset wallet',
    type: 'desktop',
    downloadUrl: 'https://atomicwallet.io',
    features: ['500+ assets', 'Built-in exchange', 'Staking support']
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '🛡️',
    description: 'Secure mobile crypto wallet',
    type: 'mobile',
    downloadUrl: 'https://trustwallet.com',
    features: ['Multi-chain', 'DApp browser', 'NFT support']
  },
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '🔐',
    description: 'Hardware wallet for maximum security',
    type: 'hardware',
    downloadUrl: 'https://ledger.com',
    features: ['Offline storage', 'PIN protected', 'Recovery phrase backup']
  },
  {
    id: 'trezor',
    name: 'Trezor',
    icon: '🏦',
    description: 'Open-source hardware wallet',
    type: 'hardware',
    downloadUrl: 'https://trezor.io',
    features: ['Air-gapped security', 'Passphrase support', 'Multi-sig ready']
  }
];

const WalletConnectModal: React.FC<Props> = ({ onClose, open }) => {
  const { connect } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const handleConnect = async (wallet: WalletOption) => {
    if (wallet.type === 'hardware' || (wallet.type !== 'demo' && !wallet.id.includes('demo'))) {
      // For external wallets, open download page
      if (wallet.downloadUrl) {
        window.open(wallet.downloadUrl, '_blank');
        toast.info(`Install ${wallet.name} and connect via browser extension`);
      }
      return;
    }

    setConnecting(wallet.id);
    setError(null);
    
    try {
      const result = await connect(wallet.id);
      if (result.success) {
        toast.success('Wallet connected successfully!');
        onClose();
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  const filterWallets = (type: string) => {
    if (type === 'all') return walletOptions;
    return walletOptions.filter(w => w.type === type);
  };

  const typeIcons = {
    mobile: <Smartphone className="w-4 h-4" />,
    desktop: <Monitor className="w-4 h-4" />,
    hardware: <HardDrive className="w-4 h-4" />,
    demo: <QrCode className="w-4 h-4" />
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg glass-card rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Connect BCH Wallet</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choose your Bitcoin Cash wallet</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50"
                  disabled={!!connecting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
              <TabsList className="grid grid-cols-5 gap-1 bg-muted/30 p-1 rounded-lg">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="demo" className="text-xs flex items-center gap-1">
                  {typeIcons.demo} Demo
                </TabsTrigger>
                <TabsTrigger value="mobile" className="text-xs flex items-center gap-1">
                  {typeIcons.mobile} Mobile
                </TabsTrigger>
                <TabsTrigger value="desktop" className="text-xs flex items-center gap-1">
                  {typeIcons.desktop} Desktop
                </TabsTrigger>
                <TabsTrigger value="hardware" className="text-xs flex items-center gap-1">
                  {typeIcons.hardware} Hardware
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4 space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {filterWallets(activeTab).map((wallet) => (
                  <motion.div
                    key={wallet.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all cursor-pointer
                      ${connecting === wallet.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-muted/20 hover:bg-muted/40 border-transparent hover:border-primary/30'
                      }
                      ${wallet.recommended ? 'ring-1 ring-primary/20' : ''}
                    `}
                    onClick={() => handleConnect(wallet)}
                  >
                    {wallet.recommended && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Recommended
                      </span>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                        ${wallet.recommended ? 'bg-gradient-to-br from-primary/20 to-secondary/20' : 'bg-muted/50'}
                      `}>
                        {wallet.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{wallet.name}</span>
                          <span className="px-1.5 py-0.5 text-xs bg-muted rounded capitalize">
                            {wallet.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{wallet.description}</p>
                        
                        {wallet.features && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {wallet.features.map((feature, i) => (
                              <span key={i} className="px-2 py-0.5 text-xs bg-muted/50 rounded-full text-muted-foreground">
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {connecting === wallet.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : wallet.type === 'demo' ? (
                          <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90">
                            Connect
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Get
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>

            {/* Security Info */}
            <div className="p-4 bg-muted/30 border-t border-border/50">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Security Tips</p>
                  <ul className="space-y-1">
                    <li>• Always backup your 12-24 word seed phrase</li>
                    <li>• Never share your private keys or seed phrase</li>
                    <li>• Use hardware wallets for large amounts</li>
                  </ul>
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

