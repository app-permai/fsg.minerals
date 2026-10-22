# FSG Minerals — Platform Security & Monetization Upgrade

**Ringkasan (BM):** Pakej ini menaiktaraf teras fsgminerals.trade dalam 2 bahagian.

**Bahagian A (keselamatan & monetisasi):** (1) maklumat sensitif (syarikat, orang,
telefon, e-mel, alamat lombong) disaring di lapisan database — tidak bocor melalui API;
(2) butang "Report Inaccurate Lead" dengan bayaran balik token automatik selepas admin
luluskan; (3) sistem buka kunci 2 peringkat — kontak (1 token) dan laporan makmal COA PDF
(1 token lagi, URL bertanda tangan 5 minit); (4) lencana "Verified / Reported" dan
notifikasi toast yang jelas.

**Bahagian B (homepage pasaran B2B):** laman depan bertukar daripada laman syarikat
tunggal kepada marketplace B2B — header dengan butang Log In / Register Free dan lencana
baki token (🪙 N Tokens), hero "Global B2B Mineral Trading Platform", direktori
"Latest Buyers & Sellers" yang disaring (Unlock 1 token; tetamu disoal daftar dahulu),
bahagian "How It Works" 4 langkah token, dan modal bayaran balik (top-up) CHIP yang
terbuka automatik apabila baki mencecah 0. Akaun baharu mendapat 10 token percuma
secara automatik (trigger database).

Jalankan 4 fail SQL mengikut turutan dalam Supabase SQL Editor, kemudian salin komponen
React ke dalam projek anda.

---

## What's inside

```
fsg-platform/
├── supabase/
│   ├── migrations/
│   │   ├── 01_schema_and_storage.sql      # tables, new columns, private COA bucket
│   │   ├── 02_rpc_functions.sql           # all business logic (RPCs) + anti-tamper trigger
│   │   ├── 03_rls_and_storage_policies.sql# row-level security + private Storage policies
│   │   └── 04_marketplace_homepage.sql    # directory fields + 10-token welcome trigger
│   └── functions/
│       ├── create-chip-payment/index.ts   # Edge Function: create CHIP purchase (skeleton)
│       └── chip-webhook/index.ts          # Edge Function: credit tokens on payment (skeleton)
├── src/
│   ├── lib/
│   │   ├── supabase.js                    # client + error-message mapping
│   │   └── packages.js                    # CHIP top-up packages (placeholder prices)
│   ├── context/AuthContext.jsx            # session + live token balance
│   ├── components/
│   │   ├── Toast.jsx                      # toast provider (3 required messages)
│   │   ├── Header.jsx                     # nav, Log In / Register Free, 🪙 token badge
│   │   ├── Hero.jsx                       # marketplace tagline + "Register Free & Get 10 Tokens"
│   │   ├── DirectoryTeaser.jsx            # masked "Latest Buyers & Sellers" directory
│   │   ├── HowItWorks.jsx                 # 4-step token process
│   │   ├── SignUpModal.jsx                # register / log-in modal (guests)
│   │   ├── TopUpModal.jsx                 # CHIP payment packages modal
│   │   ├── Footer.jsx
│   │   ├── LeadCard.jsx                   # listing card: badges, masking, 2-tier unlock
│   │   ├── ReportLeadModal.jsx            # "Report Inaccurate Lead" dialog
│   │   ├── SellerCoaUpload.jsx            # seller uploads COA PDF (private bucket)
│   │   └── AdminReportsPanel.jsx          # admin: approve/reject reports, refunds
│   ├── pages/
│   │   ├── Home.jsx                       # B2B marketplace homepage
│   │   └── PublicListings.jsx             # full marketplace grid
│   └── App.jsx                            # wiring example
└── .env.example
```

Frontend requirements: React 17+, Tailwind CSS, `@supabase/supabase-js` v2.

## How to apply (Supabase Dashboard)

### Run the marketplace locally / deploy it

This repository is a complete runnable Vite + React + Tailwind app.

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
npm run build          # dist/ = marketplace SPA + legacy corporate pages
```

`npm run build` also copies `legacy/` (the original corporate site:
`corporate.html`, `minerals.html`, `market-tool.html`, `contact.html`,
`admin.html` + assets) into `dist/`, so one folder can be deployed
anywhere. The current production deployment is Cloudflare Pages,
project **fsg-minerals** (custom domain **fsgminerals.trade**):

```bash
npx wrangler pages deploy dist --project-name fsg-minerals
```

### Database migrations

1. **SQL Editor** → paste and run, in order:
   `01_schema_and_storage.sql` → `02_rpc_functions.sql` → `03_rls_and_storage_policies.sql`
   → `04_marketplace_homepage.sql`. All four are idempotent (safe to re-run).
2. **Make yourself admin** (once):
   ```sql
   update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
   ```
3. **Frontend**: copy `src/` into your project, set the two variables from
   `.env.example` in your `.env`, and render `App.jsx` (or mount `Home.jsx` on
   `/` and `PublicListings.jsx` on `/marketplace`).
4. **CHIP top-ups (optional, for going live)** — deploy the two Edge Functions
   and set their secrets:
   ```bash
   supabase secrets set CHIP_SECRET_KEY=... CHIP_BRAND_ID=... SITE_URL=https://fsgminerals.trade
   supabase functions deploy create-chip-payment
   supabase functions deploy chip-webhook --no-verify-jwt
   ```
   Then point CHIP's webhook/callback URL to the `chip-webhook` function URL.

## How each requirement is enforced

### 1. Strict backend data masking
- Public browsing calls **only** `get_public_listings()` (SECURITY DEFINER). It replaces
  `company_name`, `contact_person`, `phone`, `email`, `exact_mine_address` with
  `••••••••` **inside SQL** unless the caller has an `unlocked_leads` row for that
  specific lead (or is the seller of it). The raw values never enter the JSON payload.
- Direct table reads are dead ends: RLS is enabled with **no SELECT policy for `anon`**
  on `listings`, and `SELECT` is revoked from the `anon` role outright.
- `unlocked_leads` / `unlocked_docs` have **no INSERT policy** — a user cannot forge
  an unlock row via the REST API; rows are created only inside the paid RPCs.

### 2. Failed lead reporting & automatic token refund
- `submit_lead_report(lead_id, reason, details)` — only users who **paid to unlock**
  the lead can report; one report per user per lead. Listings auto-flag at 3+
  distinct reporters (protection before admin review).
- `process_token_refund(report_id, approve)` — admin-only (checks `profiles.role`).
  Approve → reporter's `token_balance +1`, refund row in `token_transactions`,
  report `approved`, listing `flagged = true` (and `inactive` when the reason was
  "Inactive Listing"). Reject → no refund. Double-processing is blocked by a row
  lock + status check.

### 3. COA document monetization (dual tier)
- `listings.coa_document_url` stores the **private Storage path**
  (`coa/<lead_id>/<file>.pdf`), not a public URL — pre-signed URLs stored in the
  DB are an anti-pattern since they expire.
- Tier 1 `unlock_lead()` → 1 token. Tier 2 `unlock_coa_document()` → 1 more token,
  requires Tier 1 first, records the purchase in `unlocked_docs`, and returns the
  path + expiry window. The 5-minute signed URL is then created via
  `supabase.storage.createSignedUrl()`, which only succeeds when the Storage RLS
  policy finds an `unlocked_docs` row — so knowing the path is useless without
  paying. All balance checks/deductions are atomic (`SELECT … FOR UPDATE` +
  unique constraints) — no double-spend even with rapid double clicks.
- Sellers upload PDFs (10 MB max, PDF-only bucket) via `SellerCoaUpload.jsx`;
  the write policy only allows paths under their own listings.

### 4. Frontend UX
- Badges: **Verified Lead** (green) and **Reported** (amber) on every card.
- Toasts (exact copy): `1 Token Deducted. Lead Unlocked.` ·
  `Report Submitted. Token will be refunded upon verification.` ·
  `Insufficient Token Balance. Please Top-Up.`

---

## Upgrade B — B2B Marketplace Homepage

Transforms the homepage from a single-company site into a marketplace.

### Header (`Header.jsx`)
- Navigation: **Marketplace** (`#marketplace`), **Submit RFQ** (`#rfq`),
  **How It Works** (`#how-it-works`) — hash anchors on the homepage.
- Guests see **Log In** + **Register Free**; logged-in users see the dynamic
  **🪙 N Tokens** badge (live from `profiles.token_balance` via `AuthContext`)
  — clicking it opens the CHIP top-up modal — plus log out.

### Hero (`Hero.jsx`)
- Tagline: *Global B2B Mineral Trading Platform — Connecting Direct Mine
  Owners & End Buyers*.
- Primary CTA **"Register Free & Get 10 Tokens"** (guests) — the 10 tokens are
  credited by the `handle_new_user` trigger in migration 04, **not** by the
  client, so the starting balance cannot be forged. Logged-in users see
  "Browse the Marketplace" instead.

### Masked live directory (`DirectoryTeaser.jsx`)
- "Latest Buyers & Sellers" — table (desktop) / cards (mobile) showing the
  public fields: Commodity, Volume, Location, Incoterms, Updated date, plus a
  Buyer/Seller tag (`listings.side`).
- Company names and phone numbers render as `████████ Co. Ltd` /
  `+██ ████ ████`. This is cosmetic only — `get_public_listings` v2 (migration
  04) still returns `••••••••` from the database for locked leads, so a
  tampered client cannot reveal the real values.
- Per-row button **"Unlock Contact Details (1 Token)"**:
  - Guest → opens the Sign-Up modal (no unlock RPC call is even attempted).
  - Logged in → `unlock_lead` RPC → toast `1 Token Deducted. Lead Unlocked.`
    → row reveals, header badge refreshes.
  - Balance hits 0 after the spend, or the RPC raises
    `INSUFFICIENT_TOKEN_BALANCE` → toast + the **CHIP top-up modal opens
    automatically**.
  - Flagged rows show "Reported — paused" and cannot be unlocked.

### How It Works (`HowItWorks.jsx`)
The 4-step token process: **Register (10 Free Tokens) → Search Leads →
Redeem 1 Token to Unlock Details → Top-Up via CHIP Gateway**, with quick links
to register / top-up.

### CHIP top-up modal (`TopUpModal.jsx` + `src/lib/packages.js`)
- 3 packages (Starter/Value/Pro — **prices are placeholders**, edit
  `src/lib/packages.js` and keep the Edge Function copy in sync).
- Paying calls the `create-chip-payment` Edge Function with **only a
  `package_id`** — amounts are decided server-side, so prices cannot be
  tampered with. The browser is redirected to CHIP's hosted checkout; on
  success `chip-webhook` credits the tokens via the service-role-only
  `add_tokens()` RPC (idempotent by reference).
- Both Edge Functions are **integration skeletons** with clearly marked TODOs
  (endpoint, amount units, callback payload, signature verification) — verify
  them against your CHIP account docs before going live. If you already have a
  CHIP integration, point `handlePay()` at it instead.

## Token integrity (defense in depth)

`profiles.token_balance` and `role` cannot be changed by users:
1. Column privileges revoked (`revoke update (token_balance, role)`).
2. `guard_sensitive_profile_fields` trigger rejects any change made outside the
   trusted RPCs (they set a transaction-local flag before updating).
3. All RPC changes are logged in `token_transactions` (audit trail).

Token top-ups after CHIP payment: call `add_tokens(user_id, amount, reference)`
from your **webhook with the service_role key** (the function is executable only
by `service_role`).

## Assumptions about your current schema

The SQL assumes the column names below on existing tables. `CREATE TABLE IF NOT
EXISTS` / `ADD COLUMN IF NOT EXISTS` never overwrite your live data — but if your
production tables use different names, update the column lists in the functions
of `02_rpc_functions.sql` and `04_marketplace_homepage.sql` to match:

| Table | Expected columns |
|---|---|
| `profiles` | `id` (auth.users uuid), `full_name`, `role`, `token_balance` |
| `listings` | `id`, `seller_id`, `title`, `mineral_type`, `country`, `region`, `quantity_available`, `price_indication`, `company_name`, `contact_person`, `phone`, `email`, `exact_mine_address`, `status`, `updated_at` |
| `listings` (added by 04) | `side` ('buy'/'sell'), `incoterms` |

Migration 04 **drops and recreates** `get_public_listings` (Postgres cannot
change a function's return type with `CREATE OR REPLACE`); its grants are
re-asserted automatically. Any client code selecting the RPC's columns by name
keeps working — new fields (`side`, `incoterms`, `updated_at`) are additions.

## Verification checklist (run after applying)

1. **Masking (anon):** call `get_public_listings` without login (e.g. via
   `curl` with the anon key) → all five sensitive fields are `••••••••`.
2. **No direct reads:** `GET /rest/v1/listings` with the anon key → empty result
   or permission error. Same for `unlocked_leads`.
3. **No self-unlock:** `POST /rest/v1/unlocked_leads` → rejected (no insert policy).
4. **Token tamper:** signed-in user `PATCH /rest/v1/profiles` with
   `{"token_balance": 999}` → permission denied / trigger error.
5. **Insufficient balance:** unlock with 0 tokens → error
   `INSUFFICIENT_TOKEN_BALANCE` → toast shows "Insufficient Token Balance. Please Top-Up."
6. **No double-charge:** click "Unlock" twice fast → still exactly one
   `lead_unlock` transaction (row lock + unique constraint).
7. **Refund flow:** report a lead → admin approves in `AdminReportsPanel` →
   reporter +1 token, listing flagged, transaction logged as `refund`.
8. **COA privacy:** try `createSignedUrl` on a COA path without paying → rejected
   by the Storage policy; after Tier-2 unlock the same call returns a working
   5-minute URL.
9. **Welcome bonus (homepage):** register a brand-new account →
   `profiles.token_balance` is `10` immediately (created by the
   `on_auth_user_created` trigger, with a `bonus` row in `token_transactions`).
10. **Guest unlock attempt:** logged out, click "Unlock Contact Details (1 Token)"
    in the homepage directory → the Sign-Up modal opens and **no RPC call is
    made**; the directory still shows masked values for every row.
11. **Zero balance → top-up modal:** spend down to 0 tokens, or try an unlock
    with 0 tokens → toast "Insufficient Token Balance. Please Top-Up." and the
    CHIP packages modal opens automatically.
12. **Token badge is live:** after any unlock the 🪙 badge in the header updates
    without a page refresh (via `AuthContext.refreshBalance`).
