/* میرا مکتبہ — اپڈیٹ کی اطلاع
   نیا ورژن اترنا شروع ہو تو اوپر پٹی: «نئی اپڈیٹ آ رہی ہے…»
   اپڈیٹ مکمل ہو کر صفحہ تازہ ہو تو پیغام: پرانا ورژن → نیا ورژن */
(function () {
  const V = 'MA810TH078';
  const KEY = 'maktaba-aziz-seen-version';
  const CSS = `
  .up-bar{position:fixed;left:0;right:0;top:0;z-index:60000;display:flex;align-items:center;justify-content:center;gap:12px;
    padding:calc(8px + env(safe-area-inset-top)) 14px 8px;background:linear-gradient(180deg,#8e1b12,#c0392b);color:#fff6e0;
    font-family:"JNN","Noto Nastaliq Urdu",serif;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.45);direction:rtl;animation:upIn .35s ease both}
  .up-bar b{display:block;font-weight:400;font-size:18px;line-height:1.7;color:#ffe08a}
  .up-bar small{display:block;font-size:14px;line-height:1.7}
  .up-spin{flex:none;width:30px;height:30px;border-radius:50%;border:3.5px solid rgba(255,240,200,.35);border-top-color:#ffe08a;animation:upSpin .9s linear infinite}
  @keyframes upSpin{to{transform:rotate(360deg)}}
  @keyframes upIn{from{transform:translateY(-100%)}to{transform:none}}
  .up-ov{position:fixed;inset:0;z-index:60001;display:grid;place-items:center;padding:20px;background:rgba(4,20,16,.6);direction:rtl;animation:upFade .3s ease both}
  @keyframes upFade{from{opacity:0}to{opacity:1}}
  .up-card{width:100%;max-width:340px;text-align:center;padding:20px 18px 18px;border-radius:24px;font-family:"JNN","Noto Nastaliq Urdu",serif;color:#14463a;
    background:linear-gradient(180deg,#ffffff,#fbf4e2 45%,#efe0bb);box-shadow:0 0 0 3px #c8962f,0 10px 0 #8a5f16,0 24px 40px rgba(0,0,0,.5);animation:upPop .45s cubic-bezier(.2,1.4,.4,1) both}
  @keyframes upPop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}
  .up-ic{font-size:48px;line-height:1.2}
  .up-card h3{font-weight:400;font-size:24px;line-height:1.8;margin:4px 0 8px}
  .up-v{display:grid;gap:8px;margin:6px 0 14px}
  .up-v div{display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:14px;padding:4px 14px;font-size:16px;line-height:1.9}
  .up-v .o{background:#f3e2cc;color:#6b4a3a}
  .up-v .n{background:linear-gradient(180deg,#2f8f6f,#14463a);color:#fff1c1}
  .up-v span{font:700 15px ui-monospace,Menlo,Consolas,monospace;direction:ltr;letter-spacing:.5px}
  .up-ok{border:0;width:100%;border-radius:99px;padding:6px;font:inherit;font-size:19px;line-height:1.8;cursor:pointer;color:#0b2e26;
    background:linear-gradient(180deg,#fff6d5,#f1d27a 40%,#c8962f);box-shadow:0 0 0 2px #fff3c4,0 5px 0 #8a5f16}
  .up-ok:active{transform:translateY(3px);box-shadow:0 0 0 2px #fff3c4,0 2px 0 #8a5f16}`;
  function css() { if (document.getElementById('upCss')) return; const s = document.createElement('style'); s.id = 'upCss'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------- اپڈیٹ آ رہی ہے ----------
  let barShown = false;
  function showBar() {
    if (barShown || !document.body) return; barShown = true; css();
    const b = document.createElement('div'); b.className = 'up-bar'; b.id = 'upBar'; b.setAttribute('role', 'status');
    b.innerHTML = '<span class="up-spin" aria-hidden="true"></span><span><b>نئی اپڈیٹ آ رہی ہے</b><small>تھوڑا سا انتظار فرمائیں — ایپ میں کام روک دیں</small></span>';
    document.body.appendChild(b);
  }

  // ---------- اپڈیٹ ہو گئی ----------
  function showDone(oldV) {
    css();
    const ov = document.createElement('div'); ov.className = 'up-ov';
    ov.innerHTML = `<div class="up-card" role="dialog" aria-label="ایپ اپڈیٹ ہو گئی">
      <div class="up-ic">🎉</div>
      <h3>آپ کی ایپ اپڈیٹ ہو گئی ہے</h3>
      <div class="up-v"><div class="o">پرانا ورژن <span>${oldV}</span></div><div class="n">نیا ورژن <span>${V}</span></div></div>
      <button type="button" class="up-ok">ٹھیک ہے</button></div>`;
    const close = () => ov.remove();
    ov.querySelector('.up-ok').onclick = close;
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    document.body.appendChild(ov);
  }
  function checkSeen() {
    let old = ''; try { old = localStorage.getItem(KEY) || ''; localStorage.setItem(KEY, V); } catch (e) {}
    if (old && old !== V) showDone(old);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkSeen); else checkSeen();

  // ---------- نیا ورژن تلاش کرنا ----------
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true; showBar(); setTimeout(() => location.reload(), 300);
  });
  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return;
    const watch = w => { if (!w || !hadController) return; showBar(); };
    if (reg.installing) watch(reg.installing);
    reg.addEventListener('updatefound', () => watch(reg.installing));
    // ایپ کھلی رہے تب بھی ہر 2 منٹ بعد نیا ورژن دیکھیں
    const check = () => { if (!document.hidden) reg.update().catch(() => {}); };
    setInterval(check, 120000);
    document.addEventListener('visibilitychange', check);
  }).catch(() => {});
})();
