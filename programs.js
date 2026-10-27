/* میرا مکتبہ — «شیڈیول»: جلسوں کی دعوتیں، اشتہار، رابطہ، الٹی گنتی اور رپورٹ
   ڈیٹا app.js کے db.progs میں رہتا ہے (اسی بیک اپ کے ساتھ Drive پر بھی جاتا ہے)۔ */
(() => {
  'use strict';
  const H = () => window.MA_APP;
  const $ = id => document.getElementById(id);
  const esc = s => H().esc(s);
  const num = n => H().num(n);

  const MONTHS = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
  const DAYS = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
  const TIME_NOTES = ['بعد از نماز فجر', 'بعد از نماز ظہر', 'خطبہ جمعہ', 'بعد از نماز عصر', 'بعد از نماز مغرب', 'بعد از نماز عشاء'];
  const FILTERS = [['15', '15 دن'], ['30', '30 دن'], ['60', '60 دن'], ['90', '90 دن'], ['all', 'سب آنے والے'], ['custom', 'مرضی کی تاریخ']];
  const PROVINCES = ['پنجاب', 'سندھ', 'خیبر پختونخوا', 'بلوچستان', 'اسلام آباد', 'گلگت بلتستان', 'آزاد کشمیر'];
  const FKEY = 'maktaba-aziz-prog-filter';

  const progs = () => { const d = H().db(); d.progs = d.progs || []; return d.progs; };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return iso(d); };
  const dateOf = s => new Date(String(s).slice(0, 10) + 'T00:00:00');
  const dmy = s => H().dmy(s);
  const dayName = s => DAYS[dateOf(s).getDay()];
  const longDate = s => { const d = dateOf(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  // وقت: «رات 8:30 بجے»
  function timeTxt(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const per = h < 4 ? 'رات' : h < 12 ? 'صبح' : h < 15 ? 'دوپہر' : h < 18 ? 'سہ پہر' : h < 20 ? 'شام' : 'رات';
    return `${per} ${(h % 12) || 12}:${String(m).padStart(2, '0')} بجے`;
  }
  const whenTxt = p => [timeTxt(p.time), p.timeNote].filter(Boolean).join(' · ');
  // پروگرام کا اصل وقت (وقت نہ لکھا ہو تو دن کا اختتام)
  const target = p => new Date(`${p.date}T${p.time || '23:59'}:00`);
  const dayDiff = p => Math.round((dateOf(p.date) - dateOf(iso(new Date()))) / 864e5);
  const isPast = p => target(p).getTime() < Date.now() - (p.time ? 3 * 3600e3 : 0);

  // فہرست کی ایک لائن کا خلاصہ: «جامع مسجد نور، جھنڈا والا میں پروگرام بعد از نماز عشاء»
  // ---------- لوکیشن (گوگل میپ) ----------
  // میزبان کا بھیجا ہوا لنک یا «عرض، طول» — اس سے نقطہ نکالیں
  function parseLoc(t) {
    t = String(t || '').trim(); if (!t) return null;
    const pats = [/@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, /[?&](?:q|query|ll|destination|daddr)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i, /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, /^(-?\d{1,2}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)$/, /(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/];
    for (const r of pats) { const m = t.match(r); if (m) { const la = +m[1], lo = +m[2]; if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) return { lat: la, lng: lo }; } }
    return null;
  }
  const urlIn = t => (String(t || '').match(/https?:\/\/\S+/) || [''])[0];
  const placeLabel = p => [p.place, p.city].filter(Boolean).join('، ') || 'پروگرام کی جگہ';
  function mapsUrl(p) {
    const label = placeLabel(p), pt = p.lat != null ? { lat: p.lat, lng: p.lng } : parseLoc(p.loc);
    if (pt) {
      // اینڈرائیڈ پر نقشہ نشان کے ساتھ جگہ کا نام بھی دکھاتا ہے
      if (/Android/i.test(navigator.userAgent)) return `geo:${pt.lat},${pt.lng}?q=${pt.lat},${pt.lng}(${encodeURIComponent(label)})`;
      return `https://www.google.com/maps/dir/?api=1&destination=${pt.lat},${pt.lng}`;
    }
    const u = urlIn(p.loc); if (u) return u;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.place, p.city, p.province].filter(Boolean).join(' '))}`;
  }
  const hasLoc = p => !!(p.loc || p.lat != null);

  const lineTxt = p => `${esc(p.place || 'پروگرام')}${p.city ? '، ' + esc(p.city) : ''} میں پروگرام${p.timeNote ? ' ' + esc(p.timeNote) : ''}`;

  function leftTxt(p) {
    const d = dayDiff(p);
    if (isPast(p)) return { t: 'ہو چکا', c: 'past' };
    if (d <= 0) {
      if (!p.time) return { t: 'آج', c: 'today' };
      const ms = target(p) - Date.now();
      if (ms <= 0) return { t: 'جاری ہے', c: 'today' };
      const h = Math.floor(ms / 3600e3), m = Math.floor(ms / 60e3) % 60;
      return { t: h ? `آج · ${num(h)} گھنٹے` : `آج · ${num(m)} منٹ`, c: 'today' };
    }
    if (d === 1) return { t: 'کل', c: 'soon' };
    return { t: `${num(d)} دن`, c: d <= 7 ? 'soon' : '' };
  }

  // ---------- فلٹر ----------
  let F = (() => { try { return JSON.parse(localStorage.getItem(FKEY)) || {}; } catch (e) { return {}; } })();
  if (F.k === 'past') F.k = '30';
  F = { k: F.k || '30', from: F.from || iso(new Date()), to: F.to || addDays(30) };
  const saveF = () => { try { localStorage.setItem(FKEY, JSON.stringify(F)); } catch (e) {} };
  function filtered() {
    const today = iso(new Date());
    let list = progs().slice();
    if (F.k === 'past') return list.filter(isPast).sort((a, b) => target(b) - target(a));
    if (F.k === 'custom') list = list.filter(p => p.date >= F.from && p.date <= F.to);
    else {
      list = list.filter(p => !isPast(p) && p.date >= today);
      if (F.k !== 'all') list = list.filter(p => p.date <= addDays(Number(F.k)));
    }
    return list.sort((a, b) => target(a) - target(b));
  }
  function rangeTxt() {
    const t = iso(new Date());
    if (F.k === 'past') return 'گزشتہ پروگرام';
    if (F.k === 'all') return 'تمام آنے والے پروگرام';
    if (F.k === 'custom') return `${dmy(F.from)} تا ${dmy(F.to)}`;
    return `اگلے ${F.k} دن (${dmy(t)} تا ${dmy(addDays(Number(F.k)))})`;
  }

  // اوپر کا عنوان: ایک طرف مکتبے کا لوگو، دوسری طرف مہتمم/مدیر کی تصویر؛ بیچ میں نام، عہدہ اور مکتبہ — جو صارف نے «پہچان» میں محفوظ کیا
  const BRD = () => { try { return JSON.parse(localStorage.getItem('maktaba-aziz-brand')) || {}; } catch (e) { return {}; } };
  function brandHead(sub) {
    const b = BRD(), B = window.MA_BRAND;
    const name = (b.name || '').trim() || 'میرا مکتبہ', logo = b.logo === 'default' ? 'icons/khatam-logo.png' : (b.logo || '');
    const who = (b.line1 || '').trim(), role = [b.line2, b.line3].map(x => (x || '').trim()).filter(Boolean).join(' · ');
    const tf = B ? B.titleFont(name) : '"JNN","Jameel Noori Nastaleeq",serif';
    return `<div class="pg-brand">
      <span class="pgb-logo">${logo ? `<img src="${esc(logo)}" alt="لوگو">` : '<i>لوگو</i>'}</span>
      <div class="pgb-t">
        ${who ? `<b class="pgb-who">${esc(who)}</b>` : ''}
        ${role ? `<span class="pgb-role">${esc(role)}</span>` : ''}
        <span class="pgb-name" style="font-family:${tf}">${esc(name)}</span>
        ${b.address ? `<span class="pgb-addr">📍 ${esc(b.address)}</span>` : ''}
        <span class="pgb-sub">${sub}</span>
        ${!b.name && !b.line1 ? '<button type="button" class="pgb-set" data-brand>✏️ اپنا نام اور مکتبہ لکھیں</button>' : ''}
      </div>
      <button type="button" class="pgb-logo pgb-photo" data-photo aria-label="تصویر لگائیں">${b.photo ? `<img src="${b.photo}" alt="تصویر">` : '<i>📷<br>تصویر</i>'}</button>
      ${b.photo ? '<button type="button" class="pgb-rm" data-photo-rm aria-label="تصویر ہٹائیں">✕</button>' : ''}
      <input type="file" accept="image/*" hidden data-photo-file>
    </div>`;
  }
  // تصویر: بیچ سے مربع کاٹ کر چھوٹی کریں
  function squarePic(file) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const S = 420, m = Math.min(img.width, img.height), cv = document.createElement('canvas'); cv.width = cv.height = S;
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S);
        ctx.drawImage(img, (img.width - m) / 2, Math.max(0, (img.height - m) / 3), m, m, 0, 0, S, S);
        URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
      img.src = url;
    });
  }
  function brandWire(v, again) {
    v.querySelector('[data-brand]')?.addEventListener('click', () => window.MA_BRAND.open());
    const inp = v.querySelector('[data-photo-file]'); if (!inp) return;
    const put = photo => { const B = window.MA_BRAND; if (!B) return; if (B.set(Object.assign(B.get(), { photo }))) { H().toast(photo ? 'تصویر محفوظ ہو گئی' : 'تصویر ہٹا دی'); again(); } else H().toast('تصویر محفوظ نہیں ہو سکی'); };
    v.querySelector('[data-photo]').addEventListener('click', () => inp.click());
    v.querySelector('[data-photo-rm]')?.addEventListener('click', () => { if (confirm('تصویر ہٹا دیں؟')) put(''); });
    inp.addEventListener('change', async () => { const f = inp.files[0]; if (!f) return; try { put(await squarePic(f)); } catch (e) { H().toast('یہ تصویر نہیں کھل سکی'); } });
  }

  // ---------- فہرست کا صفحہ ----------
  let tick = null;
  const stopTick = () => { clearInterval(tick); tick = null; };

  const tkDays = () => { try { const v = localStorage.getItem('maktaba-aziz-ticker-days'); return v === null ? 3 : Number(v); } catch (e) { return 3; } };
  function pageList() {
    const list = filtered();
    const upcoming = progs().filter(p => !isPast(p)).length;
    H().view.innerHTML = `
      <section class="panel prog-panel">
        <div class="panel-h prog-h">
          <h2 class="prog-title">شیڈیول</h2>
          <span class="actions"><button class="btn ghost small" type="button" id="pgRep">📄 رپورٹ</button><a class="btn" href="#/prog/add">+ نیا پروگرام</a></span>
        </div>
        <div class="panel-b">
          ${brandHead('آنے والے پروگراموں کا شیڈیول')}
          <div class="pg-filters" role="tablist">${FILTERS.map(([k, t]) => `<button type="button" class="pf${F.k === k ? ' on' : ''}" data-f="${k}">${t}</button>`).join('')}</div>
          <a class="pg-old-go" href="#/prog/old">📁 سابقہ پروگرام <b>${num(progs().filter(isPast).length)}</b><span>‹</span></a>
          <div class="pg-tk"><span>مین صفحے کی چلتی پٹی:</span>${[[0, 'بند'], [1, 'آج'], [2, '2 دن'], [3, '3 دن'], [7, '7 دن']].map(([d, t]) => `<button type="button" class="pf${tkDays() === d ? ' on' : ''}" data-tk="${d}">${t}</button>`).join('')}</div>
          ${F.k === 'custom' ? `<div class="pg-range"><label>سے <input type="date" id="pgFrom" class="numin" value="${F.from}"></label><label>تک <input type="date" id="pgTo" class="numin" value="${F.to}"></label></div>` : ''}
          <div class="pg-sum"><span>${esc(rangeTxt())}</span><b>${num(list.length)} پروگرام</b></div>
          ${list.length ? `<div class="pg-list">${list.map(rowHtml).join('')}</div>`
          : `<div class="empty pg-empty"><b>${progs().length ? 'اس مدت میں کوئی پروگرام نہیں' : 'ابھی کوئی پروگرام درج نہیں'}</b>${progs().length ? `کل آنے والے پروگرام: ${num(upcoming)} — اوپر سے مدت بدل کر دیکھیں۔` : '«+ نیا پروگرام» دبا کر پہلی دعوت درج کریں۔'}</div>`}
        </div>
      </section>`;
    brandWire(H().view, pageList);
    H().view.querySelector('.pg-tk').addEventListener('click', e => {
      const b = e.target.closest('[data-tk]'); if (!b) return;
      try { localStorage.setItem('maktaba-aziz-ticker-days', b.dataset.tk); } catch (er) {}
      H().toast(b.dataset.tk === '0' ? 'مین صفحے کی پٹی بند' : `مین صفحے پر آنے والے ${b.dataset.tk === '1' ? 'آج کے' : b.dataset.tk + ' دن کے'} پروگرام چلیں گے`); pageList();
    });
    H().view.querySelector('.pg-filters').addEventListener('click', e => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      F.k = b.dataset.f; saveF(); pageList();
    });
    $('pgFrom')?.addEventListener('change', e => { F.from = e.target.value || F.from; saveF(); pageList(); });
    $('pgTo')?.addEventListener('change', e => { F.to = e.target.value || F.to; saveF(); pageList(); });
    $('pgRep').addEventListener('click', openReport);
    // لائنوں میں «آج · گھنٹے» تازہ رہے
    stopTick(); tick = setInterval(() => { if (!document.querySelector('.pg-list')) return stopTick(); document.querySelectorAll('.pg-row[data-id]').forEach(r => { const p = progs().find(x => x.id === r.dataset.id); if (!p) return; const L = leftTxt(p); const el = r.querySelector('.pg-left'); el.textContent = L.t; el.className = 'pg-left ' + L.c; }); }, 30000);
  }

  function rowHtml(p) {
    const d = dateOf(p.date), L = leftTxt(p);
    return `<a class="pg-row${isPast(p) ? ' past' : ''}" href="#/prog/p/${p.id}" data-id="${p.id}">
      <span class="pg-date"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span><small>${DAYS[d.getDay()]}</small></span>
      <span class="pg-txt">
        ${p.title ? `<em>${esc(p.title)}</em>` : ''}
        <b>${lineTxt(p)}</b>
        <small>${hasLoc(p) ? '📍 ' : ''}${p.time ? esc(timeTxt(p.time)) + ' · ' : ''}${p.inviter ? 'میزبان: ' + esc(p.inviter) : ''}</small>
      </span>
      <span class="pg-end">${p.poster ? `<img class="pg-thumb" src="${p.poster}" alt="">` : ''}<span class="pg-left ${L.c}">${L.t}</span></span>
    </a>`;
  }

  // ---------- ایک پروگرام کا پورا صفحہ ----------
  function pageOne(id, confirmDel = false) {
    const p = progs().find(x => x.id === id);
    if (!p) { location.replace('#/prog'); return; }
    const phone = p.phone ? esc(p.phone) : '';
    const wa = H().waNum(p.phone);
    H().view.innerHTML = `
      <section class="panel prog-panel">
        <div class="panel-h prog-h"><a class="back" href="${isPast(p) ? '#/prog/old' : '#/prog'}">→ ${isPast(p) ? 'سابقہ پروگرام' : 'شیڈیول'}</a><span class="pg-left ${leftTxt(p).c}">${dayName(p.date)}</span></div>
        <div class="panel-b pg-one" id="pgOne">
          ${p.title ? `<p class="po-topic">${esc(p.title)}</p>` : ''}
          <h2 class="po-place">${esc(p.place || 'پروگرام')}${p.city ? `<span>${esc(p.city)}</span>` : ''}</h2>
          <div class="po-count" id="poCount" aria-live="polite"></div>
          <div class="po-cards">
            <div class="po-card"><span class="po-ico">${H().icons.I_CAL}</span><span><small>تاریخ</small><b>${longDate(p.date)} · ${dayName(p.date)}</b></span></div>
            ${whenTxt(p) ? `<div class="po-card"><span class="po-ico">🕒</span><span><small>وقت</small><b>${esc(whenTxt(p))}</b></span></div>` : ''}
            <div class="po-card"><span class="po-ico">🕌</span><span><small>بمقام</small><b>${esc(p.place || '—')}</b></span></div>
            ${p.city || p.province ? `<div class="po-card"><span class="po-ico">📍</span><span><small>شہر</small><b>${esc([p.city, p.province].filter(Boolean).join('، '))}</b></span></div>` : ''}
          </div>
          <div class="po-loc${hasLoc(p) ? '' : ' none'}">
            <div class="pl-t"><span class="po-ico">📍</span><span><small>بمقام</small><b>${esc(placeLabel(p))}</b><em>${hasLoc(p) ? 'لوکیشن محفوظ ہے' : 'لوکیشن ابھی محفوظ نہیں — نام سے نقشے میں ڈھونڈیں گے'}</em></span></div>
            <div class="pl-btns"><a class="pl-go" href="${esc(mapsUrl(p))}"${mapsUrl(p).startsWith('geo:') ? '' : ' target="_blank" rel="noopener"'}>🧭 راستہ دکھائیں</a>${hasLoc(p) ? `<button type="button" class="pl-sh" data-a="locshare">📤 لوکیشن بھیجیں</button>` : `<a class="pl-sh" href="#/prog/edit/${p.id}">➕ لوکیشن لگائیں</a>`}</div>
          </div>
          ${p.inviter || p.phone ? `<div class="po-inviter">
            <div class="pi-who"><span class="po-ico">${H().icons.I_USER}</span><span><small>میزبان</small><b>${esc(p.inviter || '—')}</b>${phone ? `<bdi dir="ltr">${phone}</bdi>` : ''}</span></div>
            ${phone ? `<div class="pi-btns">
              <a class="pi-call" href="tel:${phone}">${H().icons.I_PHONE}<span>کال کریں</span></a>
              <a class="pi-wa" href="https://wa.me/${wa}?text=${encodeURIComponent('السلام علیکم ورحمۃ اللہ وبرکاتہ')}" target="_blank" rel="noopener"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg><span>واٹس ایپ</span></a>
            </div>` : ''}
          </div>` : ''}
          ${p.note ? `<div class="po-note">${esc(p.note)}</div>` : ''}
          ${p.poster ? `<figure class="po-poster"><img src="${p.poster}" alt="پروگرام کا اشتہار" id="poImg"><figcaption>اشتہار — بڑا دیکھنے کے لیے چھوئیں</figcaption></figure>` : ''}
          ${confirmDel ? `<div class="confirm"><span>یہ پروگرام حذف کر دیں؟</span><span class="actions"><button class="btn danger small" data-a="del-yes" type="button">ہاں، حذف کریں</button><button class="btn ghost small" data-a="del-no" type="button">رہنے دیں</button></span></div>` : ''}
          <div class="actions po-acts">
            <a class="btn" href="#/prog/edit/${p.id}">ترمیم کریں</a>
            <button class="btn po-pp" type="button" data-a="pposter">🖼️ پوسٹر بنائیں</button>
            <button class="btn ghost" type="button" data-a="share">بھیجیں</button>
            <button class="btn ghost" type="button" data-a="del">حذف کریں</button>
          </div>
        </div>
      </section>`;
    $('pgOne').addEventListener('click', e => {
      if (e.target.id === 'poImg') { viewPoster(p); return; }
      const t = e.target.closest('[data-a]'); if (!t) return;
      const a = t.dataset.a;
      if (a === 'del') pageOne(id, true);
      if (a === 'del-no') pageOne(id);
      if (a === 'del-yes') { const d = H().db(); d.progs = progs().filter(x => x.id !== id); H().save(); H().toast('پروگرام حذف ہو گیا'); location.replace('#/prog'); }
      if (a === 'share') shareOne(p);
      if (a === 'pposter') { if (window.MA_PPOSTER) window.MA_PPOSTER.open(p, { textOf, toast: m => H().toast(m), save: () => H().save() }); }
      if (a === 'locshare') { const pt = p.lat != null ? { lat: p.lat, lng: p.lng } : parseLoc(p.loc); const link = pt ? `https://maps.google.com/?q=${pt.lat},${pt.lng}` : urlIn(p.loc); const tx = `📍 بمقام: ${placeLabel(p)}\n${link}`; if (navigator.share) navigator.share({ text: tx }).catch(() => {}); else location.href = 'https://wa.me/?text=' + encodeURIComponent(tx); }
    });
    const draw = () => {
      const el = $('poCount'); if (!el) return stopTick();
      el.innerHTML = countHtml(p);
    };
    draw(); stopTick(); tick = setInterval(draw, 1000);
  }

  // الٹی گنتی: دن · گھنٹے · منٹ · سیکنڈ
  function countHtml(p) {
    const ms = target(p) - Date.now();
    if (isPast(p)) return `<div class="pc-done">یہ پروگرام ہو چکا ہے</div>`;
    if (ms <= 0) return `<div class="pc-done live">پروگرام جاری ہے</div>`;
    if (!p.time) {
      const d = dayDiff(p);
      return d <= 0 ? `<div class="pc-done live">آج پروگرام ہے</div>` : `<div class="pc-boxes"><span class="pcb big"><b>${num(d)}</b><small>دن باقی</small></span></div>`;
    }
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, sec = s % 60;
    const box = (v, t) => `<span class="pcb"><b>${String(v).padStart(2, '0')}</b><small>${t}</small></span>`;
    return `<div class="pc-boxes">${d ? box(d, 'دن') : ''}${box(h, 'گھنٹے')}${box(m, 'منٹ')}${box(sec, 'سیکنڈ')}</div><div class="pc-cap">${d ? `${num(d)} دن باقی` : 'آج کا پروگرام'}</div>`;
  }

  function viewPoster(p) {
    const w = document.createElement('div');
    w.className = 'po-full';
    w.innerHTML = `<img src="${p.poster}" alt=""><div class="pf-bar"><button type="button" class="btn small" data-x="share">تصویر بھیجیں</button><button type="button" class="btn ghost small" data-x="close">✕ بند</button></div>`;
    document.body.appendChild(w);
    w.addEventListener('click', e => {
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'share') sharePoster(p);
      else if (x === 'close' || e.target === w || e.target.tagName === 'IMG') w.remove();
    });
  }
  const dataUrlBlob = u => { const [h, b] = u.split(','); const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: h.match(/:(.*?);/)[1] }); };
  function textOf(p) {
    return [
      p.title ? `*${p.title}*` : '*پروگرام*',
      `📅 تاریخ: ${longDate(p.date)} (${dayName(p.date)})`,
      whenTxt(p) ? `🕒 وقت: ${whenTxt(p)}` : '',
      `🕌 بمقام: ${p.place || '—'}`,
      p.city ? `📍 شہر: ${p.city}` : '',
      p.inviter || p.phone ? `👤 میزبان: ${[p.inviter, p.phone].filter(Boolean).join(' — ')}` : '',
      p.note ? `📝 ${p.note}` : '',
      hasLoc(p) ? `🧭 لوکیشن: ${(() => { const pt = p.lat != null ? { lat: p.lat, lng: p.lng } : parseLoc(p.loc); return pt ? `https://maps.google.com/?q=${pt.lat},${pt.lng}` : urlIn(p.loc); })()}` : ''
    ].filter(Boolean).join('\n') + brandSign();
  }
  // مکتبے کی پہچان — پیغام کے آخر میں
  function brandSign() {
    const b = window.MA_BRAND ? window.MA_BRAND.get() : {};
    const n = window.MA_BRAND ? window.MA_BRAND.name() : '';
    const parts = [n, (b.line1 || '').trim(), (b.phone || '').trim() ? '📞 ' + b.phone.trim() : ''].filter(Boolean);
    return parts.length ? '\n━━━━━━━━━━\n' + parts.join('\n') : '';
  }
  async function shareOne(p) {
    const text = textOf(p);
    if (p.poster && navigator.canShare) {
      const f = new File([dataUrlBlob(p.poster)], 'program.jpg', { type: 'image/jpeg' });
      if (navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    }
    location.href = 'https://wa.me/?text=' + encodeURIComponent(text);
  }
  async function sharePoster(p) {
    const blob = dataUrlBlob(p.poster);
    const k = window.MA_SHARE_UI?.kit;
    if (k) await k.deliver(blob, `program-${p.date}.jpg`, 'پروگرام کا اشتہار');
  }

  // ---------- نیا پروگرام / ترمیم ----------
  function openForm(editId) {
    const p = editId ? progs().find(x => x.id === editId) : null;
    if (editId && !p) { location.replace('#/prog'); return; }
    if (p) pageOne(p.id); else pageList();
    const back = p ? `#/prog/p/${p.id}` : '#/prog';
    const uniq = k => [...new Set(progs().map(x => (x[k] || '').trim()).filter(Boolean))];
    let poster = p?.poster || '';
    let saved = false;
    // چھوٹا خانہ: اوپر عنوان، نیچے لکھنے کی جگہ
    const fld = (id, label, attrs, cls = '') => `<label class="pf-f ${cls}" for="${id}"><span>${label}</span><input id="${id}" autocomplete="off" ${attrs}></label>`;
    const { close, wrap } = H().openSheet(p ? 'پروگرام میں ترمیم' : 'نیا پروگرام', `
      <form class="sheet-b pf-form" id="pgForm" novalidate>
        <div class="pf-grid">
          <div class="pf-f full wd-wrap"><span>تاریخ</span><div class="wd-dayc"><b id="wdDay"></b></div><div class="wd"><div class="wd-col" id="wdD" aria-label="تاریخ"></div><div class="wd-col wide" id="wdM" aria-label="مہینہ"></div><div class="wd-col" id="wdY" aria-label="سال"></div></div><input type="hidden" id="p-date" value="${esc(p?.date || iso(new Date()))}"></div>
          <label class="pf-f" for="p-tnote"><span>وقت</span><select id="p-tnote">${(() => { const cur = p ? (p.timeNote || '') : 'بعد از نماز عشاء'; const list = TIME_NOTES.includes(cur) || !cur ? TIME_NOTES : [cur, ...TIME_NOTES]; return list.map(v => `<option${v === cur ? ' selected' : ''}>${v}</option>`).join(''); })()}</select></label>
          ${fld('p-place', 'بمقام', `value="${esc(p?.place || '')}" placeholder="جامع مسجد نور"`)}
          ${fld('p-city', 'شہر', `value="${esc(p?.city || '')}" placeholder="کلور کوٹ"`)}
          <label class="pf-f" for="p-prov"><span>صوبہ</span><select id="p-prov"><option value="">—</option>${PROVINCES.map(v => `<option${p && p.province === v ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
          ${fld('p-inv', 'میزبان', `value="${esc(p?.inviter || '')}" placeholder="مکمل نام"`)}
          ${fld('p-phone', 'موبائل', `class="ltr" inputmode="tel" value="${esc(p?.phone || '')}" placeholder="0300-1234567"`)}
          ${fld('p-title', 'عنوان', `value="${esc(p?.title || '')}" placeholder="اختیاری"`)}
          ${fld('p-note', 'نوٹ', `value="${esc(p?.note || '')}" placeholder="اختیاری"`)}
          <div class="pf-f full loc-f"><span>📍 جلسے کی جگہ کی لوکیشن <em id="locSt"></em></span>
            <input id="p-loc" dir="ltr" autocomplete="off" placeholder="میزبان کا بھیجا ہوا گوگل میپ لنک یہاں پیسٹ کریں" value="${esc(p?.loc || '')}">
            <div class="loc-b"><button type="button" data-l="paste">📋 پیسٹ کریں</button><button type="button" data-l="ask">💬 میزبان سے مانگیں</button><button type="button" data-l="here">📡 میں یہیں ہوں</button><button type="button" data-l="test">🧭 جانچیں</button></div>
          </div>
          <div class="pf-f full pp-row"><span>اشتہار</span><div class="pp-box" id="ppBox"></div><input type="file" id="p-img" accept="image/*" hidden></div>
        </div>
        <datalist id="dl-place">${uniq('place').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
        <datalist id="dl-city">${uniq('city').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
        <datalist id="dl-inv">${uniq('inviter').map(v => `<option value="${esc(v)}">`).join('')}</datalist>
        <p class="err" id="p-err" role="alert"></p>
        <button class="btn save" type="submit">💾 ${p ? 'تبدیلی محفوظ کریں' : 'پروگرام محفوظ کریں'}</button>
      </form>`, () => { if (!saved && /\/prog\/(add|edit)/.test(location.hash)) location.replace(back); });
    wrap.querySelector('.sheet').classList.add('pg-sheet');
    const drawPoster = () => {
      $('ppBox').innerHTML = poster
        ? `<img src="${poster}" alt=""><span class="pp-acts"><button type="button" class="btn small" data-pp="pick">بدلیں</button><button type="button" class="btn ghost small" data-pp="rm">ہٹائیں</button></span>`
        : `<button type="button" class="pp-pick" data-pp="pick">🖼️ + تصویر لگائیں</button>`;
      $('ppBox').insertAdjacentHTML('beforeend', '<small class="pp-note" style="display:block;width:100%;font-size:12px;opacity:.75;margin-top:4px">پروگرام کے 3 دن بعد اشتہار خود ہٹ جاتا ہے، تاکہ فون کی جگہ نہ بھرے</small>');
    };
    drawPoster();
    // لوکیشن کے بٹن
    const locSt = () => { const v = $('p-loc').value.trim(), pt = parseLoc(v); $('locSt').textContent = !v ? '' : pt ? '✓ درست لوکیشن' : urlIn(v) ? '✓ لنک محفوظ ہوگا' : '⚠ یہ لنک یا نقطہ نہیں لگتا'; $('locSt').className = pt || urlIn(v) ? 'ok' : (v ? 'bad' : ''); };
    $('p-loc').addEventListener('input', locSt); locSt();
    wrap.querySelector('.loc-b').addEventListener('click', async e => {
      const a = e.target.closest('[data-l]')?.dataset.l; if (!a) return;
      if (a === 'paste') { try { const t = await navigator.clipboard.readText(); if (t) { $('p-loc').value = (urlIn(t) || t).trim(); locSt(); H().toast('لوکیشن لگ گئی'); } else H().toast('کاپی کیا ہوا کچھ نہیں ملا'); } catch (er) { H().toast('خانے میں دیر تک دبا کر «پیسٹ» کریں'); $('p-loc').focus(); } }
      if (a === 'ask') { const ph = H().waNum($('p-phone').value); const msg = `السلام علیکم ورحمۃ اللہ وبرکاتہ\nبراہِ کرم جلسے کی جگہ${$('p-place').value.trim() ? ` (بمقام: ${$('p-place').value.trim()}${$('p-city').value.trim() ? '، ' + $('p-city').value.trim() : ''})` : ''} کی گوگل میپ لوکیشن بھیج دیں۔ جزاک اللہ خیراً`; window.open(`https://wa.me/${ph || ''}?text=${encodeURIComponent(msg)}`, '_blank'); }
      if (a === 'here') { if (!navigator.geolocation) { H().toast('اس فون میں لوکیشن نہیں مل سکی'); return; } H().toast('لوکیشن لی جا رہی ہے…'); navigator.geolocation.getCurrentPosition(pos => { $('p-loc').value = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`; locSt(); H().toast('✓ یہاں کی لوکیشن لگ گئی'); }, () => H().toast('لوکیشن کی اجازت نہیں ملی'), { enableHighAccuracy: true, timeout: 15000 }); }
      if (a === 'test') { const tmp = { place: $('p-place').value.trim(), city: $('p-city').value.trim(), loc: $('p-loc').value.trim() }; { const u = mapsUrl(tmp); if (u.startsWith('geo:')) location.href = u; else window.open(u, '_blank'); } }
    });
    $('ppBox').addEventListener('click', e => {
      const a = e.target.closest('[data-pp]')?.dataset.pp;
      if (a === 'pick') $('p-img').click();
      if (a === 'rm') { poster = ''; drawPoster(); }
    });
    $('p-img').addEventListener('change', async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      $('ppBox').innerHTML = '<span class="pp-wait">تصویر تیار ہو رہی ہے…</span>';
      try { poster = await shrink(f); } catch (err) { H().toast('یہ تصویر نہیں کھل سکی'); }
      drawPoster();
    });
    // ہر خانے میں پہلے محفوظ کی ہوئی چیزوں کے مشورے — لفظ کہیں بھی ملے (مثلاً «والا» → «عارف والا»)، جو زیادہ بار لکھا گیا وہ اوپر
    (() => {
      const all = progs();
      const freq = k => { const m = new Map(); all.forEach(x => { const v = (x[k] || '').trim(); if (v) m.set(v, (m.get(v) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]); };
      const last = (k, v) => [...all].reverse().find(x => (x[k] || '').trim() === v);
      const fill = (id, v) => { const el = $(id); if (el && v && !el.value.trim()) el.value = v; };
      const after = {
        'p-place': v => { const x = last('place', v); if (x) { fill('p-city', x.city); if (x.province && !$('p-prov').value) $('p-prov').value = x.province; } },
        'p-city': v => { const x = last('city', v); if (x && x.province) $('p-prov').value = x.province; },
        'p-inv': v => { const x = last('inviter', v); if (x) fill('p-phone', x.phone); },
        'p-phone': v => { const x = last('phone', v); if (x) fill('p-inv', x.inviter); }
      };
      [['p-place', 'place'], ['p-city', 'city'], ['p-inv', 'inviter'], ['p-phone', 'phone'], ['p-title', 'title'], ['p-note', 'note']].forEach(([id, k]) => {
        const inp = $(id); if (!inp) return;
        const vals = freq(k); if (!vals.length) return;
        const box = document.createElement('div'); box.className = 'sg-box'; box.hidden = true;
        inp.closest('.pf-f').appendChild(box);
        const show = () => {
          const q = inp.value.trim().toLowerCase();
          const m = (q ? vals.filter(v => v.toLowerCase().includes(q) && v !== inp.value.trim()) : vals).slice(0, 6);
          if (!m.length) { box.hidden = true; return; }
          box.innerHTML = m.map(v => `<button type="button" class="sg-i" data-v="${esc(v)}">${esc(v)}</button>`).join('');
          box.hidden = false;
        };
        inp.addEventListener('input', show); inp.addEventListener('focus', show);
        inp.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 180));
        box.addEventListener('pointerdown', e => e.preventDefault());   // کی بورڈ بند نہ ہو
        box.addEventListener('click', e => {
          const b = e.target.closest('.sg-i'); if (!b) return;
          inp.value = b.dataset.v; box.hidden = true;
          if (after[id]) after[id](b.dataset.v);
          inp.dispatchEvent(new Event('change'));
        });
        inp.addEventListener('change', () => { if (after[id] && vals.includes(inp.value.trim())) after[id](inp.value.trim()); });
      });
    })();
    // پہلے والے میزبان کا نمبر خود بھر جائے
    $('p-inv').addEventListener('change', () => {
      const prev = [...progs()].reverse().find(x => x.inviter === $('p-inv').value.trim());
      if (prev && !$('p-phone').value) $('p-phone').value = prev.phone || '';
    });
    // تاریخ کے تین پہیے: دن، مہینہ، سال — گھما کر چنیں، ساتھ ہفتے کا دن
    (() => {
      const IH = 30, now = new Date().getFullYear();
      const years = []; for (let y = now - 3; y <= now + 6; y++) years.push(y);
      let [Y, Mo, D] = ($('p-date').value || iso(new Date())).split('-').map(Number);
      if (!years.includes(Y)) years.push(Y), years.sort((a, b) => a - b);
      const dim = () => new Date(Y, Mo, 0).getDate();
      const sync = () => {
        D = Math.min(D, dim());
        const v = `${Y}-${String(Mo).padStart(2, '0')}-${String(D).padStart(2, '0')}`;
        $('p-date').value = v; $('wdDay').textContent = DAYS[dateOf(v).getDay()];
      };
      function wheel(el, items, idx, onPick) {
        el.innerHTML = `<div class="wd-pad"></div>${items.map((t, i) => `<div class="wd-i" data-i="${i}">${t}</div>`).join('')}<div class="wd-pad"></div>`;
        el.scrollTop = idx * IH;
        const its = [...el.querySelectorAll('.wd-i')];
        // پہیے کا احساس: بیچ والا بڑا اور صاف، اوپر نیچے والے چھوٹے، دھندلے اور جھکے ہوئے
        const fx = () => { const st = el.scrollTop; its.forEach((x, i) => { const d = (i * IH - st) / IH, a = Math.min(2.2, Math.abs(d)); x.style.transform = `perspective(200px) rotateX(${(-d * 22).toFixed(1)}deg) scale(${(1 - a * .12).toFixed(3)})`; x.style.opacity = '1'; }); };
        const mark = i => { its.forEach(x => x.classList.toggle('on', +x.dataset.i === i)); fx(); };
        el.addEventListener('scroll', () => requestAnimationFrame(fx), { passive: true });
        mark(idx);
        let t = null, last = idx;
        el.onscroll = () => { const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / IH))); if (i !== last) { last = i; mark(i); onPick(i); } clearTimeout(t); t = setTimeout(() => { if (Math.abs(el.scrollTop - last * IH) > 1) el.scrollTo({ top: last * IH, behavior: 'smooth' }); }, 120); };
        el.onclick = e => { const it = e.target.closest('.wd-i'); if (it) el.scrollTo({ top: +it.dataset.i * IH, behavior: 'smooth' }); };
      }
      const days = () => Array.from({ length: dim() }, (_, i) => i + 1);
      const drawDays = () => wheel($('wdD'), days(), Math.min(D, dim()) - 1, i => { D = i + 1; sync(); });
      drawDays();
      wheel($('wdM'), MONTHS, Mo - 1, i => { const n = dim(); Mo = i + 1; if (dim() !== n) drawDays(); sync(); });
      wheel($('wdY'), years, years.indexOf(Y), i => { const n = dim(); Y = years[i]; if (dim() !== n) drawDays(); sync(); });
      sync();
    })();
    setTimeout(() => (p ? $('p-place') : null)?.focus(), 60);
    $('pgForm').addEventListener('submit', e => {
      e.preventDefault();
      const err = $('p-err');
      const rec = {
        title: $('p-title').value.trim(), date: $('p-date').value, time: '', timeNote: $('p-tnote').value.trim(),
        place: $('p-place').value.trim(), city: $('p-city').value.trim(), province: $('p-prov').value, inviter: $('p-inv').value.trim(), phone: $('p-phone').value.trim(),
        note: $('p-note').value.trim(), poster, loc: $('p-loc').value.trim(), lat: (parseLoc($('p-loc').value) || {}).lat ?? null, lng: (parseLoc($('p-loc').value) || {}).lng ?? null
      };
      if (!rec.date) { err.textContent = 'پروگرام کی تاریخ چنیں'; return; }
      rec.day = dayName(rec.date);
      if (!rec.place && !rec.city) { err.textContent = 'بمقام یا شہر میں سے کچھ لکھیں'; $('p-place').focus(); return; }
      let id;
      if (p) { Object.assign(p, rec); id = p.id; }
      else { id = H().newId(); progs().push({ id, added: new Date().toISOString(), ...rec }); }
      saved = true; H().save(); close();
      H().toast(p ? 'تبدیلی محفوظ ہو گئی' : 'پروگرام محفوظ ہو گیا');
      location.replace(`#/prog/p/${id}`);
    });
  }

  // تصویر چھوٹی کر کے محفوظ (فون کی جگہ اور بیک اپ ہلکا رہے)
  function shrink(file) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1100, r = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r);
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        res(cv.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
      img.src = url;
    });
  }

  // ---------- رپورٹ: PDF، واٹس ایپ، پرنٹ ----------
  function openReport() {
    const list = filtered();
    const { close } = H().openSheet('پروگراموں کی رپورٹ', `
      <div class="sheet-b pg-rep">
        <div class="pg-filters">${FILTERS.map(([k, t]) => `<button type="button" class="pf${F.k === k ? ' on' : ''}" data-f="${k}">${t}</button>`).join('')}</div>
        ${F.k === 'custom' ? `<div class="pg-range"><label>سے <input type="date" id="rpFrom" class="numin" value="${F.from}"></label><label>تک <input type="date" id="rpTo" class="numin" value="${F.to}"></label></div>` : ''}
        <p class="pg-sum"><span>${esc(rangeTxt())}</span><b>${num(list.length)} پروگرام</b></p>
        <div class="pr-btns">
          <button class="btn" type="button" data-r="pdf" ${list.length ? '' : 'disabled'}>📄 PDF / پرنٹ</button>
          <button class="btn ghost" type="button" data-r="wa" ${list.length ? '' : 'disabled'}>واٹس ایپ</button>
          <button class="btn ghost" type="button" data-r="copy" ${list.length ? '' : 'disabled'}>کاپی</button>
        </div>
        <p class="hint center">PDF کھول کر فون سے پرنٹ بھی کیا جا سکتا ہے</p>
      </div>`);
    const re = () => { close(); if (location.hash.startsWith('#/prog') && !location.hash.includes('/p/')) pageList(); openReport(); };
    document.querySelector('.pg-rep .pg-filters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; F.k = b.dataset.f; saveF(); re(); });
    $('rpFrom')?.addEventListener('change', e => { F.from = e.target.value || F.from; saveF(); re(); });
    $('rpTo')?.addEventListener('change', e => { F.to = e.target.value || F.to; saveF(); re(); });
    document.querySelector('.pr-btns').addEventListener('click', async e => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      const k = window.MA_SHARE_UI?.kit;
      const text = (k?.brandText ? k.brandText() + '\n' : '') + `*شیڈیول — ${rangeTxt()}*\n\n` + list.map((p, i) => `${i + 1}) ${longDate(p.date)} (${dayName(p.date)})${whenTxt(p) ? ' · ' + whenTxt(p) : ''}\n   ${p.place || ''}${p.city ? '، ' + p.city : ''}${p.inviter || p.phone ? `\n   میزبان: ${[p.inviter, p.phone].filter(Boolean).join(' — ')}` : ''}`).join('\n\n') + (k?.creditText || '');
      if (b.dataset.r === 'wa') { if (text.length <= 3500) location.href = 'https://wa.me/?text=' + encodeURIComponent(text); else if (navigator.share) navigator.share({ text }).catch(() => {}); else { await k.copyText(text); H().toast('کاپی ہو گئی — واٹس ایپ میں پیسٹ کریں'); } return; }
      if (b.dataset.r === 'copy') { H().toast(await k.copyText(text) ? 'رپورٹ کاپی ہو گئی' : 'کاپی نہیں ہو سکی'); return; }
      close(); openPdfPreview(list, { title: `شیڈیول — ${rangeTxt()}`, cont: 'شیڈیول (جاری)', foot: 'شیڈیول', file: 'mere-programs' });
    });
  }

  // A4 پر 1 سے 4 کالم، ہر پروگرام اپنے خانے میں — کوئی خانہ بیچ سے نہ کٹے، جگہ ختم ہو تو اگلا کالم/صفحہ؛ اشتہار شامل نہیں
  async function progPdf(list, meta, N) {
    // تاریخ کی ترتیب سے (پرانی پہلے)، مہینہ وار
    list = [...list].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const k = window.MA_SHARE_UI.kit; await k.ready();
    const { W, H: PH, M, TOP, BOT } = k.PAGE, FONT = k.FONT;
    const C = { c1: '#14463a', c2: '#1f6a54', gold: '#c8962f', gold2: '#e8c467', fg: '#2b2620', muted: '#6d6455', line: '#e4d6b0' };
    const s = [1.12, 1, .86, .76][N - 1], SC = N > 2 ? 2 : 1.5;   // زیادہ کالموں میں باریک حروف کے لیے زیادہ صاف تصویر
    const GAP = N > 2 ? 14 : 22, CW = (W - 2 * M - GAP * (N - 1)) / N, PAD = Math.round(16 * s);
    const meas = document.createElement('canvas').getContext('2d');
    const LH = f => Math.round(f * 1.75), F = n => Math.round(n * s);
    const box = (p, i) => {
      const tw = CW - 2 * PAD, lines = [];
      const add = (label, val, fs, color) => { if (!val) return; meas.font = `${fs}px ${FONT}`; k.wrap(meas, label ? `${label}: ${val}` : val, tw).forEach(t => lines.push({ t, fs, color })); };
      const when = p.timeNote || timeTxt(p.time) || '';
      add('بمقام', [p.place, p.city, p.province].filter(Boolean).join('، '), F(21), C.fg);
      add('موضوع', p.title, F(20), C.c1);
      if (N === 1) add('میزبان', [p.inviter, p.phone ? `⁦${p.phone}⁩` : ''].filter(Boolean).join('  ·  '), F(20), C.fg);
      else { add('میزبان', p.inviter, F(20), C.fg); add('موبائل', p.phone ? `⁦${p.phone}⁩` : '', F(19), C.muted); }
      if (N > 2 && when) add('وقت', when, F(18), C.muted);   // تنگ کالم میں وقت سر کی پٹی کی بجائے نیچے
      add('', p.note, F(18), C.muted);
      const headH = Math.round(50 * s), h = headH + 12 + lines.reduce((a, l) => a + LH(l.fs), 0) + 10;
      return { h, draw(ctx, x, y) {
        const R = Math.round(16 * s);
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = i % 2 ? '#f6f1e2' : '#ffffff'; k.roundRect(ctx, x, y, CW, h - 10, R); ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; k.roundRect(ctx, x, y, CW, h - 10, R); ctx.stroke();
        const g = ctx.createLinearGradient(0, y, 0, y + headH); g.addColorStop(0, C.c2); g.addColorStop(1, C.c1);
        ctx.fillStyle = g; ctx.save(); k.roundRect(ctx, x, y, CW, h - 10, R); ctx.clip(); ctx.fillRect(x, y, CW, headH); ctx.restore();
        ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillStyle = C.gold2; ctx.font = `${F(23)}px ${FONT}`;
        const head = `${i + 1}.  ${dmy(p.date)}  ·  ${dayName(p.date)}`;
        ctx.fillText(k.fit(ctx, head, N > 2 ? CW - 2 * PAD : CW * .56), x + CW - PAD, y + headH * .68);
        if (N <= 2 && when) { ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `${F(18)}px ${FONT}`; ctx.fillText(k.fit(ctx, when, CW * .4), x + PAD, y + headH * .66); }
        let ty = y + headH + 8; ctx.textAlign = 'right';
        lines.forEach(l => { ty += LH(l.fs) * .78; ctx.font = `${l.fs}px ${FONT}`; ctx.fillStyle = l.color; ctx.fillText(l.t, x + CW - PAD, ty); ty += LH(l.fs) * .22; });
      } };
    };
    const lh0 = k.letterH();
    const photo = await new Promise(r => { const src = BRD().photo; if (!src) return r(null); const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; });
    const pages = []; let page, col, y, y0;
    const yMax = PH - BOT;
    const newPage = first => {
      page = []; pages.push(page); col = 0;
      if (first) { page.push(ctx => { k.letterDraw(ctx, TOP, ['#2c1f4a', '#14463a']); if (photo) {
          const bd = BRD(), D = 150, LH0 = lh0 - 20, band = (bd.address || bd.phone) ? 62 : 0, px = M + 40, py = TOP + 10 + (LH0 - band - D) / 2;
          ctx.save(); ctx.beginPath(); ctx.arc(px + D / 2, py + D / 2, D / 2 + 6, 0, Math.PI * 2); ctx.fillStyle = C.gold2; ctx.fill();
          ctx.beginPath(); ctx.arc(px + D / 2, py + D / 2, D / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(photo, px, py, D, D); ctx.restore(); } k.titleDraw(ctx, TOP + lh0, meta.title, `تاریخ: ${dmy(iso(new Date()))}`, `کل ${list.length} پروگرام`); }); y0 = TOP + lh0 + 120; }
      else { page.push(ctx => { ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillStyle = C.c1; ctx.font = `28px ${FONT}`; ctx.fillText(meta.cont, W - M, TOP + 36); ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, TOP + 56); ctx.lineTo(W - M, TOP + 56); ctx.stroke(); }); y0 = TOP + 72; }
      y = y0;
    };
    newPage(true);
    // ہر مہینے سے پہلے اس کا عنوان — عنوان اکیلا کالم کے آخر میں نہ رہے، اپنے پہلے پروگرام کے ساتھ جائے
    const MH = Math.round(58 * s), items = [];
    const mKey = p => p.date.slice(0, 7);
    const mCount = {}; list.forEach(p => { mCount[mKey(p)] = (mCount[mKey(p)] || 0) + 1; });
    list.forEach((p, i) => {
      if (!i || mKey(p) !== mKey(list[i - 1])) {
        const [yy, mm] = p.date.split('-').map(Number), n = mCount[mKey(p)];
        items.push({ h: MH, head: true, draw(ctx, x, y) {
          const g = ctx.createLinearGradient(0, y, 0, y + MH - 12); g.addColorStop(0, '#fff3c4'); g.addColorStop(.55, '#e8c467'); g.addColorStop(1, '#c8962f');
          ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; ctx.fillStyle = g; k.roundRect(ctx, x, y, CW, MH - 12, Math.round(12 * s)); ctx.fill(); ctx.restore();
          ctx.strokeStyle = '#a8741f'; ctx.lineWidth = 1.5; k.roundRect(ctx, x, y, CW, MH - 12, Math.round(12 * s)); ctx.stroke();
          ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillStyle = '#3a2605'; ctx.font = `${F(25)}px ${FONT}`;
          ctx.fillText(`${MONTHS[mm - 1]} ${yy}`, x + CW - PAD, y + (MH - 12) * .7);
          ctx.textAlign = 'left'; ctx.fillStyle = '#5a3a00'; ctx.font = `${F(18)}px ${FONT}`;
          ctx.fillText(`${n} پروگرام`, x + PAD, y + (MH - 12) * .68);
        } });
      }
      items.push(box(p, i));
    });
    items.forEach((it, i) => { it.need = it.h + (it.head && items[i + 1] ? items[i + 1].h : 0); });
    // سب ایک صفحے پر آ جائیں تو کالموں میں برابر بانٹیں (خالی کالم نہ رہیں)
    let lim = yMax;
    const total = items.reduce((a, b) => a + b.h, 0);
    if (N > 1 && total <= N * (yMax - y0)) {
      const fits = L => { let c = 0, yy = y0; for (const b of items) { if (yy + b.need > L && yy > y0) { c++; yy = y0; } yy += b.h; } return c < N; };
      for (let L = y0 + Math.max(total / N, ...items.map(b => b.need)); L <= yMax; L += 10) if (fits(L)) { lim = L; break; }
    }
    items.forEach(b => {
      if (y + b.need > (pages.length === 1 ? lim : yMax) && y > y0) { col++; if (col >= N) newPage(false); else y = y0; }
      const x = W - M - col * (CW + GAP) - CW, yy = y;
      page.push(ctx => b.draw(ctx, x, yy)); y += b.h;
    });
    const foot = `${meta.foot} — ${window.MA_BRAND ? window.MA_BRAND.name() : 'میرا مکتبہ'}`;
    const cw = Math.round(W * SC), ch = Math.round(PH * SC);
    const jpgs = pages.map((pg, i) => {
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const ctx = cv.getContext('2d'); ctx.scale(cw / W, ch / PH); ctx.direction = 'rtl'; k.framePage(ctx);
      pg.forEach(d => { ctx.save(); d(ctx); ctx.restore(); });
      k.footDraw(ctx, foot, i, pages.length);
      return cv.toDataURL('image/jpeg', 0.88);
    });
    return { jpgs, w: cw, h: ch };
  }

  // PDF سے پہلے پیش نظارہ: 1–4 کالم چنیں، دیکھیں، پھر محفوظ / پرنٹ / بھیجیں
  const CKEY = 'maktaba-aziz-prog-cols';
  function openPdfPreview(list, meta) {
    const k = window.MA_SHARE_UI.kit;
    let N = (() => { try { return Math.min(4, Math.max(1, Number(localStorage.getItem(CKEY)) || 2)); } catch (e) { return 2; } })();
    document.getElementById('pvSheet')?.remove();
    const wrap = document.createElement('div'); wrap.id = 'pvSheet'; wrap.className = 'pv-wrap';
    wrap.innerHTML = `
      <div class="pv" role="dialog" aria-modal="true" aria-label="PDF کا پیش نظارہ">
        <div class="pv-h"><b>📄 PDF پیش نظارہ</b><button type="button" class="x" id="pvClose" aria-label="بند کریں">✕</button></div>
        <div class="pv-ctl"><div class="pv-row pv-cols"><span>ایک صفحے پر</span>${[1, 2, 3, 4].map(n => `<button type="button" class="pv-c" data-n="${n}">${n} کالم</button>`).join('')}</div>${k.headFontsHtml ? k.headFontsHtml() : ''}</div>
        <div class="pv-body" id="pvBody"><p class="pv-wait">تیار ہو رہا ہے…</p></div>
        <div class="pv-act">
          <button type="button" class="btn pv-go" data-a="save">⬇️ محفوظ کریں</button>
          <button type="button" class="btn ghost" data-a="print">🖨️ پرنٹ</button>
          <button type="button" class="btn ghost" data-a="share">📤 بھیجیں</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); window.removeEventListener('hashchange', close); };
    $('pvClose').addEventListener('click', close);
    window.addEventListener('hashchange', close);   // پیچھے جائیں تو پیش نظارہ بھی بند
    if (k.headFontsWire) k.headFontsWire(wrap, () => draw());
    let res = null, token = 0;
    const draw = async () => {
      const my = ++token; res = null;
      wrap.querySelectorAll('[data-n]').forEach(b => b.classList.toggle('on', Number(b.dataset.n) === N));
      const body = $('pvBody'); body.innerHTML = '<p class="pv-wait">تیار ہو رہا ہے…</p>';
      try {
        const r = await progPdf(list, meta, N); if (my !== token) return;
        res = r;
        body.innerHTML = `<p class="pv-info">${num(N)} کالم · ${num(r.jpgs.length)} صفحات · ${num(list.length)} پروگرام</p>` + r.jpgs.map((u, i) => `<img src="${u}" alt="صفحہ ${i + 1}" class="pv-page">`).join('');
      } catch (e) { console.warn(e); if (my === token) body.innerHTML = '<p class="pv-wait">نہیں بن سکا، دوبارہ کوشش کریں</p>'; }
    };
    const file = () => `${meta.file}-${N}col-${iso(new Date())}.pdf`;
    wrap.addEventListener('click', async e => {
      const c = e.target.closest('[data-n]');
      if (c) { N = Number(c.dataset.n); try { localStorage.setItem(CKEY, N); } catch (err) {} draw(); return; }
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (!res) { H().toast('پیش نظارہ تیار ہو رہا ہے، ذرا رکیں'); return; }
      const blob = k.makePdf(res.jpgs, res.w, res.h);
      if (a.dataset.a === 'save') {
        const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = file();
        document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
        H().toast('PDF فون میں محفوظ ہو گئی (Downloads)');
      } else if (a.dataset.a === 'print') printPages(res.jpgs);
      else await k.deliver(blob, file(), meta.foot);
    });
    draw();
  }
  // صفحات براہِ راست پرنٹ — ہر تصویر ایک A4 صفحہ
  function printPages(jpgs) {
    document.getElementById('pgPrint')?.remove();
    const f = document.createElement('iframe'); f.id = 'pgPrint';
    f.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(f);
    const d = f.contentDocument;
    d.open(); d.write(`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}html,body{margin:0;padding:0}img{display:block;width:210mm;height:297mm;object-fit:contain;page-break-after:always;break-after:page}img:last-child{page-break-after:auto;break-after:auto}</style></head><body>${jpgs.map(u => `<img src="${u}">`).join('')}</body></html>`); d.close();
    const go = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { H().toast('پرنٹ نہیں کھل سکا — PDF محفوظ کر کے پرنٹ کریں'); } };
    const imgs = [...d.images]; let left = imgs.length;
    if (!left) go(); else imgs.forEach(im => { if (im.complete) { if (!--left) go(); } else im.onload = im.onerror = () => { if (!--left) go(); }; });
  }

  // ================= سابقہ پروگرام (ریکارڈ) =================
  const OKEY = 'maktaba-aziz-prog-old';
  let O = Object.assign({ k: 'all', from: addDays(-30), to: iso(new Date()), city: '', prov: '' }, (() => { try { return JSON.parse(localStorage.getItem(OKEY)) || {}; } catch (e) { return {}; } })());
  const saveO = () => { try { localStorage.setItem(OKEY, JSON.stringify(O)); } catch (e) {} };
  const OPER = [['7', 'ایک ہفتہ'], ['30', 'ایک مہینہ'], ['90', 'تین مہینے'], ['365', 'ایک سال'], ['all', 'سب'], ['custom', 'مرضی کی تاریخ']];
  function oldList() {
    let L = progs().filter(isPast);
    if (O.k === 'custom') L = L.filter(p => p.date >= O.from && p.date <= O.to);
    else if (O.k !== 'all') { const fromD = addDays(-Number(O.k)); L = L.filter(p => p.date >= fromD); }
    if (O.city) L = L.filter(p => (p.city || '').trim() === O.city);
    if (O.prov) L = L.filter(p => (p.province || '') === O.prov);
    return L.sort((a, b) => target(b) - target(a));
  }
  function oldRange() {
    const per = O.k === 'custom' ? `${dmy(O.from)} تا ${dmy(O.to)}` : O.k === 'all' ? 'تمام' : `پچھلے ${(OPER.find(x => x[0] === O.k) || [0, ''])[1]}`;
    return [per, O.city && `شہر: ${O.city}`, O.prov && `صوبہ: ${O.prov}`].filter(Boolean).join(' · ');
  }
  function pageOld() {
    const all = progs().filter(isPast), list = oldList();
    const cities = [...new Set(all.map(p => (p.city || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ur'));
    const provs = [...new Set(all.map(p => p.province).filter(Boolean))];
    H().view.innerHTML = `
      <section class="panel prog-panel pg-old">
        <div class="panel-h prog-h"><a class="back" href="#/prog">→ شیڈیول</a><h2 class="prog-title" style="font-size:26px !important">سابقہ پروگرام</h2></div>
        <div class="panel-b">
          ${brandHead('سابقہ پروگرامات کا ریکارڈ')}
          <div class="pg-filters">${OPER.map(([k, t]) => `<button type="button" class="pf${O.k === k ? ' on' : ''}" data-o="${k}">${t}</button>`).join('')}</div>
          ${O.k === 'custom' ? `<div class="pg-range"><label>سے <input type="date" id="oFrom" class="numin" value="${O.from}"></label><label>تک <input type="date" id="oTo" class="numin" value="${O.to}"></label></div>` : ''}
          <div class="pg-sel">
            <label><span>شہر</span><select id="oCity"><option value="">سب شہر</option>${cities.map(c => `<option${O.city === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
            <label><span>صوبہ</span><select id="oProv"><option value="">سب صوبے</option>${PROVINCES.map(c => `<option${O.prov === c ? ' selected' : ''}${provs.includes(c) ? '' : ' class="dim"'}>${c}</option>`).join('')}</select></label>
          </div>
          <div class="pg-sum"><span>${esc(oldRange())}</span><b>${num(list.length)} پروگرام</b></div>
          <div class="pr-btns old"><button class="btn" type="button" data-r="pdf" ${list.length ? '' : 'disabled'}>📄 PDF / پرنٹ</button><button class="btn ghost" type="button" data-r="wa" ${list.length ? '' : 'disabled'}>واٹس ایپ</button><button class="btn ghost" type="button" data-r="copy" ${list.length ? '' : 'disabled'}>کاپی</button></div>
          ${list.length ? `<div class="pg-list">${list.map(rowHtml).join('')}</div>` : `<div class="empty pg-empty"><b>${all.length ? 'اس انتخاب میں کوئی پروگرام نہیں' : 'ابھی کوئی سابقہ پروگرام نہیں'}</b>جو پروگرام ہو جاتا ہے وہ خود یہاں محفوظ ہو جاتا ہے۔</div>`}
        </div>
      </section>`;
    const v = H().view; brandWire(v, pageOld);
    v.querySelector('.pg-filters').addEventListener('click', e => { const b = e.target.closest('[data-o]'); if (!b) return; O.k = b.dataset.o; saveO(); pageOld(); });
    $('oFrom')?.addEventListener('change', e => { O.from = e.target.value || O.from; saveO(); pageOld(); });
    $('oTo')?.addEventListener('change', e => { O.to = e.target.value || O.to; saveO(); pageOld(); });
    $('oCity').addEventListener('change', e => { O.city = e.target.value; saveO(); pageOld(); });
    $('oProv').addEventListener('change', e => { O.prov = e.target.value; saveO(); pageOld(); });
    v.querySelector('.pr-btns').addEventListener('click', async e => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      const k = window.MA_SHARE_UI?.kit;
      const asc = [...list].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
      const text = (k?.brandText ? k.brandText() + '\n' : '') + `*سابقہ پروگرام*\n${oldRange()}\n\n` + asc.map((p, i) => [
        !i || p.date.slice(0, 7) !== asc[i - 1].date.slice(0, 7) ? `${i ? '\n' : ''}📅 *${MONTHS[+p.date.slice(5, 7) - 1]} ${p.date.slice(0, 4)}*\n━━━━━━━━━━━━` : '',
        `${i % 2 ? '⚪' : '🟢'} ${i + 1}. *${longDate(p.date)}* (${dayName(p.date)})${p.timeNote ? '  ·  ' + p.timeNote : ''}`,
        `      🕌 ${[p.place, p.city, p.province].filter(Boolean).join('، ')}`,
        p.title ? `      📌 ${p.title}` : '',
        p.inviter || p.phone ? `      👤 ${[p.inviter, p.phone].filter(Boolean).join('  ·  ')}` : ''
      ].filter(Boolean).join('\n')).join('\n\n') + `\n\n━━━━━━━━━━━━\n*کل:* ${list.length} پروگرام` + (k?.creditText || '');
      if (b.dataset.r === 'wa') { if (text.length <= 3500) location.href = 'https://wa.me/?text=' + encodeURIComponent(text); else if (navigator.share) navigator.share({ text }).catch(() => {}); else { await k.copyText(text); H().toast('کاپی ہو گئی، واٹس ایپ میں پیسٹ کریں'); } return; }
      if (b.dataset.r === 'copy') { H().toast(await k.copyText(text) ? 'فہرست کاپی ہو گئی' : 'کاپی نہیں ہو سکی'); return; }
      openPdfPreview(list, { title: `سابقہ پروگرام — ${oldRange()}`, cont: 'سابقہ پروگرام (جاری)', foot: 'سابقہ پروگرام', file: 'sabiqa-programs' });
    });
  }
  // ---------- راستے ----------
  function route(parts) {
    stopTick();
    if (parts[0] === 'add') openForm();
    else if (parts[0] === 'edit' && parts[1]) openForm(parts[1]);
    else if (parts[0] === 'p' && parts[1]) pageOne(parts[1]);
    else if (parts[0] === 'old') pageOld();
    else pageList();
  }
  // اگلے 30 دن کے پروگرام (ہوم کی ٹائل پر گنتی)
  const soon = () => { const t = iso(new Date()), e = addDays(30); return progs().filter(p => !isPast(p) && p.date >= t && p.date <= e).length; };
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/prog')) stopTick(); });

  window.MA_PROG = { route, soon, _test: { progPdf, openPdfPreview, filtered, leftTxt, oldList } };
  // ایپ پہلے لوڈ ہو چکی ہو تو موجودہ صفحہ دوبارہ بنائیں
  if (window.MA_APP && (location.hash.startsWith('#/prog') || !location.hash || location.hash === '#/')) window.MA_APP.route();
})();
