// Service worker for مجلس الحبايب PWA
// Caches the app shell so it opens instantly and works offline.
// The Excel data itself is still fetched fresh from GitHub each time
// you tap "مزامنة من GitHub" inside the app (unchanged from before).

const CACHE_NAME = 'majlis-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache the live Excel data or GitHub API calls — always go to network
  if (url.hostname.includes('raw.githubusercontent.com') || url.hostname.includes('api.github.com')) {
    return; // let the browser handle it normally
  }

  // App shell: cache-first, falling back to network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Optionally cache new same-origin GET requests
        if (event.request.method === 'GET' && url.origin === location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
