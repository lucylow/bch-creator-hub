import { useEffect, useRef } from 'react';

export interface UsePollingOptions {
  /** Polling interval in ms */
  interval?: number;
  /** Whether polling is active */
  active?: boolean;
  /** Called when the poll callback throws. If not provided, errors are logged and swallowed. */
  onError?: (error: unknown) => void;
}

/**
 * Poll a callback on an interval. Optional onError is called when the callback throws.
 */
export default function usePolling(
  fn: () => Promise<void> | void,
  intervalOrOptions: number | UsePollingOptions = 5000,
  active = true
) {
  const opts =
    typeof intervalOrOptions === 'object'
      ? intervalOrOptions
      : { interval: intervalOrOptions, active, onError: undefined };
  const interval = opts.interval ?? 5000;
  const isActive = opts.active ?? active;
  const onError = opts.onError;

  const timerRef = useRef<number | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;
    const tick = async () => {
      try {
        await fn();
      } catch (e) {
        onErrorRef.current?.(e);
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
  }, [fn, interval, isActive]);
}



