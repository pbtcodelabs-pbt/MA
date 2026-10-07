/* مکتبۃ العزیز — سبسکرپشن: کوئی ٹرائل نہیں، کوڈ کے بغیر ایپ بند، کوڈ پر پورا 1 سال
   مکمل آف لائن — نہ Firebase، نہ کوئی سرور، نہ کسی اور ایپ سے کوئی تعلق۔
   ہر فون کی اپنی UID ہوتی ہے؛ ڈیولپر (ورژن بیج پر 7 بار ٹیپ + پاسورڈ) اسی UID کا کوڈ بناتا ہے۔
   کوڈ صرف اسی فون پر چلتا ہے۔ ایپ ہٹا کر دوبارہ لگانے پر وہی کوڈ دوبارہ ڈالنے سے باقی مدت مل جاتی ہے
   (یا Drive بیک اپ سے ری اسٹور کرنے پر خود بحال ہو جاتا ہے)۔ */
(() => {
  'use strict';

  // ===== یہاں صرف یہی چند چیزیں بدلی جا سکتی ہیں =====
  const CFG = {
    DEV_PHONE: '923206793793',   // ڈیولپر کا واٹس ایپ نمبر (بغیر + اور بغیر 0)
    PLAN_DAYS: 365,              // ایک سال
    SECRET: '904c5bf2c13a07d515b226bbeb7cc495598b5ad186dfce35', // کوڈ بنانے کا خفیہ راز — کسی کو نہ دیں
    PASS_HASH: '1c1c5aed8da780051eb69c626df2657e0c6fa013f4c59b759e8e99b1f8b7077e' // ڈیولپر پاسورڈ کا نشان (SHA-256)
  };

  const KEY = 'maktaba-aziz-lic', DEVKEY = 'maktaba-aziz-lic-dev', PWKEY = 'maktaba-aziz-lic-pw';
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());
  const dayDiff = (a, b) => Math.round((new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00')) / 864e5);
  const dmy = s => `${s.slice(8, 10)}-${s.slice(5, 7)}-${s.slice(0, 4)}`;
  const num = n => (window.MA_APP && window.MA_APP.num) ? window.MA_APP.num(n) : String(n);
  const $ = (r, s) => r.querySelector(s);

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

  // ---------- محفوظ حالت ----------
  let mem = null;
  const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.uid) return s; } catch (e) {} return mem; };
  const save = s => { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  function ensure() {
    let s = load();
    if (!s) { s = { uid: computeUid(), exp: '', code: '' }; save(s); }
    return s;
  }

  // ---------- حالت: فعال / ختم / بند (ٹرائل نہیں) ----------
  function status() {
    const s = ensure(), t = today();
    if (s.exp && s.exp >= t) return { mode: 'paid', left: dayDiff(s.exp, t) + 1, exp: s.exp, uid: s.uid };
    return { mode: s.exp ? 'expired' : 'locked', exp: s.exp, uid: s.uid };
  }

  // ---------- کوڈ: تاریخ (3 حروف) + دستخط (10 حروف) ----------
  const dayToChars = d => A[(d >> 10) & 31] + A[(d >> 5) & 31] + A[d & 31];
  const charsToDay = c => { let v = 0; for (const ch of c) { const i = A.indexOf(ch); if (i < 0) return null; v = (v << 5) | i; } return v; };
  const issueDay = () => { const n = new Date(); return Math.floor((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
  const expOf = day => iso(new Date(2026, 0, 1 + day + CFG.PLAN_DAYS));
  const normCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const fmtCode = c => c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8);

  async function mac(uid, day) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(CFG.SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${uid}|${day}|Y`)));
    let n = 0n; for (let i = 0; i < 7; i++) n = (n << 8n) | BigInt(sig[i]);
    n >>= 6n;
    let out = ''; for (let i = 0; i < 10; i++) { out = A[Number(n & 31n)] + out; n >>= 5n; }
    return out;
  }
  async function makeCode(uid) { const d = issueDay(); return { code: fmtCode(dayToChars(d) + await mac(uid, d)), exp: expOf(d) }; }

  async function activate(raw) {
    if (!(window.crypto && crypto.subtle)) return { ok: false, msg: 'ایپ کو https والے لنک سے کھولیں' };
    const s = ensure(), c = normCode(raw);
    if (!/^[A-HJ-NP-Z2-9]{13}$/.test(c)) return { ok: false, msg: 'کوڈ مکمل نہیں یا غلط ہے — دوبارہ دیکھ کر لکھیں' };
    const day = charsToDay(c.slice(0, 3));
    if (await mac(s.uid, day) !== c.slice(3)) return { ok: false, msg: 'یہ کوڈ اس فون کے لیے نہیں ہے' };
    const exp = expOf(day);
    if (exp < today()) return { ok: false, msg: 'اس کوڈ کی مدت ختم ہو چکی ہے' };
    if (!s.exp || exp > s.exp) { s.exp = exp; s.code = c; save(s); }
    return { ok: true, exp: s.exp };
  }

  // ---------- کاپی / پیسٹ ----------
  async function copy(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
    try { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
  }
  async function readClip() { try { return await navigator.clipboard.readText(); } catch (e) { return ''; } }
  async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

  // ---------- اسکرین ----------
  const css = document.createElement('style');
  css.textContent = `
  #licOv{position:fixed;inset:0;z-index:200;background:rgba(10,40,32,.99);color:#fff;display:grid;place-items:center;padding:14px;overflow:auto;direction:rtl}
  .lic-box{width:100%;max-width:420px;display:grid;gap:10px;text-align:center;margin:auto}
  .lic-k{margin:0;color:#e9c97a;font-family:var(--f-body,'JNN','Noto Nastaliq Urdu',serif);font-weight:400;font-size:28px;line-height:2.1;padding:6px 0}
  .lic-p{margin:0;font-size:17px;line-height:2.2}
  .lic-s{margin:0;font-size:15px;line-height:2.1;color:#d8e6df}
  .lic-uid,.lic-code{direction:ltr;font:700 24px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:3px;background:rgba(255,255,255,.12);border:1px solid #e9c97a;border-radius:12px;padding:8px}
  .lic-code{color:#9be3b0;font-size:22px;letter-spacing:2px}
  .lic-in,.lic-ta{width:100%;box-sizing:border-box;border-radius:12px;border:1.5px solid #e9c97a;background:#fff;color:#14463a;padding:10px;font-family:inherit}
  .lic-in{direction:ltr;text-align:center;font:700 20px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:2px;text-transform:uppercase}
  .lic-ta{min-height:84px;font-size:15px;line-height:1.7;resize:vertical}
  .lic-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .lic-b{background:#e9c97a;color:#14463a;border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:16px;line-height:1.4;font-family:inherit;min-height:44px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
  .lic-b.g{background:transparent;color:#e9c97a;border:1.5px solid #e9c97a}
  .lic-ver{justify-self:center;margin:8px auto 0;padding:9px 22px;font:700 14px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#e9c97a;background:rgba(255,255,255,.08);border:1px solid #e9c97a;border-radius:99px;letter-spacing:1px;direction:ltr;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer}
  .lic-m{min-height:1.8em;font-size:15px;color:#ffd9a0}.lic-m.ok{color:#9be3b0}
  .lic-log{display:grid;gap:6px;text-align:start}
  .lic-lr{display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(255,255,255,.08);border-radius:10px;padding:6px 10px;direction:ltr;font:600 13px/1.5 ui-monospace,Menlo,Consolas,monospace}
  .lic-lr button{background:none;border:1px solid #e9c97a;color:#e9c97a;border-radius:8px;padding:2px 10px;font-family:inherit}
  `;
  document.head.appendChild(css);

  let ov = null, blocking = false, devOpen = false;
  function show(html, block) {
    if (!ov) { ov = document.createElement('div'); ov.id = 'licOv'; document.body.appendChild(ov); }
    blocking = !!block; ov.innerHTML = html; document.documentElement.style.overflow = 'hidden';
  }
  function hide() { if (ov) { ov.remove(); ov = null; } blocking = false; devOpen = false; document.documentElement.style.overflow = ''; }
  function toast(m) { try { window.MA_APP && window.MA_APP.toast(m); } catch (e) {} }
  function tapCounter(el, fn) { let n = 0, t; el.addEventListener('click', () => { n++; clearTimeout(t); t = setTimeout(() => { n = 0; }, 2500); if (n >= 7) { n = 0; fn(); } }); }

  // ----- گاہک کی اسکرین -----
  function showGate(block) {
    const st = status();
    let line;
    if (st.mode === 'paid') line = `سبسکرپشن فعال ہے — ${num(st.left)} دن باقی (${dmy(st.exp)} تک)`;
    else if (st.mode === 'expired') line = 'آپ کا سبسکرپشن ختم ہو گیا ہے۔ تجدید کے لیے نیا کوڈ منگوائیں۔';
    else line = 'ایپ استعمال کرنے کے لیے ایک سال کا سبسکرپشن کوڈ درکار ہے۔';
    const msg = `السلام علیکم! مکتبۃ العزیز کا ایک سال کا سبسکرپشن چاہیے۔\nUID: ${st.uid}`;
    show(`<div class="lic-box">
      <p class="lic-k" id="licTitle">${block ? 'سبسکرپشن درکار ہے' : 'سبسکرپشن'}</p>
      <p class="lic-p">${line}</p>
      <p class="lic-s">۱) نیچے والا بٹن دبا کر ڈیولپر کو میسج بھیجیں (آپ کی UID خود لگ جائے گی)<br>۲) جو کوڈ ملے وہ نیچے ڈالیں</p>
      <div class="lic-uid" id="licUid">${st.uid}</div>
      <div class="lic-row"><a class="lic-b" target="_blank" rel="noopener" href="https://wa.me/${CFG.DEV_PHONE}?text=${encodeURIComponent(msg)}">📲 واٹس ایپ پر کوڈ منگوائیں</a>
        <button type="button" class="lic-b g" id="licCopyUid">📋 UID کاپی</button></div>
      <input class="lic-in" id="licIn" placeholder="XXXX-XXXX-XXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false">
      <div class="lic-row"><button type="button" class="lic-b" id="licGo">✅ فعال کریں</button><button type="button" class="lic-b g" id="licPaste">📋 پیسٹ</button></div>
      <div class="lic-m" id="licMsg"></div>
      ${block ? '' : '<button type="button" class="lic-b g" id="licClose">بند کریں</button>'}
      <div class="lic-ver" id="licVer">${(document.getElementById('verChip') || {}).textContent || ''}</div>
    </div>`, block);
    const m = $(ov, '#licMsg'), inp = $(ov, '#licIn');
    tapCounter($(ov, '#licTitle'), devAuth);
    tapCounter($(ov, '#licVer'), devAuth);
    $(ov, '#licCopyUid').onclick = async () => { m.className = 'lic-m ok'; m.textContent = (await copy(st.uid)) ? 'UID کاپی ہو گئی' : 'کاپی نہیں ہو سکی'; };
    const go = async () => {
      m.className = 'lic-m'; m.textContent = 'جانچ ہو رہی ہے…';
      const r = await activate(inp.value);
      if (r.ok) { m.className = 'lic-m ok'; m.textContent = `✅ سبسکرپشن فعال — ${dmy(r.exp)} تک`; setTimeout(() => { hide(); refresh(true); toast('سبسکرپشن فعال ہو گیا'); }, 1100); }
      else m.textContent = r.msg;
    };
    $(ov, '#licGo').onclick = go;
    $(ov, '#licPaste').onclick = async () => { const t = await readClip(); if (t) { inp.value = t.trim(); if (normCode(t).length >= 13) go(); } else { m.className = 'lic-m'; m.textContent = 'پیسٹ نہیں ہو سکا — کوڈ خود لکھ دیں'; } };
    inp.addEventListener('input', () => { if (normCode(inp.value).length >= 13) go(); });
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
  const getLog = () => { try { return JSON.parse(localStorage.getItem(DEVKEY)) || []; } catch (e) { return []; } };
  const putLog = l => { try { localStorage.setItem(DEVKEY, JSON.stringify(l.slice(0, 10))); } catch (e) {} };
  const findUid = t => {
    const u = String(t || '').toUpperCase();
    let m = u.match(/UID[\s:：=-]*([A-HJ-NP-Z2-9]{4})-?([A-HJ-NP-Z2-9]{4})/);
    if (!m) m = u.match(/\b([A-HJ-NP-Z2-9]{4})-([A-HJ-NP-Z2-9]{4})\b/);
    return m ? m[1] + '-' + m[2] : '';
  };
  function devPanel() {
    devOpen = true;
    const log = getLog();
    show(`<div class="lic-box"><p class="lic-k">کوڈ بنائیں (1 سال)</p>
      <textarea class="lic-ta" id="dvMsg" placeholder="گاہک کا میسج یہاں پیسٹ کریں — UID خود نکل آئے گی"></textarea>
      <input class="lic-in" id="dvUid" placeholder="XXXX-XXXX" maxlength="9" autocomplete="off" spellcheck="false">
      <div class="lic-row"><button type="button" class="lic-b g" id="dvPaste">📋 پیسٹ</button><button type="button" class="lic-b" id="dvGen">🔑 کوڈ بنائیں</button></div>
      <div class="lic-m" id="dvM"></div>
      <div id="dvOut"></div>
      <div class="lic-log" id="dvLog">${log.map((r, i) => `<div class="lic-lr"><span>${r.uid} · ${r.code}</span><button type="button" data-i="${i}">کاپی</button></div>`).join('')}</div>
      <p class="lic-s" style="margin-top:6px">پاسورڈ بدلیں</p>
      <input class="lic-in" id="dvNew" type="password" placeholder="نیا پاسورڈ" autocomplete="off" style="text-transform:none">
      <input class="lic-in" id="dvNew2" type="password" placeholder="نیا پاسورڈ دوبارہ" autocomplete="off" style="text-transform:none">
      <div class="lic-row"><button type="button" class="lic-b g" id="dvPwSave">🔒 پاسورڈ محفوظ کریں</button></div>
      <div class="lic-m" id="dvPwM"></div>
      <button type="button" class="lic-b g" id="dvClose">بند کریں</button></div>`, false);
    const msg = $(ov, '#dvMsg'), uidIn = $(ov, '#dvUid'), m = $(ov, '#dvM'), out = $(ov, '#dvOut');
    const pick = () => { const u = findUid(msg.value); if (u) uidIn.value = u; };
    msg.addEventListener('input', pick);
    $(ov, '#dvPaste').onclick = async () => { const t = await readClip(); if (t) { msg.value = t; pick(); } else { m.textContent = 'پیسٹ نہیں ہو سکا — خود پیسٹ کریں'; } };
    $(ov, '#dvGen').onclick = async () => {
      const uid = normUid(uidIn.value);
      if (!uid) { m.className = 'lic-m'; m.textContent = 'UID درست نہیں (8 حروف: XXXX-XXXX)'; return; }
      const { code, exp } = await makeCode(uid);
      const ok = await copy(code);
      const l = getLog(); l.unshift({ uid, code, exp }); putLog(l);
      m.className = 'lic-m ok'; m.textContent = ok ? '✅ کوڈ بن گیا اور کاپی ہو گیا' : 'کوڈ بن گیا — نیچے سے کاپی کریں';
      const wa = `السلام علیکم! آپ کا مکتبۃ العزیز ایکٹیویشن کوڈ:\n${code}\n(ایک سال — ${dmy(exp)} تک)`;
      out.innerHTML = `<div class="lic-code">${code}</div><p class="lic-s">میعاد: ${dmy(exp)} تک</p>
        <div class="lic-row"><button type="button" class="lic-b g" id="dvCp">📋 کاپی</button><a class="lic-b" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(wa)}">📤 واٹس ایپ</a></div>`;
      $(ov, '#dvCp').onclick = async () => { m.textContent = (await copy(code)) ? '✅ کاپی ہو گیا' : 'کاپی نہیں ہو سکا'; };
    };
    $(ov, '#dvLog').onclick = async e => { const b = e.target.closest('button[data-i]'); if (!b) return; const r = getLog()[+b.dataset.i]; if (r) { m.className = 'lic-m ok'; m.textContent = (await copy(r.code)) ? '✅ کاپی ہو گیا' : 'کاپی نہیں ہو سکا'; } };
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
  }

  // ----- ورژن کے ساتھ چھوٹا نشان -----
  function chip() {
    const vc = document.getElementById('verChip'); if (!vc) return;
    let c = document.getElementById('licChip'); const st = status();
    const showIt = st.mode === 'paid' && st.left <= 30;
    if (!showIt) { if (c) c.remove(); return; }
    if (!c) {
      c = document.createElement('button'); c.id = 'licChip'; c.type = 'button'; c.className = 'chip chip-btn'; c.innerHTML = '<span class="lbl"></span>';
      c.addEventListener('click', () => showGate(false)); vc.insertAdjacentElement('afterend', c);
    }
    c.firstChild.textContent = `سبسکرپشن: ${num(st.left)} دن`;
  }

  // ----- جانچ -----
  function refresh(force) {
    if (devOpen) return;
    const st = status(), locked = st.mode === 'locked' || st.mode === 'expired';
    if (locked && (!ov || !blocking)) showGate(true);
    else if (!locked && ov && blocking) hide();
    chip();
  }

  window.MA_LIC = {
    status,
    export: () => ({ code: (load() || {}).code || '' }),
    import: async l => { if (l && l.code) { const r = await activate(l.code); if (r.ok) refresh(true); return r; } }
  };

  ensure();
  refresh(true);
  setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(true); });
  const vc = document.getElementById('verChip'); if (vc) tapCounter(vc, devAuth);
})();
