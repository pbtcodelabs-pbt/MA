/* میرا مکتبہ — ایپ شیئر: پوسٹر + پیغام پہلے دیکھیں، رنگ/ڈیزائن بدلیں، پھر بھیجیں */
(function () {
  const W = 1080, H = 1350;
  const LINK = 'https://pbtcodelabs-pbt.github.io/MA/get.html';
  const PHONE = '0320-6793793';
  const KEY = 'maktaba-aziz-promo';
  const F = '"JNN","Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif';
  const TF = '"JNNP","JNN",serif';
  const NUM = 'Arial,Roboto,sans-serif';
  const SHARE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cx="18" cy="5" r="3.2" fill="currentColor"/><circle cx="6" cy="12" r="3.2" fill="currentColor"/><circle cx="18" cy="19" r="3.2" fill="currentColor"/></svg>';

  const THEMES = {
    green:  { n: 'سبز',   bg: ['#21735b', '#0f3a30', '#071f19'], tx: '#fff1c1', mu: '#e6d6aa', gold: ['#fff6d5', '#e8c467', '#a8741f'], card: ['#ffffff', '#efe0bb'], ct: '#14463a', cm: '#5d5543', chip: ['#2f7fe0', '#0f3c8c'], chipT: '#ffffff', acc: '#c8962f', bar: ['#fff6d5', '#c8962f'], barT: '#0b2e26', pat: 'rgba(241,210,122,.08)' },
    cream:  { n: 'ہلکا',  bg: ['#fffdf6', '#f7ecd2', '#ead8ad'], tx: '#14463a', mu: '#5d5543', gold: ['#c8962f', '#8a5f16', '#5a3c08'], card: ['#ffffff', '#f6efdc'], ct: '#14463a', cm: '#5d5543', chip: ['#1f6a54', '#0f3a30'], chipT: '#fff6dc', acc: '#b8862b', bar: ['#1f6a54', '#0b2e26'], barT: '#fff1c1', pat: 'rgba(20,70,58,.06)' },
    blue:   { n: 'نیلا',  bg: ['#3a74d0', '#163d80', '#0a1f4d'], tx: '#fff6dc', mu: '#dfe8ff', gold: ['#fff6d5', '#e8c467', '#a8741f'], card: ['#ffffff', '#e9eefb'], ct: '#0f2f6b', cm: '#4a5570', chip: ['#e8c467', '#a8741f'], chipT: '#0a1f4d', acc: '#e8c467', bar: ['#fff6d5', '#c8962f'], barT: '#0a1f4d', pat: 'rgba(255,255,255,.07)' },
    maroon: { n: 'عنابی', bg: ['#9b3434', '#5c1515', '#2c0808'], tx: '#fff1dc', mu: '#f3d9c6', gold: ['#fff6d5', '#e8c467', '#a8741f'], card: ['#fffaf2', '#f3e2cc'], ct: '#5c1515', cm: '#6b4a3a', chip: ['#1f6a54', '#0f3a30'], chipT: '#fff6dc', acc: '#e8c467', bar: ['#fff6d5', '#c8962f'], barT: '#3a0c0c', pat: 'rgba(241,210,122,.08)' }
  };
  const DEF_MSG = `السلام علیکم!
*میرا مکتبہ* — ڈیجیٹل لائبریری، ڈیجیٹل ڈائری اور مصروفیات، تینوں ایک ایپ میں۔
علمائے کرام، طلبائے کرام اور کتاب سے محبت کرنے والوں کے لیے اپنی طرز کا پہلا بہترین موبائل سافٹ ویئر۔

🎁 ایپ انسٹال کریں، 3 دن فری استعمال کریں، اس کے بعد خریدنے کا فیصلہ کریں۔

⬇️ ڈاؤن لوڈ کریں:
${LINK}`;

  let st = { design: 1, theme: 'green', bold: true, border: 'gold', price: true, msg: DEF_MSG };
  try { st = Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const saveSt = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  // ---------- کینوس کے اوزار ----------
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function lg(c, y0, y1, cols) { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((k, i) => g.addColorStop(i / (cols.length - 1), k)); return g; }
  function txt(c, s, x, y, size, color, opt = {}) {
    c.font = `${size}px ${opt.font || F}`; c.textAlign = opt.align || 'center'; c.direction = opt.dir || 'rtl';
    let sz = size; if (opt.max) { while (c.measureText(s).width > opt.max && sz > 12) { sz -= 1; c.font = `${sz}px ${opt.font || F}`; } }
    c.fillStyle = color;
    if (st.bold && !opt.thin) { c.lineJoin = 'round'; c.strokeStyle = typeof color === 'string' ? color : '#000'; c.lineWidth = Math.max(1, sz * 0.035); if (typeof color !== 'string') c.strokeStyle = 'rgba(0,0,0,0)'; c.strokeText(s, x, y); }
    c.fillText(s, x, y);
  }
  function card3d(c, x, y, w, h, r, T, edge) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 22; c.shadowOffsetY = 12;
    c.fillStyle = edge || '#8a5f16'; rr(c, x, y + 8, w, h, r); c.fill(); c.restore();
    c.fillStyle = lg(c, y, y + h, T.card); rr(c, x, y, w, h, r); c.fill();
    c.strokeStyle = T.acc; c.lineWidth = 3; rr(c, x + 1.5, y + 1.5, w - 3, h - 3, r); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, x + 8, y + 5, w - 16, h * 0.32, r * 0.8); c.fill();
  }
  function pill3d(c, x, y, w, h, cols, edge) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 14; c.shadowOffsetY = 8;
    c.fillStyle = edge; rr(c, x, y + 6, w, h, h / 2); c.fill(); c.restore();
    c.fillStyle = lg(c, y, y + h, cols); rr(c, x, y, w, h, h / 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; rr(c, x + 14, y + 4, w - 28, h * 0.4, h / 3); c.fill();
  }
  function bg(c, T) {
    const g = c.createRadialGradient(W / 2, H * 0.2, 60, W / 2, H * 0.35, H * 0.95);
    g.addColorStop(0, T.bg[0]); g.addColorStop(0.5, T.bg[1]); g.addColorStop(1, T.bg[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = T.pat; c.lineWidth = 2;
    for (let y = 0; y < H + 90; y += 90) for (let x = (y / 90) % 2 ? 45 : 0; x < W + 90; x += 90) { c.beginPath(); c.moveTo(x, y - 26); c.lineTo(x + 26, y); c.lineTo(x, y + 26); c.lineTo(x - 26, y); c.closePath(); c.stroke(); }
    // روشنی کی کرنیں
    c.save(); c.translate(W / 2, 330); c.globalAlpha = 0.09; c.fillStyle = T.gold[1];
    for (let i = 0; i < 36; i++) { c.rotate(Math.PI / 18); c.beginPath(); c.moveTo(0, 0); c.lineTo(-14, -700); c.lineTo(14, -700); c.closePath(); c.fill(); }
    c.restore();
  }
  function frame(c, T) {
    if (st.border === 'none') return;
    if (st.border === 'gold') {
      c.strokeStyle = lg(c, 0, H, T.gold); c.lineWidth = 8; rr(c, 18, 18, W - 36, H - 36, 30); c.stroke();
      c.strokeStyle = T.acc; c.globalAlpha = 0.6; c.lineWidth = 2; rr(c, 34, 34, W - 68, H - 68, 22); c.stroke(); c.globalAlpha = 1;
      [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].forEach(([x, y]) => { c.fillStyle = T.gold[1]; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); });
    } else { c.strokeStyle = T.acc; c.lineWidth = 3; rr(c, 22, 22, W - 44, H - 44, 24); c.stroke(); }
  }
  function title(c, T, y, size) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowOffsetY = 5; c.shadowBlur = 4;
    c.font = `${size}px ${TF}`; c.textAlign = 'center'; c.direction = 'rtl';
    c.fillStyle = lg(c, y - size * 0.7, y + size * 0.2, [T.gold[0], T.gold[1], T.gold[2]]);
    c.fillText('میرا مکتبہ', W / 2, y); c.restore();
  }
  function trialBox(c, T, y, h) {
    const x = 70, w = W - 140;
    c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 18; c.shadowOffsetY = 10;
    c.fillStyle = '#6e140d'; rr(c, x, y + 8, w, h, 28); c.fill(); c.restore();
    c.fillStyle = lg(c, y, y + h, ['#d4473a', '#a3241a', '#7a1810']); rr(c, x, y, w, h, 28); c.fill();
    c.strokeStyle = '#f1d27a'; c.lineWidth = 4; rr(c, x + 2, y + 2, w - 4, h - 4, 26); c.stroke();
    txt(c, '🎁 ایپ انسٹال کریں — 3 دن فری استعمال کریں', W / 2, y + h * 0.45, 44, '#fff3c4', { max: w - 60 });
    txt(c, 'اس کے بعد خریدنے کا فیصلہ کریں', W / 2, y + h * 0.84, 34, '#ffe9b0', { max: w - 60 });
  }
  function priceBox(c, T, y, h) {
    const x = 90, w = W - 180;
    card3d(c, x, y, w, h, 24, T);
    txt(c, 'سالانہ سبسکرپشن', x + w - 28, y + 40, 28, T.ct, { align: 'right' });
    c.font = `700 36px ${NUM}`; c.textAlign = 'right'; c.direction = 'ltr'; c.fillStyle = '#8a8172';
    c.fillText('Rs 10,000', x + w - 28, y + 88);
    const wOld = c.measureText('Rs 10,000').width; c.strokeStyle = '#b3261e'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + w - 28 - wOld, y + 76); c.lineTo(x + w - 28, y + 76); c.stroke();
    txt(c, 'پہلے 50 خریداروں کو صرف', x + w * 0.47, y + 36, 26, T.ct, { max: 320 });
    c.font = `900 60px ${NUM}`; c.textAlign = 'center'; c.direction = 'ltr'; c.fillStyle = T.ct; c.fillText('Rs 5,000', x + w * 0.47, y + 94);
    txt(c, '⏳ یہ پیشکش', x + 110, y + 44, 26, '#a3241a', { thin: true });
    txt(c, 'محدود مدت کے لیے ہے', x + 110, y + 88, 26, '#a3241a', { thin: true, max: 200 });
  }
  function footer(c, T) {
    const y = H - 128, x = 18, w = W - 36, h = 110;
    c.fillStyle = lg(c, y, y + h, T.bar); rr(c, x + (st.border === 'none' ? 0 : 0), y, w, h, 24); c.fill();
    txt(c, 'ابھی رابطہ کریں', W / 2 + 190, y + 70, 40, T.barT);
    c.font = `800 48px ${NUM}`; c.textAlign = 'center'; c.direction = 'ltr'; c.fillStyle = T.barT; c.fillText('☎ ' + PHONE, W / 2 - 170, y + 72);
  }
  const FEATS = ['اپنی تمام کتابیں محفوظ کریں', 'فن وار اور جلد وار ترتیب', 'پڑھنے کو دی گئی کتب کا حساب', 'فہرست واٹس ایپ / PDF پر', 'نوٹس اور لنکس کی ڈائری', 'پروگرام الٹی گنتی کے ساتھ'];
  const THREE = [['📚', 'ڈیجیٹل لائبریری', 'کتب کا مکمل ریکارڈ'], ['📒', 'ڈیجیٹل ڈائری', 'نوٹس اور ضروری باتیں'], ['🗓️', 'میری مصروفیات', 'پروگرام اور وقت']];

  function design1(c, T) {
    bg(c, T); frame(c, T);
    txt(c, 'علمائے کرام، طلبائے کرام اور کتاب سے محبت کرنے والوں کے لیے', W / 2, 92, 32, T.tx, { max: W - 140 });
    c.save(); txt(c, 'اپنی طرز کا پہلا بہترین موبائل سافٹ ویئر', W / 2, 150, 44, T.gold[1], { max: W - 140 }); c.restore();
    pill3d(c, W / 2 - 150, 178, 300, 62, [T.gold[0], T.gold[1], T.gold[2]], '#6e4a10');
    txt(c, 'تھری اِن وَن ایپ', W / 2, 222, 34, '#0b2e26');
    title(c, T, 400, 150);
    txt(c, 'ڈیجیٹل لائبریری · ڈیجیٹل ڈائری · میری مصروفیات', W / 2, 470, 32, T.tx, { max: W - 140 });
    const cw = 296, ch = 178, gap = 26, x0 = (W - (cw * 3 + gap * 2)) / 2, yC = 505;
    THREE.forEach(([e, t, s], i) => {
      const x = W - x0 - cw - i * (cw + gap);
      card3d(c, x, yC, cw, ch, 26, T);
      c.font = '62px sans-serif'; c.textAlign = 'center'; c.direction = 'ltr'; c.fillText(e, x + cw / 2, yC + 74);
      txt(c, t, x + cw / 2, yC + 128, 34, T.ct, { max: cw - 24 });
      txt(c, s, x + cw / 2, yC + 164, 23, T.cm, { max: cw - 24, thin: true });
    });
    const pw = 455, ph = 60, pg = 22, py0 = 728;
    FEATS.forEach((f, i) => {
      const col = i % 2, row = Math.floor(i / 2), x = col === 0 ? W - 70 - pw : 70, y = py0 + row * (ph + pg);
      pill3d(c, x, y, pw, ph, T.chip, 'rgba(0,0,0,.45)');
      c.fillStyle = lg(c, y + 12, y + 48, [T.gold[0], T.gold[1]]); c.beginPath(); c.arc(x + pw - 34, y + ph / 2, 18, 0, 7); c.fill();
      c.font = `900 22px ${NUM}`; c.textAlign = 'center'; c.direction = 'ltr'; c.fillStyle = '#0b2e26'; c.fillText('✓', x + pw - 34, y + ph / 2 + 8);
      txt(c, f, x + pw - 62, y + 42, 30, T.chipT, { align: 'right', max: pw - 90 });
    });
    if (st.price) { trialBox(c, T, 988, 96); priceBox(c, T, 1100, 108); }
    else trialBox(c, T, 1010, 150);
    footer(c, T);
  }

  function design2(c, T, logo) {
    bg(c, T); frame(c, T);
    if (logo) { const lh = 330, lw = logo.width * lh / logo.height, lx = W / 2 - lw / 2, ly = 60;
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; c.shadowOffsetY = 16; c.drawImage(logo, lx, ly, lw, lh); c.restore(); }
    title(c, T, 520, 160);
    txt(c, 'علمائے کرام، طلبائے کرام اور کتاب سے محبت کرنے والوں کے لیے', W / 2, 600, 32, T.tx, { max: W - 140 });
    txt(c, 'اپنی طرز کا پہلا بہترین موبائل سافٹ ویئر', W / 2, 660, 44, T.gold[1], { max: W - 140 });
    const rows = THREE, rh = 86, y0 = 692;
    rows.forEach(([e, t, s], i) => {
      const y = y0 + i * (rh + 14), x = 110, w = W - 220;
      card3d(c, x, y, w, rh, 46, T);
      c.font = '50px sans-serif'; c.textAlign = 'center'; c.direction = 'ltr'; c.fillText(e, x + w - 60, y + 60);
      txt(c, t, x + w - 110, y + 57, 38, T.ct, { align: 'right' });
      txt(c, s, x + 40, y + 55, 26, T.cm, { align: 'left', dir: 'rtl', thin: true });
    });
    if (st.price) {
      trialBox(c, T, 1000, 96);
      const y = 1146; txt(c, 'سالانہ سبسکرپشن: عام قیمت 10,000 — پہلے 50 کو صرف 5,000 روپے', W / 2, y, 30, T.tx, { max: W - 120 });
      txt(c, '⏳ یہ پیشکش محدود مدت کے لیے ہے', W / 2, y + 46, 28, T.gold[1], { max: W - 120 });
    } else trialBox(c, T, 1060, 140);
    footer(c, T);
  }

  let logoImg = null;
  function loadLogo() { return new Promise(res => { if (logoImg) return res(logoImg); const i = new Image(); i.onload = () => { logoImg = i; res(i); }; i.onerror = () => res(null); i.src = 'icons/app-badge.png'; }); }
  async function render(cv) {
    try { await Promise.all([document.fonts.load(`40px ${F}`, 'کتاب'), document.fonts.load(`120px ${TF}`, 'میرا مکتبہ')]); } catch (e) {}
    const c = cv.getContext('2d'); c.clearRect(0, 0, W, H);
    const T = THEMES[st.theme] || THEMES.green;
    if (st.design === 2) design2(c, T, await loadLogo()); else design1(c, T);
  }

  // ---------- تیاری کا صفحہ ----------
  const CSS = `
  .pm-ov{position:fixed;inset:0;z-index:30000;background:radial-gradient(120% 70% at 50% 10%,#1f6a54,#0b2e26 70%);display:flex;justify-content:center;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:"JNN","Noto Nastaliq Urdu",serif;direction:rtl}
  .pm-box{width:100%;max-width:480px;padding:12px 14px calc(24px + env(safe-area-inset-bottom));display:grid;gap:10px;align-content:start}
  .pm-h{display:flex;align-items:center;justify-content:space-between;color:#f1d27a;font-size:22px;line-height:1.8}
  .pm-x{border:0;width:38px;height:38px;border-radius:50%;background:#f1d27a;color:#0b2e26;font:700 18px Arial;cursor:pointer}
  .pm-cv{width:100%;height:auto;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.5);background:#0b2e26}
  .pm-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;color:#e6d6aa;font-size:15px}
  .pm-row>span{min-width:62px}
  .pm-c{border:1.5px solid #e8c467;background:rgba(255,255,255,.08);color:#fff1c1;border-radius:99px;padding:1px 12px;font:inherit;font-size:15px;line-height:1.9;cursor:pointer}
  .pm-c.on{background:linear-gradient(180deg,#fff6d5,#f1d27a 40%,#c8962f);color:#0b2e26;border-color:#8a5f16}
  .pm-sw{width:30px;height:30px;border-radius:50%;border:2px solid #fff3c4;cursor:pointer;padding:0}
  .pm-sw.on{box-shadow:0 0 0 3px #f1d27a,0 0 0 5px #0b2e26}
  .pm-ta{width:100%;box-sizing:border-box;min-height:190px;border-radius:14px;border:1.5px solid #e8c467;padding:8px 12px;font:inherit;font-size:16px;line-height:1.9;background:#fffaf0;color:#2b2620;direction:rtl}
  .pm-go{justify-self:center;width:72px;height:72px;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#0b2e26;
    background:radial-gradient(circle at 50% 30%,#fff6d0 0%,#f1d27a 40%,#b8862b 100%);box-shadow:0 0 0 3px #fff3c4,0 6px 0 #6e4a10,0 12px 18px rgba(0,0,0,.45)}
  .pm-go svg{width:36px;height:36px}
  .pm-go:active{transform:translateY(4px);box-shadow:0 0 0 3px #fff3c4,0 2px 0 #6e4a10}
  .pm-m{text-align:center;color:#fff1c1;font-size:15px;min-height:1.6em}
  .pm-reset{justify-self:start;border:0;background:none;color:#f1d27a;text-decoration:underline;font:inherit;font-size:14px;cursor:pointer}`;

  function chips(name, items, cur) { return items.map(([v, t]) => `<button type="button" class="pm-c${String(cur) === String(v) ? ' on' : ''}" data-k="${name}" data-v="${v}">${t}</button>`).join(''); }
  function open() {
    if (!document.getElementById('pmCss')) { const s = document.createElement('style'); s.id = 'pmCss'; s.textContent = CSS; document.head.appendChild(s); }
    const ov = document.createElement('div'); ov.className = 'pm-ov';
    const ui = () => `<div class="pm-box">
      <div class="pm-h"><span>پوسٹر اور پیغام دیکھ لیں، پھر بھیجیں</span><button type="button" class="pm-x" data-a="x" aria-label="بند">✕</button></div>
      <canvas class="pm-cv" width="${W}" height="${H}"></canvas>
      <div class="pm-row"><span>ڈیزائن:</span>${chips('design', [[1, 'پہلا'], [2, 'دوسرا']], st.design)}</div>
      <div class="pm-row"><span>رنگ:</span>${Object.entries(THEMES).map(([k, T]) => `<button type="button" class="pm-sw${st.theme === k ? ' on' : ''}" data-k="theme" data-v="${k}" title="${T.n}" style="background:linear-gradient(135deg,${T.bg[0]},${T.bg[2]})"></button>`).join('')}</div>
      <div class="pm-row"><span>لکھائی:</span>${chips('bold', [['false', 'باریک'], ['true', 'موٹی']], st.bold)}</div>
      <div class="pm-row"><span>بارڈر:</span>${chips('border', [['gold', 'سنہری'], ['thin', 'سادہ'], ['none', 'بغیر']], st.border)}</div>
      <div class="pm-row"><span>قیمت:</span>${chips('price', [['true', 'دکھائیں'], ['false', 'چھپائیں']], st.price)}</div>
      <textarea class="pm-ta" id="pmMsg" spellcheck="false">${st.msg.replace(/</g, '&lt;')}</textarea>
      <button type="button" class="pm-reset" data-a="reset">پیغام پہلے جیسا کریں</button>
      <button type="button" class="pm-go" data-a="share" aria-label="شیئر" title="شیئر">${SHARE_SVG}</button>
      <p class="pm-m" id="pmM"></p></div>`;
    ov.innerHTML = ui(); document.body.appendChild(ov); document.body.style.overflow = 'hidden';
    let cv = ov.querySelector('canvas'); render(cv);
    const close = () => { ov.remove(); document.body.style.overflow = ''; };
    ov.addEventListener('input', e => { if (e.target.id === 'pmMsg') { st.msg = e.target.value; saveSt(); } });
    ov.addEventListener('click', async e => {
      const b = e.target.closest('[data-k],[data-a]'); if (!b) return;
      if (b.dataset.k) {
        const k = b.dataset.k, v = b.dataset.v;
        st[k] = k === 'design' ? Number(v) : (v === 'true' ? true : v === 'false' ? false : v); saveSt();
        ov.querySelectorAll(`[data-k="${k}"]`).forEach(x => x.classList.toggle('on', x.dataset.v === v));
        render(cv); return;
      }
      const a = b.dataset.a, m = ov.querySelector('#pmM');
      if (a === 'x') return close();
      if (a === 'reset') { st.msg = DEF_MSG; saveSt(); ov.querySelector('#pmMsg').value = DEF_MSG; return; }
      if (a === 'share') {
        m.textContent = 'پوسٹر تیار ہو رہا ہے…';
        await render(cv);
        const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.9));
        const file = new File([blob], 'mera-maktaba.jpg', { type: 'image/jpeg' });
        const text = st.msg;
        try {
          if (navigator.canShare && navigator.canShare({ files: [file], text })) { await navigator.share({ files: [file], text }); m.textContent = ''; return; }
        } catch (err) { if (err && err.name === 'AbortError') { m.textContent = ''; return; } }
        // متبادل: تصویر محفوظ + واٹس ایپ پر پیغام
        const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = 'mera-maktaba.jpg'; document.body.appendChild(l); l.click(); l.remove();
        setTimeout(() => URL.revokeObjectURL(u), 4000);
        m.textContent = 'پوسٹر گیلری میں محفوظ ہو گیا — واٹس ایپ میں پیغام کے ساتھ لگا دیں';
        setTimeout(() => { location.href = 'https://wa.me/?text=' + encodeURIComponent(text); }, 900);
      }
    });
  }
  window.MA_PROMO = { open, render, _st: st };
})();
