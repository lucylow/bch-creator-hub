import { logger } from './logger';

// Basic service worker registration helper
export function registerSW(): void {
  // Only register service worker in production or if explicitly enabled
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          // Service worker registered successfully
        })
        .catch((err: Error) => {
          // Silently fail - service worker is optional
          logger.warn('Service worker registration failed', { error: err.message });
        });
    });
  }
}

