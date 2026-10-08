/* میرا مکتبہ — سبسکرپشن: کوئی ٹرائل نہیں، کوڈ کے بغیر ایپ بند۔
   مکمل آف لائن — نہ Firebase، نہ کوئی سرور، نہ کسی اور ایپ سے کوئی تعلق۔
   کوڈ میں ختم ہونے کی تاریخ اور بننے کی تاریخ دونوں ہیں؛ باقی دن نئے کوڈ پر خود جمع ہو جاتے ہیں (ڈیولپر پینل حساب لگاتا ہے)۔
   ہر فون کی اپنی UID ہے، کوڈ صرف اسی فون پر چلتا ہے۔ ڈیولپر پینل: ورژن بیج پر 7 ٹیپ + پاسورڈ۔ */
(() => {
  'use strict';

  // ===== یہاں صرف یہی چند چیزیں بدلی جا سکتی ہیں =====
  const CFG = {
    DEV_PHONE: '923206793793',   // ڈیولپر کا واٹس ایپ نمبر (بغیر + اور بغیر 0)
    PLAN_DAYS: 365,              // ایک سال
    TRIAL_DAYS: 3,               // نئے فون پر ایک بار فری ٹرائل
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

  // ---------- فری ٹرائل (ہر فون پر ایک بار) ----------
  const TKEY = 'maktaba-aziz-trial';
  const trialStart = () => { const s = load(); let v = (s && s.trial) || ''; try { v = v || localStorage.getItem(TKEY) || ''; } catch (e) {} return v; };
  function startTrial() { const s = ensure(); if (trialStart()) return; s.trial = today(); save(s); try { localStorage.setItem(TKEY, s.trial); } catch (e) {} }

  // ---------- حالت: فعال / ختم / بند ----------
  function status() {
    const s = ensure(), t = today();
    if (s.exp && s.exp >= t) return { mode: 'paid', left: dayDiff(s.exp, t) + 1, exp: s.exp, iss: s.iss || '', uid: s.uid, code: s.code };
    const tr = trialStart();
    if (tr && !s.exp) { const end = addDays(tr, CFG.TRIAL_DAYS - 1); if (end >= t) return { mode: 'trial', left: dayDiff(end, t) + 1, exp: end, uid: s.uid }; }
    return { mode: s.exp ? 'expired' : 'locked', exp: s.exp, uid: s.uid, trialUsed: !!tr };
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
  .lic-step{margin:4px 0 -2px;font-size:19px;line-height:1.8;color:#f4de96;text-align:center}
  .lic-big{display:block;width:100%;text-align:center;font-size:19px !important;padding:8px 12px !important;box-sizing:border-box}
  .lic-small{margin:-4px 0 2px;font-size:14px;line-height:1.8;color:#e6d6aa;text-align:center}
  .lic-small b{font:700 14px ui-monospace,Menlo,Consolas,monospace;letter-spacing:1px;color:#fff1c1}
  .lic-link{border:0;background:none;color:#f4de96;text-decoration:underline;font:inherit;cursor:pointer;padding:0}
  .lic-rs{display:block;margin:6px auto 0;font-size:16px}
  .lic-rbox{background:rgba(0,0,0,.22);border:1px dashed rgba(233,201,122,.7);border-radius:14px;padding:8px 12px;display:grid;gap:6px}
  .lic-rbox p{margin:0;font-size:15px;line-height:1.85;color:#f3e6c2}
  .lic-trial{font-size:24px !important;padding:16px 14px !important;border-radius:20px !important;box-shadow:0 0 0 3px #fff3c4,0 8px 0 #8a5f16,0 16px 26px rgba(0,0,0,.45) !important;animation:licPulse 2.2s ease-in-out infinite}
  @keyframes licPulse{50%{filter:brightness(1.12)}}
  .lic-tcard .ln{justify-content:center}
  .lic-em.sm .lic-logo{width:100%}
  .lic-logo{position:absolute;left:50%;top:50%;width:80%;height:auto;transform:translate(-50%,-50%);filter:drop-shadow(0 10px 16px rgba(0,0,0,.5));z-index:3}
  .lic-in.need{border-color:#ff8a7a !important;box-shadow:0 0 0 3px rgba(255,120,100,.35) !important}
  .lic-uid,.lic-code{direction:ltr;font:700 24px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:3px;background:rgba(255,255,255,.12);border:1px solid #e9c97a;border-radius:12px;padding:8px}
  .lic-code{color:#9be3b0;font-size:19px;letter-spacing:1.5px}
  .lic-in,.lic-ta{width:100%;box-sizing:border-box;border-radius:12px;border:1.5px solid #e9c97a;background:#fff;color:#14463a;padding:10px;font-family:inherit}
  .lic-in{direction:ltr;text-align:center;font:700 20px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:2px;text-transform:uppercase}
  .lic-in.t{font:400 17px/1.7 inherit;font-family:inherit;direction:rtl;letter-spacing:0;text-transform:none}
  .lic-in.d{font-size:16px;letter-spacing:1px}
  .lic-days{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
  .lic-days button{border:1.5px solid #e9c97a;background:rgba(255,255,255,.1);color:#fff1c1;border-radius:99px;padding:2px 12px;font:inherit;font-size:15px;line-height:1.9;cursor:pointer}
  .lic-days button.on{background:linear-gradient(180deg,#fff6d5,#f1d27a 40%,#c8962f);color:#0b2e26;border-color:#8a5f16}
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
  const LOGO_MASK = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48cGF0aCBkPSJNNjAgMGw0IDguNiA5LjIuOS02LjkgNi4yIDIgOS4yTDYwIDIwLjFsLTguMyA0LjggMi05LjItNi45LTYuMiA5LjItLjl6Ii8+PHBhdGggZD0iTTYwIDQyQzQ1IDMyIDIyIDMwIDYgMzR2NjJjMTYtNCAzOS0yIDU0IDggMTUtMTAgMzgtMTIgNTQtOFYzNGMtMTYtNC0zOS0yLTU0IDh6IE01NyA0NnY1M2MtMTMtNy0zMS04LTQ1LTZWMzljMTQtMiAzMi0xIDQ1IDd6IE02MyA0NmMxMy04IDMxLTkgNDUtN3Y1NGMtMTQtMi0zMi0xLTQ1IDZ6IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=)';
  try { document.documentElement.style.setProperty('--m', LOGO_MASK); const he = document.querySelector('.emblem'); if (he) he.classList.add('gold'); } catch (e) {}
  function emblem(small) {
    const sp = Array.from({ length: 22 }, (_, i) => `<i class="lic-sp" style="--a:${Math.round(i * 360 / 22 + (i % 2) * 6)}deg;--d:${((i * 0.41) % 2.8).toFixed(2)}s;--z:${6 + (i * 5) % 9}px"></i>`).join('');
    const ed = Array.from({ length: 13 }, (_, i) => `<i class="lic-ed" style="transform:translateZ(calc(var(--t) * ${((i - 6) / 12).toFixed(3)}))"></i>`).join('');
    const face = c => `<div class="lic-face ${c}"><div class="lic-art"></div><div class="lic-shine"></div></div>`;
    return `<div class="lic-em${small ? ' sm' : ''}"><div class="lic-rays"></div><div class="lic-rays2"></div><div class="lic-glow"></div>${sp}<img class="lic-logo" src="icons/app-badge.png" alt="میرا مکتبہ"></div>`;
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
    const bn = (window.MA_BRAND && window.MA_BRAND.get().name) || '';
    return `نام: ${name || ''}\n` + (bn ? `مکتبہ: ${bn}\n` : '') + `UID: ${st.uid}\nہمیں سبسکرپشن کوڈ چاہیے۔` + (st.mode === 'paid' ? `\nموجودہ سبسکرپشن ختم: ${dmyI(st.exp)}` : '');
  }
  // ڈائری سے آئے ہوں تو کھلنے کے بعد واپس ڈائری میں
  const goNext = () => { if (/[?&]next=diary\b/.test(location.search)) { location.replace('diary/'); return true; } return false; };
  function showTrialGate() {
    const bn = (window.MA_BRAND && window.MA_BRAND.get().name) || 'میرا مکتبہ';
    show(`<div class="lic-box">${emblem(true)}
      <div class="lic-fade" style="display:grid;gap:14px">
      <p class="lic-k" id="licTitle">${esc(bn)}</p>
      <button type="button" class="lic-b lic-trial" id="licTrial">🎁 ${num(CFG.TRIAL_DAYS)} دن کے لیے فری استعمال کریں</button>
      <button type="button" class="lic-link lic-rs" id="licHaveCode">سبسکرپشن کے لیے یہ بٹن دبائیں</button>
      <div class="lic-ver" id="licVer">${(document.getElementById('verChip') || {}).textContent || ''}</div>
      </div></div>`, true);
    tapCounter($(ov, '#licTitle'), devAuth);
    tapCounter($(ov, '#licVer'), devAuth);
    $(ov, '#licTrial').onclick = () => { startTrial(); if (goNext()) return; hide(); showWelcome(); refresh(); };
    $(ov, '#licHaveCode').onclick = () => showGate(true, true);
  }
  function showGate(block, full) {
    const st = status(), s = ensure();
    if (block && !full && st.mode === 'locked' && !st.trialUsed) return showTrialGate();
    let line;
    if (st.mode === 'paid') line = `سبسکرپشن فعال ہے — ${num(st.left)} دن باقی (${dmyI(st.exp)} تک)۔ ابھی تجدید کریں تو باقی دن ضائع نہیں ہوں گے، نئے دن ان کے اوپر جمع ہو جائیں گے۔`;
    else if (st.mode === 'expired') line = 'آپ کا سبسکرپشن ختم ہو گیا ہے۔ تجدید کے لیے نیا کوڈ منگوائیں۔';
    else if (st.mode === 'trial') line = `فری ٹرائل کے ${num(st.left)} دن باقی ہیں۔ ابھی کوڈ لے لیں تو ٹرائل کے بعد بھی ایپ بغیر رکے چلتی رہے گی۔`;
    else if (st.trialUsed) line = `آپ کا ${num(CFG.TRIAL_DAYS)} دن کا فری ٹرائل ختم ہو گیا۔ آپ کا سارا ریکارڈ محفوظ ہے — سبسکرپشن کوڈ لگاتے ہی سب واپس مل جائے گا۔`;
    else line = 'ایپ چلانے کے لیے سبسکرپشن کوڈ حاصل کریں۔';
    show(`<div class="lic-box">${block ? emblem(true) : ''}
      <div class="${block ? 'lic-fade' : ''}" style="display:grid;gap:10px">
      <p class="lic-k" id="licTitle">${block ? 'سبسکرپشن درکار ہے' : 'سبسکرپشن'}</p>
      <p class="lic-p">${line}</p>
      <p class="lic-step">۱) اپنا نام لکھ کر واٹس ایپ کریں</p>
      <input class="lic-in t" id="licName" placeholder="اپنا نام لکھیں (ضروری)" autocomplete="off" value="${esc(s.name || '')}">
      <a class="lic-b lic-big" id="licWa" target="_blank" rel="noopener" href="#">📲 واٹس ایپ پر کوڈ منگوائیں</a>
      <p class="lic-small">آپ کی UID: <b dir="ltr" id="licUid">${st.uid}</b> · <button type="button" class="lic-link" id="licCopyMsg">یا میسج کاپی کریں</button></p>
      <p class="lic-step">۲) ملنے والا کوڈ یہاں ڈالیں</p>
      <input class="lic-in" id="licIn" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false">
      <button type="button" class="lic-b lic-big g2" id="licGo">✅ فعال کریں</button>
      <button type="button" class="lic-link lic-rs" id="licRestore">🔄 پہلے سے سبسکرپشن تھی؟ یہاں سے بحال کریں</button>
      <div class="lic-rbox" id="licRbox" hidden>
        <p><b>۱)</b> پہلے واٹس ایپ پر جو کوڈ ملا تھا، وہی اوپر والے خانے میں دوبارہ ڈال کر «فعال کریں» دبائیں۔ اسی فون پر وہی کوڈ دوبارہ چل جاتا ہے۔</p>
        <p><b>۲)</b> پرانا کوڈ نہیں مل رہا؟ نیچے بٹن دبائیں، آپ کو پرانا کوڈ دوبارہ بھیج دیا جائے گا (نیا پیسہ نہیں لگے گا)۔</p>
        <a class="lic-b lic-big" id="licWaR" target="_blank" rel="noopener" href="#">📲 سبسکرپشن بحال کروائیں</a>
      </div>
      <div class="lic-m" id="licMsg"></div>
      ${block ? '' : '<button type="button" class="lic-b g" id="licClose">بند کریں</button>'}
      ${block ? '<button type="button" class="lic-b g lic-big" id="licExit">⏻ ایپ بند کریں</button>' : ''}
      <div class="lic-ver" id="licVer">${(document.getElementById('verChip') || {}).textContent || ''}</div>
      </div>
    </div>`, block);
    const m = $(ov, '#licMsg'), inp = $(ov, '#licIn'), nm = $(ov, '#licName'), wa = $(ov, '#licWa');
    const setWa = () => { const u = ensure(); u.name = nm.value.trim(); save(u); wa.href = `https://wa.me/${CFG.DEV_PHONE}?text=${encodeURIComponent(waMsg(status(), u.name))}`; };
    setWa(); nm.addEventListener('input', () => { setWa(); nm.classList.remove('need'); });
    wa.addEventListener('click', e => { if (!nm.value.trim()) { e.preventDefault(); nm.classList.add('need'); nm.focus(); m.className = 'lic-m'; m.textContent = 'پہلے اپنا نام لکھیں، پھر میسج بھیجیں'; } });
    tapCounter($(ov, '#licTitle'), devAuth);
    tapCounter($(ov, '#licVer'), devAuth);
    $(ov, '#licRestore').onclick = () => { const b = $(ov, '#licRbox'); b.hidden = !b.hidden; if (!b.hidden) b.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    const waR = $(ov, '#licWaR');
    waR.addEventListener('click', e => {
      if (!nm.value.trim()) { e.preventDefault(); nm.classList.add('need'); nm.focus(); m.className = 'lic-m'; m.textContent = 'پہلے اوپر اپنا نام لکھیں'; return; }
      waR.href = `https://wa.me/${CFG.DEV_PHONE}?text=${encodeURIComponent(`نام: ${nm.value.trim()}\nUID: ${st.uid}\nمیری سبسکرپشن پہلے سے تھی، ایپ دوبارہ کوڈ مانگ رہی ہے۔ براہ کرم بحال کر دیں۔`)}`;
    });
    $(ov, '#licCopyMsg').onclick = async () => {
      if (!nm.value.trim()) { nm.classList.add('need'); nm.focus(); m.className = 'lic-m'; m.textContent = 'پہلے اپنا نام لکھیں'; return; }
      m.className = 'lic-m ok'; m.textContent = (await copy(waMsg(status(), nm.value.trim()))) ? 'میسج کاپی ہو گیا — اب 0320-6793793 پر بھیج دیں' : 'کاپی نہیں ہو سکا';
    };
    const go = async () => {
      m.className = 'lic-m'; m.textContent = 'جانچ ہو رہی ہے…';
      const r = await activate(inp.value);
      if (r.ok) { m.className = 'lic-m ok'; m.textContent = `✅ سبسکرپشن فعال — ${dmyI(r.exp)} تک`; setTimeout(() => { if (goNext()) return; showWelcome(); refresh(true); }, 900); }
      else m.textContent = r.msg;
    };
    // ایک ہی بٹن: کوڈ خالی ہو تو خود پیسٹ کر کے فعال کرے
    $(ov, '#licGo').onclick = async () => {
      if (normCode(inp.value).length < 16) { const t = await readClip(); if (t && normCode(t).length >= 16) inp.value = t.trim(); }
      if (normCode(inp.value).length < 16) { m.className = 'lic-m'; m.textContent = 'واٹس ایپ پر ملا کوڈ کاپی کر کے یہ بٹن دبائیں، یا اوپر خانے میں لکھ دیں'; inp.focus(); return; }
      go();
    };
    inp.addEventListener('input', () => { if (normCode(inp.value).length >= 16) go(); });
    const cl = $(ov, '#licClose'); if (cl) cl.onclick = hide;
    const ex = $(ov, '#licExit'); if (ex) ex.onclick = closeApp;
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
  const sendMsg = r => `السلام علیکم! آپ کا «میرا مکتبہ» ایکٹیویشن کوڈ:\n${r.code}\n(${r.days && r.days !== 365 ? r.days + ' دن کا کوڈ — ' : ''}سبسکرپشن ختم ہونے کی تاریخ: ${dmyI(r.exp)})`;

  function devPanel() {
    devOpen = true;
    show(`<div class="lic-box"><p class="lic-k">ڈیولپر — کوڈ بنائیں</p>
      <input class="lic-in t" id="dvName" placeholder="گاہک کا نام (ضروری)" autocomplete="off">
      <input class="lic-in" id="dvUid" placeholder="UID: XXXX-XXXX" maxlength="9" autocomplete="off" spellcheck="false">
      <textarea class="lic-ta" id="dvMsg" placeholder="گاہک کا میسج یہاں پیسٹ کریں — نام، UID اور ختم ہونے کی تاریخ خود نکل آئے گی۔ نام نہ ہو تو اوپر خود لکھ دیں"></textarea>
      <input class="lic-in d" id="dvCur" placeholder="موجودہ ختم (اختیاری) 31-12-2026" maxlength="10" autocomplete="off" style="text-transform:none">
      <p class="lic-s" style="margin:2px 0 -4px">کتنے دن کا کوڈ؟</p>
      <div class="lic-days" id="dvDd"><button type="button" data-d="5">5 دن</button><button type="button" data-d="10">10 دن</button><button type="button" data-d="15">15 دن</button><button type="button" data-d="30">ایک ماہ</button><button type="button" data-d="365" class="on">ایک سال</button></div>
      <input class="lic-in" id="dvDays" inputmode="numeric" maxlength="4" value="365" autocomplete="off" placeholder="دن لکھیں" aria-label="دن">
      <div class="lic-row"><button type="button" class="lic-b g" id="dvPaste">📋 پیسٹ</button><button type="button" class="lic-b" id="dvGen">🔑 کوڈ بنائیں</button></div>
      <div class="lic-m" id="dvM"></div>
      <div id="dvOut"></div>
      <p class="lic-s" id="dvCnt"></p>
      <input class="lic-in t" id="dvFind" placeholder="تلاش: نام / UID / کوڈ" autocomplete="off">
      <div class="lic-log" id="dvLog"></div>
      <div class="lic-row"><button type="button" class="lic-b g sm" id="dvExp"><svg class="shr" viewBox="0 0 24 24" width="1.1em" height="1.1em" style="vertical-align:-0.2em" aria-hidden="true"><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cx="18" cy="5" r="3.2" fill="currentColor"/><circle cx="6" cy="12" r="3.2" fill="currentColor"/><circle cx="18" cy="19" r="3.2" fill="currentColor"/></svg> فہرست کاپی</button><button type="button" class="lic-b g sm" id="dvImp">📥 فہرست بحال</button></div>
      <p class="lic-s" style="margin-top:6px">پاسورڈ بدلیں</p>
      <input class="lic-in" id="dvNew" type="password" placeholder="نیا پاسورڈ" autocomplete="off" style="text-transform:none">
      <input class="lic-in" id="dvNew2" type="password" placeholder="نیا پاسورڈ دوبارہ" autocomplete="off" style="text-transform:none">
      <div class="lic-row"><button type="button" class="lic-b g" id="dvPwSave">🔒 پاسورڈ محفوظ کریں</button></div>
      <div class="lic-m" id="dvPwM"></div>
      <div class="lic-row"><button type="button" class="lic-b" id="dvPoster">🖼️ پوسٹر شیئر کریں</button></div>
      <button type="button" class="lic-b g" id="dvClose">بند کریں</button></div>`, false);
    // اشتہاری پوسٹر (صرف ڈیولپر کے لیے)
    $(ov, '#dvPoster').onclick = async () => {
      const pm = $(ov, '#dvM'); pm.className = 'lic-m'; pm.textContent = 'پوسٹر کھل رہا ہے…';
      try {
        const res = await fetch('promo/mera-maktaba.jpg', { cache: 'no-cache' }); if (!res.ok) throw new Error('net');
        const blob = await res.blob(), file = new File([blob], 'mera-maktaba.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: 'میرا مکتبہ — ڈیجیٹل لائبریری، ڈائری اور شیڈیول' }); pm.textContent = ''; return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mera-maktaba.jpg'; document.body.appendChild(a); a.click(); a.remove();
        pm.className = 'lic-m ok'; pm.textContent = 'پوسٹر ڈاؤن لوڈ ہو گیا — گیلری سے واٹس ایپ پر بھیجیں';
      } catch (e) { if (e && e.name === 'AbortError') { pm.textContent = ''; return; } pm.textContent = 'پوسٹر کے لیے انٹرنیٹ چاہیے'; }
    };
    // دنوں کا انتخاب
    const daysIn = $(ov, '#dvDays'), dd = $(ov, '#dvDd');
    const markDays = () => { dd.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.d === String(parseInt(daysIn.value, 10)))); };
    dd.onclick = e => { const b = e.target.closest('button[data-d]'); if (!b) return; daysIn.value = b.dataset.d; markDays(); };
    daysIn.addEventListener('input', markDays);
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
        <div class="lic-row"><button type="button" class="lic-b g sm" data-a="used">${r.used ? '↩️ غیر استعمال' : '✅ استعمال ہو گیا'}</button><button type="button" class="lic-b g sm" data-a="name">✏️ نام</button><button type="button" class="lic-b g sm" data-a="copy">📋 کاپی</button><button type="button" class="lic-b sm" data-a="wa"><svg class="shr" viewBox="0 0 24 24" width="1.1em" height="1.1em" style="vertical-align:-0.2em" aria-hidden="true"><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cx="18" cy="5" r="3.2" fill="currentColor"/><circle cx="6" cy="12" r="3.2" fill="currentColor"/><circle cx="18" cy="19" r="3.2" fill="currentColor"/></svg> بھیجیں</button><button type="button" class="lic-b g sm" data-a="del">🗑️</button></div></div>`).join('') || '<p class="lic-s">کوئی ریکارڈ نہیں</p>';
    }
    function showResult(r, note, canForce) {
      out.innerHTML = `${note ? `<p class="lic-s">${note}</p>` : ''}<div class="lic-code">${r.code}</div><p class="lic-s">${esc(r.name) || ''} · ختم: ${dmyI(r.exp)} (${num(dayDiff(r.exp, today()) + 1)} دن)</p>
        <div class="lic-row"><button type="button" class="lic-b g" id="dvCp">📋 کاپی</button><a class="lic-b" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(sendMsg(r))}"><svg class="shr" viewBox="0 0 24 24" width="1.1em" height="1.1em" style="vertical-align:-0.2em" aria-hidden="true"><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cx="18" cy="5" r="3.2" fill="currentColor"/><circle cx="6" cy="12" r="3.2" fill="currentColor"/><circle cx="18" cy="19" r="3.2" fill="currentColor"/></svg> واٹس ایپ</a>${canForce ? '<button type="button" class="lic-b g" id="dvForce">➕ نیا کوڈ (دن جمع)</button>' : ''}</div>`;
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
    // گاہک کا پورا میسج پیسٹ ہو تو نام + UID خود لگ کر کوڈ بھی خود بن جائے
    const isRestore = () => /بحال/.test(msg.value);
    const auto = () => { if (findUid(msg.value) && nameIn.value.trim()) { if (isRestore() && restore()) return; gen(false); } };
    // پرانی سبسکرپشن بحال: اسی UID کا ابھی چلنے والا کوڈ دوبارہ دکھائیں (نیا کوڈ / نئے دن نہیں)
    function restore() {
      const uid = normUid(uidIn.value); if (!uid) return false;
      const live = getL().filter(r => r.uid === uid && r.exp >= today()).sort((a, b) => (b.exp > a.exp ? 1 : -1))[0];
      if (!live) { m.className = 'lic-m'; m.textContent = 'اس UID کا کوئی چلتا ہوا کوڈ ریکارڈ میں نہیں — دن چن کر نیا کوڈ بنائیں'; return true; }
      copy(live.code); m.className = 'lic-m ok'; m.textContent = '✅ پرانا کوڈ مل گیا اور کاپی ہو گیا — یہی گاہک کو بھیج دیں';
      showResult(live, 'بحالی: یہ اسی فون کا پہلے والا کوڈ ہے، اس سے سبسکرپشن پہلے جتنی ہی بحال ہو جائے گی۔', false);
      return true;
    }
    msg.addEventListener('input', pick); uidIn.addEventListener('input', fillName);
    msg.addEventListener('paste', () => setTimeout(() => { pick(); auto(); }, 0));
    $(ov, '#dvPaste').onclick = async () => { const t = await readClip(); if (t) { msg.value = t; pick(); auto(); } else { m.className = 'lic-m'; m.textContent = 'پیسٹ نہیں ہو سکا — خود پیسٹ کریں'; } };

    async function gen(force) {
      const uid = normUid(uidIn.value);
      m.className = 'lic-m';
      if (!uid) { m.textContent = 'UID درست نہیں (8 حروف: XXXX-XXXX)'; return; }
      const name = nameIn.value.trim(), t = today(), L = getL(), mine = L.filter(r => r.uid === uid);
      if (!name) { m.textContent = 'پہلے گاہک کا نام لکھیں'; nameIn.focus(); return; }
      const days = Math.min(3650, Math.max(1, parseInt(String(daysIn.value).replace(/[^0-9]/g, ''), 10) || CFG.PLAN_DAYS));
      const pending = mine.find(r => !r.used && r.exp >= t && (r.days || CFG.PLAN_DAYS) === days);
      if (pending && !force) {
        if (name && pending.name !== name) { pending.name = name; putL(L); }
        m.className = 'lic-m ok'; m.textContent = 'اس UID کا کوڈ پہلے بنا ہوا ہے';
        showResult(pending, 'یہ کوڈ پہلے دیا جا چکا ہے اور استعمال کی تصدیق نہیں — وہی دوبارہ بھیجیں۔', true); renderLog(); return;
      }
      let base = ''; mine.forEach(r => { if (r.exp >= t && r.exp > base) base = r.exp; });
      const cur = parseDmy(curIn.value); if (cur && cur >= t && cur > base) base = cur;
      const exp = base ? addDays(base, days) : addDays(t, days - 1);
      const code = await makeCode(uid, exp, t);
      const rec = { uid, name, code, iss: t, exp, days, used: false, ts: Date.now() };
      L.unshift(rec); putL(L);
      const ok = await copy(code);
      m.className = 'lic-m ok'; m.textContent = ok ? '✅ کوڈ بن گیا اور کاپی ہو گیا' : 'کوڈ بن گیا — نیچے سے کاپی کریں';
      showResult(rec, base ? `باقی دن جمع ہو گئے: نئے دن ${dmyI(base)} کے بعد شروع ہوں گے۔` : '', false); renderLog();
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
    if (st.mode === 'trial') {
      const h = document.getElementById('licSlot'); if (!h) return;
      if (c) c.remove();
      c = document.createElement('div'); c.id = 'licCard'; c.className = 'lic-card lic-tcard'; h.appendChild(c);
      c.innerHTML = `<div class="ln"><span>🎁 فری ٹرائل: <b class="big">${num(st.left)} دن</b> باقی</span><button type="button">🛒 ابھی خریدیں</button></div>`;
      c.querySelector('button').onclick = () => showGate(false, true);
      return;
    }
    if (c && c.classList.contains('lic-tcard')) { c.remove(); c = null; }
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
    // مکتبے کے صفحے سے: مین صفحے پر جا کر وہیں سے بند کریں (وہی ایپ کا پہلا صفحہ ہے)
    if (!/\/(index\.html)?$/.test(location.pathname)) { location.replace('./?exit=1'); return; }
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
