import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { MINERALS, mineralName } from './minerals'
import { useMarketRates, priceIn } from '../lib/marketRates'
import { useLang } from '../i18n/LanguageContext'
import { LANGUAGES } from '../i18n/dictionary'

/**
 * Header — susun atur korporat:
 * logo bumi + nama syarikat + no. SSM + lencana "Global Minerals
 * Supply Chain", nav utama (Home / Radar Prospek / Market Tool /
 * Contact), tindakan sekunder (Log Masuk / Daftar, lencana token,
 * Minta Sebutharga), suis bahasa BM/EN, toggle Cerah/Gelap, dan
 * ticker harga hijau.
 *
 * Semua teks melalui t() daripada LanguageContext — tiada lagi teks
 * BM terkunci di dalam JSX.
 *
 * Pautan korporat kurang kritikal (Minerals, Corporate) dipindahkan
 * ke Footer supaya header kekal seimbang.
 *
 * Mudah alih (<768px): nav utama + tindakan sekunder dikumpul ke
 * dalam panel hamburger. Ticker kekal satu baris dan menatal.
 */
const PRIMARY_NAV = [
  { href: '/', key: 'nav.home' },
  { href: '#marketplace', key: 'nav.radar' },
  { href: '/market-tool.html', key: 'nav.marketTool' },
  { href: '/contact.html', key: 'nav.contact' },
]

function readTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export default function Header({ onLogin, onTopUp, onRequestQuote }) {
  const { user, tokenBalance } = useAuth()
  const toast = useToast()
  const { lang, setLang, t } = useLang()
  const [theme, setTheme] = useState(readTheme)
  const [menuOpen, setMenuOpen] = useState(false)

  /* Harga pasaran langsung — melalui Edge Function + cache DB. */
  const { data: market } = useMarketRates({ pollMs: 5 * 60 * 1000 })

  const byId = new Map(market.rates.map((r) => [r.id, r]))
  const tickerText =
    MINERALS.map((m) => {
      const live = byId.get(m.rateId)
      const name = mineralName(m, lang)
      if (live?.isLive) {
        const v = priceIn(live.usdPerKg, m.unit)
        const dp = m.unit === 'oz' ? 2 : 0
        const s = v.toLocaleString('en-US', {
          minimumFractionDigits: dp,
          maximumFractionDigits: dp,
        })
        return `⭐ ${name}: $${s}`
      }
      return `⭐ ${name}: ${m.price}`
    }).join(' • ') + ' • '

  /* Tutup panel apabila viewport melebar melepasi breakpoint mudah alih. */
  useEffect(() => {
    if (!menuOpen) return
    const mq = window.matchMedia('(min-width: 768px)')
    const close = () => setMenuOpen(false)
    mq.addEventListener('change', close)
    return () => mq.removeEventListener('change', close)
  }, [menuOpen])

  async function handleSignOut() {
    setMenuOpen(false)
    await supabase.auth.signOut()
    toast.info(t('toast.signedOut'))
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('fsg-theme', next)
    } catch (e) {
      /* mod peribadi */
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', next === 'dark' ? '#0A1410' : '#F4F6F5')
  }

  const dark = theme === 'dark'
  const themeLabel = dark ? t('nav.toLight') : t('nav.toDark')

  return (
    <header className="site">
      <div className="container nav">
        <a className="brandbox" href="/">
          <img
            src="/assets/fsg-globe.jpg"
            alt="Logo bumi FSG"
            className="brand-logo"
            onError={(e) => (e.target.style.display = 'none')}
          />
          <span>
            <span className="company-name">First Strategic Global Sdn. Bhd.</span>
            <div className="reg-number">202601003838 (1665935-K)</div>
            <span className="tagline">Global Minerals Supply Chain</span>
          </span>
        </a>

        <button
          type="button"
          className="navtoggle"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="bars" aria-hidden="true">
            <i /><i /><i />
          </span>
        </button>

        <nav
          id="primary-nav"
          className={menuOpen ? 'menu open' : 'menu'}
          aria-label={t('nav.mainMenu')}
        >
          <div className="menu-links">
            {PRIMARY_NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={n.href === '/' ? 'active' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {t(n.key)}
              </a>
            ))}
          </div>

          <div className="menu-actions">
            {user ? (
              <>
                {/* Lencana token emas — baki langsung dari profiles.token_balance */}
                <button
                  type="button"
                  className="tokbadge"
                  onClick={() => {
                    setMenuOpen(false)
                    onTopUp()
                  }}
                  title="Baki token — klik untuk top-up CHIP"
                >
                  🪙 {tokenBalance ?? '—'} {t('nav.tokens')}
                </button>
                <button type="button" onClick={handleSignOut} title={user.email}>
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="authbtn"
                onClick={() => {
                  setMenuOpen(false)
                  onLogin()
                }}
              >
                {t('nav.login')}
              </button>
            )}

            {/* Suis bahasa BM / EN */}
            <div
              className="lang-toggle"
              role="group"
              aria-label={t('nav.langSwitch')}
              title={t('nav.langSwitch')}
            >
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={lang === l.code ? 'lang-btn on' : 'lang-btn'}
                  aria-pressed={lang === l.code}
                  lang={l.code === 'bm' ? 'ms' : 'en'}
                  onClick={() => {
                    setMenuOpen(false)
                    setLang(l.code)
                  }}
                >
                  <span aria-hidden="true">{l.flag}</span> {l.label}
                </button>
              ))}
            </div>

            {/* Toggle Cerah/Gelap asal — lalai cerah */}
            <button
              type="button"
              className="theme-toggle"
              data-theme-toggle
              onClick={toggleTheme}
              aria-pressed={dark}
              aria-label={themeLabel}
              title={themeLabel}
            >
              <svg
                className="i-moon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
              <svg
                className="i-sun"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
              <span className="tt-label">
                <span className="tt-dark">{t('nav.themeDark')}</span>
                <span className="tt-light">{t('nav.themeLight')}</span>
              </span>
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setMenuOpen(false)
                onRequestQuote()
              }}
            >
              {t('nav.requestQuote')}
            </button>
          </div>
        </nav>
      </div>

      {/* Ticker harga hijau (asal) */}
      <div className="ticker" aria-hidden="true">
        <span>{(tickerText + tickerText).slice(0, -3)}</span>
      </div>
    </header>
  )
}
