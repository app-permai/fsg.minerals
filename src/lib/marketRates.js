import { useEffect, useState } from 'react'
import { supabase, rpcErrorMessage } from '../lib/supabase'

/**
 * useMarketRates — harga pasaran langsung untuk FSG Market Terminal.
 *
 * Sumber: Edge Function `market-rates`, yang memproksi Yahoo Finance
 * (COMEX futures) + kadar USD/MYR, menyimpan cache 15 minit dalam
 * `public.market_rates`, dan mengembalikan satu payload.
 *
 * Sandaran berlapis (halaman TIDAK PERNAH pecah):
 *   1. Edge Function   — segar, memproksi penyedia
 *   2. RPC get_market_rates() — cache terakhir dalam DB
 *   3. FALLBACK_RATES  — nilai statik terakhir dalam bundle
 *
 * Kejujuran: hanya 4 daripada 9 mineral mempunyai suapan awam
 * percuma (AURUM, SILVER, COPPER, ALUMINIUM). Lima lagi diniagakan
 * OTC (LME / Fastmarkets berbayar) dan kekal rujukan manual —
 * ditanda `isLive: false` supaya UI tidak berpura-pura.
 */

export const FALLBACK_RATES = {
  live: false,
  liveCount: 0,
  total: 0,
  usdMyr: 4.7,
  fxLive: false,
  updatedAt: null,
  rates: [],
}

/** Tukar USD/kg kepada unit paparan. */
export function priceIn(usdPerKg, unit) {
  if (!usdPerKg) return 0
  if (unit === 'oz') return usdPerKg * 0.0311034768 // 1 oz troy
  if (unit === 'kg') return usdPerKg
  return usdPerKg * 1000 // tonne
}

function shape(payload) {
  if (!payload || typeof payload !== 'object') return null
  const rates = Array.isArray(payload.rates) ? payload.rates : []
  if (!rates.length) return null
  return {
    live: !!payload.live,
    liveCount: payload.live_count ?? rates.filter((r) => r.is_live).length,
    total: rates.length,
    usdMyr: Number(payload.usd_myr) || FALLBACK_RATES.usdMyr,
    fxLive: !!payload.fx_live,
    updatedAt: payload.updated_at || null,
    rates: rates.map((r) => ({
      id: r.mineral_id,
      priceUsd: Number(r.price_usd) || 0,
      quoteUnit: r.quote_unit || 'tonne',
      usdPerKg: Number(r.price_usd_kg) || 0,
      provider: r.provider || null,
      isLive: !!r.is_live,
      isPublicMarket: !!r.is_public_market,
    })),
  }
}

export function useMarketRates({ pollMs = 5 * 60 * 1000 } = {}) {
  const [data, setData] = useState(FALLBACK_RATES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('none')

  useEffect(() => {
    let alive = true

    async function load() {
      // 1. Edge Function
      try {
        const { data: fn, error: fnErr } = await supabase.functions.invoke('market-rates')
        if (!alive) return
        if (!fnErr) {
          const s = shape(fn)
          if (s) {
            setData(s)
            setSource('edge')
            setError(null)
            setLoading(false)
            return
          }
        }
      } catch {
        /* jatuh ke lapisan seterusnya */
      }

      // 2. Cache DB melalui RPC
      try {
        const { data: rpc, error: rpcErr } = await supabase.rpc('get_market_rates')
        if (!alive) return
        if (!rpcErr) {
          const s = shape(rpc)
          if (s) {
            setData(s)
            setSource('db')
            setError(null)
            setLoading(false)
            return
          }
        } else {
          setError(rpcErrorMessage(rpcErr))
        }
      } catch (err) {
        if (!alive) return
        setError(err?.message || 'Ralat rangkaian.')
      }

      // 3. Nilai statik dalam bundle
      if (!alive) return
      setData(FALLBACK_RATES)
      setSource('static')
      setLoading(false)
    }

    load()
    if (!pollMs) return () => { alive = false }
    const t = setInterval(load, pollMs)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [pollMs])

  return { data, loading, error, source }
}

/**
 * Label lencana status untuk UI.
 *
 * Mengembalikan KUNCI i18n, bukan teks siap — komponen yang memanggil
 * menentukan bahasa. Ini mengelakkan teks BM terkunci di dalam hook
 * data dan memaksa setiap pemanggil menyemak sendiri.
 */
export function statusBadge({ data, loading, source }) {
  if (loading) return { textKey: 'status.loading', tone: 'loading', detailKey: null }
  if (data.live) {
    return {
      textKey: 'status.live',
      tone: 'live',
      detailKey: 'status.liveDetail',
      vars: { n: data.liveCount, total: data.total },
    }
  }
  return {
    textKey: 'status.manual',
    tone: 'manual',
    detailKey: source === 'static' ? 'status.staticDetail' : 'status.cacheDetail',
  }
}
