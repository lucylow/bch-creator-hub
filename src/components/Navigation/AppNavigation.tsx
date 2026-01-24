import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BarChart2, Link2, Settings, LogOut, Route, Wallet, Image, ChevronRight, ArrowUpDown, ArrowUpRight, Users, HelpCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useCreator } from '@/contexts/CreatorContext';
import WalletConnectButton from '@/components/Wallet/WalletConnectButton';
import { truncateAddress } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
  { path: '/links', label: 'Payment Links', icon: Link2, exact: false },
  { path: '/nfts', label: 'NFTs', icon: Image, exact: true },
  { path: '/transactions', label: 'Transactions', icon: ArrowUpDown, exact: true },
  { path: '/withdrawals', label: 'Withdrawals', icon: ArrowUpRight, exact: true },
  { path: '/supporters', label: 'Supporters', icon: Users, exact: true },
  { path: '/analytics', label: 'Analytics', icon: BarChart2, exact: true },
  { path: '/settings', label: 'Settings', icon: Settings, exact: true },
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

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
    setIsOpen(false);
  };

  // Check if route matches (handles nested routes)
  const isActiveRoute = (path: string, exact: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Don't show app navigation on landing page or payment page
  if (location.pathname === '/' || location.pathname.startsWith('/pay/')) {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-md bg-background/95 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-80 transition-opacity">
            <Route className="w-7 h-7 text-primary" />
            <span className="hidden sm:inline">BCHRouter</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {isConnected && navLinks.map((link) => {
              const isActive = isActiveRoute(link.path, link.exact ?? false);
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.exact}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 relative',
                    'text-muted-foreground hover:text-foreground',
                    isActive && 'bg-primary/10 text-primary'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="font-medium">{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg bg-primary/10 -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </NavLink>
              );
            })}
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
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 top-16 bottom-0 z-40 bg-background border-b border-border overflow-y-auto md:hidden"
            >
              <div className="p-6 space-y-4">
                {isConnected ? (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                        {creator?.displayName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{creator?.displayName || 'Creator'}</p>
                        <p className="text-sm text-muted-foreground truncate">{truncateAddress(address)}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {navLinks.map((link, index) => {
                        const isActive = isActiveRoute(link.path, link.exact ?? false);
                        return (
                          <motion.div
                            key={link.path}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <NavLink
                              to={link.path}
                              end={link.exact}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                'text-muted-foreground hover:bg-muted',
                                isActive && 'bg-primary/10 text-primary font-medium'
                              )}
                            >
                              <link.icon className="w-5 h-5 flex-shrink-0" />
                              <span>{link.label}</span>
                              {isActive && (
                                <ChevronRight className="w-4 h-4 ml-auto text-primary" />
                              )}
                            </NavLink>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        onClick={handleDisconnect}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect Wallet
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="pt-8">
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
