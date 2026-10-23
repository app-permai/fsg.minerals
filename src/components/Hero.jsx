import { useAuth } from '../context/AuthContext'
import { useMarketRates, statusBadge } from '../lib/marketRates'
import { useLang } from '../i18n/LanguageContext'

/**
 * Hero — susun atur & teks asal laman korporat:
 * kicker, tajuk serif dengan em hijau, lead, 4 kad metrik
 * (9 MINERAL FOKUS / LME / XRF / CIF/FOB), butang hijau, dan
 * panel "Terminal Status — Aktif".
 *
 * Tambahan sahaja: CTA "Register Free & Get 10 Tokens" untuk
 * tetamu (token dikredit oleh trigger database, bukan frontend).
 *
 * statusBadge() memulangkan KUNCI i18n (textKey/detailKey), bukan teks
 * siap — bahasa dipilih di sini melalui t(). Tarikh mengikut bahasa.
 */
export default function Hero({ onRegister }) {
  const { user } = useAuth()
  const { lang, t } = useLang()
  const market = useMarketRates({ pollMs: 5 * 60 * 1000 })
  const badge = statusBadge(market)

  const stamp = market.data.updatedAt
    ? new Date(market.data.updatedAt).toLocaleString(lang === 'bm' ? 'ms-MY' : 'en-GB')
    : null

  const badgeDetail = badge.detailKey ? t(badge.detailKey, badge.vars) : null

  return (
    <div className="container">
      <div className="hero">
        <div>
          <div className="kicker">{t('hero.kicker')}</div>
          <h1>
            {t('hero.titleA')} <em>{t('hero.titleB')}</em> {t('hero.titleC')}
          </h1>
          <p className="lead">
            {t('hero.lead')}{' '}
            <a href="mailto:info@fsgminerals.trade">info@fsgminerals.trade</a>.
          </p>

          <div className="stats">
            <div className="stat"><strong>9</strong><br /><span>{t('hero.stat.minerals')}</span></div>
            <div className="stat"><strong>LME</strong><br /><span>{t('hero.stat.lme')}</span></div>
            <div className="stat"><strong>XRF</strong><br /><span>{t('hero.stat.xrf')}</span></div>
            <div className="stat"><strong>CIF/FOB</strong><br /><span>{t('hero.stat.incoterms')}</span></div>
          </div>

          <div className="hero-actions">
            {user ? (
              <a className="btn primary" href="#marketplace">{t('hero.cta.browse')}</a>
            ) : (
              <button type="button" className="btn primary" onClick={onRegister}>
                {t('hero.cta.register')}
              </button>
            )}
            <a className="btn" href="/market-tool.html">{t('hero.cta.marketTool')}</a>
            <a className="btn" href="/minerals.html">{t('hero.cta.minerals')}</a>
          </div>
        </div>

        <div className="panel">
          <h3>
            {t('terminal.title')} —{' '}
            {market.data.live ? t('terminal.active') : t('terminal.reference')}
          </h3>
          <p>
            <span className={`livebadge ${badge.tone}`}>{t(badge.textKey)}</span>
          </p>
          <p>
            {t('terminal.rate')} {market.data.usdMyr.toFixed(4)}
            {market.data.fxLive ? ` (${t('terminal.live')})` : ` (${t('terminal.ref')})`} •{' '}
            {stamp ? `${t('terminal.updated')} ${stamp}` : t('terminal.notSynced')} •{' '}
            {badgeDetail || t('terminal.disclaimer')}
          </p>
          <div className="panel-actions">
            <a className="btn on-dark" href="/market-tool.html#harga">
              {t('terminal.livePrices')}
            </a>
            <a className="btn ghost-on-dark" href="/contact.html">
              {t('terminal.contactFsg')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
