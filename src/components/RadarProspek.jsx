import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { useLang } from '../i18n/LanguageContext'

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
 *
 * Semua label melalui t() daripada LanguageContext — kunci disimpan
 * dalam pemalar, bukan teks BM siap.
 */
const MASKED = '••••••••'

const SIDE_TABS = [
  { key: 'buy', labelKey: 'radar.tab.buy', shortKey: 'radar.tab.buyShort' },
  { key: 'sell', labelKey: 'radar.tab.sell', shortKey: 'radar.tab.sellShort' },
  { key: 'process', labelKey: 'radar.tab.process', shortKey: 'radar.tab.processShort' },
  { key: null, labelKey: 'radar.tab.all', shortKey: 'radar.tab.allShort' },
]

/** Kunci label + kelas lencana bagi setiap kategori direktori. */
const SIDE_BADGE = {
  buy: { key: 'radar.badge.buy', cls: 'buy' },
  sell: { key: 'radar.badge.sell', cls: 'sell' },
  process: { key: 'radar.badge.process', cls: 'process' },
}

const STEPS = [
  { n: '1', titleKey: 'radar.step1.title', textKey: 'radar.step1.text' },
  { n: '2', titleKey: 'radar.step2.title', textKey: 'radar.step2.text' },
  { n: '3', titleKey: 'radar.step3.title', textKey: 'radar.step3.text' },
]

/** Senarai kad metrik; kunci disimpan supaya bahasa boleh bertukar tanpa muat semula. */
const METRIC_DEFS = [
  { field: 'total_leads', labelKey: 'radar.metric.leads', subKey: 'radar.metric.leadsSub' },
  { field: 'buyer_count', labelKey: 'radar.metric.buyers', subKey: 'radar.metric.buyersSub' },
  { field: 'seller_count', labelKey: 'radar.metric.sellers', subKey: 'radar.metric.sellersSub' },
  {
    field: 'processor_count',
    labelKey: 'radar.metric.processors',
    subKey: 'radar.metric.processorsSub',
  },
  {
    field: 'country_count',
    labelKey: 'radar.metric.countries',
    subKey: 'radar.metric.countriesSub',
  },
  {
    field: 'commodity_count',
    labelKey: 'radar.metric.commodities',
    subKey: 'radar.metric.commoditiesSub',
  },
]

function fmtDate(iso, locale) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SideTag({ side }) {
  const { t } = useLang()
  const b = SIDE_BADGE[side]
  return <span className={`sidebadge ${b?.cls || 'sell'}`}>{b ? t(b.key) : side || '—'}</span>
}

/** Satu medan kontak; bertopeng = boleh diklik untuk membuka daftar. */
function ContactRow({ label, value, locked, onLockedClick, lockedHint }) {
  return (
    <div className="rp-contact">
      <span className="k">{label}</span>
      {locked ? (
        <button type="button" className="v masked-val" onClick={onLockedClick} title={lockedHint}>
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
  const { lang, t } = useLang()

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
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
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
        toast.success(t('toast.unlocked'))
      } else {
        toast.info(t('toast.detailsReady'))
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
    return METRIC_DEFS.map((d) => ({
      value: s[d.field],
      label: t(d.labelKey),
      sub: t(d.subKey),
    }))
  }, [stats, t])

  function renderCard(lead) {
    const unlocked = !!lead.has_unlocked_contact
    const location = [lead.region, lead.country].filter(Boolean).join(', ') || '—'
    const lockedHint = t('radar.card.ariaUnlock')

    return (
      <article className="leadcard rp-card" key={lead.id}>
        <div className="lc-top">
          <SideTag side={lead.side} />
          {lead.verified && !lead.flagged && (
            <span className="vcheck">{t('radar.card.verified')}</span>
          )}
        </div>

        <h3 className="lc-title">{lead.title || '—'}</h3>

        <h4 className={`rp-co${unlocked ? '' : ' masked'}`}>
          {unlocked ? lead.company_name || '—' : t('radar.card.maskedCompany')}
        </h4>

        <div className="lc-meta">
          <div>
            <span className="k">{t('radar.card.commodity')}</span>
            <span className="v">{lead.mineral_type || '—'}</span>
          </div>
          <div>
            <span className="k">{t('radar.card.volume')}</span>
            <span className="v">{lead.quantity_available || '—'}</span>
          </div>
          <div>
            <span className="k">{t('radar.card.location')}</span>
            <span className="v">{location}</span>
          </div>
          <div>
            <span className="k">{t('radar.card.incoterms')}</span>
            <span className="v">{lead.incoterms || '—'}</span>
          </div>
        </div>

        <div className="rp-contacts">
          <ContactRow
            label={t('radar.card.contact')}
            value={lead.contact_person}
            locked={!unlocked}
            onLockedClick={() => handleUnlock(lead)}
            lockedHint={lockedHint}
          />
          <ContactRow
            label={t('radar.card.phone')}
            value={lead.phone}
            locked={!unlocked}
            onLockedClick={() => handleUnlock(lead)}
            lockedHint={lockedHint}
          />
          <ContactRow
            label={t('radar.card.email')}
            value={lead.email}
            locked={!unlocked}
            onLockedClick={() => handleUnlock(lead)}
            lockedHint={lockedHint}
          />
        </div>

        <div className="lc-date">
          {t('radar.card.updated')}: {fmtDate(lead.updated_at, lang === 'bm' ? 'ms-MY' : 'en-GB')}
        </div>

        <div className="lc-action">
          {lead.flagged ? (
            <span className="paused">{t('radar.card.flagged')}</span>
          ) : unlocked ? (
            <span className="unlocked-pill">{t('radar.card.unlocked')}</span>
          ) : (
            <button
              type="button"
              className="btn primary small"
              onClick={() => handleUnlock(lead)}
              disabled={busy === lead.id}
            >
              {busy === lead.id ? t('radar.card.unlocking') : t('radar.card.unlock')}
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
          <span className="rp-kicker">{t('radar.kicker')}</span>
          <h2 className="sec-title">{t('radar.title')}</h2>
          <p className="sec-sub" style={{ marginBottom: 0 }}>
            {t('radar.sub')}
          </p>
        </div>
        {!user && (
          <button type="button" className="btn primary" onClick={onRequireAuth}>
            {t('radar.register')}
          </button>
        )}
      </div>

      {/* ---- 3 langkah proses ---- */}
      <div className="rp-steps">
        {STEPS.map((s) => (
          <div className="rp-step" key={s.n}>
            <div className="stepnum">{s.n}</div>
            <div>
              <h3>{t(s.titleKey)}</h3>
              <p>{t(s.textKey)}</p>
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
        <div className="rp-tabs" role="tablist" aria-label={t('radar.filter.ariaTabs')}>
          {SIDE_TABS.map((tab) => (
            <button
              key={tab.labelKey}
              type="button"
              role="tab"
              aria-selected={side === tab.key}
              className={side === tab.key ? 'rp-tab on' : 'rp-tab'}
              onClick={() => setSide(tab.key)}
            >
              <span className="rp-tab-full">{t(tab.labelKey)}</span>
              <span className="rp-tab-short">{t(tab.shortKey)}</span>
            </button>
          ))}
        </div>

        <div className="rp-selects">
          <select
            aria-label={t('radar.filter.ariaMineral')}
            value={mineral}
            onChange={(e) => setMineral(e.target.value)}
          >
            <option value="">{t('radar.filter.mineral')}</option>
            {options.minerals.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            aria-label={t('radar.filter.ariaCountry')}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">{t('radar.filter.country')}</option>
            {options.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="search"
            aria-label={t('radar.filter.ariaSearch')}
            placeholder={t('radar.filter.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          {filtersActive && (
            <button type="button" className="rp-reset" onClick={resetFilters}>
              {t('radar.filter.reset')}
            </button>
          )}
        </div>
      </div>

      {/* ---- hasil ---- */}
      {loading && <div className="leadstate">{t('radar.loading')}</div>}

      {error && (
        <div className="card" style={{ borderColor: '#F3C6C6' }}>
          <p style={{ color: '#8C2F2F', fontWeight: 700 }}>{error}</p>
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <div className="dirwrap empty-dir">
          <div className="eb">{t('radar.empty.title')}</div>
          <p>{t('radar.empty.text')}</p>
          {filtersActive && (
            <button type="button" className="btn primary" onClick={resetFilters}>
              {t('radar.empty.reset')}
            </button>
          )}
        </div>
      )}

      {!loading && !error && leads.length > 0 && (
        <>
          <div className="rp-count">
            {t(filtersActive ? 'radar.countFiltered' : 'radar.count', { n: leads.length })}
          </div>
          <div className="leadgrid">{leads.map(renderCard)}</div>
          <p className="rp-foot">{t('radar.foot')}</p>
        </>
      )}
    </section>
  )
}
