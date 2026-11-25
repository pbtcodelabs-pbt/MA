window.APP_UPD_LANG = 'ur';
/* ===== یکساں اپڈیٹ پاپ اپ (سب ایپس میں ایک جیسا) — انتظار کی پٹی + "اپڈیٹ مکمل" کارڈ =====
   AppUpd.waiting(sub) — اوپر چھوٹا کارڈ، ریت والی گھڑی؛ AppUpd.hideWaiting()
   AppUpd.done(oldV, newV, note) — پرانا (کٹا ہوا) → نیا ورژن، ایک لائن میں کیا بدلا، نیچے درمیان OK */
(function(){
  if(window.AppUpd) return;
  var L = (window.APP_UPD_LANG === 'en') ? 'en' : 'ur';
  var T = L === 'en' ? {
    wait:'Updating the app…', waitSub:'Please wait a moment — pause your work', done:'Update complete',
    oldV:'Old version', newV:'New version', ok:'OK', what:'What’s new'
  } : {
    wait:'نئی اپڈیٹ آ رہی ہے…', waitSub:'براہِ کرم تھوڑا انتظار کریں — کام روک دیں', done:'اپڈیٹ مکمل ہو گئی',
    oldV:'پرانا ورژن', newV:'نیا ورژن', ok:'اوکے', what:'کیا نیا ہے'
  };
  var CSS = ''
  + '.aupd-shield{position:fixed;inset:0;z-index:2147483645;background:rgba(8,20,40,.5);backdrop-filter:blur(2px);display:none}'
  + '.aupd-shield.show{display:block}.aupd-shield.passive{background:rgba(8,20,40,.15);backdrop-filter:none;pointer-events:none}'
  + '.aupd-wait{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2147483646;width:min(360px,calc(100vw - 24px));'
  +   'display:none;align-items:center;gap:12px;padding:10px 14px;border-radius:16px;color:#fff;background:linear-gradient(135deg,#0d3b66,#0f766e);'
  +   'box-shadow:0 10px 28px rgba(0,0,0,.35);font-family:inherit;overflow:hidden}'
  + '.aupd-wait.show{display:flex;animation:aupdDrop .35s ease}'
  + '.aupd-wait .aw-t{font-size:15px;font-weight:800;line-height:1.5}.aupd-wait .aw-s{font-size:12px;opacity:.9;line-height:1.6}'
  + '.aupd-wait .aw-v{display:none;margin-top:4px;font-size:12px;line-height:1.6}.aupd-wait .aw-v.on{display:block}'
  + '.aupd-wait .aw-v .vv{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;direction:ltr;unicode-bidi:isolate}'
  + '.aupd-wait .aw-v .vo{opacity:.75;text-decoration:line-through}.aupd-wait .aw-v .vn{background:#fde68a;color:#0d3b66;border-radius:8px;padding:0 7px;font-weight:800}'
  + '.aupd-wait .aw-v .vt{display:block;margin-top:3px;padding:4px 8px;border-radius:9px;background:rgba(255,255,255,.14);font-weight:700;max-height:22vh;overflow:auto;overflow-wrap:anywhere}'
  + '.aupd-wait .aw-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:repeating-linear-gradient(-45deg,#fde68a 0 10px,#f59e0b 10px 20px);background-size:28px 28px;animation:aupdMove .7s linear infinite}'
  + '.aupd-glass{width:22px;height:30px;flex:0 0 auto;animation:aupdFlip 2.4s ease-in-out infinite}'
  + '.aupd-glass .sa{animation:aupdTop 2.4s linear infinite;transform-origin:50% 100%}.aupd-glass .sb{animation:aupdBot 2.4s linear infinite;transform-origin:50% 100%}'
  + '.aupd-glass .st{animation:aupdStream 2.4s linear infinite}'
  + '.aupd-ov{position:fixed;inset:0;z-index:2147483647;background:rgba(8,20,40,.55);display:none;align-items:center;justify-content:center;padding:16px}'
  + '.aupd-ov.show{display:flex}'
  + '.aupd-card{width:min(340px,100%);background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.4);animation:aupdPop .45s cubic-bezier(.2,1.4,.4,1);font-family:inherit;text-align:center}'
  + '.aupd-card .ah{background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:14px 12px 12px;font-size:18px;font-weight:800;line-height:1.5}'
  + '.aupd-card .ab{padding:12px 16px 4px}'
  + '.aupd-card .av{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #e5e7eb;border-radius:12px;padding:7px 12px;margin:6px 0;font-size:13px;color:#374151}'
  + '.aupd-card .av b{direction:ltr;unicode-bidi:isolate;font-family:Arial,sans-serif;font-size:14.5px;letter-spacing:.4px}'
  + '.aupd-card .av.o b{color:#9ca3af;text-decoration:line-through}.aupd-card .av.n{border-color:#34d399;background:#ecfdf5}.aupd-card .av.n b{color:#047857}'
  + '.aupd-card .aa{color:#10b981;font-size:16px;line-height:1}'
  + '.aupd-card .anote{margin:10px 0 4px;padding:8px 12px;border-radius:12px;background:#fffbeb;border:1px solid #fcd34d;color:#78350f;font-size:13.5px;font-weight:700;line-height:1.7;'
  +   'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'
  + '.aupd-card .af{padding:10px 16px 16px;display:flex;justify-content:center}'
  + '.aupd-card .aok{min-width:140px;height:44px;border:none;border-radius:14px;background:linear-gradient(135deg,#0d3b66,#0f766e);color:#fff;font-size:17px;font-weight:800;font-family:inherit;box-shadow:0 5px 0 #0a2c4d;cursor:pointer}'
  + '.aupd-card .aok:active{transform:translateY(3px);box-shadow:0 2px 0 #0a2c4d}'
  + '@keyframes aupdDrop{from{transform:translate(-50%,-120%)}to{transform:translate(-50%,0)}}'
  + '@keyframes aupdPop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}'
  + '@keyframes aupdMove{to{background-position:28px 0}}'
  + '@keyframes aupdFlip{0%,80%{transform:rotate(0)}100%{transform:rotate(180deg)}}'
  + '@keyframes aupdTop{0%{transform:scaleY(1)}80%,100%{transform:scaleY(0)}}'
  + '@keyframes aupdBot{0%{transform:scaleY(0)}80%,100%{transform:scaleY(1)}}'
  + '@keyframes aupdStream{0%,78%{opacity:1}80%,100%{opacity:0}}';
  var GLASS = '<svg class="aupd-glass" viewBox="0 0 22 30" aria-hidden="true">'
    + '<rect x="2" y="1" width="18" height="2.5" rx="1.2" fill="#fde68a"/><rect x="2" y="26.5" width="18" height="2.5" rx="1.2" fill="#fde68a"/>'
    + '<path d="M4 3.5h14c0 5-4 7.5-6 11.5 2 4 6 6.5 6 11.5H4c0-5 4-7.5 6-11.5-2-4-6-6.5-6-11.5z" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="1.3"/>'
    + '<path class="sa" d="M6.5 6h9c-.6 2.6-2.8 4.4-4.5 7-1.7-2.6-3.9-4.4-4.5-7z" fill="#fbbf24"/>'
    + '<rect class="st" x="10.4" y="13" width="1.2" height="10" fill="#fbbf24"/>'
    + '<path class="sb" d="M5.6 25.5h10.8c-.4-2.4-2.6-4.3-5.4-5.6-2.8 1.3-5 3.2-5.4 5.6z" fill="#fbbf24"/></svg>';
  function css(){ if(document.getElementById('aupdCss')) return; var s=document.createElement('style'); s.id='aupdCss'; s.textContent=CSS; document.head.appendChild(s); }
  function el(id, cls, html){ var e=document.getElementById(id); if(!e){ e=document.createElement('div'); e.id=id; e.className=cls; if(html) e.innerHTML=html; document.body.appendChild(e); } return e; }
  function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var dir = L==='en' ? 'ltr' : 'rtl';
  window.AppUpd = {
    lang: L,
    waiting: function(sub, passive){
      css();
      var sh = el('aupdShield','aupd-shield');
      var w = el('aupdWait','aupd-wait', GLASS + '<div><div class="aw-t"></div><div class="aw-s"></div><div class="aw-v"></div></div><div class="aw-bar"></div>');
      w.setAttribute('dir', dir); w.setAttribute('role','status');
      w.querySelector('.aw-t').textContent = T.wait;
      w.querySelector('.aw-s').textContent = sub || T.waitSub;
      sh.classList.add('show'); sh.classList.toggle('passive', !!passive); w.classList.add('show'); try{ this.peek(); }catch(e){}
    },
    /* AppUpd.peek (ہیلپ ڈیسک #136، مالک کا حکم): اپڈیٹ کے دوران ہی پرانا → نیا ورژن اور کیا بدلا — نئی فائل سرور سے پڑھ کر */
    oldVer: function(){ var v=window.APP_UPD_OLD||''; if(!v){ try{ v=window.APP_VERSION||''; }catch(e){} } if(!v){ try{ v=APP_VERSION; }catch(e){} } if(!v){ try{ v=APP_BUILD_VERSION; }catch(e){} } if(!v){ try{ v=V; }catch(e){} } return String(v||''); },
    peek: function(){
      var self=this, w=document.getElementById('aupdWait'); if(!w) return; var box=w.querySelector('.aw-v'); if(!box) return;
      var oldV=self.oldVer(), url=(window.APP_UPD_SRC||'/MA/update.js')||location.pathname;
      fetch(url+(url.indexOf('?')<0?'?':'&')+'aupd='+Date.now(), {cache:'no-store'}).then(function(r){ return r.ok?r.text():''; }).then(function(t){
        if(!t) return;
        var m=t.match(/(?:APP_VERSION|APP_BUILD_VERSION|const\s+V)\s*=\s*["']([A-Za-z0-9]+)["']/); var nv=m?m[1]:'';
        if(!nv || nv===oldV) return;
        var note='', nm=t.match(new RegExp('["\']'+nv+'["\']\\s*:\\s*(["\'])((?:\\\\.|(?!\\1).)*)\\1'));
        if(nm) note=nm[2]; else { var u=t.match(/UPDATE_NOTE\s*=\s*(["'`])((?:\\.|(?!\1).)*)\1/); if(u) note=u[2]; }
        note=note.replace(/\\n/g,' ').replace(/\\(["'\\])/g,'$1');
        box.innerHTML='<span class="vv">'+(oldV?'<span class="vo">'+esc(oldV)+'</span> → ':'')+'<span class="vn">'+esc(nv)+'</span></span>'
          +(note?'<span class="vt">🛠️ '+esc(note)+'</span>':'');
        box.classList.add('on'); self._peekV=nv; self._peekNote=note;
      }).catch(function(){});
    },
    hideWaiting: function(){
      var w=document.getElementById('aupdWait'), sh=document.getElementById('aupdShield');
      if(w) w.classList.remove('show'); if(sh) sh.classList.remove('show','passive');
    },
    isWaiting: function(){ var w=document.getElementById('aupdWait'); return !!(w && w.classList.contains('show')); },
    done: function(oldV, newV, note){ if(!note && this._peekNote && this._peekV===newV) note=this._peekNote;
      css(); this.hideWaiting();
      var ov = el('aupdDone','aupd-ov');
      ov.setAttribute('dir', dir);
      ov.innerHTML = '<div class="aupd-card" role="dialog" aria-modal="true">'
        + '<div class="ah">✅ ' + esc(T.done) + '</div><div class="ab">'
        + (oldV ? '<div class="av o"><span>' + esc(T.oldV) + '</span><b>' + esc(oldV) + '</b></div><div class="aa">⬇</div>' : '')
        + '<div class="av n"><span>' + esc(T.newV) + '</span><b>' + esc(newV) + '</b></div>'
        + (note ? '<div class="anote">🛠️ ' + esc(note) + '</div>' : '')
        + '</div><div class="af"><button type="button" class="aok">' + esc(T.ok) + '</button></div></div>';
      ov.querySelector('.aok').onclick = function(){ ov.classList.remove('show'); };
      ov.classList.add('show');
    },
    hideDone: function(){ var ov=document.getElementById('aupdDone'); if(ov) ov.classList.remove('show'); }
  };
})();
/* ===== 🔄 خاموش اپڈیٹ (مالک کا حکم، 17 نومبر 2026 — سب ایپس، My City Shines MCS1711TU509 جیسا) =====
   گاہک / ملازم / Admin 2: اپڈیٹ کا کوئی کارڈ / پردہ نہیں — پیچھے خاموشی سے؛ صفحہ تب تازہ جب کچھ لکھ نہ رہے ہوں اور 8 سیکنڈ سے اسکرین نہ چھوئی ہو (یا ایپ پیچھے جائے)۔
   صرف مالک کا فون (ہیلپ ڈیسک کا ڈویلپر پاس ورڈ `pbt_devpass_v1` یا `pbt_upd_owner` اسی ویب سائٹ پر): اوپر باریک پٹی 0→100٪، پھر چھوٹی پرچی «پرانا → نیا + تازہ ترین کام» (10 سیکنڈ)۔ */
(function(){ var A = window.AppUpd; if(!A || A.__quiet) return; A.__quiet = 1;
  var origPeek = A.peek, on = false, pct = 0, tm = 0, ownC = null, touch = 0;
  function sharedLS(fn){ try{ var f = document.createElement('iframe'); f.style.display = 'none'; (document.body || document.documentElement).appendChild(f); var r = fn(f.contentWindow.localStorage); f.remove(); return r; }catch(e){ return null; } }
  function own(){ if(ownC !== null) return ownC; var v = sharedLS(function(ls){ return ls.getItem('pbt_upd_owner') === '1' || !!ls.getItem('pbt_devpass_v1'); });
    if(!v){ try{ v = localStorage.getItem('pbt_upd_owner') === '1'; }catch(e){} } ownC = !!v; return ownC; }
  window.pbtUpdOwnerMark = function(){ ownC = true; sharedLS(function(ls){ ls.setItem('pbt_upd_owner', '1'); }); try{ localStorage.setItem('pbt_upd_owner', '1'); }catch(e){} };
  /* ڈویلپر پینل کا درست پاس ورڈ = مالک کا فون (اگلی بار سے پٹی) */
  setTimeout(function hk(){ try{ var p = window.pbtHubPwOk; if(typeof p === 'function' && !p.__q){ var w = function(){ return Promise.resolve(p.apply(this, arguments)).then(function(ok){ if(ok) window.pbtUpdOwnerMark(); return ok; }); }; w.__q = 1; window.pbtHubPwOk = w; } }catch(e){} }, 3000);
  function E(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css(){ if(document.getElementById('qupdCss')) return; var s = document.createElement('style'); s.id = 'qupdCss';
    s.textContent = '#qupdBar{position:fixed;left:0;top:env(safe-area-inset-top,0px);height:3px;width:0;z-index:2147483647;background:linear-gradient(90deg,#f59e0b,#fde047,#10b981);box-shadow:0 0 6px rgba(245,158,11,.8);transition:width .4s ease,opacity .6s;pointer-events:none}'
      + '#qupdBar i{position:absolute;right:4px;top:4px;font:800 10px/1 Arial,sans-serif;color:#fff;background:rgba(13,59,102,.85);padding:2px 6px;border-radius:8px;white-space:nowrap;font-style:normal;direction:ltr}'
      + '#qupdOk{position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2147483647;width:min(360px,calc(100vw - 20px));box-sizing:border-box;background:#ecfdf5;border:2px solid #10b981;border-radius:14px;padding:8px 12px;box-shadow:0 8px 22px rgba(0,0,0,.25);font:600 13px/1.6 Arial,sans-serif;color:#065f46;cursor:pointer;animation:qupdIn .3s ease;text-align:start}'
      + '#qupdOk b{direction:ltr;unicode-bidi:isolate}#qupdOk s{color:#9ca3af}#qupdOk .n{display:block;color:#78350f;font-weight:700;margin-top:2px;max-height:30vh;overflow:auto;overflow-wrap:anywhere;unicode-bidi:plaintext}'
      + '@keyframes qupdIn{from{transform:translate(-50%,-120%)}to{transform:translate(-50%,0)}}';
    document.head.appendChild(s); }
  function bar(){ css(); var b = document.getElementById('qupdBar'); if(!b){ b = document.createElement('div'); b.id = 'qupdBar'; b.innerHTML = '<i></i>'; document.body.appendChild(b); }
    b.style.opacity = '1'; if(!tm){ pct = Math.max(pct, 4); tm = setInterval(function(){ pct += (92 - pct) * 0.06; b.style.width = pct + '%'; var i = b.querySelector('i'); if(i) i.textContent = Math.round(pct) + '%' + (A._peekV ? ' · ' + A._peekV : ''); }, 300); } }
  function stop(full){ if(tm){ clearInterval(tm); tm = 0; } var b = document.getElementById('qupdBar'); if(!b) return; if(full){ b.style.width = '100%'; var i = b.querySelector('i'); if(i) i.textContent = '100%'; } setTimeout(function(){ b.style.opacity = '0'; setTimeout(function(){ if(b.parentNode) b.remove(); pct = 0; }, 700); }, full ? 900 : 0); }
  A.waiting = function(){ on = true; if(!own() || !document.body) return; bar();
    if(!A._peekV && typeof origPeek === 'function'){ var w = document.getElementById('aupdWait'); if(!w){ w = document.createElement('div'); w.id = 'aupdWait'; w.style.display = 'none'; w.innerHTML = '<div class="aw-t"></div><div class="aw-v"></div>'; document.body.appendChild(w); } try{ origPeek.call(A); }catch(e){} } };
  A.hideWaiting = function(){ on = false; stop(false); };
  A.isWaiting = function(){ return on; };
  A.done = function(oldV, newV, note){ on = false; if(!own() || !document.body){ stop(false); return; } bar(); stop(true);
    if(!note && A._peekNote && A._peekV === newV) note = A._peekNote;
    css(); var o = document.getElementById('qupdOk'); if(o) o.remove(); o = document.createElement('div'); o.id = 'qupdOk';
    o.innerHTML = '✅ Updated: ' + (oldV ? '<s><b>' + E(oldV) + '</b></s> → ' : '') + '<b>' + E(newV) + '</b>' + (note ? '<span class="n">🛠️ ' + E(note) + '</span>' : '');
    o.onclick = function(){ o.remove(); }; document.body.appendChild(o); setTimeout(function(){ if(o.parentNode) o.remove(); }, 10000); };
  /* نیا ورژن آنے پر صفحہ تب تازہ ہو جب گاہک کچھ لکھ / دبا نہ رہا ہو */
  try{ ['pointerdown', 'keydown', 'input', 'touchmove', 'wheel'].forEach(function(ev){ window.addEventListener(ev, function(){ touch = Date.now(); }, { passive: true, capture: true }); }); }catch(e){}
  function safe(){ if(document.visibilityState === 'hidden') return true; var ae = document.activeElement, typing = ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable); return !typing && Date.now() - touch > 8000; }
  try{ var SW = navigator.serviceWorker; if(SW && !SW.__quiet){ SW.__quiet = 1; var add = SW.addEventListener.bind(SW), pend = [];
    document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden'){ var p = pend.splice(0); p.forEach(function(f){ try{ f(); }catch(e){} }); } });
    SW.addEventListener = function(t, fn, o){ if(t !== 'controllerchange' || typeof fn !== 'function') return add(t, fn, o);
      return add(t, function(ev){ var self = this, fired = false; function run(){ if(fired) return; fired = true; var i = pend.indexOf(run); if(i >= 0) pend.splice(i, 1); fn.call(self, ev); }
        if(safe()) return run(); pend.push(run); (function wait(){ if(fired) return; if(safe()) run(); else setTimeout(wait, 2000); })(); }, o); }; } }catch(e){}
})();

/* میرا مکتبہ — اپڈیٹ کی اطلاع
   نیا ورژن اترنا شروع ہو تو اوپر پٹی: «نئی اپڈیٹ آ رہی ہے…»
   اپڈیٹ مکمل ہو کر صفحہ تازہ ہو تو پیغام: پرانا ورژن → نیا ورژن */
(function () {
  const V = 'MA2611TH165'; window.APP_UPD_OLD = V;
  const KEY = 'maktaba-aziz-seen-version';
  /* MA1810SU123: سب ایپس والا یکساں انداز (AppUpd، اسی فائل کے اوپر) */
  const UPDATE_NOTE = '🔗 کتاب کے فارم میں ڈرائیو / PDF کا لنک محفوظ کرنے کا نیا خانہ؛ کتاب کے صفحے پر «پوری کتاب کھولیں» کا بٹن'
  function showBar() { if (!document.body || AppUpd.isWaiting()) return; AppUpd.waiting(); }
  function showDone(oldV) { AppUpd.done(oldV, V, UPDATE_NOTE); }
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
