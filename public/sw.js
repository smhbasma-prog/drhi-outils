/* Dr Hi – all tools – Dr Hi: offline cache. Bump VERSION whenever any cached file changes. */
const VERSION = 'drhi-v2';
const PREFIX = 'drhi-';
const FILES = [
  "./",
  "img/drhi.png",
  "fonts/serif-400.woff2",
  "fonts/serif-600.woff2",
  "fonts/serif-700.woff2",
  "fonts/serif-400i.woff2",
  "fonts/plex-400.woff2",
  "fonts/plex-500.woff2",
  "fonts/plex-600.woff2",
  "fonts/plex-700.woff2",
  "fonts/plexar-400.woff2",
  "fonts/plexar-600.woff2",
  "fonts/plexar-700.woff2",
  "ecog/./",
  "ecog/manifest.webmanifest",
  "ecog/img/ps0.jpg",
  "ecog/img/ps1.jpg",
  "ecog/img/ps2.jpg",
  "ecog/img/ps3.jpg",
  "ecog/img/ps4.jpg",
  "ecog/img/ps5.jpg",
  "ecog/img/icon-192.png",
  "ecog/img/icon-512.png",
  "ecog/img/apple-touch-icon.png",
  "tnm-sein/./",
  "tnm-sein/manifest.webmanifest",
  "tnm-sein/img/icon-192.png",
  "tnm-sein/img/icon-512.png",
  "tnm-sein/img/apple-touch-icon.png",
  "figo/./",
  "figo/manifest.webmanifest",
  "figo/img/icon-192.png",
  "figo/img/icon-512.png",
  "figo/img/apple-touch-icon.png"
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
        return (await caches.match(key)) || (await caches.match(key + '/')) || (await caches.match(new URL('./', self.registration.scope).href)) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req)));
});
