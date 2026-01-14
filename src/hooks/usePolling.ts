import { useEffect, useRef } from 'react';

export default function usePolling(
  fn: () => Promise<void> | void, 
  interval = 5000, 
  active = true
) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const tick = async () => {
      try {
        await fn();
      } catch (e) {
        // swallow - caller can handle errors
      }
      if (!cancelled) {
        timerRef.current = window.setTimeout(tick, interval);
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fn, interval, active]);
}



