/**
 * Footer — footer asal laman korporat (hijau gelap #0B2E21).
 *
 * Pautan korporat yang dipindahkan keluar daripada header (Minerals,
 * Corporate) tinggal di sini supaya header kekal seimbang.
 */
const LINKS = [
  { href: '/', label: 'Home' },
  { href: '#marketplace', label: 'Radar Prospek' },
  { href: '/minerals.html', label: 'Minerals' },
  { href: '/corporate.html', label: 'Corporate' },
  { href: '/market-tool.html', label: 'Market Tool' },
  { href: '/contact.html', label: 'Contact' },
]

export default function Footer() {
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
          ⚠️ <b>Penafian:</b> Harga rujukan dari sumber awam + input manual. Bukan
          nasihat pelaburan. Hubungi{' '}
          <a href="mailto:info@fsgminerals.trade">info@fsgminerals.trade</a> •
          fsgminerals.trade • © 2026 FIRST STRATEGIC GLOBAL SDN BHD (1665935-K)
        </p>
      </div>
    </footer>
  )
}
