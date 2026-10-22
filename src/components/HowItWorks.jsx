/**
 * HowItWorks — the 4-step token process:
 *   1. Register (10 Free Tokens)
 *   2. Search Leads
 *   3. Redeem Token to Unlock Details
 *   4. Top-up via CHIP Gateway
 */
const STEPS = [
  {
    n: '01',
    title: 'Register — 10 Free Tokens',
    text: 'Create a free account. Your profile is credited with 10 tokens instantly — no card required.',
    cta: 'register',
  },
  {
    n: '02',
    title: 'Search Leads',
    text: 'Browse the live directory of direct mine owners and end buyers. Commodity, volume, location and Incoterms are always visible.',
  },
  {
    n: '03',
    title: 'Redeem 1 Token to Unlock',
    text: 'Found a match? Redeem 1 token to reveal the company name, contact person, phone, email and mine address.',
  },
  {
    n: '04',
    title: 'Top-Up via CHIP Gateway',
    text: 'Out of tokens? Pay securely with FPX, cards or e-wallets through CHIP. Inaccurate leads can be reported for a refund.',
    cta: 'topup',
  },
]

export default function HowItWorks({ onRegister, onTopUp }) {
  return (
    <section id="how-it-works" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            How It Works
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            A simple token economy that protects both sides of the trade.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-sm font-black text-amber-500">
                {step.n}
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {step.text}
              </p>
              {step.cta === 'register' && (
                <button
                  type="button"
                  onClick={onRegister}
                  className="mt-4 self-start text-sm font-bold text-amber-600 underline-offset-4 hover:underline"
                >
                  Register Free →
                </button>
              )}
              {step.cta === 'topup' && (
                <button
                  type="button"
                  onClick={onTopUp}
                  className="mt-4 self-start text-sm font-bold text-amber-600 underline-offset-4 hover:underline"
                >
                  Top-Up Tokens →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
