import { useState } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import DirectoryTeaser from '../components/DirectoryTeaser'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'
import SignUpModal from '../components/SignUpModal'
import TopUpModal from '../components/TopUpModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

/**
 * RFQ band — target of the "Submit RFQ" nav link.
 * Guests are routed to registration; the full RFQ module can be
 * mounted here later without changing the navigation.
 */
function RfqBanner({ onRegister }) {
  const { user } = useAuth()
  const toast = useToast()

  function handleClick() {
    if (!user) {
      onRegister()
    } else {
      toast.info('RFQ submission is coming soon. Contact our trading desk meanwhile — we will source verified suppliers for you.')
    }
  }

  return (
    <section id="rfq" className="bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Can&apos;t find the mineral you need?
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-300">
            Submit an RFQ — tell us the commodity, volume, specification and
            destination, and our team sources verified direct mine owners for
            you.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="shrink-0 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-300"
        >
          Submit RFQ
        </button>
      </div>
    </section>
  )
}

/**
 * Home — the B2B marketplace homepage.
 *
 *  Header          auth + token badge + Marketplace / Submit RFQ links
 *  Hero            new marketplace tagline + "Register Free & Get 10 Tokens"
 *  DirectoryTeaser masked "Latest Buyers & Sellers" (unlock_lead RPC)
 *  HowItWorks      4-step token process
 *  RfqBanner       RFQ band (nav target)
 *  Footer
 */
export default function Home() {
  const [signUp, setSignUp] = useState({ open: false, mode: 'register' })
  const [topUp, setTopUp] = useState(false)

  const openRegister = () => setSignUp({ open: true, mode: 'register' })
  const openLogin = () => setSignUp({ open: true, mode: 'login' })

  return (
    <>
      <Header onLogin={openLogin} onRegister={openRegister} onTopUp={() => setTopUp(true)} />
      <main>
        <Hero onRegister={openRegister} />
        <DirectoryTeaser onRequireAuth={openRegister} onTopUp={() => setTopUp(true)} />
        <HowItWorks onRegister={openRegister} onTopUp={() => setTopUp(true)} />
        <RfqBanner onRegister={openRegister} />
      </main>
      <Footer />

      {/* ---- Global modals ---- */}
      <SignUpModal
        open={signUp.open}
        mode={signUp.mode}
        onClose={() => setSignUp({ open: false, mode: signUp.mode })}
      />
      <TopUpModal open={topUp} onClose={() => setTopUp(false)} />
    </>
  )
}
