/* مکتبۃ العزیز — کتب کی تفصیل بھیجنا (واٹس ایپ، پوسٹر، PDF)
   app.js سے window.MA_SHARE کے ذریعے ڈیٹا ملتا ہے۔ کوئی باہر کی لائبریری نہیں — آف لائن بھی چلتا ہے۔ */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  const norm = t => String(t || '').replace(/[ً-ٰٟـ]/g, '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ةۃه]/g, 'ہ').replace(/\s+/g, ' ').trim().toLowerCase();

  let sel = new Set();
  let open = new Set();
  let opts = { price: true, details: true };
  let q = '';
  let mode = 'books';      // 'books' یا 'loans' (پڑھنے کے لیے گئی کتب)
  let subtitle = '';       // رپورٹ کا عنوان، مثلاً «مصنف: …»
  const dmy = iso => { if (!iso) return '—'; const [y, m, d] = String(iso).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
  const daysSince = iso => iso ? Math.max(0, Math.floor((Date.now() - new Date(String(iso).slice(0, 10) + 'T00:00:00').getTime()) / 864e5)) : 0;

  function api() { return window.MA_SHARE; }
  function toast(m) { api().toast(m); }

  // ---------- انتخاب کا خانہ ----------
  function openShare(pre = {}) {
    const { books, cats } = api().data();
    open = new Set();
    mode = pre.mode === 'loans' ? 'loans' : 'books';
    subtitle = pre.title || '';
    sel = new Set(pre.books || []);
    if (mode === 'loans') books.filter(b => b.loan).forEach(b => { sel.add(b.id); open.add(b.cat); });
    if (pre.cat) { books.filter(b => b.cat === pre.cat).forEach(b => sel.add(b.id)); open.add(pre.cat); }
    if (pre.books && pre.books.length) books.filter(b => sel.has(b.id)).forEach(b => open.add(b.cat));
    q = '';
    document.getElementById('shareSheet')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'shareSheet';
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = `
      <div class="sheet share" role="dialog" aria-modal="true" aria-labelledby="sh-t">
        <div class="sheet-h">
          <h2 id="sh-t">${mode === 'loans' ? 'پڑھنے کے لیے گئی کتب' : subtitle ? esc(subtitle) : 'کتب کی تفصیل بھیجیں'}</h2>
          <button type="button" class="x" id="shClose" aria-label="بند کریں">✕</button>
        </div>
        <div class="sh-top">
          <input id="shQ" type="search" placeholder="کتاب، مصنف، مکتبہ یا فن…" aria-label="فہرست میں تلاش" autocomplete="off">
          <div class="sh-opts">
            <label class="tick"><input type="checkbox" id="shAll"><span>سب منتخب</span></label>
            <label class="tick" ${mode === 'loans' ? 'hidden' : ''}><input type="checkbox" id="shPrice" ${opts.price ? 'checked' : ''}><span>قیمت</span></label>
            <label class="tick" ${mode === 'loans' ? 'hidden' : ''}><input type="checkbox" id="shDet" ${opts.details ? 'checked' : ''}><span>مصنف و مکتبہ</span></label>
            <b class="sh-count" id="shCount"></b>
          </div>
        </div>
        <div class="sh-list" id="shList"></div>
        <div class="sh-actions">
          <button type="button" class="sa wa" data-out="wa"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>واٹس ایپ</button>
          <button type="button" class="sa" data-out="img"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>پوسٹر</button>
          <button type="button" class="sa" data-out="pdf"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 14h8M8 17h5"/></svg>PDF</button>
          <button type="button" class="sa" data-out="copy"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>کاپی</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('noscroll');

    const close = () => { wrap.remove(); document.body.classList.remove('noscroll'); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    $('shClose').addEventListener('click', close);
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    $('shQ').addEventListener('input', e => { q = e.target.value; renderList(); });
    $('shPrice').addEventListener('change', e => { opts.price = e.target.checked; });
    $('shDet').addEventListener('change', e => { opts.details = e.target.checked; });
    $('shAll').addEventListener('change', e => {
      const vis = visibleBooks();
      vis.forEach(b => e.target.checked ? sel.add(b.id) : sel.delete(b.id));
      renderList();
    });
    $('shList').addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.cat) {
        const vis = visibleBooks().filter(b => b.cat === t.dataset.cat);
        vis.forEach(b => t.checked ? sel.add(b.id) : sel.delete(b.id));
        renderList();
      } else if (t.dataset.book) {
        t.checked ? sel.add(t.dataset.book) : sel.delete(t.dataset.book);
        renderList();
      }
    });
    $('shList').addEventListener('click', e => {
      const t = e.target.closest('[data-exp]'); if (!t) return;
      const c = t.dataset.exp; open.has(c) ? open.delete(c) : open.add(c); renderList();
    });
    wrap.querySelector('.sh-actions').addEventListener('click', e => {
      const t = e.target.closest('[data-out]'); if (!t) return;
      output(t.dataset.out, t);
    });
    renderList();
  }

  function visibleBooks() {
    const { books: all, cats } = api().data();
    const books = mode === 'loans' ? all.filter(b => b.loan) : all;
    const words = norm(q).split(' ').filter(Boolean);
    if (!words.length) return books;
    return books.filter(b => {
      const hay = norm([b.name, b.author, b.publisher, cats.find(c => c.id === b.cat)?.name, b.loan?.name, b.loan?.phone].join(' '));
      return words.every(w => hay.includes(w));
    });
  }

  function renderList() {
    const { cats } = api().data();
    const vis = visibleBooks();
    const searching = !!norm(q);
    const html = cats.map(c => {
      const list = vis.filter(b => b.cat === c.id);
      if (!list.length) return '';
      const n = list.filter(b => sel.has(b.id)).length;
      const isOpen = open.has(c.id) || searching;
      return `<div class="sh-cat${isOpen ? ' open' : ''}">
        <div class="sh-cat-h">
          <label class="tick big"><input type="checkbox" data-cat="${c.id}" ${n === list.length ? 'checked' : ''} ${n && n < list.length ? 'data-mixed="1"' : ''}><span>${esc(c.name)}</span></label>
          <span class="sh-n" dir="ltr">${n ? `${fmt(n)} / ` : ''}${fmt(list.length)}</span>
          <button type="button" class="sh-exp" data-exp="${c.id}" aria-expanded="${isOpen}" aria-label="کتب دکھائیں">${isOpen ? '▴' : '▾'}</button>
        </div>
        ${isOpen ? `<div class="sh-books">${list.map(b => `
          <label class="tick sh-book"><input type="checkbox" data-book="${b.id}" ${sel.has(b.id) ? 'checked' : ''}>
            <span><b>${esc(b.name)}</b>${mode === 'loans' && b.loan ? `<small>${esc(b.loan.name)}${b.loan.phone ? ' · ' + esc(b.loan.phone) : ''}</small>` : b.author ? `<small>${esc(b.author)}</small>` : ''}</span></label>`).join('')}</div>` : ''}
      </div>`;
    }).join('');
    $('shList').innerHTML = html || `<p class="sh-empty">${searching ? 'تلاش سے کوئی کتاب نہیں ملی' : 'ابھی کوئی کتاب درج نہیں'}</p>`;
    $('shList').querySelectorAll('[data-mixed]').forEach(i => { i.indeterminate = true; });
    const allSel = vis.length && vis.every(b => sel.has(b.id));
    $('shAll').checked = !!allSel;
    $('shAll').indeterminate = !allSel && vis.some(b => sel.has(b.id));
    $('shCount').textContent = sel.size ? `منتخب: ${fmt(sel.size)}` : 'کوئی کتاب منتخب نہیں';
    document.querySelectorAll('#shareSheet .sa').forEach(b => { b.disabled = !sel.size; });
  }

  // ---------- منتخب کتب، فن وار ----------
  function grouped() {
    const { books, cats } = api().data();
    return cats.map(c => ({ cat: c, list: books.filter(b => b.cat === c.id && sel.has(b.id)) })).filter(g => g.list.length);
  }
  const today = () => new Date().toLocaleDateString('en-GB');

  // ---------- واٹس ایپ / کاپی کا متن ----------
  function buildText() {
    const g = grouped();
    const all = g.flatMap(x => x.list);
    let t = `*${BN()}*\n${headLine()}\nتاریخ: ${today()}\n`;
    if (mode === 'loans') {
      g.forEach(({ cat, list }) => {
        t += `\n*${cat.name}* (${fmt(list.length)})\n`;
        list.forEach((b, i) => {
          const L = b.loan || {};
          t += `${i + 1}. ${b.name} — ${L.name || '—'}${L.phone ? ' — ' + L.phone : ''} — ${dmy(L.date)} (${daysSince(L.date)} دن)\n`;
        });
      });
      t += `\n*کل:* ${fmt(all.length)} کتب پڑھنے کے لیے گئی ہوئی ہیں`;
      return t;
    }
    g.forEach(({ cat, list }) => {
      t += `\n*${cat.name}* (${fmt(list.length)})\n`;
      list.forEach((b, i) => {
        const parts = [b.name];
        if (opts.details) { if (b.author) parts.push(b.author); if (b.publisher) parts.push(b.publisher); }
        parts.push(`اجزاء ${fmt(b.parts)}`);
        if (opts.price) parts.push(`Rs ${fmt(b.price)}`);
        t += `${i + 1}. ${parts.join(' — ')}\n`;
      });
    });
    t += `\n*کل:* ${fmt(all.length)} کتب، ${fmt(all.reduce((s, b) => s + (+b.parts || 0), 0))} اجزاء`;
    if (opts.price) t += `، کل قیمت Rs ${fmt(all.reduce((s, b) => s + (+b.price || 0), 0))}`;
    return t;
  }

  // ---------- رپورٹ کینوس پر ----------
  const FONT = '"Digits","JNN","Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif';
  const TFONT = '"JNN Kasheeda","Jameel Noori Nastaleeq Kasheeda","JNN",serif';
  const W = 1240, M = 50;   // A4 چوڑائی @150dpi
  const C = { green: '#14463a', green2: '#1f6a54', gold: '#c8962f', gold2: '#e8c467', cream: '#fffaf0', line: '#e4d6b0', fg: '#2b2620', muted: '#7d7262', alt: '#f8f2e2' };

  // مکتبے کی پہچان (brand.js)
  const BR = () => window.MA_BRAND;
  const BN = () => BR() ? BR().name() : 'مکتبۃ العزیز';
  const BP = () => BR() ? BR().place() : '';
  const BK = () => BR() ? BR().kasheeda(BR().get().name) : true;
  const BF = () => BR() ? BR().titleFont(BR().get().name) : TFONT;
  function headLine() {
    const pl = BP() ? ` — ${BP()}` : '';
    if (mode === 'loans') return `پڑھنے کے لیے گئی کتب${pl}`;
    if (subtitle) return `فہرستِ کتب (${subtitle})${pl}`;
    return `تفصیلی فہرستِ کتب${pl}`;
  }
  function cols() {
    const c = [{ k: 'n', w: 70, t: 'نمبر' }, { k: 'name', w: 0, t: 'کتاب کا نام' }];
    if (mode === 'loans') {
      c.push({ k: 'lname', w: 230, t: 'لینے والا' }, { k: 'lphone', w: 190, t: 'موبائل' }, { k: 'ldate', w: 150, t: 'تاریخ' }, { k: 'ldays', w: 90, t: 'دن' });
      c[1].w = W - 2 * M - c.reduce((s, x) => s + x.w, 0);
      let x = W - M; c.forEach(col => { col.r = x; x -= col.w; });
      return c;
    }
    if (opts.details) c.push({ k: 'author', w: 250, t: 'مصنف' }, { k: 'publisher', w: 230, t: 'مکتبہ' });
    c.push({ k: 'parts', w: 90, t: 'اجزاء' });
    if (opts.price) c.push({ k: 'price', w: 140, t: 'قیمت (Rs)' });
    const fixed = c.reduce((s, x) => s + x.w, 0);
    c[1].w = W - 2 * M - fixed;
    let x = W - M;
    c.forEach(col => { col.r = x; x -= col.w; });
    return c;
  }

  function fit(ctx, text, w) {
    text = String(text ?? '');
    if (ctx.measureText(text).width <= w) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > w) text = text.slice(0, -1);
    return text + '…';
  }

  // رپورٹ کو حصوں (blocks) میں بانٹیں — ہر حصے کی اونچائی اور ڈرا کرنے کا فنکشن
  function blocks() {
    const g = grouped();
    const all = g.flatMap(x => x.list);
    const cc = cols();
    const out = [];
    const ROW = 62;
    out.push({ h: 230, head: true, draw(ctx, y) {
      const grd = ctx.createLinearGradient(0, y, 0, y + 200);
      grd.addColorStop(0, '#0f3a30'); grd.addColorStop(1, C.green2);
      ctx.fillStyle = grd; roundRect(ctx, M, y + 10, W - 2 * M, 190, 22); ctx.fill();
      ctx.strokeStyle = C.gold2; ctx.lineWidth = 3; roundRect(ctx, M + 10, y + 20, W - 2 * M - 20, 170, 16); ctx.stroke();
      const tg = ctx.createLinearGradient(0, y + 30, 0, y + 120);
      tg.addColorStop(0, '#fff3c4'); tg.addColorStop(.5, '#e2b24e'); tg.addColorStop(1, '#a8741f');
      ctx.fillStyle = tg; ctx.textAlign = 'center'; ctx.font = `${BK() ? 76 : 60}px ${BF()}`;
      ctx.fillText(BN(), W / 2, y + 112);
      ctx.fillStyle = '#f3e6c2'; ctx.font = `30px ${FONT}`;
      ctx.fillText(headLine(), W / 2, y + 168);
      ctx.font = `22px ${FONT}`; ctx.fillStyle = C.muted; ctx.textAlign = 'right';
      ctx.fillText(`تاریخ: ${today()}`, W - M, y + 228);
      ctx.textAlign = 'left'; ctx.fillText(`کل ${fmt(all.length)} کتب`, M, y + 228);
    } });
    g.forEach(({ cat, list }) => {
      out.push({ h: 64 + 50, keep: 2, draw(ctx, y) {
        ctx.fillStyle = C.green; roundRect(ctx, M, y + 14, W - 2 * M, 48, 12); ctx.fill();
        ctx.fillStyle = C.gold2; ctx.font = `32px ${FONT}`; ctx.textAlign = 'right';
        ctx.fillText(cat.name, W - M - 20, y + 50);
        ctx.textAlign = 'left'; ctx.font = `24px ${FONT}`; ctx.fillStyle = '#f3e6c2';
        ctx.fillText(`${fmt(list.length)} کتب`, M + 20, y + 48);
        // جدول کا سر
        ctx.fillStyle = '#efe2bf'; ctx.fillRect(M, y + 66, W - 2 * M, 46);
        ctx.fillStyle = C.green; ctx.font = `22px ${FONT}`;
        cc.forEach(col => { ctx.textAlign = 'right'; ctx.fillText(col.t, col.r - 12, y + 98); });
      } });
      list.forEach((b, i) => {
        out.push({ h: ROW, draw(ctx, y) {
          if (i % 2) { ctx.fillStyle = C.alt; ctx.fillRect(M, y, W - 2 * M, ROW); }
          ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M, y + ROW - .5); ctx.lineTo(W - M, y + ROW - .5); ctx.stroke();
          cc.forEach(col => {
            const L = b.loan || {};
            let v = col.k === 'n' ? i + 1 : col.k === 'parts' ? fmt(b.parts) : col.k === 'price' ? fmt(b.price)
              : col.k === 'lname' ? (L.name || '—') : col.k === 'lphone' ? (L.phone || '—') : col.k === 'ldate' ? dmy(L.date) : col.k === 'ldays' ? daysSince(L.date)
              : (b[col.k] || '—');
            ctx.font = `${col.k === 'name' ? 27 : 23}px ${FONT}`;
            ctx.fillStyle = col.k === 'name' ? C.fg : col.k === 'n' ? C.muted : '#4a4339';
            ctx.textAlign = 'right';
            ctx.fillText(fit(ctx, v, col.w - 24), col.r - 12, y + 41);
          });
        } });
      });
    });
    out.push({ h: 110, draw(ctx, y) {
      ctx.fillStyle = C.cream; ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
      roundRect(ctx, M, y + 24, W - 2 * M, 70, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.green; ctx.font = `28px ${FONT}`; ctx.textAlign = 'right';
      let t = `کل: ${fmt(all.length)} کتب   ·   ${fmt(all.reduce((s, b) => s + (+b.parts || 0), 0))} اجزاء`;
      if (opts.price && mode !== 'loans') t += `   ·   کل قیمت Rs ${fmt(all.reduce((s, b) => s + (+b.price || 0), 0))}`;
      if (mode === 'loans') t = `کل: ${fmt(all.length)} کتب پڑھنے کے لیے گئی ہوئی ہیں`;
      ctx.fillText(t, W - M - 24, y + 70);
    } });
    return out;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function newCanvas(h) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = h;
    const ctx = cv.getContext('2d'); ctx.direction = 'rtl';
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, h);
    return [cv, ctx];
  }
  async function ready() {
    try {
      await Promise.all([document.fonts.load(`30px ${FONT}`, 'کتاب 123'), document.fonts.load(`76px ${BF()}`, BN())]);
      await document.fonts.ready;
    } catch (e) {}
  }

  // پوسٹر: ایک لمبی تصویر
  async function poster() {
    await ready();
    const bl = blocks();
    const H = bl.reduce((s, b) => s + b.h, 0) + 40;
    if (H > 30000) throw new Error('long');
    const [cv, ctx] = newCanvas(H);
    // ہلکا سنہری حاشیہ
    let y = 10;
    bl.forEach(b => { b.draw(ctx, y); y += b.h; });
    ctx.strokeStyle = C.gold2; ctx.lineWidth = 6; ctx.strokeRect(12, 12, W - 24, H - 24);
    return new Promise(res => cv.toBlob(res, 'image/png'));
  }

  // PDF: A4 صفحات
  async function pdf() {
    await ready();
    const bl = blocks();
    const PH = 1754, TOP = 40, BOT = 80;
    const pages = [];
    let cur = [], y = TOP;
    bl.forEach((b, i) => {
      const need = b.keep ? b.h + 62 * b.keep : b.h;
      if (y + need > PH - BOT && cur.length) { pages.push(cur); cur = []; y = TOP; }
      cur.push(b); y += b.h;
    });
    if (cur.length) pages.push(cur);
    const jpgs = pages.map((pg, i) => {
      const [cv, ctx] = newCanvas(PH);
      let yy = TOP;
      pg.forEach(b => { b.draw(ctx, yy); yy += b.h; });
      ctx.fillStyle = C.muted; ctx.font = `20px ${FONT}`; ctx.textAlign = 'center';
      ctx.fillText(`${BN()} — صفحہ ${i + 1} / ${pages.length}`, W / 2, PH - 36);
      return cv.toDataURL('image/jpeg', 0.9);
    });
    return makePdf(jpgs, W, PH);
  }

  // سادہ PDF بنانے والا — ہر صفحے پر ایک JPEG تصویر
  function makePdf(jpgs, w, h) {
    const enc = new TextEncoder();
    const chunks = []; let len = 0; const offs = [];
    const push = d => { const b = typeof d === 'string' ? enc.encode(d) : d; chunks.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
    const PW = 595.28, PHt = PW * h / w;
    const n = jpgs.length;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    const kids = []; for (let i = 0; i < n; i++) kids.push(`${3 + i * 3} 0 R`);
    obj(2, () => push(`<< /Type /Pages /Count ${n} /Kids [${kids.join(' ')}] >>`));
    jpgs.forEach((d, i) => {
      const p = 3 + i * 3, c = p + 1, im = p + 2;
      const bin = atob(d.split(',')[1]); const bytes = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
      obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PHt.toFixed(2)}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${c} 0 R >>`));
      const cs = `q ${PW} 0 0 ${PHt.toFixed(2)} 0 0 cm /Im${i} Do Q`;
      obj(c, () => { push(`<< /Length ${cs.length} >>\nstream\n`); push(cs); push('\nendstream'); });
      obj(im, () => { push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`); push(bytes); push('\nendstream'); });
    });
    const total = 3 + n * 3;
    const xref = len;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(x);
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks, { type: 'application/pdf' });
  }

  // ---------- شیئر یا ڈاؤن لوڈ ----------
  async function deliver(blob, name, title) {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title, text: title }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('فائل ڈاؤن لوڈ ہو گئی — اب واٹس ایپ میں بھیج دیں');
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      ta.remove(); return ok;
    }
  }

  async function output(kind, btn) {
    if (!sel.size) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const old = btn.innerHTML;
    btn.disabled = true;
    try {
      if (kind === 'wa') {
        const t = buildText();
        if (t.length <= 3500) { location.href = 'https://wa.me/?text=' + encodeURIComponent(t); }
        else if (navigator.share) { await navigator.share({ text: t }).catch(() => {}); }
        else { await copyText(t); toast('فہرست لمبی ہے، اس لیے کاپی ہو گئی — واٹس ایپ میں پیسٹ کریں'); }
      } else if (kind === 'copy') {
        toast(await copyText(buildText()) ? 'فہرست کاپی ہو گئی' : 'کاپی نہیں ہو سکی');
      } else if (kind === 'img') {
        btn.textContent = 'بن رہا ہے…';
        await deliver(await poster(), `maktaba-aziz-${mode === "loans" ? "loans-" : ""}${stamp}.png`, `${BN()} — فہرستِ کتب`);
      } else if (kind === 'pdf') {
        btn.textContent = 'بن رہا ہے…';
        await deliver(await pdf(), `maktaba-aziz-${mode === "loans" ? "loans-" : ""}${stamp}.pdf`, `${BN()} — فہرستِ کتب`);
      }
    } catch (e) {
      console.warn(e);
      toast(e.message === 'long' ? 'پوسٹر کے لیے فہرست بہت لمبی ہے — PDF بنائیں' : 'فائل نہیں بن سکی، دوبارہ کوشش کریں');
    } finally {
      btn.innerHTML = old; btn.disabled = !sel.size;
    }
  }

  window.MA_SHARE_UI = { open: openShare, kit: { makePdf, deliver, roundRect, ready, copyText, fit, FONT, TFONT }, _test: { buildText, poster, pdf, select: ids => { ids.forEach(i => sel.add(i)); } } };
})();
