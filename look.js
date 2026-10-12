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
      #maLookBox{position:fixed;left:0;right:0;bottom:0;z-index:9500;display:flex;justify-content:center;direction:rtl;-webkit-text-stroke:0;pointer-events:none}
      #maLookBox .lk{pointer-events:auto;width:min(560px,100%);max-height:44svh;overflow:auto;background:rgba(255,250,240,.97);border:1.5px solid #e8c467;border-radius:20px 20px 0 0;padding:0 0 calc(env(safe-area-inset-bottom,0px) + 8px);color:#2b2620;font-family:"Digits","JNN",serif;box-shadow:0 -8px 24px rgba(0,0,0,.35)}
      #maLookBox .lk-h{position:sticky;top:0;display:flex;align-items:center;gap:8px;padding:5px 10px;background:linear-gradient(180deg,#0f3a30,#1f6a54);color:#fff1c1;font-size:15px;z-index:1}
      #maLookBox .lk-h span{flex:1}
      #maLookBox .lk-h button{border-radius:99px;border:1px solid rgba(232,196,103,.6);background:rgba(255,255,255,.12);color:#fff1c1;font:inherit;font-size:13px;padding:0 12px;min-height:30px;cursor:pointer}
      #maLookBox .lk-h button.ok{background:linear-gradient(180deg,#fff6d5,#f1d27a 45%,#c8962f);color:#2b1d05;border-color:#a8741f}
      #maLookBox .lk-row{display:flex;align-items:center;gap:6px;padding:5px 10px 0;overflow-x:auto;scrollbar-width:none;white-space:nowrap}
      #maLookBox .lk-row::-webkit-scrollbar{display:none}
      #maLookBox .lk-row > b{flex:none;font-weight:400;font-size:12.5px;color:#7a5418;min-width:42px}
      #maLookBox .lk-th button{flex:none;display:grid;justify-items:center;gap:0;border:0;background:none;padding:0 2px;font:inherit;font-size:11.5px;cursor:pointer;color:#2b2620;line-height:1.5}
      #maLookBox .lk-th button i{width:30px;height:30px;border-radius:50%;box-shadow:inset 0 -3px 6px rgba(0,0,0,.35),0 2px 3px rgba(0,0,0,.25);border:2px solid #fff}
      #maLookBox .lk-th button.on i{border-color:#c8962f;box-shadow:0 0 0 3px rgba(232,196,103,.75),inset 0 -3px 6px rgba(0,0,0,.35)}
      #maLookBox input[type=range]{flex:1;min-width:120px;accent-color:#a8741f;height:22px}
      #maLookBox .lk-row small{flex:none;font-size:11.5px;color:#6b6250}
      #maLookBox .lk-row em{flex:none;font:700 12px Arial,sans-serif;font-style:normal;color:#14463a;min-width:38px;text-align:center}
      #maLookBox .lk-f button{flex:none;border:1.5px solid #e3cf98;background:#fff;border-radius:99px;padding:0 12px;min-height:34px;cursor:pointer;color:#2b2620;font-size:17px;line-height:1.6}
      #maLookBox .lk-f button.on{border-color:#a8741f;background:#fff3cf;box-shadow:0 0 0 2px rgba(232,196,103,.7)}
      #maLookBox .lk-f button.wait{opacity:.6}
    </style>
    <div class="lk" role="dialog" aria-label="رنگ اور فونٹ">
      <div class="lk-h"><span>🎨 رنگ و فونٹ — پیچھے ایپ میں فوراً دیکھیں</span><button type="button" data-reset>پہلے جیسا</button><button type="button" class="ok" data-ok>✓ ٹھیک ہے</button></div>
      <div class="lk-row lk-th"><b>رنگ</b>${Object.entries(THEMES).map(([k, t]) => `<button type="button" data-th="${k}" class="${L.theme === k ? 'on' : ''}"><i style="background:linear-gradient(180deg,${t.sw},#000 140%)" data-ma-lk="1"></i>${t.n}</button>`).join('')}</div>
      <div class="lk-row"><b>روشنی</b><small>گہرا</small><input type="range" min="-30" max="30" step="2" id="lkLight" value="${L.light}"><small>ہلکا</small><em id="lkLightV">${L.light > 0 ? '+' : ''}${L.light}</em></div>
      <div class="lk-row"><b>سائز</b><small>چھوٹا</small><input type="range" min="85" max="125" step="5" id="lkSize" value="${L.size}"><small>بڑا</small><em id="lkSizeV">${L.size}%</em></div>
      <div class="lk-row"><b>موٹائی</b><small>باریک</small><input type="range" min="0" max="3" step="1" id="lkBold" value="${L.bold}"><small>موٹی</small><em id="lkBoldV">${L.bold}</em></div>
      <div class="lk-row lk-f"><b>فونٹ</b>${Object.entries(FONTS).map(([k, f]) => `<button type="button" data-f="${k}" class="${L.font === k ? 'on' : ''}" style="font-family:${stack(k)}">${f.n}</button>`).join('')}</div>
    </div>`;
    document.body.appendChild(w);
    // فونٹ کے نمونے دکھانے کے لیے (ہلکے فونٹ فوراً)
    Object.keys(FONTS).forEach(k => { if (FONTS[k].url && k !== 'kasheeda') loadFont(k); });
    let tmr = null;
    const live = () => { clearTimeout(tmr); tmr = setTimeout(() => { save(); apply(); }, 120); };
    w.addEventListener('click', e => {
      if (e.target.closest('[data-x]') || e.target.closest('[data-ok]')) { save(); w.remove(); return; }
      if (e.target.closest('[data-reset]')) { L = Object.assign({}, DEF); save(); apply(); w.remove(); open(); return; }
      const th = e.target.closest('[data-th]'); if (th) { L.theme = th.dataset.th; w.querySelectorAll('[data-th]').forEach(b => b.classList.toggle('on', b === th)); live(); return; }
      const f = e.target.closest('[data-f]'); if (f) { L.font = f.dataset.f; w.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('on', b === f)); if (FONTS[f.dataset.f].url) { f.classList.add('wait'); loadFont(f.dataset.f).then(() => f.classList.remove('wait')); } live(); return; }
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
