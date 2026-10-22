import { useCallback, useEffect, useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import { useToast } from './Toast'

const REASON_LABELS = {
  wrong_number: 'Wrong Number',
  not_owner_or_buyer: 'Not a Direct Mine Owner/Buyer',
  inactive_listing: 'Inactive Listing',
  other: 'Other',
}

const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

/**
 * Admin panel: review "Report Inaccurate Lead" submissions.
 *  - Approve -> calls process_token_refund(p_approve: true):
 *    reporter gets +1 token, report approved, listing flagged
 *    (and deactivated when the reason was "Inactive Listing").
 *  - Reject  -> no refund, listing untouched.
 *
 * Access itself is enforced server-side: the RPC checks
 * profiles.role = 'admin' (set an admin once via SQL:
 *   update public.profiles set role = 'admin' where id = '<uuid>';
 * ).
 */
export default function AdminReportsPanel() {
  const toast = useToast()
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('lead_reports')
      .select(
        'id, reason, details, status, created_at, lead_id, user_id, listings(title), profiles(full_name)'
      )
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)

    const { data, error } = await query
    if (error) toast.error(rpcErrorMessage(error))
    setReports(data || [])
    setLoading(false)
  }, [filter, toast])

  useEffect(() => {
    load()
  }, [load])

  async function handleReview(report, approve) {
    setBusyId(report.id)
    try {
      const { data, error } = await supabase.rpc('process_token_refund', {
        p_report_id: report.id,
        p_approve: approve,
      })
      if (error) throw error
      toast.success(data?.message || 'Done.')
      load()
    } catch (err) {
      toast.error(rpcErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Lead Reports</h1>
      <p className="mt-1 text-sm text-slate-500">
        Approving a report refunds 1 token to the buyer and flags the listing.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              filter === f.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-slate-500">Loading reports…</p>}

      {!loading && reports.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">
          No {filter === 'all' ? '' : filter + ' '}reports.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {reports.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {r.listings?.title || `Lead ${r.lead_id}`}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Reported by {r.profiles?.full_name || r.user_id} ·{' '}
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                  r.status === 'approved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : r.status === 'rejected'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {r.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Reason:</span>{' '}
              {REASON_LABELS[r.reason] || r.reason}
            </p>
            {r.details && (
              <p className="mt-1 text-sm text-slate-500">“{r.details}”</p>
            )}

            {r.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleReview(r, true)}
                  disabled={busyId === r.id}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  Approve & Refund 1 Token
                </button>
                <button
                  type="button"
                  onClick={() => handleReview(r, false)}
                  disabled={busyId === r.id}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
