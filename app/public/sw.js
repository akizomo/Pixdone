self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal fetch handler: keeps installability; network-first by default.
self.addEventListener('fetch', () => {
  // no-op
});

