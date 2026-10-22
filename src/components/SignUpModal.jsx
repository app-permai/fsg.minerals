import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'

/**
 * SignUpModal — shown when a guest clicks "Register Free",
 * "Register Free & Get 10 Tokens", or an unlock button in the
 * directory.
 *
 * The 10 welcome tokens are NOT credited here — they are inserted
 * by the handle_new_user trigger in migration 04, so the balance
 * cannot be forged by the client.
 */
export default function SignUpModal({ open, mode = 'register', onClose }) {
  const toast = useToast()
  const [tab, setTab] = useState(mode) // 'register' | 'login'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setTab(mode)
      setError(null)
    }
  }, [open, mode])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (tab === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      if (tab === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }, // read by handle_new_user
        })
        if (authError) throw authError

        if (data.session) {
          // Email confirmation disabled — user is logged in already.
          toast.success('Account created. 10 free tokens have been added to your balance.')
          onClose()
        } else {
          // Email confirmation enabled.
          toast.info('Account created. Please confirm your email, then log in.')
          setTab('login')
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        toast.success('Welcome back.')
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'register' ? 'Create an account' : 'Log in'}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {tab === 'register' ? 'Create your free account' : 'Welcome back'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tab === 'register'
                ? 'New accounts start with 10 free tokens.'
                : 'Log in to unlock leads and manage tokens.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ---- Tabs ---- */}
        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {['register', 'login'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setTab(m)
                setError(null)
              }}
              className={`rounded-lg py-2 transition ${
                tab === m ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              {m === 'register' ? 'Register Free' : 'Log In'}
            </button>
          ))}
        </div>

        {/* ---- Form ---- */}
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Full name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                placeholder="Your name"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              placeholder="you@company.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={tab === 'register' ? 8 : undefined}
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              placeholder={tab === 'register' ? 'At least 8 characters' : 'Your password'}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? 'Please wait…'
              : tab === 'register'
                ? 'Register Free & Get 10 Tokens'
                : 'Log In'}
          </button>

          <p className="text-center text-xs text-slate-400">
            By continuing you agree to the platform terms. Token purchases are
            processed securely by CHIP Gateway.
          </p>
        </form>
      </div>
    </div>
  )
}
