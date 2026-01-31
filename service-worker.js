const CACHE_NAME = 'transport-v1';
const urlsToCache = [
    '/test/index.html',
    '/index.html',
    '/qr.html',
    '/payment.html',
    '/settings.html',
    '/transport.html',
    '/index.js'
    // Note: External CDN resources are not cached to avoid stale cache issues
    // They will be fetched from network when available
    // 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
    // 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
