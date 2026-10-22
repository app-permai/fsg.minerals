import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'

/**
 * SignUpModal — modal Log In / Register dalam gaya korporat
 * hijau/putih (kad putih, tajuk serif, butang hijau).
 *
 * 10 token aluan TIDAK dikreditkan di sini — ia dimasukkan oleh
 * trigger handle_new_user di migration 04, jadi baki permulaan
 * tidak boleh dipalsukan oleh klien.
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
      setError('Kata laluan mestilah sekurang-kurangnya 8 aksara.')
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
          toast.success('Akaun dicipta. 10 token percuma telah ditambah ke baki anda.')
          onClose()
        } else {
          toast.info('Akaun dicipta. Sila sahkan e-mel anda, kemudian log masuk.')
          setTab('login')
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        toast.success('Selamat kembali.')
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Pengesahan gagal. Sila cuba lagi.')
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
      aria-label={tab === 'register' ? 'Cipta akaun' : 'Log masuk'}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mclose" onClick={onClose} aria-label="Tutup">
          ✕
        </button>

        <h2>{tab === 'register' ? 'Cipta akaun percuma anda' : 'Selamat kembali'}</h2>
        <p className="msub">
          {tab === 'register'
            ? 'Akaun baharu bermula dengan 10 token percuma.'
            : 'Log masuk untuk membuka kunci lead dan urus token.'}
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
            Register Free
          </button>
          <button
            type="button"
            className={tab === 'login' ? 'on' : ''}
            onClick={() => {
              setTab('login')
              setError(null)
            }}
          >
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <>
              <label htmlFor="su-name">Nama penuh</label>
              <input
                id="su-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Nama anda"
              />
            </>
          )}

          <label htmlFor="su-email">E-mel</label>
          <input
            id="su-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="anda@syarikat.com"
          />

          <label htmlFor="su-pass">Kata laluan</label>
          <input
            id="su-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={tab === 'register' ? 8 : undefined}
            autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
            placeholder={tab === 'register' ? 'Sekurang-kurangnya 8 aksara' : 'Kata laluan anda'}
          />

          {error && <div className="merr">{error}</div>}

          <button
            type="submit"
            className="btn primary"
            style={{ width: '100%', marginTop: 16 }}
            disabled={busy}
          >
            {busy ? 'Sila tunggu…' : tab === 'register' ? 'Register Free & Get 10 Tokens' : 'Log In'}
          </button>
        </form>

        <p className="mnote">
          Dengan teruskan, anda bersetuju dengan terma platform. Pembelian token
          diproses dengan selamat oleh CHIP Gateway.
        </p>
      </div>
    </div>
  )
}
