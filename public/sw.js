const CACHE_NAME = 'checkinly-v1.0.0';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/inventory',
  '/dashboard/guests',
  '/dashboard/deposits',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie Cache First pour les ressources statiques
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Stratégie spécifique pour les API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la requête réussit, on la met en cache et on la retourne
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si la requête échoue, on essaie de récupérer depuis le cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Si pas de cache, retourner une réponse offline
              return new Response(JSON.stringify({
                error: 'Offline',
                message: 'Cette requête nécessite une connexion internet'
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // Cache First pour les autres ressources
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retourner la réponse mise en cache
        if (response) {
          return response;
        }

        // Cloner la requête car elle ne peut être utilisée qu'une seule fois
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cloner la réponse car elle ne peut être utilisée qu'une seule fois
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // En cas d'erreur réseau, retourner la page offline si disponible
          if (event.request.destination === 'document') {
            return caches.match('/offline');
          }
        });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1,
        url: data.url || '/'
      },
      actions: [
        {
          action: 'explore',
          title: 'Voir détails',
          icon: '/icons/checkmark.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/icons/xmark.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Checkinly', options)
    );
  }
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Synchroniser les données pending
    const cache = await caches.open(CACHE_NAME);
    const pendingRequests = await cache.keys();
    
    for (const request of pendingRequests) {
      if (request.url.includes('pending-')) {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.log('Sync failed for:', request.url);
        }
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}