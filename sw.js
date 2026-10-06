/* مکتبۃ العزیز — Service Worker
   ہر نئے ورژن پر VERSION بدل دیں تاکہ پرانا کیش صاف ہو جائے۔
   فونٹس الگ مستقل کیش میں رہتے ہیں، ورژن بدلنے پر دوبارہ ڈاؤن لوڈ نہیں ہوتے۔ */
const VERSION = 'MA610TU015';
const CACHE = `maktaba-aziz-${VERSION}`;
const FONT_CACHE = 'maktaba-aziz-fonts-v1';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  `./style.css?v=${VERSION}`,
  `./app.js?v=${VERSION}`,
  `./share.js?v=${VERSION}`,
  `./drive.js?v=${VERSION}`,
  './icons/logo.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];
const FONTS = [
  './fonts/jnn-kasheeda-title.woff',
  './fonts/jnn-regular.woff'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
    // فونٹ صرف تب لائیں جب پہلے سے محفوظ نہ ہوں
    const fc = await caches.open(FONT_CACHE);
    for (const f of FONTS) {
      if (!(await fc.match(f))) { try { await fc.add(f); } catch (e) {} }
    }
    await self.skipWaiting();
  })());
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
  if (url.origin !== self.location.origin) return;

  // فونٹس: پہلے فون کا کیش، نہ ہو تو ڈاؤن لوڈ کر کے محفوظ
  if (url.pathname.includes('/fonts/')) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async fc => {
        const hit = await fc.match(req, { ignoreSearch: true });
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) fc.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // باقی فائلیں: نیٹ ورک پہلے، ناکامی پر کیش
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || caches.match('./index.html')))
  );
});
