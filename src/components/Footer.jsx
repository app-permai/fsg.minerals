/**
 * Footer — footer asal laman korporat (hijau gelap #0B2E21,
 * penafian harga rujukan, e-mel, pautan Staff Login & Admin).
 */
export default function Footer() {
  return (
    <footer>
      <div className="container">
        ⚠️ <b>Penafian:</b> Harga rujukan dari sumber awam + input manual. Bukan
        nasihat pelaburan. Hubungi{' '}
        <a href="mailto:info@fsgminerals.trade">info@fsgminerals.trade</a> •
        fsgminerals.trade • © 2026 FIRST STRATEGIC GLOBAL SDN BHD (1665935-K) •{' '}
        <a href="https://accounts.zoho.com" target="_blank" rel="noopener">
          🔒 Staff Login
        </a>{' '}
        • <a href="/admin.html">Admin</a>
      </div>
    </footer>
  )
}
