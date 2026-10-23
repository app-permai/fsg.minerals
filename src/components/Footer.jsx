/**
 * Footer — footer korporat (hijau gelap #0B2E21).
 *
 * Pautan korporat yang dipindahkan keluar daripada header (Minerals,
 * Corporate) tinggal di sini supaya header kekal seimbang.
 *
 * Penafian harga adalah DINAMIK dan mengikut status suapan sebenar:
 *   - live   -> "dikemaskini secara langsung melalui API LME/Forex terkini"
 *   - tidak  -> nyatakan dengan jujur bahawa nilai rujukan sedang dipaparkan
 * Kami tidak menulis "langsung" apabila suapan sebenarnya gagal.
 *
 * Semua teks melalui t() daripada LanguageContext.
 */
import { useMarketRates } from '../lib/marketRates'
import { useLang } from '../i18n/LanguageContext'

const LINKS = [
  { href: '/', key: 'nav.home' },
  { href: '#marketplace', key: 'nav.radar' },
  { href: '/minerals.html', key: 'nav.minerals' },
  { href: '/corporate.html', key: 'nav.corporate' },
  { href: '/market-tool.html', key: 'nav.marketTool' },
  { href: '/contact.html', key: 'nav.contact' },
]

export default function Footer() {
  const { lang, t } = useLang()
  const { data: market } = useMarketRates({ pollMs: 5 * 60 * 1000 })

  const stamp = market.updatedAt
    ? new Date(market.updatedAt).toLocaleString(lang === 'bm' ? 'ms-MY' : 'en-GB')
    : null

  return (
    <footer>
      <div className="container">
        <nav className="foot-links" aria-label={t('footer.links')}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {t(l.key)}
            </a>
          ))}
          <a href="/admin.html">{t('nav.admin')}</a>
          <a href="https://accounts.zoho.com" target="_blank" rel="noopener">
            🔒 {t('nav.staffLogin')}
          </a>
        </nav>

        <p className="foot-note">
          ⚠️ <b>{t('footer.disclaimer')}</b>{' '}
          {market.live ? (
            <>
              {t('footer.liveText')}
              {stamp ? ` ${t('footer.stamp', { stamp })}` : ''}.{' '}
              {t('footer.liveSuffix', { n: market.liveCount, total: market.total })}
            </>
          ) : (
            <>{t('footer.staleText')}</>
          )}
        </p>

        <p className="foot-note">
          {t('footer.contact')}{' '}
          <a href="mailto:info@fsgminerals.trade">info@fsgminerals.trade</a> •
          fsgminerals.trade • © 2026 FIRST STRATEGIC GLOBAL SDN BHD (1665935-K)
        </p>
      </div>
    </footer>
  )
}
