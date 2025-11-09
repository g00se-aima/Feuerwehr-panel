const CACHE_NAME = 'feuerwehr-app-v1';
const CORE_ASSETS = [
  'index.html',
  'spa.js',
  'style.css',
  'manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Simple cache-first strategy for app shell
  event.respondWith(
    caches.match(event.request).then(resp => {
      if (resp) return resp;
      return fetch(event.request).then(r => {
        // Only cache same-origin GET requests
        try {
          if (event.request.method === 'GET' && r && r.status === 200 && r.type !== 'opaque') {
            const copy = r.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          }
        } catch (_) {}
        return r;
  }).catch(() => caches.match('index.html'));
    })
  );
});
