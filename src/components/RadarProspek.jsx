import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

/**
 * RadarProspek — modul carian pembeli / pembekal / pengilang ("Radar Prospek").
 *
 * Tiga langkah yang dipaparkan kepada pelawat:
 *   1. Cari syarikat   — direktori boleh ditapis (kategori, mineral, negara, carian)
 *   2. Tarik kontak    — 1 token membuka nama syarikat, kontak, telefon,
 *                        e-mel dan alamat lombong
 *   3. Database        — metrik langsung: bilangan pembeli, negara, komoditi
 *
 * Keselamatan: medan sensitif disaring DI LAPISAN DATABASE oleh
 * get_radar_listings (public.mask_secret). Klien yang diubah tidak
 * dapat membaca nilai sebenar sebelum membayar token — paparan
 * '••••••••' di bawah hanyalah cermin bagi nilai yang memang sudah
 * disaring sebelum sampai ke pelayar.
 *
 * Tetamu boleh melayari seluruh direktori secara percuma. Menekan
 * mana-mana medan bertopeng atau butang buka kunci akan membuka
 * modal daftar (10 token percuma dikredit oleh trigger database).
 */
const MASKED = '••••••••'

const SIDE_TABS = [
  { key: 'buy', label: 'Cari Pembeli', short: 'Pembeli' },
  { key: 'sell', label: 'Cari Pembekal', short: 'Pembekal' },
  { key: 'process', label: 'Cari Pengilang Pemprosesan', short: 'Pemprosesan' },
  { key: null, label: 'Semua', short: 'Semua' },
]

/** Label + kelas lencana bagi setiap kategori direktori. */
const SIDE_BADGE = {
  buy: { label: 'Pembeli', cls: 'buy' },
  sell: { label: 'Pembekal', cls: 'sell' },
  process: { label: 'PEMPROSESAN', cls: 'process' },
}

const STEPS = [
  {
    n: '1',
    title: 'Cari syarikat',
    text: 'Tapis mengikut kategori, mineral dan negara. Semua kad boleh dilihat percuma.',
  },
  {
    n: '2',
    title: 'Tarik kontak',
    text: 'Tukar 1 token untuk mendedahkan syarikat, kontak, telefon, e-mel dan alamat lombong.',
  },
  {
    n: '3',
    title: 'Database',
    text: 'Setiap lead disimpan dalam pangkalan data langsung — bukan senarai statik.',
  },
]

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SideTag({ side }) {
  const b = SIDE_BADGE[side] || { label: side || '—', cls: 'sell' }
  return <span className={`sidebadge ${b.cls}`}>{b.label}</span>
}

/** Satu medan kontak; bertopeng = boleh diklik untuk membuka daftar. */
function ContactRow({ label, value, locked, onLockedClick }) {
  return (
    <div className="rp-contact">
      <span className="k">{label}</span>
      {locked ? (
        <button
          type="button"
          className="v masked-val"
          onClick={onLockedClick}
          title="Daftar percuma untuk membuka kontak ini"
        >
          {MASKED}
        </button>
      ) : (
        <span className="v">{value || '—'}</span>
      )}
    </div>
  )
}

function MetricCard({ value, label, sub }) {
  return (
    <div className="rp-metric">
      <strong>{value ?? '—'}</strong>
      <span className="m-label">{label}</span>
      {sub && <span className="m-sub">{sub}</span>}
    </div>
  )
}

export default function RadarProspek({ onRequireAuth, onTopUp }) {
  const { user, refreshBalance } = useAuth()
  const toast = useToast()

  const [side, setSide] = useState(null)
  const [mineral, setMineral] = useState('')
  const [country, setCountry] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [options, setOptions] = useState({ minerals: [], countries: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)

  /* ---------- metrik langsung ---------- */
  const loadStats = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('get_radar_stats')
    if (rpcError) return
    setStats(Array.isArray(data) ? data[0] || null : data || null)
  }, [])

  /* ---------- pilihan penapis (sekali sahaja, dari set penuh) ---------- */
  const loadOptions = useCallback(async () => {
    const { data } = await supabase.rpc('get_radar_listings', {
      p_side: null,
      p_mineral: null,
      p_country: null,
      p_search: null,
      p_limit: 100,
      p_offset: 0,
    })
    const rows = data || []
    const uniq = (key) =>
      [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b))
    setOptions({ minerals: uniq('mineral_type'), countries: uniq('country') })
  }, [])

  /* ---------- direktori ---------- */
  const loadLeads = useCallback(async () => {
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('get_radar_listings', {
      p_side: side,
      p_mineral: mineral || null,
      p_country: country || null,
      p_search: search || null,
      p_limit: 100,
      p_offset: 0,
    })
    if (rpcError) {
      setError(rpcErrorMessage(rpcError))
      setLeads([])
    } else {
      setError(null)
      setLeads(data || [])
    }
    setLoading(false)
  }, [side, mineral, country, search])

  useEffect(() => {
    loadStats()
    loadOptions()
  }, [loadStats, loadOptions])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  /* debounce carian */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  /* ---------- buka kunci (1 token) ---------- */
  async function handleUnlock(lead) {
    if (!user) {
      onRequireAuth()
      return
    }
    setBusy(lead.id)
    try {
      const { data, error: rpcError } = await supabase.rpc('unlock_lead', {
        p_lead_id: lead.id,
      })
      if (rpcError) throw rpcError

      if (data.status === 'unlocked') {
        toast.success('1 Token Deducted. Lead Unlocked.')
      } else {
        toast.info('Butiran kontak tersedia.')
      }

      await refreshBalance()
      await Promise.all([loadLeads(), loadStats()])

      if (typeof data.token_balance === 'number' && data.token_balance <= 0) {
        onTopUp()
      }
    } catch (err) {
      toast.error(rpcErrorMessage(err))
      if (String(err?.message || '').includes('INSUFFICIENT_TOKEN_BALANCE')) {
        onTopUp()
      }
    } finally {
      setBusy(null)
    }
  }

  const filtersActive = !!(side || mineral || country || search)

  function resetFilters() {
    setSide(null)
    setMineral('')
    setCountry('')
    setSearch('')
    setSearchInput('')
  }

  const metricCards = useMemo(() => {
    const s = stats || {}
    return [
      { value: s.total_leads, label: 'LEAD AKTIF', sub: 'semua kategori' },
      { value: s.buyer_count, label: 'PEMBELI', sub: 'permintaan aktif' },
      { value: s.seller_count, label: 'PEMBEKAL', sub: 'bekalan tersedia' },
      { value: s.processor_count, label: 'PEMPROSESAN', sub: 'smelter / refinery' },
      { value: s.country_count, label: 'NEGARA', sub: 'liputan sumber' },
      { value: s.commodity_count, label: 'KOMODITI', sub: 'jenis mineral' },
    ]
  }, [stats])

  function renderCard(lead) {
    const unlocked = !!lead.has_unlocked_contact
    const location = [lead.region, lead.country].filter(Boolean).join(', ') || '—'

    return (
      <article className="leadcard rp-card" key={lead.id}>
        <div className="lc-top">
          <SideTag side={lead.side} />
          {lead.verified && !lead.flagged && <span className="vcheck">✓ Disahkan</span>}
        </div>

        <h3 className="lc-title">{lead.title || '—'}</h3>

        <h4 className={`rp-co${unlocked ? '' : ' masked'}`}>
          {unlocked ? lead.company_name || '—' : '████████ Co. Ltd'}
        </h4>

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

        <div className="rp-contacts">
          <ContactRow
            label="Kontak"
            value={lead.contact_person}
            locked={!unlocked}
            onLockedClick={() => handleUnlock(lead)}
          />
          <ContactRow
            label="Telefon"
            value={lead.phone}
            locked={!unlocked}
            onLockedClick={() => handleUnlock(lead)}
          />
          <ContactRow
            label="E-mel"
            value={lead.email}
            locked={!unlocked}
            onLockedClick={() => handleUnlock(lead)}
          />
        </div>

        <div className="lc-date">Dikemas kini: {fmtDate(lead.updated_at)}</div>

        <div className="lc-action">
          {lead.flagged ? (
            <span className="paused">Dilapor — dijeda</span>
          ) : unlocked ? (
            <span className="unlocked-pill">✓ Kontak Dibuka</span>
          ) : (
            <button
              type="button"
              className="btn primary small"
              onClick={() => handleUnlock(lead)}
              disabled={busy === lead.id}
            >
              {busy === lead.id ? 'Membuka…' : 'Buka Kontak (1 Token)'}
            </button>
          )}
        </div>
      </article>
    )
  }

  return (
    <section id="radar" className="dir-section rp-section">
      <div className="rp-head">
        <div>
          <span className="rp-kicker">RADAR PROSPEK</span>
          <h2 className="sec-title">Cari pembeli, pembekal &amp; pengilang</h2>
          <p className="sec-sub" style={{ marginBottom: 0 }}>
            Direktori B2B langsung untuk mineral strategik — termasuk smelter,
            kilang pemprosesan dan refinery. Layari percuma; kontak dibuka
            dengan 1 token.
          </p>
        </div>
        {!user && (
          <button type="button" className="btn primary" onClick={onRequireAuth}>
            Daftar Percuma — 10 Token
          </button>
        )}
      </div>

      {/* ---- 3 langkah proses ---- */}
      <div className="rp-steps">
        {STEPS.map((s) => (
          <div className="rp-step" key={s.n}>
            <div className="stepnum">{s.n}</div>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ---- metrik langsung ---- */}
      <div className="rp-metrics">
        {metricCards.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* ---- kawalan penapis ---- */}
      <div className="rp-controls">
        <div className="rp-tabs" role="tablist" aria-label="Kategori direktori">
          {SIDE_TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={side === t.key}
              className={side === t.key ? 'rp-tab on' : 'rp-tab'}
              onClick={() => setSide(t.key)}
            >
              <span className="rp-tab-full">{t.label}</span>
              <span className="rp-tab-short">{t.short}</span>
            </button>
          ))}
        </div>

        <div className="rp-selects">
          <select
            aria-label="Tapis mineral"
            value={mineral}
            onChange={(e) => setMineral(e.target.value)}
          >
            <option value="">Semua mineral</option>
            {options.minerals.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            aria-label="Tapis negara"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Semua negara</option>
            {options.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="search"
            aria-label="Carian syarikat atau mineral"
            placeholder="Cari syarikat, mineral, wilayah…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          {filtersActive && (
            <button type="button" className="rp-reset" onClick={resetFilters}>
              Set semula
            </button>
          )}
        </div>
      </div>

      {/* ---- hasil ---- */}
      {loading && <div className="leadstate">Memuatkan direktori…</div>}

      {error && (
        <div className="card" style={{ borderColor: '#F3C6C6' }}>
          <p style={{ color: '#8C2F2F', fontWeight: 700 }}>{error}</p>
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <div className="dirwrap empty-dir">
          <div className="eb">Tiada lead sepadan</div>
          <p>
            Cuba longgarkan penapis, atau set semula untuk melihat seluruh
            direktori.
          </p>
          {filtersActive && (
            <button type="button" className="btn primary" onClick={resetFilters}>
              Set semula penapis
            </button>
          )}
        </div>
      )}

      {!loading && !error && leads.length > 0 && (
        <>
          <div className="rp-count">
            {leads.length} lead dipaparkan
            {filtersActive ? ' (ditapis)' : ''}
          </div>
          <div className="leadgrid">{leads.map(renderCard)}</div>
          <p className="rp-foot">
            Kontak disaring di lapisan database dan hanya terbuka selepas tukar
            1 token. Lead tidak tepat boleh dilapor untuk bayaran balik token.
          </p>
        </>
      )}
    </section>
  )
}
