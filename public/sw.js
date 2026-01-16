// HytaleDocs Service Worker - Optimized for Performance
const CACHE_VERSION = 'v3';
const BUILD_ID = '__BUILD_ID__'; // Will be replaced during build or use timestamp
const STATIC_CACHE = `hytaledocs-static-${CACHE_VERSION}`;
const PAGES_CACHE = `hytaledocs-pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `hytaledocs-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/en',
  '/fr',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching essential assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('hytaledocs-') &&
                   name !== STATIC_CACHE &&
                   name !== PAGES_CACHE &&
                   name !== IMAGES_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Helper: is documentation page?
function isDocPage(url) {
  return url.pathname.includes('/docs/');
}

// Helper: is static asset?
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)
  );
}

// Helper: is image?
function isImage(request) {
  return (
    request.destination === 'image' ||
    request.url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/)
  );
}

// Strategy: Cache First (for static assets)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return null;
  }
}

// Strategy: Stale While Revalidate (for pages - instant load + background update)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  // Return cached immediately, or wait for network
  return cachedResponse || fetchPromise;
}

// Strategy: Network First with Cache Fallback (for dynamic content)
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || null;
  }
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Handle external requests (fonts, etc.)
  if (url.origin !== self.location.origin) {
    // Cache Google Fonts aggressively
    if (url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    return;
  }

  // Skip API routes - always fresh
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets (JS, CSS, fonts) - Cache First
  if (isStaticAsset(request)) {
    event.respondWith(
      cacheFirst(request, STATIC_CACHE).then(response => {
        return response || fetch(request);
      })
    );
    return;
  }

  // Images - Cache First with long expiry
  if (isImage(request)) {
    event.respondWith(
      cacheFirst(request, IMAGES_CACHE).then(response => {
        return response || fetch(request);
      })
    );
    return;
  }

  // Documentation pages - Stale While Revalidate (instant + fresh)
  if (isDocPage(url)) {
    event.respondWith(
      staleWhileRevalidate(request, PAGES_CACHE).then(response => {
        if (response) return response;
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, PAGES_CACHE).then(response => {
        if (response) return response;
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    networkFirst(request, STATIC_CACHE).then(response => {
      return response || fetch(request);
    })
  );
});

// Background sync for offline actions (future use)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Precache specific pages on demand
  if (event.data && event.data.type === 'CACHE_PAGES') {
    const pages = event.data.pages || [];
    caches.open(PAGES_CACHE).then(cache => {
      pages.forEach(page => {
        cache.add(page).catch(() => {});
      });
    });
  }

  // Get current version info
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      buildId: BUILD_ID,
    });
  }
});

// Notify clients about updates
function notifyClientsAboutUpdate() {
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATE_AVAILABLE',
        version: CACHE_VERSION,
      });
    });
  });
}
