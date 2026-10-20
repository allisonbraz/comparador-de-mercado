const CACHE = 'comparador-mercado-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.all(
        ASSETS.map((url) => cache.add(url).catch(() => null))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const sameOrigin = request.url.startsWith(self.location.origin);
            const isTailwind = request.url.includes('cdn.tailwindcss.com');
            if (sameOrigin || isTailwind) {
              const clone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, clone));
            }
          }
          return response;
        })
        .catch(() => cached);

      // Rede primeiro quando online (HTML sempre fresco); cache como fallback offline
      if (request.mode === 'navigate') {
        return network.then((r) => r || cached).catch(() => cached);
      }
      return cached || network;
    })
  );
});
