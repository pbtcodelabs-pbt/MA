/* مکتبۃ العزیز — ایپ کا کوڈ (ورژن MA810TH057) */
(() => {
  'use strict';

  // ---------- فنون ----------
  const DEFAULT_CATS = [
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
  // فنون: پہلے سے موجود + صارف کے بنائے ہوئے (db.cats)، نام بدلے ہوں تو db.catNames
  const cats = () => [...DEFAULT_CATS, ...(db.cats || [])].map(c => ({ ...c, name: (db.catNames || {})[c.id] || c.name }));
  const catById = id => cats().find(c => c.id === id);
  const catIndex = id => cats().findIndex(c => c.id === id);

  // ---------- ڈیٹا ----------
  const KEY = 'maktaba-aziz-data-v1';
  let db = { books: [], cats: [], catNames: {}, loanLog: [], progs: [] };
  function normDb(d) {
    const o = { books: [], cats: [], catNames: {}, loanLog: [], progs: [] };
    if (d && Array.isArray(d.cats)) o.cats = d.cats.filter(c => c && c.id && c.name);
    if (d && d.catNames && typeof d.catNames === 'object') o.catNames = d.catNames;
    if (d && Array.isArray(d.loanLog)) o.loanLog = d.loanLog;
    if (d && Array.isArray(d.progs)) o.progs = d.progs.filter(p => p && p.id && p.date);
    const ids = new Set([...DEFAULT_CATS, ...o.cats].map(c => c.id));
    if (d && Array.isArray(d.books)) o.books = d.books.filter(b => b && b.name && ids.has(b.cat));
    return o;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) db = normDb(JSON.parse(raw));
  } catch (e) { console.warn(e); }
  function save() {
    try { window.dispatchEvent(new Event('ma-data-changed')); } catch (e) {}
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast('ڈیٹا محفوظ نہیں ہو سکا۔ براؤزر کی اسٹوریج بھری ہوئی ہو سکتی ہے۔'); }
  }
  const booksOf = cat => db.books.filter(b => b.cat === cat);
  const loaned = () => db.books.filter(b => b.loan);
  const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dmy = iso => { if (!iso) return '—'; const [y, m, d] = String(iso).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
  const daysSince = iso => iso ? Math.max(0, Math.floor((Date.now() - new Date(String(iso).slice(0, 10) + 'T00:00:00').getTime()) / 864e5)) : 0;
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const sum = (list, k) => list.reduce((s, b) => s + (Number(b[k]) || 0), 0);

  // ---------- اعداد ----------
  const UR = '۰۱۲۳۴۵۶۷۸۹';
  const ur = v => String(v);   // ہندسے انگریزی میں (Arial)
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
    if (!$('sumTitles')) return;
    $('sumTitles').textContent = num(db.books.length);
    $('sumParts').textContent = num(sum(db.books, 'parts'));
    const out = $('sumPrice');
    out.hidden = !showGrandPrice;
    out.textContent = 'کل قیمت: ' + money(sum(db.books, 'price'));
  }

  function renderBar(active) {
    $('bar').innerHTML =
      `<li><a class="bk home ${!active ? 'on' : ''}" href="#/">${book3d('تمام فنون', '#3a6ea8')}${pill(db.books.length, loaned().length)}</a></li>` +
      cats().map((c, i) => `<li><a href="#/c/${c.id}" class="bk ${active === c.id ? 'on' : ''}">${book3d(esc(c.name), PAL[i % PAL.length])}${pill(booksOf(c.id).length, booksOf(c.id).filter(b => b.loan).length)}</a></li>`).join('');
  }

  // جِلدوں کے رنگ
  const PAL = ['#8e2f2a', '#1f3f73', '#7a5418', '#5a3b7a', '#6e4428', '#1d5f66', '#8a2a4f', '#3c4f6e'];

  // کھڑی موٹی کتاب: سامنے جِلد (نام کے ساتھ)، ایک طرف صفحات، دوسری طرف پشت
  // ترچھی کھڑی کتاب: سامنے گتا + دائیں طرف جِلد کی پشت (سنہری پٹیاں)، ورق بائیں طرف
  const book3d = (label, color, extra = '', out = false) =>
    `<span class="bkx${out ? ' out' : ''}" style="--c:${color}">` +
    (out ? `<span class="bkx-rib">جاری</span>` : '') +
    `<span class="bkx-top"></span>` +
    `<span class="bkx-cover">${extra}<span class="bkx-label">${label}</span></span>` +
    `<span class="bkx-spine"></span></span>`;

  // ایک لائن میں کتنی کتابیں (1 سے 5) — ہوم اور فن کے صفحے کے لیے الگ الگ یاد رہتا ہے
  // کتاب کا سائز اسی سے خود بنتا ہے: صرف اوپر نیچے بڑی ہوتی ہے، دائیں بائیں کبھی باہر نہیں نکلتی
  const colsKey = () => document.body.classList.contains('is-home') ? 'maktaba-aziz-cols-home' : 'maktaba-aziz-cols-cat';
  const getCols = () => { const d = document.body.classList.contains('is-home') ? 5 : 3; try { return Number(localStorage.getItem(colsKey())) || d; } catch (e) { return d; } };
  const sizeCtl = () => { const c = getCols(); return `<span class="sizer" aria-label="ایک لائن میں کتب"><button type="button" data-cols="+1" aria-label="کتابیں چھوٹی">−</button>${[1, 2, 3, 4, 5].map(n => `<button type="button" class="sz-n${n === c ? ' on' : ''}" data-cols="${n}" aria-label="ایک لائن میں ${n}">${n}</button>`).join('')}<button type="button" data-cols="-1" aria-label="کتابیں بڑی">+</button></span>`; };
  function fitShelf() {
    const c = getCols();
    document.querySelectorAll('#view .shelf').forEach(sh => {
      sh.style.setProperty('--cols', c);
      const gap = parseFloat(getComputedStyle(sh).columnGap) || 0;
      const colW = (sh.clientWidth - gap * (c - 1)) / c;
      // کتاب کی چوڑائی = 69px × bs (جِلد 56 + پشت 13)
      sh.style.setProperty('--bs', Math.max(0.5, Math.min(4.6, (colW - 8) / 69)).toFixed(3));
    });
    document.querySelectorAll('#view .sz-n').forEach(b => b.classList.toggle('on', Number(b.dataset.cols) === c));
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-cols]'); if (!t) return;
    const v = t.dataset.cols;
    let c = /^[+-]/.test(v) ? getCols() + Number(v) : Number(v);
    c = Math.min(5, Math.max(1, c));
    try { localStorage.setItem(colsKey(), c); } catch (err) {}
    fitShelf();
  });
  new ResizeObserver(() => fitShelf()).observe($('view'));
  new MutationObserver(() => fitShelf()).observe($('view'), { childList: true });

  // ---------- صفحات ----------
  // آئیکن کے نیچے لمبا کیپسول: کتب کی تعداد (اور پڑھنے کے لیے گئی ہوں تو سرخ نشان)
  const pill = (n, out = 0) => `<span class="cnt${n ? '' : ' zero'}"><b>${num(n)}</b>${out ? `<i title="پڑھنے کے لیے گئی">${num(out)}</i>` : ''}</span>`;
  const badge = pill;
  const SP = (color, svg) => `<span class="bkx sp" style="--c:${color}"><span class="bkx-top"></span><span class="bkx-cover"><span class="bkx-label sp-ico">${svg}</span></span><span class="bkx-spine"></span></span>`;
  const IC_PLUS = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  const IC_REP = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
  const IC_MIC = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>';
  const IC_LOAN = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><path d="M3 20c.7-3.5 3-5.5 6-5.5s5.3 2 6 5.5"/><path d="M16 8h6M19 5l3 3-3 3"/></svg>';

  // ہوم: فنون کی کتابیں + نیا فن، رپورٹس، اجراء
  function pageHome() {
    const total = db.books.length, out = loaned().length;
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h home-h">
          <span class="hsum"><span>کتب <b>${num(total)}</b></span><span>اجزاء <b>${num(sum(db.books, 'parts'))}</b></span></span>
          <span class="actions"><button class="btn gold small" id="btnSumPrice2" type="button">${showGrandPrice ? money(sum(db.books, 'price')) : 'کل قیمت'}</button>${sizeCtl()}</span>
        </div>
        <div class="panel-b">
          <div class="shelf">
            ${cats().map((c, i) => `<a class="bk" href="#/c/${c.id}">${book3d(esc(c.name), PAL[i % PAL.length])}${pill(booksOf(c.id).length, booksOf(c.id).filter(b => b.loan).length)}</a>`).join('')}
            <a class="bk special add" href="#/newcat" title="نیا فن">${SP('#c8962f', IC_PLUS)}<span class="cnt lbl">نیا فن</span></a>
            <a class="bk special" href="#/reports">${SP('#1f6a54', IC_REP)}<span class="cnt lbl">رپورٹس</span></a>
            <a class="bk special" href="#/loans">${SP('#8e2f2a', IC_LOAN)}<span class="cnt lbl">اجراء${out ? ` <i>${num(out)}</i>` : ''}</span></a>
            <a class="bk special prog" href="#/prog">${SP('#5a3b7a', IC_MIC)}<span class="cnt lbl">شیڈیول${(() => { const n = window.MA_PROG ? window.MA_PROG.soon() : 0; return n ? ` <i class="gr">${num(n)}</i>` : ''; })()}</span></a>
          </div>
        </div>
      </section>`;
    $('btnSumPrice2').addEventListener('click', () => { showGrandPrice = !showGrandPrice; pageHome(); });
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
          <h2>${esc(cat.name)} <button class="iconbtn" type="button" data-act="rename" title="نام بدلیں" aria-label="فن کا نام بدلیں">✎</button></h2>
          <span class="actions">${sizeCtl()}<button class="btn ghost small share-btn" type="button" data-share-cat="${cat.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>بھیجیں</button><a class="btn" href="#/c/${cat.id}/add">+ ایڈ کتب</a></span>
        </div>
        <div class="panel-b" id="catb">
          <div class="cat-sum">
            <span>کل کتب: <b>${num(all.length)}</b></span>
            <span>کل اجزاء: <b>${num(sum(all, 'parts'))}</b></span>
            ${all.some(b => b.loan) ? `<a class="out-n" href="#/loans">پڑھنے کے لیے گئی: <b>${num(all.filter(b => b.loan).length)}</b></a>` : ''}
            <span class="cat-price">
              <button class="btn gold small" data-act="price" type="button">${priceShown ? 'کل قیمت چھپائیں' : 'اس فن کی کل قیمت'}</button>
              ${priceShown ? `<span class="price-out">${money(sum(all, 'price'))}</span>` : ''}
            </span>
          </div>
          ${all.length ? `
            ${all.length > 6 ? `<input class="search" id="q" type="search" placeholder="نام، مصنف یا مکتبہ سے تلاش…" aria-label="تلاش" value="${esc(q)}">` : ''}
            <div class="shelf books">
              ${list.map(b => `<a class="bk" href="#/c/${cat.id}/b/${b.id}" title="${esc(b.author)}">${book3d(esc(b.name), PAL[(all.indexOf(b) + catIndex(cat.id)) % PAL.length], `<span class="bkx-no">${num(all.indexOf(b) + 1)}</span>`, !!b.loan)}${b.loan ? `<span class="cnt out-l">${esc(b.loan.name)}</span>` : ''}</a>`).join('') || `<p class="crumb">تلاش سے کوئی کتاب نہیں ملی</p>`}
            </div>` : `
            <div class="empty"><b>اس فن میں ابھی کوئی کتاب درج نہیں</b>اوپر «ایڈ کتب» دبا کر پہلی کتاب شامل کریں۔
              ${(db.cats || []).some(c => c.id === cat.id) ? `<p><button class="btn ghost small" type="button" data-act="delcat">یہ فن حذف کریں</button></p>` : ''}</div>`}
        </div>
      </section>`;

    const qi = $('q');
    if (qi) qi.addEventListener('input', () => {
      const pos = qi.selectionStart; pageCat(cat, qi.value);
      const n = $('q'); n.focus(); n.setSelectionRange(pos, pos);
    });
    view.querySelector('[data-act="rename"]').addEventListener('click', () => openCatForm(cat));
    $('catb').addEventListener('click', e => {
      if (e.target.closest('[data-act="delcat"]')) {
        db.cats = (db.cats || []).filter(c => c.id !== cat.id); delete db.catNames[cat.id];
        save(); toast(`«${cat.name}» حذف ہو گیا`); location.hash = '#/'; return;
      }
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
          ${b.loan ? `<div class="loan-card">
            <div class="lc-h"><span class="lc-tag">پڑھنے کے لیے گئی ہوئی ہے</span><span class="lc-days">${num(daysSince(b.loan.date))} دن</span></div>
            <dl>
              <div class="d-row"><dt>نام</dt><dd>${esc(b.loan.name)}</dd></div>
              ${b.loan.phone ? `<div class="d-row"><dt>موبائل</dt><dd><a href="tel:${esc(b.loan.phone)}" dir="ltr">${esc(b.loan.phone)}</a> · <a href="https://wa.me/${esc(waNum(b.loan.phone))}" target="_blank" rel="noopener">واٹس ایپ</a></dd></div>` : ''}
              ${b.loan.address ? `<div class="d-row"><dt>پتہ</dt><dd>${esc(b.loan.address)}</dd></div>` : ''}
              <div class="d-row"><dt>تاریخ</dt><dd dir="ltr">${dmy(b.loan.date)}</dd></div>
              ${b.loan.note ? `<div class="d-row"><dt>نوٹ</dt><dd>${esc(b.loan.note)}</dd></div>` : ''}
            </dl>
            <div class="actions"><button class="btn" type="button" data-act="ret">✓ واپس آ گئی</button><button class="btn ghost small" type="button" data-act="lendedit">ترمیم</button></div>
          </div>` : `<button class="btn lend-go" type="button" data-act="lend">📖 پڑھنے کے لیے دیں</button>`}
          ${confirmDel ? `<div class="confirm"><span>«${esc(b.name)}» کو فہرست سے حذف کر دیں؟</span>
            <span class="actions"><button class="btn danger small" data-act="del-yes" type="button">ہاں، حذف کریں</button>
            <button class="btn ghost small" data-act="del-no" type="button">رہنے دیں</button></span></div>` : ''}
          <div class="actions">
            <a class="btn" href="#/c/${cat.id}/edit/${b.id}">ترمیم کریں</a>
            <button class="btn ghost share-btn" type="button" data-share-book="${b.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>یہ کتاب بھیجیں</button>
            <button class="btn ghost" data-act="del" type="button">حذف کریں</button>
          </div>
        </div>
      </section>`;
    $('detb').addEventListener('click', e => {
      const t = e.target.closest('[data-act]'); if (!t) return;
      if (t.dataset.act === 'lend' || t.dataset.act === 'lendedit') { openLoanForm(b); return; }
      if (t.dataset.act === 'ret') { returnBook(b); pageBook(cat, id); return; }
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
            <div class="zoom"><button type="button" data-z="-10" aria-label="حروف چھوٹے">A−</button><span id="zv">${zoom}%</span><button type="button" data-z="10" aria-label="حروف بڑے">A+</button></div>
            <button type="button" class="x" id="sheetClose" aria-label="بند کریں">✕</button>
          </div>
        </div>
        <form id="addForm" class="sheet-b" novalidate style="font-size:${zoom}%">
          <div class="cap" style="--i:0"><label class="cap-l" for="f-name"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>کتاب کا نام <b class="req">*</b></label><input id="f-name" autocomplete="off" value="${esc(b?.name)}" placeholder="مثلاً تفسیر ابن کثیر"></div>
          <div class="cap" style="--i:1"><label class="cap-l" for="f-cat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v5H4zM13 15h7v5h-7z"/></svg>فن <b class="req">*</b></label>
            <select id="f-cat">${cats().map(c => `<option value="${c.id}" ${c.id === cat.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="cap" style="--i:2"><label class="cap-l" for="f-author"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M14 7l3 3"/></svg>مصنف <b class="req">*</b></label><input id="f-author" list="dl-author" autocomplete="off" value="${esc(b?.author)}" placeholder="لکھیں یا فہرست سے چنیں"></div>
          <div class="cap" style="--i:3"><label class="cap-l" for="f-publisher"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9l2-5h12l2 5"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>مکتبہ <b class="req">*</b></label><input id="f-publisher" list="dl-pub" autocomplete="off" value="${esc(b ? b.publisher : (last.publisher || ''))}" placeholder="لکھیں یا فہرست سے چنیں"></div>
          ${!b && last.publisher ? `<p class="hint" style="--i:3">مکتبہ پچھلے اندراج سے خود بھر جاتا ہے</p>` : ''}
          <div class="cap-row" style="--i:4">
            <div class="cap"><label class="cap-l" for="f-parts"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>اجزاء <b class="req">*</b></label><input id="f-parts" class="numin" inputmode="numeric" autocomplete="off" value="${b ? (b.parts ?? '') : ''}" placeholder="4"></div>
            <div class="cap"><label class="cap-l" for="f-price"><b class="rs" aria-hidden="true">Rs</b>قیمت</label><input id="f-price" class="numin" inputmode="decimal" autocomplete="off" value="${b ? (b.price ?? '') : ''}" placeholder="3200"></div>
          </div>
          <datalist id="dl-author">${uniq('author').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
          <datalist id="dl-pub">${uniq('publisher').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
          <p class="err" id="f-err" role="alert"></p>
          <button class="btn save" type="submit" style="--i:5">💾 ${b ? 'تبدیلی محفوظ کریں' : 'محفوظ کریں'}</button>
          ${!b ? `<p class="hint center" style="--i:5">محفوظ کرنے کے بعد فارم اگلی کتاب کے لیے کھلا رہے گا</p>` : ''}
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
      $('addForm').style.fontSize = zoom + '%'; $('zv').textContent = zoom + '%'; lsSet(ZOOM_KEY, zoom);
    }));
    setTimeout(() => $('f-name').focus(), 50);

    $('addForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('f-name').value.trim();
      const author = $('f-author').value.trim();
      const newCat = $('f-cat').value;
      const err = $('f-err');
      // ضروری: فن، کتاب کا نام، مصنف، مکتبہ، اجزاء — صرف قیمت اختیاری
      if (!newCat) { err.textContent = 'فن چنیں'; $('f-cat').focus(); return; }
      if (!name) { err.textContent = 'کتاب کا نام لکھنا ضروری ہے'; $('f-name').focus(); return; }
      if (!author) { err.textContent = 'مصنف کا نام لکھنا ضروری ہے'; $('f-author').focus(); return; }
      if (!$('f-publisher').value.trim()) { err.textContent = 'مکتبہ (ناشر) کا نام لکھنا ضروری ہے'; $('f-publisher').focus(); return; }
      // اجزاء اور قیمت: جو ہندسے لکھے ہوں وہ لے لیں، کچھ نہ ہو تو خالی
      const loose = v => { const t = String(v || '').replace(/[۰-۹]/g, d => UR.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9.]/g, ''); const n = parseFloat(t); return Number.isFinite(n) ? n : null; };
      const parts = loose($('f-parts').value);
      const price = loose($('f-price').value);
      if (!parts) { err.textContent = 'اجزاء (جلدیں) کتنی ہیں؟ ہندسہ لکھیں'; $('f-parts').focus(); return; }
      const rec = { name, cat: newCat, author, publisher: $('f-publisher').value.trim(), parts: parts ?? 1, price: price ?? 0 };
      lsSet(LAST_KEY, JSON.stringify({ publisher: rec.publisher }));
      if (b) {
        Object.assign(b, rec); save();
        wrap.remove(); document.body.classList.remove('noscroll'); document.removeEventListener('keydown', onKey);
        toast('تبدیلی محفوظ ہو گئی');
        location.hash = `#/c/${newCat}/b/${b.id}`;
      } else {
        db.books.push({ id: newId(), added: new Date().toISOString(), ...rec });
        save(); toast(`✓ «${name}» محفوظ ہو گئی`);
        err.textContent = ''; const ok = document.createElement('p'); ok.className = 'saved-ok'; ok.textContent = `✓ «${name}» محفوظ ہو گئی — اگلی کتاب لکھیں`; $('addForm').querySelector('.saved-ok')?.remove(); $('addForm').prepend(ok);
        refreshCounts(cat.id); pageCat(cat);
        // اگلی کتاب کے لیے خانے خالی، مکتبہ باقی
        ['f-name', 'f-author', 'f-parts', 'f-price'].forEach(id => { $(id).value = ''; });
        err.textContent = '';
        const opt = $('dl-pub');
        if (rec.publisher && ![...opt.options].some(o => o.value === rec.publisher)) opt.insertAdjacentHTML('beforeend', `<option value="${esc(rec.publisher)}">`);
        if (rec.author) $('dl-author').insertAdjacentHTML('beforeend', `<option value="${esc(rec.author)}">`);
        $('addForm').classList.remove('saved'); void $('addForm').offsetWidth; $('addForm').classList.add('saved');
        $('f-name').focus();
      }
    });
  }

  // ---------- عام پاپ اپ ----------
  function openSheet(title, inner, onClose) {
    document.getElementById('sheet')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'sheet'; wrap.className = 'sheet-wrap';
    wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-t">
      <div class="sheet-h"><h2 id="sheet-t">${title}</h2><div class="sheet-tools"><button type="button" class="x" id="sheetClose" aria-label="بند کریں">✕</button></div></div>
      ${inner}</div>`;
    document.body.appendChild(wrap); document.body.classList.add('noscroll');
    const close = () => { wrap.remove(); document.body.classList.remove('noscroll'); document.removeEventListener('keydown', onKey); onClose && onClose(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    $('sheetClose').addEventListener('click', close);
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    return { wrap, close };
  }
  const capRow = (id, label, icon, attrs = '', i = 0) =>
    `<div class="cap" style="--i:${i}"><label class="cap-l" for="${id}">${icon}${label}</label><input id="${id}" autocomplete="off" ${attrs}></div>`;
  const I_USER = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>';
  const I_PHONE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>';
  const I_HOME = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/></svg>';
  const I_CAL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  const I_NOTE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4-1 10-10-3-3L5 16z"/></svg>';
  const I_CAT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v5H4zM13 15h7v5h-7z"/></svg>';
  const waNum = p => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '92' + d.slice(1); return d; };

  // ---------- نیا فن / نام بدلنا ----------
  function openCatForm(cat) {
    let saved = false;
    const { close } = openSheet(cat ? 'فن کا نام بدلیں' : 'نیا فن شامل کریں', `
      <form class="sheet-b" id="catForm" novalidate>
        ${capRow('c-name', 'فن کا نام', I_CAT, `value="${esc(cat?.name || '')}" placeholder="مثلاً لغت"`)}
        <p class="err" id="c-err" role="alert"></p>
        <button class="btn save" type="submit" style="--i:2">💾 ${cat ? 'نام محفوظ کریں' : 'فن شامل کریں'}</button>
      </form>`, () => { if (!saved && !cat && location.hash === '#/newcat') history.back(); });
    setTimeout(() => $('c-name').focus(), 50);
    $('catForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('c-name').value.trim();
      if (!name) { $('c-err').textContent = 'فن کا نام لکھیں'; return; }
      if (cats().some(c => c.name === name && c.id !== cat?.id)) { $('c-err').textContent = 'اس نام کا فن پہلے سے موجود ہے'; return; }
      if (cat) {
        db.catNames = db.catNames || {};
        if ((db.cats || []).some(c => c.id === cat.id)) db.cats.find(c => c.id === cat.id).name = name;
        else db.catNames[cat.id] = name;
        saved = true; save(); close(); toast('نام بدل گیا'); route();
      } else {
        const id = 'c-' + newId();
        db.cats = db.cats || []; db.cats.push({ id, name });
        saved = true; save(); close(); toast(`«${name}» فن بن گیا`); location.replace('#/c/' + id);
      }
    });
  }

  // ---------- اجراء: پڑھنے کے لیے دینا ----------
  function openLoanForm(b, back) {
    const L = b.loan || {};
    const names = [...new Set([...(db.loanLog || []).map(x => x.name), ...loaned().map(x => x.loan.name)].filter(Boolean))];
    const { close } = openSheet(b.loan ? 'اجراء میں ترمیم' : 'پڑھنے کے لیے دیں', `
      <form class="sheet-b" id="loanForm" novalidate>
        <p class="lf-book">📖 ${esc(b.name)}</p>
        ${capRow('l-name', 'نام', I_USER, `list="dl-lname" value="${esc(L.name || '')}" placeholder="کتاب لینے والے کا نام"`, 0)}
        ${capRow('l-phone', 'موبائل', I_PHONE, `class="numin" inputmode="tel" value="${esc(L.phone || '')}" placeholder="0300-1234567"`, 1)}
        ${capRow('l-addr', 'پتہ', I_HOME, `value="${esc(L.address || '')}" placeholder="گاؤں / محلہ / مدرسہ"`, 2)}
        ${capRow('l-date', 'تاریخ', I_CAL, `type="date" class="numin" value="${esc(L.date || todayIso())}"`, 3)}
        ${capRow('l-note', 'نوٹ', I_NOTE, `value="${esc(L.note || '')}" placeholder="اختیاری"`, 4)}
        <datalist id="dl-lname">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
        <p class="err" id="l-err" role="alert"></p>
        <button class="btn save" type="submit" style="--i:5">💾 ${b.loan ? 'تبدیلی محفوظ کریں' : 'جاری کریں'}</button>
      </form>`);
    setTimeout(() => $('l-name').focus(), 50);
    $('l-name').addEventListener('change', () => {
      const prev = [...(db.loanLog || [])].reverse().find(x => x.name === $('l-name').value.trim());
      if (prev) { if (!$('l-phone').value) $('l-phone').value = prev.phone || ''; if (!$('l-addr').value) $('l-addr').value = prev.address || ''; }
    });
    $('loanForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('l-name').value.trim();
      if (!name) { $('l-err').textContent = 'لینے والے کا نام لکھنا ضروری ہے'; $('l-name').focus(); return; }
      const rec = { name, phone: $('l-phone').value.trim(), address: $('l-addr').value.trim(), date: $('l-date').value || todayIso(), note: $('l-note').value.trim() };
      if (b.loan) {
        const log = (db.loanLog || []).find(x => x.id === b.loan.logId);
        if (log) Object.assign(log, rec);
        Object.assign(b.loan, rec);
      } else {
        const logId = newId();
        db.loanLog = db.loanLog || [];
        db.loanLog.push({ id: logId, bookId: b.id, book: b.name, cat: b.cat, ...rec, returned: null });
        b.loan = { ...rec, logId };
      }
      save(); close(); toast(`«${b.name}» ${name} کو جاری ہو گئی`);
      route();
    });
  }
  function returnBook(b) {
    if (!b.loan) return;
    const log = (db.loanLog || []).find(x => x.id === b.loan.logId);
    if (log) log.returned = todayIso();
    const who = b.loan.name;
    delete b.loan; save();
    toast(`✓ «${b.name}» ${who} سے واپس آ گئی`);
  }

  // اجراء کا صفحہ: پڑھنے کے لیے گئی کتب
  function pageLoans() {
    const list = loaned().sort((a, b) => String(a.loan.date).localeCompare(String(b.loan.date)));
    const hist = (db.loanLog || []).filter(x => x.returned).slice(-30).reverse();
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><h2>اجراء</h2>
          <span class="actions">${list.length ? `<button class="btn ghost small" type="button" id="loanPdf">📄 رپورٹ / PDF</button>` : ''}<button class="btn" type="button" id="loanNew">+ کتاب جاری کریں</button></span></div>
        <div class="panel-b">
          <div class="cat-sum"><span>پڑھنے کے لیے گئی کتب: <b>${num(list.length)}</b></span><span>لینے والے: <b>${num(new Set(list.map(b => b.loan.name)).size)}</b></span></div>
          ${list.length ? `<div class="loans">${list.map(b => {
            const c = catById(b.cat), d = daysSince(b.loan.date);
            return `<div class="loan-row${d > 30 ? ' late' : ''}">
              <a class="lr-book" href="#/c/${b.cat}/b/${b.id}">${book3d('', PAL[catIndex(b.cat) % PAL.length], '', true)}</a>
              <div class="lr-txt"><a href="#/c/${b.cat}/b/${b.id}"><b>${esc(b.name)}</b></a>
                <span>${esc(b.loan.name)}${b.loan.phone ? ` · <a href="tel:${esc(b.loan.phone)}" dir="ltr">${esc(b.loan.phone)}</a>` : ''}</span>
                <small>${esc(c?.name || '')} · <bdi dir="ltr">${dmy(b.loan.date)}</bdi> · ${num(d)} دن</small></div>
              <button class="btn small" type="button" data-ret="${b.id}">واپس</button>
            </div>`; }).join('')}</div>`
          : `<div class="empty"><b>اس وقت کوئی کتاب پڑھنے کے لیے نہیں گئی</b>«+ کتاب جاری کریں» دبا کر کتاب دیں۔</div>`}
          ${hist.length ? `<h3 class="sub-h">واپس آ چکی کتب</h3><div class="hist">${hist.map(h => `<div class="h-row"><b>${esc(h.book)}</b><span>${esc(h.name)} · <bdi dir="ltr">${dmy(h.date)} → ${dmy(h.returned)}</bdi></span></div>`).join('')}</div>` : ''}
        </div>
      </section>`;
    $('loanNew').addEventListener('click', openPicker);
    $('loanPdf')?.addEventListener('click', () => window.MA_SHARE_UI?.open({ mode: 'loans' }));
    view.querySelector('.loans')?.addEventListener('click', e => {
      const r = e.target.closest('[data-ret]'); if (!r) return;
      const b = db.books.find(x => x.id === r.dataset.ret); returnBook(b); pageLoans(); renderBar(null);
    });
  }
  // کون سی کتاب جاری کرنی ہے — تلاش کے ساتھ فہرست
  function openPicker() {
    const { close, wrap } = openSheet('کتاب چنیں', `
      <div class="sh-top"><input id="pkQ" type="search" placeholder="کتاب، مصنف یا فن…" aria-label="کتاب تلاش" autocomplete="off"></div>
      <div class="sh-list" id="pkList"></div>`);
    wrap.querySelector('.sheet').classList.add('share');
    const draw = () => {
      const w = norm($('pkQ').value).split(' ').filter(Boolean);
      const list = db.books.filter(b => !b.loan && (!w.length || w.every(x => norm([b.name, b.author, b.publisher, catById(b.cat)?.name].join(' ')).includes(x))));
      $('pkList').innerHTML = list.slice(0, 200).map(b => `<button type="button" class="pk" data-id="${b.id}"><b>${esc(b.name)}</b><small>${esc(catById(b.cat)?.name || '')}${b.author ? ' · ' + esc(b.author) : ''}</small></button>`).join('') || `<p class="sh-empty">کوئی دستیاب کتاب نہیں ملی</p>`;
    };
    draw(); $('pkQ').addEventListener('input', draw); setTimeout(() => $('pkQ').focus(), 50);
    $('pkList').addEventListener('click', e => {
      const t = e.target.closest('.pk'); if (!t) return;
      const b = db.books.find(x => x.id === t.dataset.id); close(); openLoanForm(b);
    });
  }

  // ---------- رپورٹس ----------
  function pageReports() {
    const authors = new Set(db.books.map(b => b.author).filter(Boolean)).size;
    const pubs = new Set(db.books.map(b => b.publisher).filter(Boolean)).size;
    const tile = (href, icon, title, sub, color) => `<a class="rep-tile" href="${href}" style="--c:${color}"><span class="rt-ico">${icon}</span><span class="rt-t"><b>${title}</b><small>${sub}</small></span><span class="rt-arr">‹</span></a>`;
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><h2>رپورٹس</h2></div>
        <div class="panel-b rep-tiles">
          ${tile('#/reports/author', I_NOTE, 'مصنف وار فہرست', `${num(authors)} مصنفین`, '#1f3f73')}
          ${tile('#/reports/publisher', I_HOME, 'مکتبہ وار فہرست', `${num(pubs)} مکتبے`, '#7a5418')}
          ${tile('#/reports/cat', I_CAT, 'فن وار فہرست', `${num(cats().length)} فنون`, '#1f6a54')}
          ${tile('#/loans', IC_LOAN, 'پڑھنے کے لیے گئی کتب', `${num(loaned().length)} کتب · کس کے پاس، موبائل نمبر`, '#8e2f2a')}
          <button class="rep-tile" type="button" data-share-all style="--c:#5a3b7a"><span class="rt-ico">${IC_REP}</span><span class="rt-t"><b>مکمل فہرستِ کتب</b><small>${num(db.books.length)} کتب · PDF، پوسٹر، واٹس ایپ</small></span><span class="rt-arr">‹</span></button>
        </div>
      </section>`;
    view.querySelector('[data-share-all]').addEventListener('click', () => window.MA_SHARE_UI?.open({ books: db.books.map(b => b.id), title: 'مکمل' }));
  }
  const REP = { author: { t: 'مصنف', key: b => b.author }, publisher: { t: 'مکتبہ', key: b => b.publisher }, cat: { t: 'فن', key: b => catById(b.cat)?.name } };
  function pageReportList(kind, q = '') {
    const R = REP[kind];
    const groups = {};
    db.books.forEach(b => { const k = (R.key(b) || '').trim() || '—'; (groups[k] = groups[k] || []).push(b); });
    const w = norm(q).split(' ').filter(Boolean);
    const keys = Object.keys(groups).filter(k => !w.length || w.every(x => norm(k).includes(x))).sort((a, b) => groups[b].length - groups[a].length || a.localeCompare(b, 'ur'));
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><a class="back" href="#/reports">→ رپورٹس</a><h2>${R.t} وار</h2></div>
        <div class="panel-b">
          <input class="search" id="rq" type="search" placeholder="${R.t} کا نام تلاش کریں…" aria-label="تلاش" value="${esc(q)}">
          <div class="rep-list">${keys.map(k => `<a class="rl" href="#/reports/${kind}/${encodeURIComponent(k)}"><b>${esc(k)}</b><span class="cnt"><b>${num(groups[k].length)}</b></span><small>${money(sum(groups[k], 'price'))}</small></a>`).join('') || `<p class="crumb">کچھ نہیں ملا</p>`}</div>
        </div>
      </section>`;
    const qi = $('rq');
    qi.addEventListener('input', () => { const pos = qi.selectionStart; pageReportList(kind, qi.value); const n = $('rq'); n.focus(); n.setSelectionRange(pos, pos); });
  }
  function pageReportDetail(kind, key) {
    const R = REP[kind];
    const list = db.books.filter(b => ((R.key(b) || '').trim() || '—') === key);
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><a class="back" href="#/reports/${kind}">→ ${R.t} وار</a>
          <span class="actions"><button class="btn small" type="button" id="repSend">📄 PDF / بھیجیں</button></span></div>
        <div class="panel-b">
          <h2 class="d-title">${esc(key)}</h2>
          <div class="cat-sum"><span>کتب: <b>${num(list.length)}</b></span><span>اجزاء: <b>${num(sum(list, 'parts'))}</b></span><span>کل قیمت: <b>${money(sum(list, 'price'))}</b></span></div>
          <div class="rep-books">${list.map((b, i) => `<a class="rb${b.loan ? ' out' : ''}" href="#/c/${b.cat}/b/${b.id}"><span class="rb-n">${num(i + 1)}</span><span class="rb-t"><b>${esc(b.name)}</b><small>${[kind !== 'author' && b.author, kind !== 'publisher' && b.publisher, kind !== 'cat' && catById(b.cat)?.name].filter(Boolean).map(esc).join(' · ')}${b.loan ? ` · <em>پڑھنے کے لیے گئی: ${esc(b.loan.name)}</em>` : ''}</small></span><span class="rb-p">${money(b.price)}</span></a>`).join('')}</div>
        </div>
      </section>`;
    $('repSend').addEventListener('click', () => window.MA_SHARE_UI?.open({ books: list.map(b => b.id), title: `${R.t}: ${key}` }));
  }

  // ---------- تلاش (سب کتب میں) ----------
  const norm = t => String(t || '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')          // اعراب اور کشیدہ ہٹائیں
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ةۃه]/g, 'ہ').replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ').trim().toLowerCase();
  function pageSearch(q) {
    const words = norm(q).split(' ').filter(Boolean);
    const hits = db.books.filter(b => {
      const hay = norm([b.name, b.author, b.publisher, catById(b.cat)?.name, b.loan?.name, b.loan?.phone].join(' '));
      return words.every(w => hay.includes(w));
    });
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><h2>تلاش: «${esc(q)}»</h2><span class="crumb">${num(hits.length)} کتب ملیں</span></div>
        <div class="panel-b">
          ${hits.length ? `<div class="results">${hits.map(b => {
            const c = catById(b.cat), i = catIndex(b.cat);
            return `<a class="result" href="#/c/${b.cat}/b/${b.id}">
              <span class="r-ico">${book3d('', PAL[i % PAL.length], '', !!b.loan)}</span>
              <span class="r-txt"><b>${esc(b.name)}</b>
                <span>${[b.author && 'مصنف: ' + esc(b.author), b.publisher && 'مکتبہ: ' + esc(b.publisher)].filter(Boolean).join(' · ') || '—'}</span>
                <span class="r-meta">${esc(c.name)} · اجزاء ${num(b.parts)} · ${money(b.price)}</span>
                ${b.loan ? `<span class="r-out">پڑھنے کے لیے گئی: ${esc(b.loan.name)}${b.loan.phone ? ' · ' + esc(b.loan.phone) : ''}</span>` : ''}</span></a>`;
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
    if (!/\/(add|edit)|newcat/.test(location.hash) && document.getElementById('sheet')) { document.getElementById('sheet').remove(); document.body.classList.remove('noscroll'); }
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    document.body.classList.toggle('is-home', !(parts[0] === 'c' && catById(parts[1])));
    if (parts[0] === 'reports') {
      renderBar(null);
      if (REP[parts[1]] && parts[2] !== undefined) pageReportDetail(parts[1], decodeURIComponent(parts[2]));
      else if (REP[parts[1]]) pageReportList(parts[1]);
      else pageReports();
    } else if (parts[0] === 'prog') {
      renderBar(null);
      if (window.MA_PROG) window.MA_PROG.route(parts.slice(1)); else view.innerHTML = '';
    } else if (parts[0] === 'loans') {
      renderBar(null); pageLoans();
    } else if (parts[0] === 'newcat') {
      renderBar(null); pageHome(); openCatForm(null);
    } else if (parts[0] === 'c' && catById(parts[1])) {
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
  $('btnSumPrice')?.addEventListener('click', () => {
    showGrandPrice = !showGrandPrice;
    $('btnSumPrice').textContent = showGrandPrice ? 'کل قیمت چھپائیں' : 'تمام کتب کی کل قیمت';
    renderSummary();
  });

  // ---------- بیک اپ ----------
  $('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(Object.assign({}, db, { lic: window.MA_LIC ? window.MA_LIC.export() : undefined, brand: window.MA_BRAND ? window.MA_BRAND.get() : undefined }), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `maktaba-aziz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  // بیک اپ فائل واٹس ایپ وغیرہ پر بھیجنا
  $('btnShareFile').addEventListener('click', async () => {
    const json = JSON.stringify(Object.assign({}, db, { brand: undefined }), null, 1);
    const fname = `maktaba-backup-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      const file = new File([json], fname, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: fname, text: `کتب کی بیک اپ فائل — ${num(db.books.length)} کتب` }); return; }
    } catch (err) { if (err && err.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = fname;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('فائل ڈاؤن لوڈ ہو گئی — اب واٹس ایپ میں فائل کے طور پر بھیجیں');
  });

  // دوسرے فون کی کتب ملانا: اپنی کتب برقرار، صرف نئی شامل؛ لائسنس اور پہچان نہیں بدلتی
  const fp = b => [b.name, b.author, b.publisher, b.parts, b.cat].map(v => String(v ?? '').replace(/\s+/g, ' ').trim()).join('|');
  function mergeFrom(d) {
    const inCats = Array.isArray(d.cats) ? d.cats.filter(c => c && c.id && c.name) : [];
    const inNames = (d.catNames && typeof d.catNames === 'object') ? d.catNames : {};
    const map = {};
    DEFAULT_CATS.forEach(c => { map[c.id] = c.id; });
    let newCats = 0;
    inCats.forEach(c => {
      const nm = String(inNames[c.id] || c.name).trim();
      const same = cats().find(x => x.id === c.id && x.name.trim() === nm) || cats().find(x => x.name.trim() === nm);
      if (same) { map[c.id] = same.id; return; }
      const id = cats().some(x => x.id === c.id) ? newId() : c.id;
      db.cats = db.cats || []; db.cats.push({ id, name: nm }); map[c.id] = id; newCats++;
    });
    const have = new Set(db.books.map(fp)), ids = new Set(db.books.map(b => b.id));
    let added = 0, dup = 0, bad = 0;
    (d.books || []).forEach(b => {
      if (!b || !b.name || !map[b.cat]) { bad++; return; }
      const nb = Object.assign({}, b, { cat: map[b.cat] }); delete nb.loan;
      const k = fp(nb); if (have.has(k)) { dup++; return; }
      if (!nb.id || ids.has(nb.id)) nb.id = newId();
      have.add(k); ids.add(nb.id); db.books.push(nb); added++;
    });
    save(); route();
    return { added, dup, bad, newCats };
  }
  $('mergeFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.books)) throw new Error('bad');
      const r = mergeFrom(d);
      toast(`✓ ${num(r.added)} نئی کتب شامل ہو گئیں` + (r.dup ? ` · ${num(r.dup)} پہلے سے موجود تھیں` : '') + (r.newCats ? ` · ${num(r.newCats)} نئے فن` : ''));
    } catch (err) { toast('یہ فائل درست بیک اپ نہیں ہے۔'); }
    e.target.value = '';
  });

  $('importFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.books)) throw new Error('bad');
      if (db.books.length && !confirm(`اس سے آپ کی موجودہ ${num(db.books.length)} کتب ہٹ کر فائل والی کتب آ جائیں گی۔\nاگر صرف نئی کتب شامل کرنی ہیں تو «کتب شامل کریں» والا بٹن استعمال کریں۔\n\nکیا پھر بھی بدلنا ہے؟`)) { e.target.value = ''; return; }
      db = normDb(d);
      if (d.lic && window.MA_LIC) window.MA_LIC.import(d.lic);
      if (d.brand && window.MA_BRAND) window.MA_BRAND.set(d.brand);
      save(); route(); toast(`بیک اپ سے ${num(db.books.length)} کتب واپس آ گئیں`);
    } catch (err) {
      toast('یہ فائل درست بیک اپ نہیں ہے۔');
    }
    e.target.value = '';
  });

  // ---------- نیچے کی پٹی: پیچھے / ہوم / آگے ----------
  const nav = window.navigation;
  function updateDock() {
    const atHome = !location.hash || location.hash === '#/' || location.hash === '#';
    $('navHome').classList.toggle('on', atHome && !gq.value);
    if (nav && 'canGoBack' in nav) {
      $('navBack').disabled = !nav.canGoBack;
      $('navFwd').disabled = !nav.canGoForward;
    }
  }
  $('navBack').addEventListener('click', () => {
    if (document.getElementById('sheet')) { $('sheetClose').click(); return; }
    if (nav && 'canGoBack' in nav && !nav.canGoBack) { location.hash = '#/'; return; }
    history.back();
  });
  $('navFwd').addEventListener('click', () => history.forward());
  $('navHome').addEventListener('click', () => {
    if (gq.value) { gq.value = ''; $('gqClear').hidden = true; }
    if (location.hash && location.hash !== '#/') location.hash = '#/';
    else route();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('hashchange', () => setTimeout(updateDock, 0));
  gq.addEventListener('input', updateDock);

  // ---------- بھیجنا (share.js) ----------
  window.MA_SHARE = { data: () => ({ books: db.books, cats: cats() }), toast };
  window.MA_DRIVE_HOST = {
    version: 'MA810TH057',
    toast,
    snapshot: () => ({ books: db.books, cats: db.cats, catNames: db.catNames, loanLog: db.loanLog, progs: db.progs, lic: window.MA_LIC ? window.MA_LIC.export() : undefined, brand: window.MA_BRAND ? window.MA_BRAND.get() : undefined }),
    replace: d => { db = normDb(d); save(); route(); if (d && d.lic && window.MA_LIC) window.MA_LIC.import(d.lic); if (d && d.brand && window.MA_BRAND) window.MA_BRAND.set(d.brand); }
  };
  // میرے پروگرام (programs.js) کے لیے
  window.MA_APP = {
    db: () => db, save, toast, view, openSheet, capRow, esc, num, newId, todayIso, dmy, waNum, route,
    icons: { I_USER, I_PHONE, I_HOME, I_CAL, I_NOTE, IC_MIC }
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-share-cat],[data-share-book]'); if (!t || !window.MA_SHARE_UI) return;
    if (t.dataset.shareCat) window.MA_SHARE_UI.open({ cat: t.dataset.shareCat });
    else if (t.dataset.shareBook) window.MA_SHARE_UI.open({ books: [t.dataset.shareBook] });
    else window.MA_SHARE_UI.open({});
  });

  route();
  updateDock();
})();
