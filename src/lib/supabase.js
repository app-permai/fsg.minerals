import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).'
  )
}

// IMPORTANT: never put the service_role key in the frontend.
// The anon key is safe here because every sensitive operation is
// guarded server-side by the RPCs and RLS policies.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Maps Postgres error codes raised by our RPCs to friendly messages. */
export function rpcErrorMessage(err) {
  const msg = err?.message || ''
  if (msg.includes('INSUFFICIENT_TOKEN_BALANCE'))
    return 'Insufficient Token Balance. Please Top-Up.'
  if (msg.includes('NOT_AUTHENTICATED'))
    return 'Please sign in first.'
  if (msg.includes('LEAD_NOT_FOUND'))
    return 'This listing no longer exists.'
  if (msg.includes('LEAD_UNAVAILABLE'))
    return 'This listing was reported and is currently unavailable.'
  if (msg.includes('CONTACT_NOT_UNLOCKED'))
    return 'Unlock the contact details first (1 token).'
  if (msg.includes('COA_NOT_AVAILABLE'))
    return 'No lab report attached to this listing yet.'
  if (msg.includes('ALREADY_REPORTED'))
    return 'You already reported this lead.'
  if (msg.includes('LEAD_NOT_UNLOCKED'))
    return 'Unlock the lead before reporting it.'
  if (msg.includes('FORBIDDEN'))
    return 'You do not have permission for this action.'
  return msg || 'Something went wrong. Please try again.'
}
