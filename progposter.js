/* میرا مکتبہ — پروگرام (جلسہ) کا پوسٹر: گہرا نیلا پس منظر، سنہری نقش و نگار، گول کونے
   ایک طرف مالک/مہتمم کی تصویر، دوسری طرف لوگو؛ عنوان نوری نستعلیق کشیدہ میں؛ ہندسے Arial
   سائز: واٹس ایپ، اسٹیٹس، فیس بک، انسٹاگرام */
(function () {
  'use strict';
  const SIZES = {
    wa: { n: 'واٹس ایپ', w: 1080, h: 1080 },
    st: { n: 'اسٹیٹس', w: 1080, h: 1920 },
    fb: { n: 'فیس بک', w: 1200, h: 630 },
    ig: { n: 'انسٹاگرام', w: 1080, h: 1350 }
  };
  const C = { bg0: '#16244d', bg1: '#0c1634', bg2: '#070d22', g0: '#fff3c4', g1: '#e8c467', g2: '#b8862b', g3: '#7a5418', tx: '#fdf3d6', mu: '#d9c99a', panel: 'rgba(8,16,44,.72)' };
  const TF = '"JNNK","JNN Kasheeda","JNN",serif', BF = '"Digits","JNN","Jameel Noori Nastaleeq",serif', NF = '"Digits",Arial,Roboto,sans-serif';
  const MONTHS = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
  const DAYS = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
  const KEY = 'maktaba-aziz-pposter-size';
  const BRD = () => { try { return JSON.parse(localStorage.getItem('maktaba-aziz-brand')) || {}; } catch (e) { return {}; } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dOf = s => new Date(String(s).slice(0, 10) + 'T00:00:00');
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // ---------- کینوس کے اوزار ----------
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  const gold = (c, y0, y1) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, C.g0); g.addColorStop(.45, C.g1); g.addColorStop(1, C.g2); return g; };
  function fitFont(c, s, max, size, fam, min = 14) { let z = size; c.font = `${z}px ${fam}`; while (c.measureText(s).width > max && z > min) { z -= 2; c.font = `${z}px ${fam}`; } return z; }
  function wrap2(c, s, max, size, fam, min) {   // عنوان: ایک یا دو سطریں، ضرورت ہو تو چھوٹا
    for (let z = size; z >= min; z -= 4) {
      c.font = `${z}px ${fam}`;
      if (c.measureText(s).width <= max) return { z, lines: [s] };
      const w = s.split(/\s+/); let best = null;
      for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '); const m = Math.max(c.measureText(a).width, c.measureText(b).width); if (!best || m < best.m) best = { m, a, b }; }
      if (best && best.m <= max) return { z, lines: [best.a, best.b] };
    }
    c.font = `${min}px ${fam}`; return { z: min, lines: [s] };
  }
  function goldText(c, s, x, y, z, fam, align = 'center') {
    c.save(); c.font = `${z}px ${fam}`; c.textAlign = align; c.direction = 'rtl';
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = z * .12; c.shadowOffsetY = z * .05;
    c.fillStyle = gold(c, y - z * .8, y + z * .2); c.fillText(s, x, y); c.restore();
  }
  function plain(c, s, x, y, z, color, fam = BF, align = 'center', max) {
    if (max) z = fitFont(c, s, max, z, fam); else c.font = `${z}px ${fam}`;
    c.textAlign = align; c.direction = 'rtl'; c.fillStyle = color; c.fillText(s, x, y); return z;
  }

  // ---------- پس منظر اور سنہری فریم (کارڈ جیسا) ----------
  function background(c, W, H, R) {
    c.save(); rr(c, 0, 0, W, H, R); c.clip();
    const g = c.createRadialGradient(W / 2, H * .25, 40, W / 2, H * .45, Math.max(W, H) * .85);
    g.addColorStop(0, C.bg0); g.addColorStop(.55, C.bg1); g.addColorStop(1, C.bg2);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // ہلکی جیومیٹری لکیریں
    c.strokeStyle = 'rgba(232,196,103,.07)'; c.lineWidth = 1.5;
    const step = Math.min(W, H) / 7;
    for (let y = -step; y < H + step; y += step) for (let x = -step; x < W + step; x += step) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + step, y + step * .55); c.lineTo(x + step * .3, y + step); c.stroke(); }
    c.restore();
  }
  function corner(c, x, y, sx, sy, s) {   // کونے کا سنہری نقش
    c.save(); c.translate(x, y); c.scale(sx, sy); c.strokeStyle = C.g1; c.fillStyle = C.g1; c.lineWidth = s * .035;
    c.beginPath(); c.moveTo(0, s); c.quadraticCurveTo(0, 0, s, 0); c.stroke();
    c.beginPath(); c.moveTo(s * .12, s * .8); c.quadraticCurveTo(s * .12, s * .12, s * .8, s * .12); c.stroke();
    for (const [a, b] of [[.28, .28], [.5, .14], [.14, .5]]) { c.beginPath(); c.arc(s * a, s * b, s * .045, 0, 7); c.fill(); }
    c.beginPath(); c.moveTo(s * .2, s * .2); c.lineTo(s * .42, s * .3); c.lineTo(s * .3, s * .42); c.closePath(); c.fill();
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(s * (.55 + i * .15), s * .05, s * .025, 0, 7); c.fill(); c.beginPath(); c.arc(s * .05, s * (.55 + i * .15), s * .025, 0, 7); c.fill(); }
    c.restore();
  }
  function frame(c, W, H, R) {
    const m = Math.min(W, H), o = m * .025, s = m * .14;
    c.save(); c.lineJoin = 'round';
    c.strokeStyle = gold(c, 0, H); c.lineWidth = m * .009; rr(c, o, o, W - 2 * o, H - 2 * o, R * .8); c.stroke();
    c.strokeStyle = 'rgba(232,196,103,.55)'; c.lineWidth = m * .003; rr(c, o * 1.7, o * 1.7, W - 3.4 * o, H - 3.4 * o, R * .65); c.stroke();
    c.restore();
    corner(c, o * 2.1, o * 2.1, 1, 1, s); corner(c, W - o * 2.1, o * 2.1, -1, 1, s); corner(c, o * 2.1, H - o * 2.1, 1, -1, s); corner(c, W - o * 2.1, H - o * 2.1, -1, -1, s);
  }
  function crescent(c, x, y, r) {   // چاند ستارہ
    c.save(); c.fillStyle = gold(c, y - r, y + r);
    c.beginPath(); c.arc(x, y, r, 0, 7); c.arc(x + r * .38, y - r * .12, r * .82, 0, 7, true); c.fill('evenodd');
    const sx = x + r * .25, sy = y - r * .05, sr = r * .32; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? sr * .45 : sr; c.lineTo(sx + rr2 * Math.cos(a), sy + rr2 * Math.sin(a)); }
    c.closePath(); c.fill(); c.restore();
  }
  function divider(c, cx, y, w) {
    c.save(); c.strokeStyle = gold(c, y - 2, y + 2); c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(cx - w / 2, y); c.lineTo(cx - 18, y); c.moveTo(cx + 18, y); c.lineTo(cx + w / 2, y); c.stroke();
    c.fillStyle = C.g1; c.beginPath(); c.moveTo(cx, y - 10); c.lineTo(cx + 12, y); c.lineTo(cx, y + 10); c.lineTo(cx - 12, y); c.closePath(); c.fill(); c.restore();
  }
  function roundImg(c, img, x, y, d, ring) {   // گول تصویر سنہری حلقے میں
    c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = d * .12; c.shadowOffsetY = d * .04;
    c.beginPath(); c.arc(x, y, d / 2 + ring, 0, 7); c.fillStyle = gold(c, y - d / 2, y + d / 2); c.fill(); c.restore();
    c.save(); c.beginPath(); c.arc(x, y, d / 2, 0, 7); c.fillStyle = '#fffaf0'; c.fill(); c.clip();
    if (img) { const sc = Math.max(d / img.width, d / img.height), iw = img.width * sc, ih = img.height * sc; c.drawImage(img, x - iw / 2, y - ih / 2, iw, ih); }
    c.restore();
  }
  function panel(c, x, y, w, h, r) {
    c.save(); c.fillStyle = C.panel; rr(c, x, y, w, h, r); c.fill();
    c.strokeStyle = 'rgba(232,196,103,.85)'; c.lineWidth = 2; rr(c, x, y, w, h, r); c.stroke();
    c.strokeStyle = 'rgba(232,196,103,.3)'; c.lineWidth = 1; rr(c, x + 6, y + 6, w - 12, h - 12, r * .8); c.stroke(); c.restore();
  }
  function seal(c, x, y, r, big, small) {   // باقی دنوں کی سنہری مہر
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = r * .25; c.shadowOffsetY = r * .08;
    c.beginPath(); for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, q = i % 2 ? r : r * .92; c.lineTo(x + q * Math.cos(a), y + q * Math.sin(a)); } c.closePath();
    c.fillStyle = gold(c, y - r, y + r); c.fill(); c.restore();
    c.save(); c.strokeStyle = 'rgba(90,58,0,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * .78, 0, 7); c.stroke();
    c.fillStyle = '#2b1d05'; c.textAlign = 'center';
    if (/^\d+$/.test(big)) { c.direction = 'ltr'; c.font = `900 ${Math.round(r * .62)}px ${NF}`; c.fillText(big, x, y + r * .12); }
    else { c.direction = 'rtl'; c.font = `${Math.round(r * .42)}px ${BF}`; c.fillText(big, x, y + r * .1); }
    c.direction = 'rtl'; c.font = `${Math.round(r * .2)}px ${BF}`; c.fillText(small, x, y + r * .5); c.restore();
  }
  function creditLine(c, W, y, z) {
    const s = 'اس طرح کے بہترین سافٹ ویئر کے لیے  ✦  ⁦0320-6793793⁩  ✦  ⁦PBT CodeLabs⁩';
    c.save(); c.globalAlpha = .85; plain(c, s, W / 2, y, z, C.mu, BF, 'center', W * .6); c.restore();
  }

  // ---------- مواد ----------
  function info(p) {
    const b = BRD(), d = dOf(p.date), left = Math.round((d - dOf(iso(new Date()))) / 864e5);
    return {
      maktaba: (b.name || '').trim() || 'میرا مکتبہ',
      who: (b.line1 || '').trim(), role: [b.line2, b.line3].map(x => (x || '').trim()).filter(Boolean).join(' · '),
      title: (p.title || '').trim() || 'پروگرام',
      place: (p.place || '').trim(), city: [p.city, p.province].map(x => (x || '').trim()).filter(Boolean).join('، '),
      date: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} بروز ${DAYS[d.getDay()]}`,
      when: [p.timeNote, p.time ? p.time : ''].filter(Boolean).join(' · '),
      host: (p.inviter || '').trim(), phone: (p.phone || '').trim(),
      left, seal: left < 0 ? ['ہو چکا', 'پروگرام'] : left === 0 ? ['آج', 'پروگرام ہے'] : left === 1 ? ['کل', 'پروگرام ہے'] : [String(left), 'دن باقی']
    };
  }
  const loadImg = src => new Promise(r => { if (!src) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  async function assets() {
    const b = BRD();
    const logoSrc = b.logo === 'default' ? 'icons/khatam-logo.png' : (b.logo || 'icons/app-badge.png');
    const [logo, photo] = await Promise.all([loadImg(logoSrc), loadImg(b.photo || '')]);
    try { await Promise.all([document.fonts.load(`60px ${TF}`, 'جلسہ سیرت النبی 123'), document.fonts.load(`40px ${BF}`, 'میزبان 0300-1234567'), document.fonts.load(`40px ${NF}`, '0123')]); } catch (e) {}
    return { logo, photo };
  }

  // معلومات کا ایک خانہ: نشان، عنوان، قیمت (لمبی ہو تو خود چھوٹی)
  function row(c, x, y, w, h, ic, lab, val) {
    panel(c, x, y, w, h, h * .3);
    c.font = `${Math.round(h * .42)}px sans-serif`; c.textAlign = 'center'; c.direction = 'ltr'; c.fillStyle = '#fff'; c.fillText(ic, x + w - h * .52, y + h * .66);
    let xr = x + w - h * 1.0;
    if (lab) { plain(c, lab + ':', xr, y + h * .63, h * .3, C.g1, BF, 'right'); c.font = `${Math.round(h * .3)}px ${BF}`; xr -= c.measureText(lab + ':').width + h * .15; }
    plain(c, val, xr, y + h * .65, h * .4, C.tx, BF, 'right', xr - x - h * .35);
  }
  const rowsOf = I => [['🕌', 'بمقام', I.place], ['📍', 'مقام', I.city], ['📅', 'تاریخ', I.date + (I.when ? `  ·  ${I.when}` : '')], ['👤', 'میزبان', [I.host, I.phone ? `\u2066${I.phone}\u2069` : ''].filter(Boolean).join('  ·  ')]].filter(r => r[2]);
  // عمودی ترتیب — ہر سائز کی اپنی ناپ (y اوپر سے)
  const LAY = {
    st: { cr: 150, mk: 232, dv: 272, ti: 420, tz: 120, tmin: 70, rowY: 760, d: 240, box: 960, rh: 118, gap: 24, seal: 'below', sr: 130, cr2: 1835 },
    ig: { cr: 84, mk: 172, dv: 202, ti: 335, tz: 100, tmin: 60, rowY: 585, d: 200, box: 748, rh: 104, gap: 18, seal: 'badge', sr: 66, cr2: 1288 },
    wa: { cr: 70, mk: 150, dv: 176, ti: 268, tz: 92, tmin: 54, rowY: 455, d: 160, box: 590, rh: 86, gap: 14, seal: 'badge', sr: 58, cr2: 1030 }
  };
  function drawTall(c, W, H, I, A, key) {
    const L = LAY[key] || LAY.wa, cx = W / 2, pad = W * .1, inner = W - 2 * pad;
    crescent(c, cx, L.cr, W * .035);
    plain(c, I.maktaba, cx, L.mk, W * .036, C.mu, BF, 'center', inner);
    divider(c, cx, L.dv, inner * .6);
    const T = wrap2(c, I.title, inner, L.tz, TF, L.tmin), lh = T.z * 1.18;
    T.lines.forEach((ln, i) => goldText(c, ln, cx, L.ti - (T.lines.length - 1) * lh / 2 + i * lh + T.z * .3, T.z, TF));
    // تصویر · نام · لوگو
    const d = L.d, ry = L.rowY;
    roundImg(c, A.photo, W - pad - d / 2 + W * .02, ry, d, W * .008);
    roundImg(c, A.logo, pad + d / 2 - W * .02, ry, d, W * .008);
    const tw = inner - 2 * d + W * .02;
    const nz = I.who ? fitFont(c, I.who, tw, W * .056, BF) : 0;
    plain(c, 'خطاب', cx, ry + d * .1 - Math.max(d * .34, nz * 1.15), W * .032, C.mu, BF, 'center', tw);
    if (I.who) goldText(c, I.who, cx, ry + d * .1, nz, BF);
    if (I.role) plain(c, I.role, cx, ry + d * .1 + Math.max(d * .26, nz * .9), W * .03, C.mu, BF, 'center', tw);
    if (L.seal === 'badge') seal(c, pad + d - W * .02 - L.sr * .35, ry + d / 2 - L.sr * .35, L.sr, I.seal[0], I.seal[1]);
    const rows = rowsOf(I);
    rows.forEach((r, i) => row(c, pad - W * .02, L.box + i * (L.rh + L.gap), inner + W * .04, L.rh, r[0], r[1], r[2]));
    if (L.seal === 'below') { const yEnd = L.box + rows.length * (L.rh + L.gap); seal(c, cx, yEnd + (L.cr2 - 60 - yEnd) / 2, L.sr, I.seal[0], I.seal[1]); }
    creditLine(c, W, L.cr2, W * .021);
  }
  // افقی ترتیب (فیس بک)
  function drawWide(c, W, H, I, A) {
    const m = H, pad = W * .06, cx = W / 2, d = m * .3;
    crescent(c, cx, m * .085, m * .04);
    plain(c, I.maktaba, cx, m * .175, m * .042, C.mu, BF, 'center', W * .5);
    const tz = fitFont(c, I.title, W * .56, m * .12, TF, m * .06);
    goldText(c, I.title, cx, m * .33, tz, TF);
    const by = m * .4;
    roundImg(c, A.photo, W - pad - d / 2, by, d, 5);
    if (I.who) goldText(c, I.who, W - pad - d / 2, by + d / 2 + m * .08, fitFont(c, I.who, d * 1.4, m * .046, BF), BF);
    if (I.role) plain(c, I.role, W - pad - d / 2, by + d / 2 + m * .14, m * .03, C.mu, BF, 'center', d * 1.4);
    roundImg(c, A.logo, pad + d / 2, by, d, 5);
    seal(c, pad + d / 2, by + d / 2 + m * .15, m * .1, I.seal[0], I.seal[1]);
    const rows = rowsOf(I), bw = W - 2 * pad - 2 * d - W * .05, bx = pad + d + W * .025, rh = m * .1, y0 = m * .41;
    rows.forEach((r, i) => row(c, bx, y0 + i * (rh + m * .02), bw, rh, r[0], '', r[2]));
    creditLine(c, W, H - m * .055, m * .028);
  }
  async function render(p, key) {
    const S = SIZES[key] || SIZES.wa, W = S.w, H = S.h, R = Math.min(W, H) * .05;
    const A = await assets(), I = info(p);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    background(c, W, H, R);
    c.save(); rr(c, 0, 0, W, H, R); c.clip();
    frame(c, W, H, R);
    if (key === 'fb') drawWide(c, W, H, I, A); else drawTall(c, W, H, I, A, key);
    c.restore();
    return cv;
  }

  // ---------- پوسٹر کا صفحہ ----------
  const CSS = `.ppo{position:fixed;inset:0;z-index:95;background:rgba(5,10,30,.82);display:flex;align-items:flex-end;justify-content:center}
  .ppo-b{width:min(720px,100%);max-height:96svh;display:flex;flex-direction:column;background:linear-gradient(180deg,#fffaf0,#f6ecd4);border:1.5px solid #c8962f;border-radius:22px 22px 0 0;overflow:hidden}
  .ppo-h{display:flex;align-items:center;gap:8px;padding:8px 12px;background:linear-gradient(180deg,#16244d,#0c1634);color:#f1d27a}
  .ppo-h b{font-weight:400;font-size:19px}
  .ppo-h .x{margin-inline-start:auto;width:36px;height:36px;border-radius:50%;border:1px solid rgba(232,196,103,.5);background:rgba(255,255,255,.1);color:#f1d27a;font-size:16px;cursor:pointer}
  .ppo-t{display:flex;gap:6px;padding:8px;overflow-x:auto;background:#fffdf6;border-bottom:1px solid #e3cf98}
  .ppo-t button{flex:none;border:1.5px solid #c8962f;border-radius:99px;padding:2px 14px;background:#fff;color:#16244d;font:inherit;font-size:15px;line-height:1.8;cursor:pointer}
  .ppo-t button.on{background:linear-gradient(180deg,#24366e,#0c1634);color:#f1d27a;border-color:#0c1634}
  .ppo-t small{font:12px Arial,sans-serif;opacity:.75;margin-inline-start:4px}
  .ppo-v{flex:1;overflow:auto;padding:12px;display:grid;place-items:center;background:#e9e1cc}
  .ppo-v img{max-width:100%;max-height:62svh;height:auto;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.35)}
  .ppo-p{padding:6px 12px;font-size:13.5px;color:#5d4a1c;text-align:center;background:#fffdf6}
  .ppo-p button{border:0;background:none;color:#16244d;text-decoration:underline;font:inherit;cursor:pointer}
  .ppo-a{display:flex;gap:8px;padding:8px 12px calc(env(safe-area-inset-bottom,0px) + 10px);background:#fffdf6;border-top:1px solid #e3cf98}
  .ppo-a button{flex:1;min-height:46px;border-radius:99px;font:inherit;font-size:17px;cursor:pointer}
  .ppo-go{border:0;background:linear-gradient(180deg,#3fe07a,#16a34a 55%,#0f7a36);color:#fff;box-shadow:0 4px 0 #0b5e2a}
  .ppo-sv{border:1.5px solid #c8962f;background:#fff;color:#16244d}`;
  function open(p, H) {
    if (!document.getElementById('ppoCss')) { const s = document.createElement('style'); s.id = 'ppoCss'; s.textContent = CSS; document.head.appendChild(s); }
    let key = (() => { try { return localStorage.getItem(KEY) || 'wa'; } catch (e) { return 'wa'; } })(); if (!SIZES[key]) key = 'wa';
    const ov = document.createElement('div'); ov.className = 'ppo';
    ov.innerHTML = `<div class="ppo-b" role="dialog" aria-label="پروگرام کا پوسٹر">
      <div class="ppo-h"><b>🖼️ پروگرام کا پوسٹر</b><button type="button" class="x" data-a="x" aria-label="بند">✕</button></div>
      <div class="ppo-t">${Object.entries(SIZES).map(([k, s]) => `<button type="button" data-k="${k}">${s.n}<small dir="ltr">${s.w}×${s.h}</small></button>`).join('')}</div>
      <div class="ppo-v" id="ppoV"><p>تیار ہو رہا ہے…</p></div>
      <p class="ppo-p" id="ppoP"></p>
      <div class="ppo-a"><button type="button" class="ppo-go" data-a="share">📤 بھیجیں</button><button type="button" class="ppo-sv" data-a="save">⬇️ محفوظ کریں</button></div>
      <input type="file" accept="image/*" hidden id="ppoFile"></div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); window.removeEventListener('hashchange', close); };
    window.addEventListener('hashchange', close);
    let cv = null, tok = 0;
    const hint = () => { const b = BRD(); $p.innerHTML = b.photo ? 'تصویر بدلنی ہو تو <button type="button" data-a="photo">یہاں دبائیں</button>' : '📷 مالک/مہتمم کی تصویر ابھی نہیں لگی — <button type="button" data-a="photo">تصویر لگائیں</button>'; };
    const $p = ov.querySelector('#ppoP');
    const draw = async () => {
      const my = ++tok; ov.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('on', b.dataset.k === key));
      const v = ov.querySelector('#ppoV'); v.innerHTML = '<p>تیار ہو رہا ہے…</p>';
      const c2 = await render(p, key); if (my !== tok) return; cv = c2;
      v.innerHTML = ''; const im = new Image(); im.src = cv.toDataURL('image/png'); im.alt = 'پوسٹر'; v.appendChild(im); hint();
    };
    const blob = () => new Promise(r => cv.toBlob(r, 'image/png'));
    const fname = () => `jalsa-${p.date}-${key}.png`;
    ov.addEventListener('click', async e => {
      const k = e.target.closest('[data-k]'); if (k) { key = k.dataset.k; try { localStorage.setItem(KEY, key); } catch (er) {} draw(); return; }
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'x') return close();
      if (a === 'photo') return ov.querySelector('#ppoFile').click();
      if (!cv) return;
      const b = await blob(), file = new File([b], fname(), { type: 'image/png' });
      if (a === 'share') {
        const text = H && H.textOf ? H.textOf(p) : '';
        try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; } } catch (er) { if (er && er.name === 'AbortError') return; }
      }
      const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = fname(); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
      if (H && H.toast) H.toast('پوسٹر فون میں محفوظ ہو گیا');
    });
    ov.querySelector('#ppoFile').addEventListener('change', async ev => {
      const f = ev.target.files[0]; if (!f || !window.MA_BRAND) return;
      const src = await new Promise((res, rej) => { const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { const S = 420, mm = Math.min(im.width, im.height), c2 = document.createElement('canvas'); c2.width = c2.height = S; const g = c2.getContext('2d'); g.drawImage(im, (im.width - mm) / 2, Math.max(0, (im.height - mm) / 3), mm, mm, 0, 0, S, S); URL.revokeObjectURL(u); res(c2.toDataURL('image/jpeg', .82)); }; im.onerror = rej; im.src = u; }).catch(() => '');
      if (src && window.MA_BRAND.set(Object.assign(window.MA_BRAND.get(), { photo: src }))) { if (H && H.toast) H.toast('تصویر محفوظ ہو گئی'); draw(); }
    });
    draw();
  }
  window.MA_PPOSTER = { open, render, SIZES };
})();
