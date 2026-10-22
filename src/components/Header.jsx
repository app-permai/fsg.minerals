import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

/**
 * Header — marketplace navigation + auth.
 *
 *  - Guests:        "Log In" + "Register Free" buttons
 *  - Logged in:     dynamic token balance badge (🪙 N Tokens)
 *                   — clicking it opens the CHIP top-up modal
 *  - Navigation:    Marketplace / Submit RFQ / How It Works
 *                   (hash anchors on the homepage; adjust hrefs if
 *                   you mount the header on other routes)
 */
export default function Header({ onLogin, onRegister, onTopUp }) {
  const { user, tokenBalance } = useAuth()
  const toast = useToast()
  const [menuOpen, setMenuOpen] = useState(false)

  const NAV = [
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'Submit RFQ', href: '#rfq' },
    { label: 'How It Works', href: '#how-it-works' },
  ]

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.info('Logged out.')
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* ---- Brand ---- */}
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-black tracking-tight text-amber-400">
            FG
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            FSG Minerals<span className="text-amber-500">.trade</span>
          </span>
        </a>

        {/* ---- Desktop navigation ---- */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ---- Auth / token balance ---- */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <button
                type="button"
                onClick={onTopUp}
                title="Top-up tokens via CHIP Gateway"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
              >
                🪙 {tokenBalance ?? '—'} Tokens
              </button>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
                title={user.email}
              >
                {(profileInitial(user) || 'U').toUpperCase()}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onLogin}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={onRegister}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Register Free
              </button>
            </>
          )}
        </div>

        {/* ---- Mobile hamburger ---- */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d={menuOpen ? 'M6 6l12 12M6 18L18 6' : 'M4 7h16M4 12h16M4 17h16'} />
          </svg>
        </button>
      </div>

      {/* ---- Mobile menu panel ---- */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onTopUp()
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-bold text-amber-900"
                >
                  🪙 {tokenBalance ?? '—'} Tokens — Top-Up
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onRegister()
                  }}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Register Free
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onLogin()
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function profileInitial(user) {
  return (
    user.user_metadata?.full_name?.trim()?.[0] ||
    user.email?.[0] ||
    ''
  )
}
