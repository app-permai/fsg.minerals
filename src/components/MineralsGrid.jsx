import { MINERALS } from './minerals'

/**
 * Mineral Fokus FSG — grid kad asal laman korporat (data dari main.js).
 */
export default function MineralsGrid() {
  return (
    <section>
      <h2 className="sec-title">Mineral Fokus FSG</h2>
      <p className="sec-sub">
        Sembilan mineral dengan rujukan LME / LBMA / Fastmarkets. Klik untuk
        spesifikasi dan asal.
      </p>
      <div className="grid3">
        {MINERALS.map((m) => (
          <div className="card" key={m.id}>
            <div className="sym">{m.sym}</div>
            <h3>⭐ {m.bm}</h3>
            <p>{m.desc}</p>
            <p><b>{m.price}</b> • {m.base}</p>
            <a className="btn" href="/market-tool.html">Kira Nilai →</a>
          </div>
        ))}
      </div>
    </section>
  )
}
