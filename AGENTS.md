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
| `listings` | Buyer/seller/processor directory entries | 2 (seller manage own, admin full) |
| `unlocked_leads` | Proof a user paid 1 token for a lead's contacts | 2 (read own, admin read) |
| `unlocked_docs` | Proof a user paid for a COA document | 2 (read own, admin read) |
| `token_transactions` | Immutable ledger of every token movement | 2 (read own, admin read) |
| `lead_reports` | "Inaccurate lead" reports; drives refunds and auto-flagging | 2 (read own, admin read) |
| `fsg_quotes` | Quote requests from the Request Quote modal | 0 — service-role only |
| `fsg_invoices` | Invoices generated from quotes | 0 — service-role only |
| `market_rates` | Live metals prices cache (per mineral) | 1 (public read) |
| `fx_rates` | USD/MYR cache | 1 (public read) |

**Important column notes**

- `fsg_quotes` has **`number`**, not `quote_number`. `quote_number` lives on
  `fsg_invoices`. Do not write `quote_number` against `fsg_quotes`.
- `listings` uses `mineral_type`, `quantity_available`, `price_indication`,
  `exact_mine_address`, `side`, `incoterms`, `verified`, `flagged`,
  `coa_document_url`, `status` (`'active'` by default).
- `side` is constrained by `listings_side_check` to **`'buy' | 'sell' | 'process'`**.
  `'process'` means a processing plant / smelter / refinery and was added by
  migration 07 — widening this constraint is required before inserting one.
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
| `get_radar_stats()` | anon, authenticated | Aggregates only, no rows. Returns `buyer_count`, `seller_count`, `processor_count` |
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

**Rule A2 — Three categories.** The directory is filterable by
`side = 'buy' | 'sell' | 'process'`, surfaced as the tabs **Cari Pembeli**,
**Cari Pembekal**, **Cari Pengilang Pemprosesan** (smelters, refineries,
processing plants) and **Semua**. `'process'` rows carry a gold
`PEMPROSESAN` badge (`.sidebadge.process`). `get_radar_listings` filters
`p_side` generically, so no per-category SQL is needed.

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
    RadarProspek.jsx         ⭐ Buyer/supplier/processor radar: 3-step
                             strip, 6 metric cards, category tabs, mineral/
                             country filters, debounced search, masked
                             contact rows
    Header.jsx               Nav (Home / Radar Prospek / Market Tool /
                             Contact), mobile hamburger, theme toggle,
                             token badge, quote button
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
  lib/marketRates.js         Live price hook (3-layer fallback) +
                             statusBadge() which returns i18n KEYS, not text
  i18n/dictionary.js         ⭐ Single bilingual dictionary, bm + en, 182 keys
  i18n/LanguageContext.jsx   ⭐ LanguageProvider + useLang() -> {lang, t, setLang}
  fsg.css                    ⭐ Single stylesheet, CSS variables,
                             light (emerald/white) + dark (forest green) themes
```

**Theme:** Emerald green `#0E7A52` on a soft warm-grey page background
`#F4F6F5` (deliberately NOT pure white — reduces glare), Playfair Display
headings + Manrope body. Cards use `border-radius:12px` and
`box-shadow:0 2px 8px rgba(0,0,0,.04)`. Dark mode is forest green `#0A1410`,
never navy. Toggle writes `data-theme` on `<html>` and persists to
`localStorage['fsg-theme']`.

**Background — soft geometric polygons.** The page background is two CSS
layers on `body`, declared through tokens in `:root`:

```
background-image: var(--poly-veil), var(--poly);
background-size:  cover, 720px 720px;
background-repeat: no-repeat, repeat;
background-attachment: fixed, fixed;
```

- `--poly` is an inline SVG data-URI (720×720 tile, ~1.2 KB) of 32
  alternating triangles in two opacities — `#0E7A52` at `.055` and `.028`
  for light mode, `#4CC38A` for dark.
- `--poly-veil` is the `135deg` gradient painted ON TOP of the polygons
  (first layer in `background-image` renders topmost). This veil is what
  keeps the pattern low-glare; removing it makes the triangles harsh.
- Both tokens are redefined in the `html[data-theme="dark"]` block.

⚠️ Do not set `background:` (shorthand) on `body` or on
`html[data-theme="dark"] body` — the shorthand resets `background-image`
and silently erases the polygons. Use `background-color:` for colour.
This is why the dark rule is only `html[data-theme="dark"] body{color:…}`.

**Responsive:** breakpoint is `<768px`. Below it the header collapses to a
hamburger (`.navtoggle` + `.menu.open`), the directory grid drops to one
column, filter selects stack full-width with 44px tap targets, category tabs
swap long labels for `.rp-tab-short`, and the ticker is clamped to `100vw`.
The directory grid is `repeat(auto-fit, minmax(300px, 1fr))` — 1 / 2 / 3
columns emerge from container width, no per-breakpoint overrides.

**Header vs Footer:** the header carries only Home / Radar Prospek / Market
Tool / Contact. Minerals and Corporate live in the Footer to keep the header
balanced — do not add them back to the nav.

**Removed:** `DirectoryTeaser.jsx` was deleted and replaced by
`RadarProspek.jsx`. Do not reintroduce it.

---

## 5a. Bilingual EN/BM (i18n)

The site is fully bilingual. **BM is the default**; the choice persists in
`localStorage['fsg-lang']` and is read before first paint.

### Architecture

```
src/i18n/dictionary.js       DICT = { bm: {...}, en: {...} }
                             LANGUAGES = [{code:'bm',flag:'🇲🇾',label:'BM'}, …]
src/i18n/LanguageContext.jsx LanguageProvider (outermost in App.jsx)
                             useLang() -> { lang, setLang, toggleLang, t, isBM }
legacy/assets/js/i18n.js     Same idea for the non-bundled corporate pages
                             exposes window.FSG_I18N.t / .setLang / .lang
```

`LanguageProvider` sits **outside** `ToastProvider` in `App.jsx` so toasts and
modals can translate too. `t(key, vars)` substitutes `{placeholder}` tokens and
falls back to BM, warning in DEV when a key is missing.

`index.html` carries a pre-paint script that sets `<html lang>` from
`localStorage['fsg-lang']`, mirroring the existing `fsg-theme` script. Without
it the first paint flashes the wrong language.

### Rules

- **Every user-facing string goes through `t()`.** No BM literal in JSX.
- Keys are `section.camelCase` (`nav.home`, `radar.card.unlock`).
- Both languages must have every key. `npm run build` will not catch a gap —
  `t()` falls back to BM, so a missing EN key renders Malay inside an English
  UI. Check parity before committing.
- Data modules hold **keys, not text**: `statusBadge()` in `lib/marketRates.js`
  returns `{textKey, detailKey, vars}` and the component calls `t()`. Do not
  put finished Malay strings back into data helpers.
- Mineral names live in `components/minerals.js` as `bm` / `en` / `desc` /
  `descEn`, read through `mineralName(m, lang)` / `mineralDesc(m, lang)`.
  The `id` field stays canonical — `create-quote` prices on it.
- Dates use `toLocaleString(lang === 'bm' ? 'ms-MY' : 'en-GB')`.

### Language switcher

Header shows `🇲🇾 BM | 🇬🇧 EN` next to the theme toggle. Classes `.lang-toggle`
/ `.lang-btn` (`.on` in the SPA, `.active` in legacy pages). The legacy pages
get the switch injected automatically by `legacy/assets/js/i18n.js` — do not
hand-copy the markup into each page.

### Dark-mode contrast (measured, not guessed)

Three pairs failed WCAG AA and were fixed. Do not undo these:

| Element | Old | New | Ratio |
|---|---|---|---|
| `.btn.on-dark` text on white | `--ink` #E7F0EA on #FFF | #0B5C3F on #FFF | 1.16 → **8.02:1** |
| `.panel` body text | #C9D6CF on gradient to #0E7A52 | #E9F5EE on gradient to #0B5C3F | 3.57 → **7.17:1** |
| `.btn.primary` (dark theme) | #FFF on #0F8B5C | #FFF on #0B6B47 | 4.31 → **6.55:1** |

Rules that follow from this:

- Buttons sitting on the dark green panel use `.btn.on-dark` (white pill,
  dark green text) or `.btn.ghost-on-dark` (transparent, white text). **Never**
  inline `style={{background:'#fff'}}` — it inherits `--ink` and goes white-on-white.
- `.panel` gradient stops at `#0B5C3F`, not `#0E7A52`. The lighter stop is what
  dragged body text under 4.5:1.
- Dark-theme `.lang-btn.on` uses `#4CC38A` background with `#062018` text
  (7.72:1) — not white on green.

Verify with the audit script (see §11). It reads the **built** CSS, so run
`npm run build` first.

---

## 6. Edge functions & live market data

| Slug | verify_jwt | Status |
|---|---|---|
| `create-quote` | `false` | ACTIVE |
| `admin-api` | `false` | ACTIVE |
| `market-rates` | `false` | ACTIVE — live metals + FX |
| `create-chip-payment` | — | in repo, not deployed |
| `chip-webhook` | — | **in repo, deliberately NOT deployed** |

⚠️ **`chip-webhook` has no signature verification.** It contains a TODO and
would let anyone who knows the URL POST a forged `topup:<uuid>:pro` reference
and receive free tokens via service_role `add_tokens`. Do not deploy it until
HMAC verification is implemented.

### 6a. Live market data (`market-rates`)

`GET/POST /functions/v1/market-rates` returns metals prices + USD/MYR.
It exists because **Yahoo Finance sends no CORS headers**, so the browser
cannot call it directly.

**Provider coverage — 4 of 9 minerals, and that is deliberate.**

| Mineral | Symbol | Exchange | Live? |
|---|---|---|---|
| AURUM | `GC=F` | COMEX | ✅ |
| SILVER | `SI=F` | COMEX | ✅ |
| COPPER | `HG=F` | COMEX (USD/lb) | ✅ |
| ALUMINIUM | `ALI=F` | COMEX | ✅ |
| TIN | — | LME (paid) | ❌ reference |
| TITANIUM | — | Fastmarkets (paid) | ❌ reference |
| LITHIUM | — | Fastmarkets (paid) | ❌ reference |
| COLTAN | — | OTC trader quotes | ❌ reference |
| TANTALUM | — | OTC trader quotes | ❌ reference |

Tin, Titanium, Lithium, Coltan and Tantalum have **no free public feed**.
They are returned with `is_live: false` and the UI labels them "Rujukan".
Do not fabricate live numbers for them — that is a false claim on a page
that says "LIVE API ACTIVE".

**Unit conversion** (provider quote → USD/kg):
`oz ÷ 0.0311034768` · `lb × 2.2046226218` · `tonne ÷ 1000`

**Caching:** the function writes to `public.market_rates` and
`public.fx_rates` and returns the cache when it is younger than 15 minutes.
One upstream fetch serves every visitor.

**Client:** `src/lib/marketRates.js` — `useMarketRates({ pollMs })`.
Fallback chain: Edge Function → `get_market_rates()` RPC → static
`FALLBACK_RATES` in the bundle. The page never breaks; the badge and
footer disclaimer state honestly which layer is in use.

**No API keys are required** (Yahoo + open.er-api.com are free and keyless).
If a paid provider is added later, put the key in Supabase secrets — never in
the client bundle. A secret scan of the built bundle is part of the checklist.

**Tables:** `market_rates` (per mineral) and `fx_rates` (per pair). Both are
publicly readable (market prices are not secret) but **write-restricted to
service_role** — there is no INSERT/UPDATE policy, so a client cannot forge a
price. Seed rows use `source='static'`, `is_live=false` so the page renders
before the function is ever called.

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
06_radar_demo_seed.sql         12 demo listings (buy + sell)
07_radar_processing_plants.sql side += 'process', processor_count, 5 demo plants
08_market_rates.sql            market_rates + fx_rates cache tables
09_market_rates_provider.sql   provider metadata, get_market_rates() RPC
```

**Demo data cleanup:**
```sql
delete from public.listings where id::text like 'a1000000-0000-4000-8000-%';  -- buy/sell
delete from public.listings where id::text like 'a2000000-0000-4000-8000-%';  -- process
```

---

## 10. Known open risks

1. `chip-webhook` lacks signature verification — keep undeployed.
2. `create-quote` and `admin-api` run with `verify_jwt: false`.
3. `fsg_quote_nextval` / `fsg_invoice_nextval` are callable by `anon`
   (sequence burn).
4. `mailer_autoconfirm: true` with no SMTP — see §8.
5. 17 demo listings sit in the production database (12 buy/sell + 5 process).
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

### Bilingual + contrast checks

Three scripts in `.tmp-test/` (gitignored — recreate if missing; they need
`jsdom` and `esbuild` from `node_modules`). All three must print `ALL PASS`.

```bash
# 1. Contrast: parses dist/assets/index-*.css, both themes, real WCAG ratios.
#    Reads EXACT selectors from the built sheet and fails loudly (MISS) if a
#    selector or declaration was renamed, instead of measuring the wrong one.
#    Run npm run build first. Exit 1 on any pair below AA.
python3 .tmp-test/contrast.py

# 2. SPA render: mounts App in jsdom in BM/light, EN/light, EN/dark, BM/dark,
#    asserts no BM leakage in EN, no raw i18n keys in the DOM, and that
#    clicking EN actually flips content and persists the choice.
node .tmp-test/render.mjs

# 3. Legacy pages: corporate/minerals/contact as real documents — switch
#    mounts, grid prices live, EN/BM flip works, sendMail still defined.
node .tmp-test/legacy.mjs

# 4. Market Tool: page renders 9 cards with exactly 4 LIVE pills, hero FX is
#    the live rate, calculator fills in, EN/BM flip, no untranslated keys.
#    Needs /tmp/feed.json — capture it first:
curl -s -X POST "https://wjrlcbhmklodrtpuhprq.supabase.co/functions/v1/market-rates" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" > /tmp/feed.json
node .tmp-test/feed.mjs    # unit-level: payload parsing + unit conversion
node .tmp-test/page.mjs    # DOM-level: the real market-tool.html
```

Pitfalls these scripts encode, learned the hard way:

- Match **minified** CSS. Vite strips quotes from `url()`, rewrites
  `[data-theme="dark"]` to `[data-theme=dark]`, lowercases hex, and turns
  `rgba(0,0,0,.04)` into `#0000000f`. There are several `body{}` rules
  (Tailwind preflight emits one) — target the one with `background-image`.
- Do **not** try to emulate CSS specificity on minified output. A token-set
  matcher resolves `.btn` to `.btn.on-dark` and reports phantom 1.00:1
  failures. Name exact selectors and the exact surface each sits on.
- `LanguageProvider` reads `localStorage` on mount only. Remount the React
  root between language passes or the second pass keeps the first language.
- `.tmp-test` bundles must mark `react` / `react-dom` / `react/jsx-runtime`
  as **external**, otherwise the bundled React copy has a null dispatcher
  (`Cannot read properties of null (reading 'useState')`).
- `global.navigator` is getter-only in Node 22 — use `Object.defineProperty`.
- The `useMarketRates` 5-minute poll keeps Node alive; tests must call
  `process.exit()`.
- Assert on `input.value`, not `textContent`, for `<input>` elements.
- Strip `<script>` before scanning rendered text for leaked i18n keys — the
  dictionary itself lives in a script tag.


`.env` must define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. It is
gitignored; never commit it and never put a service_role key in the frontend.
