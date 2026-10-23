import { useState } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import DirectoryTeaser from '../components/DirectoryTeaser'
import HowItWorks from '../components/HowItWorks'
import MineralsGrid from '../components/MineralsGrid'
import Footer from '../components/Footer'
import SignUpModal from '../components/SignUpModal'
import TopUpModal from '../components/TopUpModal'
import RequestQuoteModal from '../components/RequestQuoteModal'

/**
 * Home — laman utama marketplace B2B dalam reka bentuk korporat
 * hijau/putih ASAL (Playfair Display + Manrope, hijau #0E7A52).
 *
 * Susun atur:
 *  Header          header asal + ticker + Log In / Register + lencana token
 *  Hero            hero asal + panel Terminal Status + 4 kad metrik + CTA token
 *  DirectoryTeaser direktori lead disaring (RPC unlock_lead)
 *  HowItWorks      4 langkah token
 *  MineralsGrid    grid "Mineral Fokus FSG" asal
 *  CaraBerurusan   3 kad asal (Enquiry / Assay / Sebutharga)
 *  Footer          footer asal
 */
function CaraBerurusan() {
  return (
    <section>
      <h2 className="sec-title">Cara Berurusan</h2>
      <p className="sec-sub">Telus dan berdokumen untuk penjual dan pembeli.</p>
      <div className="grid3">
        <div className="card">
          <h3>1. Enquiry</h3>
          <p>
            Hantar berat, gred/assay, lokasi, foto dan Incoterms ke{' '}
            <a href="mailto:info@fsgminerals.trade">info@fsgminerals.trade</a>.
          </p>
        </div>
        <div className="card">
          <h3>2. Assay &amp; Sahkan</h3>
          <p>
            Minta assay XRF, sahkan spesifikasi, kuantiti dan jadual penghantaran.
          </p>
        </div>
        <div className="card">
          <h3>3. Sebutharga Rasmi</h3>
          <p>
            Terima sebutharga rasmi FSG dengan syarat CIF/FOB dan pembayaran.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [signUp, setSignUp] = useState({ open: false, mode: 'register' })
  const [topUp, setTopUp] = useState(false)
  const [quote, setQuote] = useState(false)

  const openRegister = () => setSignUp({ open: true, mode: 'register' })
  const openLogin = () => setSignUp({ open: true, mode: 'login' })

  return (
    <>
      <Header
        onLogin={openLogin}
        onTopUp={() => setTopUp(true)}
        onRequestQuote={() => setQuote(true)}
      />
      <div className="container">
        <Hero onRegister={openRegister} />
        <DirectoryTeaser onRequireAuth={openRegister} onTopUp={() => setTopUp(true)} />
        <HowItWorks onRegister={openRegister} onTopUp={() => setTopUp(true)} />
        <MineralsGrid />
        <CaraBerurusan />
      </div>
      <Footer />

      {/* ---- Modal global (gaya korporat hijau) ---- */}
      <SignUpModal
        open={signUp.open}
        mode={signUp.mode}
        onClose={() => setSignUp({ open: false, mode: signUp.mode })}
      />
      <TopUpModal open={topUp} onClose={() => setTopUp(false)} />
      <RequestQuoteModal open={quote} onClose={() => setQuote(false)} />
    </>
  )
}
