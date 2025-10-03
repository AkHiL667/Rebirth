const CACHE_NAME = 'rebirth-v1.0.1';
const STATIC_CACHE = 'rebirth-static-v1.0.1';
const DYNAMIC_CACHE = 'rebirth-dynamic-v1.0.1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Rebirth_icon.png',
  '/favicon.ico',
  // Add other static assets as needed
];

// Dynamic routes to cache
const DYNAMIC_ROUTES = [
  '/',
  '/home',
  '/achievements',
  '/goals',
  '/profile'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        // Cache assets individually to handle 404s gracefully
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => 
            cache.add(asset).catch(error => {
              console.warn(`Service Worker: Failed to cache ${asset}:`, error);
              return null; // Don't fail the entire operation
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;
        console.log(`Service Worker: Cached ${successful} assets, ${failed} failed`);
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
        return self.skipWaiting(); // Still activate the service worker
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip source files and development assets
  if (url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx') || 
      url.pathname.includes('/src/') || 
      url.pathname.includes('node_modules') ||
      url.pathname.includes('vite')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Cache dynamic content
            if (DYNAMIC_ROUTES.some(route => url.pathname === route || url.pathname.startsWith(route + '/'))) {
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return networkResponse;
          })
          .catch(() => {
            // If network fails, try to serve a fallback
            if (url.pathname === '/' || url.pathname === '/home') {
              return caches.match('/index.html');
            }
            
            // For other routes, return a basic offline page
            return new Response(
              `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Offline - Rebirth</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 100vh;
                      margin: 0;
                      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                      color: white;
                      text-align: center;
                    }
                    .offline-container {
                      max-width: 400px;
                      padding: 2rem;
                    }
                    .offline-icon {
                      font-size: 4rem;
                      margin-bottom: 1rem;
                    }
                    h1 { margin-bottom: 1rem; }
                    p { opacity: 0.8; margin-bottom: 2rem; }
                    .retry-btn {
                      background: #10b981;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 8px;
                      font-size: 16px;
                      cursor: pointer;
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <div class="offline-icon">📱</div>
                    <h1>You're Offline</h1>
                    <p>Don't worry! Your streak data is saved locally. Check your connection and try again.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
                  </div>
                </body>
              </html>
              `,
              {
                headers: {
                  'Content-Type': 'text/html',
                },
              }
            );
          });
      })
  );
});

// Background sync for check-ins
self.addEventListener('sync', (event) => {
  if (event.tag === 'checkin-sync') {
    console.log('Service Worker: Background sync for check-ins');
    event.waitUntil(
      // Handle background sync logic here
      // For now, just log it
      Promise.resolve()
    );
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your daily check-in!',
    icon: '/Rebirth_icon.png',
    badge: '/Rebirth_icon.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'checkin',
        title: 'Check In',
        icon: '/Rebirth_icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/Rebirth_icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Rebirth', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'checkin') {
    event.waitUntil(
      clients.openWindow('/?action=checkin')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});