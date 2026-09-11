/* Heartwood Defense service worker.
 *
 * The game is a single self-contained HTML file, so "offline support" is a
 * very short list: cache the shell, serve it for any navigation, and let
 * network-first keep the shell fresh when the player is online.
 */
const VERSION = 'heartwood-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      // One bad entry must not abort the whole install.
      await Promise.allSettled(SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

/** Fetch the shell from the network and refresh the cached copy. */
async function networkFirst(request, fallback) {
  const cache = await caches.open(VERSION);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(fallback ?? request, fresh.clone());
    return fresh;
  } catch {
    const hit = await cache.match(fallback ?? request);
    if (hit) return hit;
    throw new Error('offline and not cached');
  }
}

/** Immutable assets (icons, fonts) — cache first, fill on demand. */
async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(request);
  if (hit) return hit;
  const fresh = await fetch(request);
  if (fresh && (fresh.ok || fresh.type === 'opaque')) cache.put(request, fresh.clone());
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigations: always resolve to the cached shell when the network is gone.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await networkFirst(request, '/index.html');
        } catch {
          const cache = await caches.open(VERSION);
          return (await cache.match('/index.html')) ?? (await cache.match('/')) ?? Response.error();
        }
      })(),
    );
    return;
  }

  if (url.origin === self.location.origin) {
    // Hashed build output + icons: safe to serve from cache.
    if (/\.(?:js|css|png|svg|webmanifest|woff2?)$/.test(url.pathname)) {
      event.respondWith(cacheFirst(request));
      return;
    }
    event.respondWith(
      (async () => {
        try {
          return await networkFirst(request);
        } catch {
          return Response.error();
        }
      })(),
    );
    return;
  }

  // Google Fonts: the woff2 files are content-addressed, the CSS is not.
  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      (async () => {
        try {
          return await networkFirst(request);
        } catch {
          const cache = await caches.open(VERSION);
          return (await cache.match(request)) ?? Response.error();
        }
      })(),
    );
  }
});
