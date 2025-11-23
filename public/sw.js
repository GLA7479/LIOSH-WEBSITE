// Service Worker for LEO K PWA
const CACHE_NAME = 'leo-k-v1';
const urlsToCache = [
  '/',
  '/game',
  '/offline',
  '/learning',
  '/styles/globals.css',
  '/images/leo-intro.png',
  '/images/leo-icons/android-chrome-192x192.png',
  '/images/leo-icons/android-chrome-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then((response) => {
          // Don't cache non-GET requests or non-successful responses
          if (event.request.method !== 'GET' || !response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Handle push notifications (optional, for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/images/leo-icons/android-chrome-192x192.png',
    badge: '/images/leo-icons/android-chrome-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'leo-k-notification'
  };

  event.waitUntil(
    self.registration.showNotification('LEO K', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

