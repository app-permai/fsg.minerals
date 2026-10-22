/* FSG Theme switcher — simpan pilihan dalam localStorage ('fsg-theme'). */
(function () {
  var KEY = 'fsg-theme';
  var root = document.documentElement;
  var COLORS = { light: '#FFFFFF', dark: '#0A1410' };

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* mod peribadi */ }
  }

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function paint(theme) {
    var dark = theme === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COLORS[dark ? 'dark' : 'light']);

    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', dark ? 'true' : 'false');
      buttons[i].setAttribute('aria-label', dark ? 'Tukar ke mod cerah' : 'Tukar ke mod gelap');
      buttons[i].setAttribute('title', dark ? 'Tukar ke mod cerah' : 'Tukar ke mod gelap');
    }

    try {
      document.dispatchEvent(new CustomEvent('fsg:themechange', { detail: { theme: dark ? 'dark' : 'light' } }));
    } catch (e) { /* pelayar lama */ }
  }

  function set(theme, persist) {
    theme = theme === 'dark' ? 'dark' : 'light';
    if (persist) write(theme);
    paint(theme);
  }

  function bind() {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].getAttribute('data-bound')) continue;
      buttons[i].setAttribute('data-bound', '1');
      buttons[i].addEventListener('click', function () {
        set(current() === 'dark' ? 'light' : 'dark', true);
      });
    }
    paint(read() === 'dark' ? 'dark' : current());
  }

  window.addEventListener('storage', function (e) {
    if (e.key === KEY) set(e.newValue === 'dark' ? 'dark' : 'light', false);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
