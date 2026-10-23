-- ============================================================
--  09_market_rates_provider.sql
--  Metadata penyedia untuk setiap mineral, supaya UI boleh
--  membezakan harga yang benar-benar LIVE daripada rujukan
--  manual — dan tidak berpura-pura kesembilan-sembilannya live.
--
--  Realiti pasaran (disahkan semasa pembinaan):
--    Pasaran awam dengan suapan percuma:
--      AURUM (COMEX GC=F), SILVER (COMEX SI=F),
--      COPPER (COMEX HG=F), ALUMINIUM (COMEX ALI=F)
--    Tiada suapan awam percuma (OTC / langganan berbayar):
--      TIN (LME), TITANIUM, LITHIUM, COLTAN, TANTALUM
--  Harga manual kekal sebagai rujukan dan ditanda sedemikian.
-- ============================================================

alter table public.market_rates
  add column if not exists provider text,
  add column if not exists is_public_market boolean not null default false;

-- Penyedia bagi 4 logam yang mempunyai suapan langsung.
update public.market_rates set provider = 'COMEX (Yahoo Finance)', is_public_market = true
 where mineral_id in ('AURUM', 'SILVER', 'COPPER', 'ALUMINIUM');

-- Penyedia bagi 5 logam tanpa suapan awam percuma.
update public.market_rates set provider = 'LME (rujukan manual)', is_public_market = false
 where mineral_id = 'TIN';
update public.market_rates set provider = 'Fastmarkets (rujukan manual)', is_public_market = false
 where mineral_id in ('TITANIUM', 'LITHIUM');
update public.market_rates set provider = 'Rujukan pedagang (manual)', is_public_market = false
 where mineral_id in ('COLTAN', 'TANTALUM');

-- Selaraskan harga manual dengan minerals.js supaya tiada dua nilai
-- berbeza untuk logam yang sama.
update public.market_rates set price_usd = 2675,  quote_unit = 'oz',    price_usd_kg = 2675 / 0.0311034768 where mineral_id = 'AURUM' and is_live = false;
update public.market_rates set price_usd = 31.80, quote_unit = 'oz',    price_usd_kg = 31.80 / 0.0311034768 where mineral_id = 'SILVER' and is_live = false;
update public.market_rates set price_usd = 9520,  quote_unit = 'tonne', price_usd_kg = 9.52  where mineral_id = 'COPPER' and is_live = false;
update public.market_rates set price_usd = 32200, quote_unit = 'tonne', price_usd_kg = 32.20 where mineral_id = 'TIN' and is_live = false;
update public.market_rates set price_usd = 2620,  quote_unit = 'tonne', price_usd_kg = 2.62  where mineral_id = 'ALUMINIUM' and is_live = false;
update public.market_rates set price_usd = 11500, quote_unit = 'tonne', price_usd_kg = 11.50 where mineral_id = 'TITANIUM' and is_live = false;
update public.market_rates set price_usd = 10800, quote_unit = 'tonne', price_usd_kg = 10.80 where mineral_id = 'LITHIUM' and is_live = false;
update public.market_rates set price_usd = 85,    quote_unit = 'kg',    price_usd_kg = 85.0  where mineral_id = 'COLTAN' and is_live = false;
update public.market_rates set price_usd = 185,   quote_unit = 'kg',    price_usd_kg = 185.0 where mineral_id = 'TANTALUM' and is_live = false;

-- ------------------------------------------------------------
--  RPC tunggal untuk klien: satu panggilan, semua yang diperlukan.
-- ------------------------------------------------------------
create or replace function public.get_market_rates()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'live',        coalesce(bool_or(m.is_live), false),
    'live_count',  count(*) filter (where m.is_live),
    'total',       count(*),
    'usd_myr',     (select rate     from public.fx_rates where pair = 'USDMYR'),
    'fx_live',     (select is_live  from public.fx_rates where pair = 'USDMYR'),
    'updated_at',  max(m.updated_at),
    'rates',       coalesce(jsonb_agg(
                     jsonb_build_object(
                       'mineral_id',       m.mineral_id,
                       'symbol',           m.symbol,
                       'price_usd',        m.price_usd,
                       'quote_unit',       m.quote_unit,
                       'price_usd_kg',     m.price_usd_kg,
                       'provider',         m.provider,
                       'is_live',          m.is_live,
                       'is_public_market', m.is_public_market,
                       'updated_at',       m.updated_at
                     ) order by m.mineral_id
                   ), '[]'::jsonb)
  )
  from public.market_rates m;
$$;

revoke execute on function public.get_market_rates() from public;
grant  execute on function public.get_market_rates() to anon, authenticated;
