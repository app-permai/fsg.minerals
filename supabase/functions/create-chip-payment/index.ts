// ============================================================
//  FSG MINERALS — Edge Function: create-chip-payment
//
//  Creates a CHIP Gateway purchase for a token top-up package
//  and returns the hosted-payment URL for the browser to open.
//
//  Deploy:
//    supabase functions deploy create-chip-payment
//  Secrets:
//    supabase secrets set CHIP_SECRET_KEY=... CHIP_BRAND_ID=...
//    (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//     are injected automatically)
//
//  ⚠ INTEGRATION SKELETON — the CHIP request/response fields below
//  follow CHIP's Purchases API (https://docs.chip-in.asia). Confirm
//  the exact shape (amount units, fields, success/failure redirect
//  handling) against your own CHIP account before going live.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Keep in sync with src/lib/packages.js — this server-side copy is
// the authority; the client only sends a package_id.
const PACKAGES = {
  starter: { tokens: 10, amount: 19 }, // MYR
  value: { tokens: 30, amount: 49 },
  pro: { tokens: 100, amount: 139 },
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  try {
    // 1. Identify the caller — any logged-in user may buy tokens.
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Not authenticated' }, 401)

    // 2. Resolve the package (amount decided server-side only).
    const { package_id } = await req.json().catch(() => ({}))
    const pkg = PACKAGES[package_id]
    if (!pkg) return json({ error: 'Unknown package' }, 400)

    // 3. Create the purchase at CHIP.
    //    The reference ties the CHIP callback to this user + package
    //    so chip-webhook credits the right account exactly once.
    const reference = `topup:${user.id}:${package_id}`

    // TODO: verify amount unit (CHIP may expect cents) and required
    // fields (brand_id, buyer info, due date, redirects) per docs.
    const chipResponse = await fetch('https://api.chip-in.asia/v1/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('CHIP_SECRET_KEY')}`,
      },
      body: JSON.stringify({
        brand_id: Deno.env.get('CHIP_BRAND_ID'),
        purchase: {
          currency: 'MYR',
          amount: pkg.amount,
          description: `FSG Minerals — ${pkg.tokens} tokens`,
          reference,
          products: [
            { name: `${pkg.tokens} FSG tokens`, quantity: 1, price: pkg.amount },
          ],
        },
        success_redirect: `${Deno.env.get('SITE_URL') ?? ''}/?topup=success`,
        failure_redirect: `${Deno.env.get('SITE_URL') ?? ''}/?topup=failed`,
        send_receipt: true,
      }),
    })

    if (!chipResponse.ok) {
      const detail = await chipResponse.text()
      console.error('CHIP purchase failed', chipResponse.status, detail)
      return json({ error: 'CHIP rejected the purchase' }, 502)
    }

    // TODO: confirm the response field that carries the hosted
    // checkout URL (commonly `checkout_url`).
    const purchase = await chipResponse.json()
    const paymentUrl = purchase.checkout_url ?? purchase.payment_url
    if (!paymentUrl) return json({ error: 'No payment URL from CHIP' }, 502)

    return json({ payment_url: paymentUrl, reference })
  } catch (err) {
    console.error(err)
    return json({ error: 'Unexpected error' }, 500)
  }
})
