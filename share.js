/* میرا مکتبہ — کتب کی تفصیل بھیجنا (واٹس ایپ، پوسٹر، PDF)
   app.js سے window.MA_SHARE کے ذریعے ڈیٹا ملتا ہے۔ کوئی باہر کی لائبریری نہیں — آف لائن بھی چلتا ہے۔ */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  const norm = t => String(t || '').replace(/[ً-ٰٟـ]/g, '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ةۃه]/g, 'ہ').replace(/\s+/g, ' ').trim().toLowerCase();

  let sel = new Set();
  let open = new Set();
  let opts = { price: true, details: true, cols: (() => { try { return Number(localStorage.getItem('maktaba-aziz-pdf-cols')) || 1; } catch (e) { return 1; } })() };
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
          <input id="shQ" type="search" placeholder="کتاب، مصنف، ناشر یا فن…" aria-label="فہرست میں تلاش" autocomplete="off">
          <div class="sh-opts">
            <label class="tick"><input type="checkbox" id="shAll"><span>سب منتخب</span></label>
            <label class="tick" ${mode === 'loans' ? 'hidden' : ''}><input type="checkbox" id="shPrice" ${opts.price ? 'checked' : ''}><span>قیمت</span></label>
            <label class="tick" ${mode === 'loans' ? 'hidden' : ''}><input type="checkbox" id="shDet" ${opts.details ? 'checked' : ''}><span>مصنف و ناشر</span></label>
            <span class="sh-cols" role="group" aria-label="PDF میں کالم"><span>PDF کالم</span>${[1, 2, 3, 4].map(n => `<button type="button" data-pcols="${n}" class="${opts.cols === n ? 'on' : ''}">${n}</button>`).join('')}</span>
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
    wrap.querySelector('.sh-cols').addEventListener('click', e => {
      const b = e.target.closest('[data-pcols]'); if (!b) return;
      opts.cols = Number(b.dataset.pcols); try { localStorage.setItem('maktaba-aziz-pdf-cols', opts.cols); } catch (err) {}
      wrap.querySelectorAll('.sh-cols [data-pcols]').forEach(x => x.classList.toggle('on', x === b));
    });
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
    let t = `${brandText()}\n*${headLine()}*\nتاریخ: ${today()}\n`;
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
        if (opts.price && +b.price) parts.push(`Rs ${fmt(b.price)}`);
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
  const W = 1240, M = 80;   // A4 چوڑائی @150dpi (M: صفحے کے فریم کے اندر کا حاشیہ)
  const C = { green: '#14463a', green2: '#1f6a54', gold: '#c8962f', gold2: '#e8c467', cream: '#fffaf0', line: '#e4d6b0', fg: '#2b2620', muted: '#7d7262', alt: '#f8f2e2' };

  // مکتبے کی پہچان (brand.js)
  const BR = () => window.MA_BRAND;
  const BN = () => BR() ? BR().name() : 'میرا مکتبہ';
  const BP = () => BR() ? BR().place() : '';
  const BK = () => BR() ? BR().kasheeda(BR().get().name) : true;
  const BF = () => BR() ? BR().titleFont(BR().get().name) : TFONT;
  function headLine() {
    if (mode === 'loans') return 'پڑھنے کے لیے گئی کتب';
    if (subtitle) return `فہرستِ کتب (${subtitle})`;
    return 'تفصیلی فہرستِ کتب';
  }
  // ---------- لیٹر ہیڈ: ہر بھیجی جانے والی فہرست / رپورٹ کے اوپر مکتبے کی پہچان ----------
  const BG = () => (BR() ? BR().get() : {});
  const bLines = () => { const b = BG(); return { l1: (b.line1 || '').trim(), l2: [b.line2, b.line3].map(x => (x || '').trim()).filter(Boolean).join(' · '), addr: (b.address || '').trim(), phone: (b.phone || '').trim() }; };
  function brandText() {
    const L = bLines();
    return [`*${BN()}*`, L.l1, L.l2, L.addr ? `📍 ${L.addr}` : '', L.phone ? `📞 ${L.phone}` : '', '━━━━━━━━━━━━'].filter(Boolean).join('\n');
  }
  let logoImg = null, logoFor = '';
  function loadLogo() {
    const src = BR() ? BR().logoSrc() : '';
    if (!src) { logoImg = null; logoFor = ''; return Promise.resolve(); }
    if (src === logoFor && logoImg) return Promise.resolve();
    return new Promise(res => {
      const im = new Image();
      im.onload = () => { logoImg = im; logoFor = src; res(); };
      im.onerror = () => { logoImg = null; logoFor = ''; res(); };
      im.src = src;
    });
  }
  // لیٹر ہیڈ کی اونچائی
  function letterH() {
    const L = bLines();
    let h = 20 + 100;                       // نام
    if (L.l1) h += 50;
    if (L.l2) h += 42;
    if (L.addr || L.phone) h += 84;          // نیچے کی پٹی
    else h += 16;
    return Math.max(h, logoImg ? 210 : 0) + 20;
  }
  // لیٹر ہیڈ بنائیں — y سے شروع، مکمل چوڑائی
  function letterDraw(ctx, y, colors) {
    const c1 = (colors && colors[0]) || '#0f3a30', c2 = (colors && colors[1]) || C.green2;
    const L = bLines(), H = letterH() - 20;
    const band = (L.addr || L.phone) ? 62 : 0;
    const x0 = M, w0 = W - 2 * M, top = y + 10;
    const grd = ctx.createLinearGradient(0, top, 0, top + H);
    grd.addColorStop(0, c1); grd.addColorStop(1, c2);
    ctx.fillStyle = grd; roundRect(ctx, x0, top, w0, H, 22); ctx.fill();
    ctx.strokeStyle = C.gold2; ctx.lineWidth = 3; roundRect(ctx, x0 + 10, top + 10, w0 - 20, H - 20, 16); ctx.stroke();
    // لوگو — دائیں طرف گول دائرے میں
    let cx = W / 2, avail = w0 - 80;
    if (logoImg) {
      const D = 150, lx = W - M - 40 - D, ly = top + (H - band - D) / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(lx + D / 2, ly + D / 2, D / 2 + 6, 0, Math.PI * 2); ctx.fillStyle = C.gold2; ctx.fill();
      ctx.beginPath(); ctx.arc(lx + D / 2, ly + D / 2, D / 2, 0, Math.PI * 2); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.clip();
      const r = Math.min(D / logoImg.width, D / logoImg.height) * (BG().round === '1' ? 1 : .92), iw = logoImg.width * r, ih = logoImg.height * r;
      ctx.drawImage(logoImg, lx + (D - iw) / 2, ly + (D - ih) / 2, iw, ih);
      ctx.restore();
      // بائیں طرف بھی اتنی جگہ چھوڑیں تاکہ عبارت بیچ میں رہے
      avail = w0 - 2 * (D + 60);
    }
    ctx.textAlign = 'center';
    let ty = top + 98;
    const tg = ctx.createLinearGradient(0, ty - 70, 0, ty + 10);
    tg.addColorStop(0, '#fff3c4'); tg.addColorStop(.5, '#e2b24e'); tg.addColorStop(1, '#a8741f');
    ctx.fillStyle = tg; let fs = BK() ? 80 : 64;
    ctx.font = `${fs}px ${BF()}`;
    while (fs > 40 && ctx.measureText(BN()).width > avail) { fs -= 4; ctx.font = `${fs}px ${BF()}`; }
    ctx.fillText(BN(), cx, ty);
    if (L.l1) { ty += 50; ctx.fillStyle = '#ffe08a'; ctx.font = `34px ${FONT}`; ctx.fillText(fit(ctx, L.l1, avail), cx, ty); }
    if (L.l2) { ty += 42; ctx.fillStyle = '#f3e6c2'; ctx.font = `26px ${FONT}`; ctx.fillText(fit(ctx, L.l2, avail), cx, ty); }
    if (band) {
      const by = top + H - band - 22;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; roundRect(ctx, x0 + 24, by, w0 - 48, band, 14); ctx.fill();
      ctx.font = `26px ${FONT}`; ctx.fillStyle = '#fff1c1';
      const t = [L.addr ? `پتہ: ${L.addr}` : '', L.phone ? `موبائل: \u2066${L.phone}\u2069` : ''].filter(Boolean).join('     |     ');
      ctx.fillText(fit(ctx, t, w0 - 60), W / 2, by + 41);
    }
  }
  // لیٹر ہیڈ کے نیچے فہرست کا عنوان، تاریخ اور تعداد
  function titleDraw(ctx, y, title, right, left) {
    ctx.textAlign = 'center'; ctx.fillStyle = C.green; ctx.font = `34px ${FONT}`;
    ctx.fillText(fit(ctx, title, W - 2 * M - 40), W / 2, y + 46);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 200, y + 66); ctx.lineTo(W / 2 + 200, y + 66); ctx.stroke();
    ctx.font = `22px ${FONT}`; ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText(right, W - M, y + 100);
    ctx.textAlign = 'left'; ctx.fillText(left, M, y + 100);
  }
  function cols() {
    const c = [{ k: 'n', w: 70, t: 'نمبر' }, { k: 'name', w: 0, t: 'کتاب کا نام' }];
    if (mode === 'loans') {
      c.push({ k: 'lname', w: 230, t: 'لینے والا' }, { k: 'lphone', w: 190, t: 'موبائل' }, { k: 'ldate', w: 150, t: 'تاریخ' }, { k: 'ldays', w: 90, t: 'دن' });
      c[1].w = W - 2 * M - c.reduce((s, x) => s + x.w, 0);
      let x = W - M; c.forEach(col => { col.r = x; x -= col.w; });
      return c;
    }
    if (opts.details) c.push({ k: 'author', w: 250, t: 'مصنف' }, { k: 'publisher', w: 230, t: 'ناشر' });
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
    out.push({ h: letterH(), head: true, draw(ctx, y) { letterDraw(ctx, y); } });
    out.push({ h: 116, draw(ctx, y) { titleDraw(ctx, y, headLine(), `تاریخ: ${today()}`, `کل ${fmt(all.length)} کتب`); } });
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
            let v = col.k === 'n' ? i + 1 : col.k === 'parts' ? fmt(b.parts) : col.k === 'price' ? (+b.price ? fmt(b.price) : '—')
              : col.k === 'lname' ? (L.name || '—') : col.k === 'lphone' ? (L.phone ? `\u2066${L.phone}\u2069` : '—') : col.k === 'ldate' ? dmy(L.date) : col.k === 'ldays' ? daysSince(L.date)
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
      await Promise.all([document.fonts.load(`30px ${FONT}`, 'کتاب 123'), document.fonts.load(`76px ${BF()}`, BN()), loadLogo()]);
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

  // ---------- A4 صفحہ: باہر ہلکا گہرا رنگ، اندر سفید، گول کونوں والا سنہری فریم ----------
  const PH = 1754, TOP = 74, BOT = 118;
  function framePage(ctx) {
    ctx.save();
    ctx.fillStyle = '#ddd0ab'; ctx.fillRect(0, 0, W, PH);
    const g = ctx.createRadialGradient(W / 2, PH / 2, 200, W / 2, PH / 2, 1100);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(90,70,20,.18)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, PH);
    ctx.shadowColor = 'rgba(60,40,0,.28)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff'; roundRect(ctx, 34, 34, W - 68, PH - 68, 36); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = C.gold; ctx.lineWidth = 4; roundRect(ctx, 34, 34, W - 68, PH - 68, 36); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,150,47,.45)'; ctx.lineWidth = 1.5; roundRect(ctx, 46, 46, W - 92, PH - 92, 28); ctx.stroke();
    ctx.restore();
  }
  function footDraw(ctx, text, i, n) {
    ctx.save();
    ctx.strokeStyle = 'rgba(200,150,47,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(M, PH - BOT + 22); ctx.lineTo(W - M, PH - BOT + 22); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = `20px ${FONT}`; ctx.textAlign = 'center'; ctx.direction = 'rtl';
    ctx.fillText(`${text}${n > 1 ? `  —  صفحہ ${i + 1} / ${n}` : ''}`, W / 2, PH - BOT + 62);
    ctx.restore();
  }
  // بلاکس کو صفحوں میں بانٹیں: کوئی سطر بیچ سے نہ کٹے؛ جدول اگلے صفحے پر جائے تو سر دوبارہ
  function paginate(blocks, repeatHead) {
    const pages = []; let cur = [], y = TOP, lastHead = null;
    for (const b of blocks) {
      if (b.head) lastHead = b;
      if (b.page && cur.length) { pages.push(cur); cur = []; y = TOP; }
      const need = b.h + (b.keep || 0);
      if (y + need > PH - BOT && cur.length) {
        pages.push(cur); cur = []; y = TOP;
        const rh = b.tbl && (repeatHead || lastHead);
        if (rh) { cur.push(rh); y += rh.h; }
      }
      cur.push(b); y += b.h;
    }
    if (cur.length) pages.push(cur);
    return pages;
  }
  function renderPages(pages, footText) {
    return pages.map((pg, i) => {
      const [cv, ctx] = newCanvas(PH); framePage(ctx);
      let yy = TOP; pg.forEach(b => { b.draw(ctx, yy); yy += b.h; });
      footDraw(ctx, footText, i, pages.length);
      return cv.toDataURL('image/jpeg', 0.9);
    });
  }
  // متن کو دی گئی چوڑائی میں سطروں میں توڑیں (کچھ نہ کٹے)
  function wrap(ctx, text, w) {
    const out = [];
    String(text ?? '').split(/\n/).forEach(par => {
      let line = '';
      par.split(/[ \t]+/).filter(Boolean).forEach(word => {
        while (ctx.measureText(word).width > w && word.length > 1) {   // بہت لمبا لفظ
          let k = word.length; while (k > 1 && ctx.measureText(word.slice(0, k)).width > w) k--;
          if (line) { out.push(line); line = ''; }
          out.push(word.slice(0, k)); word = word.slice(k);
        }
        const t = line ? line + ' ' + word : word;
        if (ctx.measureText(t).width <= w || !line) line = t; else { out.push(line); line = word; }
      });
      out.push(line);
    });
    return out.filter((l, i) => l || i === 0);
  }

  // PDF: A4 صفحات — 1 سے 4 کالم، ہر صفحہ فریم کے اندر
  async function pdf() {
    await ready();
    const N = Math.min(4, Math.max(1, opts.cols || 1));
    const g = grouped(), all = g.flatMap(x => x.list);
    const meas = newCanvas(10)[1];
    const S = [null, { f: 26, s: 21 }, { f: 22, s: 18 }, { f: 19, s: 16 }, { f: 17, s: 14.5 }][N];
    const LH = f => Math.round(f * 1.72);
    const GAP = 22, CW = (W - 2 * M - GAP * (N - 1)) / N;
    const pages = [];   // ہر صفحہ: [{draw(ctx)}]
    let page, col, y, y0, colBottom;
    const yMax = PH - BOT;
    const contH = 78;
    const newPage = first => {
      page = []; pages.push(page); col = 0;
      if (first) {
        const lh = letterH();
        page.push(ctx => { letterDraw(ctx, TOP); titleDraw(ctx, TOP + lh, headLine(), `تاریخ: ${today()}`, `کل ${fmt(all.length)} کتب`); });
        y0 = TOP + lh + 116;
      } else {
        page.push(ctx => {
          ctx.textAlign = 'right'; ctx.fillStyle = C.green; ctx.font = `30px ${BF()}`; ctx.fillText(fit(ctx, BN(), 520), W - M, TOP + 40);
          ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.font = `21px ${FONT}`; ctx.fillText(fit(ctx, `${headLine()} — جاری`, 480), M, TOP + 38);
          ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, TOP + 60); ctx.lineTo(W - M, TOP + 60); ctx.stroke();
        });
        y0 = TOP + contH;
      }
      y = y0; colBottom = y0;
    };
    const colX = () => W - M - col * (CW + GAP) - CW;   // دائیں سے پہلا کالم
    const nextCol = () => { colBottom = Math.max(colBottom, y); col++; if (col >= N) newPage(false); else y = y0; };
    const place = (h, draw) => { const x = colX(), yy = y; page.push(ctx => draw(ctx, x, yy, CW)); y += h; colBottom = Math.max(colBottom, y); };

    // جدول کے کالم (صرف 1 کالم والی ترتیب)
    const tcols = (() => {
      const c = [{ k: 'n', w: 70, t: 'نمبر' }, { k: 'name', w: 0, t: 'کتاب کا نام' }];
      if (mode === 'loans') c.push({ k: 'lname', w: 240, t: 'لینے والا' }, { k: 'lphone', w: 190, t: 'موبائل' }, { k: 'ldate', w: 150, t: 'تاریخ' }, { k: 'ldays', w: 80, t: 'دن' });
      else { if (opts.details) c.push({ k: 'author', w: 230, t: 'مصنف' }, { k: 'publisher', w: 210, t: 'ناشر' }); c.push({ k: 'parts', w: 90, t: 'اجزاء' }); if (opts.price) c.push({ k: 'price', w: 130, t: 'قیمت (Rs)' }); }
      c[1].w = CW - c.reduce((s2, x) => s2 + x.w, 0);
      return c;
    })();
    const cellVal = (b, k, i) => {
      const L = b.loan || {};
      return k === 'n' ? String(i + 1) : k === 'parts' ? fmt(b.parts) : k === 'price' ? (+b.price ? fmt(b.price) : '—')
        : k === 'lname' ? (L.name || '—') : k === 'lphone' ? (L.phone ? `⁦${L.phone}⁩` : '—') : k === 'ldate' ? dmy(L.date) : k === 'ldays' ? String(daysSince(L.date))
        : (b[k] || '—');
    };
    const detailTxt = b => {
      if (mode === 'loans') { const L = b.loan || {}; return [L.name || '—', L.phone ? `⁦${L.phone}⁩` : '', `${dmy(L.date)} (${daysSince(L.date)} دن)`].filter(Boolean).join(' · '); }
      const d = [];
      if (opts.details) { if (b.author) d.push(b.author); if (b.publisher) d.push(b.publisher); }
      d.push(`اجزاء\u00a0${fmt(b.parts)}`);
      if (opts.price && +b.price) d.push(`Rs\u00a0${fmt(b.price)}`);
      return d.join(' · ');
    };
    // ایک کتاب کی سطر: اونچائی ناپیں اور بنائیں
    const rowOf = (b, i) => {
      if (N === 1) {
        const lines = {}; let h = LH(S.f) + 14;
        tcols.forEach(c => { const fs = c.k === 'name' ? S.f : S.s; meas.font = `${fs}px ${FONT}`; lines[c.k] = wrap(meas, cellVal(b, c.k, i), c.w - 22); h = Math.max(h, lines[c.k].length * LH(fs) + 14); });
        return { h, draw(ctx, x, yy, w) {
          if (i % 2) { ctx.fillStyle = C.alt; ctx.fillRect(x, yy, w, h); }
          ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, yy + h - .5); ctx.lineTo(x + w, yy + h - .5); ctx.stroke();
          let r = x + w; ctx.textAlign = 'right';
          tcols.forEach(c => {
            const big = c.k === 'name', fs = big ? S.f : S.s, lh = LH(fs);
            ctx.font = `${fs}px ${FONT}`; ctx.fillStyle = big ? C.fg : c.k === 'n' ? C.muted : '#4a4339';
            lines[c.k].forEach((l, j) => ctx.fillText(l, r - 11, yy + fs + 12 + j * lh));
            r -= c.w;
          });
        } };
      }
      const nw = Math.round(S.f * 2.1), tw = CW - nw - 14;
      meas.font = `${S.f}px ${FONT}`; const nl = wrap(meas, b.name, tw);
      meas.font = `${S.s}px ${FONT}`; const dl = wrap(meas, detailTxt(b), tw);
      const h = nl.length * LH(S.f) + dl.length * LH(S.s) + 12;
      return { h, draw(ctx, x, yy, w) {
        if (i % 2) { ctx.fillStyle = C.alt; ctx.fillRect(x, yy, w, h); }
        ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, yy + h - .5); ctx.lineTo(x + w, yy + h - .5); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = C.green; ctx.font = `${S.s}px ${FONT}`; ctx.fillText(String(i + 1), x + w - nw / 2, yy + S.f + 8);
        ctx.textAlign = 'right'; let ty = yy + S.f + 8;
        ctx.fillStyle = C.fg; ctx.font = `${S.f}px ${FONT}`; nl.forEach(l => { ctx.fillText(l, x + w - nw - 6, ty); ty += LH(S.f); });
        ctx.fillStyle = C.muted; ctx.font = `${S.s}px ${FONT}`; ty += LH(S.s) - LH(S.f) + 2; dl.forEach(l => { ctx.fillText(l, x + w - nw - 6, ty); ty += LH(S.s); });
      } };
    };
    // فن کا سر (جدول کے سر کے ساتھ)
    const headOf = (cat, cnt, cont) => {
      const bh = Math.round(S.f * 2.05), th = N === 1 ? Math.round(S.s * 2.3) : 0, h = bh + th + 10;
      return { h, draw(ctx, x, yy, w) {
        ctx.fillStyle = C.green; roundRect(ctx, x, yy + 6, w, bh, 12); ctx.fill();
        ctx.textAlign = 'right'; ctx.fillStyle = C.gold2; ctx.font = `${S.f + 4}px ${FONT}`;
        ctx.fillText(fit(ctx, cat.name + (cont ? ' (جاری)' : ''), w - 150), x + w - 16, yy + 6 + bh * .7);
        ctx.textAlign = 'left'; ctx.fillStyle = '#f3e6c2'; ctx.font = `${S.s}px ${FONT}`; ctx.fillText(`${fmt(cnt)} کتب`, x + 14, yy + 6 + bh * .68);
        if (th) {
          ctx.fillStyle = '#efe2bf'; ctx.fillRect(x, yy + bh + 8, w, th);
          ctx.fillStyle = C.green; ctx.font = `${S.s}px ${FONT}`; ctx.textAlign = 'right';
          let r = x + w; tcols.forEach(c => { ctx.fillText(c.t, r - 11, yy + bh + 8 + th * .7); r -= c.w; });
        }
      } };
    };

    newPage(true);
    g.forEach(({ cat, list }) => {
      const rows = list.map(rowOf);
      let hd = headOf(cat, list.length, false);
      if (y + hd.h + rows[0].h > yMax) nextCol();
      place(hd.h, hd.draw);
      rows.forEach(r => {
        if (y + r.h > yMax) { nextCol(); const c2 = headOf(cat, list.length, true); place(c2.h, c2.draw); }
        place(r.h, r.draw);
      });
      y += 10;
    });
    // آخر میں کل کا خلاصہ — پوری چوڑائی
    const sumH = 96;
    let sy = Math.max(colBottom, y) + 10;
    if (sy + sumH > yMax) { newPage(false); sy = y0; }
    page.push(ctx => {
      ctx.fillStyle = C.cream; ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
      roundRect(ctx, M, sy + 10, W - 2 * M, 72, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.green; ctx.font = `28px ${FONT}`; ctx.textAlign = 'center';
      let t = `کل: ${fmt(all.length)} کتب   ·   ${fmt(all.reduce((s2, b) => s2 + (+b.parts || 0), 0))} اجزاء`;
      if (opts.price && mode !== 'loans') t += `   ·   کل قیمت Rs ${fmt(all.reduce((s2, b) => s2 + (+b.price || 0), 0))}`;
      if (mode === 'loans') t = `کل: ${fmt(all.length)} کتب پڑھنے کے لیے گئی ہوئی ہیں`;
      ctx.fillText(fit(ctx, t, W - 2 * M - 40), W / 2, sy + 56);
    });
    const jpgs = pages.map((pg, i) => {
      const [cv, ctx] = newCanvas(PH); framePage(ctx); ctx.direction = 'rtl';
      pg.forEach(d => { ctx.save(); d(ctx); ctx.restore(); });
      footDraw(ctx, `${BN()} — ${headLine()}`, i, pages.length);
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
        await deliver(await poster(), `mera-maktaba-${mode === "loans" ? "loans-" : ""}${stamp}.png`, `${BN()} — فہرستِ کتب`);
      } else if (kind === 'pdf') {
        btn.textContent = 'بن رہا ہے…';
        await deliver(await pdf(), `mera-maktaba-${mode === "loans" ? "loans-" : ""}${stamp}.pdf`, `${BN()} — فہرستِ کتب`);
      }
    } catch (e) {
      console.warn(e);
      toast(e.message === 'long' ? 'پوسٹر کے لیے فہرست بہت لمبی ہے — PDF بنائیں' : 'فائل نہیں بن سکی، دوبارہ کوشش کریں');
    } finally {
      btn.innerHTML = old; btn.disabled = !sel.size;
    }
  }

  window.MA_SHARE_UI = { open: openShare, kit: { makePdf, deliver, roundRect, ready, copyText, fit, FONT, TFONT, framePage, footDraw, paginate, renderPages, wrap, PAGE: { W, H: PH, M, TOP, BOT }, brandText, letterH, letterDraw, titleDraw, brandName: BN }, _test: { buildText, poster, pdf, select: ids => { ids.forEach(i => sel.add(i)); } } };
})();
