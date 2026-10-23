/**
 * Data mineral fokus — diambil terus dari main.js laman korporat asal.
 *
 * PENTING — dua medan ID yang berbeza:
 *   `id`     ID kanonik yang dihantar ke Edge Function `create-quote`.
 *            Ia SUDAH digunakan oleh pricing di core.ts (TITA, LITH,
 *            TANT, ALU). Menukarnya akan memecahkan harga sebutharga,
 *            jadi ia dikekalkan seperti asal.
 *   `rateId` Padanan kepada `market_rates.mineral_id` dalam Supabase,
 *            yang menggunakan nama penuh (TITANIUM, ALUMINIUM, …).
 *
 * `price` ialah NILAI RUJUKAN, bukan live. Harga live hanya tersedia
 * untuk 4 mineral yang mempunyai pasaran niaga hadapan awam:
 * AURUM, SILVER, COPPER, ALU (COMEX). Lima lagi diniagakan OTC
 * melalui LME/Fastmarkets berbayar dan kekal rujukan manual.
 *
 * `unit` menentukan unit paparan untuk harga live.
 */
export const MINERALS = [
  { id: 'COPPER',   rateId: 'COPPER',    bm: 'Kuprum (Copper)',   sym: 'COPPER / LME',        base: 'tan metrik', unit: 'tonne', price: '$9,520 / tan',  desc: 'Katod & concentrate. Rujukan LME.' },
  { id: 'TITA',     rateId: 'TITANIUM',  bm: 'Titanium',          sym: 'TITANIUM SPONGE',     base: 'tan metrik', unit: 'tonne', price: '$11,500 / tan', desc: 'Sponge & ilmenite. Rujukan Fastmarkets.' },
  { id: 'LITH',     rateId: 'LITHIUM',   bm: 'Litium (LCE)',      sym: 'LITHIUM CARBONATE',   base: 'tan metrik', unit: 'tonne', price: '$10,800 / tan', desc: 'Lithium carbonate equivalent.' },
  { id: 'COLTAN',   rateId: 'COLTAN',    bm: 'Koltan (Coltan)',   sym: 'COLTAN',              base: 'kg',         unit: 'kg',    price: '$85 / kg',      desc: 'Coltan tantalum-niobium.' },
  { id: 'TANT',     rateId: 'TANTALUM',  bm: 'Tantalum',          sym: 'TANTALUM',            base: 'kg',         unit: 'kg',    price: '$185 / kg',     desc: 'Tantalum concentrate.' },
  { id: 'AURUM',    rateId: 'AURUM',     bm: 'Aurum',             sym: 'AURUM / LBMA',        base: 'oz troy',    unit: 'oz',    price: '$2,675 / oz',   desc: 'Rujukan LBMA. Assay penuh.' },
  { id: 'SILVER',   rateId: 'SILVER',    bm: 'Perak (Silver)',    sym: 'SILVER / COMEX',      base: 'oz troy',    unit: 'oz',    price: '$31.80 / oz',   desc: 'Rujukan COMEX.' },
  { id: 'TIN',      rateId: 'TIN',       bm: 'Timah (Tin)',       sym: 'TIN / LME',           base: 'tan metrik', unit: 'tonne', price: '$32,200 / tan', desc: 'Rujukan LME.' },
  { id: 'ALU',      rateId: 'ALUMINIUM', bm: 'Aluminium',         sym: 'ALUMINIUM / LME',     base: 'tan metrik', unit: 'tonne', price: '$2,620 / tan',  desc: 'Rujukan LME.' },
]
