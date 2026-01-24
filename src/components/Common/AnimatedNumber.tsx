import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
}

const AnimatedNumber = ({ 
  value, 
  duration = 0.8,
  formatFn = (v) => v.toLocaleString(),
  className 
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  const spring = useSpring(0, { 
    damping: 30, 
    stiffness: 100,
    duration: duration * 1000
  });
  
  const display = useTransform(spring, (current) => formatFn(Math.round(current)));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(latest as unknown as number);
    });
    return unsubscribe;
  }, [display]);

  return (
    <motion.span 
      className={className}
      key={value}
      initial={{ opacity: 0.7, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {display}
    </motion.span>
  );
};

export default AnimatedNumber;
