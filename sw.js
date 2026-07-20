/* PANTA offline service worker — precache the app shell, serve cache-first. */
const CACHE = 'panta-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  ]));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // never cache POST etc.
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;       // let cross-origin (if any) pass through

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() =>                                   // offline: serve whatever shell we have
      caches.match('./index.html').then(r => r || caches.match('./'))
    ))
  );
});
