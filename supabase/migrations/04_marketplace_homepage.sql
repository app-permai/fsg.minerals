-- ============================================================
--  FSG MINERALS PLATFORM — UPGRADE 04: B2B MARKETPLACE HOMEPAGE
--
--  Supports the homepage transformation from a single-company
--  site into a B2B mineral commodity marketplace:
--   - listings.side       : 'sell' (mine owner) / 'buy' (end buyer)
--   - listings.incoterms  : public trade term, e.g. 'FOB', 'CIF'
--   - get_public_listings v2: returns the homepage directory
--     fields (side, volume, location, incoterms, updated date)
--   - handle_new_user()   : auto-creates the profile with the
--     10 free welcome tokens promised by the homepage CTA
--     "Register Free & Get 10 Tokens".
--
--  Idempotent. Run order: 01 → 02 → 03 → 04
-- ============================================================

-- ------------------------------------------------------------
-- 1. PUBLIC DIRECTORY COLUMNS on listings
--    (no-op if they already exist; if your live table uses
--    different column names, adjust here + in the SELECT below)
-- ------------------------------------------------------------

alter table public.listings
  add column if not exists side text not null default 'sell'
      check (side in ('buy','sell')),   -- 'sell' = mine owner / seller listing
                                        -- 'buy'  = end-buyer demand listing
  add column if not exists incoterms text;  -- e.g. 'FOB', 'CIF', 'EXW' (public)

create index if not exists idx_listings_side on public.listings(side);

-- ------------------------------------------------------------
-- 2. get_public_listings v2 — homepage directory fields
--
--    The return type GAINS columns (side, incoterms, updated_at),
--    and Postgres cannot change the return type of an existing
--    function with CREATE OR REPLACE — so the function is dropped
--    and recreated. Grants are re-asserted below (DROP loses them).
--
--    Masking rules are unchanged: company_name, contact_person,
--    phone, email and exact_mine_address are still masked inside
--    this function unless the caller has an unlocked_leads row
--    for that specific lead (or owns the listing).
-- ------------------------------------------------------------

drop function if exists public.get_public_listings(integer, integer);

create function public.get_public_listings(
  p_limit  integer default 50,
  p_offset integer default 0
)
returns table (
  id                  uuid,
  side                text,
  title               text,
  mineral_type        text,
  country             text,
  region              text,
  quantity_available  text,
  incoterms           text,
  price_indication    text,
  company_name        text,
  contact_person      text,
  phone               text,
  email               text,
  exact_mine_address  text,
  verified            boolean,
  flagged             boolean,
  coa_available       boolean,
  has_unlocked_contact boolean,
  has_unlocked_coa    boolean,
  created_at          timestamptz,
  updated_at          timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    l.id,
    l.side,
    l.title,
    l.mineral_type,
    l.country,
    l.region,
    l.quantity_available,
    l.incoterms,
    l.price_indication,
    -- ==== MASKED AT THE DATABASE LAYER (unchanged from v1) ====
    -- Revealed only for leads this specific user has unlocked.
    case when ul.id is not null then l.company_name
         else public.mask_secret(l.company_name) end,
    case when ul.id is not null then l.contact_person
         else public.mask_secret(l.contact_person) end,
    case when ul.id is not null then l.phone
         else public.mask_secret(l.phone) end,
    case when ul.id is not null then l.email
         else public.mask_secret(l.email) end,
    case when ul.id is not null then l.exact_mine_address
         else public.mask_secret(l.exact_mine_address) end,
    l.verified,
    l.flagged,
    (l.coa_document_url is not null),
    (ul.id is not null),
    (ud.id is not null),
    l.created_at,
    l.updated_at
  from public.listings l
  left join public.unlocked_leads ul
         on ul.lead_id = l.id and ul.user_id = auth.uid()
  left join public.unlocked_docs ud
         on ud.lead_id = l.id and ud.user_id = auth.uid()
  where l.status = 'active'
  order by (l.verified = true) desc, l.updated_at desc, l.created_at desc
  limit least(coalesce(p_limit, 50), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

-- Grants were dropped together with the old function — restore them.
revoke execute on function public.get_public_listings(integer, integer) from public;
grant  execute on function public.get_public_listings(integer, integer) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. WELCOME BONUS — powers the "Register Free & Get 10 Tokens" CTA
--
--    Runs automatically whenever a new auth user is created.
--    SECURITY DEFINER: the client has NO insert policy on
--    profiles (by design), so this trigger is the only path that
--    creates profile rows — a user cannot sign themselves up with
--    a custom starting balance.
--
--    The anti-tamper guard on profiles is a BEFORE UPDATE trigger
--    (migration 02), so this initial INSERT with token_balance=10
--    passes without needing the fsg.token_ops_ok flag.
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created uuid;
begin
  insert into public.profiles (id, full_name, token_balance)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)     -- fallback: email prefix
    ),
    10                                  -- welcome bonus promised on the homepage
  )
  on conflict (id) do nothing
  returning id into v_created;          -- null when the row already existed

  -- Record the bonus exactly once (idempotent if the trigger is ever replayed).
  if v_created is not null then
    insert into public.token_transactions (user_id, amount, type, description)
    values (new.id, 10, 'bonus', 'Welcome bonus: 10 free tokens');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
