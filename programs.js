/* مکتبۃ العزیز — «میرے پروگرام»: جلسوں کی دعوتیں، اشتہار، رابطہ، الٹی گنتی اور رپورٹ
   ڈیٹا app.js کے db.progs میں رہتا ہے (اسی بیک اپ کے ساتھ Drive پر بھی جاتا ہے)۔ */
(() => {
  'use strict';
  const H = () => window.MA_APP;
  const $ = id => document.getElementById(id);
  const esc = s => H().esc(s);
  const num = n => H().num(n);

  const MONTHS = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
  const DAYS = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
  const TIME_NOTES = ['بعد از نماز فجر', 'بعد از نماز ظہر', 'بعد از نماز جمعہ', 'بعد از نماز عصر', 'بعد از نماز مغرب', 'بعد از نماز عشاء'];
  const FILTERS = [['15', '15 دن'], ['30', '30 دن'], ['60', '60 دن'], ['90', '90 دن'], ['all', 'سب آنے والے'], ['past', 'گزشتہ'], ['custom', 'مرضی کی تاریخ']];
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

  // ---------- فہرست کا صفحہ ----------
  let tick = null;
  const stopTick = () => { clearInterval(tick); tick = null; };

  function pageList() {
    const list = filtered();
    const upcoming = progs().filter(p => !isPast(p)).length;
    H().view.innerHTML = `
      <section class="panel prog-panel">
        <div class="panel-h prog-h">
          <h2 class="prog-title">میرے پروگرام</h2>
          <span class="actions"><button class="btn ghost small" type="button" id="pgRem" aria-label="یاد دہانی">🔔</button><button class="btn ghost small" type="button" id="pgRep">📄 رپورٹ</button><a class="btn" href="#/prog/add">+ نیا پروگرام</a></span>
        </div>
        <div class="panel-b">
          <div class="pg-filters" role="tablist">${FILTERS.map(([k, t]) => `<button type="button" class="pf${F.k === k ? ' on' : ''}" data-f="${k}">${t}</button>`).join('')}</div>
          ${F.k === 'custom' ? `<div class="pg-range"><label>سے <input type="date" id="pgFrom" class="numin" value="${F.from}"></label><label>تک <input type="date" id="pgTo" class="numin" value="${F.to}"></label></div>` : ''}
          <div class="pg-sum"><span>${esc(rangeTxt())}</span><b>${num(list.length)} پروگرام</b></div>
          ${list.length ? `<div class="pg-list">${list.map(rowHtml).join('')}</div>`
          : `<div class="empty pg-empty"><b>${progs().length ? 'اس مدت میں کوئی پروگرام نہیں' : 'ابھی کوئی پروگرام درج نہیں'}</b>${progs().length ? `کل آنے والے پروگرام: ${num(upcoming)} — اوپر سے مدت بدل کر دیکھیں۔` : '«+ نیا پروگرام» دبا کر پہلی دعوت درج کریں۔'}</div>`}
        </div>
      </section>`;
    H().view.querySelector('.pg-filters').addEventListener('click', e => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      F.k = b.dataset.f; saveF(); pageList();
    });
    $('pgFrom')?.addEventListener('change', e => { F.from = e.target.value || F.from; saveF(); pageList(); });
    $('pgTo')?.addEventListener('change', e => { F.to = e.target.value || F.to; saveF(); pageList(); });
    $('pgRep').addEventListener('click', openReport);
    $('pgRem').addEventListener('click', () => window.MA_REMIND && window.MA_REMIND.settings());
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
        <small>${p.time ? esc(timeTxt(p.time)) + ' · ' : ''}${p.inviter ? 'دعوت: ' + esc(p.inviter) : ''}</small>
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
        <div class="panel-h prog-h"><a class="back" href="#/prog">→ میرے پروگرام</a><span class="pg-left ${leftTxt(p).c}">${dayName(p.date)}</span></div>
        <div class="panel-b pg-one" id="pgOne">
          ${p.title ? `<p class="po-topic">${esc(p.title)}</p>` : ''}
          <h2 class="po-place">${esc(p.place || 'پروگرام')}${p.city ? `<span>${esc(p.city)}</span>` : ''}</h2>
          <div class="po-count" id="poCount" aria-live="polite"></div>
          <div class="po-cards">
            <div class="po-card"><span class="po-ico">${H().icons.I_CAL}</span><span><small>تاریخ</small><b>${longDate(p.date)} · ${dayName(p.date)}</b></span></div>
            ${whenTxt(p) ? `<div class="po-card"><span class="po-ico">🕒</span><span><small>وقت</small><b>${esc(whenTxt(p))}</b></span></div>` : ''}
            <div class="po-card"><span class="po-ico">🕌</span><span><small>بمقام</small><b>${esc(p.place || '—')}</b></span></div>
            ${p.city ? `<div class="po-card"><span class="po-ico">📍</span><span><small>شہر</small><b>${esc(p.city)}</b></span></div>` : ''}
          </div>
          ${p.inviter || p.phone ? `<div class="po-inviter">
            <div class="pi-who"><span class="po-ico">${H().icons.I_USER}</span><span><small>دعوت دینے والے</small><b>${esc(p.inviter || '—')}</b>${phone ? `<bdi dir="ltr">${phone}</bdi>` : ''}</span></div>
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
            <button class="btn ghost" type="button" data-a="ics">📅 کیلنڈر میں ڈالیں</button>
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
      if (a === 'ics' && window.MA_REMIND) window.MA_REMIND.toCalendar(p);
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
      p.inviter || p.phone ? `👤 دعوت: ${[p.inviter, p.phone].filter(Boolean).join(' — ')}` : '',
      p.note ? `📝 ${p.note}` : ''
    ].filter(Boolean).join('\n');
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
          ${fld('p-title', 'عنوان (اختیاری)', `value="${esc(p?.title || '')}" placeholder="مثلاً ختمِ نبوت کانفرنس"`, 'full')}
          ${fld('p-date', 'تاریخ', `type="date" class="ltr" value="${esc(p?.date || '')}"`)}
          ${fld('p-time', 'وقت', `type="time" class="ltr" value="${esc(p?.time || '')}"`)}
          ${fld('p-tnote', 'نماز', `list="dl-tnote" value="${esc(p ? (p.timeNote || '') : 'بعد از نماز عشاء')}" placeholder="بعد از نماز عشاء"`)}
          ${fld('p-city', 'شہر', `list="dl-city" value="${esc(p?.city || '')}" placeholder="مثلاً کلور کوٹ"`)}
          ${fld('p-place', 'بمقام', `list="dl-place" value="${esc(p?.place || '')}" placeholder="مثلاً جامع مسجد نور"`, 'full')}
          ${fld('p-inv', 'دعوت دینے والے', `list="dl-inv" value="${esc(p?.inviter || '')}" placeholder="مکمل نام"`)}
          ${fld('p-phone', 'موبائل', `class="ltr" inputmode="tel" value="${esc(p?.phone || '')}" placeholder="0300-1234567"`)}
          <div class="pf-f full pp-row"><span>اشتہار</span><div class="pp-box" id="ppBox"></div><input type="file" id="p-img" accept="image/*" hidden></div>
          ${fld('p-note', 'نوٹ (اختیاری)', `value="${esc(p?.note || '')}"`, 'full')}
        </div>
        <datalist id="dl-tnote">${TIME_NOTES.map(v => `<option value="${v}">`).join('')}</datalist>
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
    };
    drawPoster();
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
    // پہلے والے دعوت دینے والے کا نمبر خود بھر جائے
    $('p-inv').addEventListener('change', () => {
      const prev = [...progs()].reverse().find(x => x.inviter === $('p-inv').value.trim());
      if (prev && !$('p-phone').value) $('p-phone').value = prev.phone || '';
    });
    setTimeout(() => (p ? $('p-place') : $('p-date')).focus(), 60);
    $('pgForm').addEventListener('submit', e => {
      e.preventDefault();
      const err = $('p-err');
      const rec = {
        title: $('p-title').value.trim(), date: $('p-date').value, time: $('p-time').value, timeNote: $('p-tnote').value.trim(),
        place: $('p-place').value.trim(), city: $('p-city').value.trim(), inviter: $('p-inv').value.trim(), phone: $('p-phone').value.trim(),
        note: $('p-note').value.trim(), poster
      };
      if (!rec.date) { err.textContent = 'پروگرام کی تاریخ لکھنا ضروری ہے'; $('p-date').focus(); return; }
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
      const text = `*میرے پروگرام — ${rangeTxt()}*\n\n` + list.map((p, i) => `${i + 1}) ${longDate(p.date)} (${dayName(p.date)})${whenTxt(p) ? ' · ' + whenTxt(p) : ''}\n   ${p.place || ''}${p.city ? '، ' + p.city : ''}${p.inviter || p.phone ? `\n   دعوت: ${[p.inviter, p.phone].filter(Boolean).join(' — ')}` : ''}`).join('\n\n');
      if (b.dataset.r === 'wa') { if (text.length <= 3500) location.href = 'https://wa.me/?text=' + encodeURIComponent(text); else if (navigator.share) navigator.share({ text }).catch(() => {}); else { await k.copyText(text); H().toast('کاپی ہو گئی — واٹس ایپ میں پیسٹ کریں'); } return; }
      if (b.dataset.r === 'copy') { H().toast(await k.copyText(text) ? 'رپورٹ کاپی ہو گئی' : 'کاپی نہیں ہو سکی'); return; }
      const old = b.textContent; b.disabled = true; b.textContent = 'بن رہی ہے…';
      try { await k.deliver(await reportPdf(list), `mere-programs-${iso(new Date())}.pdf`, 'میرے پروگرام'); }
      catch (err) { console.warn(err); H().toast('PDF نہیں بن سکی، دوبارہ کوشش کریں'); }
      finally { b.disabled = false; b.textContent = old; }
    });
  }

  async function reportPdf(list) {
    const k = window.MA_SHARE_UI.kit;
    await k.ready();
    const W = 1240, PH = 1754, M = 50, TOP = 40, BOT = 80, ROW = 92;
    const FONT = k.FONT, TFONT = k.TFONT;
    const C = { green: '#14463a', green2: '#1f6a54', gold: '#c8962f', gold2: '#e8c467', line: '#e4d6b0', fg: '#2b2620', muted: '#7d7262', alt: '#f8f2e2' };
    const cols = [{ k: 'n', w: 60, t: 'نمبر' }, { k: 'date', w: 200, t: 'تاریخ' }, { k: 'when', w: 200, t: 'وقت' }, { k: 'place', w: 0, t: 'بمقام / شہر' }, { k: 'inv', w: 300, t: 'دعوت دینے والے' }];
    cols[3].w = W - 2 * M - cols.reduce((s, c) => s + c.w, 0);
    let x = W - M; cols.forEach(c => { c.r = x; x -= c.w; });
    const blocks = [];
    blocks.push({ h: 250, draw(ctx, y) {
      const g = ctx.createLinearGradient(0, y, 0, y + 200); g.addColorStop(0, '#2c1f4a'); g.addColorStop(1, '#14463a');
      ctx.fillStyle = g; k.roundRect(ctx, M, y + 10, W - 2 * M, 200, 22); ctx.fill();
      ctx.strokeStyle = C.gold2; ctx.lineWidth = 3; k.roundRect(ctx, M + 10, y + 20, W - 2 * M - 20, 180, 16); ctx.stroke();
      const tg = ctx.createLinearGradient(0, y + 30, 0, y + 120); tg.addColorStop(0, '#fff3c4'); tg.addColorStop(.5, '#e2b24e'); tg.addColorStop(1, '#a8741f');
      ctx.fillStyle = tg; ctx.textAlign = 'center'; ctx.font = `80px ${TFONT}`; ctx.fillText('میرے پروگرام', W / 2, y + 118);
      ctx.fillStyle = '#f3e6c2'; ctx.font = `30px ${FONT}`; ctx.fillText(rangeTxt(), W / 2, y + 178);
      ctx.font = `22px ${FONT}`; ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText(`رپورٹ کی تاریخ: ${dmy(iso(new Date()))}`, W - M, y + 244);
      ctx.textAlign = 'left'; ctx.fillText(`کل ${list.length} پروگرام`, M, y + 244);
    } });
    blocks.push({ h: 56, keep: 2, draw(ctx, y) {
      ctx.fillStyle = C.green; k.roundRect(ctx, M, y + 6, W - 2 * M, 48, 10); ctx.fill();
      ctx.fillStyle = C.gold2; ctx.font = `24px ${FONT}`; ctx.textAlign = 'right';
      cols.forEach(c => ctx.fillText(c.t, c.r - 12, y + 40));
    } });
    list.forEach((p, i) => blocks.push({ h: ROW, draw(ctx, y) {
      if (i % 2) { ctx.fillStyle = C.alt; ctx.fillRect(M, y, W - 2 * M, ROW); }
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M, y + ROW - .5); ctx.lineTo(W - M, y + ROW - .5); ctx.stroke();
      ctx.textAlign = 'right';
      const two = (c, a, b, big = 25) => {
        ctx.font = `${big}px ${FONT}`; ctx.fillStyle = C.fg; ctx.fillText(k.fit(ctx, a, c.w - 20), c.r - 10, y + 40);
        if (b) { ctx.font = `20px ${FONT}`; ctx.fillStyle = C.muted; ctx.fillText(k.fit(ctx, b, c.w - 20), c.r - 10, y + 74); }
      };
      ctx.font = `22px ${FONT}`; ctx.fillStyle = C.muted; ctx.fillText(String(i + 1), cols[0].r - 14, y + 52);
      two(cols[1], dmy(p.date), dayName(p.date));
      two(cols[2], timeTxt(p.time) || p.timeNote || '—', p.time ? p.timeNote : '', 22);
      two(cols[3], [p.title, p.place].filter(Boolean).join(' — ') || '—', p.city);
      two(cols[4], p.inviter || '—', p.phone, 23);
    } }));
    const pages = []; let cur = [], y = TOP;
    blocks.forEach(b => { const need = b.keep ? b.h + ROW * b.keep : b.h; if (y + need > PH - BOT && cur.length) { pages.push(cur); cur = []; y = TOP; } cur.push(b); y += b.h; });
    if (cur.length) pages.push(cur);
    const jpgs = pages.map((pg, i) => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = PH;
      const ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, PH);
      let yy = TOP; pg.forEach(b => { b.draw(ctx, yy); yy += b.h; });
      ctx.fillStyle = C.muted; ctx.font = `20px ${FONT}`; ctx.textAlign = 'center';
      ctx.fillText(`میرے پروگرام — مکتبۃ العزیز — صفحہ ${i + 1} / ${pages.length}`, W / 2, PH - 36);
      return cv.toDataURL('image/jpeg', 0.9);
    });
    return k.makePdf(jpgs, W, PH);
  }

  // ---------- راستے ----------
  function route(parts) {
    stopTick();
    if (parts[0] === 'add') openForm();
    else if (parts[0] === 'edit' && parts[1]) openForm(parts[1]);
    else if (parts[0] === 'p' && parts[1]) pageOne(parts[1]);
    else pageList();
  }
  // اگلے 30 دن کے پروگرام (ہوم کی ٹائل پر گنتی)
  const soon = () => { const t = iso(new Date()), e = addDays(30); return progs().filter(p => !isPast(p) && p.date >= t && p.date <= e).length; };
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/prog')) stopTick(); });

  window.MA_PROG = { route, soon, _test: { reportPdf, filtered, leftTxt } };
  // ایپ پہلے لوڈ ہو چکی ہو تو موجودہ صفحہ دوبارہ بنائیں
  if (window.MA_APP && (location.hash.startsWith('#/prog') || !location.hash || location.hash === '#/')) window.MA_APP.route();
})();
