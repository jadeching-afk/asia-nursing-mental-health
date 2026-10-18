// Bump the version whenever any precached file changes. New versions activate
// after existing app windows close, preserving an in-progress quiz.
const PREFIX = 'asia-mental-nursing-pwa-';
const CACHE = PREFIX + '20261018-v1';
const ASSETS = [
  './', './index.html', './styles.css', './app.mjs', './bank.mjs', './quiz.mjs',
  './pwa.mjs', './manifest.webmanifest', './apple-touch-icon.png',
  './icon-192.png', './icon-512.png'
];
const allowed = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match('./index.html')) || fetch(event.request)));
  } else if (allowed.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match(event.request)) || fetch(event.request)));
  }
});
