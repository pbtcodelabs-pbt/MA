/* مکتبۃ العزیز — سبسکرپشن: کوئی ٹرائل نہیں، کوڈ کے بغیر ایپ بند۔
   مکمل آف لائن — نہ Firebase، نہ کوئی سرور، نہ کسی اور ایپ سے کوئی تعلق۔
   کوڈ میں ختم ہونے کی تاریخ اور بننے کی تاریخ دونوں ہیں؛ باقی دن نئے کوڈ پر خود جمع ہو جاتے ہیں (ڈیولپر پینل حساب لگاتا ہے)۔
   ہر فون کی اپنی UID ہے، کوڈ صرف اسی فون پر چلتا ہے۔ ڈیولپر پینل: ورژن بیج پر 7 ٹیپ + پاسورڈ۔ */
(() => {
  'use strict';

  // ===== یہاں صرف یہی چند چیزیں بدلی جا سکتی ہیں =====
  const CFG = {
    DEV_PHONE: '923206793793',   // ڈیولپر کا واٹس ایپ نمبر (بغیر + اور بغیر 0)
    PLAN_DAYS: 365,              // ایک سال
    WARN_DAYS: 30,               // اتنے دن رہ جائیں تو وارننگ
    SECRET: '904c5bf2c13a07d515b226bbeb7cc495598b5ad186dfce35', // کوڈ بنانے کا خفیہ راز — کسی کو نہ دیں
    PASS_HASH: '1c1c5aed8da780051eb69c626df2657e0c6fa013f4c59b759e8e99b1f8b7077e' // ڈیولپر پاسورڈ کا نشان (SHA-256)
  };

  const KEY = 'maktaba-aziz-lic', PWKEY = 'maktaba-aziz-lic-pw', LKEY = 'maktaba-aziz-lic-ledger';
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());
  const EPOCH = Date.UTC(2026, 0, 1);
  const idxOf = s => Math.round((Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) - EPOCH) / 864e5);
  const isoOf = d => { const x = new Date(EPOCH + d * 864e5); return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`; };
  const addDays = (s, n) => isoOf(idxOf(s) + n);
  const dayDiff = (a, b) => idxOf(a) - idxOf(b);
  const dmy = s => s ? `${s.slice(8, 10)}-${s.slice(5, 7)}-${s.slice(0, 4)}` : '';
  const dmyI = s => '\u2066' + dmy(s) + '\u2069';
  const parseDmy = t => { const m = String(t || '').match(/(\d{2})\D(\d{2})\D(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
  const num = n => (window.MA_APP && window.MA_APP.num) ? window.MA_APP.num(n) : String(n);
  const $ = (r, s) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- فون کی شناخت (UID) ----------
  function computeUid() {
    let gpu = '';
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (gl) { const e = gl.getExtension('WEBGL_debug_renderer_info'); if (e) gpu = gl.getParameter(e.UNMASKED_RENDERER_WEBGL) + '|' + gl.getParameter(e.UNMASKED_VENDOR_WEBGL); }
    } catch (e) {}
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    const fp = ['MAKTABA', Math.min(screen.width, screen.height), Math.max(screen.width, screen.height),
      Math.round((window.devicePixelRatio || 1) * 100), screen.colorDepth || 24, navigator.hardwareConcurrency || 2,
      navigator.deviceMemory || 4, navigator.maxTouchPoints || 0, navigator.platform || '', tz, gpu].join('|');
    let h1 = 0x811c9dc5, h2 = 5381;
    for (let i = 0; i < fp.length; i++) {
      const ch = fp.charCodeAt(i);
      h1 ^= ch; h1 = Math.imul(h1, 16777619) >>> 0;
      h2 = (Math.imul(h2, 33) ^ ch) >>> 0;
    }
    let n = (BigInt(h1) << 32n) | BigInt(h2), out = '';
    for (let i = 0; i < 8; i++) { out = A[Number(n & 31n)] + out; n >>= 5n; }
    return out.slice(0, 4) + '-' + out.slice(4);
  }
  const normUid = s => { const x = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return x.length === 8 ? x.slice(0, 4) + '-' + x.slice(4) : ''; };

  // ---------- محفوظ حالت: uid، exp (ختم)، iss (کوڈ بننے کی تاریخ)، code، name ----------
  let mem = null;
  const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.uid) return s; } catch (e) {} return mem; };
  const save = s => { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  function ensure() {
    let s = load();
    if (!s) { s = { uid: computeUid(), exp: '', iss: '', code: '', name: '' }; save(s); }
    return s;
  }

  // ---------- حالت: فعال / ختم / بند ----------
  function status() {
    const s = ensure(), t = today();
    if (s.exp && s.exp >= t) return { mode: 'paid', left: dayDiff(s.exp, t) + 1, exp: s.exp, iss: s.iss || '', uid: s.uid, code: s.code };
    return { mode: s.exp ? 'expired' : 'locked', exp: s.exp, uid: s.uid };
  }

  // ---------- کوڈ: ختم کی تاریخ (3) + بننے کی تاریخ (3) + دستخط (10) = 16 حروف ----------
  const c3 = d => A[(d >> 10) & 31] + A[(d >> 5) & 31] + A[d & 31];
  const un3 = c => { let v = 0; for (const ch of c) { const i = A.indexOf(ch); if (i < 0) return null; v = (v << 5) | i; } return v; };
  const normCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const fmtCode = c => c.match(/.{1,4}/g).join('-');

  async function mac(uid, e, i) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(CFG.SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${uid}|${e}|${i}|E`)));
    let n = 0n; for (let k = 0; k < 7; k++) n = (n << 8n) | BigInt(sig[k]);
    n >>= 6n;
    let out = ''; for (let k = 0; k < 10; k++) { out = A[Number(n & 31n)] + out; n >>= 5n; }
    return out;
  }
  async function makeCode(uid, exp, iss) { const e = idxOf(exp), i = idxOf(iss); return fmtCode(c3(e) + c3(i) + await mac(uid, e, i)); }

  async function activate(raw) {
    if (!(window.crypto && crypto.subtle)) return { ok: false, msg: 'ایپ کو https والے لنک سے کھولیں' };
    const s = ensure(), c = normCode(raw);
    if (!/^[A-HJ-NP-Z2-9]{16}$/.test(c)) return { ok: false, msg: 'کوڈ مکمل نہیں یا غلط ہے — دوبارہ دیکھ کر لکھیں' };
    const e = un3(c.slice(0, 3)), i = un3(c.slice(3, 6));
    if (await mac(s.uid, e, i) !== c.slice(6)) return { ok: false, msg: 'یہ کوڈ اس فون کے لیے نہیں ہے' };
    const exp = isoOf(e), iss = isoOf(i);
    if (exp < today()) return { ok: false, msg: 'اس کوڈ کی مدت ختم ہو چکی ہے' };
    if (!s.exp || exp > s.exp) { s.exp = exp; s.iss = iss; s.code = c; save(s); }
    return { ok: true, exp: s.exp };
  }

  // ---------- ڈیولپر کا ریکارڈ (کس کو کون سا کوڈ دیا) ----------
  const getL = () => { try { const l = JSON.parse(localStorage.getItem(LKEY)); return Array.isArray(l) ? l : []; } catch (e) { return []; } };
  const putL = l => { try { localStorage.setItem(LKEY, JSON.stringify(l.slice(0, 500))); } catch (e) {} };

  // ---------- کاپی / پیسٹ ----------
  async function copy(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
    try { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
  }
  async function readClip() { try { return await navigator.clipboard.readText(); } catch (e) { return ''; } }
  async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

  // ---------- اسٹائل ----------
  const css = document.createElement('style');
  css.textContent = `
  #licOv{position:fixed;inset:0;z-index:200;background:radial-gradient(circle at 50% 28%,#1b7458 0%,#0e4a39 46%,#082a20 100%);color:#fff;display:grid;place-items:center;padding:14px;overflow:auto;direction:rtl;transition:opacity .5s}
  #licOv.out{opacity:0}
  .lic-box{width:100%;max-width:420px;display:grid;gap:10px;text-align:center;margin:auto}
  .lic-k{margin:0;color:#e9c97a;font-family:var(--f-body,'JNN','Noto Nastaliq Urdu',serif);font-weight:400;font-size:28px;line-height:2.1;padding:6px 0}
  .lic-p{margin:0;font-size:17px;line-height:2.2}
  .lic-s{margin:0;font-size:15px;line-height:2.1;color:#d8e6df}
  .lic-uid,.lic-code{direction:ltr;font:700 24px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:3px;background:rgba(255,255,255,.12);border:1px solid #e9c97a;border-radius:12px;padding:8px}
  .lic-code{color:#9be3b0;font-size:19px;letter-spacing:1.5px}
  .lic-in,.lic-ta{width:100%;box-sizing:border-box;border-radius:12px;border:1.5px solid #e9c97a;background:#fff;color:#14463a;padding:10px;font-family:inherit}
  .lic-in{direction:ltr;text-align:center;font:700 20px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:2px;text-transform:uppercase}
  .lic-in.t{font:400 17px/1.7 inherit;font-family:inherit;direction:rtl;letter-spacing:0;text-transform:none}
  .lic-in.d{font-size:16px;letter-spacing:1px}
  .lic-ta{min-height:84px;font-size:15px;line-height:1.7;resize:vertical}
  .lic-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .lic-b{background:#e9c97a;color:#14463a;border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:16px;line-height:1.4;font-family:inherit;min-height:44px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
  .lic-b.g{background:transparent;color:#e9c97a;border:1.5px solid #e9c97a}
  .lic-b.sm{min-height:36px;padding:5px 12px;font-size:14px;border-radius:10px}
  .lic-b.red{background:#b3392f;color:#fff}
  .lic-ver{justify-self:center;margin:8px auto 0;padding:9px 22px;font:700 14px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#e9c97a;background:rgba(255,255,255,.08);border:1px solid #e9c97a;border-radius:99px;letter-spacing:1px;direction:ltr;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer}
  .lic-m{min-height:1.8em;font-size:15px;color:#ffd9a0}.lic-m.ok{color:#9be3b0}
  .lic-log{display:grid;gap:8px;text-align:start}
  .lic-lr{background:rgba(255,255,255,.09);border-radius:12px;padding:8px 10px;display:grid;gap:5px}
  .lic-lr .n{font-size:16px;line-height:1.7;display:flex;justify-content:space-between;gap:8px;align-items:baseline}
  .lic-lr .u,.lic-lr .c,.lic-lr .d{direction:ltr;font:600 13px/1.5 ui-monospace,Menlo,Consolas,monospace;text-align:left}
  .lic-lr .c{color:#9be3b0;font-size:14px;letter-spacing:1px}
  .lic-lr .d{color:#d8e6df}
  .lic-lr .st{font-size:13px;border-radius:99px;padding:0 10px;background:rgba(255,255,255,.14)}
  .lic-lr .st.on{background:#2e7d4f;color:#fff}
  .lic-em{--s:min(38vw,140px);position:relative;width:var(--s);height:var(--s);margin:34px auto 30px;perspective:900px;flex:none}
  .lic-em.sm{--s:min(28vw,104px);margin:26px auto 20px}
  .lic-rays{position:absolute;inset:-72%;border-radius:50%;background:repeating-conic-gradient(rgba(255,232,160,.5) 0 2.5deg,transparent 2.5deg 12deg);-webkit-mask:radial-gradient(circle,transparent 30%,#000 36%,transparent 68%);mask:radial-gradient(circle,transparent 30%,#000 36%,transparent 68%);animation:licRot 22s linear infinite,licIn 1.2s ease both;pointer-events:none}
  .lic-glow{position:absolute;inset:-28%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,170,.55) 0%,rgba(255,236,170,.18) 45%,transparent 70%);animation:licPulse 2.8s ease-in-out infinite;pointer-events:none}
  .lic-sp{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#fff2c0;box-shadow:0 0 9px 3px rgba(255,226,140,.85);opacity:0;animation:licSp 2.6s ease-out infinite;animation-delay:var(--d);pointer-events:none}
  .lic-coin{position:absolute;inset:0;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;animation:licSpin 2.6s cubic-bezier(.2,.75,.25,1) both}
  .lic-face{position:absolute;inset:0;border-radius:50%;background:#fff;display:grid;place-items:center;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 0 0 3px #e9c97a,0 0 0 6px rgba(8,42,32,.85),0 0 0 8px #e9c97a,0 10px 24px rgba(0,0,0,.5),0 0 36px rgba(255,226,140,.45)}
  .lic-face.b{transform:rotateY(180deg)}
  .lic-face img{width:84%;height:84%;object-fit:contain;display:block}
  .lic-fade{display:grid;gap:10px;animation:licFade .9s ease 1.7s both}
  .lic-w{margin:0;font-family:var(--f-body,'JNN','Noto Nastaliq Urdu',serif);font-size:42px;line-height:2;color:#f4de96;text-shadow:0 2px 14px rgba(0,0,0,.45);animation:licFade .9s ease 1.7s both}
  @keyframes licSpin{0%{transform:rotateY(-1080deg) scale(.25);opacity:0}15%{opacity:1}100%{transform:rotateY(0) scale(1);opacity:1}}
  @keyframes licRot{to{transform:rotate(360deg)}}
  @keyframes licIn{from{opacity:0}to{opacity:1}}
  @keyframes licPulse{0%,100%{transform:scale(.92);opacity:.75}50%{transform:scale(1.08);opacity:1}}
  @keyframes licFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes licSp{0%{transform:rotate(var(--a)) translateX(calc(var(--s) * .5)) scale(.3);opacity:0}18%{opacity:1}100%{transform:rotate(var(--a)) translateX(calc(var(--s) * 1.15)) scale(.6);opacity:0}}
  /* ہوم پیج کا سبسکرپشن کارڈ */
  .lic-card{margin:8px 0 2px;border:1.5px solid #c9a84e;border-radius:14px;padding:6px 10px;background:linear-gradient(180deg,#0f3a30,#185443);color:#f4e8c0;display:grid;gap:5px;direction:rtl;text-align:center}
  .lic-card.warn{border-color:#f0a53a;background:linear-gradient(180deg,#4a3410,#6b4a14)}
  .lic-card.bad{border-color:#ff6b5e;background:linear-gradient(180deg,#5a1713,#7d211b)}
  .lic-card .h{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:17px;line-height:1.8}
  .lic-card .big{font-weight:700;font-size:20px;color:#ffe9a8;white-space:nowrap}
  .lic-card .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
  .lic-card .g3>div{background:rgba(0,0,0,.22);border-radius:10px;padding:4px 2px;display:grid;gap:0}
  .lic-card .g3 small{font-size:12px;line-height:1.7;color:#e6d6aa}
  .lic-card .g3 b{font:700 14px/1.6 ui-monospace,Menlo,Consolas,monospace;direction:ltr;color:#fff}
  .lic-card .wn{font-size:14.5px;line-height:2;color:#ffe2b0}
  .lic-card.bad .wn{color:#ffd0ca}
  .lic-card button{justify-self:center;border:0;border-radius:99px;background:#e9c97a;color:#14463a;font:700 14px/1.4 inherit;font-family:inherit;padding:2px 16px;cursor:pointer}
  .lic-card .g3>div:last-child b{direction:rtl}
  .status2{display:flex;gap:8px;justify-content:center;margin-top:6px}
  `;
  document.head.appendChild(css);

  let ov = null, blocking = false, devOpen = false;
  function show(html, block) {
    if (!ov) { ov = document.createElement('div'); ov.id = 'licOv'; document.body.appendChild(ov); }
    ov.classList.remove('out');
    blocking = !!block; ov.innerHTML = html; document.documentElement.style.overflow = 'hidden';
  }
  function hide() { if (ov) { ov.remove(); ov = null; } blocking = false; devOpen = false; document.documentElement.style.overflow = ''; }
  function toast(m) { try { window.MA_APP && window.MA_APP.toast(m); } catch (e) {} }
  function tapCounter(el, fn) { let n = 0, t; el.addEventListener('click', () => { n++; clearTimeout(t); t = setTimeout(() => { n = 0; }, 2500); if (n >= 7) { n = 0; fn(); } }); }

  // ----- گھومتا ہوا نشان + روشنیاں -----
  function emblem(small) {
    const sp = Array.from({ length: 14 }, (_, i) => `<i class="lic-sp" style="--a:${Math.round(i * 360 / 14)}deg;--d:${((i * 0.37) % 2.6).toFixed(2)}s"></i>`).join('');
    const face = '<img src="icons/khatam-logo-black.png" alt="" draggable="false">';
    return `<div class="lic-em${small ? ' sm' : ''}"><div class="lic-rays"></div><div class="lic-glow"></div>${sp}<div class="lic-coin"><div class="lic-face">${face}</div><div class="lic-face b">${face}</div></div></div>`;
  }
  function showWelcome() {
    show(`<div class="lic-box">${emblem(false)}<p class="lic-w">خوش آمدید</p></div>`, false);
    const my = ov, t0 = Date.now();
    const close = () => { if (ov !== my) return; my.classList.add('out'); setTimeout(() => { if (ov === my) hide(); }, 520); };
    my.addEventListener('click', () => { if (Date.now() - t0 > 900) close(); });
    setTimeout(close, 3900);
  }

  // ----- گاہک کی اسکرین -----
  function waMsg(st, name) {
    return `السلام علیکم! مکتبۃ العزیز کا ایک سال کا سبسکرپشن چاہیے۔\nنام: ${name || ''}\nUID: ${st.uid}` + (st.mode === 'paid' ? `\nموجودہ سبسکرپشن ختم: ${dmyI(st.exp)}` : '');
  }
  function showGate(block) {
    const st = status(), s = ensure();
    let line;
    if (st.mode === 'paid') line = `سبسکرپشن فعال ہے — ${num(st.left)} دن باقی (${dmyI(st.exp)} تک)۔ ابھی تجدید کریں تو باقی دن ضائع نہیں ہوں گے، نیا سال ان کے اوپر جمع ہو گا۔`;
    else if (st.mode === 'expired') line = 'آپ کا سبسکرپشن ختم ہو گیا ہے۔ تجدید کے لیے نیا کوڈ منگوائیں۔';
    else line = 'ایپ استعمال کرنے کے لیے ایک سال کا سبسکرپشن کوڈ درکار ہے۔';
    show(`<div class="lic-box">${block ? emblem(true) : ''}
      <div class="${block ? 'lic-fade' : ''}" style="display:grid;gap:10px">
      <p class="lic-k" id="licTitle">${block ? 'سبسکرپشن درکار ہے' : 'سبسکرپشن'}</p>
      <p class="lic-p">${line}</p>
      <p class="lic-s">۱) اپنا نام لکھیں، پھر نیچے والا بٹن دبا کر ڈیولپر کو میسج بھیجیں (آپ کی UID خود لگ جائے گی)<br>۲) جو کوڈ ملے وہ نیچے ڈالیں</p>
      <input class="lic-in t" id="licName" placeholder="آپ کا نام (اختیاری)" autocomplete="off" value="${esc(s.name || '')}">
      <div class="lic-uid" id="licUid">${st.uid}</div>
      <div class="lic-row"><a class="lic-b" id="licWa" target="_blank" rel="noopener" href="#">📲 واٹس ایپ پر کوڈ منگوائیں</a>
        <button type="button" class="lic-b g" id="licCopyUid">📋 UID کاپی</button></div>
      <input class="lic-in" id="licIn" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false">
      <div class="lic-row"><button type="button" class="lic-b" id="licGo">✅ فعال کریں</button><button type="button" class="lic-b g" id="licPaste">📋 پیسٹ</button></div>
      <div class="lic-m" id="licMsg"></div>
      ${block ? '' : '<button type="button" class="lic-b g" id="licClose">بند کریں</button>'}
      <div class="lic-ver" id="licVer">${(document.getElementById('verChip') || {}).textContent || ''}</div>
      </div>
    </div>`, block);
    const m = $(ov, '#licMsg'), inp = $(ov, '#licIn'), nm = $(ov, '#licName'), wa = $(ov, '#licWa');
    const setWa = () => { const u = ensure(); u.name = nm.value.trim(); save(u); wa.href = `https://wa.me/${CFG.DEV_PHONE}?text=${encodeURIComponent(waMsg(status(), u.name))}`; };
    setWa(); nm.addEventListener('input', setWa);
    tapCounter($(ov, '#licTitle'), devAuth);
    tapCounter($(ov, '#licVer'), devAuth);
    $(ov, '#licCopyUid').onclick = async () => { m.className = 'lic-m ok'; m.textContent = (await copy(st.uid)) ? 'UID کاپی ہو گئی' : 'کاپی نہیں ہو سکی'; };
    const go = async () => {
      m.className = 'lic-m'; m.textContent = 'جانچ ہو رہی ہے…';
      const r = await activate(inp.value);
      if (r.ok) { m.className = 'lic-m ok'; m.textContent = `✅ سبسکرپشن فعال — ${dmyI(r.exp)} تک`; setTimeout(() => { showWelcome(); refresh(true); }, 900); }
      else m.textContent = r.msg;
    };
    $(ov, '#licGo').onclick = go;
    $(ov, '#licPaste').onclick = async () => { const t = await readClip(); if (t) { inp.value = t.trim(); if (normCode(t).length >= 16) go(); } else { m.className = 'lic-m'; m.textContent = 'پیسٹ نہیں ہو سکا — کوڈ خود لکھ دیں'; } };
    inp.addEventListener('input', () => { if (normCode(inp.value).length >= 16) go(); });
    const cl = $(ov, '#licClose'); if (cl) cl.onclick = hide;
  }

  // ----- ڈیولپر -----
  function devAuth() {
    devOpen = true;
    show(`<div class="lic-box"><p class="lic-k">ڈیولپر</p>
      <input class="lic-in" id="dvPw" type="password" placeholder="پاسورڈ" autocomplete="off" style="text-transform:none">
      <div class="lic-m" id="dvM"></div>
      <div class="lic-row"><button type="button" class="lic-b" id="dvOk">کھولیں</button><button type="button" class="lic-b g" id="dvNo">بند کریں</button></div></div>`, false);
    const go = async () => {
      let h = ''; try { h = await sha('MAKTABA|' + $(ov, '#dvPw').value); } catch (e) {}
      let cur = CFG.PASS_HASH; try { cur = localStorage.getItem(PWKEY) || cur; } catch (e) {}
      if (h === cur) devPanel(); else $(ov, '#dvM').textContent = 'پاسورڈ غلط ہے';
    };
    $(ov, '#dvOk').onclick = go;
    $(ov, '#dvPw').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    $(ov, '#dvNo').onclick = () => { hide(); refresh(true); };
  }
  const findUid = t => {
    const u = String(t || '').toUpperCase();
    let m = u.match(/UID[\s:：=-]*([A-HJ-NP-Z2-9]{4})-?([A-HJ-NP-Z2-9]{4})/);
    if (!m) m = u.match(/\b([A-HJ-NP-Z2-9]{4})-([A-HJ-NP-Z2-9]{4})\b/);
    return m ? m[1] + '-' + m[2] : '';
  };
  const findName = t => { const m = String(t || '').match(/نام[\s:：=-]*([^\n\r]*)/); return m ? m[1].trim() : ''; };
  const findExp = t => { const m = String(t || '').match(/ختم[^0-9\n]*(\d{2}-\d{2}-\d{4})/); return m ? m[1] : ''; };
  const sendMsg = r => `السلام علیکم! آپ کا مکتبۃ العزیز ایکٹیویشن کوڈ:\n${r.code}\n(سبسکرپشن ختم ہونے کی تاریخ: ${dmyI(r.exp)})`;

  function devPanel() {
    devOpen = true;
    show(`<div class="lic-box"><p class="lic-k">ڈیولپر — کوڈ بنائیں</p>
      <textarea class="lic-ta" id="dvMsg" placeholder="گاہک کا میسج یہاں پیسٹ کریں — نام، UID اور ختم ہونے کی تاریخ خود نکل آئے گی"></textarea>
      <input class="lic-in t" id="dvName" placeholder="گاہک کا نام" autocomplete="off">
      <input class="lic-in" id="dvUid" placeholder="XXXX-XXXX" maxlength="9" autocomplete="off" spellcheck="false">
      <input class="lic-in d" id="dvCur" placeholder="موجودہ ختم (اختیاری) 31-12-2026" maxlength="10" autocomplete="off" style="text-transform:none">
      <div class="lic-row"><button type="button" class="lic-b g" id="dvPaste">📋 پیسٹ</button><button type="button" class="lic-b" id="dvGen">🔑 کوڈ بنائیں</button></div>
      <div class="lic-m" id="dvM"></div>
      <div id="dvOut"></div>
      <p class="lic-s" id="dvCnt"></p>
      <input class="lic-in t" id="dvFind" placeholder="تلاش: نام / UID / کوڈ" autocomplete="off">
      <div class="lic-log" id="dvLog"></div>
      <div class="lic-row"><button type="button" class="lic-b g sm" id="dvExp">📤 فہرست کاپی</button><button type="button" class="lic-b g sm" id="dvImp">📥 فہرست بحال</button></div>
      <p class="lic-s" style="margin-top:6px">پاسورڈ بدلیں</p>
      <input class="lic-in" id="dvNew" type="password" placeholder="نیا پاسورڈ" autocomplete="off" style="text-transform:none">
      <input class="lic-in" id="dvNew2" type="password" placeholder="نیا پاسورڈ دوبارہ" autocomplete="off" style="text-transform:none">
      <div class="lic-row"><button type="button" class="lic-b g" id="dvPwSave">🔒 پاسورڈ محفوظ کریں</button></div>
      <div class="lic-m" id="dvPwM"></div>
      <button type="button" class="lic-b g" id="dvClose">بند کریں</button></div>`, false);
    const msg = $(ov, '#dvMsg'), nameIn = $(ov, '#dvName'), uidIn = $(ov, '#dvUid'), curIn = $(ov, '#dvCur'), m = $(ov, '#dvM'), out = $(ov, '#dvOut'), logEl = $(ov, '#dvLog'), findIn = $(ov, '#dvFind');

    const status2 = r => (r.used ? '<span class="st on">✅ استعمال ہو گیا</span>' : '<span class="st">⏳ استعمال کی تصدیق نہیں</span>');
    function renderLog() {
      const L = getL(), q = findIn.value.trim().toUpperCase();
      $(ov, '#dvCnt').textContent = `ریکارڈ: ${L.length} کوڈ`;
      const rows = L.filter(r => !q || (r.name || '').toUpperCase().includes(q) || r.uid.includes(q) || r.code.replace(/-/g, '').includes(q.replace(/-/g, '')));
      logEl.innerHTML = rows.map(r => `<div class="lic-lr" data-c="${r.code}">
        <div class="n"><b>${esc(r.name) || 'بغیر نام'}</b>${status2(r)}</div>
        <div class="u">UID ${r.uid}</div><div class="c">${r.code}</div>
        <div class="d">${dmy(r.iss)} → ${dmy(r.exp)}</div>
        <div class="lic-row"><button type="button" class="lic-b g sm" data-a="used">${r.used ? '↩️ غیر استعمال' : '✅ استعمال ہو گیا'}</button><button type="button" class="lic-b g sm" data-a="copy">📋 کاپی</button><button type="button" class="lic-b sm" data-a="wa">📤 بھیجیں</button><button type="button" class="lic-b g sm" data-a="del">🗑️</button></div></div>`).join('') || '<p class="lic-s">کوئی ریکارڈ نہیں</p>';
    }
    function showResult(r, note, canForce) {
      out.innerHTML = `${note ? `<p class="lic-s">${note}</p>` : ''}<div class="lic-code">${r.code}</div><p class="lic-s">${esc(r.name) || ''} · ختم: ${dmyI(r.exp)} (${num(dayDiff(r.exp, today()) + 1)} دن)</p>
        <div class="lic-row"><button type="button" class="lic-b g" id="dvCp">📋 کاپی</button><a class="lic-b" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(sendMsg(r))}">📤 واٹس ایپ</a>${canForce ? '<button type="button" class="lic-b g" id="dvForce">➕ نیا کوڈ (دن جمع)</button>' : ''}</div>`;
      $(ov, '#dvCp').onclick = async () => { m.className = 'lic-m ok'; m.textContent = (await copy(r.code)) ? '✅ کاپی ہو گیا' : 'کاپی نہیں ہو سکا'; };
      const f = $(ov, '#dvForce'); if (f) f.onclick = () => gen(true);
    }
    const pick = () => {
      const t = msg.value, u = findUid(t); if (u) uidIn.value = u;
      const n = findName(t); if (n) nameIn.value = n;
      const e = findExp(t); if (e) curIn.value = e;
      fillName();
    };
    const fillName = () => { const u = normUid(uidIn.value); if (u && !nameIn.value.trim()) { const r = getL().find(x => x.uid === u && x.name); if (r) nameIn.value = r.name; } };
    msg.addEventListener('input', pick); uidIn.addEventListener('input', fillName);
    $(ov, '#dvPaste').onclick = async () => { const t = await readClip(); if (t) { msg.value = t; pick(); } else { m.className = 'lic-m'; m.textContent = 'پیسٹ نہیں ہو سکا — خود پیسٹ کریں'; } };

    async function gen(force) {
      const uid = normUid(uidIn.value);
      m.className = 'lic-m';
      if (!uid) { m.textContent = 'UID درست نہیں (8 حروف: XXXX-XXXX)'; return; }
      const name = nameIn.value.trim(), t = today(), L = getL(), mine = L.filter(r => r.uid === uid);
      const pending = mine.find(r => !r.used && r.exp >= t);
      if (pending && !force) {
        if (name && !pending.name) { pending.name = name; putL(L); }
        m.className = 'lic-m ok'; m.textContent = 'اس UID کا کوڈ پہلے بنا ہوا ہے';
        showResult(pending, 'یہ کوڈ پہلے دیا جا چکا ہے اور استعمال کی تصدیق نہیں — وہی دوبارہ بھیجیں۔', true); renderLog(); return;
      }
      let base = ''; mine.forEach(r => { if (r.exp >= t && r.exp > base) base = r.exp; });
      const cur = parseDmy(curIn.value); if (cur && cur >= t && cur > base) base = cur;
      const exp = base ? addDays(base, CFG.PLAN_DAYS) : addDays(t, CFG.PLAN_DAYS - 1);
      const code = await makeCode(uid, exp, t);
      const rec = { uid, name: name || (mine.find(r => r.name) || {}).name || '', code, iss: t, exp, used: false, ts: Date.now() };
      L.unshift(rec); putL(L);
      const ok = await copy(code);
      m.className = 'lic-m ok'; m.textContent = ok ? '✅ کوڈ بن گیا اور کاپی ہو گیا' : 'کوڈ بن گیا — نیچے سے کاپی کریں';
      showResult(rec, base ? `باقی دن جمع ہو گئے: نیا سال ${dmyI(base)} کے بعد شروع ہو گا۔` : '', false); renderLog();
    }
    $(ov, '#dvGen').onclick = () => gen(false);
    findIn.addEventListener('input', renderLog);
    logEl.onclick = async e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const code = b.closest('.lic-lr').dataset.c, L = getL(), r = L.find(x => x.code === code); if (!r) return;
      const a = b.dataset.a;
      if (a === 'used') { r.used = !r.used; putL(L); renderLog(); }
      else if (a === 'copy') { m.className = 'lic-m ok'; m.textContent = (await copy(r.code)) ? '✅ کوڈ کاپی ہو گیا' : 'کاپی نہیں ہو سکا'; }
      else if (a === 'wa') { window.open('https://wa.me/?text=' + encodeURIComponent(sendMsg(r)), '_blank'); }
      else if (a === 'del') { if (confirm('یہ ریکارڈ حذف کریں؟')) { putL(L.filter(x => x.code !== code)); renderLog(); } }
    };
    $(ov, '#dvExp').onclick = async () => { m.className = 'lic-m ok'; m.textContent = (await copy(JSON.stringify(getL()))) ? '✅ فہرست کاپی ہو گئی — کہیں محفوظ کر لیں' : 'کاپی نہیں ہو سکی'; };
    $(ov, '#dvImp').onclick = async () => {
      const t = await readClip(); let n = 0;
      try { const inc = JSON.parse(t); const L = getL(); inc.forEach(r => { if (r && r.code && r.uid && !L.some(x => x.code === r.code)) { L.push(r); n++; } }); L.sort((a, b) => (b.ts || 0) - (a.ts || 0)); putL(L); } catch (e) { m.className = 'lic-m'; m.textContent = 'کلپ بورڈ میں فہرست نہیں ملی'; return; }
      m.className = 'lic-m ok'; m.textContent = `✅ ${num(n)} نئے ریکارڈ شامل ہوئے`; renderLog();
    };
    $(ov, '#dvPwSave').onclick = async () => {
      const a = $(ov, '#dvNew').value, b = $(ov, '#dvNew2').value, pm = $(ov, '#dvPwM');
      pm.className = 'lic-m';
      if (a.length < 6) { pm.textContent = 'پاسورڈ کم از کم 6 حروف کا ہو'; return; }
      if (a !== b) { pm.textContent = 'دونوں پاسورڈ ایک جیسے نہیں ہیں'; return; }
      try { localStorage.setItem(PWKEY, await sha('MAKTABA|' + a)); } catch (e) { pm.textContent = 'محفوظ نہیں ہو سکا'; return; }
      $(ov, '#dvNew').value = ''; $(ov, '#dvNew2').value = '';
      pm.className = 'lic-m ok'; pm.textContent = '✅ نیا پاسورڈ محفوظ ہو گیا';
    };
    $(ov, '#dvClose').onclick = () => { hide(); refresh(true); };
    renderLog();
  }

  // ----- ہوم پیج پر سبسکرپشن کارڈ -----
  function card() {
    const st = status();
    let c = document.getElementById('licCard');
    if (st.mode !== 'paid') { if (c) c.remove(); return; }
    if (!c) {
      const h = document.querySelector('header.masthead'); if (!h) return;
      c = document.createElement('div'); c.id = 'licCard'; h.insertAdjacentElement('afterend', c);
      c.addEventListener('click', e => { if (e.target.closest('button')) showGate(false); });
    }
    const left = st.left, months = Math.floor(left / 30), warn = left <= CFG.WARN_DAYS;
    c.className = 'lic-card' + (left <= 7 ? ' bad' : warn ? ' warn' : '');
    c.innerHTML = `<div class="h"><span>${warn ? '⚠️' : '✅'} سبسکرپشن</span><span class="big">باقی ${num(left)} دن</span></div>
      <div class="g3"><div><small>سبسکرپشن کی تاریخ</small><b>${dmy(st.iss) || '—'}</b></div><div><small>ختم ہونے کی تاریخ</small><b>${dmy(st.exp)}</b></div><div><small>تقریباً</small><b>${num(months)} ماہ</b></div></div>
      ${warn ? `<div class="wn">سبسکرپشن ${num(left)} دن میں ختم ہو رہا ہے — ابھی تجدید کریں، باقی دن ضائع نہیں ہوں گے۔</div>` : ''}
      <button type="button">🔄 ${warn ? 'ابھی تجدید کریں' : 'تجدید / سبسکرپشن لیں'}</button>`;
  }

  // ----- لاگ آؤٹ (سبسکرپشن برقرار رہتی ہے) اور ایپ بند -----
  let loggedOut = false;
  function showLoggedOut() {
    const st = status();
    show(`<div class="lic-box">${emblem(true)}
      <div class="lic-fade" style="display:grid;gap:10px">
      <p class="lic-k">لاگ آؤٹ ہو گئے</p>
      <p class="lic-s">سبسکرپشن فعال ہے — ${num(st.left)} دن باقی</p>
      <div class="lic-row"><button type="button" class="lic-b" id="loIn">🔓 داخل ہوں</button><button type="button" class="lic-b g" id="loClose">⏻ ایپ بند</button></div>
      <div class="lic-ver" id="licVer">${(document.getElementById('verChip') || {}).textContent || ''}</div>
      </div></div>`, true);
    $(ov, '#loIn').onclick = () => { loggedOut = false; hide(); showWelcome(); card(); };
    $(ov, '#loClose').onclick = closeApp;
    tapCounter($(ov, '#licVer'), devAuth);
  }
  function logout() { if (status().mode !== 'paid') return; loggedOut = true; showLoggedOut(); }
  function closeApp() {
    try { window.close(); } catch (e) {}
    try { if (navigator.app && navigator.app.exitApp) navigator.app.exitApp(); } catch (e) {}
    setTimeout(() => {
      if (window.MA_APP && window.MA_APP.toast) { toast('ہوم بٹن دبا کر نکل جائیں'); return; }
      const t = document.createElement('div'); t.textContent = 'ہوم بٹن دبا کر نکل جائیں';
      t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:300;background:#14463a;color:#fff;border:1px solid #e9c97a;border-radius:99px;padding:8px 18px;font-size:15px';
      document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
    }, 350);
  }

  // ----- جانچ -----
  function refresh() {
    if (devOpen) return;
    if (loggedOut && status().mode === 'paid') { if (!ov || !blocking) showLoggedOut(); return; }
    loggedOut = false;
    const st = status(), locked = st.mode === 'locked' || st.mode === 'expired';
    if (locked && (!ov || !blocking)) showGate(true);
    else if (!locked && ov && blocking) hide();
    card();
  }

  window.MA_LIC = {
    status,
    export: () => { const l = getL(); return Object.assign({ code: (load() || {}).code || '' }, l.length ? { ledger: l } : {}); },
    import: async l => {
      if (!l) return;
      if (Array.isArray(l.ledger)) { const L = getL(); l.ledger.forEach(r => { if (r && r.code && r.uid && !L.some(x => x.code === r.code)) L.push(r); }); L.sort((a, b) => (b.ts || 0) - (a.ts || 0)); putL(L); }
      if (l.code) { const r = await activate(l.code); if (r.ok) refresh(true); return r; }
    }
  };

  ensure();
  if (status().mode === 'paid') { showWelcome(); card(); } else refresh(true);
  setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(true); });
  const vc = document.getElementById('verChip'); if (vc) tapCounter(vc, devAuth);
  const bl = document.getElementById('btnLogout'); if (bl) bl.addEventListener('click', logout);
  const bc = document.getElementById('btnClose'); if (bc) bc.addEventListener('click', closeApp);
})();
