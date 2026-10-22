import { useCallback, useEffect, useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

/**
 * DirectoryTeaser — "Latest Buyers & Sellers" on the homepage.
 *
 * Public fields shown: Commodity, Volume, Location, Incoterms, Updated.
 * Sensitive fields (company name, phone) are masked — and not just
 * cosmetically: get_public_listings returns '••••••••' from the
 * DATABASE for locked leads, so a tampered client cannot reveal the
 * real values. The strings below are just the visual style.
 *
 * Row actions:
 *  - Guest      -> opens the Sign-Up modal (onRequireAuth)
 *  - Logged in  -> unlock_lead RPC (1 token). When the balance
 *                  reaches 0 (or a spend is rejected), the CHIP
 *                  top-up modal opens automatically (onTopUp).
 */
const MASKED_COMPANY = '████████ Co. Ltd'
const MASKED_PHONE = '+██ ████ ████'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SideTag({ side }) {
  const buy = side === 'buy'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        buy ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {buy ? 'Buyer' : 'Seller'}
    </span>
  )
}

function UnlockButton({ lead, busy, onClick }) {
  if (lead.flagged) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        Reported — paused
      </span>
    )
  }
  if (lead.has_unlocked_contact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        ✓ Unlocked
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onClick(lead)}
      disabled={busy === lead.id}
      className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {busy === lead.id ? 'Unlocking…' : 'Unlock Contact Details (1 Token)'}
    </button>
  )
}

export default function DirectoryTeaser({ onRequireAuth, onTopUp }) {
  const { user, refreshBalance } = useAuth()
  const toast = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('get_public_listings', {
      p_limit: 6,
      p_offset: 0,
    })
    if (rpcError) {
      // Database layer not activated yet (migrations pending) → show a
      // friendly "coming soon" state instead of a raw error. Once the
      // SQL migrations run, listings appear here with no redeploy.
      const notReady = /PGRST202|Could not find|get_public_listings|schema cache|does not exist|Tediously/i.test(
        rpcError.message || ''
      )
      if (notReady) {
        setError(null)
        setLeads([])
      } else {
        setError(rpcErrorMessage(rpcError))
      }
    } else {
      setError(null)
      setLeads(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /* ---------- Tier-1 unlock, bound to the unlock_lead RPC ---------- */
  async function handleUnlock(lead) {
    if (!user) {
      // Guests must register first — no data leaves the DB for them.
      onRequireAuth()
      return
    }
    setBusy(lead.id)
    try {
      const { data, error: rpcError } = await supabase.rpc('unlock_lead', {
        p_lead_id: lead.id,
      })
      if (rpcError) throw rpcError

      if (data.status === 'unlocked') {
        // Required toast message:
        toast.success('1 Token Deducted. Lead Unlocked.')
      } else {
        // already_unlocked / own_listing — no charge.
        toast.info('Lead details available.')
      }

      await refreshBalance()
      await load()

      // Balance hit 0 -> proactively offer the CHIP top-up.
      if (typeof data.token_balance === 'number' && data.token_balance <= 0) {
        onTopUp()
      }
    } catch (err) {
      // Required toast message (via rpcErrorMessage):
      toast.error(rpcErrorMessage(err))
      if (String(err?.message || '').includes('INSUFFICIENT_TOKEN_BALANCE')) {
        onTopUp()
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <section id="marketplace" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Latest Buyers &amp; Sellers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Live directory of verified mineral supply and demand. Company
              names and contacts stay masked until unlocked.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:self-auto"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/70" />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        )}

        {!loading && !error && leads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
            <p className="font-semibold text-slate-700">Direktori lead akan muncul di sini</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Listing pembeli &amp; penjual baharu sedang disediakan. Daftar percuma
              sekarang — anda akan menerima 10 token untuk membuka kunci kontak
              pertama anda.
            </p>
            <button
              type="button"
              onClick={onRequireAuth}
              className="mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Register Free &amp; Get 10 Tokens
            </button>
          </div>
        )}

        {!loading && !error && leads.length > 0 && (
          <>
            {/* ---- Desktop: directory table ---- */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 font-semibold">Company</th>
                      <th className="px-4 py-3 font-semibold">Contact</th>
                      <th className="px-4 py-3 font-semibold">Commodity</th>
                      <th className="px-4 py-3 font-semibold">Volume</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Incoterms</th>
                      <th className="px-4 py-3 font-semibold">Updated</th>
                      <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => {
                      const unlocked = !!lead.has_unlocked_contact
                      return (
                        <tr key={lead.id} className="transition hover:bg-slate-50/70">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <SideTag side={lead.side} />
                              {lead.verified && !lead.flagged && (
                                <span className="text-[11px] font-semibold text-emerald-600">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                            <div
                              className={`mt-1 font-semibold ${
                                unlocked ? 'text-slate-900' : 'tracking-wide text-slate-400'
                              }`}
                            >
                              {unlocked ? lead.company_name || '—' : MASKED_COMPANY}
                            </div>
                          </td>
                          <td
                            className={`px-4 py-3.5 font-medium ${
                              unlocked ? 'text-slate-900' : 'tracking-wide text-slate-400'
                            }`}
                          >
                            {unlocked ? lead.phone || '—' : MASKED_PHONE}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">
                            {lead.mineral_type || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {lead.quantity_available || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {[lead.region, lead.country].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {lead.incoterms || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">
                            {fmtDate(lead.updated_at)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <UnlockButton lead={lead} busy={busy} onClick={handleUnlock} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ---- Mobile / tablet: directory cards ---- */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {leads.map((lead) => {
                const unlocked = !!lead.has_unlocked_contact
                return (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <SideTag side={lead.side} />
                      {lead.verified && !lead.flagged && (
                        <span className="text-[11px] font-semibold text-emerald-600">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-2 text-base font-bold ${
                        unlocked ? 'text-slate-900' : 'tracking-wide text-slate-400'
                      }`}
                    >
                      {unlocked ? lead.company_name || '—' : MASKED_COMPANY}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        unlocked ? 'text-slate-700' : 'tracking-wide text-slate-400'
                      }`}
                    >
                      {unlocked ? lead.phone || '—' : MASKED_PHONE}
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <div>
                        <dt className="text-slate-400">Commodity</dt>
                        <dd className="font-semibold text-slate-800">
                          {lead.mineral_type || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Volume</dt>
                        <dd className="font-semibold text-slate-800">
                          {lead.quantity_available || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Location</dt>
                        <dd className="font-semibold text-slate-800">
                          {[lead.region, lead.country].filter(Boolean).join(', ') || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Incoterms</dt>
                        <dd className="font-semibold text-slate-800">
                          {lead.incoterms || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Updated</dt>
                        <dd className="font-semibold text-slate-800">
                          {fmtDate(lead.updated_at)}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4">
                      <div className="[&>button]:w-full">
                        <UnlockButton lead={lead} busy={busy} onClick={handleUnlock} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              Contact details are masked at the database layer and revealed only
              after unlocking with a token. Inaccurate leads can be reported for a
              token refund.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
