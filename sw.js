const CACHE_VERSION = 'v1';
const CORE_CACHE = `ravishing-beaute-core-${CACHE_VERSION}`;
const IMAGE_CACHE = `ravishing-beaute-images-${CACHE_VERSION}`;
const FALLBACK_CACHE = `ravishing-beaute-fallback-${CACHE_VERSION}`;

const CORE_PAGES = [
  '/',
  '/index.html',
  '/gallery.html',
  '/services.html',
  '/booking.html',
  '/contact.html',
  '/about.html',
  '/policies.html',
  '/reviews.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) =>
      Promise.allSettled(
        CORE_PAGES.map((path) =>
          fetch(path)
            .then((response) => {
              if (!response.ok) throw new Error(`Failed to fetch ${path}`);
              return cache.put(path, response.clone());
            })
            .catch(() => undefined)
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => ![CORE_CACHE, IMAGE_CACHE, FALLBACK_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  const acceptHeader = request.headers.get('Accept') || '';

  if (acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CORE_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  if (request.destination === 'image' || /\.(png|jpe?g|gif|webp|avif|svg)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const copy = networkResponse.clone();
              caches.open(IMAGE_CACHE).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => caches.match('/icons/icon-192.svg'));
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const copy = networkResponse.clone();
          caches.open(FALLBACK_CACHE).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
