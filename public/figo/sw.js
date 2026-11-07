/* FIGO ovaire – Dr Hi: offline cache. Bump VERSION whenever any cached file changes. */
const VERSION = 'figo-v3.5';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', '../img/drhi.png',
  '../fonts/serif-400.woff2', '../fonts/serif-600.woff2', '../fonts/serif-700.woff2', '../fonts/serif-400i.woff2',
  '../fonts/plex-400.woff2', '../fonts/plex-500.woff2', '../fonts/plex-600.woff2', '../fonts/plex-700.woff2'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('figo-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Page: network first (gets updates when online), cache when offline. Other files: cache first.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req)));
});
