import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import { useLang } from '../i18n/LanguageContext'

/**
 * SignUpModal — modal Log In / Register dalam gaya korporat
 * hijau/putih (kad putih, tajuk serif, butang hijau).
 *
 * 10 token aluan TIDAK dikreditkan di sini — ia dimasukkan oleh
 * trigger handle_new_user di migration 04, jadi baki permulaan
 * tidak boleh dipalsukan oleh klien.
 *
 * Semua teks melalui t(); ralat Supabase (yang datang dari pelayan)
 * dipaparkan seperti biasa kerana ia mesej teknikal, bukan prosa UI.
 */
export default function SignUpModal({ open, mode = 'register', onClose }) {
  const toast = useToast()
  const { t } = useLang()
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
      setError(t('auth.errPassword'))
      return
    }

    setBusy(true)
    try {
      if (tab === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }, // dibaca oleh handle_new_user
        })
        if (authError) throw authError

        if (data.session) {
          toast.success(t('toast.registered'))
          onClose()
        } else {
          toast.info(t('toast.verifyEmail'))
          setTab('login')
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        toast.success(t('toast.welcomeBack'))
        onClose()
      }
    } catch (err) {
      setError(err.message || t('auth.errGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'register' ? t('auth.ariaCreate') : t('auth.ariaLogin')}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mclose" onClick={onClose} aria-label={t('common.close')}>
          ✕
        </button>

        <h2>{tab === 'register' ? t('auth.registerTitle') : t('auth.loginTitle')}</h2>
        <p className="msub">
          {tab === 'register' ? t('auth.registerSub') : t('auth.loginSub')}
        </p>

        <div className="tabs">
          <button
            type="button"
            className={tab === 'register' ? 'on' : ''}
            onClick={() => {
              setTab('register')
              setError(null)
            }}
          >
            {t('auth.tabRegister')}
          </button>
          <button
            type="button"
            className={tab === 'login' ? 'on' : ''}
            onClick={() => {
              setTab('login')
              setError(null)
            }}
          >
            {t('auth.tabLogin')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <>
              <label htmlFor="su-name">{t('auth.name')}</label>
              <input
                id="su-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                placeholder={t('auth.namePlaceholder')}
              />
            </>
          )}

          <label htmlFor="su-email">{t('auth.email')}</label>
          <input
            id="su-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
          />

          <label htmlFor="su-pass">{t('auth.password')}</label>
          <input
            id="su-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={tab === 'register' ? 8 : undefined}
            autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
            placeholder={
              tab === 'register' ? t('auth.passwordNew') : t('auth.passwordExisting')
            }
          />

          {error && <div className="merr">{error}</div>}

          <button
            type="submit"
            className="btn primary"
            style={{ width: '100%', marginTop: 16 }}
            disabled={busy}
          >
            {busy
              ? t('auth.busy')
              : tab === 'register'
                ? t('auth.submitRegister')
                : t('auth.submitLogin')}
          </button>
        </form>

        <p className="mnote">{t('auth.note')}</p>
      </div>
    </div>
  )
}
