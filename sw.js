const CACHE = 'meus-gastos-v6';
const ASSETS = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
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

  // Ignora requests que não são http/https (ex: chrome-extension://)
  if (!url.startsWith('http')) return;

  // Ignora requests do Firebase (auth, firestore) — nunca cachear
  let parsedUrl;
  try { parsedUrl = new URL(url); } catch (_) { return; }
  const hostname = parsedUrl.hostname;
  if (
    hostname.endsWith('.firebase.com') ||
    hostname.endsWith('.firebaseapp.com') ||
    hostname.endsWith('.firebaseio.com') ||
    hostname.endsWith('.firestore.googleapis.com') ||
    hostname.endsWith('.googleapis.com') ||
    hostname === 'googleapis.com' ||
    hostname.endsWith('.gstatic.com') ||
    hostname === 'gstatic.com' ||
    hostname.endsWith('.securetoken.googleapis.com')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Para o HTML principal, sempre busca na rede primeiro
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Para outros recursos: cache primeiro, rede como fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if (e.request.method === 'GET' && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
