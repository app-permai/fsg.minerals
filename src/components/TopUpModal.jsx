import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CHIP_PACKAGES, formatMYR } from '../lib/packages'
import { useToast } from './Toast'

/**
 * TopUpModal — CHIP Gateway payment packages.
 *
 * Opened automatically when the token balance hits 0 (or a spend is
 * rejected for insufficient balance), and manually by clicking the
 * 🪙 token badge in the header.
 *
 * Payment flow:
 *   1. This modal calls the `create-chip-payment` Edge Function with
 *      only a package_id (amounts are decided server-side — the
 *      client cannot tamper with the price).
 *   2. The Edge Function creates the CHIP purchase and returns a
 *      hosted-payment URL; the browser is redirected there.
 *   3. On payment success CHIP calls the `chip-webhook` function,
 *      which credits the tokens via the service_role-only
 *      add_tokens() RPC.
 *
 * Both Edge Functions are included as integration skeletons in
 * supabase/functions/ — deploy them and set the CHIP secrets
 * before going live (see README).
 */
export default function TopUpModal({ open, onClose }) {
  const toast = useToast()
  const [busy, setBusy] = useState(null)

  if (!open) return null

  async function handlePay(pkg) {
    setBusy(pkg.id)
    try {
      const { data, error } = await supabase.functions.invoke('create-chip-payment', {
        body: { package_id: pkg.id },
      })
      if (error) throw error
      if (!data?.payment_url) {
        throw new Error('The payment service did not return a payment URL.')
      }
      window.location.href = data.payment_url
      // Page navigates to CHIP's hosted checkout — leave `busy` set.
    } catch (err) {
      toast.error(
        'Could not start the CHIP payment. Make sure the create-chip-payment Edge Function is deployed (supabase/functions/).'
      )
      setBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Top-up tokens"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Top-Up Tokens</h2>
            <p className="mt-1 text-sm text-slate-500">
              Payments are processed securely by CHIP Gateway — FPX, cards and
              e-wallets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {CHIP_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative flex flex-col rounded-2xl border p-5 ${
                pkg.highlight
                  ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/30'
                  : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              {pkg.highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Best Value
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {pkg.label}
              </p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {pkg.tokens}
                <span className="ml-1 text-sm font-semibold text-slate-500">tokens</span>
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatMYR(pkg.amount)}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {(pkg.amount / pkg.tokens).toFixed(2)} MYR / token
              </p>
              <p className="mt-2 flex-1 text-xs font-medium text-slate-400">{pkg.note}</p>
              <button
                type="button"
                onClick={() => handlePay(pkg)}
                disabled={busy !== null}
                className="mt-4 rounded-lg bg-slate-900 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === pkg.id ? 'Redirecting…' : `Pay ${formatMYR(pkg.amount)} via CHIP`}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Tokens are credited automatically once CHIP confirms the payment. Ran
          out because a lead was inaccurate? Report it — approved reports refund
          your token.
        </p>
      </div>
    </div>
  )
}
