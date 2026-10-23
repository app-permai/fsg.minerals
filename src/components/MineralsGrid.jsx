import { MINERALS, mineralName, mineralDesc } from './minerals'
import { useMarketRates, priceIn } from '../lib/marketRates'
import { useLang } from '../i18n/LanguageContext'

/**
 * Mineral Fokus FSG — grid kad mineral.
 *
 * Harga: jika mineral itu ada suapan pasaran awam (AURUM, SILVER,
 * COPPER, ALUMINIUM), nilai live dari useMarketRates() dipaparkan
 * dengan lencana LIVE. Lima lagi diniagakan OTC dan kekal sebagai
 * rujukan manual — ditanda "Rujukan" supaya tidak mengelirukan.
 *
 * Nama, keterangan dan unit melalui t()/mineralName(); harga rujukan
 * statik (m.price) kekal kerana ia nilai dagangan sebenar, bukan prosa.
 */
function fmtUsd(usdPerKg, unit) {
  const v = priceIn(usdPerKg, unit)
  const dp = unit === 'oz' ? 2 : 0
  return v.toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })
}

export default function MineralsGrid() {
  const { lang, t } = useLang()
  const { data: market, loading } = useMarketRates({ pollMs: 5 * 60 * 1000 })
  const byId = new Map(market.rates.map((r) => [r.id, r]))

  const stamp = market.updatedAt
    ? new Date(market.updatedAt).toLocaleString(lang === 'bm' ? 'ms-MY' : 'en-GB')
    : null

  return (
    <section>
      <h2 className="sec-title">{t('minerals.title')}</h2>
      <p className="sec-sub">{t('minerals.sub')}</p>
      <div className="grid3">
        {MINERALS.map((m) => {
          const live = byId.get(m.rateId)
          const isLive = !!live?.isLive
          return (
            <div className="card" key={m.id}>
              <div className="sym">{m.sym}</div>
              <h3>⭐ {mineralName(m, lang)}</h3>
              <p>{mineralDesc(m, lang)}</p>
              <p>
                {isLive ? (
                  <>
                    <b>
                      ${fmtUsd(live.usdPerKg, m.unit)} {t(`minerals.unit.${m.unit}`)}
                    </b>{' '}
                    <span className="livepill">{t('minerals.live')}</span>
                  </>
                ) : (
                  <>
                    <b>{m.price}</b>{' '}
                    <span className="refpill">{t('minerals.ref')}</span>
                  </>
                )}
              </p>
              {!isLive && live?.provider && (
                <p className="provnote">{live.provider}</p>
              )}
              <a className="btn" href="/market-tool.html">
                {t('minerals.calc')}
              </a>
            </div>
          )
        })}
      </div>
      {!loading && stamp && (
        <p className="rp-foot">
          {t('minerals.foot')} {stamp} • {t('minerals.rateLine', {
            rate: market.usdMyr?.toFixed(4),
            detail: market.fxLive ? `(${t('terminal.live')})` : `(${t('terminal.ref')})`,
          })}{' '}
          • {t('minerals.footCoverage', { n: market.liveCount, total: market.total })}
        </p>
      )}
    </section>
  )
}
