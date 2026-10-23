import { MINERALS } from './minerals'
import { useMarketRates, priceIn } from '../lib/marketRates'

/**
 * Mineral Fokus FSG — grid kad mineral.
 *
 * Harga: jika mineral itu ada suapan pasaran awam (AURUM, SILVER,
 * COPPER, ALUMINIUM), nilai live dari useMarketRates() dipaparkan
 * dengan lencana LIVE. Lima lagi diniagakan OTC dan kekal sebagai
 * rujukan manual — ditanda "Rujukan" supaya tidak mengelirukan.
 */
function fmtUsd(usdPerKg, unit) {
  const v = priceIn(usdPerKg, unit)
  const dp = unit === 'oz' ? 2 : 0
  return v.toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })
}

const UNIT_LABEL = { oz: '/ oz', kg: '/ kg', tonne: '/ tan' }

export default function MineralsGrid() {
  const { data: market, loading } = useMarketRates({ pollMs: 5 * 60 * 1000 })
  const byId = new Map(market.rates.map((r) => [r.id, r]))

  return (
    <section>
      <h2 className="sec-title">Mineral Fokus FSG</h2>
      <p className="sec-sub">
        Sembilan mineral dengan rujukan LME / LBMA / Fastmarkets. Empat daripadanya
        disuap secara langsung dari pasaran COMEX; lima lagi diniagakan OTC dan
        dipaparkan sebagai rujukan.
      </p>
      <div className="grid3">
        {MINERALS.map((m) => {
          const live = byId.get(m.rateId)
          const isLive = !!live?.isLive
          return (
            <div className="card" key={m.id}>
              <div className="sym">{m.sym}</div>
              <h3>⭐ {m.bm}</h3>
              <p>{m.desc}</p>
              <p>
                {isLive ? (
                  <>
                    <b>
                      ${fmtUsd(live.usdPerKg, m.unit)} {UNIT_LABEL[m.unit]}
                    </b>{' '}
                    <span className="livepill">LIVE</span>
                  </>
                ) : (
                  <>
                    <b>{m.price}</b>{' '}
                    <span className="refpill">Rujukan</span>
                  </>
                )}
              </p>
              {!isLive && live?.provider && (
                <p className="provnote">{live.provider}</p>
              )}
              <a className="btn" href="/market-tool.html">
                Kira Nilai →
              </a>
            </div>
          )
        })}
      </div>
      {!loading && market.updatedAt && (
        <p className="rp-foot">
          Harga live dikemas kini {new Date(market.updatedAt).toLocaleString('ms-MY')} •
          USD/MYR {market.usdMyr?.toFixed(4)}
          {market.fxLive ? ' (live)' : ' (rujukan)'} •{' '}
          {market.liveCount}/{market.total} mineral disuap langsung.
        </p>
      )}
    </section>
  )
}
