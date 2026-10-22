import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CHIP_PACKAGES, formatMYR } from '../lib/packages'
import { useToast } from './Toast'

/**
 * TopUpModal — pakej bayaran CHIP Gateway dalam gaya korporat
 * putih/hijau (kad putih, butang hijau, aksen emas pada token).
 *
 * Terbuka automatik apabila baki token mencecah 0 (atau belian
 * ditolak kerana baki tidak mencukupi), dan secara manual melalui
 * lencana token emas di header.
 *
 * Aliran bayaran:
 *   1. Modal memanggil Edge Function `create-chip-payment` dengan
 *      package_id sahaja (amaun diputuskan di pihak server — klien
 *      tidak boleh ubah harga).
 *   2. Edge Function cipta pembelian CHIP dan pulangkan URL hosted
 *      payment; pelayar dialihkan ke sana.
 *   3. Selepas bayaran berjaya, CHIP panggil `chip-webhook` yang
 *      mengkreditkan token melalui RPC add_tokens (service_role sahaja).
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
        throw new Error('Servis pembayaran tidak memulangkan URL pembayaran.')
      }
      window.location.href = data.payment_url
      // Halaman dialihkan ke checkout CHIP — biarkan `busy` kekal.
    } catch (err) {
      toast.error(
        'Pembayaran CHIP tidak dapat dimulakan. Pastikan Edge Function create-chip-payment telah di-deploy (supabase/functions/).'
      )
      setBusy(null)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Top-up token"
    >
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mclose" onClick={onClose} aria-label="Tutup">
          ✕
        </button>

        <h2>Top-Up Token</h2>
        <p className="msub">
          Pembayaran diproses dengan selamat oleh CHIP Gateway — FPX, kad dan
          e-dompet.
        </p>

        <div className="grid3" style={{ marginTop: 20 }}>
          {CHIP_PACKAGES.map((pkg) => (
            <div className={`card pkg${pkg.highlight ? ' hot' : ''}`} key={pkg.id}>
              {pkg.highlight && <span className="hot-pill">Nilai Terbaik</span>}
              <div className="plabel">{pkg.label}</div>
              <div className="pnum">
                🪙 {pkg.tokens} <span>token</span>
              </div>
              <div className="pprice">{formatMYR(pkg.amount)}</div>
              <div className="pper">
                {(pkg.amount / pkg.tokens).toFixed(2)} MYR / token
              </div>
              <div className="pnote">{pkg.note}</div>
              <button
                type="button"
                className="btn primary"
                style={{ marginTop: 14 }}
                onClick={() => handlePay(pkg)}
                disabled={busy !== null}
              >
                {busy === pkg.id ? 'Mengalihkan…' : `Bayar ${formatMYR(pkg.amount)} via CHIP`}
              </button>
            </div>
          ))}
        </div>

        <p className="mnote">
          Token dikreditkan secara automatik selepas CHIP mengesahkan pembayaran.
          Token habis kerana lead tidak tepat? Laporkan — laporan yang diluluskan
          mendapat bayaran balik token.
        </p>
      </div>
    </div>
  )
}
