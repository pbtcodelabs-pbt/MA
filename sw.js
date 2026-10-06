/* مکتبۃ العزیز — Service Worker
   ہر نئے ورژن پر VERSION بدل دیں تاکہ پرانا کیش صاف ہو جائے۔ */
const VERSION = 'MA610TU001';
const CACHE = `maktaba-aziz-${VERSION}`;
const FONT_CACHE = 'maktaba-aziz-fonts';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './app.js',
  './fonts/jnn-kasheeda-title.woff',
  './fonts/jnn-regular.woff',
  './icons/logo.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: کیش پہلے، تاکہ آف لائن بھی نستعلیق دکھے
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // اپنی فائلیں: نیٹ ورک پہلے، ناکامی پر کیش
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  }
});
