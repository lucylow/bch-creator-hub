import { logger } from './logger';

// Basic service worker registration helper
export function registerSW(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          // Service worker registered successfully
        })
        .catch((err: Error) => {
          logger.warn('Service worker registration failed', { error: err.message });
        });
    });
  }
}

