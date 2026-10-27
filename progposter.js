/* میرا مکتبہ — پروگرام (جلسہ) کا پوسٹر
   اوپر: جلسے کا عنوان + مالک/مہتمم کی تصویر فریم (گول / چورس / محراب) میں، بڑی کر کے؛ ساتھ بڑا نام اور عہدہ
   بیچ: تاریخ، وقت، بمقام، شہر، میزبان، نمبر — ہر سطر اپنے رنگین موٹے کیپسول میں
   اوپر دائیں جلسے کا اشتہار؛ عنوان بڑے کیپسول میں سب کیپسولوں کے اوپر؛ نیچے: دائیں مونوگرام (لوگو)، بیچ میں فون
   رنگ، بارڈر، کیپسول، لکھائی کا رنگ و موٹائی، فونٹ اور گول کونے — سب چن سکتے ہیں؛ سائز: واٹس ایپ، اسٹیٹس، فیس بک، انسٹاگرام */
(function () {
  'use strict';
  const SIZES = {
    wa: { n: 'واٹس ایپ', w: 1080, h: 1080 },
    st: { n: 'اسٹیٹس', w: 1080, h: 1920 },
    fb: { n: 'فیس بک', w: 1200, h: 630 },
    ig: { n: 'انسٹاگرام', w: 1080, h: 1350 }
  };
  // پس منظر کے رنگ
  const THEMES = {
    navy:   { n: 'نیلا',   bg: ['#1a2a5a', '#0c1634', '#060c20'], light: false },
    green:  { n: 'سبز',    bg: ['#22795f', '#0f3a30', '#06201a'], light: false },
    maroon: { n: 'عنابی',  bg: ['#8a2433', '#4a0f17', '#22060a'], light: false },
    black:  { n: 'سیاہ',   bg: ['#333333', '#161616', '#050505'], light: false },
    purple: { n: 'جامنی',  bg: ['#56337f', '#2c1748', '#150a24'], light: false },
    teal:   { n: 'فیروزی', bg: ['#15807e', '#0a4544', '#042322'], light: false },
    royal:  { n: 'شاہی',   bg: ['#2f45a8', '#17225e', '#0a0f30'], light: false },
    brown:  { n: 'بھورا',  bg: ['#80501f', '#42260c', '#201205'], light: false },
    cream:  { n: 'ہلکا',   bg: ['#fffdf6', '#f5ead0', '#e4d09e'], light: true }
  };
  // بارڈر کے رنگ
  const BORDERS = {
    gold:   { n: 'سنہری', c: ['#fff3c4', '#e8c467', '#a8741f'] },
    silver: { n: 'چاندی', c: ['#ffffff', '#cfd6df', '#8b95a3'] },
    white:  { n: 'سفید',  c: ['#ffffff', '#f7f3ea', '#ddd5c4'] },
    green:  { n: 'سبز',   c: ['#b9f3d4', '#2fbf71', '#13714a'] }
  };
  // لکھائی کے رنگ: عنوان/نام (h) اور باقی (t)
  const INKS = {
    gold:  { n: 'سنہری', h: ['#fff3c4', '#e8c467', '#b8862b'], t: '#fbefd0', l: '#e8c467' },
    white: { n: 'سفید',  h: ['#ffffff', '#ffffff', '#e9e9e9'], t: '#ffffff', l: '#f1e7c8' },
    cream: { n: 'کریم',  h: ['#fff8e1', '#f5e6bd', '#e3cf98'], t: '#fff6dc', l: '#f1d27a' },
    dark:  { n: 'گہرا',  h: ['#5a3a00', '#3a2605', '#1f1503'], t: '#1d1a14', l: '#7a5418' }
  };
  const WEIGHTS = { 1: 'باریک', 2: 'درمیانہ', 3: 'موٹا' };
  const TWEIGHTS = { 1: 'عام', 2: 'موٹی', 3: 'بہت موٹی' };
  // معلومات کے کیپسول
  const CAPS = { multi: 'رنگین', gold: 'سنہری', glass: 'شیشہ', white: 'سفید' };
  const MULTI = [['#17a9ab', '#0b6466'], ['#d6485d', '#8a1d2e'], ['#3fa344', '#1f5e23'], ['#3a6fcc', '#1c3c7c'], ['#e58a2c', '#9a530b'], ['#9553c4', '#56287a']];
  const FRAMES = { circle: 'گول', square: 'چورس', oval: 'بیضوی', arch: 'محراب', octa: 'ہشت پہلو' };
  // تصویر کے فریم کا بارڈر: رنگ (auto = پوسٹر کے بارڈر جیسا) اور موٹائی
  const PFC = {
    auto:   { n: 'بارڈر جیسا' },
    gold:   { n: 'سنہری', c: ['#fff3c4', '#e8c467', '#a8741f'] },
    silver: { n: 'چاندی', c: ['#ffffff', '#cfd6df', '#8b95a3'] },
    white:  { n: 'سفید',  c: ['#ffffff', '#ffffff', '#e6e1d6'] },
    maroon: { n: 'عنابی', c: ['#f0a8b2', '#b02a3e', '#5a0f1c'] },
    green:  { n: 'سبز',   c: ['#b9f3d4', '#2fbf71', '#13714a'] },
    blue:   { n: 'نیلا',  c: ['#c4dbff', '#3a78e0', '#173a80'] },
    black:  { n: 'کالا',  c: ['#8a8a8a', '#2a2a2a', '#000000'] },
    rose:   { n: 'گلابی', c: ['#ffd1e6', '#ff6fae', '#b02a6b'] }
  };
  const PFC_C = () => (PFC[ST.pfc] && PFC[ST.pfc].c) || B().c;
  const DEF = { theme: 'navy', border: 'gold', ink: 'gold', bw: 2, round: 1, tfont: 'kasheeda', bfont: 'noori', ad: 1, cutbg: 0, cap: 'multi', tw: 2, pframe: 'circle', pzoom: 1, py: .18, pname: null, prole: null, pf: {}, tsz: 85, nsz: 100, rsz: 100, csz: 100, bstyle: 'classic', pfc: 'auto', pfw: 2, bgi: 0, capi: 0 };
  // سوشل میڈیا کے بٹن: ہر ایپ کے اپنے سائز میں پوسٹر بنا کر فون کی «بھیجیں» فہرست؛ وہ نہ ہو تو تصویر محفوظ + ایپ کی ویب سائٹ
  const SOCIAL = {
    wa: { n: 'واٹس ایپ', i: '💬', size: 'wa', c: ['#3fe07a', '#128c4a'], web: tx => 'https://wa.me/?text=' + encodeURIComponent(tx) },
    st: { n: 'اسٹیٹس', i: '⭕', size: 'st', c: ['#34d399', '#0f766e'], noText: 1 },
    fb: { n: 'فیس بک', i: '👍', size: 'fb', c: ['#4c8dff', '#1d4fb8'], web: () => 'https://www.facebook.com/' },
    ig: { n: 'انسٹاگرام', i: '📸', size: 'ig', c: ['#f77737', '#c13584'], noText: 1, web: () => 'https://www.instagram.com/' }
  };
  const SKEY = 'maktaba-aziz-pposter-style', KEY = 'maktaba-aziz-pposter-size';
  let ST = Object.assign({}, DEF, (() => { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } })());
  const saveSt = () => { try { localStorage.setItem(SKEY, JSON.stringify(ST)); } catch (e) {} };

  const MONTHS = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
  const DAYS = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
  const NF = '"Digits",Arial,Roboto,sans-serif';
  const LK = () => window.MA_LOOK;
  const fam = (k, def) => (k && LK() && LK().fonts[k]) ? (k === 'plain' ? '"Digits","Segoe UI",Tahoma,sans-serif' : LK().stack(k)) : def;
  const TF = () => fam(ST.tfont, '"Digits","JNNK","JNN",serif');
  const BF = () => fam(ST.bfont, '"Digits","JNN","Jameel Noori Nastaleeq",serif');
  // ہر حصے کا اپنا فونٹ (خالی ہو تو عنوان کے لیے «سب عنوان»، باقی کے لیے «سب لکھائی» والا)
  const PARTS = [['title', 'پروگرام کا عنوان'], ['name', 'نام (تصویر کے ساتھ)'], ['role', 'عہدہ'], ['cal', 'تاریخ'], ['clock', 'وقت'], ['mosque', 'بمقام'], ['pin', 'شہر'], ['user', 'میزبان'], ['phone', 'میزبان کا نمبر'], ['mak', 'مکتبہ / دارالعلوم']];
  const PF = k => { const v = ST.pf && ST.pf[k]; return v ? fam(v, BF()) : (k === 'title' ? TF() : BF()); };
  const BRD = () => { try { return JSON.parse(localStorage.getItem('maktaba-aziz-brand')) || {}; } catch (e) { return {}; } };
  const dOf = s => new Date(String(s).slice(0, 10) + 'T00:00:00');
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const T = () => { const t = THEMES[ST.theme] || THEMES.navy; return ST.bgi ? Object.assign({}, t, { bg: t.bg.map(x => shade(x, ST.bgi)) }) : t; };
  const B = () => BORDERS[ST.border] || BORDERS.gold;
  const K = () => { const k = INKS[ST.ink] || INKS.gold; return (T().light && ST.ink !== 'dark' && ST.ink !== 'gold') ? INKS.dark : (T().light && ST.ink === 'gold' ? Object.assign({}, k, { h: ['#c8962f', '#8a5f16', '#5a3c08'], t: '#2b2214', l: '#8a5f16' }) : k); };

  // ---------- کینوس کے اوزار ----------
  function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  const grad = (c, y0, y1, cols) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((k, i) => g.addColorStop(i / (cols.length - 1), k)); return g; };
  function fitFont(c, s, max, size, f, min = 14) { let z = size; c.font = `${z}px ${f}`; while (c.measureText(s).width > max && z > min) { z -= 2; c.font = `${z}px ${f}`; } return z; }
  function wrap2(c, s, max, size, f, min) {
    for (let z = size; z >= min; z -= 4) {
      c.font = `${z}px ${f}`;
      if (c.measureText(s).width <= max) return { z, lines: [s] };
      const w = s.split(/\s+/); let best = null;
      for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '); const m = Math.max(c.measureText(a).width, c.measureText(b).width); if (!best || m < best.m) best = { m, a, b }; }
      if (best && best.m <= max) return { z, lines: [best.a, best.b] };
    }
    c.font = `${min}px ${f}`; return { z: min, lines: [s] };
  }
  function headText(c, s, x, y, z, f, align = 'center') {
    c.save(); c.font = `${z}px ${f}`; c.textAlign = align; c.direction = 'rtl';
    c.shadowColor = T().light ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.55)'; c.shadowBlur = z * .12; c.shadowOffsetY = z * .05;
    c.fillStyle = grad(c, y - z * .8, y + z * .2, K().h);
    if (ST.tw > 1 && f !== PF('title')) { c.strokeStyle = c.fillStyle; c.lineJoin = 'round'; c.lineWidth = z * (ST.tw === 3 ? .05 : .028); c.strokeText(s, x, y); }
    c.fillText(s, x, y); c.restore();
  }
  // موٹی لکھائی: نستعلیق کا «bold» نہیں ہوتا، اسی رنگ کی لکیر سے موٹی
  function bold(c, s, x, y, z, color, f, align = 'right') {
    c.font = `${z}px ${f}`; c.textAlign = align; c.direction = 'rtl'; c.fillStyle = color;
    if (ST.tw > 1) { c.strokeStyle = color; c.lineJoin = 'round'; c.lineWidth = z * (ST.tw === 3 ? .075 : .045); c.strokeText(s, x, y); }
    c.fillText(s, x, y);
  }
  function text(c, s, x, y, z, color, f, align = 'right', max) {
    if (max) z = fitFont(c, s, max, z, f); else c.font = `${z}px ${f}`;
    c.textAlign = align; c.direction = 'rtl'; c.fillStyle = color; c.fillText(s, x, y); return z;
  }

  // ---------- پس منظر، فریم، نقش ----------
  function background(c, W, H, R) {
    const th = T();
    c.save(); rr(c, 0, 0, W, H, R); c.clip();
    const g = c.createRadialGradient(W / 2, H * .3, 40, W / 2, H * .45, Math.max(W, H) * .85);
    g.addColorStop(0, th.bg[0]); g.addColorStop(.55, th.bg[1]); g.addColorStop(1, th.bg[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = th.light ? 'rgba(120,80,10,.07)' : 'rgba(232,196,103,.07)'; c.lineWidth = 1.5;
    const step = Math.min(W, H) / 7;
    for (let y = -step; y < H + step; y += step) for (let x = -step; x < W + step; x += step) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + step, y + step * .55); c.lineTo(x + step * .3, y + step); c.stroke(); }
    c.restore();
  }
  function corner(c, x, y, sx, sy, s, col) {
    c.save(); c.translate(x, y); c.scale(sx, sy); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * .035 * (ST.bw * .5 + .5);
    c.beginPath(); c.moveTo(0, s); c.quadraticCurveTo(0, 0, s, 0); c.stroke();
    c.beginPath(); c.moveTo(s * .12, s * .8); c.quadraticCurveTo(s * .12, s * .12, s * .8, s * .12); c.stroke();
    for (const [a, b] of [[.28, .28], [.5, .14], [.14, .5]]) { c.beginPath(); c.arc(s * a, s * b, s * .045, 0, 7); c.fill(); }
    c.beginPath(); c.moveTo(s * .2, s * .2); c.lineTo(s * .42, s * .3); c.lineTo(s * .3, s * .42); c.closePath(); c.fill();
    c.restore();
  }
  // بارڈر کے انداز
  const BSTYLES = { classic: 'کونوں والا', double: 'دوہرا', pearl: 'موتی', arch: 'محرابی', ribbon: 'چوڑی پٹی', dash: 'نقطہ دار', none: 'بغیر بارڈر' };
  // کنارے پر برابر فاصلے کے نقطے (سیدھی لکیریں؛ گول کونوں کی جگہ چھوڑ کر)
  function edgePts(x, y, w, h, r, step) {
    const pts = [], seg = (x0, y0, x1, y1, nx, ny) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step)); for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, nx, ny]); };
    seg(x + r, y, x + w - r, y, 0, 1); seg(x + r, y + h, x + w - r, y + h, 0, -1); seg(x, y + r, x, y + h - r, 1, 0); seg(x + w, y + r, x + w, y + h - r, -1, 0);
    return pts;
  }
  function frame(c, W, H, R) {
    const m = Math.min(W, H), o = m * .025, s = m * .13, bc = B().c, w = ST.bw, st = ST.bstyle, col = bc[1];
    if (st === 'none') return;
    const corners = () => { corner(c, o * 2.1, o * 2.1, 1, 1, s, col); corner(c, W - o * 2.1, o * 2.1, -1, 1, s, col); corner(c, o * 2.1, H - o * 2.1, 1, -1, s, col); corner(c, W - o * 2.1, H - o * 2.1, -1, -1, s, col); };
    c.save(); c.lineJoin = 'round'; c.strokeStyle = grad(c, 0, H, bc); c.fillStyle = grad(c, 0, H, bc);
    const box = (k, lw, rad) => { c.lineWidth = lw; rr(c, o * k, o * k, W - 2 * k * o, H - 2 * k * o, rad); c.stroke(); };
    if (st === 'double') {
      box(1, m * .006 * (w + .6), R * .8); box(1.9, m * .006 * (w + .6), R * .62);
      [[W / 2, o * 1.45], [W / 2, H - o * 1.45], [o * 1.45, H / 2], [W - o * 1.45, H / 2]].forEach(([x, y]) => { const q = m * .022; c.beginPath(); c.moveTo(x, y - q); c.lineTo(x + q, y); c.lineTo(x, y + q); c.lineTo(x - q, y); c.closePath(); c.fill(); });
    } else if (st === 'pearl') {
      box(1, m * .003 * (w + .6), R * .8);
      const k = o * 1.7, r = Math.max(R * .6, m * .03), pr = m * .0034 * (w + 1.2);
      edgePts(k, k, W - 2 * k, H - 2 * k, r, pr * 3.4).forEach(([x, y]) => { c.beginPath(); c.arc(x, y, pr, 0, 7); c.fill(); });
      corners();
    } else if (st === 'arch') {
      box(1, m * .004 * (w + .6), R * .8);
      const k = o * 1.6, r = Math.max(R * .6, m * .05), sz = m * .03 * (w * .25 + .75);
      c.lineWidth = m * .003 * (w + .6);
      edgePts(k, k, W - 2 * k, H - 2 * k, r, sz * 1.6).forEach(([x, y, nx, ny], i, a) => {
        const nb = a[i + 1]; if (!nb || nb[2] !== nx || nb[3] !== ny) return;
        const mx = (x + nb[0]) / 2, my = (y + nb[1]) / 2;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx + nx * sz * 1.2, my + ny * sz * 1.2, nb[0], nb[1]); c.stroke();
        c.beginPath(); c.arc(mx + nx * sz * .35, my + ny * sz * .35, sz * .13, 0, 7); c.fill();
      });
      corners();
    } else if (st === 'ribbon') {
      const bw = m * .012 * (w + 1); box(1.6, bw, R * .7);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(1.5, m * .002); rr(c, o * 1.6, o * 1.6, W - 3.2 * o, H - 3.2 * o, R * .7); c.setLineDash([m * .012, m * .01]); c.stroke(); c.setLineDash([]);
    } else if (st === 'dash') {
      c.setLineDash([m * .03, m * .014]); c.lineCap = 'round'; box(1.2, m * .006 * (w + .6), R * .8); c.setLineDash([m * .004, m * .016]); box(2, m * .006 * (w + .6), R * .6); c.setLineDash([]);
    } else {
      box(1, m * .005 * (w + .6), R * .8);
      if (w >= 2) { c.globalAlpha = .6; box(1.7, m * .0025 * w, R * .65); c.globalAlpha = 1; }
      c.restore(); corners(); return;
    }
    c.restore();
  }
  // رنگ مدھم (سفید کی طرف) یا گہرا (کالے کی طرف): v = −50 … +50
  function shade(h, v) {
    if (!v || typeof h !== 'string' || h[0] !== '#' || h.length !== 7) return h;
    const n = parseInt(h.slice(1), 16), t = v < 0 ? 255 : 0, a = Math.abs(v) / 100 * (v < 0 ? .9 : 1.2);
    const f = x => Math.round(x + (t - x) * Math.min(.85, a)).toString(16).padStart(2, '0');
    return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  }
  function crescent(c, x, y, r) {
    c.save(); c.fillStyle = grad(c, y - r, y + r, B().c);
    c.beginPath(); c.arc(x, y, r, 0, 7); c.arc(x + r * .38, y - r * .12, r * .82, 0, 7, true); c.fill('evenodd');
    const sx = x + r * .25, sy = y - r * .05, sr = r * .32; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? sr * .45 : sr; c.lineTo(sx + q * Math.cos(a), sy + q * Math.sin(a)); }
    c.closePath(); c.fill(); c.restore();
  }
  function divider(c, cx, y, w) {
    c.save(); c.strokeStyle = grad(c, y - 2, y + 2, B().c); c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(cx - w / 2, y); c.lineTo(cx - 22, y); c.moveTo(cx + 22, y); c.lineTo(cx + w / 2, y); c.stroke();
    c.fillStyle = B().c[1]; c.beginPath(); c.moveTo(cx, y - 12); c.lineTo(cx + 15, y); c.lineTo(cx, y + 12); c.lineTo(cx - 15, y); c.closePath(); c.fill(); c.restore();
  }
  function roundLogo(c, img, x, y, d) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = d * .12;
    c.beginPath(); c.arc(x, y, d / 2 + d * .05, 0, 7); c.fillStyle = grad(c, y - d / 2, y + d / 2, B().c); c.fill(); c.restore();
    c.save(); c.beginPath(); c.arc(x, y, d / 2, 0, 7); c.fillStyle = '#fffaf0'; c.fill(); c.clip();
    const sc = Math.min(d / img.width, d / img.height) * .96, iw = img.width * sc, ih = img.height * sc; c.drawImage(img, x - iw / 2, y - ih / 2, iw, ih); c.restore();
  }
  // نشان: سنہری حلقے میں سادہ لکیری علامت
  function icon(c, kind, x, y, s, col) {
    col = col || K().l; c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * .09; c.lineCap = 'round'; c.lineJoin = 'round';
    const h = s / 2;
    if (kind === 'cal') { rr(c, x - h, y - h * .8, s, s * .85, s * .12); c.stroke(); c.beginPath(); c.moveTo(x - h, y - h * .35); c.lineTo(x + h, y - h * .35); c.stroke(); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) c.fillRect(x - h * .62 + i * h * .5, y - h * .05 + j * h * .38, s * .12, s * .1); c.beginPath(); c.moveTo(x - h * .45, y - h); c.lineTo(x - h * .45, y - h * .6); c.moveTo(x + h * .45, y - h); c.lineTo(x + h * .45, y - h * .6); c.stroke(); }
    else if (kind === 'clock') { c.beginPath(); c.arc(x, y, h, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x, y - h * .6); c.lineTo(x, y); c.lineTo(x + h * .45, y + h * .25); c.stroke(); }
    else if (kind === 'mosque') { c.beginPath(); c.moveTo(x - h * .55, y + h * .8); c.lineTo(x - h * .55, y); c.quadraticCurveTo(x - h * .55, y - h * .75, x, y - h * .85); c.quadraticCurveTo(x + h * .55, y - h * .75, x + h * .55, y); c.lineTo(x + h * .55, y + h * .8); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(x - h * .95, y + h * .8); c.lineTo(x - h * .95, y - h * .3); c.moveTo(x + h * .95, y + h * .8); c.lineTo(x + h * .95, y - h * .3); c.moveTo(x - h * 1.1, y + h * .8); c.lineTo(x + h * 1.1, y + h * .8); c.stroke(); }
    else if (kind === 'pin') { c.beginPath(); c.moveTo(x, y + h); c.bezierCurveTo(x - h * 1.1, y - h * .1, x - h * .7, y - h, x, y - h); c.bezierCurveTo(x + h * .7, y - h, x + h * 1.1, y - h * .1, x, y + h); c.stroke(); c.beginPath(); c.arc(x, y - h * .3, h * .28, 0, 7); c.stroke(); }
    else if (kind === 'user') { c.beginPath(); c.arc(x, y - h * .4, h * .42, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - h * .85, y + h * .9); c.quadraticCurveTo(x - h * .85, y + h * .05, x, y + h * .05); c.quadraticCurveTo(x + h * .85, y + h * .05, x + h * .85, y + h * .9); c.closePath(); c.fill(); }
    else if (kind === 'phone') { c.beginPath(); c.arc(x, y, h * 1.05, 0, 7); c.stroke(); c.lineWidth = s * .12; c.beginPath(); c.moveTo(x - h * .45, y - h * .45); c.quadraticCurveTo(x - h * .35, y + h * .35, x + h * .45, y + h * .45); c.stroke(); c.fillRect(x - h * .62, y - h * .62, s * .2, s * .2); c.fillRect(x + h * .3, y + h * .3, s * .2, s * .2); }
    c.restore();
  }
  function creditLine(c, W, y, z) {
    const s = 'اس طرح کے بہترین سافٹ ویئر کے لیے  ✦  ⁦0320-6793793⁩  ✦  ⁦PBT CodeLabs⁩';
    c.save(); c.globalAlpha = .8; text(c, s, W / 2, y, z, K().t, BF(), 'center', W * .6); c.restore();
  }

  // ---------- مواد ----------
  function info(p) {
    const b = BRD(), d = dOf(p.date);
    const INST = /دار|مدرس|جامع|مکتب|ادار|مرکز|مسجد|اکیڈمی|ٹرسٹ|فاؤنڈیشن/;
    return {
      pname: ST.pname != null ? ST.pname.trim() : ([b.line1, b.name].map(x => (x || '').trim()).find(x => x && !INST.test(x)) || (b.line1 || '').trim()),
      prole: ST.prole != null ? ST.prole.trim() : (b.line2 || '').trim(),
      owner: (b.line1 || '').trim(), maktaba: (b.name || '').trim(), ophone: (b.phone || '').trim(),
      title: (p.title || '').trim(),
      date: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} (${DAYS[d.getDay()]})`,
      when: [p.timeNote, p.time ? p.time : ''].filter(Boolean).join(' · '),
      place: (p.place || '').trim(), city: [p.city, p.province].map(x => (x || '').trim()).filter(Boolean).join('، '),
      host: (p.inviter || '').trim(), phone: (p.phone || '').trim(), ad: p.poster || ''
    };
  }
  const rowsOf = I => [['cal', 'تاریخ', I.date], ['clock', 'وقت', I.when], ['mosque', 'بمقام', I.place], ['pin', 'شہر', I.city], ['user', 'میزبان', I.host], ['phone', '', I.phone ? `⁦${I.phone}⁩` : '']].filter(r => r[2]);
  const loadImg = src => new Promise(r => { if (!src) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  let memPhoto = '';
  const cutCache = {};
  async function assets(p) {
    const b = BRD();
    const logoSrc = b.logo === 'default' ? 'icons/khatam-logo.png' : (b.logo || '');
    let [logo, photo, ad] = await Promise.all([loadImg(logoSrc), loadImg(b.photo || memPhoto || ''), ST.ad ? loadImg(p.poster || '') : null]);
    if (photo && ST.cutbg) { const k = (b.photo || memPhoto).length + ':' + (b.photo || memPhoto).slice(-40); photo = cutCache[k] || (cutCache[k] = cutBg(photo)); }
    try {
      if (LK()) await Promise.all([ST.tfont, ST.bfont, ...Object.values(ST.pf || {})].filter(Boolean).map(k => LK().loadFont(k)).map(x => x && x.catch ? x.catch(() => {}) : x));
      await Promise.all([document.fonts.load(`60px ${TF()}`, 'جلسہ سیرت النبی 123'), document.fonts.load(`40px ${BF()}`, 'میزبان 0300-1234567'), ...PARTS.map(([k]) => document.fonts.load(`40px ${PF(k)}`, 'میزبان جلسہ 0300')), document.fonts.load(`40px ${NF}`, '0123')]);
    } catch (e) {}
    return { logo, photo, ad };
  }
  // سادہ پس منظر ہٹائیں: کونوں سے ملتا جلتا رنگ شفاف (سادہ پس منظر والی تصویر کے لیے)
  function cutBg(img) {
    const S = Math.min(1, 700 / Math.max(img.width, img.height)), w = Math.round(img.width * S), h = Math.round(img.height * S);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    const id = g.getImageData(0, 0, w, h), d = id.data, seen = new Uint8Array(w * h), st = [];
    const at = i => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
    [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [w >> 1, 0]].forEach(([x, y]) => st.push([y * w + x, at(y * w + x)]));
    const tol = 46 * 46;
    while (st.length) {
      const [i, ref] = st.pop(); if (seen[i]) continue;
      const r = d[i * 4] - ref[0], gg = d[i * 4 + 1] - ref[1], b = d[i * 4 + 2] - ref[2];
      if (r * r + gg * gg + b * b > tol) continue;
      seen[i] = 1; d[i * 4 + 3] = 0;
      const x = i % w, y = (i / w) | 0;
      if (x > 0) st.push([i - 1, ref]); if (x < w - 1) st.push([i + 1, ref]); if (y > 0) st.push([i - w, ref]); if (y < h - 1) st.push([i + w, ref]);
    }
    for (let i = 0; i < w * h; i++) if (!seen[i]) { const x = i % w, y = (i / w) | 0; if ((x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (y > 0 && seen[i - w]) || (y < h - 1 && seen[i + w])) d[i * 4 + 3] = 150; }   // کنارے نرم
    g.putImageData(id, 0, 0); return cv;
  }
  // تصویر کا فریم: گول / چورس / محراب — تصویر فریم بھر کر (زوم اور اوپر نیچے سرکانا)، تاکہ پیچھے کی چیزیں چھپ جائیں
  function shapePath(c, cx, cy, d) {
    const r = d / 2;
    if (ST.pframe === 'square') rr(c, cx - r, cy - r, d, d, d * .12);
    else if (ST.pframe === 'oval') { c.beginPath(); c.ellipse(cx, cy, r * .8, r, 0, 0, 7); c.closePath(); }
    else if (ST.pframe === 'octa') { c.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4, q = r / Math.cos(Math.PI / 8) * .96; c.lineTo(cx + q * Math.cos(a), cy + q * Math.sin(a)); } c.closePath(); }
    else if (ST.pframe === 'arch') {
      c.beginPath(); c.moveTo(cx - r, cy + r); c.lineTo(cx - r, cy - r * .2);
      c.bezierCurveTo(cx - r, cy - r * .72, cx - r * .38, cy - r * .86, cx, cy - r);
      c.bezierCurveTo(cx + r * .38, cy - r * .86, cx + r, cy - r * .72, cx + r, cy - r * .2);
      c.lineTo(cx + r, cy + r); c.closePath();
    } else { c.beginPath(); c.arc(cx, cy, r, 0, 7); c.closePath(); }
  }
  function photoFrame(c, A, cx, cy, d, preview, out) {
    out.ph = { x: cx - d / 2, y: cy - d / 2, w: d, h: d };
    if (!A.photo && !preview) return;
    const ring = d * [0, .022, .045, .075][ST.pfw || 2];
    c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = d * .09; c.shadowOffsetY = d * .025;
    shapePath(c, cx, cy, d + ring * 2); c.fillStyle = grad(c, cy - d / 2, cy + d / 2, PFC_C()); c.fill(); c.restore();
    c.save(); shapePath(c, cx, cy, d + ring * .55); c.fillStyle = T().bg[2]; c.fill(); c.restore();
    c.save(); shapePath(c, cx, cy, d); c.clip();
    c.fillStyle = T().bg[0]; c.fillRect(cx - d, cy - d, d * 2, d * 2);
    const g = c.createRadialGradient(cx, cy - d * .1, d * .05, cx, cy, d * .7); g.addColorStop(0, 'rgba(255,236,180,.55)'); g.addColorStop(1, 'rgba(255,236,180,0)'); c.fillStyle = g; c.fillRect(cx - d, cy - d, d * 2, d * 2);
    if (A.photo) {
      const iw = A.photo.width, ih = A.photo.height, sc = Math.max(d / iw, d / ih) * ST.pzoom, w = iw * sc, h = ih * sc;
      c.drawImage(A.photo, cx - w / 2, cy - d / 2 - (h - d) * ST.py, w, h);
    } else {
      const s = d * .16, iy = cy - d * .08;
      c.fillStyle = K().l; rr(c, cx - s, iy - s * .7, s * 2, s * 1.4, s * .25); c.fill(); c.fillRect(cx - s * .35, iy - s * .95, s * .7, s * .3);
      c.beginPath(); c.arc(cx, iy, s * .45, 0, 7); c.fillStyle = T().bg[1]; c.fill(); c.beginPath(); c.arc(cx, iy, s * .28, 0, 7); c.fillStyle = K().l; c.fill();
      text(c, 'تصویر ایڈ کریں', cx, cy + d * .25, d * .09, K().t, BF(), 'center', d * .8);
    }
    c.restore();
    c.save(); shapePath(c, cx, cy, d); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = Math.max(2, d * .007); c.stroke(); c.restore();
  }
  // بڑا نام (سنہری) + عہدہ سنہری پٹی میں؛ dry = صرف ناپیں
  function nameBlock(c, I, cx, y, w, z, dry) {
    const z0 = z; z *= (ST.nsz || 100) / 100;
    let yy = y;
    if (I.pname) {
      const N = wrap2(c, I.pname, w, z, PF('name'), z * .5), lh = N.z * 1.22;
      if (!dry) N.lines.forEach((ln, i) => headText(c, ln, cx, yy + N.z * .85 + i * lh, N.z, PF('name')));
      yy += N.z * .85 + (N.lines.length - 1) * lh + N.z * .42;
    }
    if (I.prole) {
      const rz = fitFont(c, I.prole, w * .9, z0 * .46 * (ST.rsz || 100) / 100, PF('role')), rw = Math.min(w, c.measureText(I.prole).width + rz * 1.8), rh = rz * 1.75;
      if (!dry) {
        c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = rh * .25; rr(c, cx - rw / 2, yy, rw, rh, rh / 2); c.fillStyle = grad(c, yy, yy + rh, B().c); c.fill(); c.restore();
        bold(c, I.prole, cx, yy + rh / 2 + rz * .33, rz, T().light ? '#2a1a00' : T().bg[2], PF('role'), 'center');
      }
      yy += rh + z * .15;
    }
    return yy;
  }
  function capStyle(i) {
    const S = capStyle0(i); if (ST.capi) S.fill = S.fill.map(x => shade(x, ST.capi)); return S;
  }
  function capStyle0(i) {
    const k = ST.cap;
    if (k === 'gold') return { fill: ['#fff3c9', '#e8c467', '#b88a2e'], tx: '#2a1a00', lab: '#6b3f00', icBg: T().light ? '#5a3c08' : T().bg[1], ic: '#f1d27a', edge: 'rgba(255,255,255,.6)' };
    if (k === 'glass') return { fill: ['rgba(255,255,255,.2)', 'rgba(255,255,255,.07)'], tx: K().t, lab: K().l, icBg: null, ic: T().bg[2], edge: B().c[1], glass: 1 };
    if (k === 'white') return { fill: ['#ffffff', '#f1ece0'], tx: '#1b1b1b', lab: '#8a5f16', icBg: T().light ? '#5a3c08' : T().bg[1], ic: '#f1d27a', edge: B().c[1] };
    const m = MULTI[i % MULTI.length];
    return { fill: m, tx: '#ffffff', lab: '#ffe9a8', icBg: '#ffffff', ic: m[1], edge: 'rgba(255,255,255,.4)' };
  }
  // ہر سطر اپنے کیپسول میں: دائیں نشان کا گول ڈبہ، پھر «عنوان: معلومات» موٹی لکھائی میں
  function capsules(c, list, x, y, w, rh, cols) {
    cols = cols || 1;
    const gap = w * .025, cw = (w - gap * (cols - 1)) / cols, q = (ST.csz || 100) / 100, ch = rh * Math.min(.96, .8 * Math.max(q, 1));
    list.forEach(([ic, lab, val], i) => {
      const f = PF(ic), col = i % cols, row = Math.floor(i / cols), S = capStyle(i);
      const cx0 = x + w - cw - col * (cw + gap), yy = y + row * rh + (rh - ch) / 2, r = ch / 2, z = ch * (cols > 1 ? .48 : .52);   // لکھائی ہمیشہ کیپسول کے حساب سے — کیپسول ساتھ بڑا / چھوٹا
      c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = ch * .28; c.shadowOffsetY = ch * .08;
      rr(c, cx0, yy, cw, ch, r); c.fillStyle = grad(c, yy, yy + ch, S.fill); c.fill(); c.restore();
      c.save(); rr(c, cx0, yy, cw, ch, r); c.clip(); c.fillStyle = 'rgba(255,255,255,.16)'; rr(c, cx0 + r * .6, yy + ch * .07, cw - r * 1.2, ch * .38, ch * .19); c.fill(); c.restore();
      c.save(); rr(c, cx0, yy, cw, ch, r); c.strokeStyle = S.edge; c.lineWidth = Math.max(1.5, ch * .03); c.stroke(); c.restore();
      const ir = r * .8, icx = cx0 + cw - r, icy = yy + r;
      c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = ir * .3; c.beginPath(); c.arc(icx, icy, ir, 0, 7); c.fillStyle = S.glass ? grad(c, icy - ir, icy + ir, B().c) : S.icBg; c.fill(); c.restore();
      icon(c, ic, icx, icy, ir * 1.05, S.ic);
      const L = lab ? lab + ': ' : '', tx = icx - ir - z * .4, by = yy + ch / 2 + z * .34;
      c.font = `${z}px ${f}`; const lw = L ? c.measureText(L).width : 0;
      if (L) bold(c, L, tx, by, z, S.lab, f);
      const vz = fitFont(c, val, tx - lw - cx0 - r * .55, z, f, z * .55);
      bold(c, val, tx - lw, by, vz, S.tx, f);
    });
  }
  function adThumb(c, img, x, y, maxW, maxH) {
    const sc = Math.min(maxW / img.width, maxH / img.height), w = img.width * sc, h = img.height * sc, yy = y + (maxH - h) / 2;
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 16; c.fillStyle = grad(c, yy, yy + h, B().c); rr(c, x - 6, yy - 6, w + 12, h + 12, 12); c.fill(); c.restore();
    c.save(); rr(c, x, yy, w, h, 9); c.clip(); c.drawImage(img, x, yy, w, h); c.restore();
    return { x: x - 6, y: yy - 6, w: w + 12, h: h + 12 };
  }
  // نیچے کی پٹی: دائیں مونوگرام (لوگو)، بیچ میں فون، بائیں جلسے کا اشتہار
  // جلسے کا اشتہار: اوپر دائیں کونے میں پورا؛ نہ ہو تو (صرف دیکھنے میں) چھوٹا «➕ اشتہار» نشان، جگہ نہیں گھیرتا
  function adSlot(c, A, x, y, w, h, preview, out) {
    if (A.ad) { out.ad = adThumb(c, A.ad, x, y, w, h); return true; }
    if (preview && ST.ad) {
      const s = Math.min(w, h) * .62, bx = x + w - s, by = y; out.ad = { x: bx, y: by, w: s, h: s };
      c.save(); c.setLineDash([8, 6]); c.strokeStyle = K().l; c.lineWidth = 2.5; rr(c, bx, by, s, s, 12); c.stroke(); c.restore();
      text(c, '➕ اشتہار', bx + s / 2, by + s * .48, s * .17, K().t, BF(), 'center', s * .9);
      text(c, 'لگائیں', bx + s / 2, by + s * .72, s * .15, K().l, BF(), 'center', s * .9);
    }
    return false;
  }
  // عنوان کا بڑا کیپسول: سب کیپسولوں کے اوپر بیچ میں، سنہری کنارہ، اندر عنوان
  function titleCap(c, title, x, y, w, h) {
    const r = h / 2;
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = h * .3; c.shadowOffsetY = h * .08;
    rr(c, x - h * .06, y - h * .06, w + h * .12, h * 1.12, r * 1.12); c.fillStyle = grad(c, y, y + h, B().c); c.fill(); c.restore();
    c.save(); rr(c, x, y, w, h, r); c.fillStyle = grad(c, y, y + h, [shade(T().bg[0], -12), T().bg[1], T().bg[2]]); c.fill();
    c.clip(); c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, x + r * .5, y + h * .06, w - r, h * .36, h * .18); c.fill(); c.restore();
    c.save(); rr(c, x + h * .07, y + h * .07, w - h * .14, h * .86, r * .86); c.strokeStyle = B().c[1]; c.globalAlpha = .55; c.lineWidth = Math.max(1.5, h * .02); c.stroke(); c.restore();
    const f = PF('title'), z = fitFont(c, title, w - h * 1.1, h * .62, f, h * .25);
    headText(c, title, x + w / 2, y + h / 2 + z * .3, z, f);
  }
  // نیچے کی پٹی: دائیں مونوگرام (لوگو)، بیچ میں فون
  function bottomRow(c, I, A, x, y, w, h) {
    const cy = y + h / 2; let right = x + w;
    if (A.logo) { const d = h * .9; roundLogo(c, A.logo, right - d / 2 - h * .03, cy, d); right -= d + h * .2; }
    else if (I.maktaba) { const mf = PF('mak'), mz = fitFont(c, I.maktaba, w * .4, h * .3, mf); headText(c, I.maktaba, right, cy + mz * .3, mz, mf, 'right'); right -= c.measureText(I.maktaba).width + h * .2; }
    if (I.ophone) {
      const left = x + (x + w - right), room = right - left; let z = h * .32; c.font = `700 ${z}px ${NF}`;
      while (c.measureText(I.ophone).width + z * 2.4 > room && z > h * .16) { z -= 2; c.font = `700 ${z}px ${NF}`; }
      const pw = c.measureText(I.ophone).width, bw = pw + z * 2.4, bh = z * 1.75, bx = left + (room - bw) / 2, by = cy - bh / 2;
      c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = bh * .3; rr(c, bx, by, bw, bh, bh / 2); c.fillStyle = 'rgba(0,0,0,.28)'; c.fill(); c.restore();
      c.save(); rr(c, bx, by, bw, bh, bh / 2); c.strokeStyle = grad(c, by, by + bh, B().c); c.lineWidth = Math.max(2.5, bh * .06); c.stroke(); c.restore();
      const ir = bh * .36; c.save(); c.beginPath(); c.arc(bx + bh / 2, cy, ir, 0, 7); c.fillStyle = grad(c, cy - ir, cy + ir, B().c); c.fill(); c.restore();
      icon(c, 'phone', bx + bh / 2, cy, ir * .95, T().bg[2]);
      c.font = `700 ${z}px ${NF}`; c.textAlign = 'left'; c.direction = 'ltr'; c.fillStyle = K().t; c.fillText(I.ophone, bx + bh * .95, cy + z * .36);
    }
  }

  // ---------- ترتیب ----------
  // اوپر: بائیں تصویر، بیچ میں پورا نام اور عہدہ، دائیں کونے میں اشتہار؛ پھر عنوان کا بڑا کیپسول؛ پھر معلومات کے کیپسول؛ نیچے فون اور مونوگرام
  function drawTall(c, W, H, I, A, key, preview, out) {
    const m = W, pad = m * .07, inner = W - 2 * pad, cx = W / 2, showPh = !!(A.photo || preview);
    const P = { wa: { hero: .3, rh: .1, bh: .11, cols: 2, th: .13 }, ig: { hero: .36, rh: .088, bh: .13, cols: 1, th: .14 }, st: { rh: .095, bh: .14, cols: 1, th: .15 } }[key] || {};
    const creditY = H - m * .04, list = rowsOf(I), gap = m * .035, tq = (ST.tsz || 100) / 100;
    let y = m * .06;
    if (key === 'st') {   // اسٹیٹس: تصویر بڑی (اشتہار ہو تو اس کے ساتھ دائیں)، نیچے نام
      const d = showPh ? m * .44 : 0, aw = A.ad ? inner * .3 : 0;
      crescent(c, cx, y + m * .025, m * .03); y += m * .07;
      const pcx = A.ad ? pad + (inner - aw - gap) / 2 : cx;
      if (showPh) photoFrame(c, A, pcx, y + d / 2, d, preview, out);
      adSlot(c, A, W - pad - (A.ad ? aw : inner * .22), y, A.ad ? aw : inner * .22, Math.max(d, m * .2), preview, out);
      y += Math.max(d, A.ad ? d : 0) + m * .05;
      y = nameBlock(c, I, cx, y, inner * .94, m * .085) + m * .03;
    } else {              // واٹس ایپ / انسٹاگرام
      const hh = m * P.hero, d = showPh ? Math.min(hh, inner * .33) : 0, aw = A.ad ? Math.min(inner * .24, hh * .8) : 0;
      const nx0 = pad + d + (showPh ? gap : 0), nx1 = W - pad - (A.ad ? aw + gap : 0), nW = nx1 - nx0, ncx = (nx0 + nx1) / 2, nz = m * (key === 'ig' ? .075 : .068);
      if (showPh) photoFrame(c, A, pad + d / 2 + m * .01, y + hh / 2, d, preview, out);
      adSlot(c, A, W - pad - (A.ad ? aw : inner * .16), y, A.ad ? aw : inner * .16, A.ad ? hh : inner * .16, preview, out);
      const nH = nameBlock(c, I, ncx, 0, nW, nz, true), cr = m * .055, tot = cr + nH;
      let yy = y + Math.max(0, (hh - tot) / 2);
      crescent(c, ncx, yy + m * .022, m * .024); yy += cr;
      nameBlock(c, I, ncx, yy, nW, nz);
      y += Math.max(hh, tot) + m * .04;
    }
    const th = m * P.th * tq, tw = inner * .94;
    titleCap(c, I.title || 'جلسہ', cx - tw / 2, y, tw, th); y += th + m * .035;
    const bh = m * P.bh, bY = creditY - m * .03 - bh, free = bY - m * .02 - y;
    const cols = list.length > 3 ? P.cols : 1, nr = Math.ceil(list.length / cols) || 1, rh = Math.min(m * P.rh * (ST.csz || 100) / 100, free / nr);
    capsules(c, list, pad, y + (free - rh * nr) / 2, inner, rh, cols);
    bottomRow(c, I, A, pad, bY, inner, bh);
    creditLine(c, W, creditY, m * .02);
  }
  function drawWide(c, W, H, I, A, preview, out) {   // فیس بک: بائیں تصویر اور نام؛ دائیں اوپر اشتہار کے ساتھ عنوان کا کیپسول، پھر کیپسول، نیچے فون اور مونوگرام
    const m = H, pad = W * .045, showPh = !!(A.photo || preview), tq = (ST.tsz || 100) / 100;
    const lW = showPh ? W * .27 : 0, colX = pad + lW + (showPh ? W * .025 : 0), colW = W - pad - colX;
    if (showPh) {
      const d = Math.min(lW * .92, m * .5), pcx = pad + lW / 2;
      photoFrame(c, A, pcx, m * .08 + d / 2, d, preview, out);
      nameBlock(c, I, pcx, m * .08 + d + m * .05, lW * 1.05, m * .075);
    }
    const aw = A.ad ? m * .22 : 0, ah = m * .27;
    adSlot(c, A, W - pad - (A.ad ? aw : m * .15), m * .07, A.ad ? aw : m * .15, A.ad ? ah : m * .15, preview, out);
    let top = m * .08;
    if (!showPh && (I.pname || I.prole)) top = nameBlock(c, I, colX + (colW - aw) / 2, top, colW - aw - 20, m * .07) + m * .02;
    const th = m * .16 * tq, tW = colW - (A.ad ? aw + W * .02 : 0);
    titleCap(c, I.title || 'جلسہ', colX + th * .1, Math.max(top, A.ad ? m * .07 + (ah - th) / 2 : top), tW - th * .2, th);
    top = Math.max(top + th, A.ad ? m * .07 + ah : 0) + m * .04;
    const bh = m * .15, creditY = H - m * .035, bY = creditY - m * .025 - bh, free = bY - m * .015 - top;
    const list = rowsOf(I), cols = list.length > 3 ? 2 : 1, nr = Math.ceil(list.length / cols) || 1, rh = Math.min(m * .13 * (ST.csz || 100) / 100, free / nr);
    capsules(c, list, colX, top + (free - rh * nr) / 2, colW, rh, cols);
    bottomRow(c, I, A, colX, bY, colW, bh);
    creditLine(c, W, creditY, m * .026);
  }
  async function render(p, key, opts = {}) {
    const S = SIZES[key] || SIZES.wa, W = S.w, H = S.h, R = ST.round ? Math.min(W, H) * .05 : 0;
    const A = await assets(p), I = info(p), out = {};
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    background(c, W, H, R);
    c.save(); rr(c, 0, 0, W, H, R); c.clip();
    frame(c, W, H, R);
    if (key === 'fb') drawWide(c, W, H, I, A, opts.preview, out); else drawTall(c, W, H, I, A, key, opts.preview, out);
    c.restore();
    cv._ph = out.ph; cv._ad = out.ad;
    return cv;
  }

  // ---------- پوسٹر کا صفحہ ----------
  const CSS = `.ppo{position:fixed;inset:0;z-index:95;background:rgba(5,10,30,.82);display:flex;align-items:flex-end;justify-content:center}
  .ppo-b{position:relative;width:min(720px,100%);max-height:97svh;display:flex;flex-direction:column;background:linear-gradient(180deg,#fffaf0,#f6ecd4);border:1.5px solid #c8962f;border-radius:22px 22px 0 0;overflow:hidden}
  .ppo-h{display:flex;align-items:center;gap:8px;padding:6px 12px;background:linear-gradient(180deg,#16244d,#0c1634);color:#f1d27a}
  .ppo-h b{font-weight:400;font-size:19px}
  .ppo-h .x{margin-inline-start:auto;width:36px;height:36px;border-radius:50%;border:1px solid rgba(232,196,103,.5);background:rgba(255,255,255,.1);color:#f1d27a;font-size:16px;cursor:pointer}
  .ppo-c{display:flex;flex-direction:column;gap:4px;padding:6px 8px;background:#fffdf6;border-top:1px solid #e3cf98;flex:1 1 auto;min-height:90px;overflow-y:auto;order:3}
  .ppo-c>*{flex:none}
  .ppo-r{min-height:34px;display:flex;align-items:center;gap:5px;overflow-x:auto;white-space:nowrap;scrollbar-width:none}
  .ppo-r::-webkit-scrollbar{display:none}
  .ppo-r>span{font-size:13px;color:#7a5418;min-width:52px;flex:none}
  .ppo-r button{flex:none;border:1.5px solid #c8962f;border-radius:99px;padding:0 12px;min-height:32px;background:#fff;color:#16244d;font:inherit;font-size:14px;line-height:1.7;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
  .ppo-r button.on{background:linear-gradient(180deg,#24366e,#0c1634);color:#f1d27a;border-color:#0c1634}
  .ppo-r button i{width:16px;height:16px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.25)}
  .ppo-r small{font:12px Arial,sans-serif;opacity:.75}
  .ppo-r input{font:inherit;font-size:14px;border:1.5px solid #c8962f;border-radius:99px;padding:0 12px;min-height:32px;background:#fff;color:#16244d;width:min(230px,58vw);flex:none}
  .ppo-r input[type=range]{width:min(200px,45vw);min-height:28px;padding:0;border:0;background:none;accent-color:#c8962f}
  .ppo-szb{display:flex;flex-wrap:wrap;align-items:center;gap:3px 10px;padding:5px 8px;background:linear-gradient(180deg,#16244d,#0c1634);color:#f1d27a}
  .ppo-szb>b{font-weight:400;font-size:14px}
  .ppo-szb .rs{width:32px;height:32px;border-radius:50%;border:1px solid #c8962f;background:rgba(255,255,255,.1);color:#f1d27a;font-size:16px;cursor:pointer}
  .ppo-sz{display:flex;align-items:center;gap:4px;flex:1 1 230px;min-width:0;font-size:12.5px}
  .ppo-sz span{min-width:46px;flex:none;white-space:nowrap}
  .ppo-sz input{flex:1;min-width:50px;accent-color:#e8c467;margin:0}
  .ppo-sz button{flex:none;width:24px;height:24px;border-radius:50%;border:1px solid #c8962f;background:#fffaf0;color:#16244d;font:700 15px Arial,sans-serif;line-height:1;padding:0;cursor:pointer}
  .ppo-sz b{font:700 11px Arial,sans-serif;color:#fff3c4;min-width:32px;flex:none;text-align:center}
  @media (max-width:520px){.ppo-sz{flex-basis:44%}.ppo-szb>b,.ppo-szb .rs{display:none}}
  .ppo-r em{font-style:normal;font-size:12px;color:#7a5418;flex:none}
  .ppo-fg{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:5px 10px;padding:6px 8px;border:1.5px dashed #c8962f;border-radius:14px;background:#fffaf0}
  .ppo-fg[hidden]{display:none}
  .ppo-fg label{display:flex;align-items:center;gap:6px;font-size:13px;color:#7a5418}
  .ppo-fg label>*:first-child{min-width:88px;flex:none;font-weight:400}
  .ppo-fg b{color:#16244d}
  .ppo-fg select{flex:1;min-width:0;font:inherit;font-size:14px;border:1.5px solid #c8962f;border-radius:99px;padding:0 8px;min-height:32px;background:#fff;color:#16244d}
  .ppo-fg button{grid-column:1/-1;justify-self:center;border:1.5px solid #c8962f;border-radius:99px;padding:0 14px;min-height:32px;background:#fff;color:#16244d;font:inherit;font-size:14px;cursor:pointer}
  .ppo-in input{flex:1;width:auto;min-width:0;min-height:36px;font-size:15px}
  .ppo-r select{font:inherit;font-size:14px;border:1.5px solid #c8962f;border-radius:99px;padding:0 8px;min-height:32px;background:#fff;color:#16244d;max-width:150px}
  .ppo-v{flex:none;overflow:hidden;padding:8px;display:grid;place-items:center;background:#e9e1cc;min-height:160px;order:1}
  .ppo-v canvas{display:block;max-width:100%;max-height:42svh;width:auto;height:auto;cursor:pointer;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))}
  .ppo-h{order:0}.ppo-szb{order:2}.ppo-a{order:4}
  /* بڑی اسکرین: بائیں پوسٹر ہر وقت سامنے، دائیں سب اختیارات */
  @media (min-width:900px){
    .ppo{align-items:center}
    .ppo-b{width:min(1180px,96vw);height:94svh;max-height:94svh;border-radius:22px;display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,460px);grid-template-rows:auto auto minmax(0,1fr) auto}
    .ppo-h{grid-column:1/-1}
    .ppo-v{grid-column:1;grid-row:2/5;min-height:0;height:100%}
    .ppo-v canvas{max-height:calc(94svh - 90px)}
    .ppo-szb{grid-column:2;grid-row:2}
    .ppo-c{grid-column:2;grid-row:3;min-height:0}
    .ppo-a{grid-column:2;grid-row:4}
  }
  .ppo-a{display:grid;gap:6px;padding:6px 10px calc(env(safe-area-inset-bottom,0px) + 8px);background:#fffdf6;border-top:1px solid #e3cf98}
  .ppo-ab{display:flex;gap:8px}
  .ppo-ab button{flex:1;min-height:44px;border-radius:99px;font:inherit;font-size:16px;cursor:pointer}
  .ppo-so{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  .ppo-so button{min-height:40px;border:0;border-radius:14px;padding:2px 4px;font:inherit;font-size:13px;line-height:1.4;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;background:linear-gradient(180deg,var(--c1),var(--c2));box-shadow:0 3px 0 rgba(0,0,0,.25)}
  .ppo-so button:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.25)}
  .ppo-so i{font-style:normal;font-size:16px}
  .ppo-go{border:0;background:linear-gradient(180deg,#3fe07a,#16a34a 55%,#0f7a36);color:#fff;box-shadow:0 4px 0 #0b5e2a}
  .ppo-sv{border:1.5px solid #c8962f;background:#fff;color:#16244d}
  .ppo-ch{position:absolute;inset:0;z-index:2;background:rgba(5,10,30,.55);display:flex;align-items:center;justify-content:center}
  .ppo-ch>div{background:#fffaf0;border:2px solid #c8962f;border-radius:20px;padding:14px;display:grid;gap:10px;min-width:260px;text-align:center}
  .ppo-ch b{font-weight:400;font-size:19px;color:#16244d}
  .ppo-ch p{margin:0;font-size:13px;color:#5d4a1c;line-height:1.8}
  .ppo-ch button{border:0;border-radius:99px;min-height:48px;font:inherit;font-size:18px;cursor:pointer;color:#fff;background:linear-gradient(180deg,#24366e,#0c1634)}
  .ppo-ch button.g{background:linear-gradient(180deg,#3fe07a,#16a34a 55%,#0f7a36)}
  .ppo-ch button.n{background:#e9e1cc;color:#5d4a1c}
  .ppo-ch button.r{background:linear-gradient(180deg,#d9443a,#a3231a)}`;
  function open(p, H) {
    if (!document.getElementById('ppoCss')) { const s = document.createElement('style'); s.id = 'ppoCss'; s.textContent = CSS; document.head.appendChild(s); }
    let key = (() => { try { return localStorage.getItem(KEY) || 'wa'; } catch (e) { return 'wa'; } })(); if (!SIZES[key]) key = 'wa';
    const toast = m => { if (H && H.toast) H.toast(m); };
    const fonts = LK() ? LK().fonts : {};
    const chip = (g, v, label, extra = '') => `<button type="button" data-g="${g}" data-v="${v}"${extra}>${label}</button>`;
    const ov = document.createElement('div'); ov.className = 'ppo';
    ov.innerHTML = `<div class="ppo-b" role="dialog" aria-label="پروگرام کا پوسٹر">
      <div class="ppo-h"><b>🖼️ جلسے کا پوسٹر</b><button type="button" class="x" data-a="x" aria-label="بند">✕</button></div>
      <div class="ppo-c">
        <div class="ppo-r"><span>سائز</span>${Object.entries(SIZES).map(([k, s]) => chip('size', k, `${s.n}<small dir="ltr">${s.w}×${s.h}</small>`)).join('')}</div>
        <div class="ppo-r"><span>تصویر</span>${chip('photo', 'add', '📷 تصویر ایڈ کریں')}${chip('photo', 'cut', '✂️ پس منظر ہٹائیں')}${chip('photo', 'del', '🗑️ ہٹائیں')}</div>
        <div class="ppo-r"><span>فریم</span>${Object.entries(FRAMES).map(([k, n]) => chip('pframe', k, n)).join('')}</div>
        <div class="ppo-r"><span>تصویر</span>${chip('pz', '+', '🔍 بڑی')}${chip('pz', '-', '🔍 چھوٹی')}${chip('pm', 'u', '⬆️ اوپر')}${chip('pm', 'd', '⬇️ نیچے')}</div>
        <div class="ppo-r"><span>فریم بارڈر</span>${Object.entries(PFC).map(([k, t]) => chip('pfc', k, `${t.c ? `<i style="background:linear-gradient(180deg,${t.c[0]},${t.c[2]})"></i>` : ''}${t.n}`)).join('')}</div>
        <div class="ppo-r"><span>بارڈر موٹائی</span>${Object.entries(WEIGHTS).map(([k, n]) => chip('pfw', k, n)).join('')}</div>
        <div class="ppo-r ppo-in"><span>نام</span><input data-t="pname" placeholder="مثلاً مولانا مفتی محمد رضوان عزیز" aria-label="تصویر کے ساتھ نام"></div>
        <div class="ppo-r ppo-in"><span>عہدہ</span><input data-t="prole" placeholder="مثلاً مدیر دارالعلوم …" aria-label="عہدہ"></div>
        <div class="ppo-r"><span>اشتہار</span><span id="ppoAdR"></span></div>
        <div class="ppo-r"><span>کیپسول</span>${Object.entries(CAPS).map(([k, n]) => chip('cap', k, n)).join('')}</div>
        <div class="ppo-r"><span>کیپسول رنگ</span><em>مدھم</em><input type="range" min="-50" max="50" step="5" data-s="capi" aria-label="ہلکا یا گہرا"><em>گہرا</em></div>
        <div class="ppo-r"><span>پس منظر</span>${Object.entries(THEMES).map(([k, t]) => chip('theme', k, `<i style="background:linear-gradient(180deg,${t.bg[0]},${t.bg[2]})"></i>${t.n}`)).join('')}</div>
        <div class="ppo-r"><span>پس منظر رنگ</span><em>مدھم</em><input type="range" min="-50" max="50" step="5" data-s="bgi" aria-label="ہلکا یا گہرا"><em>گہرا</em></div>
        <div class="ppo-r"><span>بارڈر</span>${Object.entries(BORDERS).map(([k, b]) => chip('border', k, `<i style="background:linear-gradient(180deg,${b.c[0]},${b.c[2]})"></i>${b.n}`)).join('')}${Object.entries(WEIGHTS).map(([k, n]) => chip('bw', k, n)).join('')}${chip('round', '1', 'گول کونے')}</div>
        <div class="ppo-r"><span>بارڈر انداز</span>${Object.entries(BSTYLES).map(([k, n]) => chip('bstyle', k, n)).join('')}</div>
        <div class="ppo-r"><span>لکھائی</span>${Object.entries(INKS).map(([k, t]) => chip('ink', k, `<i style="background:linear-gradient(180deg,${t.h[0]},${t.h[2]})"></i>${t.n}`)).join('')}${Object.entries(TWEIGHTS).map(([k, n]) => chip('tw', k, n)).join('')}</div>
        <div class="ppo-r"><span>فونٹ</span><button type="button" data-a="fonts">🔤 ہر لکھائی کا فونٹ الگ</button></div>
        <div class="ppo-fg" id="ppoFg" hidden>
          <label><b>سب عنوان</b><select data-f="tfont">${Object.entries(fonts).map(([k, f]) => `<option value="${k}">${f.n}</option>`).join('')}</select></label>
          <label><b>سب لکھائی</b><select data-f="bfont">${Object.entries(fonts).map(([k, f]) => `<option value="${k}">${f.n}</option>`).join('')}</select></label>
          ${PARTS.map(([k, n]) => `<label><span>${n}</span><select data-pf="${k}"><option value="">— اوپر والا —</option>${Object.entries(fonts).map(([k, f]) => `<option value="${k}">${f.n}</option>`).join('')}</select></label>`).join('')}
          <button type="button" data-a="pfreset">↺ سب پہلے جیسا</button>
        </div>
      </div>
      <div class="ppo-szb"><b>📏 سائز</b>${[['tsz', 'عنوان'], ['nsz', 'نام'], ['rsz', 'عہدہ / ادارہ'], ['csz', 'کیپسول']].map(([k, n]) => `<label class="ppo-sz"><span>${n}</span><button type="button" data-z="${k}" data-d="-1" aria-label="${n} چھوٹا">−</button><input type="range" min="50" max="150" step="5" data-s="${k}" aria-label="${n}"><button type="button" data-z="${k}" data-d="1" aria-label="${n} بڑا">+</button><b data-sv="${k}"></b></label>`).join('')}<button type="button" class="rs" data-a="szreset">↺</button></div>
      <div class="ppo-v" id="ppoV"><p>تیار ہو رہا ہے…</p></div>
      <div class="ppo-a"><div class="ppo-so">${Object.entries(SOCIAL).map(([k, o]) => `<button type="button" data-a="so" data-k="${k}" style="--c1:${o.c[0]};--c2:${o.c[1]}"><i>${o.i}</i>${o.n}</button>`).join('')}</div>
        <div class="ppo-ab"><button type="button" class="ppo-go" data-a="share">📤 سب ایپس میں بھیجیں</button><button type="button" class="ppo-sv" data-a="save">⬇️ محفوظ کریں</button></div></div>
      <input type="file" accept="image/*" hidden id="ppoGal"><input type="file" accept="image/*" capture="user" hidden id="ppoCam"><input type="file" accept="image/*" hidden id="ppoAd"></div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); window.removeEventListener('hashchange', close); };
    window.addEventListener('hashchange', close);
    let cv = null, tok = 0;
    const mark = () => {
      ov.querySelector('#ppoAdR').innerHTML = p.poster ? chip('ad', '1', '🖼️ اشتہار دکھائیں') + chip('adpick', '1', '🔄 اشتہار بدلیں') : chip('adpick', '1', '➕ اشتہار لگائیں');
      ov.querySelectorAll('[data-g]').forEach(b => {
        const g = b.dataset.g, v = b.dataset.v;
        b.classList.toggle('on', g === 'size' ? v === key : g === 'photo' ? (v === 'cut' && !!ST.cutbg) : g === 'ad' || g === 'round' ? !!ST[g] : g === 'pz' || g === 'pm' || g === 'adpick' ? false : String(ST[g]) === v);
      });
      ov.querySelectorAll('[data-f]').forEach(s => { s.value = ST[s.dataset.f] || ''; });
      ov.querySelectorAll('[data-pf]').forEach(s => { s.value = (ST.pf && ST.pf[s.dataset.pf]) || ''; });
      ov.querySelectorAll('[data-s]').forEach(s => { s.value = ST[s.dataset.s] != null ? ST[s.dataset.s] : 0; });
      ov.querySelectorAll('[data-sv]').forEach(b => { b.textContent = (ST[b.dataset.sv] || 100) + '٪'; });
      const I0 = info(p); ov.querySelectorAll('[data-t]').forEach(s => { if (document.activeElement !== s) s.value = I0[s.dataset.t] || ''; });
    };
    const draw = async () => {
      const my = ++tok; mark();
      const v = ov.querySelector('#ppoV'); if (!cv) v.innerHTML = '<p>تیار ہو رہا ہے…</p>';
      const c2 = await render(p, key, { preview: true }); if (my !== tok) return; cv = c2;
      cv.id = 'ppoImg'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'پوسٹر'); v.replaceChildren(cv);   // تیار پوسٹر فوراً سامنے (تصویر بنائے بغیر — تیز)
    };
    const blob = async () => { const c3 = await render(p, key); return new Promise(r => c3.toBlob(r, 'image/png')); };
    const fname = () => `jalsa-${p.date}-${key}.png`;
    const chooser = () => {
      const ch = document.createElement('div'); ch.className = 'ppo-ch';
      ch.innerHTML = `<div><b>📷 تصویر ایڈ کریں</b><p>بغیر پس منظر والی (PNG) تصویر ہو تو سب سے اچھا۔<br>سادہ پس منظر والی تصویر کا پس منظر «✂️ پس منظر ہٹائیں» سے ہٹ جاتا ہے۔</p><button type="button" class="g" data-c="cam">📷 کیمرہ</button><button type="button" data-c="gal">🖼️ گیلری</button><button type="button" class="n" data-c="no">بند کریں</button></div>`;
      ov.querySelector('.ppo-b').appendChild(ch);
      ch.addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (!c && e.target !== ch) return; ch.remove(); if (c && c.dataset.c === 'cam') ov.querySelector('#ppoCam').click(); if (c && c.dataset.c === 'gal') ov.querySelector('#ppoGal').click(); });
    };
    const setPhoto = src => {
      memPhoto = src; let ok = false;
      try { if (window.MA_BRAND) ok = window.MA_BRAND.set(Object.assign(window.MA_BRAND.get(), { photo: src })); else { const b = BRD(); b.photo = src; localStorage.setItem('maktaba-aziz-brand', JSON.stringify(b)); ok = true; } } catch (er) { ok = false; }
      return ok;
    };
    let tt = null;
    ov.addEventListener('input', e => { const r = e.target.closest('[data-s]'); if (!r) return; ST[r.dataset.s] = Number(r.value); saveSt(); const sv = ov.querySelector(`[data-sv="${r.dataset.s}"]`); if (sv) sv.textContent = r.value + '٪'; clearTimeout(tt); tt = setTimeout(draw, 150); });
    ov.addEventListener('input', e => { const s = e.target.closest('[data-t]'); if (!s) return; ST[s.dataset.t] = s.value; saveSt(); clearTimeout(tt); tt = setTimeout(draw, 400); });
    ov.addEventListener('change', e => { const s = e.target.closest('[data-pf]'); if (!s) return; ST.pf = Object.assign({}, ST.pf, { [s.dataset.pf]: s.value }); saveSt(); draw(); });
    ov.addEventListener('change', e => { const s = e.target.closest('[data-f]'); if (!s) return; ST[s.dataset.f] = s.value || DEF[s.dataset.f]; saveSt(); draw(); });
    ov.addEventListener('click', async e => {
      if (e.target.id === 'ppoImg' && cv) {
        const r = e.target.getBoundingClientRect(), sx = cv.width / r.width, x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sx, hit = q => q && x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h;
        if (hit(cv._ph)) { chooser(); return; }
        if (hit(cv._ad)) { ov.querySelector('#ppoAd').click(); return; }
      }
      const g = e.target.closest('[data-g]');
      if (g) {
        const k = g.dataset.g, v = g.dataset.v;
        if (k === 'size') { key = v; try { localStorage.setItem(KEY, key); } catch (er) {} }
        else if (k === 'photo') { if (v === 'add') return chooser(); if (v === 'cut') { ST.cutbg = ST.cutbg ? 0 : 1; saveSt(); } if (v === 'del') { if (!confirm('تصویر ہٹا دیں؟')) return; setPhoto(''); } }
        else if (k === 'ad' || k === 'round') { ST[k] = ST[k] ? 0 : 1; saveSt(); }
        else if (k === 'adpick') return ov.querySelector('#ppoAd').click();
        else if (k === 'pz') { ST.pzoom = Math.max(1, Math.min(2.6, Math.round((ST.pzoom + (v === '+' ? .15 : -.15)) * 100) / 100)); saveSt(); }
        else if (k === 'pm') { ST.py = Math.max(0, Math.min(1, Math.round((ST.py + (v === 'u' ? -.08 : .08)) * 100) / 100)); saveSt(); }
        else { ST[k] = k === 'bw' || k === 'tw' || k === 'pfw' ? Number(v) : v; saveSt(); }
        draw(); return;
      }
      const zb = e.target.closest('[data-z]');
      if (zb) { const k = zb.dataset.z; ST[k] = Math.max(50, Math.min(150, (ST[k] || 100) + 5 * Number(zb.dataset.d))); saveSt(); draw(); return; }
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'szreset') { ['tsz', 'nsz', 'rsz', 'csz'].forEach(k => { ST[k] = DEF[k]; }); saveSt(); draw(); return; }
      if (a === 'x') return close();
      if (a === 'fonts') { const g = ov.querySelector('#ppoFg'); g.hidden = !g.hidden; e.target.closest('button').classList.toggle('on', !g.hidden); if (!g.hidden) g.scrollIntoView({ block: 'nearest' }); return; }
      if (a === 'pfreset') { ST.pf = {}; ST.tfont = DEF.tfont; ST.bfont = DEF.bfont; saveSt(); draw(); return; }
      if (a === 'so') {   // ایک ایپ کے لیے: اسی کا سائز، پیغام کاپی (انسٹاگرام / اسٹیٹس تصویر کے ساتھ لکھا نہیں لیتے)
        const S = SOCIAL[e.target.closest('[data-k]').dataset.k]; if (!S) return;
        toast(`${S.n} کے سائز میں پوسٹر تیار ہو رہا ہے…`);
        const c3 = await render(p, S.size), sb = await new Promise(r => c3.toBlob(r, 'image/png')), nm = `jalsa-${p.date}-${S.size}.png`;
        const sf = new File([sb], nm, { type: 'image/png' }), tx = H && H.textOf ? H.textOf(p) : '';
        let copied = false; if (tx && navigator.clipboard) { try { await navigator.clipboard.writeText(tx); copied = true; } catch (er) {} }
        try {
          if (navigator.canShare && navigator.canShare({ files: [sf] })) {
            await navigator.share(S.noText ? { files: [sf] } : { files: [sf], text: tx });
            if (copied && S.noText) toast('پروگرام کا پیغام کاپی ہو گیا — چاہیں تو ساتھ پیسٹ کر دیں');
            return;
          }
        } catch (er) { if (er && er.name === 'AbortError') return; }
        const l = document.createElement('a'); l.href = URL.createObjectURL(sb); l.download = nm; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
        if (S.web) window.open(S.web(tx), '_blank', 'noopener');
        toast(`پوسٹر محفوظ ہو گیا — ${S.n} میں یہی تصویر لگائیں` + (copied ? '، پیغام بھی کاپی ہے' : ''));
        return;
      }
      if (!cv) return;
      const b = await blob(), file = new File([b], fname(), { type: 'image/png' });
      if (a === 'share') {
        const tx = H && H.textOf ? H.textOf(p) : '';
        try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: tx }); return; } } catch (er) { if (er && er.name === 'AbortError') return; }
      }
      const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = fname(); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
      toast('پوسٹر فون میں محفوظ ہو گیا');
    });
    // تصویر لیں: شفافیت (PNG) برقرار رکھیں، سائز چھوٹا کریں
    const pick = async ev => {
      const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
      toast('تصویر لگ رہی ہے…');
      const url = URL.createObjectURL(f);
      let img = await loadImg(url);
      if (!img && window.createImageBitmap) { try { img = await createImageBitmap(f); } catch (er) {} }
      URL.revokeObjectURL(url);
      if (!img) { toast('یہ تصویر نہیں کھل سکی — کوئی اور تصویر چنیں'); return; }
      const S = Math.min(1, 720 / Math.max(img.width, img.height)), c2 = document.createElement('canvas');
      c2.width = Math.round(img.width * S); c2.height = Math.round(img.height * S);
      c2.getContext('2d').drawImage(img, 0, 0, c2.width, c2.height);
      let src = ''; try { src = c2.toDataURL('image/webp', .86); } catch (er) {}
      if (!src.startsWith('data:image/webp')) src = c2.toDataURL('image/png');
      toast(setPhoto(src) ? 'تصویر لگ گئی اور محفوظ ہو گئی' : 'تصویر لگ گئی، مگر فون میں جگہ کم ہونے سے محفوظ نہیں ہو سکی');
      draw();
    };
    // جلسے کا اشتہار: یہیں سے لگائیں — پروگرام کے ساتھ محفوظ
    ov.querySelector('#ppoAd').addEventListener('change', async ev => {
      const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
      const url = URL.createObjectURL(f); const img = await loadImg(url); URL.revokeObjectURL(url);
      if (!img) { toast('یہ تصویر نہیں کھل سکی — کوئی اور تصویر چنیں'); return; }
      const S = Math.min(1, 1000 / Math.max(img.width, img.height)), c2 = document.createElement('canvas');
      c2.width = Math.round(img.width * S); c2.height = Math.round(img.height * S);
      const g = c2.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c2.width, c2.height); g.drawImage(img, 0, 0, c2.width, c2.height);
      p.poster = c2.toDataURL('image/jpeg', .82); ST.ad = 1; saveSt();
      try { if (H && H.save) H.save(); } catch (er) {}
      toast('اشتہار لگ گیا'); draw();
    });
    ov.querySelector('#ppoGal').addEventListener('change', pick);
    ov.querySelector('#ppoCam').addEventListener('change', pick);
    draw();
  }
  window.MA_PPOSTER = { open, render, SIZES };
})();
