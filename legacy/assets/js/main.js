/* ============================================================
   FSG halaman korporat — grid mineral + ticker.

   Berubah berbanding versi asal:
   1. HARGA LIVE melalui Edge Function `market-rates` (COMEX + USD/MYR),
      dengan sandaran RPC `get_market_rates()` dan akhir sekali nilai
      rujukan dalam fail ini. Hanya 4 daripada 9 mineral ada suapan awam
      percuma; yang lain ditanda "Rujukan" — kami tidak berpura-pura.
   2. DWIBAHASA. Nama dan keterangan mineral mengikut bahasa aktif
      (window.FSG_I18N). Apabila bahasa bertukar, grid dilukis semula
      melalui peristiwa 'fsg:langchange'.
   ============================================================ */
(function () {
  'use strict';

  var OZ = 31.1035;
  var SUPABASE_URL = 'https://wjrlcbhmklodrtpuhprq.supabase.co';
  var ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmxjYmhta2xvZHJ0cHVocHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjIyODMsImV4cCI6MjEwODA5ODI4M30.y-Exdo9Aw9HPr57EvRglRvjQO072ZHcJZMNFiPBwHZQ';

  /* `price` = nilai rujukan USD per unit asal (sandaran terakhir). */
  var M = [
    { id: 'COPPER', rateId: 'COPPER', bm: 'Kuprum (Copper)', en: 'Copper', sym: 'COPPER / LME', unit: 'tonne', base: 'tan metrik', baseEn: 'metric tonne', price: 9520, desc: 'Katod & concentrate. Rujukan LME.', descEn: 'Cathode & concentrate. LME reference.' },
    { id: 'TITA', rateId: 'TITANIUM', bm: 'Titanium', en: 'Titanium', sym: 'TITANIUM SPONGE', unit: 'tonne', base: 'tan metrik', baseEn: 'metric tonne', price: 11500, desc: 'Sponge & ilmenite. Rujukan Fastmarkets.', descEn: 'Sponge & ilmenite. Fastmarkets reference.' },
    { id: 'LITH', rateId: 'LITHIUM', bm: 'Litium (LCE)', en: 'Lithium', sym: 'LITHIUM CARBONATE', unit: 'tonne', base: 'tan metrik', baseEn: 'metric tonne', price: 10800, desc: 'Lithium carbonate equivalent.', descEn: 'Lithium carbonate equivalent.' },
    { id: 'COLTAN', rateId: 'COLTAN', bm: 'Koltan (Coltan)', en: 'Coltan', sym: 'COLTAN', unit: 'kg', base: 'kg', baseEn: 'kg', price: 85, desc: 'Coltan tantalum-niobium.', descEn: 'Coltan tantalum-niobium.' },
    { id: 'TANT', rateId: 'TANTALUM', bm: 'Tantalum', en: 'Tantalum', sym: 'TANTALUM', unit: 'kg', base: 'kg', baseEn: 'kg', price: 185, desc: 'Tantalum concentrate.', descEn: 'Tantalum concentrate.' },
    { id: 'AURUM', rateId: 'AURUM', bm: 'Aurum', en: 'Gold', sym: 'AURUM / LBMA', unit: 'oz', base: 'oz troy', baseEn: 'troy oz', price: 2675, desc: 'Rujukan LBMA. Assay penuh.', descEn: 'LBMA reference. Full assay.' },
    { id: 'SILVER', rateId: 'SILVER', bm: 'Perak (Silver)', en: 'Silver', sym: 'SILVER / COMEX', unit: 'oz', base: 'oz troy', baseEn: 'troy oz', price: 31.8, desc: 'Rujukan COMEX.', descEn: 'COMEX reference.' },
    { id: 'TIN', rateId: 'TIN', bm: 'Timah (Tin)', en: 'Tin', sym: 'TIN / LME', unit: 'tonne', base: 'tan metrik', baseEn: 'metric tonne', price: 32200, desc: 'Rujukan LME.', descEn: 'LME reference.' },
    { id: 'ALU', rateId: 'ALUMINIUM', bm: 'Aluminium', en: 'Aluminium', sym: 'ALUMINIUM / LME', unit: 'tonne', base: 'tan metrik', baseEn: 'metric tonne', price: 2620, desc: 'Rujukan LME.', descEn: 'LME reference.' },
  ];

  var REF = M.map(function (m) { return m.price; });

  function lang() {
    return window.FSG_I18N ? window.FSG_I18N.lang : 'bm';
  }
  function tr(key, vars) {
    return window.FSG_I18N ? window.FSG_I18N.t(key, vars) : key;
  }
  function nameOf(m) { return lang() === 'en' ? m.en : m.bm; }
  function descOf(m) { return lang() === 'en' ? m.descEn : m.desc; }
  function baseOf(m) { return lang() === 'en' ? m.baseEn : m.base; }

  /** USD/kg daripada suapan -> USD per unit asal mineral. */
  function fromUsdPerKg(usdPerKg, unit) {
    if (unit === 'oz') return usdPerKg * 0.0311034768;
    if (unit === 'kg') return usdPerKg;
    return usdPerKg * 1000;
  }

  function money(usd, unit) {
    var dp = unit === 'oz' ? 2 : 0;
    return '$' + Number(usd).toLocaleString('en-US', {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });
  }

  var state = { live: false, liveCount: 0, total: 0, usdMyr: 0, fxLive: false, updatedAt: null };

  function applyPayload(p) {
    if (!p || !Array.isArray(p.rates) || !p.rates.length) return false;
    var byId = {};
    p.rates.forEach(function (r) { byId[r.mineral_id] = r; });

    var liveCount = 0;
    M.forEach(function (m, i) {
      var r = byId[m.rateId];
      if (r && r.is_live && Number(r.price_usd_kg) > 0) {
        m.price = fromUsdPerKg(Number(r.price_usd_kg), m.unit);
        m.live = true;
        m.provider = r.provider || null;
        liveCount++;
      } else {
        m.price = REF[i];
        m.live = false;
        m.provider = r ? r.provider || null : null;
      }
    });

    state.live = !!p.live;
    state.liveCount = p.live_count != null ? Number(p.live_count) : liveCount;
    state.total = p.rates.length;
    state.usdMyr = Number(p.usd_myr) || 0;
    state.fxLive = !!p.fx_live;
    state.updatedAt = p.updated_at || null;
    return true;
  }

  function loadFeed() {
    var headers = { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY };
    return fetch(SUPABASE_URL + '/functions/v1/market-rates', { headers: headers })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (applyPayload(j)) return true;
        return fetch(SUPABASE_URL + '/rest/v1/rpc/get_market_rates', {
          method: 'POST',
          headers: {
            apikey: ANON_KEY,
            Authorization: 'Bearer ' + ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: '{}',
        })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j2) { return applyPayload(j2); });
      })
      .catch(function () {
        /* Nilai rujukan kekal — jujur: tiada suapan. */
        state.live = false;
        M.forEach(function (m, i) { m.price = REF[i]; m.live = false; });
        return false;
      });
  }

  function card(m) {
    var badge = m.live
      ? '<span class="livepill">' + (lang() === 'en' ? 'LIVE' : 'LIVE') + '</span>'
      : '<span class="refpill">' + (lang() === 'en' ? 'Reference' : 'Rujukan') + '</span>';
    return (
      '<div class="card">' +
      '<div class="sym">' + m.sym + '</div>' +
      '<h3>⭐ ' + nameOf(m) + '</h3>' +
      '<p>' + descOf(m) + '</p>' +
      '<p><b>' + money(m.price, m.unit) + '</b> / ' + baseOf(m) + ' ' + badge + '</p>' +
      '<a class="btn" href="market-tool.html">' +
      (lang() === 'en' ? 'Calculate Value →' : 'Kira Nilai →') +
      '</a></div>'
    );
  }

  function renderGrid() {
    var g = document.getElementById('minGrid');
    if (g) g.innerHTML = M.map(card).join('');
  }

  function renderTicker() {
    var el = document.getElementById('tick');
    if (!el) return;
    var h = M.map(function (m) {
      return '⭐ ' + nameOf(m) + ': ' + money(m.price, m.unit) +
        (m.live ? ' LIVE' : '');
    }).join(' • ');
    el.textContent = h + ' • ' + h;
  }

  function renderStatus() {
    var el = document.getElementById('statusLine');
    if (!el) return;
    var stamp = state.updatedAt
      ? new Date(state.updatedAt).toLocaleString(lang() === 'en' ? 'en-GB' : 'ms-MY')
      : '—';
    var status = state.live
      ? tr('status.liveDetail', { n: state.liveCount, total: state.total })
      : (state.updatedAt ? tr('status.cached') : tr('status.manual'));
    el.textContent = tr('corp.rateLine', {
      rate: state.usdMyr ? state.usdMyr.toFixed(4) : '—',
      stamp: stamp,
      status: status,
    });
  }

  function renderAll() {
    renderGrid();
    renderTicker();
    renderStatus();
  }

  document.addEventListener('fsg:langchange', renderAll);

  /* Lukis serta-merta dengan nilai rujukan supaya halaman tidak kosong,
     kemudian muat semula dengan suapan sebenar. */
  M.forEach(function (m) { m.live = false; });
  renderAll();

  loadFeed().then(function () {
    renderAll();
    /* Segar semula setiap 5 minit, sama seperti SPA. */
    setInterval(function () {
      loadFeed().then(renderAll);
    }, 5 * 60 * 1000);
  });

  window.FSG_MARKET = { state: state, minerals: M, refresh: function () { return loadFeed().then(renderAll); } };
})();
