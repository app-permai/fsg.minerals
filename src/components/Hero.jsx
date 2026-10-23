import { useAuth } from '../context/AuthContext'
import { useMarketRates, statusBadge } from '../lib/marketRates'

/**
 * Hero — susun atur & teks asal laman korporat:
 * kicker, tajuk serif dengan em hijau, lead, 4 kad metrik
 * (9 MINERAL FOKUS / LME / XRF / CIF/FOB), butang hijau, dan
 * panel "Terminal Status — Aktif".
 *
 * Tambahan sahaja: CTA "Register Free & Get 10 Tokens" untuk
 * tetamu (token dikredit oleh trigger database, bukan frontend).
 */
export default function Hero({ onRegister }) {
  const { user } = useAuth()
  const market = useMarketRates({ pollMs: 5 * 60 * 1000 })
  const badge = statusBadge(market)
  const stamp = market.data.updatedAt
    ? new Date(market.data.updatedAt).toLocaleString('ms-MY')
    : null

  return (
    <div className="container">
      <div className="hero">
        <div>
          <div className="kicker">SOMALILAND • AFRICA — LME / FASTMARKETS REF</div>
          <h1>
            Mineral strategik <em>gred premium,</em> diurus profesional.
          </h1>
          <p className="lead">
            First Strategic Global Sdn Bhd membekalkan Kuprum, Titanium, Litium,
            Koltan, Tantalum, Aurum, Perak, Timah &amp; Aluminium. Harga rujukan
            telus, assay XRF, dan sebutharga rasmi via{' '}
            <a href="mailto:info@fsgminerals.trade">info@fsgminerals.trade</a>.
          </p>

          <div className="stats">
            <div className="stat"><strong>9</strong><br /><span>MINERAL FOKUS</span></div>
            <div className="stat"><strong>LME</strong><br /><span>RUJUKAN SAH</span></div>
            <div className="stat"><strong>XRF</strong><br /><span>ASSAY SAH</span></div>
            <div className="stat"><strong>CIF/FOB</strong><br /><span>INCOTERMS</span></div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {user ? (
              <a className="btn primary" href="#marketplace">Lihat Direktori Lead</a>
            ) : (
              <button
                type="button"
                className="btn primary"
                onClick={onRegister}
              >
                Register Free &amp; Get 10 Tokens
              </button>
            )}
            <a className="btn" href="/market-tool.html">Buka Market Tool</a>
            <a className="btn" href="/minerals.html">Lihat Minerals</a>
          </div>
        </div>

        <div className="panel">
          <h3>Terminal Status — {market.data.live ? 'Aktif' : 'Rujukan'}</h3>
          <p>
            <span className={`livebadge ${badge.tone}`}>{badge.text}</span>
          </p>
          <p>
            Kadar USD-MYR {market.data.usdMyr.toFixed(4)}
            {market.data.fxLive ? ' (live)' : ' (rujukan)'} •{' '}
            {stamp ? `Kemaskini ${stamp}` : 'Belum disegerakkan'} •{' '}
            {badge.detail || 'Harga tertakluk pengesahan FSG.'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="btn" style={{ background: '#fff' }} href="/market-tool.html#harga">Harga Live</a>
            <a
              className="btn"
              style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}
              href="/contact.html"
            >
              Hubungi FSG
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
