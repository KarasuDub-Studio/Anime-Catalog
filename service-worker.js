// Мінімальний service worker: вмикає можливість "Встановити застосунок"
// (Add to Home Screen / Install app) і дає базову офлайн-роботу для
// вже відкритої сторінки. Дані застосунку зберігаються в localStorage
// самої сторінки і цим service worker'ом не керуються.

const CACHE_NAME = 'anime-catalog-v1';
const PRECACHE_URLS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}) // не блокувати встановлення, якщо якийсь файл не підвантажився
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first для HTML (щоб завжди підвантажувати свіжу версію, коли є мережа),
// cache-first для решти (іконки, маніфест) — з фолбеком у кеш при відсутності мережі.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isHTML = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
