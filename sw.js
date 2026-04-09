const CACHE = 'meus-gastos-v24';
const ASSETS = [
  './',
  './index.html',
  './css/base.css',
  './css/mobile.css',
  './css/modals.css',
  './css/search.css',
  './css/auth.css',
  './js/data.js',
  './js/firebase-init.js',
  './js/firebase.js',
  './js/icons.js',
  './js/utils.js',
  './js/app.js',
  './js/overview.js',
  './js/despesas.js',
  './js/notif.js',
  './js/receitas.js',
  './js/lancamentos.js',
  './js/profiles.js',
  './js/init.js',
  './js/search.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (!url.startsWith('http')) return;
  let parsedUrl;
  try { parsedUrl = new URL(url); } catch (_) { return; }
  const h = parsedUrl.hostname;
  if (h.endsWith('.firebase.com') || h.endsWith('.firebaseapp.com') ||
      h.endsWith('.firebaseio.com') || h.endsWith('.googleapis.com') ||
      h === 'googleapis.com' || h.endsWith('.gstatic.com') || h === 'gstatic.com') {
    e.respondWith(fetch(e.request));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (e.request.method === 'GET' && res.ok)
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached)
    )
  );
});
