/**
 * Cara Token Berfungsi — 4 langkah proses token, dalam kad
 * putih/hijau korporat dengan nombor serif:
 * Daftar (10 token percuma) → Cari lead → Tukar 1 token → Top-up CHIP.
 */
const STEPS = [
  {
    n: '1',
    title: 'Daftar — 10 Token Percuma',
    text: 'Cipta akaun percuma. Profil anda dikreditkan 10 token serta-merta oleh sistem — tiada kad kredit diperlukan.',
    cta: 'register',
  },
  {
    n: '2',
    title: 'Cari Lead',
    text: 'Layari direktori pembeli & penjual langsung. Komoditi, volum, lokasi dan Incoterms sentiasa kelihatan.',
  },
  {
    n: '3',
    title: 'Tukar 1 Token — Buka Kontak',
    text: 'Jumpa padanan? Tukar 1 token untuk mendedahkan nama syarikat, orang kontak, telefon, e-mel dan alamat lombong.',
  },
  {
    n: '4',
    title: 'Top-Up via CHIP Gateway',
    text: 'Token habis? Bayar dengan selamat melalui FPX, kad atau e-dompet via CHIP. Lead tidak tepat boleh dilapor untuk bayaran balik token.',
    cta: 'topup',
  },
]

export default function HowItWorks({ onRegister, onTopUp }) {
  return (
    <section>
      <h2 className="sec-title">Cara Token Berfungsi</h2>
      <p className="sec-sub">
        Ekonomi token ringkas yang melindungi kedua-dua pihak dalam urusan niaga.
      </p>
      <div className="grid3">
        {STEPS.map((s) => (
          <div className="card stepcard" key={s.n}>
            <div className="stepnum">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {s.cta === 'register' && (
              <button type="button" className="lnk" onClick={onRegister}>
                Register Free →
              </button>
            )}
            {s.cta === 'topup' && (
              <button type="button" className="lnk" onClick={onTopUp}>
                Top-Up Token →
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
