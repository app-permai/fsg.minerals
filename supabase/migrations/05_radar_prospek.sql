-- ============================================================
--  05_radar_prospek.sql
--  RADAR PROSPEK — modul carian pembeli / pembekal untuk
--  direktori B2B, dengan metrik agregat awam dan penapis sisi.
--
--  Dua fungsi baharu:
--    get_radar_stats()      metrik awam (tetamu boleh lihat)
--    get_radar_listings()   direktori boleh ditapis + disaring
--
--  Prinsip keselamatan SAMA seperti get_public_listings:
--  medan sensitif disaring DI LAPISAN DATABASE (mask_secret),
--  jadi klien yang diubah tidak dapat membaca nilai sebenar
--  sebelum membayar 1 token melalui unlock_lead().
-- ============================================================

-- ------------------------------------------------------------
-- 1. Metrik awam — angka sahaja, tiada baris didedahkan.
--    Diberi kepada anon supaya tetamu boleh melihat "radar"
--    penuh sebelum mendaftar (flow demo percuma).
-- ------------------------------------------------------------
create or replace function public.get_radar_stats()
returns table (
  total_leads     integer,
  buyer_count     integer,
  seller_count    integer,
  country_count   integer,
  commodity_count integer,
  verified_count  integer,
  updated_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::integer,
    count(*) filter (where l.side = 'buy')::integer,
    count(*) filter (where l.side = 'sell')::integer,
    count(distinct nullif(l.country, ''))::integer,
    count(distinct nullif(l.mineral_type, ''))::integer,
    count(*) filter (where l.verified)::integer,
    max(l.updated_at)
  from public.listings l
  where l.status = 'active'
    and l.flagged = false;
$$;

-- ------------------------------------------------------------
-- 2. Direktori boleh ditapis.
--    p_side      'buy' | 'sell' | null (semua)
--    p_mineral   padanan tepat mineral_type (null = semua)
--    p_country   padanan tepat country (null = semua)
--    p_search    carian bebas pada title / mineral_type / region
--
--    Medan sensitif: company_name, contact_person, phone,
--    email, exact_mine_address -> '••••••••' sehingga dibuka.
-- ------------------------------------------------------------
create or replace function public.get_radar_listings(
  p_side    text default null,
  p_mineral text default null,
  p_country text default null,
  p_search  text default null,
  p_limit   integer default 50,
  p_offset  integer default 0
)
returns table (
  id                    uuid,
  side                  text,
  title                 text,
  mineral_type          text,
  country               text,
  region                text,
  quantity_available    text,
  incoterms             text,
  price_indication      text,
  company_name          text,
  contact_person        text,
  phone                 text,
  email                 text,
  exact_mine_address    text,
  verified              boolean,
  flagged               boolean,
  coa_available         boolean,
  has_unlocked_contact  boolean,
  created_at            timestamptz,
  updated_at            timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
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
    case when ul.id is not null then l.company_name      else public.mask_secret(l.company_name)      end,
    case when ul.id is not null then l.contact_person    else public.mask_secret(l.contact_person)    end,
    case when ul.id is not null then l.phone             else public.mask_secret(l.phone)             end,
    case when ul.id is not null then l.email             else public.mask_secret(l.email)             end,
    case when ul.id is not null then l.exact_mine_address else public.mask_secret(l.exact_mine_address) end,
    l.verified,
    l.flagged,
    (l.coa_document_url is not null),
    (ul.id is not null),
    l.created_at,
    l.updated_at
  from public.listings l
  left join public.unlocked_leads ul
         on ul.lead_id = l.id and ul.user_id = auth.uid()
  where l.status = 'active'
    and (p_side    is null or l.side         = p_side)
    and (p_mineral is null or l.mineral_type = p_mineral)
    and (p_country is null or l.country      = p_country)
    and (
      p_search is null
      or p_search = ''
      or l.title        ilike '%' || p_search || '%'
      or l.mineral_type ilike '%' || p_search || '%'
      or l.region       ilike '%' || p_search || '%'
      or l.country      ilike '%' || p_search || '%'
    )
  order by (l.verified = true) desc, l.updated_at desc, l.created_at desc
  limit least(coalesce(p_limit, 50), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- ------------------------------------------------------------
-- 3. Kebenaran.
--    Kedua-dua fungsi SELAMAT untuk anon: stats ialah agregat,
--    dan listings menyaring medan sensitif di dalam SQL.
-- ------------------------------------------------------------
revoke execute on function public.get_radar_stats()                       from public;
grant  execute on function public.get_radar_stats()                       to anon, authenticated;

revoke execute on function public.get_radar_listings(text, text, text, text, integer, integer) from public;
grant  execute on function public.get_radar_listings(text, text, text, text, integer, integer) to anon, authenticated;
