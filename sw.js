/* ─── Lucid Service Worker ─── */

const CACHE_NAME = 'lucid-v4-cache-v1';

// Resources to pre-cache on install
const PRECACHE_URLS = [
  './Lucid%20v4.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  'https://fonts.googleapis.com/css2?family=Gloock&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'
];

// ─── Install: pre-cache core assets ───────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets strictly; CDN assets best-effort
      const local = PRECACHE_URLS.filter(u => u.startsWith('.'));
      const remote = PRECACHE_URLS.filter(u => u.startsWith('http'));
      return cache.addAll(local).then(() =>
        Promise.allSettled(remote.map(url => cache.add(url)))
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: network-first for HTML, cache-first for everything else ────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for the main HTML — ensures updates are picked up promptly
  if (url.pathname.endsWith('.html') || url.pathname === '/Lucid/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for all other assets (JS, CSS, fonts, icons)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
