// This service worker is managed by next-pwa
// For more info, see: https://github.com/shadowwalker/next-pwa
// The next-pwa plugin will add the runtime caching for this service worker

// Custom code can be added here

// Cache the core files needed for offline usage
const CACHE_NAME = 'ins-cht-sys-cache-v1';
const OFFLINE_URL = '/offline';

// Install event - setup the offline page cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache basic offline page resources
      return cache.addAll([
        OFFLINE_URL,
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        '/manifest.json'
      ]);
    })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches if they don't match the current version
            return cacheName.startsWith('ins-cht-sys-cache-') && cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );

  // Take control of all clients immediately
  event.waitUntil(clients.claim());
});

// Special handling for navigation requests
self.addEventListener('fetch', (event) => {
  // Only care about navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline and navigating, serve the offline page
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }
});

// Listen for push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Instructor Chat';
    const options = {
      body: data.message || 'New notification',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: data.tag || 'default',
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get the URL to navigate to when clicking the notification
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({type: 'window'}).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
