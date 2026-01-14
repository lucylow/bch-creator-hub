import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BarChart2, Link2, Settings, LogOut, Route, Wallet, Image } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useCreator } from '@/contexts/CreatorContext';
import WalletConnectButton from '@/components/Wallet/WalletConnectButton';
import { truncateAddress } from '@/utils/formatters';
import { Button } from '@/components/ui/button';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/links', label: 'Payment Links', icon: Link2 },
  { path: '/nfts', label: 'NFTs', icon: Image },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const AppNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, address, disconnect } = useWallet();
  const { creator } = useCreator();

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
    setIsOpen(false);
  };

  // Don't show app navigation on landing page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-md bg-background/95 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Route className="w-7 h-7 text-primary" />
            <span className="hidden sm:inline">BCHRouter</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isConnected && navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === link.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isConnected ? (
              <>
                {creator && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {creator.displayName?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {truncateAddress(address, 4)}
                    </span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <WalletConnectButton />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-background border-b border-border p-6 md:hidden"
          >
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {creator?.displayName?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="font-medium">{creator?.displayName || 'Creator'}</p>
                    <p className="text-sm text-muted-foreground">{truncateAddress(address)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === link.path
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={handleDisconnect}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <WalletConnectButton fullWidth />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppNavigation;
