// Service Worker for LEO K PWA - Full Offline Support
const CACHE_NAME = 'leo-k-v2';
const STATIC_CACHE = 'leo-k-static-v2';
const DYNAMIC_CACHE = 'leo-k-dynamic-v2';

// Essential pages and assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/game',
  '/offline',
  '/learning',
  '/styles/globals.css',
  '/manifest.json',
  // Main game pages
  '/mleo-runner',
  '/mleo-flyer',
  '/mleo-catcher',
  '/mleo-puzzle',
  '/mleo-memory',
  '/mleo-penalty',
  // Offline games
  '/offline/tic-tac-toe',
  '/offline/rock-paper-scissors',
  '/offline/tap-battle',
  '/offline/memory-match',
  // Learning games
  '/learning/math-master',
  '/learning/geometry-master',
  '/learning/english-master',
  // Essential images
  '/images/leo-intro.png',
  '/images/leo-icons/android-chrome-192x192.png',
  '/images/leo-icons/android-chrome-512x512.png',
  '/images/leo-icons/android-chrome-maskable-192x192.png',
  '/images/leo-icons/android-chrome-maskable-512x512.png',
  // Game images
  '/images/dog.png',
  '/images/leo2.png',
  '/images/leo.png',
  '/images/coin.png',
  '/images/leo-logo.png',
  '/images/diamond.png',
  '/images/magnet.png',
  '/images/coin2.png',
  '/images/obstacle.png',
  '/images/obstacle1.png',
  '/images/ball.png',
  '/images/leo-keeper.png',
  '/images/penalty-bg.png',
  '/images/game-day.png',
  '/images/game-evening.png',
  '/images/game-night.png',
  '/images/game-space.png',
  '/images/game-park.png',
  '/images/game1.png',
  '/images/game2.png',
  '/images/game3.png',
  '/images/game4.png',
  '/images/game10.png',
  // Card images for memory game (first 10, rest will be cached dynamically)
  '/images/card/shiba1.png',
  '/images/card/shiba2.png',
  '/images/card/shiba3.png',
  '/images/card/shiba4.png',
  '/images/card/shiba5.png',
  // Candy images for puzzle
  '/images/candy/heart.png',
  '/images/candy/circle.png',
  '/images/candy/square.png',
  '/images/candy/drop.png',
  '/images/candy/diamond.png',
  '/images/candy/star.png',
  // Essential sounds
  '/sounds/bg-music.mp3',
  '/sounds/jump.mp3',
  '/sounds/coin.mp3',
  '/sounds/game-over.mp3',
  '/sounds/flap2.mp3',
  '/sounds/win.mp3',
  '/sounds/lose.mp3',
  '/sounds/bomb.mp3',
  '/sounds/flap.mp3',
];

// Patterns for dynamic caching
const IMAGE_PATTERNS = [
  /^\/images\/.*\.(png|jpg|jpeg|gif|webp|svg)$/i,
  /^\/images\/card\/.*\.png$/i,
  /^\/images\/candy\/.*\.png$/i,
];

const SOUND_PATTERNS = [
  /^\/sounds\/.*\.(mp3|wav|ogg)$/i,
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache in batches to avoid timeout
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.log('[SW] Some assets failed to cache:', err);
          // Continue even if some assets fail
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Helper function to check if request should be cached
function shouldCache(request) {
  const url = new URL(request.url);
  
  // Don't cache external resources
  if (url.origin !== self.location.origin) {
    return false;
  }
  
  // Check patterns
  const pathname = url.pathname;
  const isImage = IMAGE_PATTERNS.some(pattern => pattern.test(pathname));
  const isSound = SOUND_PATTERNS.some(pattern => pattern.test(pathname));
  
  // Cache images, sounds, CSS, JS, and HTML
  return (
    request.method === 'GET' &&
    (
      request.destination === 'image' ||
      request.destination === 'audio' ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'document' ||
      request.destination === 'font' ||
      url.pathname.startsWith('/_next/static') ||
      url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/sounds/') ||
      url.pathname.startsWith('/styles/') ||
      isImage ||
      isSound
    )
  );
}

// Fetch event - Only handle static assets, let Next.js handle pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip Next.js internal requests and API routes
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    request.destination === 'document' ||
    request.destination === 'script'
  ) {
    // Let Next.js handle these
    return;
  }

  // Only handle static assets (images, sounds, CSS from public folder)
  if (
    request.destination === 'image' ||
    request.destination === 'audio' ||
    (request.destination === 'style' && url.pathname.startsWith('/styles/')) ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/sounds/')
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // If fetch fails, return 404 for images/sounds
              return new Response('', { status: 404 });
            });
        })
    );
  }
});

// Background sync for offline actions (optional, for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

function syncScores() {
  // Future: sync scores to server when back online
  return Promise.resolve();
}

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
