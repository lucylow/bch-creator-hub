import { useState, useEffect } from 'react';
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-80 transition-opacity group"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Route className="w-7 h-7 text-primary" />
            </motion.div>
            <span className="hidden sm:inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BCHRouter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isConnected && navLinks.map((link) => {
              const isActive = location.pathname === link.path || 
                (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-primary/10 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <link.icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-primary' : ''}`} />
                  <span className="relative z-10 font-medium">{link.label}</span>
                  {!isActive && (
                    <span className="absolute inset-0 rounded-lg bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isConnected ? (
              <>
                {creator && (
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                      {creator.displayName?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      {truncateAddress(address, 4)}
                    </span>
                  </motion.div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors relative z-50"
            aria-label="Toggle menu"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 bg-background border-l border-border shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {isConnected ? (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center font-bold text-lg text-primary border-2 border-primary/20">
                        {creator?.displayName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {creator?.displayName || 'Creator'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate font-mono">
                          {truncateAddress(address)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {navLinks.map((link, index) => {
                        const isActive = location.pathname === link.path || 
                          (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
                        return (
                          <motion.div
                            key={link.path}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link
                              to={link.path}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              <link.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                              <span className="font-medium">{link.label}</span>
                              {isActive && (
                                <motion.div
                                  layoutId="mobileActiveIndicator"
                                  className="ml-auto w-2 h-2 rounded-full bg-primary"
                                />
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        className="w-full justify-center border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                        onClick={handleDisconnect}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect Wallet
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Connect your wallet to access the dashboard
                    </p>
                    <WalletConnectButton fullWidth />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppNavigation;
