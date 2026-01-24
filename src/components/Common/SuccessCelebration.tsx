import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Coins, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessCelebrationProps {
  show: boolean;
  message?: string;
  type?: 'tip' | 'payment' | 'withdrawal' | 'general';
  onComplete?: () => void;
}

const SuccessCelebration = ({ 
  show, 
  message = 'Success!', 
  type = 'general',
  onComplete 
}: SuccessCelebrationProps) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (show) {
      // Generate particles for celebration effect
      setParticles(Array.from({ length: 8 }, (_, i) => i));
      
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'tip':
      case 'payment':
        return <Coins className="w-8 h-8 text-primary" />;
      case 'withdrawal':
        return <Sparkles className="w-8 h-8 text-primary" />;
      default:
        return <CheckCircle className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/5"
          />

          {/* Main celebration card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative bg-card border border-primary/30 rounded-2xl p-8 shadow-xl glow-effect"
          >
            {/* Icon with success ring animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-success-pulse"
            >
              {getIcon()}
            </motion.div>

            {/* Success message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-semibold text-foreground text-center"
            >
              {message}
            </motion.p>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {particles.map((i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    x: '50%', 
                    y: '50%',
                    scale: 1
                  }}
                  animate={{ 
                    opacity: 0, 
                    x: `${50 + (Math.random() - 0.5) * 100}%`,
                    y: `${50 - Math.random() * 60}%`,
                    scale: 0.5
                  }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                  className="absolute w-2 h-2 rounded-full bg-primary"
                  style={{ left: 0, top: 0 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessCelebration;
