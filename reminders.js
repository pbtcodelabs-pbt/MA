/* مکتبۃ العزیز — پروگراموں کی یاد دہانی
   (الف) ایپ کے اندر: 3 دن بینر · 1 دن پوری اسکرین اشتہار · آخری دن ہر N منٹ پاپ اپ
   (ب) .ics فائل: فون کے کیلنڈر میں الارم (ایپ بند ہو تب بھی بجتے ہیں) */
(() => {
  'use strict';
  const H = () => window.MA_APP;
  const KEY = 'maktaba-aziz-remind', SEEN = 'maktaba-aziz-remind-seen';
  const DEF = { on: true, mins: 10, sound: true, notif: true };
  const esc = s => H().esc(s), num = n => H().num(n);
  const cfg = () => { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { ...DEF }; } };
  const setCfg = o => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(cfg(), o))); } catch (e) {} };
  const seenAll = () => { try { return JSON.parse(localStorage.getItem(SEEN)) || {}; } catch (e) { return {}; } };
  const seenSet = (id, k, v) => { try { const s = seenAll(); (s[id] = s[id] || {})[k] = v; localStorage.setItem(SEEN, JSON.stringify(s)); } catch (e) {} };
  const seenGet = (id, k) => (seenAll()[id] || {})[k];

  const MONTHS = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dateOf = s => new Date(String(s).slice(0, 10) + 'T00:00:00');
  const target = p => new Date(`${p.date}T${p.time || '23:59'}:00`);
  const dayDiff = p => Math.round((dateOf(p.date) - dateOf(iso(new Date()))) / 864e5);
  const isPast = p => target(p).getTime() < Date.now() - (p.time ? 3 * 3600e3 : 0);
  const longDate = s => { const d = dateOf(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  function timeTxt(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const per = h < 4 ? 'رات' : h < 12 ? 'صبح' : h < 15 ? 'دوپہر' : h < 18 ? 'سہ پہر' : h < 20 ? 'شام' : 'رات';
    return `${per} ${(h % 12) || 12}:${pad(m)} بجے`;
  }
  const whenTxt = p => [timeTxt(p.time), p.timeNote].filter(Boolean).join(' · ');
  const progs = () => { const d = H().db(); return d.progs || []; };
  const whereTxt = p => `${p.place || 'پروگرام'}${p.city ? '، ' + p.city : ''}`;

  // ---------- آواز، وائبریشن، اطلاع ----------
  function alertFx() {
    const c = cfg();
    if (!c.sound) return;
    try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 500]); } catch (e) {}
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ac = new AC();
      [0, 0.35, 0.7].forEach(t => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, ac.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.35, ac.currentTime + t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.28);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.3);
      });
      setTimeout(() => { try { ac.close(); } catch (e) {} }, 1500);
    } catch (e) {}
  }
  async function notify(title, body, tag) {
    if (!cfg().notif || !('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      const opt = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', dir: 'rtl', lang: 'ur', renotify: true, vibrate: [300, 150, 300] };
      if (reg && reg.showNotification) await reg.showNotification(title, opt); else new Notification(title, opt);
    } catch (e) {}
  }

  // ---------- (1) 2–3 دن پہلے: بینر ----------
  function banner(list) {
    document.getElementById('rmBanner')?.remove();
    if (!list.length) return;
    const w = document.createElement('div'); w.id = 'rmBanner'; w.className = 'rm-banner';
    w.innerHTML = list.slice(0, 3).map(p => `<div class="rm-b" data-id="${p.id}">
      <span class="rm-bt"><b>${num(dayDiff(p))} دن بعد پروگرام</b><small>${esc(whereTxt(p))} · ${longDate(p.date)}${whenTxt(p) ? ' · ' + esc(whenTxt(p)) : ''}</small></span>
      <span class="rm-bb"><a class="btn small" href="#/prog/p/${p.id}">دیکھیں</a><button type="button" class="btn ghost small" data-ok="${p.id}">ٹھیک ہے</button></span></div>`).join('');
    document.body.appendChild(w);
    w.addEventListener('click', e => {
      const ok = e.target.closest('[data-ok]'); const lk = e.target.closest('a');
      if (ok) { seenSet(ok.dataset.ok, 'b', iso(new Date())); ok.closest('.rm-b').remove(); if (!w.children.length) w.remove(); }
      else if (lk) w.remove();
    });
  }

  // ---------- (2) ایک دن رہ جائے: پوری اسکرین اشتہار ----------
  const snoozed = new Set();
  function slide(p, then) {
    document.getElementById('rmSlide')?.remove();
    const w = document.createElement('div'); w.id = 'rmSlide'; w.className = 'rm-slide';
    w.innerHTML = `<div class="rm-sl-in">
      <p class="rm-k">کل پروگرام ہے</p>
      ${p.title ? `<p class="rm-t">${esc(p.title)}</p>` : ''}
      ${p.poster ? `<img class="rm-img" src="${p.poster}" alt="اشتہار">` : `<div class="rm-noimg">${esc(whereTxt(p))}</div>`}
      <p class="rm-w">${esc(whereTxt(p))}</p>
      <p class="rm-d">${longDate(p.date)}${whenTxt(p) ? ' · ' + esc(whenTxt(p)) : ''}</p>
      <div class="rm-cd" id="rmCd"></div>
      <div class="rm-btns"><button type="button" class="btn" data-x="ok">ٹھیک ہے</button><button type="button" class="btn ghost" data-x="later">بعد میں</button></div></div>`;
    document.body.appendChild(w);
    const draw = () => {
      const el = document.getElementById('rmCd'); if (!el) return clearInterval(t);
      const s = Math.max(0, Math.floor((target(p) - Date.now()) / 1000));
      const b = (v, l) => `<span class="rm-cb"><b>${pad(v)}</b><small>${l}</small></span>`;
      el.innerHTML = p.time ? b(Math.floor(s / 86400), 'دن') + b(Math.floor(s / 3600) % 24, 'گھنٹے') + b(Math.floor(s / 60) % 60, 'منٹ') + b(s % 60, 'سیکنڈ') : '';
    };
    const t = setInterval(draw, 1000); draw();
    alertFx();
    w.addEventListener('click', e => {
      const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
      clearInterval(t); w.remove();
      if (x === 'ok') seenSet(p.id, 's', iso(new Date())); else snoozed.add(p.id);
      then && then();
    });
  }

  // ---------- (3) آخری دن: ہر N منٹ پاپ اپ ----------
  function todayPop(p) {
    if (document.getElementById('rmPop')) return;
    const w = document.createElement('div'); w.id = 'rmPop'; w.className = 'rm-pop';
    const msg = `آج آپ کا پروگرام ہے${whenTxt(p) ? ' — ' + whenTxt(p) : ''} — بمقام ${p.place || '—'}${p.city ? '، شہر ' + p.city : ''}`;
    w.innerHTML = `<div class="rm-card"><p class="rm-k">یاد دہانی</p>
      <p class="rm-msg">${esc(msg)}</p>
      <div class="rm-btns"><a class="btn" href="#/prog/p/${p.id}" data-x="open">کھولیں</a><button type="button" class="btn ghost" data-x="ok">ٹھیک ہے</button><button type="button" class="btn ghost" data-x="mute">آج مزید نہ دکھائیں</button></div></div>`;
    document.body.appendChild(w);
    alertFx(); notify('مکتبۃ العزیز — آج پروگرام ہے', msg, 'rm-' + p.id);
    w.addEventListener('click', e => {
      const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'mute') seenSet(p.id, 'mute', iso(new Date()));
      w.remove();
    });
  }

  // ---------- جانچ ----------
  let cooling = false;
  function check(first) {
    if (!window.MA_APP || !cfg().on || cooling) return;
    const today = iso(new Date());
    const live = progs().filter(p => p.date && !isPast(p));
    // بینر: 2 یا 3 دن
    banner(live.filter(p => { const d = dayDiff(p); return d >= 2 && d <= 3 && seenGet(p.id, 'b') !== today; }));
    // پوری اسکرین: ایک دن
    if (first && !document.getElementById('rmSlide')) {
      const q = live.filter(p => dayDiff(p) === 1 && seenGet(p.id, 's') !== today && !snoozed.has(p.id));
      const next = () => { const p = q.shift(); if (p) slide(p, next); else setTimeout(() => check(false), 300); };
      next();
    }
    // آج: وقفے سے
    if (document.getElementById('rmSlide')) return;
    const gap = Math.max(1, cfg().mins) * 60000;
    live.filter(p => dayDiff(p) <= 0 && seenGet(p.id, 'mute') !== today).forEach(p => {
      const last = Number(seenGet(p.id, 'last')) || 0;
      if (Date.now() - last >= gap) { seenSet(p.id, 'last', Date.now()); todayPop(p); }
    });
  }

  // ---------- (ب) کیلنڈر فائل ----------
  const ics = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  function buildIcs(p) {
    const ymd = p.date.replace(/-/g, '');
    const st = p.time ? `${ymd}T${p.time.replace(':', '')}00` : null;
    const hasT = !!p.time;
    let en = null;
    if (hasT) { const e = new Date(target(p).getTime() + 2 * 3600e3); en = `${e.getFullYear()}${pad(e.getMonth() + 1)}${pad(e.getDate())}T${pad(e.getHours())}${pad(e.getMinutes())}00`; }
    const alarms = hasT
      ? ['-P3D', '-P1D', '-PT6H', '-PT3H', '-PT2H', '-PT1H', '-PT50M', '-PT40M', '-PT30M', '-PT20M', '-PT10M', 'PT0M']
      : ['-P3D', '-P1D', 'PT8H', 'PT10H', 'PT12H', 'PT14H', 'PT16H', 'PT18H'];
    const title = `پروگرام: ${whereTxt(p)}`;
    const desc = [p.title, whenTxt(p), p.inviter && `دعوت: ${p.inviter}`, p.phone, p.note].filter(Boolean).join('\n');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Maktaba Al-Aziz//MA//UR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:${p.id}@maktaba-aziz`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
      hasT ? `DTSTART:${st}` : `DTSTART;VALUE=DATE:${ymd}`, hasT ? `DTEND:${en}` : '',
      `SUMMARY:${ics(title)}`, `LOCATION:${ics(whereTxt(p))}`, `DESCRIPTION:${ics(desc)}`];
    alarms.forEach(a => L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${ics(title)}`, `TRIGGER:${a}`, 'END:VALARM'));
    L.push('END:VEVENT', 'END:VCALENDAR');
    return L.filter(Boolean).join('\r\n') + '\r\n';
  }
  async function toCalendar(p) {
    const blob = new Blob([buildIcs(p)], { type: 'text/calendar' });
    const file = new File([blob], `program-${p.date}.ics`, { type: 'text/calendar' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'پروگرام' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    H().toast('فائل محفوظ ہوئی — اسے کھول کر کیلنڈر میں شامل کریں');
  }

  // ---------- سیٹنگ ----------
  function settings() {
    const c = cfg();
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const { close, wrap } = H().openSheet('یاد دہانی', `
      <div class="rm-set">
        <label class="tick"><input type="checkbox" id="rmOn" ${c.on ? 'checked' : ''}><span>یاد دہانی چالو</span></label>
        <label class="rm-row"><span>آخری دن وقفہ</span><select id="rmMins" class="numin">${[5, 10, 15, 30, 60].map(m => `<option value="${m}" ${c.mins === m ? 'selected' : ''}>${num(m)} منٹ</option>`).join('')}</select></label>
        <label class="tick"><input type="checkbox" id="rmSnd" ${c.sound ? 'checked' : ''}><span>آواز اور وائبریشن</span></label>
        <label class="tick"><input type="checkbox" id="rmNot" ${c.notif ? 'checked' : ''}><span>اطلاع (Notification)</span></label>
        <div class="actions"><button type="button" class="btn small" id="rmPerm">${perm === 'granted' ? '✓ اطلاع کی اجازت مل چکی' : 'اطلاع کی اجازت دیں'}</button><button type="button" class="btn ghost small" id="rmTest">آزمائش</button></div>
        <p class="rm-note">ایپ کھلی ہو تو یاد دہانی خود آتی ہے۔ ایپ بند ہو تب بھی الارم کے لیے ہر پروگرام میں «فون کے کیلنڈر میں ڈالیں» دبائیں۔</p>
      </div>`);
    const $ = id => wrap.querySelector('#' + id);
    const save = () => setCfg({ on: $('rmOn').checked, mins: +$('rmMins').value, sound: $('rmSnd').checked, notif: $('rmNot').checked });
    wrap.addEventListener('change', save);
    $('rmPerm').addEventListener('click', async () => {
      if (!('Notification' in window)) return H().toast('اس فون میں اطلاع کی سہولت نہیں');
      const r = await Notification.requestPermission();
      $('rmPerm').textContent = r === 'granted' ? '✓ اطلاع کی اجازت مل چکی' : 'اجازت نہیں ملی';
    });
    $('rmTest').addEventListener('click', () => {
      save(); close();
      const p = { id: 'test', date: iso(new Date()), time: '', place: 'آزمائشی مسجد', city: 'عارف والا' };
      alertFx(); notify('مکتبۃ العزیز — آزمائش', 'یہ آزمائشی یاد دہانی ہے', 'rm-test'); todayPop(p);
    });
  }

  window.MA_REMIND = { settings, toCalendar, check, _test: { buildIcs, slide, todayPop, banner } };
  setTimeout(() => check(true), 600);
  setInterval(() => check(false), 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(true); });
})();
