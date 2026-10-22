/**
 * CHIP Gateway top-up packages shown in the TopUpModal.
 *
 * PRICES ARE PLACEHOLDERS — adjust them to your real pricing.
 *
 * Keep in sync with supabase/functions/create-chip-payment/index.ts.
 * The Edge Function is the authority: the client only sends a
 * package_id and never a price, so users cannot tamper with amounts.
 */
export const CHIP_PACKAGES = [
  { id: 'starter', label: 'Starter', tokens: 10, amount: 19, note: 'Try the platform' },
  { id: 'value', label: 'Value', tokens: 30, amount: 49, note: 'Most popular', highlight: true },
  { id: 'pro', label: 'Pro', tokens: 100, amount: 139, note: 'Active traders' },
]

/** Formats a MYR amount, e.g. 49 -> "RM49.00" */
export function formatMYR(amount) {
  return `RM${Number(amount).toFixed(2)}`
}
