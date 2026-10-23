-- ============================================================
--  07_radar_processing_plants.sql
--  Menambah kategori ketiga pada Radar Prospek:
--  "PENGILANG PEMPROSESAN" (processing plants / smelters /
--  refineries), di samping pembeli dan pembekal.
--
--  Perubahan:
--    1. listings_side_check dilonggarkan untuk menerima 'process'
--    2. get_radar_stats() dikembalikan dengan processor_count
--    3. 5 kemudahan pemprosesan demo disemai
--
--  get_radar_listings() TIDAK berubah — ia sudah menapis mengikut
--  p_side secara generik, jadi 'process' terus berfungsi.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Benarkan side = 'process'
--    Constraint asal: CHECK (side IN ('buy','sell'))
-- ------------------------------------------------------------
alter table public.listings
  drop constraint if exists listings_side_check;

alter table public.listings
  add constraint listings_side_check
  check (side = any (array['buy'::text, 'sell'::text, 'process'::text]));

-- ------------------------------------------------------------
-- 2. get_radar_stats() — tambah processor_count.
--    Jenis pulangan berubah, jadi fungsi mesti digugurkan dahulu
--    (Postgres tidak membenarkan CREATE OR REPLACE menukar
--    jenis OUT).
-- ------------------------------------------------------------
drop function if exists public.get_radar_stats();

create function public.get_radar_stats()
returns table (
  total_leads     integer,
  buyer_count     integer,
  seller_count    integer,
  processor_count integer,
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
    count(*) filter (where l.side = 'process')::integer,
    count(distinct nullif(l.country, ''))::integer,
    count(distinct nullif(l.mineral_type, ''))::integer,
    count(*) filter (where l.verified)::integer,
    max(l.updated_at)
  from public.listings l
  where l.status = 'active'
    and l.flagged = false;
$$;

revoke execute on function public.get_radar_stats() from public;
grant  execute on function public.get_radar_stats() to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Data demo kemudahan pemprosesan
--    E-mel guna TLD .example (RFC 2606) — tiada domain sebenar.
--    Padam:  delete from public.listings
--            where id::text like 'a2000000-0000-4000-8000-%';
-- ------------------------------------------------------------
do $$
declare
  v_owner uuid;
begin
  select id into v_owner
  from public.profiles
  order by created_at
  limit 1;

  if v_owner is null then
    raise exception 'Tiada profil dijumpai — jalankan migrasi 01-04 dahulu.';
  end if;

  insert into public.listings
    (id, seller_id, title, mineral_type, country, region, quantity_available,
     price_indication, company_name, contact_person, phone, email,
     exact_mine_address, status, verified, side, incoterms)
  values
    ('a2000000-0000-4000-8000-000000000001', v_owner,
     'Copper Smelter — 180,000 TPA Capacity', 'Copper', 'China', 'Asia',
     '180,000 MT / year', 'Toll refining: USD 85 / MT',
     'Jiangxi Smelting & Refining Co.', 'Chen Jian', '+86 791 8800 3300',
     'smelter@jiangxi-refining.example', 'Industrial Park Zone B, Guixi, Jiangxi',
     'active', true, 'process', 'FOB'),

    ('a2000000-0000-4000-8000-000000000002', v_owner,
     'Gold Refinery — LBMA Good Delivery', 'Aurum', 'United Arab Emirates', 'Middle East',
     '120 kg / month', 'Refining: USD 0.45 / oz',
     'Emirates Precious Refining LLC', 'Omar Al Suwaidi', '+971 4 880 2200',
     'refinery@emirates-precious.example', 'DMCC Almas Tower, Level 28, Dubai',
     'active', true, 'process', 'CIF'),

    ('a2000000-0000-4000-8000-000000000003', v_owner,
     'Tantalum & Niobium Processing Plant', 'Tantalum', 'Germany', 'Europe',
     '40 MT / month', 'Processing: USD 22 / kg',
     'Rheinland Sondermetalle GmbH', 'Anja Köhler', '+49 211 8800 660',
     'verarbeitung@rheinland-sonder.example', 'Werk Nord, Duisburg',
     'active', true, 'process', 'FOB'),

    ('a2000000-0000-4000-8000-000000000004', v_owner,
     'Lithium Carbonate Conversion Plant', 'Lithium', 'India', 'Asia',
     '600 MT / month', 'Conversion: USD 1,150 / MT',
     'Gujarat Lithium Converters Pvt Ltd', 'Anil Desai', '+91 79 4000 3300',
     'plant@gujarat-lithium.example', 'Sanand Industrial Estate, Block D, Ahmedabad',
     'active', false, 'process', 'CIF'),

    ('a2000000-0000-4000-8000-000000000005', v_owner,
     'Tin Smelter — 12,000 TPA', 'Tin', 'Indonesia', 'Asia',
     '12,000 MT / year', 'Toll smelting: USD 240 / MT',
     'Bangka Tin Smelting PT', 'Hendra Wijaya', '+62 21 8800 4400',
     'smelter@bangka-tin.example', 'Kawasan Industri Pulau Bangka, Pangkal Pinang',
     'active', true, 'process', 'FOB');
end $$;
