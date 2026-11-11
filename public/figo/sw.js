/* FIGO ovaire – Dr Hi: offline cache. Bump VERSION whenever any cached file changes. */
const VERSION = 'figo-v3.12';
const PREFIX = 'figo-';
const FILES = [
  "./",
  "manifest.webmanifest",
  "img/icon-192.png",
  "img/icon-512.png",
  "img/apple-touch-icon.png",
  "../img/drhi.png",
  "../fonts/serif-400.woff2",
  "../fonts/serif-600.woff2",
  "../fonts/serif-700.woff2",
  "../fonts/serif-400i.woff2",
  "../fonts/plex-400.woff2",
  "../fonts/plex-500.woff2",
  "../fonts/plex-600.woff2",
  "../fonts/plex-700.woff2"
];
// Cloudflare redirects index.html to the folder URL; a redirected response cannot answer a navigation, so store a clean copy.
async function clean(r){ if (!r || !r.redirected) return r; const b = await r.blob(); return new Response(b, {status: r.status, statusText: r.statusText, headers: r.headers}); }
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(f =>
    fetch(new Request(f, {cache: 'reload'})).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return clean(r); }).then(r => c.put(f, r))
  ))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Pages: network first (updates when online), cached copy when offline. Other files: cache first.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate'){
    e.respondWith((async () => {
      const u = new URL(req.url), key = u.origin + u.pathname;
      try {
        const r = await fetch(req);
        if (r.ok){ const copy = await clean(r.clone()); (await caches.open(VERSION)).put(key, copy); }
        return r;
      } catch (err) {
        const c = await caches.open(VERSION);   // only this version's own copies, never a stale cache left by another version
        return (await c.match(key)) || (await c.match(key + '/')) || (await c.match(new URL('./', self.registration.scope).href)) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.open(VERSION).then(c => c.match(req, {ignoreSearch: true})).then(hit => hit || fetch(req)));
});
