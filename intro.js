/* MA1111WE157 (مالک کا حکم): لاگ اِن صفحے پر «🎬 تعارفی ویڈیو» — ویڈیو ہیلپ ڈیسک کی help/media/maktaba-ur.mp4 (بغیر موسیقی)؛
   ⬇️ ڈاؤن لوڈ، 📤 شیئر (ویڈیو پہلے لا کر یاد، پھر «ابھی شیئر کریں» — فون کی اجازت ختم نہ ہو) */
(function(){
  var SRC = 'https://pbtcodelabs-pbt.github.io/help/media/maktaba-ur.mp4', POS = 'https://pbtcodelabs-pbt.github.io/help/media/maktaba-ur.jpg', FILE = null;
  function open(){
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:rgba(3,20,16,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:12px;direction:rtl';
    o.innerHTML = '<video src="' + SRC + '" poster="' + POS + '" controls autoplay playsinline style="max-width:100%;max-height:74vh;border-radius:14px;border:2px solid #e9c97a;background:#000"></video>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">' +
      '<a style="background:#e9c97a;color:#14463a;border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:16px;font-family:inherit;min-height:44px;text-decoration:none;display:inline-flex;align-items:center;cursor:pointer" href="' + SRC + '" download="Mera-Maktaba.mp4">⬇️ ڈاؤن لوڈ</a>' +
      '<button type="button" style="background:#e9c97a;color:#14463a;border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:16px;font-family:inherit;min-height:44px;text-decoration:none;display:inline-flex;align-items:center;cursor:pointer" data-x="sh">📤 شیئر</button>' +
      '<button type="button" style="background:#e9c97a;color:#14463a;border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:16px;font-family:inherit;min-height:44px;text-decoration:none;display:inline-flex;align-items:center;cursor:pointer;background:transparent;color:#e9c97a;border:1.5px solid #e9c97a" data-x="x">✕ بند</button></div>';
    document.body.appendChild(o);
    o.addEventListener('click', function(e){
      var b = e.target.closest('[data-x]'); if (!b && e.target !== o) return;
      if (!b || b.dataset.x === 'x') { o.remove(); return; }
      if (FILE) { var d = { files: [FILE], title: 'میرا مکتبہ', text: 'میرا مکتبہ — پورا مکتبہ ایک ایپ میں\nhttps://pbtcodelabs-pbt.github.io/MA/get.html' };
        if (navigator.canShare && navigator.canShare(d)) navigator.share(d).catch(function(){}); else window.open(SRC, '_blank'); return; }
      b.textContent = '⏳ ویڈیو تیار ہو رہی ہے…';
      fetch(SRC).then(function(r){ return r.blob(); }).then(function(bl){ FILE = new File([bl], 'Mera-Maktaba.mp4', { type: 'video/mp4' }); b.textContent = '📤 ابھی شیئر کریں ✓'; })
        .catch(function(){ b.textContent = '📤 شیئر'; window.open(SRC, '_blank'); });
    });
  }
  window.maIntroVideo = open;
  document.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('[data-maintro]')) { e.preventDefault(); open(); } }, true);
})();
