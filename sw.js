/* میرا مکتبہ — Service Worker
   ہر نئے ورژن پر VERSION بدل دیں تاکہ پرانا کیش صاف ہو جائے۔
   فونٹس الگ مستقل کیش میں رہتے ہیں، ورژن بدلنے پر دوبارہ ڈاؤن لوڈ نہیں ہوتے۔ */
const VERSION = 'MA1010SA082';
const CACHE = `maktaba-aziz-${VERSION}`;
const FONT_CACHE = 'maktaba-aziz-fonts-v1';

const CORE = [
  './',
  './index.html',
  './maktaba.html',
  './diary/',
  './diary/index.html',
  './diary/icon-192.png',
  './diary/icon-512.png',
  './manifest.json',
  './privacy.html',
  `./style.css?v=${VERSION}`,
  `./app.js?v=${VERSION}`,
  `./share.js?v=${VERSION}`,
  `./drive.js?v=${VERSION}`,
  `./programs.js?v=${VERSION}`,
  `./notes.js?v=${VERSION}`,
  `./license.js?v=${VERSION}`,
  `./brand.js?v=${VERSION}`,
  `./promo.js?v=${VERSION}`,
  `./guard.js?v=${VERSION}`,
  `./update.js?v=${VERSION}`,
  './icons/logo.png',
  './icons/khatam-logo.png',
  './icons/khatam-logo-black.png',
  './icons/favicon.ico',
  './icons/app-badge.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png'
];
const FONTS = [
  './fonts/jnn-kasheeda-title3.woff',
  './fonts/jnn-regular.woff',
  './fonts/jnn-kasheeda-promo.woff'
];

// بڑے فونٹ جو صرف استعمال پر اترتے ہیں (پہلے سے نہیں)، مگر کیش میں رہیں
const LAZY_FONTS = ['./fonts/jnn-kasheeda-full.woff2'];

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
        keys.filter(k => k.startsWith('maktaba-aziz-') && k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))
      ))
      .then(() => caches.open(FONT_CACHE)).then(fc => fc.keys().then(ks => Promise.all(ks.filter(r => !FONTS.concat(LAZY_FONTS).some(f => r.url.endsWith(f.slice(1)))).map(r => fc.delete(r)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('.apk') || url.pathname.endsWith('/block.json')) return;

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
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || caches.match(url.pathname.includes('/diary/') ? './diary/index.html' : './index.html')))
  );
});
