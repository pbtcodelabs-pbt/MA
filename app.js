/* مکتبۃ العزیز — ایپ کا کوڈ (ورژن MA610TU001) */
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
      `<li><a class="home ${!active ? 'on' : ''}" href="#/">تمام فنون <span class="count">${num(db.books.length)}</span></a></li>` +
      CATS.map(c => `<li><a href="#/c/${c.id}" class="${active === c.id ? 'on' : ''}">${esc(c.name)} <span class="count">${num(booksOf(c.id).length)}</span></a></li>`).join('');
  }

  // ---------- صفحات ----------
  function pageHome() {
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h"><h2>فنون</h2><span class="crumb">کسی فن پر کلک کریں</span></div>
        <div class="panel-b">
          <div class="grid">
            ${CATS.map(c => `<a class="tile" href="#/c/${c.id}">${esc(c.name)} <span class="count">${num(booksOf(c.id).length)}</span></a>`).join('')}
          </div>
        </div>
      </section>`;
  }

  const ICON_ADD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M12 8v6M9 11h6"/></svg>';
  const ICON_LIST = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>';

  function catShell(cat, mode, body) {
    const n = booksOf(cat.id).length;
    view.innerHTML = `
      <section class="panel">
        <div class="panel-h">
          <h2>${esc(cat.name)}</h2>
          <span class="crumb">اس فن کی کتب: ${num(n)}</span>
        </div>
        <div class="panel-b">
          <div class="options">
            <a class="opt ${mode === 'add' || mode === 'edit' ? 'on' : ''}" href="#/c/${cat.id}/add">${ICON_ADD}<span>ایڈ کتب<small>نئی کتاب کا اندراج</small></span></a>
            <a class="opt ${mode === 'index' ? 'on' : ''}" href="#/c/${cat.id}/index">${ICON_LIST}<span>وزٹ انڈیکس<small>اس فن کی مکمل فہرست</small></span></a>
          </div>
        </div>
      </section>
      ${body || ''}`;
  }

  function pageAdd(cat, editId) {
    const b = editId ? db.books.find(x => x.id === editId && x.cat === cat.id) : null;
    if (editId && !b) { location.hash = `#/c/${cat.id}/index`; return; }
    catShell(cat, b ? 'edit' : 'add', `
      <section class="panel">
        <div class="panel-h"><h2>${b ? 'کتاب میں ترمیم' : 'ایڈ کتب'}</h2><span class="crumb">${esc(cat.name)}</span></div>
        <div class="panel-b">
          <form class="add" id="addForm" novalidate>
            <div class="field"><label for="f-name">کتاب کا نام</label><input id="f-name" required autocomplete="off" value="${esc(b?.name)}"></div>
            <div class="field"><label for="f-author">مصنف</label><input id="f-author" autocomplete="off" value="${esc(b?.author)}"></div>
            <div class="field"><label for="f-publisher">مکتبہ</label><input id="f-publisher" autocomplete="off" value="${esc(b?.publisher)}"></div>
            <div class="row2">
              <div class="field"><label for="f-parts">تعداد اجزاء</label><input id="f-parts" inputmode="numeric" autocomplete="off" value="${b ? ur(b.parts ?? '') : ''}"></div>
              <div class="field"><label for="f-price">قیمت (روپے)</label><input id="f-price" inputmode="decimal" autocomplete="off" value="${b ? ur(b.price ?? '') : ''}"></div>
            </div>
            <p class="err" id="f-err" role="alert"></p>
            <div class="actions">
              <button class="btn" type="submit">${b ? 'تبدیلی محفوظ کریں' : 'کتاب محفوظ کریں'}</button>
              <a class="btn ghost" href="#/c/${cat.id}/index">انڈیکس دیکھیں</a>
            </div>
          </form>
        </div>
      </section>`);

    $('f-name').focus();
    $('addForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('f-name').value.trim();
      const parts = parseNum($('f-parts').value);
      const price = parseNum($('f-price').value);
      const err = $('f-err');
      if (!name) { err.textContent = 'کتاب کا نام لکھنا ضروری ہے۔'; $('f-name').focus(); return; }
      if (Number.isNaN(parts)) { err.textContent = 'تعداد اجزاء میں صرف ہندسے لکھیں۔'; $('f-parts').focus(); return; }
      if (Number.isNaN(price)) { err.textContent = 'قیمت میں صرف ہندسے لکھیں۔'; $('f-price').focus(); return; }
      const rec = {
        name,
        author: $('f-author').value.trim(),
        publisher: $('f-publisher').value.trim(),
        parts: parts ?? 1,
        price: price ?? 0
      };
      if (b) {
        Object.assign(b, rec); save(); refreshCounts(cat.id);
        toast('تبدیلی محفوظ ہو گئی'); location.hash = `#/c/${cat.id}/index`;
      } else {
        db.books.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), cat: cat.id, added: new Date().toISOString(), ...rec });
        save(); toast(`«${name}» محفوظ ہو گئی`);
        pageAdd(cat); refreshCounts(cat.id);
      }
    });
  }

  function pageIndex(cat, q = '', pendingDel = null) {
    const all = booksOf(cat.id);
    const qq = q.trim();
    const list = qq ? all.filter(b => [b.name, b.author, b.publisher].some(v => (v || '').includes(qq))) : all;
    const priceShown = showCatPrice.has(cat.id);
    const delBook = pendingDel && all.find(b => b.id === pendingDel);

    let body;
    if (!all.length) {
      body = `<div class="empty"><b>اس فن میں ابھی کوئی کتاب درج نہیں</b>«ایڈ کتب» پر کلک کر کے پہلی کتاب شامل کریں۔</div>`;
    } else {
      body = `
        ${delBook ? `<div class="confirm"><span>«${esc(delBook.name)}» کو فہرست سے حذف کر دیں؟</span>
          <span class="actions"><button class="btn danger small" data-act="del-yes" data-id="${delBook.id}" type="button">ہاں، حذف کریں</button>
          <button class="btn ghost small" data-act="del-no" type="button">رہنے دیں</button></span></div>` : ''}
        <div class="tools">
          <input class="search" id="q" type="search" placeholder="نام، مصنف یا مکتبہ سے تلاش…" aria-label="تلاش" value="${esc(q)}">
          <a class="btn small" href="#/c/${cat.id}/add">+ نئی کتاب</a>
        </div>
        <div class="tbl"><table>
          <thead><tr><th>نمبر</th><th>کتاب کا نام</th><th>مصنف</th><th>مکتبہ</th><th>اجزاء</th><th>قیمت</th><th></th></tr></thead>
          <tbody>
            ${list.map(b => `<tr>
              <td class="n">${num(all.indexOf(b) + 1)}</td>
              <td class="t">${esc(b.name)}</td>
              <td>${esc(b.author) || '—'}</td>
              <td>${esc(b.publisher) || '—'}</td>
              <td class="n">${num(b.parts)}</td>
              <td class="n">${num(b.price)}</td>
              <td class="act"><a class="iconbtn" href="#/c/${cat.id}/edit/${b.id}">ترمیم</a><button class="iconbtn del" data-act="del" data-id="${b.id}" type="button">حذف</button></td>
            </tr>`).join('') || `<tr><td colspan="7" class="n">تلاش سے کوئی کتاب نہیں ملی</td></tr>`}
          </tbody>
          <tfoot><tr><td></td><td>کل: ${num(list.length)} کتب</td><td></td><td></td><td class="n">${num(sum(list, 'parts'))}</td><td class="n">${priceShown ? num(sum(list, 'price')) : ''}</td><td></td></tr></tfoot>
        </table></div>
        <div class="totals">
          <button class="btn gold" data-act="price" type="button">${priceShown ? 'کل قیمت چھپائیں' : 'اس فن کی کل قیمت'}</button>
          ${priceShown ? `<span class="price-out">کل قیمت: ${money(sum(list, 'price'))}</span>` : ''}
        </div>`;
    }

    catShell(cat, 'index', `
      <section class="panel">
        <div class="panel-h"><h2>انڈیکس — ${esc(cat.name)}</h2><span class="crumb">کل کتب: ${num(all.length)} · کل اجزاء: ${num(sum(all, 'parts'))}</span></div>
        <div class="panel-b" id="idx">${body}</div>
      </section>`);

    const qi = $('q');
    if (qi) {
      qi.addEventListener('input', () => {
        const pos = qi.selectionStart;
        pageIndex(cat, qi.value);
        const n = $('q'); n.focus(); n.setSelectionRange(pos, pos);
      });
    }
    $('idx').addEventListener('click', e => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'price') { priceShown ? showCatPrice.delete(cat.id) : showCatPrice.add(cat.id); pageIndex(cat, q); }
      if (act === 'del') pageIndex(cat, q, btn.dataset.id);
      if (act === 'del-no') pageIndex(cat, q);
      if (act === 'del-yes') {
        const i = db.books.findIndex(b => b.id === btn.dataset.id);
        if (i > -1) { const [gone] = db.books.splice(i, 1); save(); toast(`«${gone.name}» حذف ہو گئی`); }
        refreshCounts(cat.id); pageIndex(cat, q);
      }
    });
  }

  function refreshCounts(active) { renderSummary(); renderBar(active); }

  // ---------- راستے ----------
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    if (parts[0] === 'c' && catById(parts[1])) {
      const cat = catById(parts[1]);
      renderBar(cat.id);
      if (parts[2] === 'add') pageAdd(cat);
      else if (parts[2] === 'edit' && parts[3]) pageAdd(cat, parts[3]);
      else if (parts[2] === 'index') pageIndex(cat);
      else catShell(cat, null, '');
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
