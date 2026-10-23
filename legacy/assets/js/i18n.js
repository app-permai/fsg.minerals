/* ============================================================
   FSG dwibahasa — runtime kongsi untuk halaman korporat (legacy/).

   Halaman korporat (corporate, minerals, market-tool, contact) tidak
   melalui bundler, jadi kamus tidak boleh diimport daripada
   src/i18n/dictionary.js. Fail ini menyediakan satu sumber tunggal
   untuk keempat-empat halaman supaya:

     * kunci kekal konsisten dengan SPA React,
     * hanya SATU tempat perlu dikemas kini apabila teks berubah,
     * pilihan bahasa dibaca daripada localStorage['fsg-lang'] —
       kunci yang SAMA dengan SPA dan market-tool, jadi suis bahasa
       berterusan merentas seluruh laman.

   Penggunaan dalam HTML:
     <span data-i18n="nav.home">Home</span>
     <h2 data-i18n-html="hero.title">…</h2>      (membenarkan <em>)
     <input data-i18n-ph="enq.name" placeholder="…">
     <select id="langSeg"><button data-lang="bm">MS</button>…</select>

   Nilai dalam HTML ialah teks BM asal. Jika JS gagal dimuatkan,
   halaman kekal BM dan tetap boleh dibaca — tiada teks kosong.
   ============================================================ */
(function () {
  'use strict';

  var L = {
    bm: {
      /* nav */
      'nav.home': 'Home',
      'nav.minerals': 'Mineral',
      'nav.marketTool': 'Alat Pasaran',
      'nav.contact': 'Hubungi',
      'nav.corporate': 'Korporat',
      'nav.staff': '🔒 Log Masuk Staf',
      'nav.admin': 'Admin',
      'nav.quote': '✉️ Minta Sebutharga',
      'nav.enquiry': 'Enquiry',
      'nav.langSwitch': 'Tukar bahasa',

      /* corporate hero */
      'corp.kicker': 'SOMALILAND • AFRIKA — RUJUKAN LME / FASTMARKETS',
      'corp.title': 'Mineral strategik <em>gred premium,</em> diurus profesional.',
      'corp.lead':
        'First Strategic Global Sdn Bhd membekalkan Kuprum, Titanium, Litium, Koltan, Tantalum, Aurum, Perak, Timah & Aluminium. Harga rujukan telus, assay XRF, dan sebutharga rasmi via',
      'corp.stat1': 'MINERAL FOKUS',
      'corp.stat2': 'RUJUKAN SAH',
      'corp.stat3': 'ASSAY SAH',
      'corp.stat4': 'INCOTERMS',
      'corp.ctaMarket': 'Buka Alat Pasaran',
      'corp.ctaMinerals': 'Lihat Mineral',
      'corp.terminal': 'Terminal Status',
      'corp.active': 'Aktif',
      'corp.reference': 'Rujukan',
      'corp.rateLine': 'Kadar USD-MYR {rate} • Kemaskini {stamp} • {status}',
      'corp.livePrices': 'Harga Live',
      'corp.contactFsg': 'Hubungi FSG',
      'corp.mineralsTitle': 'Mineral Fokus FSG',
      'corp.mineralsSub':
        'Sembilan mineral dengan rujukan LME / LBMA / Fastmarkets. Klik untuk spesifikasi dan asal.',
      'corp.disclaimer':
        'Harga rujukan dari sumber awam + input manual. Bukan nasihat pelaburan.',

      /* minerals page */
      'min.badge': '9 MINERAL • LME / LBMA / FASTMARKETS',
      'min.title': 'Portfolio Mineral',
      'min.sub': 'Spesifikasi ringkas dan unit asas dagangan. Harga tepat di Alat Pasaran.',
      'min.verifyTitle': 'Sahkan Sumber',
      'min.verifyBody': 'Rujuk',
      'min.verifyTail':
        'sebelum berurusan. Untuk sebutharga rasmi, hubungi',
      'min.loading': 'Memuatkan harga rujukan…',

      /* contact page */
      'contact.title': 'Hubungi FSG',
      'contact.sub':
        'Enquiry terus ke pasukan FSG. Tiada data disimpan selain dalam browser anda.',
      'contact.name': 'Nama *',
      'contact.namePh': 'Nama penuh',
      'contact.email': 'Email *',
      'contact.company': 'Syarikat',
      'contact.companyPh': 'Syarikat',
      'contact.mineral': 'Mineral minat',
      'contact.qty': 'Kuantiti *',
      'contact.unit': 'Unit',
      'contact.unit.g': 'gram (g)',
      'contact.unit.kg': 'kilogram (kg)',
      'contact.unit.oz': 'auns (oz)',
      'contact.unit.t': 'tan metrik',
      'contact.msg': 'Kuantiti + mesej',
      'contact.msgPh': 'cth: 10 tan copper concentrate, CIF Penang...',
      'contact.submit': '✉️ Hantar & Jana Sebutharga',
      'contact.companyTitle': 'Maklumat Syarikat',
      'contact.operations': 'Operasi: Somaliland, Afrika',
      'contact.prepare':
        'Sediakan: berat, gred/assay, lokasi & foto. Minta assay XRF untuk sebutharga pantas.',
      'contact.calc': 'Buka Kalkulator →',
      'contact.needFields': 'Isi nama & email',
      'contact.sending': 'Menghantar...',
      'contact.quoteOk': '✅ Sebutharga {number} dijana.',
      'contact.estimate': 'Anggaran rujukan: RM {amount}',
      'contact.emailSent': 'Salinan dihantar ke email anda.',
      'contact.emailFailed': 'Emel gagal dihantar — pasukan FSG akan hubungi anda.',
      'contact.emailLater': 'Pasukan FSG akan emel sebutharga rasmi.',
      'contact.failed': 'Gagal hantar automatik ({err}). Membuka emel manual...',

      /* footer */
      'foot.disclaimer': 'Penafian:',
      'foot.contact': 'Hubungi',

      /* status lencana harga */
      'status.live': '🔴 API LANGSUNG AKTIF',
      'status.manual': '⚠️ Rujukan manual',
      'status.liveDetail': '{n}/{total} mineral disuap langsung',
      'status.cached': 'cache terakhir',
    },

    en: {
      /* nav */
      'nav.home': 'Home',
      'nav.minerals': 'Minerals',
      'nav.marketTool': 'Market Tool',
      'nav.contact': 'Contact',
      'nav.corporate': 'Corporate',
      'nav.staff': '🔒 Staff Login',
      'nav.admin': 'Admin',
      'nav.quote': '✉️ Request Quote',
      'nav.enquiry': 'Enquiry',
      'nav.langSwitch': 'Switch language',

      /* corporate hero */
      'corp.kicker': 'SOMALILAND • AFRICA — LME / FASTMARKETS REF',
      'corp.title': 'Premium strategic minerals, <em>professionally</em> managed.',
      'corp.lead':
        'First Strategic Global Sdn Bhd supplies Copper, Titanium, Lithium, Coltan, Tantalum, Gold, Silver, Tin & Aluminium. Transparent reference pricing, XRF assay, and official quotations via',
      'corp.stat1': 'FOCUS MINERALS',
      'corp.stat2': 'VERIFIED REF',
      'corp.stat3': 'VERIFIED ASSAY',
      'corp.stat4': 'INCOTERMS',
      'corp.ctaMarket': 'Open Market Tool',
      'corp.ctaMinerals': 'View Minerals',
      'corp.terminal': 'Terminal Status',
      'corp.active': 'Active',
      'corp.reference': 'Reference',
      'corp.rateLine': 'USD-MYR rate {rate} • Updated {stamp} • {status}',
      'corp.livePrices': 'Live Prices',
      'corp.contactFsg': 'Contact FSG',
      'corp.mineralsTitle': 'FSG Focus Minerals',
      'corp.mineralsSub':
        'Nine minerals with LME / LBMA / Fastmarkets references. Click for specifications and origin.',
      'corp.disclaimer':
        'Reference prices from public sources + manual input. Not investment advice.',

      /* minerals page */
      'min.badge': '9 MINERALS • LME / LBMA / FASTMARKETS',
      'min.title': 'Mineral Portfolio',
      'min.sub': 'Brief specifications and base trading units. Exact prices in the Market Tool.',
      'min.verifyTitle': 'Verify Sources',
      'min.verifyBody': 'Refer to',
      'min.verifyTail': 'before trading. For an official quotation, contact',
      'min.loading': 'Loading reference prices…',

      /* contact page */
      'contact.title': 'Contact FSG',
      'contact.sub':
        'Direct enquiry to the FSG team. No data is stored outside your browser.',
      'contact.name': 'Name *',
      'contact.namePh': 'Full name',
      'contact.email': 'Email *',
      'contact.company': 'Company',
      'contact.companyPh': 'Company',
      'contact.mineral': 'Mineral of interest',
      'contact.qty': 'Quantity *',
      'contact.unit': 'Unit',
      'contact.unit.g': 'gram (g)',
      'contact.unit.kg': 'kilogram (kg)',
      'contact.unit.oz': 'ounce (oz)',
      'contact.unit.t': 'metric tonne',
      'contact.msg': 'Quantity + message',
      'contact.msgPh': 'e.g. 10 tonnes copper concentrate, CIF Penang...',
      'contact.submit': '✉️ Send & Generate Quotation',
      'contact.companyTitle': 'Company Information',
      'contact.operations': 'Operations: Somaliland, Africa',
      'contact.prepare':
        'Prepare: weight, grade/assay, location & photos. Request an XRF assay for a faster quotation.',
      'contact.calc': 'Open Calculator →',
      'contact.needFields': 'Please fill in name & email',
      'contact.sending': 'Sending...',
      'contact.quoteOk': '✅ Quotation {number} generated.',
      'contact.estimate': 'Reference estimate: RM {amount}',
      'contact.emailSent': 'A copy has been sent to your email.',
      'contact.emailFailed': 'Email delivery failed — the FSG team will contact you.',
      'contact.emailLater': 'The FSG team will email the official quotation.',
      'contact.failed': 'Automatic submission failed ({err}). Opening manual email...',

      /* footer */
      'foot.disclaimer': 'Disclaimer:',
      'foot.contact': 'Contact',

      /* status lencana harga */
      'status.live': '🔴 LIVE API ACTIVE',
      'status.manual': '⚠️ Reference only',
      'status.liveDetail': '{n}/{total} minerals fed live',
      'status.cached': 'last cached values',
    },
  };

  var KEY = 'fsg-lang';

  function readLang() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'en' ? 'en' : 'bm';
    } catch (e) {
      return 'bm';
    }
  }

  var lang = readLang();

  function t(key, vars) {
    var s = L[lang][key];
    if (s === undefined) s = L.bm[key];
    if (s === undefined) return key;
    if (vars) {
      s = String(s).replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] !== undefined ? vars[name] : m;
      });
    }
    return s;
  }

  function apply() {
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'ms');

    var i;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    nodes = document.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < nodes.length; i++) {
      nodes[i].innerHTML = t(nodes[i].getAttribute('data-i18n-html'));
    }
    nodes = document.querySelectorAll('[data-i18n-ph]');
    for (i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute('placeholder', t(nodes[i].getAttribute('data-i18n-ph')));
    }
    nodes = document.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute('aria-label', t(nodes[i].getAttribute('data-i18n-aria')));
    }

    var buttons = document.querySelectorAll('[data-lang]');
    for (i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-lang') === lang;
      buttons[i].classList.toggle('active', on);
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function setLang(next) {
    lang = next === 'en' ? 'en' : 'bm';
    try {
      localStorage.setItem(KEY, lang);
    } catch (e) {
      /* mod peribadi — pilihan tidak kekal */
    }
    apply();
    /* Halaman boleh melukis semula kandungan dinamik (harga, kad). */
    document.dispatchEvent(new CustomEvent('fsg:langchange', { detail: { lang: lang } }));
  }

  /* Butang bahasa: mana-mana elemen dengan data-lang. */
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('[data-lang]') : null;
    if (btn) setLang(btn.getAttribute('data-lang'));
  });

  /* Guna semula suis bahasa yang sudah ada di dalam header halaman,
     supaya setiap halaman tidak perlu menyalin markup. */
  function mountSwitch() {
    var nav = document.querySelector('header .menu');
    if (!nav || nav.querySelector('[data-lang]')) return;
    var group = document.createElement('span');
    group.className = 'lang-toggle';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', t('nav.langSwitch'));
    group.innerHTML =
      '<button type="button" class="lang-btn" data-lang="bm" lang="ms">🇲🇾 BM</button>' +
      '<button type="button" class="lang-btn" data-lang="en" lang="en">🇬🇧 EN</button>';
    /* Letak sebelum toggle tema supaya susunan kekal: ... [bahasa] [tema]. */
    var themeBtn = nav.querySelector('.theme-toggle');
    if (themeBtn) nav.insertBefore(group, themeBtn);
    else nav.appendChild(group);
  }

  function boot() {
    mountSwitch();
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.FSG_I18N = { t: t, setLang: setLang, apply: apply, get lang() { return lang; } };
})();
