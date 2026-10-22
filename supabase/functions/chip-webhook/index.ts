// ============================================================
//  FSG MINERALS — Edge Function: chip-webhook
//
//  Receives payment status callbacks from CHIP, and — only for
//  CONFIRMED payments — credits the tokens via the service_role-only
//  add_tokens() RPC (see migration 02). add_tokens enforces the
//  token audit trail; the reference check below keeps the credit
//  idempotent.
//
//  Deploy:
//    supabase functions deploy chip-webhook --no-verify-jwt
//  (public endpoint — CHIP calls it without a Supabase JWT; the
//   CHIP signature check below is the authentication instead)
//
//  ⚠ INTEGRATION SKELETON — confirm the callback payload shape and
//  the signature verification method with CHIP before going live:
//  https://docs.chip-in.asia
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Keep in sync with src/lib/packages.js and create-chip-payment.
const PACKAGES = {
  starter: { tokens: 10, amount: 19 },
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
    // 1. AUTHENTICATE THE CALL.
    //    TODO: verify CHIP's signature / webhook secret header here
    //    and reject anything invalid with 401. Do not process a
    //    webhook that fails this check.
    //    e.g. const signature = req.headers.get('x-chip-signature')

    const payload = await req.json().catch(() => null)
    if (!payload) return json({ error: 'Invalid payload' }, 400)

    // 2. Parse the callback.
    //    The purchase reference we created was:
    //        'topup:<user_id>:<package_id>'
    //    TODO: confirm the exact JSON path of the reference and the
    //    payment status in CHIP's callback payload.
    const reference =
      payload?.purchase?.reference ?? payload?.data?.reference ?? ''
    const status =
      payload?.status ?? payload?.purchase?.status ?? ''

    const [, userId, packageId] = reference.split(':')
    const pkg = PACKAGES[packageId]
    if (!userId || !pkg) return json({ error: 'Unknown reference' }, 400)

    // 3. Credit ONLY confirmed payments.
    //    TODO: use CHIP's actual success status value (e.g. 'paid').
    if (status !== 'paid') {
      return json({ received: true, credited: false, reason: 'not paid' })
    }

    // 4. Idempotency: never credit the same top-up twice.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )
    const { data: existing } = await admin
      .from('token_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'topup')
      .eq('description', reference) // add_tokens stores the reference here
      .maybeSingle()
    if (existing) return json({ received: true, credited: false, reason: 'duplicate' })

    // 5. Credit the tokens (service_role only — profiles.token_balance
    //    stays untouchable from the client).
    const { error: rpcError } = await admin.rpc('add_tokens', {
      p_user_id: userId,
      p_amount: pkg.tokens,
      p_reference: reference,
    })
    if (rpcError) {
      console.error('add_tokens failed', rpcError)
      return json({ error: 'Credit failed' }, 500)
    }

    return json({ received: true, credited: true, tokens: pkg.tokens })
  } catch (err) {
    console.error(err)
    return json({ error: 'Unexpected error' }, 500)
  }
})
