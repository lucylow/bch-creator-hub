/**
 * Demo Mode Configuration
 * 
 * Set DEMO_MODE to true to enable mock data and disable real blockchain interactions.
 * This allows the app to work perfectly in demo/judge/offline mode.
 */
export const DEMO_MODE = true;

export const DEMO_CONFIG = {
  chain: "bitcoincash",
  network: "chipnet",
  blockHeight: 912345,
  timestamp: "2026-01-05T21:00:00Z",
};

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  // Allow override via environment variable
  if (import.meta.env.VITE_DEMO_MODE !== undefined) {
    return import.meta.env.VITE_DEMO_MODE === 'true';
  }
  return DEMO_MODE;
}



