import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MINERALS } from './minerals'
import { useToast } from './Toast'

/**
 * RequestQuoteModal — borang "Minta Sebutharga" korporat (menggantikan
 * pautan mailto di header).
 *
 * Aliran:
 *   1. Klien menghantar { name, email, mineral, quantity, unit, message }
 *      ke Edge Function `create-quote` (awam — tiada auth diperlukan).
 *   2. Fungsi memvalidasi, mengira harga rujukan dari senarai LME/Fastmarkets,
 *      menyimpan baris dalam public.fsg_quotes dan memulangkan nombor
 *      sebut harga (FSG-Q-YYYY-NNNNNN) + anggaran MYR.
 *   3. Modal memaparkan nombor tersebut; pasukan FSG menyusul dengan
 *      sebutharga rasmi.
 *
 * Incoterms dihantar sebagai bahagian pertama medan `message` kerana
 * Edge Function semasa hanya menerima name/email/company/mineral/quantity/
 * unit/message — tiada kolum `incoterms` dalam public.fsg_quotes. Ini
 * mengelakkan perubahan skema pada pangkalan data produksi.
 */
const INCOTERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'DAP', 'FCA']
const UNITS = [
  { id: 't', label: 'tan metrik (t)' },
  { id: 'kg', label: 'kilogram (kg)' },
  { id: 'g', label: 'gram (g)' },
  { id: 'oz', label: 'auns troy (oz)' },
]

const EMPTY = {
  name: '',
  email: '',
  company: '',
  mineral: 'COPPER',
  quantity: '100',
  unit: 't',
  incoterms: 'CIF',
  message: '',
}

function formatMYR(n) {
  return 'RM ' + Number(n).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function RequestQuoteModal({ open, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm(EMPTY)
    setError(null)
    setResult(null)
    setBusy(false)
  }, [open])

  if (!open) return null

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const quantity = Number(form.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Kuantiti mestilah nombor positif.')
      return
    }

    // Incoterms didahulukan supaya pasukan FSG nampak syarat dagangan
    // walaupun sebelum membaca nota panjang.
    const message = form.message.trim()
      ? `Incoterms: ${form.incoterms}\n\n${form.message.trim()}`
      : `Incoterms: ${form.incoterms}`

    setBusy(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-quote', {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || undefined,
          mineral: form.mineral,
          quantity,
          unit: form.unit,
          message,
        },
      })

      if (fnError) throw fnError
      if (!data?.ok) throw new Error(data?.error || 'Sebutharga tidak dapat dijana.')

      setResult(data)
      toast.success(`Sebutharga ${data.number} dijana.`)
    } catch (err) {
      const msg = err?.message || 'Ralat rangkaian. Sila cuba lagi.'
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Minta sebutharga"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mclose" onClick={onClose} aria-label="Tutup">
          ✕
        </button>

        {result ? (
          <>
            <h2>Sebutharga Dijana</h2>
            <p className="msub">
              Pasukan FSG akan menyusul dengan sebutharga rasmi dalam masa satu
              hari bekerja.
            </p>

            <div className="card" style={{ marginTop: 18 }}>
              <div className="lc-meta" style={{ border: 'none', padding: 0 }}>
                <div>
                  <span className="k">Nombor</span>
                  <span className="v">{result.number}</span>
                </div>
                <div>
                  <span className="k">Mineral</span>
                  <span className="v">{result.mineral}</span>
                </div>
                <div>
                  <span className="k">Kuantiti</span>
                  <span className="v">
                    {result.quantity} {result.unit}
                  </span>
                </div>
                <div>
                  <span className="k">Anggaran Rujukan</span>
                  <span className="v">{formatMYR(result.amount_myr)}</span>
                </div>
              </div>
            </div>

            <p className="mnote" style={{ textAlign: 'left' }}>
              {result.note ||
                'Anggaran rujukan automatik. Bukan invois dan bukan tawaran mengikat.'}
            </p>

            <button
              type="button"
              className="btn primary"
              style={{ width: '100%', marginTop: 16 }}
              onClick={onClose}
            >
              Tutup
            </button>
          </>
        ) : (
          <>
            <h2>Minta Sebutharga</h2>
            <p className="msub">
              Anggaran rujukan automatik berdasarkan harga LME / Fastmarkets.
              Sebutharga rasmi menyusul dari pasukan FSG.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="rq-name">Nama penuh *</label>
              <input
                id="rq-name"
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                maxLength={120}
                autoComplete="name"
                placeholder="Nama anda"
              />

              <label htmlFor="rq-email">E-mel *</label>
              <input
                id="rq-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                maxLength={160}
                autoComplete="email"
                placeholder="anda@syarikat.com"
              />

              <label htmlFor="rq-company">Syarikat</label>
              <input
                id="rq-company"
                type="text"
                value={form.company}
                onChange={set('company')}
                maxLength={160}
                autoComplete="organization"
                placeholder="Nama syarikat (pilihan)"
              />

              <label htmlFor="rq-mineral">Mineral *</label>
              <select id="rq-mineral" value={form.mineral} onChange={set('mineral')} required>
                {MINERALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.bm} — {m.price}
                  </option>
                ))}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label htmlFor="rq-qty">Kuantiti *</label>
                  <input
                    id="rq-qty"
                    type="number"
                    value={form.quantity}
                    onChange={set('quantity')}
                    required
                    min="0.000001"
                    step="any"
                  />
                </div>
                <div>
                  <label htmlFor="rq-unit">Unit *</label>
                  <select id="rq-unit" value={form.unit} onChange={set('unit')} required>
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label htmlFor="rq-incoterms">Incoterms *</label>
              <select
                id="rq-incoterms"
                value={form.incoterms}
                onChange={set('incoterms')}
                required
              >
                {INCOTERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <label htmlFor="rq-msg">Mesej</label>
              <textarea
                id="rq-msg"
                rows={4}
                value={form.message}
                onChange={set('message')}
                maxLength={1800}
                placeholder="cth: 10 tan copper concentrate, gred 25% Cu, CIF Penang, assay XRF tersedia."
              />

              {error && <div className="merr">{error}</div>}

              <button
                type="submit"
                className="btn primary"
                style={{ width: '100%', marginTop: 16 }}
                disabled={busy}
              >
                {busy ? 'Menghantar…' : 'Hantar & Jana Sebutharga'}
              </button>
            </form>

            <p className="mnote">
              Anggaran rujukan sahaja — bukan invois cukai. Harga tertakluk
              pengesahan akhir FSG.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
