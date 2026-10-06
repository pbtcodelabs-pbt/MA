/* مکتبۃ العزیز — ایپ کا کوڈ (ورژن MA610TU008) */
(() => {
  'use strict';

  // ---------- فنون ----------
  const CATS = [
    { id: 'tafseer',        name: 'تفسیر' },
    { id: 'usool-tafseer',  name: 'اصول تفسیر' },
    { id: 'hadith',         name: 'حدیث' },
    { id: 'usool-hadith',   name: 'اصول حدیث' },
    { id: 'fiqh',           name: 'فقہ' },
    { id: 'usool-fiqh',     name: 'اصول فقہ' },
    { id: 'tareekh',        name: 'تاریخ' },
    { id: 'seerat',         name: 'سیرت' },
    { id: 'qadiani',        name: 'کادیانی کتب' },
    { id: 'radd-qadianiyat',name: 'رد کادیانیت' },
    { id: 'radd-rafz',      name: 'رد رفض ورفض' },
    { id: 'kalam',          name: 'علم کلام' },
    { id: 'shairi',         name: 'شاعری' },
    { id: 'tib',            name: 'طب' },
    { id: 'mutafarriqat',   name: 'متفرقات' }
  ];
  const catById = id => CATS.find(c => c.id === id);

  // ---------- ڈیٹا ----------
  const KEY = 'maktaba-aziz-data-v1';
  let db = { books: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.books)) db = d; }
  } catch (e) { console.warn(e); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast('ڈیٹا محفوظ نہیں ہو سکا۔ براؤزر کی اسٹوریج بھری ہوئی ہو سکتی ہے۔'); }
  }
  const booksOf = cat => db.books.filter(b => b.cat === cat);
  const sum = (list, k) => list.reduce((s, b) => s + (Number(b[k]) || 0), 0);

  // ---------- اعداد ----------
  const UR = '۰۱۲۳۴۵۶۷۸۹';
  const ur = v => String(v).replace(/[0-9]/g, d => UR[d]);
  const num = n => ur(Number(n || 0).toLocaleString('en-US'));
  const money = n => num(n) + ' روپے';
  function parseNum(s) {
    const t = String(s || '')
      .replace(/[۰-۹]/g, d => UR.indexOf(d))
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[,٬\s]/g, '');
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- عناصر ----------
  const $ = id => document.getElementById(id);
  const view = $('view');
  let showGrandPrice = false;
  const showCatPrice = new Set();

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- خلاصہ اور مین بار ----------
  function renderSummary() {
    $('sumTitles').textContent = num(db.books.length);
    $('sumParts').textContent = num(sum(db.books, 'parts'));
    const out = $('sumPrice');
    out.hidden = !showGrandPrice;
    out.textContent = 'کل قیمت: ' + money(sum(db.books, 'price'));
  }

  function renderBar(active) {
    $('bar').innerHTML =
      `<li><a class="bk home ${!active ? 'on' : ''}" href="#/">${badge(db.books.length)}${book3d('تمام فنون', '#3a6ea8')}</a></li>` +
      CATS.map((c, i) => `<li><a href="#/c/${c.id}" class="bk ${active === c.id ? 'on' : ''}">${badge(booksOf(c.id).length)}${book3d(esc(c.name), PAL[i % PAL.length])}</a></li>`).join('');
  }

  // جِلدوں کے رنگ
  const PAL = ['#8e2f2a', '#1f3f73', '#7a5418', '#5a3b7a', '#6e4428', '#1d5f66', '#8a2a4f', '#3c4f6e'];

  // کھڑی موٹی کتاب: سامنے جِلد (نام کے ساتھ)، ایک طرف صفحات، دوسری طرف پشت
  // ترچھی کھڑی کتاب: سامنے گتا + دائیں طرف جِلد کی پشت (سنہری پٹیاں)، ورق بائیں طرف
  const book3d = (label, color, extra = '') =>
    `<span class="bkx" style="--c:${color}">` +
    `<span class="bkx-top"></span>` +
    `<span class="bkx-cover">${extra}<span class="bkx-label">${label}</span></span>` +
    `<span class="bkx-spine"></span></span>`;

  // کتابوں کا سائز (چھوٹا/بڑا) — یاد رہتا ہے
  let bookScale = Number((() => { try { return localStorage.getItem('maktaba-aziz-book-scale'); } catch (e) { return null; } })()) || 1;
  const applyScale = () => document.documentElement.style.setProperty('--bs', bookScale);
  applyScale();
  const sizeCtl = () => `<span class="sizer" aria-label="کتابوں کا سائز"><button type="button" data-bs="-0.1" aria-label="کتابیں چھوٹی">−</button><span>سائز</span><button type="button" data-bs="0.1" aria-label="کتابیں بڑی">+</button></span>`;
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-bs]'); if (!t) return;
    bookScale = Math.round(Math.min(1.6, Math.max(0.7, bookScale + Number(t.dataset.bs))) * 10) / 10;
    applyScale();
    try { localStorage.setItem('maktaba-aziz-book-scale', bookScale); } catch (err) {}
  });

  // ---------- صفحات ----------
  const badge = n => `<span class="badge${n ? '' : ' zero'}">${num(n)}</span>`;
  const ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5 2-1.5 5-1.9 8-1.5V5c-3-.4-6 0-8 1.5z"/><path d="M12 6.5v13"/></svg>';

  // ہوم: فنون کے کارڈ، کونے پر کتب کی تعداد
  function pageHome() {
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><h2>فنون</h2>${sizeCtl()}</div>
        <div class="panel-b">
          <div class="shelf">
            ${CATS.map((c, i) => `<a class="bk" href="#/c/${c.id}">${badge(booksOf(c.id).length)}${book3d(esc(c.name), PAL[i % PAL.length])}</a>`).join('')}
          </div>
        </div>
      </section>`;
  }

  // فن کا صفحہ: اس فن کی ساری کتب کارڈوں میں
  function pageCat(cat, q = '') {
    const all = booksOf(cat.id);
    const qq = q.trim();
    const list = qq ? all.filter(b => [b.name, b.author, b.publisher].some(v => (v || '').includes(qq))) : all;
    const priceShown = showCatPrice.has(cat.id);
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h">
          <h2>${esc(cat.name)}</h2>
          <span class="actions">${sizeCtl()}<a class="btn" href="#/c/${cat.id}/add">+ ایڈ کتب</a></span>
        </div>
        <div class="panel-b" id="catb">
          <div class="cat-sum">
            <span>کل کتب: <b>${num(all.length)}</b></span>
            <span>کل اجزاء: <b>${num(sum(all, 'parts'))}</b></span>
            <span class="cat-price">
              <button class="btn gold small" data-act="price" type="button">${priceShown ? 'کل قیمت چھپائیں' : 'اس فن کی کل قیمت'}</button>
              ${priceShown ? `<span class="price-out">${money(sum(all, 'price'))}</span>` : ''}
            </span>
          </div>
          ${all.length ? `
            ${all.length > 6 ? `<input class="search" id="q" type="search" placeholder="نام، مصنف یا مکتبہ سے تلاش…" aria-label="تلاش" value="${esc(q)}">` : ''}
            <div class="shelf books">
              ${list.map(b => `<a class="bk" href="#/c/${cat.id}/b/${b.id}" title="${esc(b.author)}">${book3d(esc(b.name), PAL[(all.indexOf(b) + CATS.indexOf(cat)) % PAL.length], `<span class="bkx-no">${num(all.indexOf(b) + 1)}</span>`)}</a>`).join('') || `<p class="crumb">تلاش سے کوئی کتاب نہیں ملی</p>`}
            </div>` : `
            <div class="empty"><b>اس فن میں ابھی کوئی کتاب درج نہیں</b>اوپر «ایڈ کتب» دبا کر پہلی کتاب شامل کریں۔</div>`}
        </div>
      </section>`;

    const qi = $('q');
    if (qi) qi.addEventListener('input', () => {
      const pos = qi.selectionStart; pageCat(cat, qi.value);
      const n = $('q'); n.focus(); n.setSelectionRange(pos, pos);
    });
    $('catb').addEventListener('click', e => {
      const b = e.target.closest('[data-act="price"]'); if (!b) return;
      priceShown ? showCatPrice.delete(cat.id) : showCatPrice.add(cat.id);
      pageCat(cat, q);
    });
  }

  // کتاب کی تفصیل
  function pageBook(cat, id, confirmDel = false) {
    const all = booksOf(cat.id);
    const b = all.find(x => x.id === id);
    if (!b) { location.hash = `#/c/${cat.id}`; return; }
    const row = (k, v) => `<div class="d-row"><dt>${k}</dt><dd>${v}</dd></div>`;
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h">
          <a class="back" href="#/c/${cat.id}">→ ${esc(cat.name)}</a>
          <span class="crumb">کتاب نمبر ${num(all.indexOf(b) + 1)}</span>
        </div>
        <div class="panel-b detail" id="detb">
          <h2 class="d-title">${esc(b.name)}</h2>
          <dl>
            ${row('کتاب کا نام', esc(b.name))}
            ${row('مصنف', esc(b.author) || '—')}
            ${row('مکتبہ', esc(b.publisher) || '—')}
            ${row('تعداد اجزاء', num(b.parts))}
            ${row('قیمت', money(b.price))}
            ${row('فن', esc(cat.name))}
          </dl>
          ${confirmDel ? `<div class="confirm"><span>«${esc(b.name)}» کو فہرست سے حذف کر دیں؟</span>
            <span class="actions"><button class="btn danger small" data-act="del-yes" type="button">ہاں، حذف کریں</button>
            <button class="btn ghost small" data-act="del-no" type="button">رہنے دیں</button></span></div>` : ''}
          <div class="actions">
            <a class="btn" href="#/c/${cat.id}/edit/${b.id}">ترمیم کریں</a>
            <button class="btn ghost" data-act="del" type="button">حذف کریں</button>
          </div>
        </div>
      </section>`;
    $('detb').addEventListener('click', e => {
      const t = e.target.closest('[data-act]'); if (!t) return;
      if (t.dataset.act === 'del') pageBook(cat, id, true);
      if (t.dataset.act === 'del-no') pageBook(cat, id);
      if (t.dataset.act === 'del-yes') {
        const i = db.books.findIndex(x => x.id === id);
        if (i > -1) { const [gone] = db.books.splice(i, 1); save(); toast(`«${gone.name}» حذف ہو گئی`); }
        refreshCounts(cat.id); location.hash = `#/c/${cat.id}`;
      }
    });
  }

  // ایڈ / ترمیم — پاپ اپ فارم (MCS ایپ کے انداز پر)
  const LAST_KEY = 'maktaba-aziz-last';
  const ZOOM_KEY = 'maktaba-aziz-form-zoom';
  const lsGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const uniq = k => [...new Set(db.books.map(b => (b[k] || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ur'));

  function pageAdd(cat, editId) {
    const b = editId ? db.books.find(x => x.id === editId && x.cat === cat.id) : null;
    if (editId && !b) { location.hash = `#/c/${cat.id}`; return; }
    // پس منظر میں اس فن کی کتب
    if (b) pageBook(cat, b.id); else pageCat(cat);
    const back = b ? `#/c/${cat.id}/b/${b.id}` : `#/c/${cat.id}`;
    const last = (() => { try { return JSON.parse(lsGet(LAST_KEY, '{}')) || {}; } catch (e) { return {}; } })();
    let zoom = Number(lsGet(ZOOM_KEY, 100)) || 100;

    document.getElementById('sheet')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'sheet';
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = `
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-t">
        <div class="sheet-h">
          <h2 id="sheet-t">${b ? 'کتاب میں ترمیم کریں' : 'نئی کتاب شامل کریں'}</h2>
          <div class="sheet-tools">
            <div class="zoom"><button type="button" data-z="-10" aria-label="حروف چھوٹے">A−</button><span id="zv">${ur(zoom)}٪</span><button type="button" data-z="10" aria-label="حروف بڑے">A+</button></div>
            <button type="button" class="x" id="sheetClose" aria-label="بند کریں">✕</button>
          </div>
        </div>
        <form id="addForm" class="sheet-b" novalidate style="font-size:${zoom}%">
          <div class="frow"><label for="f-name">کتاب کا نام</label><input id="f-name" autocomplete="off" value="${esc(b?.name)}" placeholder="مثلاً تفسیر ابن کثیر"></div>
          <div class="frow"><label for="f-cat">فن</label>
            <select id="f-cat">${CATS.map(c => `<option value="${c.id}" ${c.id === cat.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="frow"><label for="f-author">مصنف</label><input id="f-author" list="dl-author" autocomplete="off" value="${esc(b?.author)}" placeholder="لکھیں یا فہرست سے چنیں"></div>
          <div class="frow"><label for="f-publisher">مکتبہ</label><input id="f-publisher" list="dl-pub" autocomplete="off" value="${esc(b ? b.publisher : (last.publisher || ''))}" placeholder="لکھیں یا فہرست سے چنیں"></div>
          ${!b && last.publisher ? `<p class="hint">مکتبہ پچھلے اندراج سے خود بھر جاتا ہے، چاہیں تو بدل دیں۔</p>` : ''}
          <div class="frow"><label for="f-parts">تعداد اجزاء</label><input id="f-parts" inputmode="numeric" autocomplete="off" value="${b ? ur(b.parts ?? '') : ''}" placeholder="مثلاً ۴"></div>
          <div class="frow"><label for="f-price">قیمت (روپے)</label><input id="f-price" inputmode="decimal" autocomplete="off" value="${b ? ur(b.price ?? '') : ''}" placeholder="مثلاً ۳۲۰۰"></div>
          <datalist id="dl-author">${uniq('author').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
          <datalist id="dl-pub">${uniq('publisher').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
          <p class="err" id="f-err" role="alert"></p>
          <button class="btn save" type="submit">💾 ${b ? 'تبدیلی محفوظ کریں' : 'محفوظ کریں'}</button>
          ${!b ? `<p class="hint center">محفوظ کرنے کے بعد فارم اگلی کتاب کے لیے کھلا رہے گا۔</p>` : ''}
        </form>
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('noscroll');

    const close = () => { wrap.remove(); document.body.classList.remove('noscroll'); document.removeEventListener('keydown', onKey); if (location.hash !== back) location.hash = back; };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    $('sheetClose').addEventListener('click', close);
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    wrap.querySelectorAll('[data-z]').forEach(btn => btn.addEventListener('click', () => {
      zoom = Math.min(150, Math.max(80, zoom + Number(btn.dataset.z)));
      $('addForm').style.fontSize = zoom + '%'; $('zv').textContent = ur(zoom) + '٪'; lsSet(ZOOM_KEY, zoom);
    }));
    setTimeout(() => $('f-name').focus(), 50);

    $('addForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('f-name').value.trim();
      const parts = parseNum($('f-parts').value);
      const price = parseNum($('f-price').value);
      const newCat = $('f-cat').value;
      const err = $('f-err');
      if (!name) { err.textContent = 'کتاب کا نام لکھنا ضروری ہے۔'; $('f-name').focus(); return; }
      if (Number.isNaN(parts)) { err.textContent = 'تعداد اجزاء میں صرف ہندسے لکھیں۔'; $('f-parts').focus(); return; }
      if (Number.isNaN(price)) { err.textContent = 'قیمت میں صرف ہندسے لکھیں۔'; $('f-price').focus(); return; }
      const rec = { name, cat: newCat, author: $('f-author').value.trim(), publisher: $('f-publisher').value.trim(), parts: parts ?? 1, price: price ?? 0 };
      lsSet(LAST_KEY, JSON.stringify({ publisher: rec.publisher }));
      if (b) {
        Object.assign(b, rec); save();
        wrap.remove(); document.body.classList.remove('noscroll'); document.removeEventListener('keydown', onKey);
        toast('تبدیلی محفوظ ہو گئی');
        location.hash = `#/c/${newCat}/b/${b.id}`;
      } else {
        db.books.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), added: new Date().toISOString(), ...rec });
        save(); toast(`«${name}» محفوظ ہو گئی`);
        refreshCounts(cat.id); pageCat(cat);
        // اگلی کتاب کے لیے خانے خالی، مکتبہ باقی
        ['f-name', 'f-author', 'f-parts', 'f-price'].forEach(id => { $(id).value = ''; });
        err.textContent = '';
        const opt = $('dl-pub');
        if (rec.publisher && ![...opt.options].some(o => o.value === rec.publisher)) opt.insertAdjacentHTML('beforeend', `<option value="${esc(rec.publisher)}">`);
        if (rec.author) $('dl-author').insertAdjacentHTML('beforeend', `<option value="${esc(rec.author)}">`);
        $('f-name').focus();
      }
    });
  }

  // ---------- تلاش (سب کتب میں) ----------
  const norm = t => String(t || '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')          // اعراب اور کشیدہ ہٹائیں
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ةۃه]/g, 'ہ').replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ').trim().toLowerCase();
  function pageSearch(q) {
    const words = norm(q).split(' ').filter(Boolean);
    const hits = db.books.filter(b => {
      const hay = norm([b.name, b.author, b.publisher, catById(b.cat)?.name].join(' '));
      return words.every(w => hay.includes(w));
    });
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><h2>تلاش: «${esc(q)}»</h2><span class="crumb">${num(hits.length)} کتب ملیں</span></div>
        <div class="panel-b">
          ${hits.length ? `<div class="results">${hits.map(b => {
            const c = catById(b.cat), i = CATS.indexOf(c);
            return `<a class="result" href="#/c/${b.cat}/b/${b.id}">
              <span class="r-ico">${book3d('', PAL[i % PAL.length])}</span>
              <span class="r-txt"><b>${esc(b.name)}</b>
                <span>${[b.author && 'مصنف: ' + esc(b.author), b.publisher && 'مکتبہ: ' + esc(b.publisher)].filter(Boolean).join(' · ') || '—'}</span>
                <span class="r-meta">${esc(c.name)} · اجزاء ${num(b.parts)} · ${money(b.price)}</span></span></a>`;
          }).join('')}</div>` : `<div class="empty"><b>کوئی کتاب نہیں ملی</b>نام، مصنف، مکتبہ یا فن کا کوئی اور لفظ لکھ کر دیکھیں۔</div>`}
        </div>
      </section>`;
  }
  const gq = $('gq');
  gq.addEventListener('input', () => {
    const q = gq.value.trim();
    $('gqClear').hidden = !q;
    if (q) { document.body.classList.add('is-home'); renderBar(null); pageSearch(q); }
    else route();
  });
  $('gqClear').addEventListener('click', () => { gq.value = ''; $('gqClear').hidden = true; route(); gq.focus(); });

  function refreshCounts(active) { renderSummary(); renderBar(active); }

  // ---------- راستے ----------
  function route() {
    if (gq.value) { gq.value = ''; $('gqClear').hidden = true; }
    if (!/\/(add|edit)/.test(location.hash) && document.getElementById('sheet')) { document.getElementById('sheet').remove(); document.body.classList.remove('noscroll'); }
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    document.body.classList.toggle('is-home', !(parts[0] === 'c' && catById(parts[1])));
    if (parts[0] === 'c' && catById(parts[1])) {
      const cat = catById(parts[1]);
      renderBar(cat.id);
      if (parts[2] === 'add') pageAdd(cat);
      else if (parts[2] === 'edit' && parts[3]) pageAdd(cat, parts[3]);
      else if (parts[2] === 'b' && parts[3]) pageBook(cat, parts[3]);
      else pageCat(cat);
    } else {
      renderBar(null); pageHome();
    }
    renderSummary();
    window.scrollTo({ top: Math.min(window.scrollY, view.offsetTop - 12) });
  }
  window.addEventListener('hashchange', route);

  // ---------- کل قیمت (ایک کلک) ----------
  $('btnSumPrice').addEventListener('click', () => {
    showGrandPrice = !showGrandPrice;
    $('btnSumPrice').textContent = showGrandPrice ? 'کل قیمت چھپائیں' : 'تمام کتب کی کل قیمت';
    renderSummary();
  });

  // ---------- بیک اپ ----------
  $('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `maktaba-aziz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('importFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.books)) throw new Error('bad');
      db = { books: d.books.filter(b => b && b.name && catById(b.cat)) };
      save(); route(); toast(`بیک اپ سے ${num(db.books.length)} کتب واپس آ گئیں`);
    } catch (err) {
      toast('یہ فائل درست بیک اپ نہیں ہے۔');
    }
    e.target.value = '';
  });

  route();
})();
