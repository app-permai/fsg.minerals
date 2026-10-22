-- ============================================================
--  FSG MINERALS PLATFORM — UPGRADE 01: SCHEMA & STORAGE
--  Part of the security + monetization upgrade
--  (masking, lead reports & refunds, COA document tier).
--
--  Idempotent: safe to run again — existing tables/columns
--  are left untouched (see README if your live schema uses
--  different column names).
--  Run order: 01 → 02 → 03
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- BASE TABLES (created only when missing)
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text,
  role           text not null default 'user' check (role in ('user','seller','admin')),
  token_balance  integer not null default 0 check (token_balance >= 0),
  created_at     timestamptz not null default now()
);

create table if not exists public.listings (
  id                  uuid primary key default gen_random_uuid(),
  seller_id           uuid not null references public.profiles(id) on delete cascade,
  title               text not null,
  mineral_type        text not null,          -- e.g. 'Copper Cathode', 'Coltan'
  country             text,                   -- public (safe to display)
  region              text,                   -- broad region only (public)
  quantity_available  text,                   -- public
  price_indication    text,                   -- public
  -- ==== SENSITIVE: must never leave the DB unmasked for locked leads ====
  company_name        text,
  contact_person      text,
  phone               text,
  email               text,
  exact_mine_address  text,
  -- ==== trust / moderation state ====
  status              text not null default 'active'
                      check (status in ('active','inactive','pending_review')),
  flagged             boolean not null default false,
  verified            boolean not null default false,
  -- ==== Tier-2 monetization: private Storage path, NOT a public URL ====
  -- e.g. 'coa/<lead_id>/1719...-certificate.pdf'  (bucket: coa-documents)
  coa_document_url    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.unlocked_leads (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lead_id      uuid not null references public.listings(id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  unique (user_id, lead_id)          -- never charge the same user twice
);

create table if not exists public.unlocked_docs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lead_id      uuid not null references public.listings(id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  unique (user_id, lead_id)          -- never charge twice for the same document
);

create table if not exists public.token_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lead_id      uuid references public.listings(id) on delete set null,
  amount       integer not null,     -- positive = credit, negative = spend
  type         text not null check (type in ('topup','lead_unlock','coa_unlock','refund','bonus')),
  description  text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- NEW TABLE: LEAD REPORTS (failed-lead reporting + refunds)
-- ------------------------------------------------------------

create table if not exists public.lead_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lead_id      uuid not null references public.listings(id) on delete cascade,
  reason       text not null check (reason in
               ('wrong_number','not_owner_or_buyer','inactive_listing','other')),
  details      text,
  status       text not null default 'pending'
               check (status in ('pending','approved','rejected')),
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  refunded     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (user_id, lead_id)          -- one report / one refund per user per lead
);

-- ------------------------------------------------------------
-- NEW COLUMNS on existing tables (no-op if already present)
-- ------------------------------------------------------------

alter table public.listings
  add column if not exists flagged            boolean not null default false,
  add column if not exists verified           boolean not null default false,
  add column if not exists coa_document_url   text,
  add column if not exists status             text not null default 'active',
  add column if not exists updated_at         timestamptz not null default now();

alter table public.profiles
  add column if not exists role               text not null default 'user',
  add column if not exists token_balance      integer not null default 0;

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------

create index if not exists idx_listings_status      on public.listings(status);
create index if not exists idx_listings_seller      on public.listings(seller_id);
create index if not exists idx_unlocked_leads_user  on public.unlocked_leads(user_id);
create index if not exists idx_unlocked_leads_lead  on public.unlocked_leads(lead_id);
create index if not exists idx_unlocked_docs_user   on public.unlocked_docs(user_id);
create index if not exists idx_unlocked_docs_lead   on public.unlocked_docs(lead_id);
create index if not exists idx_reports_status       on public.lead_reports(status);
create index if not exists idx_reports_lead         on public.lead_reports(lead_id);
create index if not exists idx_tx_user              on public.token_transactions(user_id);

-- ------------------------------------------------------------
-- PRIVATE STORAGE BUCKET for Lab Reports / COA PDFs
--   - private (no public URLs, ever)
--   - PDF only, max 10 MB
--   - read access is granted per-user by the Storage RLS
--     policy in migration 03 (only seller + Tier-2 unlockers)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coa-documents', 'coa-documents', false, 10485760, array['application/pdf']
)
on conflict (id) do update
  set public            = false,
      file_size_limit   = 10485760,
      allowed_mime_types = array['application/pdf'];
