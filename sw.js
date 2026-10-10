// 밥심 서비스워커: 오프라인에서도 열리도록 앱 셸 캐시 (네트워크 우선)
const CACHE = 'bapsim-v46';
const ASSETS = ['./', './index.html', './engine.js', './app.js', './app.css', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === location.origin;
  e.respondWith(fetch(e.request, same ? { cache:'no-cache' } : {}).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
