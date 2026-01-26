import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'theme';

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    setDark(isDark);
  }, []);

  const setTheme = (value: 'light' | 'dark') => {
    const isDark = value === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY, value);
    setDark(isDark);
  };

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    setTheme(next);
  };

  return { theme: dark ? 'dark' : 'light', dark, setTheme, toggle };
}

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline';
}

export function ThemeToggle({ className, size = 'default', variant = 'ghost' }: ThemeToggleProps) {
  const { dark, toggle } = useTheme();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn('shrink-0', className)}
    >
      {dark ? (
        <Sun className="h-4 w-4 md:h-[1.125rem] md:w-[1.125rem]" />
      ) : (
        <Moon className="h-4 w-4 md:h-[1.125rem] md:w-[1.125rem]" />
      )}
    </Button>
  );
}
