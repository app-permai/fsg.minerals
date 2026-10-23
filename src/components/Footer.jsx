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
 */
import { useMarketRates } from '../lib/marketRates'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '#marketplace', label: 'Radar Prospek' },
  { href: '/minerals.html', label: 'Minerals' },
  { href: '/corporate.html', label: 'Corporate' },
  { href: '/market-tool.html', label: 'Market Tool' },
  { href: '/contact.html', label: 'Contact' },
]

export default function Footer() {
  const { data: market } = useMarketRates({ pollMs: 5 * 60 * 1000 })

  const stamp = market.updatedAt
    ? new Date(market.updatedAt).toLocaleString('ms-MY')
    : null

  return (
    <footer>
      <div className="container">
        <nav className="foot-links" aria-label="Pautan footer">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
          <a href="/admin.html">Admin</a>
          <a href="https://accounts.zoho.com" target="_blank" rel="noopener">
            🔒 Staff Login
          </a>
        </nav>

        <p className="foot-note">
          ⚠️ <b>Penafian FSG:</b>{' '}
          {market.live ? (
            <>
              Harga pasaran dikemaskini secara langsung melalui API LME/Forex
              terkini
              {stamp ? ` (kemas kini terakhir ${stamp})` : ''}.{' '}
              {market.liveCount}/{market.total} mineral disuap langsung; yang
              lain ialah rujukan manual. Bukan nasihat pelaburan.
            </>
          ) : (
            <>
              Suapan langsung tidak dapat dihubungi buat masa ini — harga yang
              dipaparkan ialah <b>nilai rujukan tersimpan</b> dan mungkin tidak
              semasa. Sahkan sebelum berurusan. Bukan nasihat pelaburan.
            </>
          )}
        </p>

        <p className="foot-note">
          Hubungi{' '}
          <a href="mailto:info@fsgminerals.trade">info@fsgminerals.trade</a> •
          fsgminerals.trade • © 2026 FIRST STRATEGIC GLOBAL SDN BHD (1665935-K)
        </p>
      </div>
    </footer>
  )
}
