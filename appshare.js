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
    // پوسٹر + پیغام ایک ساتھ؛ پوسٹر نہ جا سکے تو صرف پیغام
    try { if (window.MA_PROMO && window.MA_PROMO.quickShare && await window.MA_PROMO.quickShare(MSG)) return; } catch (e) {}
    try { if (navigator.share) { await navigator.share({ title: 'میرا مکتبہ', text: MSG }); return; } }
    catch (e) { if (e && e.name === 'AbortError') return; }
    location.href = 'https://wa.me/?text=' + encodeURIComponent(MSG);
  }
  window.MA_APPSHARE = shareApp;
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-appshare]')) { e.preventDefault(); shareApp(); } });
})();
