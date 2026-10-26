/* میرا مکتبہ — پروگرام (جلسہ) کا پوسٹر
   اوپر: جلسے کا عنوان + مالک/مہتمم کی بڑی تصویر (بغیر فریم؛ بغیر پس منظر والی تصویر بھی)
   بیچ: تاریخ، وقت، بمقام، شہر، میزبان، نمبر — ہر سطر اپنے نشان کے ساتھ
   نیچے: مالک کا نام (بڑا)، مکتبہ/مدرسہ (باریک) اور اس کا لوگو، فون؛ پروگرام کا اشتہار ہو تو نیچے بائیں چھوٹا
   رنگ، بارڈر، لکھائی کا رنگ، فونٹ اور گول کونے — سب چن سکتے ہیں؛ سائز: واٹس ایپ، اسٹیٹس، فیس بک، انسٹاگرام */
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
  const DEF = { theme: 'navy', border: 'gold', ink: 'gold', bw: 2, round: 1, tfont: 'kasheeda', bfont: 'noori', ad: 1, cutbg: 0 };
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
  const BRD = () => { try { return JSON.parse(localStorage.getItem('maktaba-aziz-brand')) || {}; } catch (e) { return {}; } };
  const dOf = s => new Date(String(s).slice(0, 10) + 'T00:00:00');
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const T = () => THEMES[ST.theme] || THEMES.navy;
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
    c.fillStyle = grad(c, y - z * .8, y + z * .2, K().h); c.fillText(s, x, y); c.restore();
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
  function frame(c, W, H, R) {
    const m = Math.min(W, H), o = m * .025, s = m * .13, bc = B().c, w = ST.bw;
    c.save(); c.lineJoin = 'round';
    c.strokeStyle = grad(c, 0, H, bc); c.lineWidth = m * .005 * (w + .6); rr(c, o, o, W - 2 * o, H - 2 * o, R * .8); c.stroke();
    if (w >= 2) { c.globalAlpha = .6; c.lineWidth = m * .0025 * w; rr(c, o * 1.7, o * 1.7, W - 3.4 * o, H - 3.4 * o, R * .65); c.stroke(); }
    c.restore();
    const col = bc[1];
    corner(c, o * 2.1, o * 2.1, 1, 1, s, col); corner(c, W - o * 2.1, o * 2.1, -1, 1, s, col); corner(c, o * 2.1, H - o * 2.1, 1, -1, s, col); corner(c, W - o * 2.1, H - o * 2.1, -1, -1, s, col);
  }
  function crescent(c, x, y, r) {
    c.save(); c.fillStyle = grad(c, y - r, y + r, B().c);
    c.beginPath(); c.arc(x, y, r, 0, 7); c.arc(x + r * .38, y - r * .12, r * .82, 0, 7, true); c.fill('evenodd');
    const sx = x + r * .25, sy = y - r * .05, sr = r * .32; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? sr * .45 : sr; c.lineTo(sx + q * Math.cos(a), sy + q * Math.sin(a)); }
    c.closePath(); c.fill(); c.restore();
  }
  function mosque(c, cx, base, w) {   // نیچے مسجد کا سنہری خاکہ
    c.save(); c.fillStyle = grad(c, base - w * .5, base, B().c); c.globalAlpha = .9;
    const dome = (x, r, h) => { c.beginPath(); c.moveTo(x - r, base); c.lineTo(x - r, base - h); c.quadraticCurveTo(x - r, base - h - r * 1.25, x, base - h - r * 1.6); c.quadraticCurveTo(x + r, base - h - r * 1.25, x + r, base - h); c.lineTo(x + r, base); c.closePath(); c.fill(); };
    const minar = (x, h) => { c.fillRect(x - w * .018, base - h, w * .036, h); c.beginPath(); c.moveTo(x - w * .03, base - h); c.lineTo(x, base - h - w * .07); c.lineTo(x + w * .03, base - h); c.closePath(); c.fill(); };
    c.fillRect(cx - w * .32, base - w * .1, w * .64, w * .1);
    dome(cx, w * .14, w * .14); dome(cx - w * .22, w * .07, w * .1); dome(cx + w * .22, w * .07, w * .1);
    minar(cx - w * .4, w * .36); minar(cx + w * .4, w * .36);
    c.restore();
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
  function icon(c, kind, x, y, s) {
    const col = K().l; c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = s * .09; c.lineCap = 'round'; c.lineJoin = 'round';
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
    return {
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
      if (LK()) await Promise.all([LK().loadFont(ST.tfont), LK().loadFont(ST.bfont)].map(x => x && x.catch ? x.catch(() => {}) : x));
      await Promise.all([document.fonts.load(`60px ${TF()}`, 'جلسہ سیرت النبی 123'), document.fonts.load(`40px ${BF()}`, 'میزبان 0300-1234567'), document.fonts.load(`40px ${NF}`, '0123')]);
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
  // بڑی تصویر — بغیر فریم؛ نیچے سے جمی ہوئی، پیچھے ہلکی روشنی
  function photoBox(c, A, x, y, w, h, preview, out) {
    out.ph = { x, y, w, h };
    if (A.photo) {
      const sc = Math.min(w / A.photo.width, h / A.photo.height), iw = A.photo.width * sc, ih = A.photo.height * sc;
      const gx = x + w / 2, gy = y + h - ih * .55;
      c.save(); const g = c.createRadialGradient(gx, gy, 10, gx, gy, Math.max(iw, ih) * .7); g.addColorStop(0, T().light ? 'rgba(200,150,47,.25)' : 'rgba(241,210,122,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - w * .1, y - h * .05, w * 1.2, h * 1.1); c.restore();
      c.drawImage(A.photo, x + (w - iw) / 2, y + h - ih, iw, ih);
    } else if (preview) {
      c.save(); c.setLineDash([14, 10]); c.strokeStyle = K().l; c.lineWidth = 3; rr(c, x + w * .08, y + h * .05, w * .84, h * .9, 24); c.stroke(); c.restore();
      const s = Math.min(w, h) * .2, cx = x + w / 2, cy = y + h * .42;
      c.save(); c.fillStyle = K().l; rr(c, cx - s, cy - s * .7, s * 2, s * 1.4, s * .25); c.fill(); c.fillRect(cx - s * .35, cy - s * .95, s * .7, s * .3);
      c.beginPath(); c.arc(cx, cy, s * .45, 0, 7); c.fillStyle = T().bg[1]; c.fill(); c.beginPath(); c.arc(cx, cy, s * .28, 0, 7); c.fillStyle = K().l; c.fill(); c.restore();
      text(c, 'تصویر ایڈ کریں', cx, y + h * .72, Math.min(w, h) * .1, K().t, BF(), 'center', w * .85);
      text(c, '(اختیاری)', cx, y + h * .84, Math.min(w, h) * .07, K().l, BF(), 'center', w * .85);
    }
  }
  function rows(c, list, x, y, w, rh, z) {
    list.forEach(([ic, lab, val], i) => {
      const yy = y + i * rh, cy = yy + rh * .5, s = rh * .5;
      icon(c, ic, x + w - s * .7, cy, s);
      const L = lab ? lab + ': ' : '', f = BF(), tx = x + w - s * 1.75;
      c.font = `${z}px ${f}`; const lw = L ? c.measureText(L).width : 0;
      if (L) text(c, L, tx, cy + z * .35, z, K().l, f);
      const vz = fitFont(c, val, tx - lw - x - 6, z, f, z * .55);
      text(c, val, tx - lw, cy + z * .35, vz, K().t, f);
      c.save(); c.strokeStyle = B().c[1]; c.globalAlpha = .45; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, yy + rh - 2); c.lineTo(x + w, yy + rh - 2); c.stroke(); c.restore();
    });
  }
  function adThumb(c, img, x, y, maxW, maxH) {
    const sc = Math.min(maxW / img.width, maxH / img.height), w = img.width * sc, h = img.height * sc, yy = y + maxH - h;
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 16; c.fillStyle = B().c[1]; rr(c, x - 5, yy - 5, w + 10, h + 10, 12); c.fill(); c.restore();
    c.save(); rr(c, x, yy, w, h, 9); c.clip(); c.drawImage(img, x, yy, w, h); c.restore();
  }
  function bottomBlock(c, I, A, cx, y, W, z) {   // مالک کا نام (بڑا) + مکتبہ/مدرسہ اور لوگو (باریک) + فون
    let yy = y;
    if (I.owner) { headText(c, I.owner, cx, yy, fitFont(c, I.owner, W * .92, z * 1.6, BF()), BF()); yy += z * 1.5; }
    if (I.maktaba) {
      const d = z * 1.6, mz = fitFont(c, I.maktaba, W * .9 - d - z * .5, z * .95, BF()), mw = c.measureText(I.maktaba).width;
      const tot = mw + (A.logo ? d + z * .5 : 0), right = cx + tot / 2;
      text(c, I.maktaba, right, yy, mz, K().t, BF());
      if (A.logo) roundLogo(c, A.logo, right - mw - z * .5 - d / 2, yy - mz * .3, d);
      yy += z * 1.55;
    }
    if (I.ophone) {
      c.font = `700 ${Math.round(z * 1.05)}px ${NF}`; const pw = c.measureText(I.ophone).width, s = z * .9, tot = pw + s * 1.8;
      c.textAlign = 'left'; c.direction = 'ltr'; c.fillStyle = K().t; c.fillText(I.ophone, cx - tot / 2 + s * 1.8, yy);
      icon(c, 'phone', cx - tot / 2 + s * .6, yy - z * .35, s);
      yy += z * 1.4;
    }
    return yy;
  }

  // ---------- ترتیب ----------
  const bottomH = (I, z) => (I.owner ? z * 1.5 : 0) + (I.maktaba ? z * 1.55 : 0) + (I.ophone ? z * 1.4 : 0);
  function drawTall(c, W, H, I, A, key, preview, out) {
    const m = W, pad = m * .09, inner = W - 2 * pad, cx = W / 2;
    const P = { st: { head: .5, rh: .095, z: .048, bz: .044 }, ig: { head: .4, rh: .072, z: .042, bz: .036 }, wa: { head: .32, rh: .06, z: .038, bz: .03 } }[key] || {};
    let y = H * .045;
    // اوپر: عنوان (دائیں) + بڑی تصویر (بائیں)
    const hh = W * P.head, showPh = A.photo || preview, phW = showPh ? inner * .52 : 0;
    const tW = inner - phW - (showPh ? m * .02 : 0), tX = W - pad, tcx = tX - tW / 2;
    crescent(c, tcx, y + m * .035, m * .03);
    const Tt = wrap2(c, I.title || 'جلسہ', tW, m * .13, TF(), m * .055), lh = Tt.z * 1.2;
    const tb = y + m * .07 + (hh - m * .07) * .5 - (Tt.lines.length - 1) * lh / 2 + Tt.z * .3;
    Tt.lines.forEach((ln, i) => headText(c, ln, tcx, tb + i * lh, Tt.z, TF()));
    if (showPh) photoBox(c, A, pad - m * .02, y, phW + m * .02, hh, preview, out);
    y += hh + m * .025;
    divider(c, cx, y, inner * .7); y += m * .025;
    // نیچے کا حصہ پہلے ناپ لیں، باقی جگہ سطروں کو
    const bz = W * P.bz, bH = bottomH(I, bz), creditY = H - m * .045;
    const mosqueH = key === 'st' ? m * .28 : 0;
    const list = rowsOf(I), free = creditY - m * .04 - mosqueH - bH - m * .1 - y;
    const rh = Math.min(W * P.rh, free / Math.max(list.length, 1)), z = Math.min(W * P.z, rh * .6);
    rows(c, list, pad, y, inner, rh, z);
    y += list.length * rh + m * .035;
    divider(c, cx, y, inner * .5); y += m * .065;
    // اشتہار نیچے بائیں؛ نام والا حصہ باقی جگہ کے بیچ میں
    let bcx = cx;
    if (A.ad) {
      const ah = Math.max(bH + m * .02, m * .2), aw = ah * .8, ay = y - m * .05;
      adThumb(c, A.ad, pad, ay, aw, ah);
      bcx = (pad + aw + m * .03 + (W - pad)) / 2;
    }
    bottomBlock(c, I, A, bcx, y, (W - pad - bcx) * 2, bz);
    if (key === 'st') mosque(c, cx, creditY - m * .035, W * .4);
    creditLine(c, W, creditY, m * .02);
  }
  function drawWide(c, W, H, I, A, preview, out) {
    const m = H, pad = W * .05, showPh = A.photo || preview;
    const phW = showPh ? W * .28 : 0, colX = pad + phW + W * .02, colW = W - pad - colX;
    if (showPh) photoBox(c, A, pad, m * .07, phW, m * .83, preview, out);
    const title = I.title || 'جلسہ';
    const tz = fitFont(c, title, colW * .9, m * .13, TF(), m * .06);
    headText(c, title, colX + colW / 2, m * .2, tz, TF());
    const list = rowsOf(I), rh = Math.min(m * .085, (m * .5) / Math.max(list.length, 1));
    rows(c, list, colX, m * .26, colW, rh, rh * .5);
    let y = m * .26 + list.length * rh + m * .07;
    let ccx = colX + colW / 2, cw = colW;
    if (A.ad) { const ah = m * .24, aw = ah * .8; adThumb(c, A.ad, colX, Math.min(y - m * .06, H - m * .1 - ah), aw, ah); ccx = (colX + aw + 16 + colX + colW) / 2; cw = colX + colW - (colX + aw + 16); }
    if (I.owner) { headText(c, I.owner, ccx, y, fitFont(c, I.owner, cw * .9, m * .07, BF()), BF()); y += m * .075; }
    if (I.maktaba) {
      const d = m * .07, mz = fitFont(c, I.maktaba, cw * .85 - d, m * .04, BF()), mw = c.measureText(I.maktaba).width, tot = mw + (A.logo ? d + 12 : 0), right = ccx + tot / 2;
      text(c, I.maktaba, right, y, mz, K().t, BF()); if (A.logo) roundLogo(c, A.logo, right - mw - 12 - d / 2, y - mz * .3, d);
    }

    creditLine(c, W, H - m * .04, m * .026);
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
    cv._ph = out.ph;
    return cv;
  }

  // ---------- پوسٹر کا صفحہ ----------
  const CSS = `.ppo{position:fixed;inset:0;z-index:95;background:rgba(5,10,30,.82);display:flex;align-items:flex-end;justify-content:center}
  .ppo-b{position:relative;width:min(720px,100%);max-height:97svh;display:flex;flex-direction:column;background:linear-gradient(180deg,#fffaf0,#f6ecd4);border:1.5px solid #c8962f;border-radius:22px 22px 0 0;overflow:hidden}
  .ppo-h{display:flex;align-items:center;gap:8px;padding:6px 12px;background:linear-gradient(180deg,#16244d,#0c1634);color:#f1d27a}
  .ppo-h b{font-weight:400;font-size:19px}
  .ppo-h .x{margin-inline-start:auto;width:36px;height:36px;border-radius:50%;border:1px solid rgba(232,196,103,.5);background:rgba(255,255,255,.1);color:#f1d27a;font-size:16px;cursor:pointer}
  .ppo-c{display:grid;gap:4px;padding:6px 8px;background:#fffdf6;border-bottom:1px solid #e3cf98;max-height:34svh;overflow-y:auto}
  .ppo-r{display:flex;align-items:center;gap:5px;overflow-x:auto;white-space:nowrap;scrollbar-width:none}
  .ppo-r::-webkit-scrollbar{display:none}
  .ppo-r>span{font-size:13px;color:#7a5418;min-width:52px;flex:none}
  .ppo-r button{flex:none;border:1.5px solid #c8962f;border-radius:99px;padding:0 12px;min-height:32px;background:#fff;color:#16244d;font:inherit;font-size:14px;line-height:1.7;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
  .ppo-r button.on{background:linear-gradient(180deg,#24366e,#0c1634);color:#f1d27a;border-color:#0c1634}
  .ppo-r button i{width:16px;height:16px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.25)}
  .ppo-r small{font:12px Arial,sans-serif;opacity:.75}
  .ppo-r select{font:inherit;font-size:14px;border:1.5px solid #c8962f;border-radius:99px;padding:0 8px;min-height:32px;background:#fff;color:#16244d;max-width:150px}
  .ppo-v{flex:1;overflow:auto;padding:10px;display:grid;place-items:center;background:#e9e1cc;min-height:200px}
  .ppo-v img{max-width:100%;max-height:52svh;height:auto;cursor:pointer;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))}
  .ppo-a{display:flex;gap:8px;padding:8px 12px calc(env(safe-area-inset-bottom,0px) + 10px);background:#fffdf6;border-top:1px solid #e3cf98}
  .ppo-a button{flex:1;min-height:46px;border-radius:99px;font:inherit;font-size:17px;cursor:pointer}
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
        <div class="ppo-r"><span>تصویر</span>${chip('photo', 'add', '📷 تصویر ایڈ کریں')}${chip('photo', 'cut', '✂️ پس منظر ہٹائیں')}${chip('photo', 'del', '🗑️ ہٹائیں')}${p.poster ? chip('ad', '1', '🖼️ اشتہار شامل') : ''}</div>
        <div class="ppo-r"><span>پس منظر</span>${Object.entries(THEMES).map(([k, t]) => chip('theme', k, `<i style="background:linear-gradient(180deg,${t.bg[0]},${t.bg[2]})"></i>${t.n}`)).join('')}</div>
        <div class="ppo-r"><span>بارڈر</span>${Object.entries(BORDERS).map(([k, b]) => chip('border', k, `<i style="background:linear-gradient(180deg,${b.c[0]},${b.c[2]})"></i>${b.n}`)).join('')}${Object.entries(WEIGHTS).map(([k, n]) => chip('bw', k, n)).join('')}${chip('round', '1', 'گول کونے')}</div>
        <div class="ppo-r"><span>لکھائی</span>${Object.entries(INKS).map(([k, t]) => chip('ink', k, `<i style="background:linear-gradient(180deg,${t.h[0]},${t.h[2]})"></i>${t.n}`)).join('')}</div>
        <div class="ppo-r"><span>فونٹ</span><select data-f="tfont" aria-label="عنوان کا فونٹ"><option value="">عنوان</option>${Object.entries(fonts).map(([k, f]) => `<option value="${k}">عنوان: ${f.n}</option>`).join('')}</select><select data-f="bfont" aria-label="باقی لکھائی کا فونٹ"><option value="">لکھائی</option>${Object.entries(fonts).map(([k, f]) => `<option value="${k}">لکھائی: ${f.n}</option>`).join('')}</select></div>
      </div>
      <div class="ppo-v" id="ppoV"><p>تیار ہو رہا ہے…</p></div>
      <div class="ppo-a"><button type="button" class="ppo-go" data-a="share">📤 بھیجیں</button><button type="button" class="ppo-sv" data-a="save">⬇️ محفوظ کریں</button></div>
      <input type="file" accept="image/*" hidden id="ppoGal"><input type="file" accept="image/*" capture="user" hidden id="ppoCam"></div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); window.removeEventListener('hashchange', close); };
    window.addEventListener('hashchange', close);
    let cv = null, tok = 0;
    const mark = () => {
      ov.querySelectorAll('[data-g]').forEach(b => {
        const g = b.dataset.g, v = b.dataset.v;
        b.classList.toggle('on', g === 'size' ? v === key : g === 'photo' ? (v === 'cut' && !!ST.cutbg) : g === 'ad' || g === 'round' ? !!ST[g] : String(ST[g]) === v);
      });
      ov.querySelectorAll('[data-f]').forEach(s => { s.value = ST[s.dataset.f] || ''; });
    };
    const draw = async () => {
      const my = ++tok; mark();
      const v = ov.querySelector('#ppoV'); if (!cv) v.innerHTML = '<p>تیار ہو رہا ہے…</p>';
      const c2 = await render(p, key, { preview: true }); if (my !== tok) return; cv = c2;
      v.innerHTML = ''; const im = new Image(); im.src = cv.toDataURL('image/png'); im.alt = 'پوسٹر'; im.id = 'ppoImg'; v.appendChild(im);
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
    ov.addEventListener('change', e => { const s = e.target.closest('[data-f]'); if (!s) return; ST[s.dataset.f] = s.value || DEF[s.dataset.f]; saveSt(); draw(); });
    ov.addEventListener('click', async e => {
      if (e.target.id === 'ppoImg' && cv && cv._ph) { const r = e.target.getBoundingClientRect(), sx = cv.width / r.width, x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sx, q = cv._ph; if (x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h) { chooser(); return; } }
      const g = e.target.closest('[data-g]');
      if (g) {
        const k = g.dataset.g, v = g.dataset.v;
        if (k === 'size') { key = v; try { localStorage.setItem(KEY, key); } catch (er) {} }
        else if (k === 'photo') { if (v === 'add') return chooser(); if (v === 'cut') { ST.cutbg = ST.cutbg ? 0 : 1; saveSt(); } if (v === 'del') { if (!confirm('تصویر ہٹا دیں؟')) return; setPhoto(''); } }
        else if (k === 'ad' || k === 'round') { ST[k] = ST[k] ? 0 : 1; saveSt(); }
        else { ST[k] = k === 'bw' ? Number(v) : v; saveSt(); }
        draw(); return;
      }
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'x') return close();
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
    ov.querySelector('#ppoGal').addEventListener('change', pick);
    ov.querySelector('#ppoCam').addEventListener('change', pick);
    draw();
  }
  window.MA_PPOSTER = { open, render, SIZES };
})();
