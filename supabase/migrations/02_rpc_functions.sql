-- ============================================================
--  FSG MINERALS PLATFORM — UPGRADE 02: RPC FUNCTIONS
--
--  All business logic runs INSIDE Postgres (SECURITY DEFINER),
--  atomic and race-safe. The client can only call these
--  functions — it can never read or write sensitive data or
--  token balances directly.
--
--  Run order: 01 → 02 → 03
-- ============================================================

-- ------------------------------------------------------------
-- HELPERS
-- ------------------------------------------------------------

-- Fixed-length mask. Sensitive fields are replaced by this at
-- the database layer — the raw value never enters the payload.
create or replace function public.mask_secret(val text)
returns text
language sql
immutable
as $$
  select '••••••••'::text;
$$;

-- Admin check (bypasses RLS safely).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Can the current user read a given COA file?
-- True for: users who paid Tier-2 for the lead it belongs to.
create or replace function public.user_has_coa_access(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.unlocked_docs ud
    join public.listings l on l.id = ud.lead_id
    where ud.user_id = auth.uid()
      and l.coa_document_url = p_path
  );
$$;

-- Does this path live under one of the seller's own listings?
-- Path convention: 'coa/<lead_id>/<filename>.pdf'
create or replace function public.seller_owns_coa_path(p_user uuid, p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_path like 'coa/%' and exists (
    select 1 from public.listings l
    where l.seller_id = p_user
      and l.id::text = split_part(p_path, '/', 2)
  );
$$;

-- ------------------------------------------------------------
-- 1. PUBLIC LISTINGS — strict DB-layer masking
--    Sensitive columns are masked unless the caller has an
--    unlocked_leads row for that specific lead (or owns it).
-- ------------------------------------------------------------

create or replace function public.get_public_listings(
  p_limit  integer default 50,
  p_offset integer default 0
)
returns table (
  id                  uuid,
  title               text,
  mineral_type        text,
  country             text,
  region              text,
  quantity_available  text,
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
  created_at          timestamptz
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
    l.title,
    l.mineral_type,
    l.country,
    l.region,
    l.quantity_available,
    l.price_indication,
    -- ==== MASKED AT THE DATABASE LAYER ====
    -- Revealed only when this specific lead is unlocked by this
    -- user (or the user is the seller of this listing).
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
    l.created_at
  from public.listings l
  left join public.unlocked_leads ul
         on ul.lead_id = l.id and ul.user_id = auth.uid()
  left join public.unlocked_docs ud
         on ud.lead_id = l.id and ud.user_id = auth.uid()
  where l.status = 'active'
  order by (l.verified = true) desc, l.created_at desc
  limit least(coalesce(p_limit, 50), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

-- ------------------------------------------------------------
-- 2a. TIER-1 UNLOCK — contact details, costs 1 token
--     Atomic: row locks prevent double-spend races.
-- ------------------------------------------------------------

create or replace function public.unlock_lead(p_lead_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_balance  integer;
  v_listing  public.listings%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0401';
  end if;

  select * into v_listing from public.listings
  where id = p_lead_id for update;
  if not found then
    raise exception 'LEAD_NOT_FOUND' using errcode = 'P0404';
  end if;

  -- Sellers see their own listings for free.
  if v_listing.seller_id = v_user then
    insert into public.unlocked_leads (user_id, lead_id)
    values (v_user, p_lead_id)
    on conflict (user_id, lead_id) do nothing;
    return json_build_object(
      'status', 'own_listing',
      'token_balance', (select token_balance from public.profiles where id = v_user),
      'lead', json_build_object(
        'company_name', v_listing.company_name,
        'contact_person', v_listing.contact_person,
        'phone', v_listing.phone,
        'email', v_listing.email,
        'exact_mine_address', v_listing.exact_mine_address
      )
    );
  end if;

  -- Idempotent: never charge twice for the same lead.
  if exists (select 1 from public.unlocked_leads
             where user_id = v_user and lead_id = p_lead_id) then
    return json_build_object(
      'status', 'already_unlocked',
      'token_balance', (select token_balance from public.profiles where id = v_user),
      'lead', json_build_object(
        'company_name', v_listing.company_name,
        'contact_person', v_listing.contact_person,
        'phone', v_listing.phone,
        'email', v_listing.email,
        'exact_mine_address', v_listing.exact_mine_address
      )
    );
  end if;

  -- Protect users from flagged / inactive listings.
  if v_listing.flagged or v_listing.status <> 'active' then
    raise exception 'LEAD_UNAVAILABLE' using errcode = 'P0403';
  end if;

  -- Atomic balance check: FOR UPDATE lock stops two concurrent
  -- unlocks from both reading the same balance (double-spend).
  select token_balance into v_balance from public.profiles
  where id = v_user for update;
  if v_balance is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0404';
  end if;
  if v_balance < 1 then
    raise exception 'INSUFFICIENT_TOKEN_BALANCE' using errcode = 'P0402';
  end if;

  perform set_config('fsg.token_ops_ok', 'on', true);   -- allow balance change
  update public.profiles set token_balance = token_balance - 1 where id = v_user;

  insert into public.unlocked_leads (user_id, lead_id) values (v_user, p_lead_id);
  insert into public.token_transactions (user_id, lead_id, amount, type, description)
  values (v_user, p_lead_id, -1, 'lead_unlock', 'Unlock contact details');

  return json_build_object(
    'status', 'unlocked',
    'token_balance', v_balance - 1,
    'lead', json_build_object(
      'company_name', v_listing.company_name,
      'contact_person', v_listing.contact_person,
      'phone', v_listing.phone,
      'email', v_listing.email,
      'exact_mine_address', v_listing.exact_mine_address
    )
  );
end;
$$;

-- ------------------------------------------------------------
-- 2b. TIER-2 UNLOCK — verified lab report (COA) PDF,
--     1 additional token. Requires Tier 1 first.
--     Returns the private Storage path + validity window; the
--     5-minute signed URL is then created by the client and is
--     only authorised through the Storage RLS policy in
--     migration 03 (needs an unlocked_docs row to succeed).
-- ------------------------------------------------------------

create or replace function public.unlock_coa_document(p_lead_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_balance  integer;
  v_listing  public.listings%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0401';
  end if;

  select * into v_listing from public.listings where id = p_lead_id;
  if not found then
    raise exception 'LEAD_NOT_FOUND' using errcode = 'P0404';
  end if;

  if v_listing.coa_document_url is null then
    raise exception 'COA_NOT_AVAILABLE' using errcode = 'P0405';
  end if;

  -- Idempotent re-view: no second charge, fresh URL window.
  if exists (select 1 from public.unlocked_docs
             where user_id = v_user and lead_id = p_lead_id) then
    return json_build_object(
      'status', 'already_unlocked',
      'coa_path', v_listing.coa_document_url,
      'expires_in_seconds', 300,
      'token_balance', (select token_balance from public.profiles where id = v_user)
    );
  end if;

  -- Tier 1 (contact details) must be unlocked first.
  if v_listing.seller_id <> v_user and not exists (
    select 1 from public.unlocked_leads
    where user_id = v_user and lead_id = p_lead_id
  ) then
    raise exception 'CONTACT_NOT_UNLOCKED' using errcode = 'P0406';
  end if;

  if v_listing.flagged or v_listing.status <> 'active' then
    raise exception 'LEAD_UNAVAILABLE' using errcode = 'P0403';
  end if;

  -- Sellers access their own documents free.
  if v_listing.seller_id = v_user then
    insert into public.unlocked_docs (user_id, lead_id)
    values (v_user, p_lead_id)
    on conflict (user_id, lead_id) do nothing;
    return json_build_object(
      'status', 'own_listing',
      'coa_path', v_listing.coa_document_url,
      'expires_in_seconds', 300
    );
  end if;

  select token_balance into v_balance from public.profiles
  where id = v_user for update;
  if v_balance is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0404';
  end if;
  if v_balance < 1 then
    raise exception 'INSUFFICIENT_TOKEN_BALANCE' using errcode = 'P0402';
  end if;

  perform set_config('fsg.token_ops_ok', 'on', true);   -- allow balance change
  update public.profiles set token_balance = token_balance - 1 where id = v_user;

  insert into public.unlocked_docs (user_id, lead_id) values (v_user, p_lead_id);
  insert into public.token_transactions (user_id, lead_id, amount, type, description)
  values (v_user, p_lead_id, -1, 'coa_unlock', 'Unlock lab report (COA) PDF');

  return json_build_object(
    'status', 'unlocked',
    'token_balance', v_balance - 1,
    'coa_path', v_listing.coa_document_url,
    'expires_in_seconds', 300
  );
end;
$$;

-- ------------------------------------------------------------
-- 3. FAILED LEAD REPORTING (user side)
--    Only users who actually PAID to unlock the lead can report
--    it — blocks report spam. Auto-flags a listing once 3+
--    distinct users have reported it (protection before admin
--    review completes).
-- ------------------------------------------------------------

create or replace function public.submit_lead_report(
  p_lead_id uuid,
  p_reason  text,
  p_details text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0401';
  end if;

  if p_reason not in ('wrong_number','not_owner_or_buyer','inactive_listing','other') then
    raise exception 'INVALID_REASON' using errcode = 'P0406';
  end if;

  if not exists (select 1 from public.listings where id = p_lead_id) then
    raise exception 'LEAD_NOT_FOUND' using errcode = 'P0404';
  end if;

  if not exists (select 1 from public.unlocked_leads
                 where user_id = v_user and lead_id = p_lead_id) then
    raise exception 'LEAD_NOT_UNLOCKED' using errcode = 'P0406';
  end if;

  begin
    insert into public.lead_reports (user_id, lead_id, reason, details)
    values (v_user, p_lead_id, p_reason, p_details);
  exception when unique_violation then
    raise exception 'ALREADY_REPORTED' using errcode = 'P0409';
  end;

  -- Early protection: 3+ distinct reporters (not rejected) => flag.
  update public.listings
  set flagged = true, updated_at = now()
  where id = p_lead_id
    and (
      select count(distinct user_id) from public.lead_reports
      where lead_id = p_lead_id and status <> 'rejected'
    ) >= 3;

  return json_build_object(
    'status', 'submitted',
    'message', 'Report Submitted. Token will be refunded upon verification.'
  );
end;
$$;

-- ------------------------------------------------------------
-- 4. ADMIN: REVIEW REPORT & PROCESS TOKEN REFUND
--    Approve  -> +1 token to the reporter, report approved,
--                listing flagged (and deactivated when the
--                reason was "Inactive Listing").
--    Reject   -> report rejected, no refund, no flag.
-- ------------------------------------------------------------

create or replace function public.process_token_refund(
  p_report_id uuid,
  p_approve   boolean default true
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.lead_reports%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0403';
  end if;

  select * into v_report from public.lead_reports
  where id = p_report_id for update;
  if not found then
    raise exception 'REPORT_NOT_FOUND' using errcode = 'P0404';
  end if;

  if v_report.status <> 'pending' then
    return json_build_object(
      'status', v_report.status,
      'message', 'Report already processed.'
    );
  end if;

  if p_approve then
    update public.lead_reports
    set status = 'approved', reviewed_by = auth.uid(),
        reviewed_at = now(), refunded = true
    where id = p_report_id;

    perform set_config('fsg.token_ops_ok', 'on', true);  -- allow balance change
    update public.profiles
    set token_balance = token_balance + 1
    where id = v_report.user_id;

    insert into public.token_transactions (user_id, lead_id, amount, type, description)
    values (v_report.user_id, v_report.lead_id, 1, 'refund',
            'Refund: inaccurate lead report approved');

    -- Protect other users.
    update public.listings
    set flagged = true,
        status = case when v_report.reason = 'inactive_listing'
                      then 'inactive' else status end,
        updated_at = now()
    where id = v_report.lead_id;

    return json_build_object(
      'status', 'approved',
      'refunded_tokens', 1,
      'message', 'Report approved. 1 token refunded and listing flagged.'
    );
  else
    update public.lead_reports
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_report_id;
    return json_build_object(
      'status', 'rejected',
      'message', 'Report rejected. No refund issued.'
    );
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 5. TOKEN TOP-UP (called by your CHIP Gateway webhook with
--    the service_role key ONLY — after payment is confirmed)
-- ------------------------------------------------------------

create or replace function public.add_tokens(
  p_user_id   uuid,
  p_amount    integer,
  p_reference text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0406';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0404';
  end if;

  perform set_config('fsg.token_ops_ok', 'on', true);   -- allow balance change
  update public.profiles
  set token_balance = token_balance + p_amount
  where id = p_user_id;

  insert into public.token_transactions (user_id, amount, type, description)
  values (p_user_id, p_amount, 'topup', coalesce(p_reference, 'CHIP top-up'));

  return json_build_object(
    'status', 'ok',
    'new_balance', (select token_balance from public.profiles where id = p_user_id)
  );
end;
$$;

-- ------------------------------------------------------------
-- 6. ANTI-TAMPER GUARD on profiles.token_balance / role
--    Even with RLS, a user could PATCH their own profile row.
--    Column privileges (migration 03) block this, and this
--    trigger is the second lock: token_balance / role can only
--    change inside the trusted RPCs above (which set the
--    transaction-local flag 'fsg.token_ops_ok').
-- ------------------------------------------------------------

create or replace function public.guard_sensitive_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.token_balance is distinct from old.token_balance
     and coalesce(current_setting('fsg.token_ops_ok', true), 'off') <> 'on' then
    raise exception 'TOKEN_BALANCE_PROTECTED: use unlock/refund/top-up RPCs'
      using errcode = 'P0403';
  end if;
  if new.role is distinct from old.role
     and coalesce(current_setting('fsg.token_ops_ok', true), 'off') <> 'on' then
    raise exception 'ROLE_PROTECTED: change roles from the dashboard only'
      using errcode = 'P0403';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_sensitive_profile_fields on public.profiles;
create trigger guard_sensitive_profile_fields
  before update on public.profiles
  for each row execute function public.guard_sensitive_profile_fields();

-- ------------------------------------------------------------
-- EXECUTE PRIVILEGES (least privilege)
-- ------------------------------------------------------------

-- Public browse: anon + logged-in users.
revoke execute on function public.get_public_listings(integer, integer) from public;
grant  execute on function public.get_public_listings(integer, integer) to anon, authenticated;

-- Purchases & reporting: logged-in users only.
revoke execute on function public.unlock_lead(uuid)              from public, anon;
grant  execute on function public.unlock_lead(uuid)              to authenticated;
revoke execute on function public.unlock_coa_document(uuid)      from public, anon;
grant  execute on function public.unlock_coa_document(uuid)      to authenticated;
revoke execute on function public.submit_lead_report(uuid, text, text) from public, anon;
grant  execute on function public.submit_lead_report(uuid, text, text) to authenticated;

-- Admin review: logged-in users (is_admin() enforced inside).
revoke execute on function public.process_token_refund(uuid, boolean) from public, anon;
grant  execute on function public.process_token_refund(uuid, boolean) to authenticated;

-- Top-up: service_role (CHIP webhook) only.
revoke execute on function public.add_tokens(uuid, integer, text) from public, anon, authenticated;
grant  execute on function public.add_tokens(uuid, integer, text) to service_role;

-- Internal helpers used by policies.
revoke execute on function public.is_admin()                     from public, anon;
grant  execute on function public.is_admin()                     to authenticated;
revoke execute on function public.user_has_coa_access(text)      from public, anon;
grant  execute on function public.user_has_coa_access(text)      to authenticated;
