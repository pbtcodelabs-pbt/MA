/* میرا مکتبہ — کتاب کا اصل ٹائٹل (تصویر) کتاب کے آئیکن پر
   کیمرہ یا گیلری سے تصویر، زوم، انگلی سے کھسکانا، روشنی، کنٹراسٹ، گھمانا؛ شکل: گول، چوکور یا پورا صفحہ۔
   تصویر فون کے اندر (IndexedDB، یادداشتوں والی جگہ) رہتی ہے اور بیک اپ میں ساتھ جاتی ہے۔ */
(() => {
  'use strict';
  const H = () => window.MA_APP, N = () => window.MA_NOTES;
  const $ = (r, s) => r.querySelector(s);
  const urls = {};
  async function url(id) {
    if (urls[id]) return urls[id];
    try { const b = await N().imgGet(id); if (!b) return ''; return (urls[id] = URL.createObjectURL(b)); } catch (e) { return ''; }
  }
  // صفحے پر جہاں بھی data-cv والی تصویر ہو، اسے بھر دیں
  function resolve(root) {
    (root || document).querySelectorAll('img[data-cv]:not([src])').forEach(async im => { const u = await url(im.dataset.cv); if (u) im.src = u; else im.closest('.bkx')?.classList.remove('cv-round', 'cv-square', 'cv-full'); });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches?.('img[data-cv]') || n.querySelector?.('img[data-cv]'))) { resolve(n.parentNode || document); return; } }).observe(document.documentElement, { childList: true, subtree: true });

  const SHAPES = [['full', '📕 پورا ٹائٹل'], ['square', '⬜ چوکور'], ['round', '⭕ گول']];
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  function open(bookId) {
    const db = H().db(), b = db.books.find(x => x.id === bookId); if (!b) return;
    let src = null, shape = (b.cover && b.cover.shape) || 'full', zoom = 1, br = 1, ct = 1, ox = 0, oy = 0, saved = false;
    const { wrap, close } = H().openSheet('کتاب کا ٹائٹل (تصویر)', `
      <div class="sheet-b cv-ed">
        <p class="cv-bk">📖 ${H().esc(b.name)}</p>
        <div class="cv-pick"><button type="button" class="btn" data-c="cam">📷 کیمرہ</button><button type="button" class="btn ghost" data-c="gal">🖼️ گیلری</button>${b.cover ? '<button type="button" class="btn ghost" data-c="rm">✕ ہٹائیں</button>' : ''}</div>
        <input type="file" id="cvCam" accept="image/*" capture="environment" hidden><input type="file" id="cvGal" accept="image/*" hidden>
        <div class="cv-shapes">${SHAPES.map(([k, t]) => `<button type="button" data-s="${k}" class="${shape === k ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="cv-stage">
          <div class="cv-canvas"><canvas id="cvC"></canvas><div class="cv-mask" id="cvMask"></div><p class="cv-tip" id="cvTip">اوپر سے کیمرہ یا گیلری دبائیں</p></div>
          <div class="cv-mini"><span>ایسی نظر آئے گی</span><div id="cvMini"></div></div>
        </div>
        <div class="cv-sl"><b>زوم</b><input type="range" id="cvZ" min="50" max="400" step="5" value="100"><em id="cvZv">100%</em></div>
        <div class="cv-sl"><b>روشنی</b><input type="range" id="cvB" min="50" max="180" step="5" value="100"><em id="cvBv">100%</em></div>
        <div class="cv-sl"><b>کنٹراسٹ</b><input type="range" id="cvT" min="60" max="170" step="5" value="100"><em id="cvTv">100%</em></div>
        <div class="cv-row2"><button type="button" class="btn ghost small" data-c="rot">↻ گھمائیں</button><button type="button" class="btn ghost small" data-c="center">⊕ بیچ میں</button><span class="cv-hint">تصویر کو انگلی سے کھسکائیں</span></div>
        <p class="err" id="cvErr"></p>
        <button type="button" class="btn save" data-c="save">💾 ٹائٹل محفوظ کریں</button>
      </div>`, () => { if (saved) H().route(); });
    const cv = $(wrap, '#cvC'), ctx = cv.getContext('2d'), err = $(wrap, '#cvErr');
    const size = () => shape === 'full' ? [280, 400] : [320, 320];
    function draw(target, W, Hh) {
      const c = target.getContext('2d');
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, Hh);
      if (!src) return;
      c.save(); c.filter = `brightness(${br}) contrast(${ct})`;
      const s = Math.max(W / src.width, Hh / src.height) * zoom, dw = src.width * s, dh = src.height * s;
      c.drawImage(src, W / 2 - dw / 2 + ox * W, Hh / 2 - dh / 2 + oy * Hh, dw, dh);
      c.restore();
    }
    let raf = 0;
    function paint() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const [W, Hh] = size(); cv.width = W; cv.height = Hh;
        draw(cv, W, Hh);
        $(wrap, '#cvMask').className = 'cv-mask ' + shape;
        $(wrap, '#cvTip').hidden = !!src;
        // چھوٹا نمونہ: کتاب کے آئیکن پر
        const u = src ? cv.toDataURL('image/jpeg', .7) : '';
        $(wrap, '#cvMini').innerHTML = `<span class="bkx${u ? ' cv-' + shape : ''}" style="--c:#8e2f2a;--bs:1.3">` +
          `<span class="bkx-top"></span><span class="bkx-cover">${u && shape === 'full' ? `<img class="bkx-full" src="${u}" alt="">` : ''}<span class="bkx-label">${u && shape !== 'full' ? `<img class="bkx-cvimg" src="${u}" alt="">` : H().esc(b.name)}</span></span><span class="bkx-spine"></span></span>`;
      });
    }
    async function setSrc(img) {
      // بہت بڑی تصویر کو پہلے چھوٹا کر لیں
      const m = 1600, r = Math.min(1, m / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      src = c; zoom = 1; ox = oy = 0; $(wrap, '#cvZ').value = 100; $(wrap, '#cvZv').textContent = '100%'; paint();
    }
    // پہلے سے لگی تصویر
    if (b.cover && b.cover.id) url(b.cover.id).then(u => u && loadImg(u).then(setSrc)).catch(() => {});
    paint();
    const pick = async f => { if (!f) return; err.textContent = ''; const u = URL.createObjectURL(f); try { await setSrc(await loadImg(u)); } catch (e) { err.textContent = 'یہ تصویر نہیں کھل سکی'; } URL.revokeObjectURL(u); };
    $(wrap, '#cvCam').onchange = e => { pick(e.target.files[0]); e.target.value = ''; };
    $(wrap, '#cvGal').onchange = e => { pick(e.target.files[0]); e.target.value = ''; };
    const sl = (id, set, lab) => $(wrap, id).addEventListener('input', e => { set(+e.target.value / 100); $(wrap, lab).textContent = e.target.value + '%'; paint(); });
    sl('#cvZ', v => { zoom = v; }, '#cvZv'); sl('#cvB', v => { br = v; }, '#cvBv'); sl('#cvT', v => { ct = v; }, '#cvTv');
    // انگلی سے کھسکانا
    let drag = null;
    cv.addEventListener('pointerdown', e => { if (!src) return; drag = { x: e.clientX, y: e.clientY, ox, oy }; cv.setPointerCapture(e.pointerId); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!drag) return; const r = cv.getBoundingClientRect(); ox = drag.ox + (e.clientX - drag.x) / r.width; oy = drag.oy + (e.clientY - drag.y) / r.height; paint(); });
    const end = () => { drag = null; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    wrap.addEventListener('click', async e => {
      const s = e.target.closest('[data-s]'); if (s) { shape = s.dataset.s; wrap.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === s)); paint(); return; }
      const c = e.target.closest('[data-c]')?.dataset.c; if (!c) return;
      if (c === 'cam') $(wrap, '#cvCam').click();
      if (c === 'gal') $(wrap, '#cvGal').click();
      if (c === 'center') { ox = oy = 0; paint(); }
      if (c === 'rot' && src) { const r = document.createElement('canvas'); r.width = src.height; r.height = src.width; const g = r.getContext('2d'); g.translate(r.width / 2, r.height / 2); g.rotate(Math.PI / 2); g.drawImage(src, -src.width / 2, -src.height / 2); src = r; paint(); }
      if (c === 'rm') { if (b.cover && b.cover.id) await N().imgDel(b.cover.id); delete b.cover; H().save(); saved = true; close(); H().toast('ٹائٹل ہٹا دیا'); }
      if (c === 'save') {
        if (!src) { err.textContent = 'پہلے تصویر چنیں'; return; }
        const [W, Hh] = shape === 'full' ? [420, 600] : [420, 420];
        const out = document.createElement('canvas'); out.width = W; out.height = Hh; draw(out, W, Hh);
        const blob = await new Promise(r => out.toBlob(r, 'image/jpeg', .85));
        const id = 'cv_' + b.id + '_' + Date.now();
        try { await N().imgPut(id, blob); } catch (x) { err.textContent = 'تصویر محفوظ نہیں ہو سکی — فون میں جگہ دیکھیں'; return; }
        if (b.cover && b.cover.id) await N().imgDel(b.cover.id);
        b.cover = { id, shape }; H().save(); saved = true; close(); H().toast('✓ کتاب کا ٹائٹل لگ گیا');
      }
    });
  }
  document.addEventListener('click', e => { const t = e.target.closest('[data-cover-edit]'); if (t) { e.preventDefault(); open(t.dataset.coverEdit); } });
  window.MA_COVER = { open, resolve };
})();
