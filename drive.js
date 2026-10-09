/* میرا مکتبہ — Google Drive بیک اپ
   - ایک «تازہ ترین» فائل ہر تبدیلی پر اپڈیٹ ہوتی ہے (maktaba-aziz-latest.json)
   - ہر دن کی الگ نقل بھی رکھی جاتی ہے (maktaba-aziz-YYYY-MM-DD.json) — فون یا ایپ کا ڈیٹا ختم ہو جائے تب بھی ریکارڈ محفوظ
   - اجازت صرف drive.file: ایپ صرف اپنی بنائی فائلیں دیکھ سکتی ہے، باقی Drive نہیں
   app.js سے window.MA_DRIVE_HOST کے ذریعے ڈیٹا ملتا ہے۔ */
(() => {
  'use strict';

  // ---- اپنا Google OAuth Client ID یہاں لکھیں (یا ایپ کے بیک اپ خانے میں پیسٹ کریں) ----
  const DEFAULT_CLIENT_ID = '954131537356-2be2rne30mje71l9qibosblvj3j0eqoj.apps.googleusercontent.com';

  const SCOPE = 'https://www.googleapis.com/auth/drive.file openid email';
  const FOLDER_NAME = 'Mera Maktaba Backup', OLD_FOLDER = 'Maktaba Al-Aziz Backup';  // پرانا فولڈر ہو تو وہی استعمال
  const LATEST_NAME = 'maktaba-aziz-latest.json';
  const META_KEY = 'maktaba-aziz-drive';
  const KEEP_DAILY = 60;          // اتنے دنوں کی روزانہ نقلیں رکھیں، پرانی خود صاف
  const AUTO_DELAY = 4000;        // تبدیلی کے بعد اتنی دیر میں خودکار بیک اپ

  const $ = id => document.getElementById(id);
  const host = () => window.MA_DRIVE_HOST;
  const toast = m => host()?.toast(m);

  let meta = {};
  try { meta = JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; } catch (e) { meta = {}; }
  const saveMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} };
  if (meta.auto === undefined) meta.auto = true;

  let token = null, tokenExp = 0, tokenClient = null, busy = false, autoTimer = null, progress = '';

  const clientId = () => (meta.clientId || DEFAULT_CLIENT_ID || '').trim();
  const pad = n => String(n).padStart(2, '0');
  const dayStamp = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const when = iso => { if (!iso) return '—'; const d = new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  // ---------- Google کی اسکرپٹ ----------
  let gisPromise = null;
  function loadGis() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    if (gisPromise) return gisPromise;
    gisPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => res(); s.onerror = () => { gisPromise = null; rej(new Error('gis')); };
      document.head.appendChild(s);
    });
    return gisPromise;
  }

  // ---------- اجازت (ٹوکن) ----------
  function getToken(interactive) {
    if (token && Date.now() < tokenExp - 60000) return Promise.resolve(token);
    if (!interactive) return Promise.reject(new Error('need-consent'));
    if (!clientId()) return Promise.reject(new Error('no-client'));
    if (!navigator.onLine) return Promise.reject(new Error('offline'));
    return loadGis().then(() => new Promise((res, rej) => {
      if (!tokenClient || tokenClient._cid !== clientId()) {
        tokenClient = google.accounts.oauth2.initTokenClient({ client_id: clientId(), scope: SCOPE, callback: () => {} });
        tokenClient._cid = clientId();
      }
      tokenClient.callback = r => {
        if (r.error) { rej(new Error(r.error)); return; }
        token = r.access_token; tokenExp = Date.now() + (Number(r.expires_in) || 3600) * 1000;
        res(token);
      };
      tokenClient.error_callback = e => rej(new Error(e?.type || 'popup'));
      const opts = { prompt: meta.email ? '' : 'consent' };
      if (meta.email) opts.hint = meta.email;
      tokenClient.requestAccessToken(opts);
    }));
  }

  async function api(url, opt = {}) {
    const r = await fetch(url, { ...opt, headers: { Authorization: 'Bearer ' + token, ...(opt.headers || {}) } });
    if (r.status === 401) { token = null; throw new Error('expired'); }
    if (!r.ok) throw new Error('http ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r;
  }
  const DRIVE = 'https://www.googleapis.com/drive/v3/files';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

  async function whoAmI() {
    try {
      const r = await api('https://www.googleapis.com/oauth2/v3/userinfo');
      const j = await r.json(); if (j.email) { meta.email = j.email; saveMeta(); }
    } catch (e) {}
  }

  async function ensureFolder() {
    if (meta.folderId) {
      try {
        const j = await (await api(`${DRIVE}/${meta.folderId}?fields=id,trashed`)).json();
        if (!j.trashed) return meta.folderId;
      } catch (e) { if (e.message === 'expired') throw e; }
      meta.folderId = null; meta.latestId = null;
    }
    const q = encodeURIComponent(`(name='${FOLDER_NAME}' or name='${OLD_FOLDER}') and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const found = await (await api(`${DRIVE}?q=${q}&fields=files(id)&spaces=drive`)).json();
    if (found.files?.length) { meta.folderId = found.files[0].id; saveMeta(); return meta.folderId; }
    const made = await (await api(DRIVE + '?fields=id', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' })
    })).json();
    meta.folderId = made.id; saveMeta(); return made.id;
  }

  async function listFiles() {
    const folder = await ensureFolder();
    const q = encodeURIComponent(`'${folder}' in parents and trashed=false`);
    const j = await (await api(`${DRIVE}?q=${q}&orderBy=modifiedTime desc&pageSize=200&fields=files(id,name,modifiedTime,size,appProperties)`)).json();
    return j.files || [];
  }

  function multipart(metaObj, content) {
    const b = 'maktaba' + Date.now();
    return {
      headers: { 'Content-Type': `multipart/related; boundary=${b}` },
      body: `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metaObj)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${b}--`
    };
  }

  async function upload(name, content, books, existingId, slot = 'manual') {
    const props = { appProperties: { books: String(books), app: 'maktaba-aziz', slot } };
    if (existingId) {
      const m = multipart(props, content);
      return (await api(`${UPLOAD}/${existingId}?uploadType=multipart&fields=id`, { method: 'PATCH', ...m })).json();
    }
    const m = multipart({ name, mimeType: 'application/json', parents: [meta.folderId], ...props }, content);
    return (await api(`${UPLOAD}?uploadType=multipart&fields=id`, { method: 'POST', ...m })).json();
  }

  // ---------- یادداشتوں کی تصاویر: بیک اپ فولڈر کے اندر «images» فولڈر میں، ہر تصویر ایک بار ----------
  async function imgFolder() {
    const parent = await ensureFolder();
    if (meta.imgFolder && meta.imgParent === parent) return meta.imgFolder;
    const q = encodeURIComponent(`name='images' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const f = await (await api(`${DRIVE}?q=${q}&fields=files(id)`)).json();
    let id = f.files?.[0]?.id;
    if (!id) id = (await (await api(DRIVE + '?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'images', mimeType: 'application/vnd.google-apps.folder', parents: [parent] }) })).json()).id;
    meta.imgFolder = id; meta.imgParent = parent; saveMeta(); return id;
  }
  async function syncImgs() {
    const N = window.MA_NOTES; if (!N) return;
    meta.imgUp = meta.imgUp || {};
    const todo = N.imgIds().filter(id => !meta.imgUp[id]); if (!todo.length) return;
    const fid = await imgFolder();
    for (const id of todo) {
      const blob = await N.imgGet(id); if (!blob) continue;
      const bd = 'mkimg' + Date.now();
      const body = new Blob([`--${bd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: `img-${id}.jpg`, parents: [fid], appProperties: { app: 'maktaba-aziz-img', id } })}\r\n--${bd}\r\nContent-Type: image/jpeg\r\n\r\n`, blob, `\r\n--${bd}--`]);
      const r = await (await api(`${UPLOAD}?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${bd}` }, body })).json();
      meta.imgUp[id] = r.id; saveMeta();
    }
  }
  async function fetchImgs() {
    const N = window.MA_NOTES; if (!N) return 0;
    const miss = []; for (const id of N.imgIds()) if (!(await N.imgHas(id))) miss.push(id);
    if (!miss.length) return 0;
    const fid = await imgFolder(); let n = 0;
    meta.imgUp = meta.imgUp || {};
    for (const id of miss) {
      try {
        const q = encodeURIComponent(`name='img-${id}.jpg' and '${fid}' in parents and trashed=false`);
        const f = (await (await api(`${DRIVE}?q=${q}&fields=files(id)`)).json()).files?.[0]; if (!f) continue;
        const blob = await (await api(`${DRIVE}/${f.id}?alt=media`)).blob();
        await N.imgPut(id, new Blob([blob], { type: 'image/jpeg' })); meta.imgUp[id] = f.id; n++;
      } catch (e) { if (e.message === 'expired') throw e; }
    }
    saveMeta(); return n;
  }

  // ---------- بیک اپ ----------
  // slot: 'manual' (دستی/خودکار تبدیلی پر) یا '08' / '14' / '20' (مقررہ اوقات)
  async function backup(interactive, slot = 'manual', slotKey = null) {
    if (busy) return false;
    busy = true;
    const data = host().snapshot();
    const n = data.books.length;
    progress = `Drive پر ${n} کتب محفوظ ہو رہی ہیں…`; render();
    try {
      await getToken(interactive);
      if (!meta.email) await whoAmI();
      await ensureFolder();
      const content = JSON.stringify({ app: 'maktaba-aziz', version: host().version, savedAt: new Date().toISOString(), slot, ...data });
      // تازہ ترین فائل
      let latestId = meta.latestId;
      if (!latestId) {
        const q = encodeURIComponent(`name='${LATEST_NAME}' and '${meta.folderId}' in parents and trashed=false`);
        const f = await (await api(`${DRIVE}?q=${q}&fields=files(id)`)).json();
        latestId = f.files?.[0]?.id || null;
      }
      try { const r = await upload(LATEST_NAME, content, n, latestId, slot); meta.latestId = r.id; }
      catch (e) { if (latestId && /404/.test(e.message)) { const r = await upload(LATEST_NAME, content, n, null, slot); meta.latestId = r.id; } else throw e; }
      const today = dayStamp();
      if (slot === 'manual') {
        // دن کی دستی نقل (دن میں ایک فائل، ہر بار تازہ)
        const dailyName = `maktaba-aziz-${today}.json`;
        if (meta.dailyDay === today && meta.dailyId) {
          try { await upload(dailyName, content, n, meta.dailyId, slot); } catch (e) { meta.dailyId = (await upload(dailyName, content, n, null, slot)).id; }
        } else {
          meta.dailyId = (await upload(dailyName, content, n, null, slot)).id; meta.dailyDay = today;
          cleanupOld().catch(() => {});
        }
      } else {
        // مقررہ وقت کی الگ نقل: صبح 8، دوپہر 2، رات 8
        const key = slotKey || `${today}-${slot}`;
        await upload(`maktaba-aziz-${key}00.json`, content, n, null, slot);
        meta.lastSlot = key;
        cleanupOld().catch(() => {});
      }
      meta.lastDrive = new Date().toISOString(); meta.lastBooks = n; meta.pending = false;
      if (window.MA_DIARY) meta.diarySig = window.MA_DIARY.sig();
      saveMeta();
      try { await syncImgs(); } catch (e) { console.warn('img sync', e); }
      return n;
    } catch (e) {
      handleErr(e, interactive);
      return false;
    } finally { busy = false; progress = ''; render(); }
  }

  async function cleanupOld() {
    const cutoff = dayStamp(new Date(Date.now() - KEEP_DAILY * 864e5));
    const files = (await listFiles()).filter(f => /^maktaba-aziz-\d{4}-\d\d-\d\d/.test(f.name) && f.name.slice(13, 23) < cutoff);
    for (const f of files) await api(`${DRIVE}/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });
  }

  // ---------- مقررہ اوقات: صبح 8، دوپہر 2، رات 8 ----------
  const SLOTS = [8, 14, 20];
  function dueSlot() {
    const now = new Date();
    // آج کا سب سے آخری گزرا ہوا وقت؛ نہ ہو تو کل رات 8
    let d = new Date(now), h = [...SLOTS].reverse().find(x => now.getHours() >= x);
    if (h === undefined) { d = new Date(now.getTime() - 864e5); h = 20; }
    const key = `${dayStamp(d)}-${pad(h)}`;
    return key === meta.lastSlot ? null : { key, slot: pad(h) };
  }
  let slotWaiting = null;
  async function checkSchedule() {
    if (!meta.auto || !clientId() || !navigator.onLine || busy || !meta.email) return;
    const due = dueSlot(); if (!due) return;
    if (!host().snapshot().books.length) return;
    if (token && Date.now() < tokenExp - 60000) { await backup(false, due.slot, due.key); return; }
    // ٹوکن نہیں — اگلے ٹچ پر خاموشی سے اجازت لے کر بیک اپ (پاپ اپ بغیر ٹچ کے بلاک ہوتا ہے)
    slotWaiting = due; render();
  }
  document.addEventListener('pointerdown', () => {
    if (!slotWaiting || busy) return;
    const slot = slotWaiting; slotWaiting = null;
    getToken(true).then(() => backup(false, slot.slot, slot.key)).catch(() => { slotWaiting = slot; });
  }, true);

  function slotLabel(f) {
    if (f.name === LATEST_NAME) return 'تازہ ترین بیک اپ';
    const m = f.name.match(/^maktaba-aziz-(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)00)?\.json$/);
    if (!m) return f.name;
    const d = `${m[3]}/${m[2]}/${m[1]}`;
    const t = { '08': 'صبح 8 بجے', '14': 'دوپہر 2 بجے', '20': 'رات 8 بجے' }[m[4]];
    return t ? `<bdi dir="ltr">${d}</bdi> · ${t}` : `<bdi dir="ltr">${d}</bdi> · دستی`;
  }

  let lastErr = '';
  function handleErr(e, interactive) {
    console.warn('drive', e);
    lastErr = '';
    const m = e.message || '';
    if (m === 'need-consent') return;                 // خاموش کوشش — بعد میں
    if (!interactive && m === 'expired') return;
    const msg =
      m === 'no-client' ? 'پہلے Google Client ID درج کریں' :
      m === 'offline' ? 'انٹرنیٹ نہیں ہے — آن لائن ہو کر دوبارہ کریں' :
      m === 'gis' ? 'Google سے رابطہ نہیں ہو سکا — انٹرنیٹ دیکھیں' :
      /popup|access_denied/.test(m) ? 'Google اکاؤنٹ کی اجازت نہیں ملی' :
      /origin|invalid_client|idpiframe/.test(m) ? 'Client ID اس ویب سائٹ کے لیے درست نہیں' :
      'Drive بیک اپ نہیں ہو سکا — دوبارہ کوشش کریں';
    lastErr = msg;
    if (!capActive) toast(msg);
  }

  // ---------- بحال کرنا ----------
  async function openRestore() {
    const box = $('driveRestore');
    box.hidden = false;
    box.innerHTML = `<p class="dr-wait"><span class="spin"></span>فائلیں آ رہی ہیں…</p>`;
    try {
      await getToken(true);
      if (!meta.email) await whoAmI();
      const files = (await listFiles()).filter(f => /\.json$/.test(f.name));
      if (!files.length) { box.innerHTML = `<p class="dr-wait">کوئی بیک اپ نہیں ملا</p>`; return; }
      files.sort((a, b) => (b.name === LATEST_NAME) - (a.name === LATEST_NAME) || b.modifiedTime.localeCompare(a.modifiedTime));
      box.innerHTML = files.slice(0, 120).map(f => {
        const n = f.appProperties?.books ?? '?';
        const lbl = f.name === LATEST_NAME ? `تازہ ترین · <bdi dir="ltr">${when(f.modifiedTime)}</bdi>` : slotLabel(f);
        return `<button type="button" class="dr-file" data-id="${f.id}" data-n="${n}">
          <span class="dr-n" dir="ltr">${n}<small>کتب</small></span><span class="dr-t"><b>${lbl}</b></span></button>`;
      }).join('');
    } catch (e) { box.hidden = true; handleErr(e, true); }
  }

  function askRestore(btn) {
    const { id, n, l } = btn.dataset;
    const box = $('driveRestore');
    box.querySelectorAll('.dr-ask').forEach(x => x.remove());
    btn.insertAdjacentHTML('afterend', `<div class="dr-ask"><span>${n} کتب واپس لائیں؟ فون کا موجودہ ریکارڈ بدل جائے گا</span>
      <button type="button" class="btn danger small" data-yes="${id}">ہاں</button><button type="button" class="btn ghost small" data-no="1">نہیں</button></div>`);
  }
  async function restoreFile(id) {
    closeBox(); capActive = true;
    capStart('Drive سے ری اسٹور ہو رہا ہے…');
    try {
      await getToken(true);
      const j = await (await api(`${DRIVE}/${id}?alt=media`)).json();
      if (!j || !Array.isArray(j.books)) throw new Error('bad');
      host().replace(j);
      meta.lastDrive = new Date().toISOString(); meta.pending = false; meta.lastBooks = j.books.length; saveMeta(); render();
      let ni = 0; try { capStart('یادداشتوں کی تصاویر واپس آ رہی ہیں…'); ni = await fetchImgs(); } catch (e) { console.warn(e); }
      capEnd(true, `ری اسٹور مکمل — ${j.books.length} کتب واپس آ گئیں` + (ni ? ` · ${ni} تصاویر` : ''));
    } catch (e) {
      handleErr(e, true);
      capEnd(false, e.message === 'bad' ? 'یہ فائل درست بیک اپ نہیں' : (lastErr || 'ری اسٹور نہیں ہو سکا'));
    } finally { capActive = false; }
  }

  // ---------- خودکار بیک اپ ----------
  function onChanged() {
    meta.pending = true; meta.lastChange = new Date().toISOString(); saveMeta(); render();
    if (!meta.auto || !clientId() || !navigator.onLine) return;
    const hasToken = token && Date.now() < tokenExp - 60000;
    // پہلے اجازت دی جا چکی ہو تو (اسی ٹچ کے دوران) خاموشی سے نیا ٹوکن لے لیں — ہر تبدیلی Drive تک پہنچے
    if (!hasToken && meta.email) getToken(true).catch(() => {});
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      if (token && Date.now() < tokenExp - 60000 && navigator.onLine) backup(false);
    }, AUTO_DELAY);
  }

  // ---------- صفحے پر کیپسول پروگریس (0% → 100% → ✓) ----------
  let capTimer = null, capPct = 0, capActive = false;
  function capsule() {
    let c = $('maCap');
    if (!c) {
      c = document.createElement('div'); c.id = 'maCap'; c.className = 'ma-cap'; c.setAttribute('role', 'status');
      c.innerHTML = `<span class="mc-ico"></span><span class="mc-body"><span class="mc-lbl"></span><span class="mc-bar"><i></i></span></span><b class="mc-pct" dir="ltr">0%</b>`;
      document.body.appendChild(c);
    }
    return c;
  }
  function capStart(label) {
    const c = capsule(); clearInterval(capTimer); clearTimeout(c._hide);
    c.className = 'ma-cap show'; capPct = 0;
    c.querySelector('.mc-lbl').textContent = label;
    c.querySelector('.mc-ico').innerHTML = DRIVE_ICO;
    const set = () => { c.querySelector('i').style.width = capPct + '%'; c.querySelector('.mc-pct').textContent = Math.round(capPct) + '%'; };
    set();
    capTimer = setInterval(() => { capPct = Math.min(92, capPct + Math.max(0.6, (92 - capPct) / 14)); set(); }, 120);
  }
  function capEnd(ok, label) {
    const c = capsule(); clearInterval(capTimer);
    if (ok) { capPct = 100; c.querySelector('i').style.width = '100%'; c.querySelector('.mc-pct').textContent = '100%'; }
    setTimeout(() => {
      c.className = 'ma-cap show ' + (ok ? 'done' : 'fail');
      c.querySelector('.mc-lbl').textContent = label;
      c.querySelector('.mc-ico').innerHTML = ok ? '✓' : '✕';
      c.querySelector('.mc-pct').textContent = ok ? '' : '';
      c._hide = setTimeout(() => { c.className = 'ma-cap'; }, ok ? 2600 : 4000);
    }, ok ? 250 : 0);
  }
  const DRIVE_ICO = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#0f9d58" d="M8 3h8l7 12h-8z"/><path fill="#4285f4" d="M1 15l4 7h14l-4-7z"/><path fill="#f4b400" d="M8 3L1 15l4 7 7-12z"/></svg>';
  function closeBox() {
    const box = $('backupBox'); if (box) box.hidden = true;
    $('btnBackup')?.setAttribute('aria-expanded', 'false');
    const r = $('driveRestore'); if (r) r.hidden = true;
  }

  // ---------- UI ----------
  function render() {
    const chip = $('btnBackup');
    if (chip) {
      chip.classList.toggle('warn', !!meta.pending || !meta.lastDrive);
      chip.classList.toggle('safe', !meta.pending && !!meta.lastDrive);
    }
    const st = $('driveStatus'); if (!st) return;
    if (!clientId()) {
      st.innerHTML = `<span class="ds warn">Client ID درج کریں</span>`;
    } else if (busy) {
      st.innerHTML = `<span class="ds busy">${progress || 'رابطہ ہو رہا ہے…'}</span>`;
    } else if (!meta.lastDrive) {
      st.innerHTML = `<span class="ds warn">ابھی کوئی بیک اپ نہیں ہوا</span>`;
    } else {
      st.innerHTML = `<span class="ds ${meta.pending ? 'warn' : 'ok'}">${meta.pending ? 'نئی تبدیلیاں باقی' : 'محفوظ'} · <bdi dir="ltr">${when(meta.lastDrive)}</bdi> · ${meta.lastBooks ?? 0} کتب</span>`;
    }
    const b = $('btnDriveBackup'); if (b) b.disabled = busy;
    const a = $('driveAuto'); if (a) a.checked = !!meta.auto;
    const cf = $('driveClientRow'); if (cf) cf.hidden = !!clientId() && !$('driveClientRow').dataset.show;
    const cin = $('driveClientId'); if (cin && document.activeElement !== cin) cin.value = clientId();
    const dl = document.querySelector('.drive-links'); if (dl) dl.hidden = !!clientId();
  }

  function wire() {
    $('btnDriveBackup')?.addEventListener('click', async () => {
      closeBox(); capActive = true;
      capStart(`Drive پر بیک اپ — ${host().snapshot().books.length} کتب`);
      const n = await backup(true);
      capActive = false;
      if (n !== false) capEnd(true, `بیک اپ مکمل — ${n} کتب Drive پر محفوظ`);
      else capEnd(false, lastErr || 'بیک اپ نہیں ہو سکا');
    });
    $('btnDriveRestore')?.addEventListener('click', openRestore);
    $('driveRestore')?.addEventListener('click', e => {
      const y = e.target.closest('[data-yes]'); if (y) { restoreFile(y.dataset.yes); return; }
      if (e.target.closest('[data-no]')) { e.target.closest('.dr-ask').remove(); return; }
      const f = e.target.closest('.dr-file'); if (f) askRestore(f);
    });
    $('driveAuto')?.addEventListener('change', e => { meta.auto = e.target.checked; saveMeta(); });
    $('driveClientSave')?.addEventListener('click', () => {
      const v = $('driveClientId').value.trim();
      if (v && !/\.apps\.googleusercontent\.com$/.test(v)) { toast('Client ID «…apps.googleusercontent.com» پر ختم ہوتا ہے'); return; }
      meta.clientId = v; meta.email = null; meta.folderId = null; meta.latestId = null; token = null; tokenClient = null;
      delete $('driveClientRow').dataset.show; saveMeta(); render();
      toast(v ? 'Client ID محفوظ ہو گیا' : 'Client ID ہٹا دیا');
    });
    $('driveClientEdit')?.addEventListener('click', () => { const r = $('driveClientRow'); r.dataset.show = '1'; r.hidden = false; });
    $('driveSwitch')?.addEventListener('click', () => {
      meta.email = null; meta.folderId = null; meta.latestId = null; token = null; saveMeta();
      toast('اگلے بیک اپ پر اکاؤنٹ دوبارہ چنیں'); render();
    });
    window.addEventListener('ma-data-changed', onChanged);
    // ڈائری میں کچھ بدلا ہو (ڈائری الگ صفحے پر ہے) تو مکتبہ کھلتے ہی بیک اپ
    setTimeout(() => { try { if (window.MA_DIARY && meta.diarySig !== window.MA_DIARY.sig()) onChanged(); } catch (e) {} }, 2500);
    if (clientId() && navigator.onLine) loadGis().catch(() => {});
    setTimeout(checkSchedule, 3000);
    setInterval(checkSchedule, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkSchedule(); });
    window.addEventListener('online', () => setTimeout(checkSchedule, 2000));
    render();
  }

  window.MA_DRIVE = { backup, render, meta: () => meta, _dueSlot: () => dueSlot(), _check: () => checkSchedule() };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
