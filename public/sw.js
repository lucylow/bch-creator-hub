// public/sw.js
const CACHE_NAME = 'bch-creator-hub-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  // static assets you want to pre-cache (fonts, logos)
  '/favicon.ico'
];

// install - cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// activate - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null));
      await self.clients.claim();
    })()
  );
});

// network-first for API, cache-first for navigation & static
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // always bypass non-GET requests
  if (request.method !== 'GET') return;

  // API requests => network-first with fallback to cache
  if (request.url.includes('/api/') || request.url.includes('/uploads/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // navigation (pages) => network-first, fallback to offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // store HTML responses in cache
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/offline.html');
        })
    );
    return;
  }

  // static assets => cache-first
  event.respondWith(
    caches.match(request)
      .then((cached) => cached || fetch(request).then(res => {
        // cache new static requests (optionally)
        if (request.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return res;
      }).catch(() => {
        // fallback to a placeholder or offline.html for navigations
        if (request.destination === 'image') {
          // return a tiny blank image data URI
          return new Response(
            atob('R0lGODdhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='),
            { headers: { 'Content-Type': 'image/gif' } }
          );
        }
      }))
  );
});

