/* میرا مکتبہ — ضروری یادداشتیں
   ہر کتاب (اور ہر جلد) کی یادداشتیں: نمبر شمار خود، یادداشت، صفحہ نمبر، اور اصل صفحے کی تصویر (کیمرہ یا گیلری)۔
   متن ایپ کے ڈیٹا (db.notes) میں، تصاویر فون کے اندر IndexedDB میں رہتی ہیں (جگہ زیادہ، ایپ ہلکی)۔
   بھیجنا: ایک یادداشت، ایک جلد یا پوری کتاب — واٹس ایپ متن، پوسٹر تصویر یا PDF؛ اوپر مکتبے کا لیٹر ہیڈ۔ */
(() => {
  'use strict';
  const H = () => window.MA_APP;
  const K = () => window.MA_SHARE_UI && window.MA_SHARE_UI.kit;
  const $ = (r, s) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => (H() && H().num) ? H().num(n) : String(n);
  const toast = m => H() && H().toast(m);
  const ltr = s => '⁦' + s + '⁩';
  const notes = () => { const d = H().db(); d.notes = d.notes || []; return d.notes; };
  const vols = b => Math.max(1, parseInt(b.parts, 10) || 1);

  // ---------- تصاویر: IndexedDB ----------
  const IDB = 'maktaba-aziz-img', ST = 'img';
  let dbp = null;
  const idb = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(IDB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => res(r.result); r.onerror = () => { dbp = null; rej(r.error); };
  }));
  async function tx(mode, fn) {
    const d = await idb();
    return new Promise((res, rej) => {
      const t = d.transaction(ST, mode), q = fn(t.objectStore(ST));
      t.oncomplete = () => res(q ? q.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  }
  const imgPut = (id, blob) => tx('readwrite', s => s.put(blob, id));
  const imgGet = id => tx('readonly', s => s.get(id)).catch(() => null);
  const imgDel = id => { delete urls[id]; return tx('readwrite', s => s.delete(id)).catch(() => {}); };
  const imgHas = async id => !!(await tx('readonly', s => s.count(id)).catch(() => 0));
  const urls = {};
  async function imgUrl(id) {
    if (urls[id]) return urls[id];
    const b = await imgGet(id); if (!b) return '';
    return (urls[id] = URL.createObjectURL(b));
  }
  const blobToData = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(''); f.readAsDataURL(b); });
  const dataToBlob = u => { const [h, d] = String(u).split(','); const bin = atob(d); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: (h.match(/:(.*?);/) || [])[1] || 'image/jpeg' }); };
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  // تصویر: چھوٹی کریں، گھمائیں، اور «سکین» کی طرح صاف (روشنی اور کنٹراسٹ)
  async function processImage(src, rot = 0, clean = true) {
    const img = await loadImg(src);
    const max = 1600, r = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * r), h = Math.round(img.height * r);
    const sw = rot % 180 ? h : w, sh = rot % 180 ? w : h;
    const cv = document.createElement('canvas'); cv.width = sw; cv.height = sh;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, sw, sh);
    ctx.translate(sw / 2, sh / 2); ctx.rotate(rot * Math.PI / 180); ctx.drawImage(img, -w / 2, -h / 2, w, h);
    if (clean) {
      try {
        const id = ctx.getImageData(0, 0, sw, sh), p = id.data, hist = new Uint32Array(256);
        for (let i = 0; i < p.length; i += 16) hist[(p[i] * 77 + p[i + 1] * 150 + p[i + 2] * 29) >> 8]++;
        const tot = hist.reduce((s, x) => s + x, 0);
        let lo = 0, hi = 255, acc = 0;
        for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc > tot * 0.02) { lo = i; break; } }
        acc = 0; for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc > tot * 0.04) { hi = i; break; } }
        if (hi - lo > 30) {
          const lut = new Uint8ClampedArray(256);
          for (let i = 0; i < 256; i++) { const v = (i - lo) / (hi - lo); lut[i] = 255 * Math.pow(Math.min(1, Math.max(0, v)), 1.1); }
          for (let i = 0; i < p.length; i += 4) { p[i] = lut[p[i]]; p[i + 1] = lut[p[i + 1]]; p[i + 2] = lut[p[i + 2]]; }
          ctx.putImageData(id, 0, 0);
        }
      } catch (e) {}
    }
    return new Promise(res => cv.toBlob(res, 'image/jpeg', 0.8));
  }

  // ---------- اسٹائل ----------
  const css = document.createElement('style');
  css.textContent = `
  .nt-go{width:100%;justify-content:center;margin-top:10px;font-size:20px;min-height:52px;border-radius:14px;
    background:linear-gradient(180deg,#2f8f6f,#14463a);border-color:#0e3a2f;box-shadow:0 4px 0 #0b2e26,0 8px 14px rgba(0,0,0,.18)}
  .nt-go b{font-weight:400;background:#e8c467;color:#14463a;border-radius:99px;padding:0 10px;font-size:16px}
  .nt-book{display:grid;gap:2px;text-align:center;padding:4px 0 8px}
  .nt-book b{font-family:var(--f-title);font-weight:400;font-size:28px;line-height:1.9;color:var(--accent)}
  .nt-book small{color:var(--muted);font-size:15px}
  .nt-vols{display:flex;gap:6px;overflow-x:auto;padding:4px 2px 8px;scrollbar-width:none}
  .nt-vols button{flex:none;border:1.5px solid var(--accent);background:var(--card);color:var(--accent);border-radius:99px;padding:0 14px;font:inherit;font-size:16px;line-height:2.1;cursor:pointer}
  .nt-vols button.on{background:var(--accent);color:#fff}
  .nt-vols button i{font-style:normal;font-size:13px;opacity:.85;margin-inline-start:4px}
  .nt-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
  .nt-acts .btn{justify-content:center;font-size:17px;padding:0 10px}
  .nt-acts .nt-add{grid-column:1 / -1;font-size:20px;min-height:52px}
  .nt-sheet{border:1.5px solid var(--gilt);border-radius:14px;overflow:hidden;background:#fffdf6}
  .nt-hd,.nt-row{display:grid;grid-template-columns:38px minmax(0,1fr) 74px;align-items:stretch}
  .nt-hd{background:#14463a;color:#f1d27a;font-size:15px;line-height:2.2}
  .nt-hd span{text-align:center}
  .nt-row{border-top:1px solid #eadfc4;min-height:58px;background-image:linear-gradient(transparent calc(100% - 1px),#f1e7cf 0)}
  .nt-row:nth-child(even){background-color:#fbf6e8}
  .nt-row .n{text-align:center;color:var(--muted);font-variant-numeric:tabular-nums;padding-top:12px}
  .nt-row .t{padding:6px 8px;font-size:18px;line-height:1.9;cursor:pointer;overflow-wrap:anywhere;border-inline:1px dashed #eadfc4}
  .nt-row .sd{display:grid;justify-items:center;align-content:start;gap:4px;padding:6px 2px}
  .nt-row .pg{text-align:center;font-size:20px;line-height:1.3;color:#14463a;font-variant-numeric:tabular-nums;cursor:pointer;background:#fff;border:1px solid #e4d6b0;border-radius:8px;min-width:56px;padding:2px 4px}
  .nt-row .pg small{display:block;font-size:11px;color:var(--muted);line-height:1.3}
  .nt-row .cl{display:flex;align-items:center;gap:2px}
  .nt-clip{width:40px;height:40px;border-radius:10px;border:1.5px dashed var(--gilt);background:var(--gilt-soft);display:grid;place-items:center;cursor:pointer;padding:0;color:#8a5f16}
  .nt-th{width:40px;height:40px;border-radius:8px;object-fit:cover;border:2px solid #c8962f;cursor:pointer;display:block;background:#eee}
  .nt-sh{border:0;background:none;color:var(--accent);cursor:pointer;padding:2px;line-height:0}
  .nt-empty{padding:22px 14px;text-align:center;color:var(--muted);line-height:2}
  .nt-empty b{display:block;color:var(--fg);font-weight:400;font-size:19px}
  .nt-hint{font-size:14px;color:var(--muted);text-align:center;margin:8px 0 0;line-height:1.9}
  /* فارم */
  .nt-form textarea{width:100%;box-sizing:border-box;min-height:90px;border:1.5px solid var(--line);border-radius:12px;padding:8px 10px;font:inherit;font-size:19px;line-height:1.9;resize:vertical;background:#fff}
  .nt-form textarea:focus,.nt-form input:focus,.nt-form select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
  .nt-f2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .nt-f2 label,.nt-lb{display:grid;gap:2px;font-size:15px;color:var(--muted)}
  .nt-f2 input,.nt-f2 select{border:1.5px solid var(--line);border-radius:12px;min-height:46px;padding:0 10px;font:inherit;font-size:20px;background:#fff;width:100%;box-sizing:border-box}
  .nt-att{border:1.5px dashed var(--gilt);border-radius:14px;padding:10px;background:var(--gilt-soft);display:grid;gap:8px}
  .nt-att .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
  .nt-att .btn{font-size:17px;padding:0 12px}
  .nt-prev{display:grid;gap:6px;justify-items:center}
  .nt-prev img{max-width:100%;max-height:260px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.2);background:#fff}
  .nt-clean{display:flex;align-items:center;gap:6px;justify-content:center;font-size:15px;color:#6b4a1a}
  .nt-clean input{width:20px;height:20px;accent-color:#14463a}
  .nt-err{color:var(--danger);text-align:center;min-height:1.2em;margin:0;font-size:15px}
  .nt-del{color:var(--danger);border-color:var(--danger)}
  /* تصویر دیکھنا */
  .nt-view{position:fixed;inset:0;z-index:120;background:rgba(5,15,12,.96);display:grid;grid-template-rows:auto minmax(0,1fr) auto;direction:rtl}
  .nt-view .nt-vb{display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 10px 8px;color:#f1d27a}
  .nt-view .nt-vb b{flex:1;font-weight:400;font-size:17px;line-height:1.8;color:#fff1c1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nt-view .nt-vb button,.nt-view .ft button{border:1.5px solid #e8c467;background:rgba(255,255,255,.08);color:#fff1c1;border-radius:12px;min-height:42px;padding:0 12px;font:inherit;font-size:16px;cursor:pointer}
  .nt-view .sc{overflow:auto;display:grid;place-items:center;padding:6px;min-height:0}
  .nt-view .sc img{max-width:100%;max-height:calc(100dvh - 150px);object-fit:contain;transition:width .2s}
  .nt-view .sc.z{place-items:start center}
  .nt-view .sc.z img{max-width:none;max-height:none;width:200%}
  .nt-view .ft{display:flex;gap:8px;justify-content:center;align-items:center;padding:8px 10px calc(10px + env(safe-area-inset-bottom))}
  /* بھیجنے کا خانہ */
  .nt-so{display:grid;gap:10px}
  .nt-so .seg{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
  .nt-so .seg button{border:1.5px solid var(--accent);background:var(--card);color:var(--accent);border-radius:99px;padding:0 14px;font:inherit;font-size:16px;line-height:2.2;cursor:pointer}
  .nt-so .seg button.on{background:var(--accent);color:#fff}
  .nt-so .outs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .nt-so .outs .btn{justify-content:center;font-size:18px;min-height:52px}
  .nt-so .outs .btn.wide{grid-column:1 / -1}
  .nt-so .lb{font-size:15px;color:var(--muted);text-align:center;margin:0}
  `;
  document.head.appendChild(css);

  const I_CLIP = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5"/></svg>';
  const I_SHARE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';

  // ---------- فہرست ----------
  const VKEY = 'maktaba-aziz-notes-vol';
  const volOf = {};   // ہر کتاب کی چنی ہوئی جلد
  try { Object.assign(volOf, JSON.parse(localStorage.getItem(VKEY) || '{}')); } catch (e) {}
  const saveVol = () => { try { localStorage.setItem(VKEY, JSON.stringify(volOf)); } catch (e) {} };
  const listOf = (b, v) => notes().filter(n => n.book === b.id && (!v || (n.vol || 1) === v)).sort((x, y) => (x.vol || 1) - (y.vol || 1) || (x.ts || 0) - (y.ts || 0));
  const countOf = bookId => notes().filter(n => n.book === bookId).length;

  let cur = null;   // { cat, b }
  function page(cat, b) {
    cur = { cat, b };
    const V = vols(b);
    let v = volOf[b.id] || 1; if (v > V) v = 1;
    const list = listOf(b, v);
    const view = H().view;
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><a class="back" href="#/c/${cat.id}/b/${b.id}">→ کتاب</a><span class="crumb">ضروری یادداشتیں</span></div>
        <div class="panel-b" id="ntb">
          <div class="nt-book"><b>${esc(b.name)}</b><small>${[b.author, b.publisher].filter(Boolean).map(esc).join(' · ')}</small></div>
          ${V > 1 ? `<div class="nt-vols" id="ntVols">${Array.from({ length: V }, (_, i) => { const c = listOf(b, i + 1).length; return `<button type="button" data-v="${i + 1}" class="${i + 1 === v ? 'on' : ''}">جلد ${num(i + 1)}${c ? `<i>(${num(c)})</i>` : ''}</button>`; }).join('')}</div>` : ''}
          <div class="nt-acts">
            <button class="btn nt-add" type="button" data-a="add">＋ نئی یادداشت لکھیں</button>
            <button class="btn ghost" type="button" data-a="send">${I_SHARE} بھیجیں / PDF</button>
            <button class="btn ghost" type="button" data-a="blank">🖨️ خالی صفحہ</button>
          </div>
          <div class="nt-sheet">
            <div class="nt-hd"><span>نمبر</span><span>ضروری یادداشت${V > 1 ? ` (جلد ${num(v)})` : ''}</span><span>صفحہ</span></div>
            ${list.length ? list.map((n, i) => `<div class="nt-row" data-id="${n.id}">
              <span class="n">${num(i + 1)}</span>
              <span class="t" data-a="edit">${esc(n.text)}</span>
              <span class="sd"><span class="pg" data-a="edit"><small>صفحہ</small>${n.page ? num(n.page) : '—'}</span>
              <span class="cl">${n.img ? `<img class="nt-th" data-a="view" data-img="${n.img}" alt="صفحے کی تصویر">` : `<button type="button" class="nt-clip" data-a="clip" aria-label="تصویر لگائیں">${I_CLIP}</button>`}
                <button type="button" class="nt-sh" data-a="one" aria-label="یہ یادداشت بھیجیں">${I_SHARE}</button></span></span>
            </div>`).join('') : `<div class="nt-empty"><b>ابھی کوئی یادداشت نہیں</b>«نئی یادداشت لکھیں» دبائیں — عنوان، صفحہ نمبر لکھیں اور 📎 سے کتاب کے صفحے کی تصویر لگائیں۔</div>`}
          </div>
          <p class="nt-hint">کسی سطر کو دبا کر ترمیم کریں · 📎 دبا کر کیمرے یا گیلری سے صفحے کی تصویر لگائیں</p>
        </div>
      </section>`;
    // تصویروں کے چھوٹے نشان
    view.querySelectorAll('img[data-img]').forEach(async im => { const u = await imgUrl(im.dataset.img); if (u) im.src = u; else im.replaceWith(Object.assign(document.createElement('span'), { textContent: '—' })); });
    $(view, '#ntVols')?.addEventListener('click', e => { const t = e.target.closest('[data-v]'); if (!t) return; volOf[b.id] = +t.dataset.v; saveVol(); page(cat, b); });
    $(view, '#ntb').addEventListener('click', e => {
      const t = e.target.closest('[data-a]'); if (!t) return;
      const a = t.dataset.a, row = t.closest('.nt-row'), n = row ? notes().find(x => x.id === row.dataset.id) : null;
      if (a === 'add') openForm(b, null, v);
      else if (a === 'send') openSend(b, { vol: v });
      else if (a === 'blank') blankPdf(b, v, t);
      else if (a === 'edit' && n) openForm(b, n);
      else if (a === 'clip' && n) quickAttach(b, n);
      else if (a === 'view' && n) viewImg(b, n);
      else if (a === 'one' && n) openSend(b, { one: n });
    });
  }
  const refresh = () => { if (cur && /\/notes$/.test(location.hash)) page(cur.cat, cur.b); };

  // ---------- نئی / ترمیم ----------
  function openForm(b, n, vol) {
    const V = vols(b);
    let img = n ? (n.img || '') : '', fresh = null, rot = 0, clean = true, saved = false, srcUrl = '';
    const { wrap, close } = H().openSheet(n ? 'یادداشت میں ترمیم' : 'نئی ضروری یادداشت', `
      <form class="sheet-b nt-form" id="ntForm" novalidate>
        <label class="nt-lb">ضروری یادداشت (عنوان / مضمون)
          <textarea id="ntText" placeholder="مثلاً: جنگِ آزادی میں علمائے کرام کا کردار">${esc(n?.text || '')}</textarea></label>
        <div class="nt-f2">
          <label>صفحہ نمبر<input id="ntPage" inputmode="numeric" autocomplete="off" dir="ltr" value="${esc(n?.page || '')}" placeholder="332"></label>
          ${V > 1 ? `<label>جلد<select id="ntVol">${Array.from({ length: V }, (_, i) => `<option value="${i + 1}" ${(n ? (n.vol || 1) : vol) === i + 1 ? 'selected' : ''}>جلد ${num(i + 1)}</option>`).join('')}</select></label>` : '<span></span>'}
        </div>
        <div class="nt-att">
          <div class="nt-prev" id="ntPrev"></div>
          <div class="row">
            <button type="button" class="btn" data-p="cam">📷 کیمرے سے سکین</button>
            <button type="button" class="btn ghost" data-p="gal">🖼️ گیلری سے</button>
          </div>
          <input type="file" id="ntCam" accept="image/*" capture="environment" hidden>
          <input type="file" id="ntGal" accept="image/*" hidden>
        </div>
        <p class="nt-err" id="ntErr" role="alert"></p>
        <button class="btn save" type="submit">💾 ${n ? 'تبدیلی محفوظ کریں' : 'محفوظ کریں'}</button>
        ${n ? '<button class="btn ghost nt-del" type="button" id="ntDel">🗑️ یہ یادداشت حذف کریں</button>' : '<p class="hint center">محفوظ کرنے کے بعد اگلی یادداشت کے لیے خانہ کھلا رہے گا</p>'}
      </form>`, () => { if (srcUrl) URL.revokeObjectURL(srcUrl); if (saved) refresh(); });
    const prev = $(wrap, '#ntPrev'), err = $(wrap, '#ntErr');
    async function drawPrev() {
      if (fresh) {
        prev.innerHTML = `<img src="${URL.createObjectURL(fresh)}" alt="">
          <div class="row" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button type="button" class="btn ghost small" data-p="rot">↻ گھمائیں</button><button type="button" class="btn ghost small" data-p="rm">✕ ہٹائیں</button></div>
          <label class="nt-clean"><input type="checkbox" id="ntClean" ${clean ? 'checked' : ''}> صفحہ صاف کریں (سکین جیسا)</label>`;
        $(prev, '#ntClean').onchange = async e => { clean = e.target.checked; await rebuild(); };
      } else if (img) {
        const u = await imgUrl(img);
        prev.innerHTML = u ? `<img src="${u}" alt=""><div class="row" style="display:flex;gap:8px;justify-content:center"><button type="button" class="btn ghost small" data-p="rm">✕ تصویر ہٹائیں</button></div>` : '';
      } else prev.innerHTML = `<span style="color:#8a5f16;font-size:15px;text-align:center;line-height:1.9">📎 کتاب کے اس صفحے کی تصویر لگائیں جہاں یہ مضمون لکھا ہے</span>`;
    }
    async function rebuild() { if (!srcUrl) return; prev.innerHTML = '<span>تصویر تیار ہو رہی ہے…</span>'; try { fresh = await processImage(srcUrl, rot, clean); } catch (e) { err.textContent = 'یہ تصویر نہیں کھل سکی'; fresh = null; } drawPrev(); }
    drawPrev();
    const pick = async f => {
      if (!f) return;
      if (srcUrl) URL.revokeObjectURL(srcUrl);
      srcUrl = URL.createObjectURL(f); rot = 0; await rebuild();
    };
    $(wrap, '#ntCam').onchange = e => { pick(e.target.files[0]); e.target.value = ''; };
    $(wrap, '#ntGal').onchange = e => { pick(e.target.files[0]); e.target.value = ''; };
    wrap.addEventListener('click', e => {
      const p = e.target.closest('[data-p]')?.dataset.p; if (!p) return;
      if (p === 'cam') $(wrap, '#ntCam').click();
      if (p === 'gal') $(wrap, '#ntGal').click();
      if (p === 'rot') { rot = (rot + 90) % 360; rebuild(); }
      if (p === 'rm') { fresh = null; img = ''; if (srcUrl) { URL.revokeObjectURL(srcUrl); srcUrl = ''; } drawPrev(); }
    });
    $(wrap, '#ntDel')?.addEventListener('click', async () => {
      if (!confirm('یہ یادداشت حذف کریں؟')) return;
      const L = notes(), i = L.findIndex(x => x.id === n.id);
      if (i > -1) { if (L[i].img) await imgDel(L[i].img); L.splice(i, 1); H().save(); }
      saved = true; close(); toast('یادداشت حذف ہو گئی');
    });
    setTimeout(() => $(wrap, '#ntText').focus(), 60);
    $(wrap, '#ntForm').addEventListener('submit', async e => {
      e.preventDefault();
      const text = $(wrap, '#ntText').value.trim(), pg = String($(wrap, '#ntPage').value).trim();
      const v = V > 1 ? +$(wrap, '#ntVol').value : 1;
      if (!text) { err.textContent = 'یادداشت لکھنا ضروری ہے'; $(wrap, '#ntText').focus(); return; }
      let imgId = img;
      if (fresh) {
        imgId = H().newId();
        try { await imgPut(imgId, fresh); } catch (x) { err.textContent = 'تصویر محفوظ نہیں ہو سکی — فون میں جگہ دیکھیں'; return; }
      }
      const old = n && n.img && n.img !== imgId ? n.img : '';
      if (n) Object.assign(n, { text, page: pg, vol: v, img: imgId, upd: Date.now() });
      else notes().push({ id: H().newId(), book: b.id, vol: v, text, page: pg, img: imgId, ts: Date.now() });
      if (old) await imgDel(old);
      H().save(); saved = true;
      if (n) { close(); toast('تبدیلی محفوظ ہو گئی'); return; }
      volOf[b.id] = v; saveVol();
      toast(`یادداشت نمبر ${num(listOf(b, v).length)} محفوظ — اگلی لکھیں`);
      $(wrap, '#ntText').value = ''; $(wrap, '#ntPage').value = ''; fresh = null; img = ''; if (srcUrl) { URL.revokeObjectURL(srcUrl); srcUrl = ''; } err.textContent = '';
      drawPrev(); refresh(); $(wrap, '#ntText').focus();
    });
  }

  // 📎 سیدھا تصویر لگانا (فہرست سے)
  function quickAttach(b, n) {
    const { wrap, close } = H().openSheet('صفحے کی تصویر لگائیں', `
      <div class="sheet-b nt-form">
        <p class="hint center" style="margin:0">${esc(n.text)}${n.page ? ` — صفحہ ${num(n.page)}` : ''}</p>
        <div class="nt-att"><div class="row">
          <button type="button" class="btn" data-p="cam">📷 کیمرے سے سکین</button>
          <button type="button" class="btn ghost" data-p="gal">🖼️ گیلری سے</button></div></div>
        <input type="file" id="qaCam" accept="image/*" capture="environment" hidden><input type="file" id="qaGal" accept="image/*" hidden>
      </div>`);
    const go = async f => {
      if (!f) return;
      const u = URL.createObjectURL(f);
      try {
        const blob = await processImage(u, 0, true), id = H().newId();
        await imgPut(id, blob);
        if (n.img) await imgDel(n.img);
        n.img = id; n.upd = Date.now(); H().save(); close(); toast('تصویر لگ گئی'); refresh();
        openForm(b, n);   // گھمانا / صاف کرنا ہو تو یہیں
      } catch (e) { toast('تصویر محفوظ نہیں ہو سکی'); }
      finally { URL.revokeObjectURL(u); }
    };
    wrap.addEventListener('click', e => { const p = e.target.closest('[data-p]')?.dataset.p; if (p === 'cam') $(wrap, '#qaCam').click(); if (p === 'gal') $(wrap, '#qaGal').click(); });
    $(wrap, '#qaCam').onchange = e => go(e.target.files[0]);
    $(wrap, '#qaGal').onchange = e => go(e.target.files[0]);
  }

  // ---------- تصویر بڑی دیکھیں ----------
  async function viewImg(b, n) {
    const u = await imgUrl(n.img); if (!u) return;
    const w = document.createElement('div'); w.className = 'nt-view';
    w.innerHTML = `<div class="nt-vb"><b>${esc(n.text)}${n.page ? ` — صفحہ ${num(n.page)}` : ''}</b><button type="button" data-x="close">✕ بند</button></div>
      <div class="sc" id="ntSc"><img src="${u}" alt=""></div>
      <div class="ft"><button type="button" data-x="zoom">🔍 بڑا / چھوٹا</button><button type="button" data-x="send">${I_SHARE} بھیجیں</button><button type="button" data-x="edit">✏️ ترمیم</button></div>`;
    document.body.appendChild(w);
    const onBack = () => w.remove();
    w.addEventListener('click', e => {
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'close') w.remove();
      if (x === 'zoom') $(w, '#ntSc').classList.toggle('z');
      if (x === 'send') { w.remove(); openSend(b, { one: n }); }
      if (x === 'edit') { w.remove(); openForm(b, n); }
    });
    window.addEventListener('hashchange', onBack, { once: true });
  }

  // ---------- بھیجنا ----------
  const bookLine = b => [b.name, b.author].filter(Boolean).join(' — ');
  function scopeList(b, o) {
    if (o.one) return [o.one];
    return o.all ? listOf(b, 0) : listOf(b, o.vol || 1);
  }
  function scopeTitle(b, o) {
    if (o.one) return 'ضروری یادداشت';
    return 'ضروری یادداشتیں' + (vols(b) > 1 && !o.all ? ` — جلد ${o.vol || 1}` : '');
  }
  function textOf(b, o) {
    const k = K(), L = scopeList(b, o), V = vols(b);
    let t = (k && k.brandText ? k.brandText() + '\n' : '') + `*${scopeTitle(b, o)}*\n📖 ${bookLine(b)}\n`;
    let lastV = 0;
    L.forEach(n => {
      const nv = n.vol || 1;
      if (V > 1 && (o.all || o.one) && nv !== lastV) { t += `\n*جلد ${nv}*\n`; lastV = nv; }
      const i = listOf(b, nv).indexOf(n) + 1;
      t += `${i}) ${n.text}${n.page ? ` — صفحہ ${n.page}` : ''}\n`;
    });
    return t.trim();
  }

  function openSend(b, o0) {
    const V = vols(b);
    const o = Object.assign({ vol: 1, all: false, imgs: true }, o0);
    const L0 = o.one ? [o.one] : null;
    const { wrap, close } = H().openSheet(o.one ? 'یادداشت بھیجیں' : 'یادداشتیں بھیجیں', `
      <div class="sheet-b nt-so" id="ntSo"></div>`);
    const box = $(wrap, '#ntSo');
    const draw = () => {
      const L = L0 || scopeList(b, o), withImg = L.filter(n => n.img).length;
      box.innerHTML = `
        ${!o.one && V > 1 ? `<p class="lb">کیا بھیجنا ہے؟</p><div class="seg" data-g="sc"><button type="button" data-s="vol" class="${o.all ? '' : 'on'}">صرف جلد ${num(o.vol)}</button><button type="button" data-s="all" class="${o.all ? 'on' : ''}">پوری کتاب (${num(V)} جلدیں)</button></div>` : ''}
        <p class="lb">${o.one ? esc(o.one.text) : `${num(L.length)} یادداشتیں`}${withImg ? ` · ${num(withImg)} تصاویر` : ''}</p>
        ${withImg ? `<div class="seg" data-g="im"><button type="button" data-i="1" class="${o.imgs ? 'on' : ''}">تصاویر کے ساتھ</button><button type="button" data-i="0" class="${o.imgs ? '' : 'on'}">صرف فہرست</button></div>` : ''}
        <div class="outs">
          <button class="btn" type="button" data-o="wa">واٹس ایپ</button>
          <button class="btn" type="button" data-o="img">🖼️ پوسٹر تصویر</button>
          <button class="btn" type="button" data-o="pdf">📄 PDF / پرنٹ</button>
          <button class="btn ghost" type="button" data-o="copy">📋 کاپی</button>
        </div>
        ${L.length ? '' : '<p class="nt-err">اس میں کوئی یادداشت نہیں</p>'}`;
      box.querySelectorAll('.outs .btn').forEach(x => { x.disabled = !L.length; });
    };
    draw();
    box.addEventListener('click', async e => {
      const s = e.target.closest('[data-s]'), im = e.target.closest('[data-i]'), out = e.target.closest('[data-o]');
      if (s) { o.all = s.dataset.s === 'all'; draw(); return; }
      if (im) { o.imgs = im.dataset.i === '1'; draw(); return; }
      if (!out) return;
      const k = K(); if (!k) return;
      const kind = out.dataset.o, txt = textOf(b, o), old = out.innerHTML;
      try {
        if (kind === 'copy') { toast(await k.copyText(txt) ? 'کاپی ہو گئی' : 'کاپی نہیں ہو سکی'); return; }
        if (kind === 'wa') {
          // ایک یادداشت + تصویر: تصویر اور متن اکٹھے
          if (o.one && o.one.img && o.imgs && navigator.canShare) {
            const blob = await imgGet(o.one.img);
            if (blob) { const f = new File([blob], `safha-${o.one.page || 'x'}.jpg`, { type: 'image/jpeg' }); if (navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: txt }); return; } catch (x) { if (x.name === 'AbortError') return; } } }
          }
          if (txt.length <= 3500) location.href = 'https://wa.me/?text=' + encodeURIComponent(txt);
          else if (navigator.share) navigator.share({ text: txt }).catch(() => {});
          else { await k.copyText(txt); toast('کاپی ہو گئی — واٹس ایپ میں پیسٹ کریں'); }
          return;
        }
        out.disabled = true; out.textContent = 'بن رہا ہے…';
        const stamp = new Date().toISOString().slice(0, 10);
        if (kind === 'img') await k.deliver(await render(b, o, 'poster'), `yaddashtain-${stamp}.png`, scopeTitle(b, o));
        if (kind === 'pdf') await k.deliver(await render(b, o, 'pdf'), `yaddashtain-${stamp}.pdf`, scopeTitle(b, o));
      } catch (x) {
        console.warn(x);
        toast(x && x.message === 'long' ? 'تصویر کے لیے بہت لمبی ہے — PDF بنائیں' : 'فائل نہیں بن سکی، دوبارہ کوشش کریں');
      } finally { out.disabled = false; out.innerHTML = old; }
    });
  }

  // ---------- کینوس: پوسٹر اور PDF ----------
  const W = 1240, M = 50, PH = 1754, TOP = 40, BOT = 80;
  const C = { green: '#14463a', gold: '#c8962f', gold2: '#e8c467', line: '#e4d6b0', fg: '#2b2620', muted: '#7d7262', alt: '#fbf6e8', paper: '#fffdf6' };
  const COLS = { n: 90, pg: 170 };
  function wrapLines(ctx, text, w) {
    const out = []; String(text || '').split(/\n/).forEach(par => {
      let line = '';
      par.split(/\s+/).filter(Boolean).forEach(word => {
        const t = line ? line + ' ' + word : word;
        if (ctx.measureText(t).width <= w || !line) line = t; else { out.push(line); line = word; }
      });
      out.push(line);
    });
    return out.filter((l, i) => l || i === 0);
  }
  async function render(b, o, mode, blankRows) {
    const k = K(); await k.ready();
    const FONT = k.FONT, V = vols(b);
    const L = blankRows ? [] : scopeList(b, o);
    const meas = document.createElement('canvas').getContext('2d'); meas.font = `30px ${FONT}`;
    const tw = W - 2 * M - COLS.n - COLS.pg - 24;
    const blocks = [];
    blocks.push({ h: k.letterH(), draw: (ctx, y) => k.letterDraw(ctx, y) });
    blocks.push({ h: 116, draw: (ctx, y) => k.titleDraw(ctx, y, `${blankRows ? 'ضروری یادداشتیں' : scopeTitle(b, o)}`, `کتاب: ${k.fit(meas, b.name, 420)}`, blankRows ? (V > 1 ? `جلد ${o.vol || 1}` : '') : `کل ${L.length} یادداشتیں`) });
    const head = vtxt => ({ h: 64, keep: 1, draw(ctx, y) {
      ctx.fillStyle = C.green; k.roundRect(ctx, M, y + 8, W - 2 * M, 52, 10); ctx.fill();
      ctx.fillStyle = C.gold2; ctx.font = `24px ${FONT}`; ctx.textAlign = 'center';
      const xN = W - M - COLS.n / 2, xP = M + COLS.pg / 2;
      ctx.fillText('نمبر', xN, y + 44); ctx.fillText('صفحہ نمبر', xP, y + 44);
      ctx.fillText('ضروری یادداشت' + (vtxt ? ` — ${vtxt}` : ''), M + COLS.pg + tw / 2 + 12, y + 44);
    } });
    const row = (i, n, alt) => {
      meas.font = `30px ${FONT}`;
      const lines = n ? wrapLines(meas, n.text, tw) : [''];
      const h = Math.max(70, lines.length * 54 + 22);
      return { h, draw(ctx, y) {
        ctx.fillStyle = alt ? C.alt : C.paper; ctx.fillRect(M, y, W - 2 * M, h);
        ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(M, y + h - .5); ctx.lineTo(W - M, y + h - .5);
        ctx.moveTo(W - M - COLS.n, y); ctx.lineTo(W - M - COLS.n, y + h);
        ctx.moveTo(M + COLS.pg, y); ctx.lineTo(M + COLS.pg, y + h); ctx.stroke();
        ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(M, y + h); ctx.moveTo(W - M, y); ctx.lineTo(W - M, y + h); ctx.stroke();
        if (!n) return;
        ctx.textAlign = 'center'; ctx.fillStyle = C.muted; ctx.font = `26px ${FONT}`; ctx.fillText(String(i), W - M - COLS.n / 2, y + 46);
        ctx.fillStyle = C.green; ctx.font = `30px ${FONT}`; ctx.fillText(n.page ? String(n.page) : '—', M + COLS.pg / 2, y + 46);
        if (n.img && o.imgs) { ctx.font = `18px ${FONT}`; ctx.fillStyle = C.gold; ctx.fillText('تصویر نیچے', M + COLS.pg / 2, y + 74); }
        ctx.textAlign = 'right'; ctx.fillStyle = C.fg; ctx.font = `30px ${FONT}`;
        lines.forEach((l, j) => ctx.fillText(l, W - M - COLS.n - 14, y + 46 + j * 54));
      } };
    };
    // جلد وار
    const groups = [];
    if (blankRows) groups.push({ v: o.vol || 1, list: [] });
    else if (o.one) groups.push({ v: o.one.vol || 1, list: [o.one] });
    else { const vs = [...new Set(L.map(n => n.vol || 1))].sort((a, c) => a - c); vs.forEach(v => groups.push({ v, list: L.filter(n => (n.vol || 1) === v) })); if (!groups.length) groups.push({ v: o.vol || 1, list: [] }); }
    groups.forEach(g => {
      blocks.push(head(V > 1 ? `جلد ${g.v}` : ''));
      const all = listOf(b, g.v);
      g.list.forEach((n, j) => blocks.push(row(all.indexOf(n) + 1, n, j % 2)));
    });
    // نیچے کی پٹی: پرنٹ کے لیے خالی سطریں (صفحہ بھرنے تک)
    blocks.push({ fill: mode === 'pdf', h: 20, draw() {} });
    // تصاویر
    const pics = (o.imgs && !blankRows) ? L.filter(n => n.img) : [];
    const loaded = [];
    for (const n of pics) { const u = await imgUrl(n.img); if (!u) continue; try { loaded.push({ n, im: await loadImg(u) }); } catch (e) {} }
    if (loaded.length) {
      blocks.push({ h: 90, page: mode === 'pdf', draw(ctx, y) {
        ctx.fillStyle = C.green; ctx.font = `34px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('اصل صفحات کی تصاویر', W / 2, y + 56);
        ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 180, y + 74); ctx.lineTo(W / 2 + 180, y + 74); ctx.stroke();
      } });
      loaded.forEach(({ n, im }) => {
        const maxH = mode === 'pdf' ? PH - TOP - BOT - 90 - 110 : 1700;
        let w = W - 2 * M - 20, h = im.height * w / im.width; if (h > maxH) { h = maxH; w = im.width * h / im.height; }
        const idx = listOf(b, n.vol || 1).indexOf(n) + 1;
        const cap = `${idx}) ${n.text}${n.page ? ` — صفحہ ${n.page}` : ''}${V > 1 ? ` — جلد ${n.vol || 1}` : ''}`;
        blocks.push({ h: 70 + h + 40, draw(ctx, y) {
          ctx.fillStyle = '#efe2bf'; k.roundRect(ctx, M, y + 8, W - 2 * M, 54, 10); ctx.fill();
          ctx.fillStyle = C.green; ctx.font = `26px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText(k.fit(ctx, cap, W - 2 * M - 40), W - M - 20, y + 44);
          const x = (W - w) / 2, yy = y + 72;
          ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x + 6, yy + 6, w, h);
          ctx.drawImage(im, x, yy, w, h); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.strokeRect(x, yy, w, h);
        } });
      });
    }
    const foot = (ctx, i, n, ph) => { ctx.fillStyle = C.muted; ctx.font = `20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(`${k.brandName()} — ${b.name} — ضروری یادداشتیں${n > 1 ? ` — صفحہ ${i + 1} / ${n}` : ''}`, W / 2, ph - 34); };
    const newCv = h => { const cv = document.createElement('canvas'); cv.width = W; cv.height = h; const ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, h); return [cv, ctx]; };

    if (mode === 'poster') {
      const bl = blocks.filter(x => !x.fill);
      const Hh = bl.reduce((s, x) => s + x.h, 0) + 90;
      if (Hh > 30000) throw new Error('long');
      const [cv, ctx] = newCv(Hh); let y = 14;
      bl.forEach(x => { x.draw(ctx, y); y += x.h; });
      ctx.strokeStyle = C.gold2; ctx.lineWidth = 6; ctx.strokeRect(12, 12, W - 24, Hh - 24);
      foot(ctx, 0, 1, Hh);
      return new Promise(r => cv.toBlob(r, 'image/png'));
    }
    // PDF: صفحات
    const pages = []; let curP = [], y = TOP;
    const ROWH = 70;
    for (const x of blocks) {
      if (x.fill) {
        // اس صفحے کے آخر تک خالی سطریں
        let alt = 0; while (y + ROWH <= PH - BOT) { const r = row(0, null, alt++ % 2); curP.push(r); y += r.h; }
        continue;
      }
      if (x.page && curP.length) { pages.push(curP); curP = []; y = TOP; }
      const need = x.keep ? x.h + 80 : x.h;
      if (y + need > PH - BOT && curP.length) { pages.push(curP); curP = []; y = TOP; }
      curP.push(x); y += x.h;
    }
    if (curP.length) pages.push(curP);
    const jpgs = pages.map((pg, i) => { const [cv, ctx] = newCv(PH); let yy = TOP; pg.forEach(x => { x.draw(ctx, yy); yy += x.h; }); foot(ctx, i, pages.length, PH); return cv.toDataURL('image/jpeg', 0.88); });
    return k.makePdf(jpgs, W, PH);
  }

  // 🖨️ خالی صفحہ — ہاتھ سے لکھ کر کتاب کے شروع میں لگانے کے لیے
  async function blankPdf(b, v, btn) {
    const k = K(); if (!k) return;
    const old = btn.innerHTML; btn.disabled = true; btn.textContent = 'بن رہا ہے…';
    try { await k.deliver(await render(b, { vol: v, imgs: false }, 'pdf', true), `khali-safha-${b.name.slice(0, 20)}.pdf`, 'ضروری یادداشتیں — خالی صفحہ'); }
    catch (e) { console.warn(e); toast('فائل نہیں بن سکی'); }
    finally { btn.disabled = false; btn.innerHTML = old; }
  }

  // ---------- بیک اپ کے لیے ----------
  const imgIds = () => [...new Set(notes().map(n => n.img).filter(Boolean))];
  async function exportImgs() {
    const o = {};
    for (const id of imgIds()) { const b = await imgGet(id); if (b) o[id] = await blobToData(b); }
    return Object.keys(o).length ? o : undefined;
  }
  async function importImgs(o) {
    if (!o || typeof o !== 'object') return 0; let n = 0;
    for (const id of Object.keys(o)) { try { if (!(await imgHas(id))) { await imgPut(id, dataToBlob(o[id])); n++; } } catch (e) {} }
    return n;
  }
  async function removeBook(bookId) {
    const L = notes(); const gone = L.filter(n => n.book === bookId);
    for (const n of gone) if (n.img) await imgDel(n.img);
    H().db().notes = L.filter(n => n.book !== bookId);
  }

  window.MA_NOTES = { page, countOf, imgIds, imgGet, imgPut, imgHas, exportImgs, importImgs, removeBook, _test: { render, textOf } };
})();
