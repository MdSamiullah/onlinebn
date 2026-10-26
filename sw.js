// Serves the unlocked OnlineBN from this browser's own storage (Cache Storage); see scripts/protect-site.mjs.
const BASE = "/onlinebn/", CACHE = "OnlineBN-site";
const PASS = ['sw.js', 'unlock.json', 'site.enc', 'guest.enc', 'LICENSE.txt'];
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE) || e.request.method !== 'GET') return;
  const path = url.pathname.slice(BASE.length);
  if (PASS.includes(path)) return;
  e.respondWith(serve(e.request, path));
});
async function serve(req, path) {
  const cache = await caches.open(CACHE);
  const marker = await cache.match(BASE + '__version');
  if (!marker) return fetch(req); // locked: the unlock page
  if (req.mode === 'navigate') {
    // A new publish (or a withdrawn password) means unlocking again.
    try {
      const u = await (await globalThis.fetch(BASE + 'unlock.json', { cache: 'no-store' })).json();
      if (u.version !== (await marker.text())) { await caches.delete(CACHE); return fetch(req); }
    } catch (_) { /* offline: keep using this device's copy */ }
    return (await cache.match(BASE + 'index.html')) || fetch(req);
  }
  return (await cache.match(BASE + path, { ignoreSearch: true })) || fetch(req);
}
