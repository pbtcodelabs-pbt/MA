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
  .lic-em{--s:min(40vw,150px);--t:14px;position:relative;width:var(--s);height:var(--s);margin:40px auto 34px;perspective:760px;flex:none}
  .lic-em.sm{--s:min(30vw,112px);--t:11px;margin:30px auto 24px}
  .lic-rays,.lic-rays2{position:absolute;inset:-85%;border-radius:50%;pointer-events:none}
  .lic-rays{background:repeating-conic-gradient(from 0deg,rgba(255,226,140,.62) 0 1.6deg,transparent 1.6deg 7.5deg);-webkit-mask:radial-gradient(circle,transparent 24%,#000 31%,rgba(0,0,0,.35) 52%,transparent 68%);mask:radial-gradient(circle,transparent 24%,#000 31%,rgba(0,0,0,.35) 52%,transparent 68%);animation:licRot 26s linear infinite,licIn 1.4s ease both}
  .lic-rays2{inset:-110%;background:repeating-conic-gradient(from 3deg,rgba(255,244,200,.5) 0 .8deg,transparent .8deg 15deg);-webkit-mask:radial-gradient(circle,transparent 20%,#000 28%,rgba(0,0,0,.25) 48%,transparent 62%);mask:radial-gradient(circle,transparent 20%,#000 28%,rgba(0,0,0,.25) 48%,transparent 62%);animation:licRotR 40s linear infinite,licIn 1.8s ease both}
  .lic-glow{position:absolute;inset:-34%;border-radius:50%;background:radial-gradient(circle,rgba(255,226,140,.7) 0%,rgba(255,206,100,.28) 42%,transparent 70%);animation:licPulse 2.8s ease-in-out infinite;pointer-events:none}
  .lic-sp{position:absolute;left:50%;top:50%;width:var(--z,10px);height:var(--z,10px);margin:calc(var(--z,10px) / -2);background:radial-gradient(circle,#fff 0,#fff3b8 35%,#ffd86a 70%);clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);opacity:0;animation:licSp 2.8s ease-out infinite;animation-delay:var(--d);pointer-events:none}
  .lic-coin{position:absolute;inset:0;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;animation:licSpin 2.6s cubic-bezier(.2,.75,.25,1) both,licTurn 10s linear 2.6s infinite}
  .lic-ed{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 20deg,#6b4308,#f7d364,#fff0a6,#b8821c,#5e3a05,#e8b23c,#fff0a6,#a87414,#6b4308)}
  .lic-face{position:absolute;inset:0;border-radius:50%;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:grid;place-items:center;
    background:radial-gradient(circle at 32% 26%,#fff7c8 0,#f6d56c 18%,#d9a42b 46%,#a8741a 74%,#7a4e0a 100%);
    box-shadow:inset 0 0 0 calc(var(--s) * .035) #f2c94e,inset 0 0 0 calc(var(--s) * .05) #7a4e0a,inset 0 0 0 calc(var(--s) * .065) #ffe58a,inset 0 0 calc(var(--s) * .12) rgba(60,30,0,.55)}
  .lic-face.f{transform:translateZ(calc(var(--t) / 2))}
  .lic-face.b{transform:rotateY(180deg) translateZ(calc(var(--t) / 2))}
  .lic-art{width:80%;height:80%;background:linear-gradient(150deg,#3a2102 0%,#7b4e08 45%,#2e1a01 100%);-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat;filter:drop-shadow(0 1.2px 0 rgba(255,244,190,.95)) drop-shadow(0 -1px 0 rgba(40,20,0,.55))}
  .lic-shine{position:absolute;inset:0;border-radius:50%;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.85) 48%,rgba(255,255,255,.15) 54%,transparent 66%);background-size:260% 100%;background-position:130% 0;mix-blend-mode:soft-light;animation:licShine 3.2s ease-in-out 1.2s infinite;pointer-events:none}
  .lic-fade{display:grid;gap:10px;animation:licFade .9s ease 1.7s both}
  .lic-w{margin:0;font-family:var(--f-body,'JNN','Noto Nastaliq Urdu',serif);font-size:42px;line-height:2;color:#f4de96;text-shadow:0 2px 14px rgba(0,0,0,.45);animation:licFade .9s ease 1.7s both}
  @keyframes licSpin{0%{transform:rotateY(-1080deg) scale(.25);opacity:0}15%{opacity:1}100%{transform:rotateY(0) scale(1);opacity:1}}
  @keyframes licRot{to{transform:rotate(360deg)}}
  @keyframes licRotR{to{transform:rotate(-360deg)}}
  @keyframes licTurn{to{transform:rotateY(360deg)}}
  @keyframes licShine{0%{background-position:130% 0}60%,100%{background-position:-40% 0}}
  @keyframes licIn{from{opacity:0}to{opacity:1}}
  @keyframes licPulse{0%,100%{transform:scale(.92);opacity:.75}50%{transform:scale(1.08);opacity:1}}
  @keyframes licFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes licSp{0%{transform:rotate(var(--a)) translateX(calc(var(--s) * .5)) scale(.3);opacity:0}18%{opacity:1}100%{transform:rotate(var(--a)) translateX(calc(var(--s) * 1.25)) scale(.5) rotate(90deg);opacity:0}}
  /* ہوم پیج کا سبسکرپشن کارڈ */
  .lic-card{margin:4px 0 0;border:1px solid #c9a84e;border-radius:10px;padding:3px 8px;background:rgba(0,0,0,.25);color:#f4e8c0;direction:rtl;text-align:center}
  .lic-card.warn{border-color:#f0a53a;background:rgba(107,74,20,.55)}
  .lic-card.bad{border-color:#ff6b5e;background:rgba(125,33,27,.6)}
  .lic-card .ln{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;font-size:12.5px;line-height:1.9;white-space:nowrap}
  .lic-card .ln b{font:700 12px/1.6 ui-monospace,Menlo,Consolas,monospace;direction:ltr;unicode-bidi:isolate;color:#fff;margin-inline-start:3px}
  .lic-card .ln b.big{font-family:inherit;font-size:14px;color:#ffe9a8;direction:rtl}
  .lic-card .wn{font-size:12.5px;line-height:1.8;color:#ffe2b0}
  .lic-card.bad .wn{color:#ffd0ca}
  .lic-card button{border:0;border-radius:99px;background:#e9c97a;color:#14463a;font:700 12.5px/1.4 inherit;font-family:inherit;padding:1px 10px;cursor:pointer}
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
  const LOGO_MASK = 'url(data:image/png;base64,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)';
  try { document.documentElement.style.setProperty('--m', LOGO_MASK); const he = document.querySelector('.emblem'); if (he) he.classList.add('gold'); } catch (e) {}
  function emblem(small) {
    const sp = Array.from({ length: 22 }, (_, i) => `<i class="lic-sp" style="--a:${Math.round(i * 360 / 22 + (i % 2) * 6)}deg;--d:${((i * 0.41) % 2.8).toFixed(2)}s;--z:${6 + (i * 5) % 9}px"></i>`).join('');
    const ed = Array.from({ length: 13 }, (_, i) => `<i class="lic-ed" style="transform:translateZ(calc(var(--t) * ${((i - 6) / 12).toFixed(3)}))"></i>`).join('');
    const face = c => `<div class="lic-face ${c}"><div class="lic-art"></div><div class="lic-shine"></div></div>`;
    return `<div class="lic-em${small ? ' sm' : ''}" style="--m:${LOGO_MASK}"><div class="lic-rays"></div><div class="lic-rays2"></div><div class="lic-glow"></div>${sp}<div class="lic-coin">${ed}${face('f')}${face('b')}</div></div>`;
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
    return `نام: ${name || ''}\nUID: ${st.uid}\nہمیں ایک سال کا سبسکرپشن چاہیے۔` + (st.mode === 'paid' ? `\nموجودہ سبسکرپشن ختم: ${dmyI(st.exp)}` : '');
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
  const findName = t => {
    const m = String(t || '').match(/^[ \t]*نام[ \t]*[:：=\-]?[ \t]*(.*)$/m);
    const n = m ? m[1].trim() : '';
    return /^UID\b/i.test(n) || /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/i.test(n) ? '' : n;
  };
  const findExp = t => { const m = String(t || '').match(/ختم[^0-9\n]*(\d{2}-\d{2}-\d{4})/); return m ? m[1] : ''; };
  const sendMsg = r => `السلام علیکم! آپ کا مکتبۃ العزیز ایکٹیویشن کوڈ:\n${r.code}\n(سبسکرپشن ختم ہونے کی تاریخ: ${dmyI(r.exp)})`;

  function devPanel() {
    devOpen = true;
    show(`<div class="lic-box"><p class="lic-k">ڈیولپر — کوڈ بنائیں</p>
      <input class="lic-in t" id="dvName" placeholder="گاہک کا نام (ضروری)" autocomplete="off">
      <input class="lic-in" id="dvUid" placeholder="UID: XXXX-XXXX" maxlength="9" autocomplete="off" spellcheck="false">
      <textarea class="lic-ta" id="dvMsg" placeholder="گاہک کا میسج یہاں پیسٹ کریں — نام، UID اور ختم ہونے کی تاریخ خود نکل آئے گی۔ نام نہ ہو تو اوپر خود لکھ دیں"></textarea>
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
        <div class="lic-row"><button type="button" class="lic-b g sm" data-a="used">${r.used ? '↩️ غیر استعمال' : '✅ استعمال ہو گیا'}</button><button type="button" class="lic-b g sm" data-a="name">✏️ نام</button><button type="button" class="lic-b g sm" data-a="copy">📋 کاپی</button><button type="button" class="lic-b sm" data-a="wa">📤 بھیجیں</button><button type="button" class="lic-b g sm" data-a="del">🗑️</button></div></div>`).join('') || '<p class="lic-s">کوئی ریکارڈ نہیں</p>';
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
      if (!name) { m.textContent = 'پہلے گاہک کا نام لکھیں'; nameIn.focus(); return; }
      const pending = mine.find(r => !r.used && r.exp >= t);
      if (pending && !force) {
        if (name && pending.name !== name) { pending.name = name; putL(L); }
        m.className = 'lic-m ok'; m.textContent = 'اس UID کا کوڈ پہلے بنا ہوا ہے';
        showResult(pending, 'یہ کوڈ پہلے دیا جا چکا ہے اور استعمال کی تصدیق نہیں — وہی دوبارہ بھیجیں۔', true); renderLog(); return;
      }
      let base = ''; mine.forEach(r => { if (r.exp >= t && r.exp > base) base = r.exp; });
      const cur = parseDmy(curIn.value); if (cur && cur >= t && cur > base) base = cur;
      const exp = base ? addDays(base, CFG.PLAN_DAYS) : addDays(t, CFG.PLAN_DAYS - 1);
      const code = await makeCode(uid, exp, t);
      const rec = { uid, name, code, iss: t, exp, used: false, ts: Date.now() };
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
      else if (a === 'name') { const n = prompt('گاہک کا نام', r.name || ''); if (n !== null) { const nn = n.trim(); L.forEach(x => { if (x.uid === r.uid) x.name = nn; }); putL(L); renderLog(); } }
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
      const h = document.getElementById('licSlot'); if (!h) return;
      c = document.createElement('div'); c.id = 'licCard'; h.appendChild(c);
      c.addEventListener('click', e => { if (e.target.closest('button')) showGate(false); });
    }
    const left = st.left, months = Math.floor(left / 30), warn = left <= CFG.WARN_DAYS;
    c.className = 'lic-card' + (left <= 7 ? ' bad' : warn ? ' warn' : '');
    c.innerHTML = `<div class="ln">${st.iss ? `<span>شروع <b>${dmy(st.iss)}</b></span>` : ''}<span>ختم <b>${dmy(st.exp)}</b></span><span>باقی <b class="big">${num(left)} دن</b></span><button type="button" title="${warn ? 'ابھی تجدید کریں' : 'تجدید / سبسکرپشن'}">🔄 ${warn ? 'تجدید' : ''}</button></div>
      ${warn ? `<div class="wn">سبسکرپشن ${num(left)} دن میں ختم ہو رہا ہے — ابھی تجدید کریں، باقی دن ضائع نہیں ہوں گے۔</div>` : ''}`;
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
    // 1) سیدھی کوشش: اینڈرائیڈ ریپر یا window.close
    try { if (navigator.app && navigator.app.exitApp) { navigator.app.exitApp(); return; } } catch (e) {}
    try { window.close(); } catch (e) {}
    // 2) کروم صرف تب بند کرنے دیتا ہے جب ہسٹری میں ایک ہی صفحہ ہو۔
    //    اس لیے پہلے شروع والے صفحے تک واپس جاتے ہیں اور دوبارہ کوشش کرتے ہیں۔
    setTimeout(() => {
      if (document.hidden) return;
      try {
        const nv = window.navigation;
        if (nv && nv.entries && nv.currentEntry && nv.currentEntry.index > 0) {
          nv.traverseTo(nv.entries()[0].key);
        } else if (history.length > 1) {
          history.go(-(history.length - 1));
        }
      } catch (e) {}
      setTimeout(() => {
        try { window.close(); } catch (e) {}
        // 3) پھر بھی بند نہ ہو تو صاف پردہ دکھائیں
        setTimeout(() => { if (!document.hidden) showClosedCover(); }, 300);
      }, 350);
    }, 300);
  }
  function showClosedCover() {
    if (document.getElementById('maClosed')) return;
    const d = document.createElement('div'); d.id = 'maClosed';
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#14463a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px;font-size:20px;line-height:1.9';
    d.innerHTML = '<div>ایپ بند ہو گئی</div><div style="font-size:16px;opacity:.85">اب فون کا ہوم بٹن یا پیچھے کا بٹن دبا کر باہر نکل جائیں</div><button type="button" id="maReopen" style="margin-top:8px;background:#e9c97a;color:#2a1d05;border:0;border-radius:99px;padding:10px 26px;font-size:17px">دوبارہ کھولیں</button>';
    document.body.appendChild(d);
    d.querySelector('#maReopen').onclick = () => d.remove();
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
