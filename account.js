/* میرا مکتبہ — اکاؤنٹ: سائن اپ (نام، موبائل، ضلع) + پن + فنگر پرنٹ + MA ID + «پیکج منگوائیں»
   سبزی منڈی (SM ID) والا ہی نظام: مالک کا فون سرور (AIO worker /aioid، app MA) سے ایک ID (مثلاً MA48213) لیتا ہے؛
   ہیلپ ڈیسک میں یہ ID نام / موبائل / ضلع کے ساتھ نظر آتی ہے؛ مالک پیسے وصول کر کے پیکج لگاتا ہے؛
   یہ فون خود سرور سے پوچھتا ہے (/entclaim kind a) → پیکج خود چالو + 🎉۔ کوئی کوڈ نہیں۔
   پرانا کوڈ والا نظام (license.js) ویسا ہی چلتا ہے — یہ فائل اس کے اوپر صرف اضافہ ہے۔
   کلیدیں: maAccV1 (پروفائل + پن)، maIdV1 (ID + فون کی چابی + درخواست) */
(function () {
  'use strict';
  const W = 'https://aio-pos-verify.pbtcodelabs.workers.dev';
  const PK = 'maAccV1', IK = 'maIdV1', SK = 'maAccOk', LK = 'maAccLang', OK = 'maAccSort';

  // ---------- ضلعوں کی فہرست: [English, اردو] ----------
  const DIST = [
    // پنجاب
    ['Attock', 'اٹک'], ['Bahawalnagar', 'بہاولنگر'], ['Bahawalpur', 'بہاولپور'], ['Bhakkar', 'بھکر'], ['Chakwal', 'چکوال'], ['Chiniot', 'چنیوٹ'],
    ['Dera Ghazi Khan', 'ڈیرہ غازی خان'], ['Faisalabad', 'فیصل آباد'], ['Gujranwala', 'گوجرانوالہ'], ['Gujrat', 'گجرات'], ['Hafizabad', 'حافظ آباد'],
    ['Jhang', 'جھنگ'], ['Jhelum', 'جہلم'], ['Kasur', 'قصور'], ['Khanewal', 'خانیوال'], ['Khushab', 'خوشاب'], ['Kot Addu', 'کوٹ ادو'], ['Lahore', 'لاہور'],
    ['Layyah', 'لیہ'], ['Lodhran', 'لودھراں'], ['Mandi Bahauddin', 'منڈی بہاؤالدین'], ['Mianwali', 'میانوالی'], ['Multan', 'ملتان'], ['Murree', 'مری'],
    ['Muzaffargarh', 'مظفرگڑھ'], ['Nankana Sahib', 'ننکانہ صاحب'], ['Narowal', 'نارووال'], ['Okara', 'اوکاڑہ'], ['Pakpattan', 'پاکپتن'],
    ['Rahim Yar Khan', 'رحیم یار خان'], ['Rajanpur', 'راجن پور'], ['Rawalpindi', 'راولپنڈی'], ['Sahiwal', 'ساہیوال'], ['Sargodha', 'سرگودھا'],
    ['Sheikhupura', 'شیخوپورہ'], ['Sialkot', 'سیالکوٹ'], ['Talagang', 'تلہ گنگ'], ['Taunsa', 'تونسہ'], ['Toba Tek Singh', 'ٹوبہ ٹیک سنگھ'],
    ['Vehari', 'وہاڑی'], ['Wazirabad', 'وزیرآباد'],
    // سندھ
    ['Badin', 'بدین'], ['Dadu', 'دادو'], ['Ghotki', 'گھوٹکی'], ['Hyderabad', 'حیدرآباد'], ['Jacobabad', 'جیکب آباد'], ['Jamshoro', 'جامشورو'],
    ['Kashmore', 'کشمور'], ['Keamari', 'کیماڑی'], ['Khairpur', 'خیرپور'], ['Korangi', 'کورنگی'], ['Karachi Central', 'کراچی سینٹرل'], ['Karachi East', 'کراچی ایسٹ'],
    ['Karachi South', 'کراچی ساؤتھ'], ['Karachi West', 'کراچی ویسٹ'], ['Larkana', 'لاڑکانہ'], ['Malir', 'ملیر'], ['Matiari', 'مٹیاری'], ['Mirpur Khas', 'میرپور خاص'],
    ['Naushahro Feroze', 'نوشہرو فیروز'], ['Qambar Shahdadkot', 'قمبر شہداد کوٹ'], ['Sanghar', 'سانگھڑ'], ['Shaheed Benazirabad', 'شہید بینظیر آباد'],
    ['Shikarpur', 'شکارپور'], ['Sujawal', 'سجاول'], ['Sukkur', 'سکھر'], ['Tando Allahyar', 'ٹنڈو اللہ یار'], ['Tando Muhammad Khan', 'ٹنڈو محمد خان'],
    ['Tharparkar', 'تھرپارکر'], ['Thatta', 'ٹھٹھہ'], ['Umerkot', 'عمرکوٹ'],
    // خیبر پختونخوا
    ['Abbottabad', 'ایبٹ آباد'], ['Bajaur', 'باجوڑ'], ['Bannu', 'بنوں'], ['Battagram', 'بٹگرام'], ['Buner', 'بونیر'], ['Charsadda', 'چارسدہ'], ['Chitral', 'چترال'],
    ['Dera Ismail Khan', 'ڈیرہ اسماعیل خان'], ['Hangu', 'ہنگو'], ['Haripur', 'ہری پور'], ['Karak', 'کرک'], ['Khyber', 'خیبر'], ['Kohat', 'کوہاٹ'],
    ['Kolai Palas', 'کولئی پالس'], ['Kurram', 'کرم'], ['Lakki Marwat', 'لکی مروت'], ['Lower Dir', 'لوئر دیر'], ['Lower Kohistan', 'لوئر کوہستان'],
    ['Malakand', 'ملاکنڈ'], ['Mansehra', 'مانسہرہ'], ['Mardan', 'مردان'], ['Mohmand', 'مہمند'], ['North Waziristan', 'شمالی وزیرستان'], ['Nowshera', 'نوشہرہ'],
    ['Orakzai', 'اورکزئی'], ['Peshawar', 'پشاور'], ['Shangla', 'شانگلہ'], ['South Waziristan', 'جنوبی وزیرستان'], ['Swabi', 'صوابی'], ['Swat', 'سوات'],
    ['Tank', 'ٹانک'], ['Torghar', 'تورغر'], ['Upper Dir', 'اپر دیر'], ['Upper Kohistan', 'اپر کوہستان'],
    // بلوچستان
    ['Awaran', 'آواران'], ['Barkhan', 'بارکھان'], ['Chagai', 'چاغی'], ['Chaman', 'چمن'], ['Dera Bugti', 'ڈیرہ بگٹی'], ['Duki', 'ڈوکی'], ['Gwadar', 'گوادر'],
    ['Harnai', 'ہرنائی'], ['Jafarabad', 'جعفرآباد'], ['Jhal Magsi', 'جھل مگسی'], ['Kachhi', 'کچھی (بولان)'], ['Kalat', 'قلات'], ['Kech', 'کیچ (تربت)'],
    ['Kharan', 'خاران'], ['Khuzdar', 'خضدار'], ['Killa Abdullah', 'قلعہ عبداللہ'], ['Killa Saifullah', 'قلعہ سیف اللہ'], ['Kohlu', 'کوہلو'], ['Lasbela', 'لسبیلہ'],
    ['Lehri', 'لہڑی'], ['Loralai', 'لورالائی'], ['Mastung', 'مستونگ'], ['Musakhel', 'موسیٰ خیل'], ['Nasirabad', 'نصیرآباد'], ['Nushki', 'نوشکی'],
    ['Panjgur', 'پنجگور'], ['Pishin', 'پشین'], ['Quetta', 'کوئٹہ'], ['Sherani', 'شیرانی'], ['Sibi', 'سبی'], ['Sohbatpur', 'صحبت پور'], ['Surab', 'سوراب'],
    ['Usta Muhammad', 'اوستہ محمد'], ['Washuk', 'واشک'], ['Zhob', 'ژوب'], ['Ziarat', 'زیارت'],
    // اسلام آباد
    ['Islamabad', 'اسلام آباد'],
    // آزاد کشمیر
    ['Bagh', 'باغ'], ['Bhimber', 'بھمبر'], ['Haveli', 'حویلی'], ['Hattian Bala', 'ہٹیاں بالا'], ['Kotli', 'کوٹلی'], ['Mirpur', 'میرپور'],
    ['Muzaffarabad', 'مظفرآباد'], ['Neelum', 'نیلم'], ['Poonch (Rawalakot)', 'پونچھ (راولاکوٹ)'], ['Sudhnoti', 'سدھنوتی'],
    // گلگت بلتستان
    ['Astore', 'استور'], ['Diamer', 'دیامر'], ['Ghanche', 'غانچے'], ['Ghizer', 'غذر'], ['Gilgit', 'گلگت'], ['Hunza', 'ہنزہ'], ['Kharmang', 'کھرمنگ'],
    ['Nagar', 'نگر'], ['Shigar', 'شگر'], ['Skardu', 'سکردو']
  ];
  const OTHER = ['Other', 'دیگر'];

  // ---------- چھوٹے اوزار ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (r, s) => r.querySelector(s);
  let memStore = {};
  const lget = k => { try { return localStorage.getItem(k); } catch (e) { return memStore[k] || null; } };
  const lset = (k, v) => { memStore[k] = v; try { localStorage.setItem(k, v); } catch (e) {} };
  const sget = k => { try { return sessionStorage.getItem(k); } catch (e) { return memStore['s' + k] || null; } };
  const sset = (k, v) => { memStore['s' + k] = v; try { sessionStorage.setItem(k, v); } catch (e) {} };
  const jget = k => { try { return JSON.parse(lget(k) || 'null'); } catch (e) { return null; } };
  const jset = (k, v) => lset(k, JSON.stringify(v));
  const digits = s => String(s || '').replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).replace(/\D/g, '');
  const mob10 = s => { const d = digits(s); return d.length >= 10 ? d.slice(-10) : ''; };
  const mobOk = s => /^3\d{9}$/.test(mob10(s)) && digits(s).length <= 13;
  const mobShow = m => { const d = mob10(m); return d ? '0' + d.slice(0, 3) + '-' + d.slice(3) : ''; };
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dmy = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? `⁦${m[3]}-${m[2]}-${m[1]}⁩` : ''; };
  const toast = m => { try { window.MA_APP && window.MA_APP.toast(m); } catch (e) {} };
  async function sha(s) {
    try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
    catch (e) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return 'f' + h.toString(16); }
  }
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a.buffer; };

  const prof = () => { const p = jget(PK); return p && p.name && p.ph ? p : null; };
  const me = () => jget(IK) || {};
  const saveMe = m => jset(IK, m);

  // ---------- اسٹائل ----------
  const css = document.createElement('style');
  css.textContent = `
  #maAccOv{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(circle at 50% 24%,#1b7458 0%,#0e4a39 46%,#082a20 100%);color:#fff;display:grid;place-items:start center;padding:14px;overflow:auto;direction:rtl;box-sizing:border-box}
  #maAccOv *{box-sizing:border-box}
  .maa-box{width:100%;max-width:430px;display:grid;gap:9px;text-align:center;margin:auto;padding:8px 0}
  .maa-logo{width:92px;height:auto;margin:6px auto 0;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5))}
  .maa-k{margin:0;color:#e9c97a;font-family:var(--f-body,'JNN','Noto Nastaliq Urdu',serif);font-size:27px;line-height:2.05}
  .maa-p{margin:0;font-size:16px;line-height:2;color:#e7efe9}
  .maa-l{display:grid;gap:3px;text-align:start;font-size:15px;color:#f4de96;line-height:1.9}
  .maa-in{width:100%;border-radius:12px;border:1.5px solid #e9c97a;background:#fff;color:#14463a;padding:9px 11px;font:400 18px/1.6 inherit;font-family:inherit;min-height:46px}
  .maa-in.n{direction:ltr;text-align:center;font:700 20px/1.5 ui-monospace,Menlo,Consolas,monospace;letter-spacing:2px}
  .maa-in.need{border-color:#ff8a7a;box-shadow:0 0 0 3px rgba(255,120,100,.35)}
  .maa-dd{width:auto;min-width:0;max-width:250px;justify-self:center;direction:ltr;text-align:start;font-size:16px;padding:8px 8px}
  .maa-dd option{direction:ltr;text-align:start;font-size:15px}
  .maa-tg{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
  .maa-tg button{border:1.5px solid #e9c97a;background:rgba(255,255,255,.1);color:#fff1c1;border-radius:99px;padding:1px 12px;font:inherit;font-size:14px;line-height:2;cursor:pointer}
  .maa-tg button.on{background:linear-gradient(180deg,#fff6d5,#f1d27a 40%,#c8962f);color:#0b2e26;border-color:#8a5f16}
  .maa-b{background:#e9c97a;color:#14463a;border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:18px;line-height:1.5;font-family:inherit;min-height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;width:100%}
  .maa-b.g{background:transparent;color:#e9c97a;border:1.5px solid #e9c97a}
  .maa-b.ok{background:linear-gradient(180deg,#3fe07a,#16a34a 55%,#0f7a36);color:#fff}
  .maa-b:disabled{opacity:.6}
  .maa-lk{border:0;background:none;color:#f4de96;text-decoration:underline;font:inherit;font-size:15px;cursor:pointer;padding:2px}
  .maa-m{min-height:1.8em;font-size:15px;line-height:1.8;color:#ffd9a0}.maa-m.ok{color:#9be3b0}
  .maa-row{display:flex;gap:8px}.maa-row>*{flex:1}
  .maa-info{background:rgba(0,0,0,.22);border:1px dashed rgba(233,201,122,.7);border-radius:14px;padding:8px 12px;text-align:start;font-size:15px;line-height:2;color:#f3e6c2}
  .maa-info b{color:#fff}
  /* ID کی پٹی */
  .maIdCard{display:block;width:fit-content;max-width:100%;margin:6px auto;background:rgba(0,0,0,.25);border:1.5px solid #c9a84e;border-radius:10px;padding:3px 9px;text-align:center;color:#f4e8c0;direction:rtl}
  .maIdCard .r{display:flex;align-items:center;gap:6px;justify-content:center;flex-wrap:nowrap}
  .maIdCard .t{font-size:13px;font-weight:700;white-space:nowrap}
  .maIdCard b.i{font:900 18px/1.3 Arial,sans-serif;letter-spacing:1px;direction:ltr;color:#fff1c1}
  .maIdCard button{border:0;border-radius:8px;background:#e9c97a;color:#14463a;font:700 13px/1.4 inherit;font-family:inherit;padding:3px 9px;cursor:pointer;width:auto}
  .maIdCard button.o{background:transparent;color:#e9c97a;border:1.5px solid #e9c97a}
  .maIdCard .s{font-size:12px;color:#9be3b0;font-weight:700}
  .maPkg{border:2px solid #e9c97a;border-radius:14px;padding:8px 10px;background:rgba(0,0,0,.2);display:grid;gap:7px}
  .maPkg .h{font-size:19px;color:#f4de96;line-height:1.9}
  .maPkg .g4{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
  .maPkg .g4 button{border:2px solid #e9c97a;background:rgba(255,255,255,.1);color:#fff1c1;border-radius:12px;padding:5px;font:inherit;font-size:17px;line-height:1.8;cursor:pointer}
  .maPkg .g4 button.on{background:linear-gradient(180deg,#fff6d5,#f1d27a 40%,#c8962f);color:#0b2e26;border-color:#8a5f16}
  .maPkg .n{font-size:14px;line-height:1.9;color:#f3e6c2}
  `;
  document.head.appendChild(css);

  let ov = null;
  function show(html) {
    if (!ov) { ov = document.createElement('div'); ov.id = 'maAccOv'; document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden'; }
    ov.innerHTML = html; ov.scrollTop = 0;
  }
  function hide() { if (ov) { ov.remove(); ov = null; document.documentElement.style.overflow = ''; } }
  const head = (t, p) => `<img class="maa-logo" src="icons/app-badge.png" alt="میرا مکتبہ"><p class="maa-k">${t}</p>${p ? `<p class="maa-p">${p}</p>` : ''}`;

  // ---------- فنگر پرنٹ (فون کا اپنا — فنگر پرنٹ فون سے باہر نہیں جاتا) ----------
  async function bioSupported() { try { return !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e) { return false; } }
  async function bioEnable() {
    const p = prof(); if (!p) return false;
    try {
      const uid = crypto.getRandomValues(new Uint8Array(16));
      const cred = await navigator.credentials.create({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Mera Maktaba' },
        user: { id: uid, name: 'maktaba-' + mob10(p.mobile), displayName: p.name },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000, attestation: 'none'
      } });
      if (!cred) return false;
      p.bio = { id: b64(cred.rawId), at: Date.now() }; jset(PK, p); return true;
    } catch (e) { return false; }
  }
  async function bioCheck() {
    const p = prof(); if (!p || !p.bio) return false;
    try {
      const a = await navigator.credentials.get({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: unb64(p.bio.id), transports: ['internal'] }],
        userVerification: 'required', timeout: 60000
      } });
      return !!a;
    } catch (e) { return false; }
  }

  // ---------- ضلع کی فہرست (زبان + A→Z / Z→A) ----------
  function districtBlock(root, selEn) {
    let ord = lget(OK) === 'za' ? 'za' : 'az';
    const sel = $(root, '#maD');
    const fill = () => {
      const cur = sel.value || selEn || '';
      const L = DIST.map(d => ({ en: d[0], ur: d[1] })).sort((a, b) => a.en.localeCompare(b.en, 'en'));
      if (ord === 'za') L.reverse();
      sel.innerHTML = '<option value="">— Select / ضلع چنیں —</option>' +
        L.map(d => `<option value="${esc(d.en)}">${esc(d.en)} — ${esc(d.ur)}</option>`).join('') +
        `<option value="${OTHER[0]}">${OTHER[0]} — ${OTHER[1]}</option>`;
      sel.value = cur; if (sel.value !== cur) sel.value = '';
      root.querySelectorAll('[data-od]').forEach(b => b.classList.toggle('on', b.dataset.od === ord));
    };
    root.querySelectorAll('[data-od]').forEach(b => b.onclick = () => { ord = b.dataset.od; lset(OK, ord); fill(); });
    fill();
  }
  const districtHtml = `<div class="maa-l"><span>ضلع</span>
      <div class="maa-tg"><button type="button" data-od="az">A → Z</button><button type="button" data-od="za">Z → A</button></div>
      <select class="maa-in maa-dd" id="maD"></select></div>`;
  function districtLabel(en) {
    if (!en) return '';
    if (en === OTHER[0]) return OTHER[1] + ' (Other)';
    const d = DIST.find(x => x[0] === en); return d ? d[1] + ' (' + d[0] + ')' : en;
  }
  function districtWire(en) { if (!en) return ''; if (en === OTHER[0]) return 'Other · دیگر'; const d = DIST.find(x => x[0] === en); return d ? d[0] + ' · ' + d[1] : en; }

  // ---------- سائن اپ ----------
  function showSignup() {
    show(`<div class="maa-box">${head('نیا اکاؤنٹ', 'پہلی بار اپنی معلومات لکھیں — صرف ایک بار')}
      <label class="maa-l"><span>نام</span><input class="maa-in" id="maN" autocomplete="off" placeholder="اپنا نام لکھیں"></label>
      <label class="maa-l"><span>موبائل نمبر</span><input class="maa-in n" id="maM" inputmode="tel" autocomplete="off" placeholder="03XX-XXXXXXX" maxlength="15"></label>
      ${districtHtml}
      <label class="maa-l"><span>پن کوڈ (4 سے 6 ہندسے)</span><input class="maa-in n" id="maP" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="••••"></label>
      <label class="maa-l"><span>پن دوبارہ لکھیں</span><input class="maa-in n" id="maP2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="••••"></label>
      <div class="maa-m" id="maMsg"></div>
      <button type="button" class="maa-b ok" id="maGo">✅ سائن اپ کریں</button>
    </div>`);
    districtBlock(ov, '');
    const msg = $(ov, '#maMsg'), bad = (id, t) => { const e = $(ov, id); if (e) { e.classList.add('need'); e.focus(); } msg.className = 'maa-m'; msg.textContent = t; return false; };
    ov.querySelectorAll('.maa-in').forEach(i => i.addEventListener('input', () => i.classList.remove('need')));
    $(ov, '#maGo').onclick = async () => {
      const name = $(ov, '#maN').value.trim().replace(/\s+/g, ' '), mob = $(ov, '#maM').value, dis = $(ov, '#maD').value, p1 = digits($(ov, '#maP').value), p2 = digits($(ov, '#maP2').value);
      if (name.length < 2) return bad('#maN', 'اپنا نام لکھیں');
      if (!mobOk(mob)) return bad('#maM', 'موبائل نمبر درست لکھیں — مثلاً 0300-1234567');
      if (!dis) return bad('#maD', 'اپنا ضلع چنیں');
      if (p1.length < 4 || p1.length > 6) return bad('#maP', 'پن 4 سے 6 ہندسوں کا ہو');
      if (p1 !== p2) return bad('#maP2', 'دونوں پن ایک جیسے نہیں');
      const b = $(ov, '#maGo'); b.disabled = true;
      const salt = Math.random().toString(36).slice(2, 12);
      jset(PK, { name: name.slice(0, 60), mobile: '0' + mob10(mob), district: dis, salt, ph: await sha(salt + ':' + p1), at: Date.now() });
      sset(SK, '1');
      reg();
      showBioOffer();
    };
  }
  async function showBioOffer() {
    const can = await bioSupported();
    if (!can) { hide(); paintAll(); return; }
    show(`<div class="maa-box">${head('👆 فنگر پرنٹ', 'اگلی بار پن کی جگہ فون کے فنگر پرنٹ سے ایپ کھولیں۔ فنگر پرنٹ فون سے باہر کہیں نہیں جاتا؛ پن ساتھ چلتا رہے گا۔')}
      <div class="maa-m" id="maMsg"></div>
      <button type="button" class="maa-b ok" id="maBio">👆 فنگر پرنٹ آن کریں</button>
      <button type="button" class="maa-b g" id="maSkip">بعد میں</button></div>`);
    $(ov, '#maSkip').onclick = () => { hide(); paintAll(); };
    $(ov, '#maBio').onclick = async () => {
      const m = $(ov, '#maMsg'); m.className = 'maa-m'; m.textContent = 'فون کا فنگر پرنٹ / سکرین لاک استعمال کریں…';
      if (await bioEnable()) { m.className = 'maa-m ok'; m.textContent = '✅ فنگر پرنٹ آن ہو گیا'; setTimeout(() => { hide(); paintAll(); }, 900); }
      else m.textContent = 'آن نہیں ہو سکا — فون میں فنگر پرنٹ / سکرین لاک لگا ہو، یا «بعد میں» دبائیں';
    };
  }

  // ---------- پن کا تالا (ہر بار ایپ کھلنے پر) ----------
  let fails = 0, waitUntil = 0, bioTried = false;
  async function pinOk(pin) { const p = prof(); return !!p && (await sha(p.salt + ':' + pin)) === p.ph; }
  function showLock() {
    const p = prof();
    show(`<div class="maa-box">${head(esc(p.name), 'پن کوڈ لکھ کر ایپ کھولیں')}
      <input class="maa-in n" id="maP" type="password" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="••••">
      <div class="maa-m" id="maMsg"></div>
      <button type="button" class="maa-b ok" id="maOpen">🔓 کھولیں</button>
      ${p.bio ? '<button type="button" class="maa-b g" id="maFp">👆 فنگر پرنٹ سے کھولیں</button>' : ''}
      <button type="button" class="maa-lk" id="maForgot">پن بھول گئے؟</button></div>`);
    const msg = $(ov, '#maMsg'), inp = $(ov, '#maP');
    const open = () => { sset(SK, '1'); hide(); paintAll(); try { window.MA_LIC && window.MA_LIC.refresh && window.MA_LIC.refresh(true); } catch (e) {} };
    const go = async () => {
      const now = Date.now(); if (now < waitUntil) { msg.className = 'maa-m'; msg.textContent = `بہت بار غلط پن — ${Math.ceil((waitUntil - now) / 1000)} سیکنڈ بعد کوشش کریں`; return; }
      const v = digits(inp.value); if (v.length < 4) { msg.className = 'maa-m'; msg.textContent = 'پن لکھیں'; inp.focus(); return; }
      if (await pinOk(v)) { fails = 0; open(); return; }
      fails++; inp.value = ''; inp.focus(); msg.className = 'maa-m';
      if (fails >= 5) { fails = 0; waitUntil = Date.now() + 30000; msg.textContent = 'پن غلط ہے — 30 سیکنڈ رکیں'; } else msg.textContent = 'پن غلط ہے — دوبارہ لکھیں';
    };
    $(ov, '#maOpen').onclick = go;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    $(ov, '#maForgot').onclick = showForgot;
    const fp = $(ov, '#maFp');
    const bio = async () => { if (await bioCheck()) open(); else { msg.className = 'maa-m'; msg.textContent = 'فنگر پرنٹ نہیں ملا — پن سے کھولیں'; } };
    if (fp) { fp.onclick = bio; if (!bioTried) { bioTried = true; setTimeout(bio, 350); } }
  }
  function showForgot() {
    show(`<div class="maa-box">${head('پن بدلیں', 'سائن اپ والا موبائل نمبر لکھیں، پھر نیا پن بنائیں')}
      <input class="maa-in n" id="maM" inputmode="tel" autocomplete="off" placeholder="03XX-XXXXXXX" maxlength="15">
      <input class="maa-in n" id="maP" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="نیا پن">
      <input class="maa-in n" id="maP2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="نیا پن دوبارہ">
      <div class="maa-m" id="maMsg"></div>
      <button type="button" class="maa-b ok" id="maGo">✅ نیا پن لگائیں</button>
      <button type="button" class="maa-b g" id="maBack">واپس</button></div>`);
    const msg = $(ov, '#maMsg'), p = prof();
    $(ov, '#maBack').onclick = showLock;
    $(ov, '#maGo').onclick = async () => {
      msg.className = 'maa-m';
      if (mob10($(ov, '#maM').value) !== mob10(p.mobile)) { msg.textContent = 'یہ وہ موبائل نمبر نہیں جس سے سائن اپ کیا تھا'; return; }
      const a = digits($(ov, '#maP').value), b = digits($(ov, '#maP2').value);
      if (a.length < 4 || a.length > 6) { msg.textContent = 'پن 4 سے 6 ہندسوں کا ہو'; return; }
      if (a !== b) { msg.textContent = 'دونوں پن ایک جیسے نہیں'; return; }
      p.salt = Math.random().toString(36).slice(2, 12); p.ph = await sha(p.salt + ':' + a); jset(PK, p); fails = 0;
      msg.className = 'maa-m ok'; msg.textContent = '✅ نیا پن لگ گیا'; setTimeout(showLock, 800);
    };
  }

  // ---------- اپنی معلومات / پن / فنگر پرنٹ (ہوم کی پٹی سے) ----------
  function showSettings() {
    const p = prof(); if (!p) return;
    const m0 = me();
    show(`<div class="maa-box">${head('🔐 میرا اکاؤنٹ')}
      <div class="maa-info">👤 نام: <b>${esc(p.name)}</b><br>📱 موبائل: <b dir="ltr">${esc(mobShow(p.mobile))}</b><br>📍 ضلع: <b>${esc(districtLabel(p.district))}</b><br>🆔 MA ID: <b dir="ltr">${esc(m0.id || 'ابھی نہیں بنی')}</b><br>👆 فنگر پرنٹ: <b>${p.bio ? 'آن ہے' : 'بند ہے'}</b></div>
      <button type="button" class="maa-b" id="maBioT"></button>
      <input class="maa-in n" id="maO" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="پرانا پن">
      <input class="maa-in n" id="maP" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" placeholder="نیا پن">
      <input class="maa-in n" id="maP2" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" placeholder="نیا پن دوبارہ">
      <div class="maa-m" id="maMsg"></div>
      <button type="button" class="maa-b ok" id="maChg">🔑 پن بدلیں</button>
      <button type="button" class="maa-b g" id="maClose">بند کریں</button></div>`);
    const msg = $(ov, '#maMsg'), bt = $(ov, '#maBioT');
    bt.textContent = p.bio ? '👆 فنگر پرنٹ بند کریں' : '👆 فنگر پرنٹ آن کریں';
    bt.onclick = async () => {
      msg.className = 'maa-m';
      if (p.bio) { delete p.bio; jset(PK, p); showSettings(); return; }
      if (!(await bioSupported())) { msg.textContent = 'اس فون میں فنگر پرنٹ / سکرین لاک نہیں ملا'; return; }
      if (await bioEnable()) showSettings(); else msg.textContent = 'آن نہیں ہو سکا — دوبارہ کوشش کریں';
    };
    $(ov, '#maClose').onclick = () => { hide(); };
    $(ov, '#maChg').onclick = async () => {
      msg.className = 'maa-m';
      if (!(await pinOk(digits($(ov, '#maO').value)))) { msg.textContent = 'پرانا پن غلط ہے'; return; }
      const a = digits($(ov, '#maP').value), b = digits($(ov, '#maP2').value);
      if (a.length < 4 || a.length > 6) { msg.textContent = 'نیا پن 4 سے 6 ہندسوں کا ہو'; return; }
      if (a !== b) { msg.textContent = 'دونوں نئے پن ایک جیسے نہیں'; return; }
      const q = prof(); q.salt = Math.random().toString(36).slice(2, 12); q.ph = await sha(q.salt + ':' + a); jset(PK, q);
      msg.className = 'maa-m ok'; msg.textContent = '✅ پن بدل گیا';
    };
  }

  // ---------- سرور: ID بنانا ----------
  function fpv() {
    try {
      const f = [String(navigator.userAgent || '').replace(/\d+/g, ''), Math.min(screen.width, screen.height), Math.max(screen.width, screen.height), navigator.hardwareConcurrency || 2, new Date().getTimezoneOffset(), navigator.language || '', navigator.platform || ''].join('|');
      let h1 = 5381, h2 = 52711; for (let i = 0; i < f.length; i++) { const c = f.charCodeAt(i); h1 = (h1 * 33) ^ c; h2 = (h2 * 31 + c) | 0; }
      return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
    } catch (e) { return ''; }
  }
  function devKey(mob) {
    const m = me(); if (m.dev) return m.dev;
    const f = fpv() || Math.random().toString(36).slice(2, 12); let h = 0; const k = f + '|' + String(mob).slice(-10);
    for (let i = 0; i < k.length; i++) h = ((h << 5) - h + k.charCodeAt(i)) | 0;
    m.dev = 'M' + f + (h >>> 0).toString(36); saveMe(m); return m.dev;
  }
  async function post(path, body) { const r = await fetch(W + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }
  let regBusy = false;
  async function reg() {
    const p = prof(), m = me(); if (!p || m.id || regBusy || navigator.onLine === false) return;
    regBusy = true;
    try {
      const r = await post('/aioid', { op: 'reg', app: 'MA', dev: devKey(p.mobile), fp: fpv(), name: p.name.length < 2 ? p.name + ' MA' : p.name, mobile: p.mobile, gmail: '', district: districtWire(p.district) });
      if (r && r.ok && r.id) { const m2 = me(); m2.id = r.id; m2.at = Date.now(); saveMe(m2); paintAll(); check(true); }
    } catch (e) {}
    regBusy = false;
  }

  // ---------- سرور: پیکج چالو ہوا؟ ----------
  let last = 0, busy = false;
  function celebrate(exp, life, days) {
    try {
      const o0 = document.getElementById('maCele'); if (o0) o0.remove();
      const o = document.createElement('div'); o.id = 'maCele';
      o.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:rgba(3,37,30,.86);display:flex;align-items:center;justify-content:center;padding:18px;direction:rtl';
      o.innerHTML = `<div style="background:#fff;color:#14463a;border-radius:22px;max-width:380px;width:100%;padding:22px 18px 18px;text-align:center;box-shadow:0 14px 44px rgba(0,0,0,.5);font-family:inherit">
        <div style="font-size:54px;line-height:1.2">🎉</div><div style="font-size:24px;line-height:2;color:#0e6b4f;margin:4px 0 8px">مبارک ہو! آپ کا پیکج چالو ہو گیا</div>
        <div style="font-size:17px;line-height:2.1;color:#334155">${life ? '♾️ لائف ٹائم' : `⏳ <b>${days}</b> دن — <b>${esc(dmy(exp))}</b> تک`}<br>🆔 MA ID: <b dir="ltr">${esc(me().id)}</b></div>
        <button type="button" id="maCeleX" style="margin-top:14px;padding:9px 34px;border:0;border-radius:999px;background:#14463a;color:#fff;font:inherit;font-size:18px;cursor:pointer">جزاک اللہ ✅</button></div>`;
      document.body.appendChild(o); o.querySelector('#maCeleX').onclick = () => o.remove();
    } catch (e) {}
  }
  async function check(force) {
    const m = me(); if (!prof() || !m.id || !m.dev || busy || navigator.onLine === false) return;
    if (!force && Date.now() - last < (m.want ? 60e3 : 10 * 60e3)) return;
    busy = true; last = Date.now();
    try {
      const r = await post('/entclaim', { app: 'MA', kind: 'a', aio: m.id, adev: m.dev, dev: m.dev });
      const L = window.MA_LIC;
      if (r && r.ok && r.active) {
        const exp = r.life ? '2099-12-31' : iso(new Date(r.exp));
        const m2 = me();
        if (L && L.srvGrant) L.srvGrant(exp);
        if (m2.celeExp !== exp) {
          const days = Math.max(0, Math.round((new Date(exp + 'T00:00:00') - new Date(iso(new Date()) + 'T00:00:00')) / 864e5) + 1);
          m2.celeExp = exp; delete m2.want; saveMe(m2);
          celebrate(exp, !!r.life, days);
        }
      } else if (r && r.ok === false && r.reason === 'revoked') {
        if (L && L.srvRevoke) L.srvRevoke();
        const m2 = me(); if (m2.celeExp) { delete m2.celeExp; saveMe(m2); }
      }
    } catch (e) {}
    busy = false; paintAll();
  }

  // ---------- ID کی پٹی اور «پیکج منگوائیں» ----------
  function idCardHtml(withMore) {
    const m = me(), p = prof(); if (!p) return '';
    let st = '';
    try { const s = window.MA_LIC && window.MA_LIC.status(); if (s && s.mode === 'paid') st = `<div class="s">✅ پیکج چالو — ${s.left} دن باقی</div>`; } catch (e) {}
    if (!m.id) return `<div class="maIdCard" title="آئی ڈی انٹرنیٹ سے بنتی ہے"><div class="r"><span class="t">🆔 MA ID</span><span class="t">⏳ بن رہی ہے — انٹرنیٹ چالو رکھیں</span><button type="button" data-ma="refresh">🔄</button></div></div>`;
    return `<div class="maIdCard" dir="rtl"><div class="r"><span class="t">🆔 MA ID</span><b class="i">${esc(m.id)}</b><button type="button" data-ma="copy">📋</button><button type="button" class="o" data-ma="refresh">🔄</button>${withMore ? '<button type="button" class="o" data-ma="acct">🔐</button>' : ''}</div>${st}</div>`;
  }
  const PKGS = [['1m', '1 مہینہ'], ['3m', '3 مہینے'], ['6m', '6 مہینے'], ['1y', '1 سال']];
  let selPkg = '1y';
  function pkgBoxHtml(msg) {
    const m = me(), w = m.want && m.want.pkg ? m.want : null;
    const wl = w ? (PKGS.find(x => 'ma-' + x[0] === w.pkg) || [0, ''])[1] : '';
    return `<div class="maPkg"><div class="h">📩 پیکج منگوائیں</div>
      <div class="g4">${PKGS.map(x => `<button type="button" data-pk="${x[0]}" class="${selPkg === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>
      <button type="button" class="maa-b ok" data-ma="want">✅ یہ پیکج منگوائیں</button>
      <div class="n">${msg || (w ? `📨 پچھلی درخواست (${esc(wl)}) بھیجی جا چکی ہے — منظوری ہوتے ہی یہ فون خود چالو ہو جائے گا۔` : 'درخواست بھیجیں — رقم کی تصدیق کے بعد پیکج منظور ہوتے ہی یہ فون خود چالو ہو جائے گا، کوئی کوڈ نہیں۔')}</div></div>`;
  }
  async function sendWant(root) {
    const m = me(), box = root.querySelector('#maPkgSlot'), draw = t => { if (box) { box.innerHTML = pkgBoxHtml(t); wire(root); } };
    if (!m.id || !m.dev) { draw('📶 ابھی آپ کی MA ID نہیں بنی — انٹرنیٹ چالو کر کے ID کی پٹی پر «🔄» دبائیں، پھر دوبارہ'); return; }
    const pkg = 'ma-' + selPkg;
    try {
      const r = await post('/aioid', { op: 'want', id: m.id, dev: m.dev, pkg, amt: 0 });
      if (r && r.ok) { const m2 = me(); m2.want = { pkg, at: Date.now() }; saveMe(m2); draw('✅ <b>آپ کی درخواست منظوری کے لیے بھیج دی گئی ہے</b><br>📦 ' + esc((PKGS.find(x => x[0] === selPkg) || [0, ''])[1]) + '<br>منظوری ہوتے ہی یہ فون خود چالو ہو جائے گا۔'); check(true); }
      else draw('⚠️ نہیں جا سکا — دوبارہ کوشش کریں');
    } catch (e) { draw('📶 انٹرنیٹ نہیں — انٹرنیٹ چالو کر کے دوبارہ دبائیں'); }
  }
  function wire(root) {
    root.querySelectorAll('[data-ma]').forEach(b => {
      if (b.__w) return; b.__w = 1;
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        const a = b.dataset.ma;
        if (a === 'copy') { const id = me().id || ''; const done = () => { const t = b.textContent; b.textContent = '✅'; setTimeout(() => { b.textContent = t; }, 1500); }; try { navigator.clipboard.writeText(id).then(done, () => prompt('Copy', id)); } catch (e) { prompt('Copy', id); } }
        else if (a === 'refresh') { b.disabled = true; b.textContent = '⏳'; last = 0; (me().id ? check(true) : reg()).then(() => { paintAll(); try { window.MA_LIC && window.MA_LIC.refresh && window.MA_LIC.refresh(true); } catch (e) {} }); setTimeout(() => { b.disabled = false; b.textContent = '🔄'; }, 4000); }
        else if (a === 'acct') showSettings();
        else if (a === 'want') sendWant(root);
      });
    });
    root.querySelectorAll('[data-pk]').forEach(b => { if (b.__w) return; b.__w = 1; b.addEventListener('click', ev => { ev.stopPropagation(); selPkg = b.dataset.pk; const box = root.querySelector('#maPkgSlot'); if (box) { box.innerHTML = pkgBoxHtml(); wire(root); } }); });
  }
  // license.js کی اسکرینوں میں (سبسکرپشن گیٹ) خالی جگہیں بھرنا
  function mount(root) {
    if (!root || !prof()) return;
    const a = root.querySelector('#maIdSlot'); if (a) { a.innerHTML = idCardHtml(false); wire(a); }
    const b = root.querySelector('#maPkgSlot'); if (b) { b.innerHTML = pkgBoxHtml(); wire(root); }
  }
  // ہوم پر ID کی پٹی (licSlot میں)
  function paintHome() {
    try {
      const slot = document.getElementById('licSlot'); if (!slot) return;
      let c = document.getElementById('maIdHome');
      if (!prof()) { if (c) c.remove(); return; }
      if (!c) { c = document.createElement('div'); c.id = 'maIdHome'; slot.appendChild(c); }
      const h = idCardHtml(true); if (c.__h !== h) { c.__h = h; c.innerHTML = h; wire(c); }
    } catch (e) {}
  }
  function paintAll() {
    paintHome();
    const g = document.getElementById('licOv'); if (g) { const a = g.querySelector('#maIdSlot'); if (a) { const h = idCardHtml(false); if (a.__h !== h) { a.__h = h; a.innerHTML = h; wire(a); } } }
  }

  window.MA_ACC = { mount, settings: showSettings, profile: prof, id: () => me().id || '', check: () => check(true) };

  // ---------- شروع ----------
  function start() {
    if (!prof()) { showSignup(); }
    else if (sget(SK) !== '1') { showLock(); }
    paintAll();
    setTimeout(() => { reg(); check(true); paintAll(); }, 2500);
    setInterval(() => { reg(); check(false); paintAll(); }, 30e3);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { reg(); check(false); paintAll(); } });
    window.addEventListener('online', () => { reg(); check(true); });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
