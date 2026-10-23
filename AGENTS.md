# AGENTS.md — FSG Minerals

Persistent architecture memory for this repository. Read this before
investigating the codebase; it exists so that schema, security invariants
and product rules do not need to be rediscovered on every task.

**Stack:** React 18 + Vite 6 (SPA) → Cloudflare Pages · Supabase (Postgres 17,
Auth, Edge Functions) · CHIP payment gateway.

**Production:** https://fsgminerals.trade (and `www.`)
**Repo:** https://github.com/app-permai/fsg.minerals

---

## 1. Non-negotiable security invariant

**Sensitive listing fields are masked inside Postgres, not in the browser.**

`public.mask_secret(text)` returns the literal `'••••••••'` for any input.
Every public listing RPC calls it on `company_name`, `contact_person`,
`phone`, `email` and `exact_mine_address` unless the caller has a matching
row in `unlocked_leads`.

Consequence: a tampered client cannot reveal contacts before paying. Any
change that moves masking into React is a regression, even if it looks
identical on screen.

---

## 2. Database schema (project ref `wjrlcbhmklodrtpuhprq`)

All tables live in `public` and have RLS enabled.

| Table | Purpose | RLS policies |
|---|---|---|
| `profiles` | One row per auth user; holds `token_balance` | 3 (read own, update own, admin read) |
| `listings` | Buyer/seller directory entries | 2 (seller manage own, admin full) |
| `unlocked_leads` | Proof a user paid 1 token for a lead's contacts | 2 (read own, admin read) |
| `unlocked_docs` | Proof a user paid for a COA document | 2 (read own, admin read) |
| `token_transactions` | Immutable ledger of every token movement | 2 (read own, admin read) |
| `lead_reports` | "Inaccurate lead" reports; drives refunds and auto-flagging | 2 (read own, admin read) |
| `fsg_quotes` | Quote requests from the Request Quote modal | 0 — service-role only |
| `fsg_invoices` | Invoices generated from quotes | 0 — service-role only |

**Important column notes**

- `fsg_quotes` has **`number`**, not `quote_number`. `quote_number` lives on
  `fsg_invoices`. Do not write `quote_number` against `fsg_quotes`.
- `listings` uses `mineral_type`, `quantity_available`, `price_indication`,
  `exact_mine_address`, `side` (`'buy'` | `'sell'`), `incoterms`, `verified`,
  `flagged`, `coa_document_url`, `status` (`'active'` by default).
- `profiles` has **no email column** — join `auth.users` on `id` when email is
  needed.
- `unlocked_leads` and `unlocked_docs` deliberately have **no INSERT policy**:
  rows can only be created by the SECURITY DEFINER RPCs, never forged.

**Sequences:** `fsg_quote_seq`, `fsg_invoice_seq`, `fsg_quotes_id_seq`,
`fsg_invoices_id_seq`.

**Storage buckets** (both private): `fsg-docs`, `coa-documents`.

---

## 3. RPC functions and their grants

| Function | Grantee | Notes |
|---|---|---|
| `get_public_listings(p_limit, p_offset)` | anon, authenticated | Masked directory, legacy shape |
| `get_radar_listings(p_side, p_mineral, p_country, p_search, p_limit, p_offset)` | anon, authenticated | Masked, filterable |
| `get_radar_stats()` | anon, authenticated | Aggregates only, no rows |
| `unlock_lead(p_lead_id)` | authenticated only | Charges 1 token |
| `unlock_coa_document(p_lead_id)` | authenticated only | Charges 1 token |
| `submit_lead_report(...)` | authenticated only | Requires prior unlock |
| `process_token_refund(...)` | authenticated only | Admin-gated internally |
| `is_admin()` | authenticated only | |
| `user_has_coa_access(text)` | authenticated only | |
| `add_tokens(uuid, integer, text)` | **service_role only** | Never expose to browser |
| `mask_secret(text)` | default | Returns `'••••••••'` |
| `fsg_quote_nextval()` | anon, authenticated | ⚠️ sequence burn possible |
| `fsg_invoice_nextval()` | anon, authenticated | ⚠️ sequence burn possible |

**Trigger:** `on_auth_user_created` on `auth.users` → `handle_new_user()`,
which inserts a `profiles` row with `token_balance = 10` and one
`token_transactions` row (`type='bonus'`). This is the ONLY place the welcome
bonus is granted; the frontend never sets a balance.

**Trigger:** `guard_sensitive_profile_fields` on `profiles` — a BEFORE UPDATE
guard that raises `P0403 TOKEN_BALANCE_PROTECTED` if `token_balance` or `role`
changes outside a token operation. Column-level `UPDATE` on those two columns
is also revoked from `authenticated`.

---

## 4. Product rules (user journey)

**Rule A — Guest mode.** Anyone, logged in or not, may browse the Radar
Prospek directory and its metrics for free. Company, contact person, phone,
email and mine address render as `████████ Co. Ltd` / `••••••••`.

**Rule B — Registration grants 10 tokens.** Clicking any masked contact field
or unlock button while logged out opens `SignUpModal`. Registration credits 10
tokens automatically via the DB trigger above. The header shows a gold
`🪙 N Tokens` badge sourced from `profiles.token_balance`.

**Rule C — Unlock costs 1 token.** Logged-in users call `unlock_lead`, which
debits 1 token, writes an `unlocked_leads` row and returns the full contact.
Toast: `1 Token Deducted. Lead Unlocked.` On `INSUFFICIENT_TOKEN_BALANCE` the
top-up modal opens automatically.

---

## 5. Frontend map

```
src/
  App.jsx                    ToastProvider > AuthProvider > Home
  pages/Home.jsx             Header, Hero, RadarProspek, HowItWorks,
                             MineralsGrid, CaraBerurusan, Footer + modals
  pages/PublicListings.jsx   Standalone listing page (LeadCard grid)
  components/
    RadarProspek.jsx         ⭐ Buyer/supplier radar: 3-step strip,
                             5 metric cards, side tabs, mineral/country
                             filters, debounced search, masked contact rows
    Header.jsx               Nav, theme toggle, token badge, quote button
    Hero.jsx                 Corporate hero + 4 stat cards
    RequestQuoteModal.jsx    Calls create-quote edge function
    SignUpModal.jsx          Register/Login tabs
    TopUpModal.jsx           CHIP packages
    LeadCard.jsx             Card used by PublicListings
    ReportLeadModal.jsx      Report inaccurate lead
    SellerCoaUpload.jsx      COA upload to private bucket
    AdminReportsPanel.jsx    Admin review of lead reports
    HowItWorks.jsx           4-step token explainer
    MineralsGrid.jsx         Mineral focus grid
    Toast.jsx                Toast context
  context/AuthContext.jsx    Session + live tokenBalance + refreshBalance
  lib/supabase.js            Client + rpcErrorMessage() code mapping
  lib/packages.js            CHIP package definitions
  fsg.css                    ⭐ Single stylesheet, CSS variables,
                             light (emerald/white) + dark (forest green) themes
```

**Theme:** Emerald green `#0E7A52` on white, Playfair Display headings +
Manrope body. Dark mode is forest green `#0A1410`, never navy. Toggle writes
`data-theme` on `<html>` and persists to `localStorage['fsg-theme']`.

**Removed:** `DirectoryTeaser.jsx` was deleted and replaced by
`RadarProspek.jsx`. Do not reintroduce it.

---

## 6. Edge functions

| Slug | verify_jwt | Status |
|---|---|---|
| `create-quote` | `false` | ACTIVE |
| `admin-api` | `false` | ACTIVE |
| `create-chip-payment` | — | in repo, not deployed |
| `chip-webhook` | — | **in repo, deliberately NOT deployed** |

⚠️ **`chip-webhook` has no signature verification.** It contains a TODO and
would let anyone who knows the URL POST a forged `topup:<uuid>:pro` reference
and receive free tokens via service_role `add_tokens`. Do not deploy it until
HMAC verification is implemented.

---

## 7. Deployment

- **Host:** Cloudflare Pages, project `fsg-minerals`, subdomain
  `fsg-minerals-c8x.pages.dev`, production branch `main`.
- **Build:** `npm run build` → `vite build && node scripts/copy-legacy.mjs`,
  output `dist/`. Env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  are bound in the Pages project (production and preview).
- **DNS:** `fsgminerals.trade` and `www` are CNAME → `fsg-minerals-c8x.pages.dev`,
  proxied. Both custom domains are `active`.
- **Zone settings:** `ssl: strict`, `always_use_https: on`,
  `min_tls_version: 1.2`, `tls_1_3: on`.
- **Mail:** MX → Zoho. Single DMARC record (`p=none`), SPF includes Zoho, DKIM
  present.
- Pushing to `main` triggers a production deploy. If the custom domain serves a
  stale bundle after a deploy, purge the Cloudflare cache.

**Legacy static pages** (`/admin`, `/market-tool`, `/minerals`, `/contact`,
`/corporate`) live in `legacy/` and are copied into `dist/` at build time by
`scripts/copy-legacy.mjs`.

---

## 8. Auth configuration (project-level, not in the repo)

- `site_url`: `https://fsgminerals.trade`
- Redirect allow-list: production, preview and `localhost:5173`
- `mailer_autoconfirm`: **`true`** — enabled deliberately because no SMTP is
  configured (`smtp_host: null`, rate limit 2 emails/hour), which would
  otherwise block registration with `429 over_email_send_rate_limit`.
- `jwt_exp`: 3600

⚠️ `mailer_autoconfirm: true` means anyone can register with an email they do
not own and immediately receive 10 tokens. Before real production use,
configure Zoho SMTP and set `mailer_autoconfirm` back to `false`.

---

## 9. Migrations

Applied in order via the Supabase Management API
(`POST /v1/projects/{ref}/database/query`):

```
01_schema_and_storage.sql      tables, buckets
02_rpc_functions.sql           RPCs, grants, anti-tamper guard
03_rls_and_storage_policies.sql RLS policies, column privileges
04_marketplace_homepage.sql    get_public_listings v2, 10-token trigger
05_radar_prospek.sql           get_radar_stats, get_radar_listings
06_radar_demo_seed.sql         12 demo listings (remove before real launch)
```

**Demo data cleanup:**
```sql
delete from public.listings where id::text like 'a1000000-0000-4000-8000-%';
```

---

## 10. Known open risks

1. `chip-webhook` lacks signature verification — keep undeployed.
2. `create-quote` and `admin-api` run with `verify_jwt: false`.
3. `fsg_quote_nextval` / `fsg_invoice_nextval` are callable by `anon`
   (sequence burn).
4. `mailer_autoconfirm: true` with no SMTP — see §8.
5. 12 demo listings sit in the production database.
6. `dbAllowedCidrs: 0.0.0.0/0` and `pitr_enabled: false` — no physical backup.

---

## 11. Verification recipes

```bash
# Guest sees masked contacts, never real values
curl -s -X POST "https://wjrlcbhmklodrtpuhprq.supabase.co/rest/v1/rpc/get_radar_listings" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -d '{"p_limit":100}'
# every company_name/contact_person/phone/email must be "••••••••"

# Anonymous must NOT read listings directly
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://wjrlcbhmklodrtpuhprq.supabase.co/rest/v1/listings" -H "apikey: $ANON"
# expect 401 (no SELECT grant for anon)

# Other tables answer 200 with an EMPTY array — RLS filters every row.
# An empty array is correct; any row content is a leak.
for t in profiles unlocked_leads unlocked_docs token_transactions fsg_quotes; do
  printf '%-22s %s\n' "$t" \
    "$(curl -s "https://wjrlcbhmklodrtpuhprq.supabase.co/rest/v1/$t?select=*" -H "apikey: $ANON")"
done
# expect [] for every table

# Anonymous must not reach the paid RPCs
curl -s -X POST "https://wjrlcbhmklodrtpuhprq.supabase.co/rest/v1/rpc/unlock_lead" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -d '{"p_lead_id":"<uuid>"}'
# expect 42501 permission denied for function unlock_lead
# same for add_tokens — service_role only

# chip-webhook must stay undeployed
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  "https://wjrlcbhmklodrtpuhprq.supabase.co/functions/v1/chip-webhook" -d '{}'
# expect 404
```

Local build and preview:

```bash
npm install
npm run build      # vite build + copy legacy pages into dist/
npm run dev        # vite dev server on :5173
```

`.env` must define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. It is
gitignored; never commit it and never put a service_role key in the frontend.
