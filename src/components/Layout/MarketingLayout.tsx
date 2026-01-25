import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const siteLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/help', label: 'Help' },
  { to: '/dashboard', label: 'Dashboard' },
];

const MarketingLayout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="fixed top-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl bg-background/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-80 transition-opacity"
          >
            <Route className="w-7 h-7 text-primary" />
            <span className="font-heading font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BCH Paywall Router
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {siteLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-foreground/80 hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" className="border-border hover:border-primary hover:text-primary font-semibold">
                Dashboard
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 bg-background border-l border-border shadow-2xl md:hidden overflow-y-auto"
              >
                <div className="p-6 space-y-4 pt-16">
                  {siteLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-lg font-medium ${
                        location.pathname === link.to ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="pt-4 border-t border-border">
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">Go to Dashboard</Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-20 relative z-10">{children}</main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;
