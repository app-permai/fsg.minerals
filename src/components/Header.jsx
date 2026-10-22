import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { MINERALS } from './minerals'

/**
 * Header — susun atur asal laman korporat:
 * logo bumi + nama syarikat + no. SSM + lencana "Global Minerals
 * Supply Chain", menu (Home / Minerals / Market Tool / Contact),
 * butang "Minta Sebutharga" (hijau), toggle Cerah/Gelap, dan ticker
 * harga hijau.
 *
 * Integrasi backend tanpa mengubah rupa:
 *  - Tetamu: butang "Log Masuk / Daftar" (modal korporat putih/hijau).
 *  - Log masuk: lencana token EMAS (🪙 N Tokens) bersebelahan
 *    "Minta Sebutharga" — klik untuk top-up CHIP.
 *  - Toggle tema: lalai CERAH (putih korporat). Pilihan gelap
 *    menggunakan hijau hutan #0A1410, bukan biru navy SaaS.
 */
function readTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export default function Header({ onLogin, onTopUp }) {
  const { user, tokenBalance } = useAuth()
  const toast = useToast()
  const [theme, setTheme] = useState(readTheme)

  const tickerText =
    MINERALS.map((m) => `⭐ ${m.bm}: ${m.price}`).join(' • ') + ' • '

  async function handleSignOut() {
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
    if (meta) meta.setAttribute('content', next === 'dark' ? '#0A1410' : '#FFFFFF')
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

        <nav className="menu" aria-label="Menu utama">
          <a href="/" className="active">Home</a>
          <a href="/minerals.html">Minerals</a>
          <a href="/market-tool.html">Market Tool</a>
          <a href="/contact.html">Contact</a>

          {user ? (
            <>
              {/* Lencana token emas — baki langsung dari profiles.token_balance */}
              <button
                type="button"
                className="tokbadge"
                onClick={onTopUp}
                title="Baki token — klik untuk top-up CHIP"
              >
                🪙 {tokenBalance ?? '—'} Tokens
              </button>
              <button type="button" onClick={handleSignOut} title={user.email}>
                Log Keluar
              </button>
            </>
          ) : (
            <button type="button" className="authbtn" onClick={onLogin}>
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

          <a
            className="btn primary"
            href="mailto:info@fsgminerals.trade?subject=Sebutharga%20Mineral%20-%20FSG"
          >
            Minta Sebutharga
          </a>
        </nav>
      </div>

      {/* Ticker harga hijau (asal) */}
      <div className="ticker" aria-hidden="true">
        <span>{(tickerText + tickerText).slice(0, -3)}</span>
      </div>
    </header>
  )
}
