import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { MINERALS } from './minerals'

/**
 * Header — susun atur korporat:
 * logo bumi + nama syarikat + no. SSM + lencana "Global Minerals
 * Supply Chain", nav utama (Home / Radar Prospek / Market Tool /
 * Contact), tindakan sekunder (Log Masuk / Daftar, lencana token,
 * Minta Sebutharga), toggle Cerah/Gelap, dan ticker harga hijau.
 *
 * Pautan korporat kurang kritikal (Minerals, Corporate) dipindahkan
 * ke Footer supaya header kekal seimbang.
 *
 * Mudah alih (<768px): nav utama + tindakan sekunder dikumpul ke
 * dalam panel hamburger. Ticker kekal satu baris dan menatal.
 */
const PRIMARY_NAV = [
  { href: '/', label: 'Home' },
  { href: '#marketplace', label: 'Radar Prospek' },
  { href: '/market-tool.html', label: 'Market Tool' },
  { href: '/contact.html', label: 'Contact' },
]

function readTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export default function Header({ onLogin, onTopUp, onRequestQuote }) {
  const { user, tokenBalance } = useAuth()
  const toast = useToast()
  const [theme, setTheme] = useState(readTheme)
  const [menuOpen, setMenuOpen] = useState(false)

  const tickerText =
    MINERALS.map((m) => `⭐ ${m.bm}: ${m.price}`).join(' • ') + ' • '

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
    toast.info('Anda telah log keluar.')
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
    if (meta) meta.setAttribute('content', next === 'dark' ? '#0A1410' : '#F6F7F6')
  }

  const dark = theme === 'dark'

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
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="bars" aria-hidden="true">
            <i /><i /><i />
          </span>
        </button>

        <nav
          id="primary-nav"
          className={menuOpen ? 'menu open' : 'menu'}
          aria-label="Menu utama"
        >
          <div className="menu-links">
            {PRIMARY_NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={n.href === '/' ? 'active' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {n.label}
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
                  🪙 {tokenBalance ?? '—'} Tokens
                </button>
                <button type="button" onClick={handleSignOut} title={user.email}>
                  Log Keluar
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
                Log Masuk / Daftar
              </button>
            )}

            {/* Toggle Cerah/Gelap asal — lalai cerah */}
            <button
              type="button"
              className="theme-toggle"
              data-theme-toggle
              onClick={toggleTheme}
              aria-pressed={dark}
              aria-label={dark ? 'Tukar ke mod cerah' : 'Tukar ke mod gelap'}
              title={dark ? 'Tukar ke mod cerah' : 'Tukar ke mod gelap'}
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
                <span className="tt-dark">Gelap</span>
                <span className="tt-light">Cerah</span>
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
              Minta Sebutharga
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
