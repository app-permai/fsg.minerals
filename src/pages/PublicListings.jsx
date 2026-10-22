import { useCallback, useEffect, useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import LeadCard from '../components/LeadCard'

/**
 * Public marketplace page.
 * All data comes from the get_public_listings RPC — sensitive
 * fields arrive already masked from the database, so even a
 * tampered client cannot display raw contacts before paying.
 */
export default function PublicListings() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('get_public_listings', {
      p_limit: 50,
      p_offset: 0,
    })
    if (rpcError) {
      setError(rpcErrorMessage(rpcError))
    } else {
      setLeads(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Available Mineral Listings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Contact details and lab reports stay masked until unlocked with
            tokens. Verified listings are shown first.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-slate-500">Loading listings…</p>}

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {!loading && !error && leads.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">
          No active listings yet.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onRefresh={load} />
        ))}
      </div>
    </section>
  )
}
