import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { onClose: () => void; open: boolean };

const walletNames: Record<string, { name: string; supportsBIP322: boolean }> = {
  'paytaca': { name: 'Paytaca', supportsBIP322: true },
  'electron-cash': { name: 'Electron Cash', supportsBIP322: false },
  'generic': { name: 'Browser Wallet', supportsBIP322: true },
  'paybutton': { name: 'PayButton', supportsBIP322: true },
};

const WalletConnectModal: React.FC<Props> = ({ onClose, open }) => {
  const { connect, availableWallets } = useWallet();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative w-full md:max-w-md glass-card rounded-2xl p-6 m-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">Connect Wallet</h3>
              <button 
                onClick={onClose} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {availableWallets.length === 0 && (
                <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
                  No native BCH wallet detected. Try installing Paytaca or Electron Cash, or use a browser wallet that supports BIP-322.
                </div>
              )}

              {availableWallets.map((walletId) => {
                const walletInfo = walletNames[walletId] || { name: walletId, supportsBIP322: false };
                return (
                  <div 
                    key={walletId} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                        {walletInfo.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{walletInfo.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {walletInfo.supportsBIP322 ? 'BIP-322' : 'Legacy'}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={async () => { 
                        await connect(walletId); 
                        onClose(); 
                      }} 
                      variant="outline"
                    >
                      Connect
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Need help?{' '}
                <a 
                  className="text-primary hover:underline" 
                  href="https://docs.paywallrouter.bch" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  Wallet setup guide
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WalletConnectModal;

