/* میرا مکتبہ — معطل فہرست کی جانچ
   انٹرنیٹ ہو تو block.json دیکھتا ہے: اس فون کی UID اس میں ہو تو ایپ معطل، نہ ہو تو بحال۔
   ہر کامیاب جانچ کی تاریخ محفوظ ہوتی ہے؛ بہت دن انٹرنیٹ نہ ملے تو ایپ ایک بار انٹرنیٹ مانگتی ہے۔ */
(function () {
  const KEY = 'maktaba-aziz-lic';
  const inDiary = location.pathname.includes('/diary/');
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  let busy = null;
  function check() {
    if (busy) return busy;
    if (navigator.onLine === false) return Promise.resolve(null);
    busy = fetch((inDiary ? '../' : '') + 'block.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j || typeof j !== 'object') return null;
        let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
        if (!s || !s.uid) return null;
        const b = !!(j.blocked && j.blocked[s.uid]);
        const was = !!s.blk;
        s.blk = b; s.chk = iso(new Date());
        try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
        if (b && inDiary) { location.replace('../maktaba.html?next=diary'); return b; }
        try { window.dispatchEvent(new CustomEvent('ma-lic-checked', { detail: { blocked: b, changed: b !== was } })); } catch (e) {}
        return b;
      })
      .catch(() => null)
      .finally(() => { busy = null; });
    return busy;
  }
  window.MA_GUARD = { check };
  check();
  setInterval(() => { if (!document.hidden) check(); }, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('online', check);
})();
