import { useAuth } from '../context/AuthContext'

const MINERALS = [
  'Copper Cathode',
  'Copper Concentrate',
  'Lithium Ore',
  'Gold',
  'Coltan',
  'Tantalum',
  'Tin',
  'Titanium',
  'Aluminium',
  'Silver',
]

/**
 * Hero — marketplace positioning.
 * Tagline: "Global B2B Mineral Trading Platform —
 *           Connecting Direct Mine Owners & End Buyers"
 * Primary CTA: "Register Free & Get 10 Tokens"
 * (the 10 tokens are credited automatically by the
 *  handle_new_user trigger in migration 04).
 */
export default function Hero({ onRegister }) {
  const { user } = useAuth()

  return (
    <section id="top" className="relative overflow-hidden bg-slate-900">
      {/* decorative glows */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-300">
          🪙 New accounts get 10 free tokens
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          Global B2B Mineral Trading Platform
          <span className="mt-2 block text-amber-400">
            Connecting Direct Mine Owners &amp; End Buyers
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Browse live supply and demand listings across copper, lithium, gold,
          tantalum and more. Company names and contact details stay masked —
          redeem 1 token only when a lead is worth it.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <a
              href="#marketplace"
              className="w-full rounded-xl bg-amber-400 px-6 py-3 text-center text-base font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 sm:w-auto"
            >
              Browse the Marketplace
            </a>
          ) : (
            <button
              type="button"
              onClick={onRegister}
              className="w-full rounded-xl bg-amber-400 px-6 py-3 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 sm:w-auto"
            >
              Register Free &amp; Get 10 Tokens
            </button>
          )}
          <a
            href="#how-it-works"
            className="w-full rounded-xl border border-white/20 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            How It Works
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {MINERALS.map((m) => (
            <span
              key={m}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
            >
              {m}
            </span>
          ))}
        </div>

        <p className="mt-6 text-xs font-medium tracking-wide text-slate-400">
          Verified contacts · COA / SGS lab reports · Payments secured by CHIP Gateway
        </p>
      </div>
    </section>
  )
}
