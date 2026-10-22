import { useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import { useToast } from './Toast'

/**
 * Reasons map 1:1 to the CHECK constraint on public.lead_reports:
 * wrong_number | not_owner_or_buyer | inactive_listing | other
 */
const REASONS = [
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'not_owner_or_buyer', label: 'Not a Direct Mine Owner/Buyer' },
  { value: 'inactive_listing', label: 'Inactive Listing' },
  { value: 'other', label: 'Other' },
]

export default function ReportLeadModal({ lead, onClose, onSubmitted }) {
  const toast = useToast()
  const [reason, setReason] = useState('wrong_number')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.rpc('submit_lead_report', {
        p_lead_id: lead.id,
        p_reason: reason,
        p_details: details.trim() || null,
      })
      if (error) throw error

      // Required toast message:
      toast.success('Report Submitted. Token will be refunded upon verification.')
      onSubmitted?.()
      onClose()
    } catch (err) {
      toast.error(rpcErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Report inaccurate lead"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">
          Report Inaccurate Lead
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {lead.title} — if our team confirms the problem, your token is
          refunded automatically.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">
              What is wrong with this lead?
            </legend>
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                  reason === r.value
                    ? 'border-slate-900 bg-slate-50 font-medium'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-slate-900"
                />
                {r.label}
              </label>
            ))}
          </fieldset>

          <div>
            <label
              htmlFor="report-details"
              className="text-sm font-medium text-slate-700"
            >
              Details (optional)
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. called twice, number not in service"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
