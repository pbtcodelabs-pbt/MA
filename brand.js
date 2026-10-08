/* مکتبۃ العزیز — «مکتبے کی پہچان»: لوگو، مکتبے کا نام، پہچان کی سطریں، پتہ اور موبائل
   ہر صارف خود بھر کر محفوظ کرتا ہے۔ یہ صرف اسی فون میں رہتا ہے (اور بیک اپ میں ساتھ جاتا ہے)۔ */
(function () {
  const KEY = 'maktaba-aziz-brand';
  const DATA_KEY = 'maktaba-aziz-data-v1';
  const DEFAULT_LOGO = 'icons/khatam-logo.png';
  const FIELDS = ['name', 'line1', 'line2', 'line3', 'address', 'phone', 'logo'];
  // پرانے صارف (مکتبۃ العزیز) کی پہچان — صرف ان فونوں پر جہاں پہلے سے کتب محفوظ ہیں
  const LEGACY = {
    name: 'مکتبۃ العزیز',
    line1: 'مولانا مفتی محمد رضوان عزیز',
    line2: 'مدیر',
    line3: '',
    address: 'دارالعلوم ختمِ نبوت، عارف والا',
    phone: '0300-1355147',
    logo: 'default'
  };
  // کشیدہ فونٹ میں صرف یہ حروف ہیں؛ باقی ناموں کے لیے سادہ نوری
  const KASHEEDA = new Set(Array.from('،ابتحخدرزضعفلمنوِپکگۃیے '));

  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const clean = o => { const r = {}; FIELDS.forEach(f => { r[f] = (o && typeof o[f] === 'string') ? o[f].trim() : ''; }); return r; };

  function load() {
    const raw = lsGet(KEY);
    if (raw) { try { return clean(JSON.parse(raw)); } catch (e) {} }
    if (lsGet(DATA_KEY)) { const b = clean(LEGACY); lsSet(KEY, JSON.stringify(b)); return b; }
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
        // سنہری نقش (دارالعلوم کا نشان) صرف اصل لوگو پر
        if (box.classList.contains('emblem')) {
          if (api.isDefaultLogo()) { if (window.__maGoldEmblem) box.classList.add('gold'); }
          else { if (box.classList.contains('gold')) window.__maGoldEmblem = true; box.classList.remove('gold'); }
        }
      }
    });
    document.querySelectorAll('[data-b-empty]').forEach(el => { el.hidden = !api.isEmpty(); });
    document.querySelectorAll('[data-b-filled]').forEach(el => { el.hidden = api.isEmpty(); });
    if (document.body && document.body.dataset.bTitle !== undefined) document.title = b.name || 'مکتبہ';
  }

  // ---------- تصویر چھوٹی کرنا ----------
  function shrink(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        const S = 420, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
        const ctx = cv.getContext('2d');
        const r = Math.min(S / im.width, S / im.height), w = im.width * r, h = im.height * r;
        ctx.drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
        URL.revokeObjectURL(url);
        let d = '';
        try { d = cv.toDataURL('image/webp', 0.9); } catch (e) {}
        if (!d.startsWith('data:image/webp')) d = cv.toDataURL('image/png');
        res(d);
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
      im.src = url;
    });
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
  .br-ring{flex:none;width:112px;height:112px;border-radius:50%;display:grid;place-items:center;overflow:hidden;cursor:pointer;
    background:radial-gradient(circle at 32% 26%,#fff7c8 0,#f6d56c 18%,#d9a42b 46%,#a8741a 74%,#7a4e0a 100%);
    box-shadow:0 0 0 2px #ffe58a,0 0 0 4px #7a4e0a,0 0 0 6px #f2c94e,0 6px 14px rgba(0,0,0,.35)}
  .br-ring .in{width:88%;height:88%;border-radius:50%;background:radial-gradient(circle at 50% 38%,#1f7a5f,#13503f 55%,#0b2f25);display:grid;place-items:center;overflow:hidden}
  .br-ring img{width:86%;height:86%;object-fit:contain}
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
    let logo = brand.logo;
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
      ${fld('name', 'مکتبے کا نام', '', 'placeholder="مثلاً مکتبۃ العزیز"')}
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
    const showPrev = () => {
      const src = logo === 'default' ? DEFAULT_LOGO : logo;
      prev.innerHTML = src ? `<img src="${src}" alt="">` : '<span>لوگو<br>یہاں</span>';
    };
    showPrev();
    const close = () => ov.remove();
    file.addEventListener('change', async () => {
      const f = file.files[0]; if (!f) return;
      try { logo = await shrink(f); showPrev(); ok.textContent = 'لوگو لگ گیا — اب محفوظ کریں'; }
      catch (e) { ok.textContent = 'یہ تصویر نہیں کھل سکی، کوئی اور تصویر چنیں'; }
      file.value = '';
    });
    ov.addEventListener('click', e => {
      if (e.target === ov) return close();
      const a = e.target.closest('[data-a]'); if (!a) return;
      const act = a.dataset.a;
      if (act === 'x') close();
      else if (act === 'pick') file.click();
      else if (act === 'rm') { logo = ''; showPrev(); ok.textContent = ''; }
      else if (act === 'save') {
        const o = { logo };
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  document.addEventListener('click', e => { if (e.target.closest('[data-b-edit]')) { e.preventDefault(); openEditor(); } });
})();
