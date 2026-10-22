import { useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import { useToast } from './Toast'
import ReportLeadModal from './ReportLeadModal'

/** What the backend returns when a field is not unlocked. */
const MASK = '••••••••'

function Badge({ tone, children }) {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

function Chip({ children }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  )
}

function Row({ label, value, locked }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd
        className={`text-right font-medium ${
          locked ? 'tracking-widest text-slate-400' : 'text-slate-900'
        }`}
      >
        {locked ? MASK : value || '—'}
      </dd>
    </div>
  )
}

/**
 * LeadCard — one marketplace listing.
 *
 * Security model (server-enforced, this UI just reflects it):
 *  - `lead.has_unlocked_contact` is false  -> every sensitive field
 *    arrives from the API already masked ('••••••••').
 *  - Tier 1: `unlock_lead` RPC            -> 1 token, reveals contacts.
 *  - Tier 2: `unlock_coa_document` RPC    -> 1 more token, COA PDF
 *    (signed URL only valid for 5 minutes).
 */
export default function LeadCard({ lead, onRefresh }) {
  const toast = useToast()
  const [busy, setBusy] = useState(null) // 'contact' | 'coa' | null
  const [balance, setBalance] = useState(null)
  const [showReport, setShowReport] = useState(false)

  const unlocked = !!lead.has_unlocked_contact
  const coaUnlocked = !!lead.has_unlocked_coa

  /* ---------- Tier 1: unlock contact details (1 token) ---------- */
  async function handleUnlockContact() {
    setBusy('contact')
    try {
      const { data, error } = await supabase.rpc('unlock_lead', {
        p_lead_id: lead.id,
      })
      if (error) throw error

      if (data.status === 'unlocked') {
        // Required toast message:
        toast.success('1 Token Deducted. Lead Unlocked.')
      } else {
        // already_unlocked / own_listing — no charge, just show.
        toast.info('Lead details available.')
      }
      setBalance(data.token_balance)
      onRefresh?.()
    } catch (err) {
      toast.error(rpcErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  /* ---------- Tier 2: unlock + open COA PDF (1 token) ---------- */
  async function handleCoa() {
    setBusy('coa')
    try {
      // Charges 1 token the first time; 'already_unlocked' afterwards.
      const { data, error } = await supabase.rpc('unlock_coa_document', {
        p_lead_id: lead.id,
      })
      if (error) throw error

      // The RPC returns the private storage path. The signed URL is
      // short-lived (expires_in_seconds) and only succeeds for users
      // with an unlocked_docs row — enforced by the Storage policy.
      const { data: signed, error: signErr } = await supabase.storage
        .from('coa-documents')
        .createSignedUrl(data.coa_path, data.expires_in_seconds || 300)
      if (signErr) throw signErr

      if (data.status === 'unlocked') {
        toast.success('1 Token Deducted. Lab Report Unlocked.')
      }
      setBalance(data.token_balance)
      window.open(signed.signedUrl, '_blank', 'noopener')
      onRefresh?.()
    } catch (err) {
      toast.error(rpcErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 p-5">
        {/* ---- Title + Verified / Reported badges ---- */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-snug text-slate-900">
            {lead.title}
          </h3>
          <div className="flex flex-col items-end gap-1">
            {lead.verified && <Badge tone="green">Verified Lead</Badge>}
            {lead.flagged && <Badge tone="amber">Reported</Badge>}
          </div>
        </div>

        {/* ---- Public (safe) info ---- */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>{lead.mineral_type}</Chip>
          {lead.country && <Chip>{lead.country}</Chip>}
          {lead.region && <Chip>{lead.region}</Chip>}
          {lead.quantity_available && <Chip>Qty: {lead.quantity_available}</Chip>}
          {lead.price_indication && <Chip>{lead.price_indication}</Chip>}
        </div>

        {/* ---- Contact block (masked until Tier-1 unlock) ---- */}
        <dl className="mt-4 space-y-1.5 text-sm">
          <Row label="Company" value={lead.company_name} locked={!unlocked} />
          <Row label="Contact" value={lead.contact_person} locked={!unlocked} />
          <Row label="Phone" value={lead.phone} locked={!unlocked} />
          <Row label="Email" value={lead.email} locked={!unlocked} />
          <Row label="Mine address" value={lead.exact_mine_address} locked={!unlocked} />
        </dl>

        {lead.flagged && !unlocked && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            This listing was reported by users and is under review. Unlocking is
            paused.
          </p>
        )}

        {balance !== null && (
          <p className="mt-3 text-xs text-slate-500">Token balance: {balance}</p>
        )}
      </div>

      {/* ---- Actions ---- */}
      <div className="flex flex-wrap gap-2 px-5 pb-5">
        {!unlocked ? (
          <button
            type="button"
            onClick={handleUnlockContact}
            disabled={busy === 'contact' || lead.flagged}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === 'contact' ? 'Unlocking…' : 'Unlock Contact Details · 1 Token'}
          </button>
        ) : (
          <>
            {lead.coa_available && !coaUnlocked && (
              <button
                type="button"
                onClick={handleCoa}
                disabled={busy === 'coa' || lead.flagged}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === 'coa' ? 'Unlocking…' : 'Unlock Lab Report (COA) · 1 Token'}
              </button>
            )}
            {coaUnlocked && (
              <button
                type="button"
                onClick={handleCoa}
                disabled={busy === 'coa'}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === 'coa' ? 'Opening…' : 'View Lab Report (PDF)'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="ml-auto self-center text-sm font-semibold text-rose-600 underline-offset-2 hover:underline"
            >
              Report Inaccurate Lead
            </button>
          </>
        )}
      </div>

      {showReport && (
        <ReportLeadModal
          lead={lead}
          onClose={() => setShowReport(false)}
          onSubmitted={onRefresh}
        />
      )}
    </article>
  )
}
