/**
 * Footer — marketplace footer.
 */
export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-xs font-black text-slate-900">
              FG
            </span>
            <span className="text-base font-bold text-white">
              FSG Minerals<span className="text-amber-500">.trade</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-xs leading-relaxed">
            Global B2B mineral trading platform — connecting direct mine owners
            and end buyers with verified contacts and lab reports.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
          <a href="#marketplace" className="font-medium hover:text-white">
            Marketplace
          </a>
          <a href="#rfq" className="font-medium hover:text-white">
            Submit RFQ
          </a>
          <a href="#how-it-works" className="font-medium hover:text-white">
            How It Works
          </a>
          <a href="/corporate.html" className="font-medium hover:text-white">
            Laman Korporat FSG
          </a>
          <a href="/minerals.html" className="font-medium hover:text-white">
            Mineral Kami
          </a>
          <a href="/contact.html" className="font-medium hover:text-white">
            Hubungi Kami
          </a>
        </nav>

        <div className="text-xs">
          <p className="font-semibold text-slate-300">Payments secured by CHIP Gateway</p>
          <p className="mt-1">FPX · Cards · E-wallets</p>
        </div>
      </div>

      <div className="border-t border-slate-800/70 px-4 py-4 text-center text-xs">
        © {new Date().getFullYear()} First Strategic Global Sdn Bhd · fsgminerals.trade
      </div>
    </footer>
  )
}
