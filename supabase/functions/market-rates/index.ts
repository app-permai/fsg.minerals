/**
 * FSG market-rates — proksi harga pasaran langsung + kadar USD/MYR.
 *
 * Kenapa fungsi ini wujud:
 *  - Yahoo Finance TIDAK menghantar header CORS, jadi pelayar tidak
 *    boleh memanggilnya terus. Fungsi ini memproksi di sebelah pelayan.
 *  - Satu panggilan setiap 15 minit untuk SEMUA pelawat (cache DB),
 *    bukan satu panggilan setiap pelawat. Ini yang mengelakkan had kadar.
 *
 * Aliran:
 *   GET /functions/v1/market-rates
 *     -> jika cache < 15 min: pulangkan cache
 *     -> jika luput: ambil Yahoo + FX, tulis cache, pulangkan
 *     -> jika sumber gagal: pulangkan cache lama dengan is_live=false
 *
 * Tiada kunci API diperlukan (Yahoo dan open.er-api.com kedua-duanya
 * percuma tanpa kunci). Jika kemudian hari kunci diperlukan, letakkan
 * dalam Supabase secrets — JANGAN sekali-kali dalam bundle klien.
 */

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minit
const UA = "Mozilla/5.0 (compatible; FSG-Market/1.0)";

/**
 * Peta mineral -> simbol penyedia + unit sebut harga.
 * `factor` menukar harga sebut harga kepada USD per kg.
 */
const SYMBOLS: Record<string, { symbol: string; unit: string; factor: number }> = {
  AURUM:     { symbol: "GC=F",  unit: "oz",    factor: 1 / 0.0311034768 },
  SILVER:    { symbol: "SI=F",  unit: "oz",    factor: 1 / 0.0311034768 },
  COPPER:    { symbol: "HG=F",  unit: "lb",    factor: 2.2046226218 },
  ALUMINIUM: { symbol: "ALI=F", unit: "tonne", factor: 1 / 1000 },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}

type Quote = { symbol: string; price: number; unit: string; factor: number };

/** Ambil satu simbol dari Yahoo Finance. Null jika gagal. */
async function fetchYahoo(symbol: string): Promise<number | null> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=1d&range=1d`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

/** Kadar USD -> MYR. Cubaan pertama er-api, sandaran Frankfurter. */
async function fetchUsdMyr(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const d = await res.json();
      const r = d?.rates?.MYR;
      if (typeof r === "number" && r > 0) return r;
    }
  } catch {
    /* cuba sumber kedua */
  }
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=MYR", {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (res.ok) {
      const d = await res.json();
      const r = d?.rates?.MYR;
      if (typeof r === "number" && r > 0) return r;
    }
  } catch {
    /* tiada sumber */
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const { createClient } = await import("npm:@supabase/supabase-js@2.57.4");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // ---------- 1. baca cache ----------
  const [{ data: cachedRates }, { data: cachedFx }] = await Promise.all([
    supabase.from("market_rates").select("*"),
    supabase.from("fx_rates").select("*").eq("pair", "USDMYR").maybeSingle(),
  ]);

  const newest = (cachedRates ?? []).reduce<string | null>((acc, r) => {
    return !acc || r.updated_at > acc ? r.updated_at : acc;
  }, null);
  const ageMs = newest ? Date.now() - new Date(newest).getTime() : Infinity;
  const fresh = ageMs < CACHE_TTL_MS && (cachedRates ?? []).some((r) => r.is_live);

  if (fresh) {
    return json(200, {
      ok: true,
      cached: true,
      live: true,
      live_count: (cachedRates ?? []).filter((r) => r.is_live).length,
      total: (cachedRates ?? []).length,
      missing: [],
      updated_at: newest,
      age_seconds: Math.round(ageMs / 1000),
      usd_myr: cachedFx?.rate ?? null,
      fx_live: cachedFx?.is_live ?? false,
      rates: cachedRates,
    });
  }

  // ---------- 2. ambil sumber langsung ----------
  const entries = Object.entries(SYMBOLS);
  const quotes = await Promise.all(
    entries.map(async ([id, cfg]) => {
      const price = await fetchYahoo(cfg.symbol);
      return { id, ...cfg, price };
    }),
  );
  const fx = await fetchUsdMyr();

  const live = quotes.filter((q) => q.price !== null) as (Quote & { id: string; price: number })[];
  const anyLive = live.length > 0;

  // ---------- 3. tulis cache ----------
  if (anyLive) {
    const rows = live.map((q) => ({
      mineral_id: q.id,
      symbol: q.symbol,
      price_usd: q.price,
      quote_unit: q.unit,
      price_usd_kg: q.price * q.factor,
      source: "yahoo",
      is_live: true,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from("market_rates").upsert(rows, { onConflict: "mineral_id" });
  }
  if (fx !== null) {
    await supabase.from("fx_rates").upsert(
      { pair: "USDMYR", rate: fx, source: "er-api", is_live: true, updated_at: new Date().toISOString() },
      { onConflict: "pair" },
    );
  }

  // ---------- 4. balas ----------
  // Jika sumber gagal sepenuhnya, pulangkan cache lama supaya halaman
  // tidak pernah pecah — tetapi tandakan live:false supaya UI jujur.
  const [{ data: finalRates }, { data: finalFx }] = await Promise.all([
    supabase.from("market_rates").select("*"),
    supabase.from("fx_rates").select("*").eq("pair", "USDMYR").maybeSingle(),
  ]);

  return json(200, {
    ok: true,
    cached: false,
    live: anyLive || (finalFx?.is_live ?? false),
    updated_at: new Date().toISOString(),
    usd_myr: finalFx?.rate ?? null,
    fx_live: finalFx?.is_live ?? false,
    live_count: (finalRates ?? []).filter((r) => r.is_live).length,
    total: (finalRates ?? []).length,
    missing: entries.filter(([id]) => !live.some((q) => q.id === id)).map(([id]) => id),
    rates: finalRates,
  });
});
