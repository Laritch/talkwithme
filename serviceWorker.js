// Service Worker for Translation App
// Version 1.0

const CACHE_NAME = 'translation-app-cache-v1';
const DYNAMIC_CACHE = 'translation-app-dynamic-cache-v1';

// Resources we want to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
  '/favicon.ico'
];

// Install the service worker and cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Force immediate activation
  self.skipWaiting();
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          // Delete old caches, keeping current versions
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  // Immediate control of clients
  return self.clients.claim();
});

// Intercept fetch requests and serve from cache when possible
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip third-party requests that aren't for translations
  const url = new URL(event.request.url);
  const isThirdParty = !url.origin.includes(self.location.origin);
  const isTranslationAPI = url.href.includes('translation.googleapis.com') ||
                           url.pathname.includes('/api/translate');

  if (isThirdParty && !isTranslationAPI) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return cached response if available
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', event.request.url);
        return cachedResponse;
      }

      // Otherwise, fetch from network
      return fetch(event.request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          // Cache the fetched response
          // We use different cache strategies for different types of requests
          if (isTranslationAPI) {
            // For translation API calls, store in dynamic cache
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
              console.log('[Service Worker] Cached API response:', event.request.url);
            });
          } else if (url.pathname.endsWith('.js') ||
                    url.pathname.endsWith('.css') ||
                    url.pathname.endsWith('.html')) {
            // For app resources, store in main cache
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(error => {
          // Network failed, try to return a fallback for HTML pages
          console.log('[Service Worker] Fetch failed:', error);

          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }

          // For translation API failures in offline mode, we'll need to
          // handle this in the app since we need to show specific UI
          return new Response(
            JSON.stringify({
              error: 'Network request failed, offline mode active',
              offline: true
            }),
            {
              status: 503,
              headers: {'Content-Type': 'application/json'}
            }
          );
        });
    })
  );
});

// Listen for messages from the client
// This can be used to trigger cache updates or handle offline mode
self.addEventListener('message', event => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        ).then(() => {
          console.log('[Service Worker] All caches cleared');
          // Notify the client that caches were cleared
          if (event.source) {
            event.source.postMessage({
              type: 'CACHES_CLEARED',
              timestamp: new Date().getTime()
            });
          }
        });
      })
    );
  }
});

// Handle background sync for offline translations
self.addEventListener('sync', event => {
  if (event.tag === 'sync-translations') {
    console.log('[Service Worker] Syncing pending translations');
    event.waitUntil(syncPendingTranslations());
  }
});

// Function to sync pending translations when online
async function syncPendingTranslations() {
  try {
    // In a real implementation, we would retrieve pending translations
    // from IndexedDB and then send them to the server
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: new Date().getTime()
      });
    });
    return true;
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    return false;
  }
}
