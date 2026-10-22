import { useRef, useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'
import { useToast } from './Toast'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB — matches the bucket limit

/**
 * Seller-side: attach a lab report / COA / SGS certificate PDF
 * to one of your listings (Tier-2 monetization).
 *
 * Flow:
 *  1. Upload the PDF into the PRIVATE bucket 'coa-documents'
 *     under 'coa/<lead_id>/<file>.pdf' (Storage policy only
 *     allows sellers to write under their own listings).
 *  2. Save the storage path into listings.coa_document_url.
 *     The file itself stays private — buyers pay 1 extra token
 *     for a 5-minute signed URL.
 */
export default function SellerCoaUpload({ leadId, existingCoaPath }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [attached, setAttached] = useState(!!existingCoaPath)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('File exceeds the 10 MB limit.')
      return
    }

    setUploading(true)
    try {
      const safeName = file.name.replace(/[^\w.\-]/g, '_')
      const path = `coa/${leadId}/${Date.now()}-${safeName}`

      const { error: uploadErr } = await supabase.storage
        .from('coa-documents')
        .upload(path, file, { contentType: 'application/pdf' })
      if (uploadErr) throw uploadErr

      const { error: updateErr } = await supabase
        .from('listings')
        .update({ coa_document_url: path })
        .eq('id', leadId)
      if (updateErr) throw updateErr

      setAttached(true)
      toast.success('Lab report uploaded. Buyers can now unlock it for 1 token.')
    } catch (err) {
      toast.error(rpcErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Lab Report / COA (Tier-2)
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {attached
              ? 'Certificate attached — stored privately, unlockable for 1 token.'
              : 'Attach your SGS / assay certificate PDF (max 10 MB).'}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="hidden"
          aria-label="Upload lab report PDF"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? 'Uploading…' : attached ? 'Replace PDF' : 'Upload PDF'}
        </button>
      </div>
    </div>
  )
}
