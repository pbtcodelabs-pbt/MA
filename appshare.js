/* ===== AppShareKit — سب ایپس میں یکساں «ایپ شیئر کریں»: پوسٹر کی تصویر + پیغام + ویب/پلے اسٹور لنک =====
   فیس بک/ٹیلی گرام/واٹس ایپ کے ویب لنک تصویر نہیں لے جا سکتے، اس لیے ہر بٹن فون کی شیئر فہرست تصویر کے ساتھ
   کھولتا ہے (وہاں وہی ایپ چنیں)؛ پیغام کاپی ہو جاتا ہے (فیس بک لکھا ہوا متن خود نہیں لیتا — پیسٹ کریں)۔
   AppShareKit.open({title, caption, file, build: async()=>canvas|blob, lang:'ur'|'en', playUrl, webUrl})
   AppShareKit.poster({title, subtitle, lines:[], badge, footer, icon, c1, c2}) → canvas (سادہ پوسٹر جن ایپس میں اپنا نہیں) */
(function(){
  if(window.AppShareKit) return;
  const T = {
    ur:{h:'📤 ایپ شیئر کریں', any:'📤 کسی بھی ایپ پر (تصویر کے ساتھ)', wa:'واٹس ایپ', fb:'فیس بک', tg:'ٹیلی گرام', save:'📥 تصویر محفوظ', copy:'📋 پیغام کاپی', sms:'✉️ SMS',
        note:'تصویر ساتھ جاتی ہے؛ پیغام اور لنک خود کاپی ہو جاتے ہیں — فیس بک میں پیسٹ کر دیں', close:'بند', making:'پوسٹر بن رہا ہے...',
        pick:n=>'👉 فہرست میں «'+n+'» چنیں — تصویر ساتھ جائے گی؛ پیغام کاپی ہو چکا، وہاں پیسٹ کریں', saved:'📥 تصویر فون میں محفوظ ہو گئی', copied:'📋 پیغام اور لنک کاپی ہو گیا',
        fallback:n=>'یہ فون تصویر سیدھی نہیں بھیج سکتا۔\n\n📥 تصویر گیلری میں محفوظ ہو گئی ہے اور 📋 پیغام کاپی ہو گیا ہے۔\n'+n+' کھلنے پر تصویر لگائیں اور پیغام پیسٹ کریں۔', anyName:'جس ایپ پر بھیجنا ہو'},
    en:{h:'📤 Share this app', any:'📤 Share to any app (with picture)', wa:'WhatsApp', fb:'Facebook', tg:'Telegram', save:'📥 Save picture', copy:'📋 Copy message', sms:'✉️ SMS',
        note:'The picture goes with it; message + links are copied — paste them on Facebook', close:'Close', making:'Preparing poster...',
        pick:n=>'👉 Choose «'+n+'» in the list — the picture goes with it; message copied, paste it there', saved:'📥 Picture saved to phone', copied:'📋 Message and link copied',
        fallback:n=>'This phone cannot share the picture directly.\n\n📥 Picture saved to gallery and 📋 message copied.\nWhen '+n+' opens, attach the picture and paste the message.', anyName:'the app you want'}
  };
  const CSS = `.ask-ov{position:fixed;inset:0;z-index:2147483600;background:rgba(8,20,40,.55);display:none;align-items:flex-end;justify-content:center;}
.ask-ov.show{display:flex;}
.ask-box{width:min(460px,100%);background:#fff;border-radius:22px 22px 0 0;padding:14px 14px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 30px rgba(0,0,0,.3);animation:askUp .25s ease;font-family:inherit;}
@keyframes askUp{from{transform:translateY(100%)}to{transform:none}}
.ask-h{display:flex;align-items:center;justify-content:space-between;font-size:17px;font-weight:800;color:#0b2a44;margin-bottom:8px;}
.ask-h button{border:none;background:#f1f5f9;border-radius:10px;padding:5px 12px;font-weight:800;font-family:inherit;color:#334155;}
.ask-prev{display:flex;justify-content:center;margin:2px 0 10px;min-height:60px;}
.ask-prev img{max-height:30vh;max-width:100%;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.25);}
.ask-any{width:100%;min-height:50px;border:none;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:16px;font-weight:800;font-family:inherit;margin-bottom:8px;}
.ask-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.ask-grid button{min-height:46px;border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;font-family:inherit;}
.ask-note{font-size:12px;color:#5b6b7a;text-align:center;margin-top:8px;line-height:1.7;}`;
  let st = null;
  function css(){ if(document.getElementById('askCss')) return; const s=document.createElement('style'); s.id='askCss'; s.textContent=CSS; document.head.appendChild(s); }
  function toast(m, ms){ try{ if(typeof showToast==='function') return showToast(m, ms); }catch(e){} }
  function copy(t){ try{ navigator.clipboard && navigator.clipboard.writeText(t).catch(()=>{}); }catch(e){} }
  function save(blob, name){ try{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }catch(e){} }
  async function toBlob(x){ if(!x) return null; if(x instanceof Blob) return x; return await new Promise(r=> x.toBlob(r,'image/png')); }
  async function ensure(){ if(st.blob) return st.blob; if(!st.p) st.p = (async()=>{ try{ st.blob = await toBlob(await st.build()); }catch(e){ st.blob = null; } return st.blob; })(); return st.p; }
  async function go(target){
    const L = T[st.lang], names = {wa:L.wa, fb:L.fb, tg:L.tg, any:L.anyName};
    copy(st.caption);
    if(target==='copy'){ toast(L.copied); return; }
    if(target==='sms'){ location.href = 'sms:?body=' + encodeURIComponent(st.caption); return; }
    let blob = st.blob; if(!blob){ toast(L.making); blob = await ensure(); }
    if(target==='save'){ if(blob){ save(blob, st.file); toast(L.saved, 2500); } return; }
    const file = blob ? new File([blob], st.file, {type:'image/png'}) : null;
    if(file && navigator.canShare && navigator.canShare({files:[file]})){
      toast(L.pick(names[target]), 5000);
      try{ await navigator.share({files:[file], text: st.caption, title: st.title}); return; }catch(e){ if(e && e.name==='AbortError') return; }
    }
    if(blob) save(blob, st.file);
    const u = encodeURIComponent(st.playUrl || st.webUrl || ''), t = encodeURIComponent(st.caption);
    const url = target==='fb' ? 'https://www.facebook.com/sharer/sharer.php?u=' + u : target==='tg' ? 'https://t.me/share/url?url=' + u + '&text=' + t : 'https://wa.me/?text=' + t;
    alert(L.fallback(names[target]||'')); window.open(url, '_blank');
  }
  function linkOf(re, t){ const m = String(t||'').match(re); return m ? m[0] : ''; }
  window.AppShareKit = {
    open(o){
      css();
      st = {title:o.title||'', caption:o.caption||'', file:o.file||'app.png', build:o.build, lang:o.lang==='en'?'en':'ur', blob:null, p:null,
            playUrl:o.playUrl || linkOf(/https:\/\/play\.google\.com\/\S+/, o.caption), webUrl:o.webUrl || linkOf(/https?:\/\/\S+/, o.caption)};
      const L = T[st.lang];
      let ov = document.getElementById('askOv');
      if(!ov){ ov = document.createElement('div'); ov.id='askOv'; ov.className='ask-ov'; document.body.appendChild(ov); ov.addEventListener('click', e=>{ if(e.target===ov) ov.classList.remove('show'); }); }
      ov.setAttribute('dir', st.lang==='en' ? 'ltr' : 'rtl');
      ov.innerHTML = `<div class="ask-box"><div class="ask-h"><span>${L.h}</span><button type="button" data-a="close">${L.close}</button></div>
        <div class="ask-prev">⏳</div>
        <button type="button" class="ask-any" data-a="any">${L.any}</button>
        <div class="ask-grid">
          <button type="button" data-a="wa" style="background:#16a34a">${L.wa}</button>
          <button type="button" data-a="fb" style="background:#1877f2">${L.fb}</button>
          <button type="button" data-a="tg" style="background:#229ed9">${L.tg}</button>
          <button type="button" data-a="save" style="background:#7c3aed">${L.save}</button>
          <button type="button" data-a="copy" style="background:#0f766e">${L.copy}</button>
          <button type="button" data-a="sms" style="background:#475569">${L.sms}</button>
        </div><div class="ask-note">${L.note}</div></div>`;
      ov.querySelectorAll('[data-a]').forEach(b=> b.onclick = ()=>{ const a = b.dataset.a; if(a==='close'){ ov.classList.remove('show'); return; } go(a); });
      ov.classList.add('show');
      ensure().then(blob=>{ const pv = ov.querySelector('.ask-prev'); if(pv) pv.innerHTML = blob ? `<img alt="" src="${URL.createObjectURL(blob)}">` : ''; });
    },
    /* سادہ مگر خوبصورت پوسٹر — جن ایپس کا اپنا پوسٹر نہیں */
    async poster(o){
      const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      const font = o.font || "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif";
      try{ await document.fonts.load('700 48px ' + font); }catch(e){}
      const g = x.createLinearGradient(0,0,0,H); g.addColorStop(0, o.c1||'#0d3b66'); g.addColorStop(1, o.c2||'#0f766e'); x.fillStyle = g; x.fillRect(0,0,W,H);
      x.strokeStyle = 'rgba(255,215,120,.9)'; x.lineWidth = 10; x.strokeRect(30,30,W-60,H-60);
      let y = 90;
      if(o.icon){ try{ const im = await new Promise((res,rej)=>{ const i = new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=o.icon; }); x.save(); x.beginPath(); x.arc(W/2, y+110, 110, 0, Math.PI*2); x.closePath(); x.fillStyle='#fff'; x.fill(); x.clip(); x.drawImage(im, W/2-100, y+10, 200, 200); x.restore(); y += 250; }catch(e){} }
      x.textAlign = 'center'; x.direction = 'rtl';
      x.fillStyle = '#ffe08a'; x.font = `700 92px ${font}`; x.fillText(o.title||'', W/2, y+70); y += 130;
      if(o.subtitle){ x.fillStyle = '#ffffff'; x.font = `600 46px ${font}`; x.fillText(o.subtitle, W/2, y+30); y += 90; }
      if(o.badge){ x.fillStyle = '#16a34a'; const bw = Math.min(W-200, x.measureText(o.badge).width + 120); x.beginPath(); x.roundRect ? x.roundRect(W/2-bw/2, y, bw, 80, 40) : x.rect(W/2-bw/2, y, bw, 80); x.fill(); x.fillStyle = '#fff'; x.font = `700 42px ${font}`; x.fillText(o.badge, W/2, y+55); y += 120; }
      x.textAlign = 'right'; x.fillStyle = '#ffffff'; x.font = `500 44px ${font}`;
      (o.lines||[]).slice(0,7).forEach(l=>{ x.fillText('✔ ' + l, W-90, y+40); y += 82; });
      x.textAlign = 'center';
      x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.roundRect ? x.roundRect(120, H-230, W-240, 140, 30) : x.rect(120, H-230, W-240, 140); x.fill();
      x.fillStyle = '#0b2a44'; x.font = `700 44px ${font}`; x.fillText(o.footer||'', W/2, H-170);
      x.direction = 'ltr'; x.font = '700 34px Arial,sans-serif'; x.fillText(o.footer2||'', W/2, H-115);
      return c;
    }
  };
})();

/* میرا مکتبہ — «یہ ایپ دوسروں کو بھیجیں»: ایک ٹچ والے انسٹال صفحے کا لنک پیغام کے ساتھ (واٹس ایپ وغیرہ) */
(function () {
  const LINK = 'https://pbtcodelabs-pbt.github.io/MA/get.html';
  const MSG = `السلام علیکم!
*میرا مکتبہ* — ڈیجیٹل لائبریری، ڈیجیٹل ڈائری اور مصروفیات، تینوں ایک ایپ میں۔
علمائے کرام، طلبائے کرام اور کتاب سے محبت کرنے والوں کے لیے۔

🎁 3 دن فری استعمال کریں۔
📲 نیچے والا لنک کھولیں اور سبز بٹن «ایک ٹچ میں انسٹال کریں» دبائیں:
${LINK}`;
  async function shareApp() {
    // پوسٹر کی تصویر ہر بٹن سے ساتھ (واٹس ایپ، فیس بک، ٹیلی گرام…)، پیغام اور لنک کاپی
    if (window.AppShareKit && window.MA_PROMO && window.MA_PROMO.poster) {
      window.AppShareKit.open({ title: 'میرا مکتبہ', caption: MSG, file: 'mera-maktaba.png', lang: 'ur', webUrl: LINK, build: () => window.MA_PROMO.poster() });
      return;
    }
    try { if (navigator.share) { await navigator.share({ title: 'میرا مکتبہ', text: MSG }); return; } }
    catch (e) { if (e && e.name === 'AbortError') return; }
    location.href = 'https://wa.me/?text=' + encodeURIComponent(MSG);
  }
  window.MA_APPSHARE = shareApp;
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-appshare]')) { e.preventDefault(); shareApp(); } });
})();
