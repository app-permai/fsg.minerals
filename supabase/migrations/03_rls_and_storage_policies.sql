-- ============================================================
--  FSG MINERALS PLATFORM — UPGRADE 03: RLS & STORAGE POLICIES
--
--  Rule: the client NEVER touches sensitive data directly.
--   - Public browsing goes only through get_public_listings()
--     (masked at the DB layer).
--   - Unlocks/refunds/top-ups go only through the RPCs.
--   - profiles.token_balance / role are write-protected.
--   - COA PDFs live in a private bucket readable only by the
--     seller and users who paid Tier-2 for that lead.
--
--  Run order: 01 → 02 → 03
-- ============================================================

-- ------------------------------------------------------------
-- ENABLE RLS EVERYWHERE
-- ------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.listings           enable row level security;
alter table public.unlocked_leads     enable row level security;
alter table public.unlocked_docs      enable row level security;
alter table public.token_transactions enable row level security;
alter table public.lead_reports       enable row level security;

-- ------------------------------------------------------------
-- PROFILES
--   Users read/update their OWN row (name etc.).
--   token_balance / role are blocked twice:
--     (a) column privileges revoked below,
--     (b) guard trigger in migration 02.
-- ------------------------------------------------------------
drop policy if exists "profiles: read own"      on public.profiles;
drop policy if exists "profiles: admin read all" on public.profiles;
drop policy if exists "profiles: update own"    on public.profiles;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles: admin read all"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke update (token_balance, role) on public.profiles from authenticated;

-- ------------------------------------------------------------
-- LISTINGS
--   - NO select policy for anon: anonymous API callers get
--     NOTHING from the table itself. Public data exists only
--     through get_public_listings() (masked).
--   - Sellers manage their own listings only.
--   - Admins have full access (for moderation).
-- ------------------------------------------------------------
drop policy if exists "listings: seller manage own" on public.listings;
drop policy if exists "listings: admin full"        on public.listings;

create policy "listings: seller manage own"
  on public.listings for all to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "listings: admin full"
  on public.listings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Belt & braces: even if a stray select policy is added later,
-- the anon role has no direct SELECT privilege on the table.
revoke select on public.listings from anon;

-- ------------------------------------------------------------
-- UNLOCK RECORDS (unlocked_leads / unlocked_docs)
--   Readable by the owner only. NO insert/update policies:
--   rows are created exclusively by the unlock RPCs — a user
--   cannot self-insert an unlock or forge a Tier-2 record.
-- ------------------------------------------------------------
drop policy if exists "unlocked_leads: read own"   on public.unlocked_leads;
drop policy if exists "unlocked_leads: admin read" on public.unlocked_leads;
create policy "unlocked_leads: read own"
  on public.unlocked_leads for select to authenticated
  using (user_id = auth.uid());
create policy "unlocked_leads: admin read"
  on public.unlocked_leads for select to authenticated
  using (public.is_admin());

drop policy if exists "unlocked_docs: read own"    on public.unlocked_docs;
drop policy if exists "unlocked_docs: admin read"  on public.unlocked_docs;
create policy "unlocked_docs: read own"
  on public.unlocked_docs for select to authenticated
  using (user_id = auth.uid());
create policy "unlocked_docs: admin read"
  on public.unlocked_docs for select to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- TOKEN TRANSACTIONS (audit trail)
-- ------------------------------------------------------------
drop policy if exists "tx: read own"   on public.token_transactions;
drop policy if exists "tx: admin read" on public.token_transactions;
create policy "tx: read own"
  on public.token_transactions for select to authenticated
  using (user_id = auth.uid());
create policy "tx: admin read"
  on public.token_transactions for select to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- LEAD REPORTS
--   Users read their own reports; admins read everything.
--   NO insert policy: reports are created only through
--   submit_lead_report() (which requires a paid unlock).
-- ------------------------------------------------------------
drop policy if exists "reports: read own"   on public.lead_reports;
drop policy if exists "reports: admin read" on public.lead_reports;
create policy "reports: read own"
  on public.lead_reports for select to authenticated
  using (user_id = auth.uid());
create policy "reports: admin read"
  on public.lead_reports for select to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- STORAGE: private bucket 'coa-documents'
--
--   Sellers: full control of files under their own listings
--            (path convention 'coa/<lead_id>/<file>.pdf').
--   Readers: seller, admins, and users holding an unlocked_docs
--            row for the listing the file belongs to. This is
--            what authorises the 5-minute signed URL.
-- ------------------------------------------------------------
drop policy if exists "coa: seller manage own files" on storage.objects;
drop policy if exists "coa: read by seller or unlocker" on storage.objects;

create policy "coa: seller manage own files"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'coa-documents'
    and public.seller_owns_coa_path(auth.uid(), storage.objects.name)
  )
  with check (
    bucket_id = 'coa-documents'
    and public.seller_owns_coa_path(auth.uid(), storage.objects.name)
  );

create policy "coa: read by seller or unlocker"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'coa-documents'
    and (
      public.seller_owns_coa_path(auth.uid(), storage.objects.name)
      or public.user_has_coa_access(storage.objects.name)
      or public.is_admin()
    )
  );
