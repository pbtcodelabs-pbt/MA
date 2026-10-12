/* میرا مکتبہ — ایپ کا رنگ، روشنی، فونٹ، لکھائی کا سائز اور موٹائی
   فونٹ الگ فولڈر (fonts/extra) میں ہیں اور صرف تب ڈاؤن لوڈ ہوتے ہیں جب چنے جائیں — ایپ کھلنے پر کوئی بوجھ نہیں۔ */
(function () {
  'use strict';
  const KEY = 'maktaba-aziz-look';
  const base = (() => { const s = document.currentScript && document.currentScript.src; return s ? s.replace(/look\.js.*$/, '') : ''; })();
  const FONTS = {
    noori:    { n: 'جمیل نوری نستعلیق', fam: 'JNN' },
    kasheeda: { n: 'نوری نستعلیق کشیدہ', fam: 'JNNK', url: 'fonts/jnn-kasheeda-full.woff2', fmt: 'woff2' },
    nafees:   { n: 'نفیس نسخ', fam: 'MAF Nafees', url: 'fonts/extra/nafees-naskh.woff' },
    khawar:   { n: 'القلم خاور', fam: 'MAF Khawar', url: 'fonts/extra/alqalam-khawar.woff' },
    akram:    { n: 'اکرم یونیکوڈ', fam: 'MAF Akram', url: 'fonts/extra/akram-unicode.woff' },
    almas:    { n: 'سمیر الماس', fam: 'MAF Almas', url: 'fonts/extra/sameer-almas.woff' },
    alfars:   { n: 'الفارس', fam: 'MAF Alfars', url: 'fonts/extra/alfars-aban.woff' },
    gandhara: { n: 'گندھارا ثلث', fam: 'MAF Gandhara', url: 'fonts/extra/gandhara-suls.woff' },
    plain:    { n: 'سادہ (فون کا)', fam: '' }
  };
  // ایپ کے رنگ: اصل سبز کا رنگ (hue) بدل کر — سنہری اور کتابوں کے رنگ ویسے ہی رہتے ہیں
  const THEMES = {
    green:  { n: 'سبز',    h: null, s: 1,    sw: '#1f6a54' },
    blue:   { n: 'نیلا',   h: 214,  s: 1.05, sw: '#2b5ca3' },
    teal:   { n: 'فیروزی', h: 188,  s: 1,    sw: '#1d7480' },
    purple: { n: 'جامنی',  h: 268,  s: .85,  sw: '#5b3c80' },
    maroon: { n: 'عنابی',  h: 350,  s: .95,  sw: '#93303d' },
    brown:  { n: 'کتھئی',  h: 24,   s: .7,   sw: '#7a5030' },
    navy:   { n: 'گہرا نیلا', h: 228, s: .8, sw: '#22336b' },
    gray:   { n: 'سرمئی',  h: 205,  s: .18,  sw: '#4a5560' }
  };
  const DEF = { theme: 'green', light: 0, font: 'noori', size: 100, bold: 0 };
  let L = Object.assign({}, DEF, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) {} };

  // ---------- فونٹ لوڈ کرنا (صرف ضرورت پر) ----------
  const loaded = {};
  function loadFont(k) {
    const f = FONTS[k]; if (!f || !f.url) return Promise.resolve(true);
    if (loaded[k]) return loaded[k];
    loaded[k] = (async () => {
      try { const ff = new FontFace(f.fam, `url(${base}${f.url}) format("${f.fmt || 'woff'}")`, { display: 'swap' }); await ff.load(); document.fonts.add(ff); return true; }
      catch (e) { loaded[k] = null; return false; }
    })();
    return loaded[k];
  }
  const stack = k => { const f = FONTS[k] || FONTS.noori; return `"Digits",${f.fam ? `"${f.fam}",` : ''}"JNN","Jameel Noori Nastaleeq","Noto Naskh Arabic","Segoe UI",Tahoma,serif`; };

  // ---------- رنگ بدلنا ----------
  const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function hsl2rgb(h, s, l) { h /= 360; const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; if (!s) return [l, l, l].map(v => Math.round(v * 255)); const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map(v => Math.round(v * 255)); }
  // سبز/فیروزی خاندان کا رنگ ہو تو نئے رنگ میں بدلیں
  function shift(r, g, b, a) {
    const [h, s, l] = rgb2hsl(r, g, b);
    if (!(h >= 150 && h <= 178 && s >= .18 && l <= .82)) return null;
    const T = THEMES[L.theme] || THEMES.green;
    const nh = T.h == null ? h : (T.h + (h - 160) * .3 + 360) % 360;
    const ns = Math.min(1, s * T.s);
    const nl = Math.max(.03, Math.min(.92, l + (L.light / 100) * (l < .5 ? .55 : .25)));
    const [R, G, B] = hsl2rgb(nh, ns, nl);
    return a == null || a === '' ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${a})`;
  }
  function recolor(txt) {
    return txt
      .replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (m, h) => { const c = hex2rgb(h); return shift(c[0], c[1], c[2]) || m; })
      .replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g, (m, r, g, b, a) => shift(+r, +g, +b, a) || m);
  }
  let ovEl = null;
  function buildOverride() {
    const out = [];
    const walk = (rules, wrapOpen, wrapClose) => {
      for (const r of rules) {
        if (r.cssRules && r.media) { walk(r.cssRules, `@media ${r.media.mediaText}{`, '}'); continue; }
        if (r.cssRules && r.conditionText !== undefined && r.type === 12) { walk(r.cssRules, `@supports ${r.conditionText}{`, '}'); continue; }
        if (r.type === 5 || r.type === 7) continue;   // font-face, keyframes
        const t = r.cssText; if (!t || !r.style || !/#|rgb/.test(t)) continue;
        // صرف وہی خصوصیات جن کا رنگ بدلا — باقی (چوڑائی وغیرہ) کو نہ چھیڑیں
        const decl = [];
        for (let i = 0; i < r.style.length; i++) {
          const pr = r.style[i], v = r.style.getPropertyValue(pr); if (!v || !/#|rgb/.test(v)) continue;
          const nv = recolor(v); if (nv !== v) decl.push(`${pr}:${nv}${r.style.getPropertyPriority(pr) ? ' !important' : ''}`);
        }
        if (decl.length) out.push(`${wrapOpen}${r.selectorText}{${decl.join(';')}}${wrapClose}`);
      }
    };
    for (const sh of document.styleSheets) {
      if (sh.ownerNode && sh.ownerNode.id === 'maLookOv') continue;
      let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      if (rules) walk(rules, '', '');
    }
    return out.join('\n');
  }
  // جاوا اسکرپٹ سے لگے ہوئے رنگ (style="...") بھی بدلیں
  function fixInline(root) {
    if (L.theme === 'green' && !L.light) return;
    (root.querySelectorAll ? root.querySelectorAll('[style]') : []).forEach(el => {
      if (el.dataset.maLk) return;
      const s = el.getAttribute('style'); if (!/#|rgb/.test(s)) return;
      const n = recolor(s); if (n !== s) { el.dataset.maLk = '1'; el.setAttribute('style', n); }
    });
  }
  let mo = null;
  function applyColors() {
    if (ovEl) { ovEl.remove(); ovEl = null; }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && !meta.dataset.orig) meta.dataset.orig = meta.content;
    if (L.theme === 'green' && !L.light) { if (meta) meta.content = meta.dataset.orig; if (mo) { mo.disconnect(); mo = null; } return; }
    ovEl = document.createElement('style'); ovEl.id = 'maLookOv';
    ovEl.textContent = buildOverride();
    document.head.appendChild(ovEl);
    if (meta) meta.content = recolor(meta.dataset.orig);
    fixInline(document);
    if (!mo) { mo = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.hasAttribute && n.hasAttribute('style')) fixInline({ querySelectorAll: () => [n] }); fixInline(n); } }))); mo.observe(document.body, { childList: true, subtree: true }); }
  }

  // ---------- فونٹ، سائز، موٹائی ----------
  let fEl = null;
  async function applyText() {
    if (!fEl) { fEl = document.createElement('style'); fEl.id = 'maLookFont'; }
    document.head.appendChild(fEl);   // ہمیشہ سب سے آخر میں
    const k = L.font in FONTS ? L.font : 'noori';
    if (k !== 'noori') await loadFont(k);
    const st = stack(k);
    const z = Math.max(80, Math.min(130, L.size || 100)) / 100;
    const b = Math.max(0, Math.min(3, L.bold || 0));
    fEl.textContent =
      (k !== 'noori' ? `:root{--f:${st};--f-body:${st}}body,button,input,select,textarea,.door .txt b,.door .txt small{font-family:${st}}\n` : '') +
      (z !== 1 ? `body > .wrap,body > main{zoom:${z}}\n` : '') +
      (b ? `body > .wrap,body > main,.sheet,.pv{-webkit-text-stroke:${(b * .15).toFixed(2)}px currentColor}\n` : '');
  }
  function apply() { applyColors(); applyText(); }

  // ---------- ترتیب کا خانہ ----------
  function open() {
    document.getElementById('maLookBox')?.remove();
    const w = document.createElement('div'); w.id = 'maLookBox';
    w.innerHTML = `<style>
      #maLookBox{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;direction:rtl;-webkit-text-stroke:0}
      #maLookBox .lk{width:min(560px,100%);max-height:92svh;overflow:auto;background:linear-gradient(180deg,#fffaf0,#f4e9cf);border:1.5px solid #e8c467;border-radius:22px 22px 0 0;padding:0 0 calc(env(safe-area-inset-bottom,0px) + 12px);color:#2b2620;font-family:"Digits","JNN",serif;box-shadow:0 -10px 30px rgba(0,0,0,.45)}
      #maLookBox .lk-h{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:linear-gradient(180deg,#0f3a30,#1f6a54);color:#fff1c1;font-size:19px;z-index:1}
      #maLookBox .lk-h button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(232,196,103,.5);background:rgba(255,255,255,.12);color:#fff1c1;font-size:16px;cursor:pointer}
      #maLookBox .lk-s{padding:8px 14px 4px}
      #maLookBox .lk-s > b{display:block;font-weight:400;font-size:15px;color:#7a5418;margin-bottom:4px}
      #maLookBox .lk-th{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
      #maLookBox .lk-th button{display:grid;justify-items:center;gap:2px;border:1.5px solid #e3cf98;background:#fff;border-radius:14px;padding:6px 2px 2px;font:inherit;font-size:13px;cursor:pointer;color:#2b2620}
      #maLookBox .lk-th button i{width:30px;height:30px;border-radius:50%;box-shadow:inset 0 -3px 6px rgba(0,0,0,.35),0 2px 4px rgba(0,0,0,.25)}
      #maLookBox .lk-th button.on{border-color:#a8741f;box-shadow:0 0 0 3px rgba(232,196,103,.6)}
      #maLookBox input[type=range]{width:100%;accent-color:#a8741f}
      #maLookBox .lk-r{display:flex;align-items:center;gap:8px;font-size:13px;color:#6b6250}
      #maLookBox .lk-r em{font:700 13px Arial,sans-serif;font-style:normal;color:#14463a;min-width:44px;text-align:center}
      #maLookBox .lk-f{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      #maLookBox .lk-f button{border:1.5px solid #e3cf98;background:#fff;border-radius:12px;padding:4px 8px;cursor:pointer;color:#2b2620;text-align:center;line-height:1.7}
      #maLookBox .lk-f button span{display:block;font-size:19px}
      #maLookBox .lk-f button small{display:block;font:11px Arial,sans-serif;color:#8a7d62}
      #maLookBox .lk-f button.on{border-color:#a8741f;background:#fff8e3;box-shadow:0 0 0 3px rgba(232,196,103,.55)}
      #maLookBox .lk-a{display:flex;gap:8px;padding:10px 14px 0}
      #maLookBox .lk-a button{flex:1;min-height:42px;border-radius:99px;border:1px solid #a8741f;background:linear-gradient(180deg,#fff6d5,#f1d27a 45%,#c8962f);font:inherit;font-size:16px;color:#2b1d05;cursor:pointer}
      #maLookBox .lk-a button.gh{background:#fff;border-color:#e3cf98;color:#14463a}
    </style>
    <div class="lk" role="dialog" aria-modal="true" aria-label="رنگ اور فونٹ">
      <div class="lk-h"><span>🎨 ایپ کا رنگ اور فونٹ</span><button type="button" data-x aria-label="بند کریں">✕</button></div>
      <div class="lk-s"><b>ایپ کا رنگ</b><div class="lk-th">${Object.entries(THEMES).map(([k, t]) => `<button type="button" data-th="${k}" class="${L.theme === k ? 'on' : ''}"><i style="background:linear-gradient(180deg,${t.sw},#000 140%)" data-ma-lk="1"></i>${t.n}</button>`).join('')}</div></div>
      <div class="lk-s"><b>رنگ ہلکا یا گہرا</b><div class="lk-r"><span>گہرا</span><input type="range" min="-30" max="30" step="2" id="lkLight" value="${L.light}"><span>ہلکا</span><em id="lkLightV">${L.light > 0 ? '+' : ''}${L.light}</em></div></div>
      <div class="lk-s"><b>لکھائی کا سائز</b><div class="lk-r"><span>چھوٹا</span><input type="range" min="85" max="125" step="5" id="lkSize" value="${L.size}"><span>بڑا</span><em id="lkSizeV">${L.size}%</em></div></div>
      <div class="lk-s"><b>لکھائی موٹی یا باریک</b><div class="lk-r"><span>باریک</span><input type="range" min="0" max="3" step="1" id="lkBold" value="${L.bold}"><span>موٹی</span><em id="lkBoldV">${L.bold}</em></div></div>
      <div class="lk-s"><b>فونٹ (پوری ایپ کی اردو لکھائی)</b><div class="lk-f">${Object.entries(FONTS).map(([k, f]) => `<button type="button" data-f="${k}" class="${L.font === k ? 'on' : ''}"><span style="font-family:${stack(k)}">${f.n}</span><small>${f.url ? 'پہلی بار ڈاؤن لوڈ ہوگا' : 'فون میں موجود'}</small></button>`).join('')}</div></div>
      <div class="lk-a"><button type="button" data-ok>ٹھیک ہے</button><button type="button" class="gh" data-reset>پہلے جیسا</button></div>
    </div>`;
    document.body.appendChild(w);
    // فونٹ کے نمونے دکھانے کے لیے (ہلکے فونٹ فوراً)
    Object.keys(FONTS).forEach(k => { if (FONTS[k].url && k !== 'kasheeda') loadFont(k); });
    let tmr = null;
    const live = () => { clearTimeout(tmr); tmr = setTimeout(() => { save(); apply(); }, 120); };
    w.addEventListener('click', e => {
      if (e.target === w || e.target.closest('[data-x]') || e.target.closest('[data-ok]')) { save(); w.remove(); return; }
      if (e.target.closest('[data-reset]')) { L = Object.assign({}, DEF); save(); apply(); w.remove(); open(); return; }
      const th = e.target.closest('[data-th]'); if (th) { L.theme = th.dataset.th; w.querySelectorAll('[data-th]').forEach(b => b.classList.toggle('on', b === th)); live(); return; }
      const f = e.target.closest('[data-f]'); if (f) { L.font = f.dataset.f; w.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('on', b === f)); if (f.dataset.f === 'kasheeda') f.querySelector('small').textContent = 'ڈاؤن لوڈ ہو رہا ہے…'; live(); return; }
    });
    w.querySelector('#lkLight').addEventListener('input', e => { L.light = +e.target.value; w.querySelector('#lkLightV').textContent = (L.light > 0 ? '+' : '') + L.light; live(); });
    w.querySelector('#lkSize').addEventListener('input', e => { L.size = +e.target.value; w.querySelector('#lkSizeV').textContent = L.size + '%'; live(); });
    w.querySelector('#lkBold').addEventListener('input', e => { L.bold = +e.target.value; w.querySelector('#lkBoldV').textContent = L.bold; live(); });
  }

  window.MA_LOOK = { open, apply, loadFont, fonts: FONTS, stack, get: () => Object.assign({}, L) };
  // بٹن: data-look والا کوئی بھی بٹن خانہ کھولے
  document.addEventListener('click', e => { if (e.target.closest('[data-look]')) open(); });
  const start = () => apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('load', () => { if (L.theme !== 'green' || L.light) applyColors(); });
})();
