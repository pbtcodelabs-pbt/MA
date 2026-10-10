/* میرا مکتبہ — «مکتبے کی پہچان»: لوگو، مکتبے کا نام، پہچان کی سطریں، پتہ اور موبائل
   ہر صارف خود بھر کر محفوظ کرتا ہے۔ یہ صرف اسی فون میں رہتا ہے (اور بیک اپ میں ساتھ جاتا ہے)۔ */
(function () {
  const KEY = 'maktaba-aziz-brand';
  const DATA_KEY = 'maktaba-aziz-data-v1';
  const DEFAULT_LOGO = 'icons/khatam-logo.png';
  const FIELDS = ['name', 'line1', 'line2', 'line3', 'address', 'phone', 'logo', 'round'];
  // کشیدہ فونٹ میں صرف یہ حروف ہیں؛ باقی ناموں کے لیے سادہ نوری
  const KASHEEDA = new Set(Array.from('،ابتحخدرزضعفلمنوِپکگۃیے '));

  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const clean = o => { const r = {}; FIELDS.forEach(f => { r[f] = (o && typeof o[f] === 'string') ? o[f].trim() : ''; }); return r; };

  function load() {
    const raw = lsGet(KEY);
    if (raw) { try { return clean(JSON.parse(raw)); } catch (e) {} }
    return clean({});
  }
  let brand = load();

  const api = {
    get: () => Object.assign({}, brand),
    set(o) { brand = clean(o); const ok = lsSet(KEY, JSON.stringify(brand)); apply(); return ok; },
    isEmpty: () => !brand.name && !brand.line1 && !brand.logo,
    name: () => brand.name || 'میرا مکتبہ',
    place: () => brand.address || '',
    logoSrc: () => brand.logo === 'default' ? DEFAULT_LOGO : (brand.logo || ''),
    isDefaultLogo: () => brand.logo === 'default',
    kasheeda: t => !!t && Array.from(t).every(c => KASHEEDA.has(c)),
    titleFont(t) { return api.kasheeda(t) ? '"JNN Kasheeda","Jameel Noori Nastaleeq Kasheeda","JNN",serif' : '"JNN","Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif'; },
    apply: () => apply(),
    open: () => openEditor()
  };
  window.MA_BRAND = api;

  // ---------- صفحے پر لگانا ----------
  function apply() {
    const b = brand;
    document.querySelectorAll('[data-b]').forEach(el => {
      const f = el.dataset.b;
      if (f === 'logo') return;
      let v = b[f] || '';
      if (f === 'name') { v = b.name || el.dataset.empty || ''; el.style.fontFamily = api.titleFont(b.name); el.classList.toggle('kash', api.kasheeda(b.name)); }
      el.textContent = v;
      if (f !== 'name') el.hidden = !v;
      if (f === 'phone' && el.tagName === 'A') el.href = 'tel:' + v.replace(/[^\d+]/g, '');
    });
    document.querySelectorAll('[data-b-logo]').forEach(img => {
      const src = api.logoSrc();
      const box = img.closest('[data-b-box]');
      if (src) { img.src = src; img.hidden = false; } else { img.hidden = true; img.removeAttribute('src'); }
      if (box) {
        box.classList.toggle('custom-logo', !!src && !api.isDefaultLogo());
        box.classList.toggle('no-logo', !src);
        if (box.classList.contains('emblem')) {
          box.classList.remove('gold');   // لوگو ہمیشہ اپنی اصل تصویر میں
        }
      }
    });
    document.querySelectorAll('[data-b-empty]').forEach(el => { el.hidden = !api.isEmpty(); });
    document.querySelectorAll('[data-b-filled]').forEach(el => { el.hidden = api.isEmpty(); });
    if (document.body && document.body.dataset.bTitle !== undefined) document.title = b.name || 'مکتبہ';
  }

  // ---------- لوگو: فالتو کنارے کاٹ کر گول بنانا ----------
  const loadIm = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('img')); im.src = src; });
  // تصویر کے کناروں پر ایک ہی رنگ کی فالتو جگہ (سفید، سبز پٹی، شفاف) کاٹیں
  function trimBox(ctx, w, h) {
    const d = ctx.getImageData(0, 0, w, h).data;
    let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1;
    const px = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
    for (let pass = 0; pass < 4; pass++) {
      const cs = [px(x0, y0), px(x1, y0), px(x0, y1), px(x1, y1)];
      const bgT = cs.every(c => c[3] < 30);
      const c = [0, 1, 2].map(k => cs.reduce((s, q) => s + q[k], 0) / 4);
      const same = q => bgT ? q[3] < 30 : (q[3] > 200 && Math.abs(q[0] - c[0]) + Math.abs(q[1] - c[1]) + Math.abs(q[2] - c[2]) < 60);
      if (!bgT && !cs.every(same)) break;
      const rowBg = y => { let n = 0, t = 0; for (let x = x0; x <= x1; x += 2) { t++; if (same(px(x, y))) n++; } return n / t > 0.985; };
      const colBg = x => { let n = 0, t = 0; for (let y = y0; y <= y1; y += 2) { t++; if (same(px(x, y))) n++; } return n / t > 0.985; };
      const b = [x0, y0, x1, y1];
      while (y0 < y1 - 10 && rowBg(y0)) y0++;
      while (y1 > y0 + 10 && rowBg(y1)) y1--;
      while (x0 < x1 - 10 && colBg(x0)) x0++;
      while (x1 > x0 + 10 && colBg(x1)) x1--;
      if (b[0] === x0 && b[1] === y0 && b[2] === x1 && b[3] === y1) break;
    }
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  // گول لوگو: S×S، دائرے کے اندر پورا بھرا ہوا؛ zoom = 1 معمول، بڑا = زیادہ قریب
  async function roundLogo(src, zoom = 1) {
    const im = await loadIm(src);
    const M = 900, r0 = Math.min(1, M / Math.max(im.width, im.height));
    const w = Math.max(1, Math.round(im.width * r0)), h = Math.max(1, Math.round(im.height * r0));
    const c1 = document.createElement('canvas'); c1.width = w; c1.height = h;
    const x1 = c1.getContext('2d', { willReadFrequently: true }); x1.drawImage(im, 0, 0, w, h);
    let box = { x: 0, y: 0, w, h }; try { box = trimBox(x1, w, h); } catch (e) {}
    const side = Math.max(box.w, box.h) / zoom, cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const S = 480, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.save(); ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
    const k = S / side;
    ctx.drawImage(c1, (S / 2) - cx * k, (S / 2) - cy * k, w * k, h * k);
    ctx.restore();
    let out = '';
    try { out = cv.toDataURL('image/webp', 0.9); } catch (e) {}
    if (!out.startsWith('data:image/webp')) out = cv.toDataURL('image/png');
    return out;
  }
  const fileToData = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });

  // پرانا (چوکور) لوگو ایک بار خود گول کر دیں
  async function migrate() {
    if (!brand.logo || brand.logo === 'default' || brand.round === '1') return;
    try { const d = await roundLogo(brand.logo, 1); brand = clean(Object.assign({}, brand, { logo: d, round: '1' })); lsSet(KEY, JSON.stringify(brand)); apply(); } catch (e) {}
  }

  // ---------- ترمیم کا خانہ ----------
  const CSS = `
  .br-ov{position:fixed;inset:0;z-index:30000;background:rgba(5,25,20,.72);display:flex;align-items:flex-end;justify-content:center;animation:brFade .2s ease both;font-family:"JNN","Noto Nastaliq Urdu",serif}
  @media (min-width:560px){.br-ov{align-items:center}}
  @keyframes brFade{from{opacity:0}to{opacity:1}}
  @keyframes brUp{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
  .br-box{width:100%;max-width:480px;max-height:94svh;overflow:auto;background:linear-gradient(180deg,#fbf6e8,#f3ead2);border:2px solid #b8862b;border-radius:22px 22px 0 0;padding:14px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.4);animation:brUp .25s ease both;direction:rtl;color:#14463a}
  @media (min-width:560px){.br-box{border-radius:22px}}
  .br-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
  .br-h b{font-weight:400;font-size:24px;line-height:1.8}
  .br-x{border:0;background:#14463a;color:#f1d27a;width:36px;height:36px;border-radius:50%;font:700 18px Arial,sans-serif;cursor:pointer}
  .br-note{font-size:14px;line-height:1.8;color:#6b6250;margin:0 0 8px}
  .br-logo{display:flex;align-items:center;gap:14px;margin:4px 0 10px}
  .br-ring{flex:none;width:124px;height:124px;border-radius:50%;display:grid;place-items:center;overflow:hidden;cursor:pointer;
    background:radial-gradient(circle at 32% 26%,#fff7c8 0,#f6d56c 18%,#d9a42b 46%,#a8741a 74%,#7a4e0a 100%);
    box-shadow:0 0 0 2px #ffe58a,0 0 0 4px #7a4e0a,0 0 0 6px #f2c94e,0 6px 14px rgba(0,0,0,.35)}
  .br-ring .in{width:90%;height:90%;border-radius:50%;background:radial-gradient(circle at 50% 38%,#1f7a5f,#13503f 55%,#0b2f25);display:grid;place-items:center;overflow:hidden}
  .br-ring img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}
  .br-zoom{display:flex;align-items:center;gap:8px;font-size:14px;color:#6b4a1a;margin:-2px 0 10px}
  .br-zoom input{flex:1;accent-color:#14463a;height:28px}
  .br-zoom[hidden]{display:none}
  .br-ring span{color:#f1d27a;font-size:15px;line-height:1.6;text-align:center;padding:4px}
  .br-lb{display:flex;flex-direction:column;gap:8px;flex:1}
  .br-btn{border:1.5px solid #b8862b;border-radius:99px;padding:4px 14px;font:inherit;font-size:16px;line-height:1.9;cursor:pointer;background:#fff;color:#14463a}
  .br-btn.gold{background:linear-gradient(180deg,#fff6d5,#f1d27a 40%,#c8962f);color:#0b2e26;border-color:#8a5f16}
  .br-btn.green{background:linear-gradient(180deg,#1f6a54,#14463a);color:#fff1c1;border-color:#0b2e26}
  .br-f{display:block;margin:0 0 8px}
  .br-f span{display:block;font-size:15px;line-height:1.7;color:#14463a}
  .br-f span i{font-style:normal;color:#8a7d62;font-size:13px}
  .br-f input{width:100%;box-sizing:border-box;border:1.8px solid #d8c595;border-radius:12px;padding:6px 12px;font:inherit;font-size:19px;line-height:1.9;background:#fff;color:#2b2620;outline:none}
  .br-f input:focus{border-color:#14463a;box-shadow:0 0 0 3px rgba(20,70,58,.15)}
  .br-f input[dir=ltr]{font:600 18px Arial,Roboto,sans-serif;text-align:left;padding:10px 12px}
  .br-row{display:flex;gap:10px;margin-top:10px}
  .br-row .br-btn{flex:1;font-size:18px;padding:6px 10px}
  .br-ok{text-align:center;color:#1d6b3a;font-size:15px;min-height:1.6em;margin:6px 0 0}`;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function openEditor() {
    if (!document.getElementById('brCss')) { const st = document.createElement('style'); st.id = 'brCss'; st.textContent = CSS; document.head.appendChild(st); }
    let logo = brand.logo, orig = '', round = brand.round || '';
    const b = brand;
    const fld = (k, label, hint, extra = '') => `<label class="br-f"><span>${label} ${hint ? `<i>(${hint})</i>` : ''}</span><input id="br-${k}" value="${esc(b[k] || '')}" ${extra} autocomplete="off"></label>`;
    const ov = document.createElement('div'); ov.className = 'br-ov';
    ov.innerHTML = `<div class="br-box" role="dialog" aria-label="مکتبے کی پہچان">
      <div class="br-h"><b>✎ مکتبے کی پہچان</b><button class="br-x" type="button" data-a="x" aria-label="بند">✕</button></div>
      <p class="br-note">اپنا لوگو، مکتبے کا نام اور پتہ لکھ کر محفوظ کریں۔ یہ ایپ کے مین صفحے، مکتبے اور بھیجی جانے والی فہرستوں پر نظر آئے گا۔</p>
      <div class="br-logo">
        <div class="br-ring" data-a="pick"><div class="in" id="br-prev"></div></div>
        <div class="br-lb">
          <button class="br-btn gold" type="button" data-a="pick">📷 لوگو لگائیں</button>
          <button class="br-btn" type="button" data-a="rm">لوگو ہٹائیں</button>
          <input type="file" id="br-file" accept="image/*" hidden>
        </div>
      </div>
      <label class="br-zoom" id="br-zw" hidden>چھوٹا<input type="range" id="br-zoom" min="70" max="160" step="5" value="100" aria-label="لوگو چھوٹا یا بڑا">بڑا</label>
      ${fld('name', 'مکتبے کا نام', '', 'placeholder="مثلاً مکتبہ رحمانیہ"')}
      ${fld('line1', 'پہچان ۱', 'مثلاً سرپرست یا مالک کا نام', 'placeholder="مثلاً مولانا محمد …"')}
      ${fld('line2', 'پہچان ۲', 'عہدہ، مثلاً مہتمم، مدیر', 'placeholder="مثلاً مہتمم"')}
      ${fld('line3', 'پہچان ۳', 'اختیاری', '')}
      ${fld('address', 'پتہ', 'ادارہ اور شہر', 'placeholder="مثلاً جامعہ رحمانیہ، لاہور"')}
      ${fld('phone', 'موبائل نمبر', '', 'dir="ltr" inputmode="tel" placeholder="0300-0000000"')}
      <div class="br-row"><button class="br-btn green" type="button" data-a="save">💾 محفوظ کریں</button><button class="br-btn" type="button" data-a="x">بند</button></div>
      <p class="br-ok" id="br-ok"></p>
    </div>`;
    document.body.appendChild(ov);
    const prev = ov.querySelector('#br-prev'), file = ov.querySelector('#br-file'), ok = ov.querySelector('#br-ok');
    const zw = ov.querySelector('#br-zw'), zIn = ov.querySelector('#br-zoom');
    let zt = null;
    zIn.addEventListener('input', () => { clearTimeout(zt); zt = setTimeout(async () => { if (!orig) return; try { logo = await roundLogo(orig, zIn.value / 100); showPrev(); } catch (e) {} }, 120); });
    const showPrev = () => {
      const src = logo === 'default' ? DEFAULT_LOGO : logo;
      prev.innerHTML = src ? `<img src="${src}" alt="">` : '<span>لوگو<br>یہاں</span>';
    };
    showPrev();
    const close = () => ov.remove();
    file.addEventListener('change', async () => {
      const f = file.files[0]; if (!f) return;
      try {
        ok.textContent = 'لوگو تیار ہو رہا ہے…';
        orig = await fileToData(f); zIn.value = 100;
        logo = await roundLogo(orig, 1); round = '1'; showPrev(); zw.hidden = false;
        ok.textContent = 'لوگو گول کر کے لگ گیا — چاہیں تو نیچے سے چھوٹا/بڑا کریں، پھر محفوظ کریں';
      }
      catch (e) { ok.textContent = 'یہ تصویر نہیں کھل سکی، کوئی اور تصویر چنیں'; }
      file.value = '';
    });
    ov.addEventListener('click', e => {
      if (e.target === ov) return close();
      const a = e.target.closest('[data-a]'); if (!a) return;
      const act = a.dataset.a;
      if (act === 'x') close();
      else if (act === 'pick') file.click();
      else if (act === 'rm') { logo = ''; orig = ''; zw.hidden = true; showPrev(); ok.textContent = ''; }
      else if (act === 'save') {
        const o = { logo, round: logo && logo !== 'default' ? round || '1' : '' };
        ['name', 'line1', 'line2', 'line3', 'address', 'phone'].forEach(k => { o[k] = ov.querySelector('#br-' + k).value; });
        if (api.set(o)) { ok.textContent = '✔ محفوظ ہو گیا'; setTimeout(close, 650); }
        else ok.textContent = 'محفوظ نہیں ہو سکا — لوگو کی تصویر چھوٹی کر کے دوبارہ کوشش کریں';
      }
    });
  }

  // ---------- ایپ بند کرنا (مین صفحے سے) ----------
  function cover() {
    if (document.getElementById('maBye')) return;
    const d = document.createElement('div'); d.id = 'maBye';
    d.style.cssText = 'position:fixed;inset:0;z-index:40000;display:grid;place-items:center;text-align:center;padding:24px;background:radial-gradient(circle at 50% 30%,#1f6a54,#0b2e26);color:#fff1c1;font-family:JNN,serif;font-size:22px;line-height:2';
    d.innerHTML = 'ایپ بند ہو گئی<br><span style="font-size:17px;opacity:.85">اب فون کا ہوم یا پیچھے والا بٹن دبائیں</span><br><button type="button" style="margin-top:14px;border:1.5px solid #e8c467;background:none;color:#f1d27a;border-radius:99px;padding:2px 18px;font:inherit;font-size:17px">دوبارہ کھولیں</button>';
    d.querySelector('button').onclick = () => d.remove();
    document.body.appendChild(d);
  }
  function exitApp() {
    try { if (navigator.app && navigator.app.exitApp) { navigator.app.exitApp(); return; } } catch (e) {}
    try { window.close(); } catch (e) {}
    setTimeout(() => {
      if (document.hidden) return;
      try { if (history.length > 1) { try { sessionStorage.setItem('ma-exit', '1'); } catch (e) {} history.go(-(history.length - 1)); } } catch (e) {}
      setTimeout(() => { try { window.close(); } catch (e) {} setTimeout(() => { if (!document.hidden) cover(); }, 300); }, 350);
    }, 250);
  }
  window.MA_EXIT = exitApp;
  document.addEventListener('click', e => { if (e.target.closest('[data-exit]')) { e.preventDefault(); exitApp(); } });
  // پہلے صفحے پر واپس آ کر بند ہونے کی دوسری کوشش
  let ex2 = false; try { ex2 = sessionStorage.getItem('ma-exit') === '1'; sessionStorage.removeItem('ma-exit'); } catch (e) {}
  if (ex2 && !/[?&]exit=1/.test(location.search)) setTimeout(() => { try { window.close(); } catch (e) {} setTimeout(() => { if (!document.hidden) cover(); }, 400); }, 60);
  if (/[?&]exit=1/.test(location.search) && document.querySelector('[data-exit]')) { try { history.replaceState(null, '', location.pathname); } catch (e) {} setTimeout(exitApp, 50); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { apply(); migrate(); }); else { apply(); migrate(); }
  document.addEventListener('click', e => { if (e.target.closest('[data-b-edit]')) { e.preventDefault(); openEditor(); } });
})();
