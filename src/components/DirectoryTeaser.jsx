import { useCallback, useEffect, useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

/**
 * DirectoryTeaser — "Latest Buyers & Sellers" sebagai KAD PUTIH
 * dengan sempadan hijau korporat (gaya laman asal).
 *
 * Medan awam: Komoditi, Volum, Lokasi, Incoterms, Dikemas Kini.
 * Nama syarikat & telefon disaring — dan bukan sekadar kosmetik:
 * get_public_listings memulangkan '••••••••' dari DATABASE untuk
 * lead yang belum dibuka kunci, jadi klien yang diubah pun tidak
 * dapat nilai sebenar.
 *
 * Butang setiap kad "Buka Maklumat (1 Token)" (butang hijau utama):
 *  - Tetamu     -> modal daftar (tiada panggilan RPC langsung)
 *  - Log masuk  -> RPC unlock_lead (1 token) -> toast
 *                  "1 Token Deducted. Lead Unlocked."
 *  - Baki 0     -> toast "Insufficient Token Balance. Please Top-Up."
 *                  + modal top-up CHIP terbuka automatik
 */
const MASKED_COMPANY = '████████ Co. Ltd'
const MASKED_PHONE = '+██ ████ ████'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SideTag({ side }) {
  const buy = side === 'buy'
  return (
    <span className={buy ? 'sidebadge buy' : 'sidebadge sell'}>
      {buy ? 'Buyer' : 'Seller'}
    </span>
  )
}

function UnlockAction({ lead, busy, onClick }) {
  if (lead.flagged) {
    return <span className="paused">Dilapor — dijeda</span>
  }
  if (lead.has_unlocked_contact) {
    return <span className="unlocked-pill">✓ Unlocked</span>
  }
  return (
    <button
      type="button"
      className="btn primary small"
      onClick={() => onClick(lead)}
      disabled={busy === lead.id}
    >
      {busy === lead.id ? 'Membuka…' : 'Buka Maklumat (1 Token)'}
    </button>
  )
}

export default function DirectoryTeaser({ onRequireAuth, onTopUp }) {
  const { user, refreshBalance } = useAuth()
  const toast = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('get_public_listings', {
      p_limit: 6,
      p_offset: 0,
    })
    if (rpcError) {
      // Lapisan database belum diaktifkan (migrasi belum dijalankan)
      // -> papar keadaan "akan datang" yang kemas, bukan ralat.
      const notReady = /PGRST202|Could not find|get_public_listings|schema cache|does not exist|Tediously/i.test(
        rpcError.message || ''
      )
      if (notReady) {
        setError(null)
        setLeads([])
      } else {
        setError(rpcErrorMessage(rpcError))
      }
    } else {
      setError(null)
      setLeads(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /* ---------- Tier-1 unlock, terikat kepada RPC unlock_lead ---------- */
  async function handleUnlock(lead) {
    if (!user) {
      onRequireAuth() // tetamu mesti daftar dahulu
      return
    }
    setBusy(lead.id)
    try {
      const { data, error: rpcError } = await supabase.rpc('unlock_lead', {
        p_lead_id: lead.id,
      })
      if (rpcError) throw rpcError

      if (data.status === 'unlocked') {
        // Mesej toast yang diwajibkan:
        toast.success('1 Token Deducted. Lead Unlocked.')
      } else {
        // already_unlocked / own_listing — tiada caj.
        toast.info('Butiran lead tersedia.')
      }

      await refreshBalance()
      await load()

      // Baki mencecah 0 -> tawarkan top-up CHIP secara proaktif.
      if (typeof data.token_balance === 'number' && data.token_balance <= 0) {
        onTopUp()
      }
    } catch (err) {
      // Mesej toast yang diwajibkan (via rpcErrorMessage):
      toast.error(rpcErrorMessage(err))
      if (String(err?.message || '').includes('INSUFFICIENT_TOKEN_BALANCE')) {
        onTopUp()
      }
    } finally {
      setBusy(null)
    }
  }

  function renderCard(lead) {
    const unlocked = !!lead.has_unlocked_contact
    const location =
      [lead.region, lead.country].filter(Boolean).join(', ') || '—'

    return (
      <article className="leadcard" key={lead.id}>
        <div className="lc-top">
          <SideTag side={lead.side} />
          {lead.verified && !lead.flagged && (
            <span className="vcheck">✓ Disahkan</span>
          )}
        </div>

        <h3 className={`lc-co${unlocked ? '' : ' masked'}`}>
          {unlocked ? lead.company_name || '—' : MASKED_COMPANY}
        </h3>
        <div className={`lc-phone${unlocked ? '' : ' masked'}`}>
          {unlocked ? lead.phone || '—' : MASKED_PHONE}
        </div>

        <div className="lc-meta">
          <div>
            <span className="k">Komoditi</span>
            <span className="v">{lead.mineral_type || '—'}</span>
          </div>
          <div>
            <span className="k">Volum</span>
            <span className="v">{lead.quantity_available || '—'}</span>
          </div>
          <div>
            <span className="k">Lokasi</span>
            <span className="v">{location}</span>
          </div>
          <div>
            <span className="k">Incoterms</span>
            <span className="v">{lead.incoterms || '—'}</span>
          </div>
        </div>

        <div className="lc-date">Dikemas kini: {fmtDate(lead.updated_at)}</div>

        <div className="lc-action">
          <UnlockAction lead={lead} busy={busy} onClick={handleUnlock} />
        </div>
      </article>
    )
  }

  return (
    <section id="marketplace" className="dir-section">
      <h2 className="sec-title">Latest Buyers &amp; Sellers</h2>
      <p className="sec-sub">
        Direktori langsung bekalan &amp; permintaan mineral disahkan. Nama syarikat
        dan butiran kontak kekal disaring di lapisan database sehingga dibuka
        dengan 1 token.
      </p>

      {loading && (
        <div className="leadstate">Memuatkan direktori lead…</div>
      )}

      {error && (
        <div className="card" style={{ borderColor: '#F3C6C6' }}>
          <p style={{ color: '#8C2F2F', fontWeight: 700 }}>{error}</p>
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <div className="dirwrap empty-dir">
          <div className="eb">Direktori lead akan muncul di sini</div>
          <p>
            Listing pembeli &amp; penjual baharu sedang disediakan. Daftar percuma
            sekarang — anda akan menerima 10 token untuk membuka kunci kontak
            pertama anda.
          </p>
          <button type="button" className="btn primary" onClick={onRequireAuth}>
            Register Free &amp; Get 10 Tokens
          </button>
        </div>
      )}

      {!loading && !error && leads.length > 0 && (
        <>
          <div className="leadgrid">{leads.map(renderCard)}</div>

          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 14 }}>
            Butiran kontak disaring di lapisan database dan hanya terbuka selepas
            tukar 1 token. Lead tidak tepat boleh dilapor untuk bayaran balik
            token.
          </p>
        </>
      )}
    </section>
  )
}
