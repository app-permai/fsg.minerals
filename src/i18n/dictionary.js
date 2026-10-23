/**
 * Kamus dwibahasa FSG — Bahasa Melayu (BM) dan English (EN).
 *
 * Konvensyen kunci: `section.key` dalam camelCase.
 * Setiap kunci MESTI ada kedua-dua bahasa. Jika satu hilang, `t()`
 * akan jatuh balik ke BM dan menulis amaran dalam mod pembangunan —
 * lebih baik nampak daripada teks kosong di skrin.
 *
 * Teks yang mengandungi angka/nama syarikat kekal sama dalam kedua-dua
 * bahasa; hanya prosa yang diterjemah.
 */

export const DICT = {
  bm: {
    /* ---------- Header / nav ---------- */
    'nav.home': 'Laman Utama',
    'nav.radar': 'Radar Prospek',
    'nav.marketTool': 'Alat Pasaran',
    'nav.contact': 'Hubungi',
    'nav.staffLogin': 'Log Masuk Staf',
    'nav.admin': 'Admin',
    'nav.corporate': 'Korporat',
    'nav.minerals': 'Mineral',
    'nav.requestQuote': 'Minta Sebutharga',
    'nav.login': 'Log Masuk / Daftar',
    'nav.logout': 'Log Keluar',
    'nav.tokens': 'Token',
    'nav.themeDark': 'Gelap',
    'nav.themeLight': 'Cerah',
    'nav.toLight': 'Tukar ke mod cerah',
    'nav.toDark': 'Tukar ke mod gelap',
    'nav.openMenu': 'Buka menu',
    'nav.closeMenu': 'Tutup menu',
    'nav.mainMenu': 'Menu utama',
    'nav.langSwitch': 'Tukar bahasa',

    /* ---------- Hero ---------- */
    'hero.kicker': 'SOMALILAND • AFRIKA — RUJUKAN LME / FASTMARKETS',
    'hero.titleA': 'Mineral strategik',
    'hero.titleB': 'gred premium,',
    'hero.titleC': 'diurus profesional.',
    'hero.lead':
      'First Strategic Global Sdn Bhd membekalkan Kuprum, Titanium, Litium, Koltan, Tantalum, Aurum, Perak, Timah & Aluminium. Harga rujukan telus, assay XRF, dan sebutharga rasmi via',
    'hero.stat.minerals': 'MINERAL FOKUS',
    'hero.stat.lme': 'RUJUKAN SAH',
    'hero.stat.xrf': 'ASSAY SAH',
    'hero.stat.incoterms': 'INCOTERMS',
    'hero.cta.browse': 'Lihat Direktori Lead',
    'hero.cta.register': 'Daftar Percuma & Dapat 10 Token',
    'hero.cta.marketTool': 'Buka Alat Pasaran',
    'hero.cta.minerals': 'Lihat Mineral',

    /* ---------- Terminal Status ---------- */
    'terminal.title': 'Terminal Status',
    'terminal.active': 'Aktif',
    'terminal.reference': 'Rujukan',
    'terminal.rate': 'Kadar USD-MYR',
    'terminal.live': 'langsung',
    'terminal.ref': 'rujukan',
    'terminal.updated': 'Kemaskini',
    'terminal.notSynced': 'Belum disegerakkan',
    'terminal.disclaimer': 'Harga tertakluk pengesahan FSG.',
    'terminal.livePrices': 'Harga Live',
    'terminal.contactFsg': 'Hubungi FSG',

    /* ---------- Status badges ---------- */
    'status.live': '🔴 API LANGSUNG AKTIF',
    'status.manual': '⚠️ Rujukan manual',
    'status.loading': 'Memuatkan harga…',
    'status.liveDetail': '{n}/{total} mineral disuap langsung',
    'status.staticDetail': 'Suapan langsung tidak dapat dihubungi',
    'status.cacheDetail': 'Menggunakan cache terakhir',

    /* ---------- Radar Prospek ---------- */
    'radar.kicker': 'RADAR PROSPEK',
    'radar.title': 'Cari pembeli, pembekal & pengilang',
    'radar.sub':
      'Direktori B2B langsung untuk mineral strategik — termasuk smelter, kilang pemprosesan dan refinery. Layari percuma; kontak dibuka dengan 1 token.',
    'radar.register': 'Daftar Percuma — 10 Token',
    'radar.tab.buy': 'Cari Pembeli',
    'radar.tab.sell': 'Cari Pembekal',
    'radar.tab.process': 'Cari Pengilang Pemprosesan',
    'radar.tab.all': 'Semua',
    'radar.tab.buyShort': 'Pembeli',
    'radar.tab.sellShort': 'Pembekal',
    'radar.tab.processShort': 'Pemprosesan',
    'radar.tab.allShort': 'Semua',
    'radar.step1.title': 'Cari syarikat',
    'radar.step1.text':
      'Tapis mengikut kategori, mineral dan negara. Semua kad boleh dilihat percuma.',
    'radar.step2.title': 'Tarik kontak',
    'radar.step2.text':
      'Tukar 1 token untuk mendedahkan syarikat, kontak, telefon, e-mel dan alamat lombong.',
    'radar.step3.title': 'Database',
    'radar.step3.text':
      'Setiap lead disimpan dalam pangkalan data langsung — bukan senarai statik.',
    'radar.metric.leads': 'LEAD AKTIF',
    'radar.metric.leadsSub': 'semua kategori',
    'radar.metric.buyers': 'PEMBELI',
    'radar.metric.buyersSub': 'permintaan aktif',
    'radar.metric.sellers': 'PEMBEKAL',
    'radar.metric.sellersSub': 'bekalan tersedia',
    'radar.metric.processors': 'PEMPROSESAN',
    'radar.metric.processorsSub': 'smelter / refinery',
    'radar.metric.countries': 'NEGARA',
    'radar.metric.countriesSub': 'liputan sumber',
    'radar.metric.commodities': 'KOMODITI',
    'radar.metric.commoditiesSub': 'jenis mineral',
    'radar.filter.mineral': 'Semua mineral',
    'radar.filter.country': 'Semua negara',
    'radar.filter.search': 'Cari syarikat, mineral, wilayah…',
    'radar.filter.reset': 'Set semula',
    'radar.filter.ariaMineral': 'Tapis mineral',
    'radar.filter.ariaCountry': 'Tapis negara',
    'radar.filter.ariaSearch': 'Carian syarikat atau mineral',
    'radar.filter.ariaTabs': 'Kategori direktori',
    'radar.loading': 'Memuatkan direktori…',
    'radar.empty.title': 'Tiada lead sepadan',
    'radar.empty.text':
      'Cuba longgarkan penapis, atau set semula untuk melihat seluruh direktori.',
    'radar.empty.reset': 'Set semula penapis',
    'radar.count': '{n} lead dipaparkan',
    'radar.countFiltered': '{n} lead dipaparkan (ditapis)',
    'radar.foot':
      'Kontak disaring di lapisan database dan hanya terbuka selepas tukar 1 token. Lead tidak tepat boleh dilapor untuk bayaran balik token.',
    'radar.card.commodity': 'Komoditi',
    'radar.card.volume': 'Volum',
    'radar.card.location': 'Lokasi',
    'radar.card.incoterms': 'Incoterms',
    'radar.card.contact': 'Kontak',
    'radar.card.phone': 'Telefon',
    'radar.card.email': 'E-mel',
    'radar.card.updated': 'Dikemas kini',
    'radar.card.unlock': 'Buka Kontak (1 Token)',
    'radar.card.unlocking': 'Membuka…',
    'radar.card.unlocked': '✓ Kontak Dibuka',
    'radar.card.flagged': 'Dilapor — dijeda',
    'radar.card.verified': '✓ Disahkan',
    'radar.card.maskedCompany': '████████ Co. Ltd',
    'radar.badge.buy': 'Pembeli',
    'radar.badge.sell': 'Pembekal',
    'radar.badge.process': 'PEMPROSESAN',

    /* ---------- How it works ---------- */
    'how.title': 'Cara Token Berfungsi',
    'how.sub':
      'Ekonomi token ringkas yang melindungi kedua-dua pihak dalam urusan niaga.',
    'how.step1.title': 'Daftar — 10 Token Percuma',
    'how.step1.text':
      'Cipta akaun percuma. Profil anda dikreditkan 10 token serta-merta oleh sistem — tiada kad kredit diperlukan.',
    'how.step2.title': 'Cari Lead',
    'how.step2.text':
      'Layari direktori pembeli & penjual langsung. Komoditi, volum, lokasi dan Incoterms sentiasa kelihatan.',
    'how.step3.title': 'Tukar 1 Token — Buka Kontak',
    'how.step3.text':
      'Jumpa padanan? Tukar 1 token untuk mendedahkan nama syarikat, orang kontak, telefon, e-mel dan alamat lombong.',
    'how.step4.title': 'Top-Up via CHIP Gateway',
    'how.step4.text':
      'Token habis? Bayar dengan selamat melalui FPX, kad atau e-dompet via CHIP. Lead tidak tepat boleh dilapor untuk bayaran balik token.',
    'how.ctaRegister': 'Daftar Percuma →',
    'how.ctaTopup': 'Top-Up Token →',

    /* ---------- Cara Berurusan ---------- */
    'deal.title': 'Cara Berurusan',
    'deal.sub': 'Telus dan berdokumen untuk penjual dan pembeli.',
    'deal.s1.title': '1. Enquiry',
    'deal.s1.text':
      'Hantar berat, gred/assay, lokasi, foto dan Incoterms ke',
    'deal.s2.title': '2. Assay & Sahkan',
    'deal.s2.text':
      'Minta assay XRF, sahkan spesifikasi, kuantiti dan jadual penghantaran.',
    'deal.s3.title': '3. Sebutharga Rasmi',
    'deal.s3.text':
      'Terima sebutharga rasmi FSG dengan syarat CIF/FOB dan pembayaran.',

    /* ---------- Minerals ---------- */
    'minerals.title': 'Mineral Fokus FSG',
    'minerals.sub':
      'Sembilan mineral dengan rujukan LME / LBMA / Fastmarkets. Empat daripadanya disuap secara langsung dari pasaran COMEX; lima lagi diniagakan OTC dan dipaparkan sebagai rujukan.',
    'minerals.calc': 'Kira Nilai →',
    'minerals.live': 'LIVE',
    'minerals.ref': 'Rujukan',
    'minerals.foot': 'Harga live dikemas kini',
    'minerals.footCoverage': '{n}/{total} mineral disuap langsung.',
    'minerals.unit.oz': '/ oz',
    'minerals.unit.kg': '/ kg',
    'minerals.unit.tonne': '/ tan',
    'minerals.rateLine': 'Kadar USD-MYR {rate} • {detail}',

    /* ---------- Footer ---------- */
    'footer.disclaimer': 'Penafian FSG:',
    'footer.liveText':
      'Harga pasaran dikemaskini secara langsung melalui API LME/Forex terkini',
    'footer.liveSuffix':
      '{n}/{total} mineral disuap langsung; yang lain ialah rujukan manual. Bukan nasihat pelaburan.',
    'footer.staleText':
      'Suapan langsung tidak dapat dihubungi buat masa ini — harga yang dipaparkan ialah nilai rujukan tersimpan dan mungkin tidak semasa. Sahkan sebelum berurusan. Bukan nasihat pelaburan.',
    'footer.stamp': '(kemas kini terakhir {stamp})',
    'footer.contact': 'Hubungi',
    'footer.links': 'Pautan footer',
    'footer.developed_by': 'Dibangunkan oleh',

    /* ---------- Modals ---------- */
    'auth.registerTitle': 'Cipta akaun percuma anda',
    'auth.loginTitle': 'Selamat kembali',
    'auth.registerSub': 'Akaun baharu bermula dengan 10 token percuma.',
    'auth.loginSub': 'Log masuk untuk membuka kunci lead dan urus token.',
    'auth.tabRegister': 'Daftar Percuma',
    'auth.tabLogin': 'Log Masuk',
    'auth.name': 'Nama penuh',
    'auth.namePlaceholder': 'Nama anda',
    'auth.email': 'E-mel',
    'auth.emailPlaceholder': 'anda@syarikat.com',
    'auth.password': 'Kata laluan',
    'auth.passwordNew': 'Sekurang-kurangnya 8 aksara',
    'auth.passwordExisting': 'Kata laluan anda',
    'auth.submitRegister': 'Daftar Percuma & Dapat 10 Token',
    'auth.submitLogin': 'Log Masuk',
    'auth.busy': 'Sila tunggu…',
    'auth.note':
      'Dengan teruskan, anda bersetuju dengan terma platform. Pembelian token diproses dengan selamat oleh CHIP Gateway.',
    'auth.close': 'Tutup',
    'auth.ariaCreate': 'Cipta akaun',
    'auth.ariaLogin': 'Log masuk',
    'auth.errPassword': 'Kata laluan mestilah sekurang-kurangnya 8 aksara.',
    'auth.errGeneric': 'Pengesahan gagal. Sila cuba lagi.',
    'radar.card.ariaUnlock': 'Daftar percuma untuk membuka kontak ini',

    /* ---------- Toasts ---------- */
    'toast.registered': 'Akaun dicipta. 10 token percuma telah ditambah ke baki anda.',
    'toast.verifyEmail': 'Akaun dicipta. Sila sahkan e-mel anda, kemudian log masuk.',
    'toast.welcomeBack': 'Selamat kembali.',
    'toast.signedOut': 'Anda telah log keluar.',
    'toast.unlocked': '1 Token Deducted. Lead Unlocked.',
    'toast.detailsReady': 'Butiran kontak tersedia.',
    'toast.insufficient': 'Baki token tidak mencukupi. Sila tambah nilai.',

    /* ---------- Common ---------- */
    'common.close': 'Tutup',
    'common.refresh': 'Muat semula',
  },

  en: {
    /* ---------- Header / nav ---------- */
    'nav.home': 'Home',
    'nav.radar': 'Prospect Radar',
    'nav.marketTool': 'Market Tool',
    'nav.contact': 'Contact',
    'nav.staffLogin': 'Staff Login',
    'nav.admin': 'Admin',
    'nav.corporate': 'Corporate',
    'nav.minerals': 'Minerals',
    'nav.requestQuote': 'Request Quote',
    'nav.login': 'Log In / Register',
    'nav.logout': 'Log Out',
    'nav.tokens': 'Tokens',
    'nav.themeDark': 'Dark',
    'nav.themeLight': 'Light',
    'nav.toLight': 'Switch to light mode',
    'nav.toDark': 'Switch to dark mode',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',
    'nav.mainMenu': 'Main menu',
    'nav.langSwitch': 'Switch language',

    /* ---------- Hero ---------- */
    'hero.kicker': 'SOMALILAND • AFRICA — LME / FASTMARKETS REF',
    'hero.titleA': 'Premium Strategic Minerals,',
    'hero.titleB': 'Professionally',
    'hero.titleC': 'Managed.',
    'hero.lead':
      'First Strategic Global Sdn Bhd supplies Copper, Titanium, Lithium, Coltan, Tantalum, Gold, Silver, Tin & Aluminium. Transparent reference pricing, XRF assay, and official quotations via',
    'hero.stat.minerals': 'FOCUS MINERALS',
    'hero.stat.lme': 'VERIFIED REF',
    'hero.stat.xrf': 'VERIFIED ASSAY',
    'hero.stat.incoterms': 'INCOTERMS',
    'hero.cta.browse': 'View Lead Directory',
    'hero.cta.register': 'Register Free & Get 10 Tokens',
    'hero.cta.marketTool': 'Open Market Tool',
    'hero.cta.minerals': 'View Minerals',

    /* ---------- Terminal Status ---------- */
    'terminal.title': 'Terminal Status',
    'terminal.active': 'Active',
    'terminal.reference': 'Reference',
    'terminal.rate': 'USD-MYR Rate',
    'terminal.live': 'live',
    'terminal.ref': 'reference',
    'terminal.updated': 'Updated',
    'terminal.notSynced': 'Not yet synced',
    'terminal.disclaimer': 'Prices subject to FSG confirmation.',
    'terminal.livePrices': 'Live Prices',
    'terminal.contactFsg': 'Contact FSG',

    /* ---------- Status badges ---------- */
    'status.live': '🔴 LIVE API ACTIVE',
    'status.manual': '⚠️ Manual reference',
    'status.loading': 'Loading prices…',
    'status.liveDetail': '{n}/{total} minerals fed live',
    'status.staticDetail': 'Live feed unreachable',
    'status.cacheDetail': 'Using last cached values',

    /* ---------- Radar Prospek ---------- */
    'radar.kicker': 'PROSPECT RADAR',
    'radar.title': 'Find buyers, suppliers & processors',
    'radar.sub':
      'Live B2B directory for strategic minerals — including smelters, processing plants and refineries. Browse free; contacts unlock with 1 token.',
    'radar.register': 'Register Free — 10 Tokens',
    'radar.tab.buy': 'Find Buyers',
    'radar.tab.sell': 'Find Suppliers',
    'radar.tab.process': 'Find Processing Plants',
    'radar.tab.all': 'All',
    'radar.tab.buyShort': 'Buyers',
    'radar.tab.sellShort': 'Suppliers',
    'radar.tab.processShort': 'Processing',
    'radar.tab.allShort': 'All',
    'radar.step1.title': 'Find companies',
    'radar.step1.text':
      'Filter by category, mineral and country. Every card is free to browse.',
    'radar.step2.title': 'Pull contacts',
    'radar.step2.text':
      'Spend 1 token to reveal company, contact person, phone, email and mine address.',
    'radar.step3.title': 'Database',
    'radar.step3.text':
      'Every lead is stored in a live database — not a static list.',
    'radar.metric.leads': 'ACTIVE LEADS',
    'radar.metric.leadsSub': 'all categories',
    'radar.metric.buyers': 'BUYERS',
    'radar.metric.buyersSub': 'active demand',
    'radar.metric.sellers': 'SUPPLIERS',
    'radar.metric.sellersSub': 'available supply',
    'radar.metric.processors': 'PROCESSING',
    'radar.metric.processorsSub': 'smelter / refinery',
    'radar.metric.countries': 'COUNTRIES',
    'radar.metric.countriesSub': 'source coverage',
    'radar.metric.commodities': 'COMMODITIES',
    'radar.metric.commoditiesSub': 'mineral types',
    'radar.filter.mineral': 'All minerals',
    'radar.filter.country': 'All countries',
    'radar.filter.search': 'Search company, mineral, region…',
    'radar.filter.reset': 'Reset',
    'radar.filter.ariaMineral': 'Filter by mineral',
    'radar.filter.ariaCountry': 'Filter by country',
    'radar.filter.ariaSearch': 'Search company or mineral',
    'radar.filter.ariaTabs': 'Directory category',
    'radar.loading': 'Loading directory…',
    'radar.empty.title': 'No matching leads',
    'radar.empty.text':
      'Try loosening the filters, or reset to see the whole directory.',
    'radar.empty.reset': 'Reset filters',
    'radar.count': '{n} leads shown',
    'radar.countFiltered': '{n} leads shown (filtered)',
    'radar.foot':
      'Contacts are masked at the database layer and only unlock after spending 1 token. Inaccurate leads can be reported for a token refund.',
    'radar.card.commodity': 'Commodity',
    'radar.card.volume': 'Volume',
    'radar.card.location': 'Location',
    'radar.card.incoterms': 'Incoterms',
    'radar.card.contact': 'Contact',
    'radar.card.phone': 'Phone',
    'radar.card.email': 'Email',
    'radar.card.updated': 'Updated',
    'radar.card.unlock': 'Unlock Contact (1 Token)',
    'radar.card.unlocking': 'Unlocking…',
    'radar.card.unlocked': '✓ Contact Unlocked',
    'radar.card.flagged': 'Reported — paused',
    'radar.card.verified': '✓ Verified',
    'radar.card.maskedCompany': '████████ Co. Ltd',
    'radar.badge.buy': 'Buyer',
    'radar.badge.sell': 'Supplier',
    'radar.badge.process': 'PROCESSING',

    /* ---------- How it works ---------- */
    'how.title': 'How Tokens Work',
    'how.sub':
      'A simple token economy that protects both sides of the trade.',
    'how.step1.title': 'Register — 10 Free Tokens',
    'how.step1.text':
      'Create a free account. Your profile is credited with 10 tokens instantly by the system — no credit card required.',
    'how.step2.title': 'Find Leads',
    'how.step2.text':
      'Browse the live buyer & seller directory. Commodity, volume, location and Incoterms are always visible.',
    'how.step3.title': 'Spend 1 Token — Unlock Contact',
    'how.step3.text':
      'Found a match? Spend 1 token to reveal the company name, contact person, phone, email and mine address.',
    'how.step4.title': 'Top-Up via CHIP Gateway',
    'how.step4.text':
      'Out of tokens? Pay securely with FPX, card or e-wallet via CHIP. Inaccurate leads can be reported for a token refund.',
    'how.ctaRegister': 'Register Free →',
    'how.ctaTopup': 'Top-Up Tokens →',

    /* ---------- How we trade ---------- */
    'deal.title': 'How We Trade',
    'deal.sub': 'Transparent and documented for both sellers and buyers.',
    'deal.s1.title': '1. Enquiry',
    'deal.s1.text':
      'Send weight, grade/assay, location, photos and Incoterms to',
    'deal.s2.title': '2. Assay & Verify',
    'deal.s2.text':
      'Request an XRF assay, confirm specifications, quantity and delivery schedule.',
    'deal.s3.title': '3. Official Quotation',
    'deal.s3.text':
      'Receive FSG\'s official quotation with CIF/FOB and payment terms.',

    /* ---------- Minerals ---------- */
    'minerals.title': 'FSG Focus Minerals',
    'minerals.sub':
      'Nine minerals with LME / LBMA / Fastmarkets references. Four are fed live from COMEX markets; the other five trade OTC and are shown as reference.',
    'minerals.calc': 'Calculate Value →',
    'minerals.live': 'LIVE',
    'minerals.ref': 'Reference',
    'minerals.foot': 'Live prices updated',
    'minerals.footCoverage': '{n}/{total} minerals fed live.',
    'minerals.unit.oz': '/ oz',
    'minerals.unit.kg': '/ kg',
    'minerals.unit.tonne': '/ tonne',
    'minerals.rateLine': 'USD-MYR rate {rate} • {detail}',

    /* ---------- Footer ---------- */
    'footer.disclaimer': 'FSG Disclaimer:',
    'footer.liveText':
      'Market prices are updated live via the latest LME/Forex API',
    'footer.liveSuffix':
      '{n}/{total} minerals fed live; the rest are manual reference. Not investment advice.',
    'footer.staleText':
      'The live feed is currently unreachable — displayed prices are stored reference values and may be stale. Verify before trading. Not investment advice.',
    'footer.stamp': '(last updated {stamp})',
    'footer.contact': 'Contact',
    'footer.links': 'Footer links',
    'footer.developed_by': 'Developed by',

    /* ---------- Modals ---------- */
    'auth.registerTitle': 'Create your free account',
    'auth.loginTitle': 'Welcome back',
    'auth.registerSub': 'New accounts start with 10 free tokens.',
    'auth.loginSub': 'Log in to unlock leads and manage tokens.',
    'auth.tabRegister': 'Register Free',
    'auth.tabLogin': 'Log In',
    'auth.name': 'Full name',
    'auth.namePlaceholder': 'Your name',
    'auth.email': 'Email',
    'auth.emailPlaceholder': 'you@company.com',
    'auth.password': 'Password',
    'auth.passwordNew': 'At least 8 characters',
    'auth.passwordExisting': 'Your password',
    'auth.submitRegister': 'Register Free & Get 10 Tokens',
    'auth.submitLogin': 'Log In',
    'auth.busy': 'Please wait…',
    'auth.note':
      'By continuing you agree to the platform terms. Token purchases are processed securely by CHIP Gateway.',
    'auth.close': 'Close',
    'auth.ariaCreate': 'Create account',
    'auth.ariaLogin': 'Log in',
    'auth.errPassword': 'Password must be at least 8 characters.',
    'auth.errGeneric': 'Authentication failed. Please try again.',
    'radar.card.ariaUnlock': 'Register free to unlock this contact',

    /* ---------- Toasts ---------- */
    'toast.registered': 'Account created. 10 free tokens have been added to your balance.',
    'toast.verifyEmail': 'Account created. Please verify your email, then log in.',
    'toast.welcomeBack': 'Welcome back.',
    'toast.signedOut': 'You have been logged out.',
    'toast.unlocked': '1 Token Deducted. Lead Unlocked.',
    'toast.detailsReady': 'Contact details are available.',
    'toast.insufficient': 'Insufficient Token Balance. Please Top-Up.',

    /* ---------- Common ---------- */
    'common.close': 'Close',
    'common.refresh': 'Refresh',
  },
}

export const LANGUAGES = [
  { code: 'bm', flag: '🇲🇾', label: 'BM', name: 'Bahasa Melayu' },
  { code: 'en', flag: '🇬🇧', label: 'EN', name: 'English' },
]
