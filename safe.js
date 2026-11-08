/* میرا مکتبہ — 🛟 فون کے اندر حفاظتی کاپی (ہیلپ ڈیسک #149، مالک کا حکم: «ریکارڈ سارا غائب»)
   ریکارڈ localStorage میں ہے — یہ جگہ اسی ویب سائٹ کی سب ایپس میں بٹی ہے؛ براؤزر کی صفائی / جگہ کی کمی / کسی اور وجہ سے مٹ جائے تو
   سب کچھ صفر نظر آتا تھا۔ اب ہر تبدیلی کی نقل IndexedDB «maktaba-aziz-safe» میں (کتب، ڈائری، پہچان، لائسنس)؛
   ایپ کھلتے وقت اگر localStorage میں ریکارڈ نہ ملے (یا کتب صفر ہوں) اور حفاظتی کاپی میں ہوں تو پوچھ کر خود واپس۔
   صرف اپنی چابیاں: maktaba-aziz-* اور jsm_* — دوسری ایپس کی کوئی چیز نہیں چھیڑی جاتی۔ */
(function () {
  const DBN = 'maktaba-aziz-safe', ST = 'kv', DATA = 'maktaba-aziz-data-v1';
  const SKIP = new Set(['maktaba-aziz-seen-version']);
  const mine = k => !!k && !SKIP.has(k) && (k.indexOf('maktaba-aziz-') === 0 || k.indexOf('jsm_') === 0);
  const books = s => { try { const d = JSON.parse(s || 'null'); return d && Array.isArray(d.books) ? d.books.length : 0; } catch (e) { return 0; } };
  function grab() { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (mine(k)) o[k] = localStorage.getItem(k); } } catch (e) {} return o; }
  let idb = null;
  const open = () => idb || (idb = new Promise((res, rej) => {
    const r = indexedDB.open(DBN, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => res(r.result); r.onerror = () => { idb = null; rej(r.error); };
  }));
  const tx = (mode, fn) => open().then(d => new Promise((res, rej) => { const t = d.transaction(ST, mode), q = fn(t.objectStore(ST)); t.oncomplete = () => res(q && q.result); t.onerror = t.onabort = () => rej(t.error); }));
  let ready = false, lastSig = '';
  const sigOf = o => { let s = 0, h = 0; for (const k of Object.keys(o).sort()) { const v = o[k] || ''; s += v.length; for (let i = 0; i < v.length; i += 97) h = (h * 31 + v.charCodeAt(i)) | 0; h = (h * 31 + k.length) | 0; } return s + ':' + h; };
  async function write(force) {
    if (!ready) return;
    const o = grab(); const sig = sigOf(o);
    if (!force && sig === lastSig) return;
    try {
      const prev = await tx('readonly', s => s.get('snap'));
      // ریکارڈ اچانک صفر ہو جائے (مٹ گیا ہو) تو اچھی نقل کے اوپر خالی نہ لکھیں — پرانی محفوظ رہے
      const nb = books(o[DATA]), pb = prev && prev.keys ? books(prev.keys[DATA]) : 0;
      if (pb >= 3 && nb === 0 && !(prev && prev.zeroOk)) return;
      await tx('readwrite', s => s.put({ at: Date.now(), books: nb, keys: o }, 'snap'));
      lastSig = sig;
    } catch (e) {}
  }
  async function check() {
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      const snap = await tx('readonly', s => s.get('snap'));
      const cur = grab();
      if (snap && snap.keys) {
        const sb = books(snap.keys[DATA]), cb = books(cur[DATA]);
        const lost = Object.keys(snap.keys).filter(k => cur[k] == null);
        const dataLost = sb > 0 && (cur[DATA] == null || (cb === 0 && sb >= 3));
        if (dataLost || lost.length) {
          const ask = dataLost
            ? `🛟 فون میں آپ کے مکتبے کا ریکارڈ نہیں ملا (صفر نظر آ رہا ہے)۔\n\nمگر حفاظتی کاپی میں ${sb} کتب کا ریکارڈ محفوظ ہے (${new Date(snap.at).toLocaleString()})۔\n\nواپس لائیں؟`
            : '';
          let ok = !dataLost || confirm(ask);
          if (ok) {
            let n = 0;
            Object.keys(snap.keys).forEach(k => { if (cur[k] == null || (k === DATA && dataLost)) { try { localStorage.setItem(k, snap.keys[k]); n++; } catch (e) {} } });
            if (dataLost && n) {
              try { sessionStorage.setItem('maSafeRestored', String(sb)); } catch (e) {}
              location.reload(); return;
            }
          } else {
            // مالک نے خود «نہیں» کہا — آگے سے یہ خالی حالت مانی جائے
            await tx('readwrite', s => s.put(Object.assign({}, snap, { zeroOk: true }), 'snap')).catch(() => {});
          }
        }
      }
    } catch (e) {}
    ready = true;
    write(true);
    try {
      const r = sessionStorage.getItem('maSafeRestored');
      if (r) { sessionStorage.removeItem('maSafeRestored'); setTimeout(() => { const t = document.createElement('div'); t.textContent = `✅ ریکارڈ واپس آ گیا — ${r} کتب`; t.style.cssText = 'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:999999;background:#065f46;color:#fff;padding:12px 18px;border-radius:14px;font:700 17px "JNN","Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;box-shadow:0 8px 24px rgba(0,0,0,.3)'; document.body.appendChild(t); setTimeout(() => t.remove(), 6000); }, 800); }
    } catch (e) {}
  }
  if (!window.indexedDB) return;
  check();
  setInterval(() => write(false), 4000);
  window.addEventListener('ma-data-changed', () => setTimeout(() => write(false), 300));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') write(false); });
  window.addEventListener('pagehide', () => write(false));
  window.MA_SAFE = { write: () => write(true) };
})();
