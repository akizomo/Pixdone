const CACHE_NAME = 'pixtask-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/modal-override.css',
    '/script.js',
    '/animations.js',
    '/messages.js',
    '/firebase.js',
    '/PixDone.png',
    '/PixDone.svg',
    '/manifest.json'
];

// Do not cache API or Firestore traffic (Firebase SDK handles its own caching)
function shouldSkipCache(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return true;
    if (url.pathname.startsWith('/api/')) return true;
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase') || url.hostname.includes('firestore')) return true;
    return false;
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (shouldSkipCache(event.request)) {
        return;
    }
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
