-- ============================================================
--  08_market_rates.sql
--  Cache harga pasaran langsung (LME / COMEX / LBMA) + kadar
--  USD-MYR, diisi oleh Edge Function `market-rates`.
--
--  Kenapa cache dalam DB dan bukan terus di klien:
--    - Yahoo Finance TIDAK menghantar header CORS, jadi pelayar
--      tidak boleh memanggilnya terus. Edge Function memproksi.
--    - Satu panggilan setiap 15 minit untuk SEMUA pelawat, bukan
--      satu panggilan setiap pelawat. Ini yang mengelakkan had
--      kadar penyedia.
--
--  Jadual ini dibaca awam (harga pasaran bukan rahsia) tetapi
--  hanya service_role boleh menulis.
-- ============================================================

create table if not exists public.market_rates (
  mineral_id   text primary key,          -- 'AURUM', 'COPPER', …
  symbol       text,                      -- simbol penyedia, cth 'GC=F'
  price_usd    numeric(18, 6),            -- harga dalam unit sebut harga penyedia
  quote_unit   text,                      -- 'oz' | 'lb' | 'tonne' | 'kg'
  price_usd_kg numeric(18, 6),            -- dinormalkan ke USD per kg
  source       text,                      -- 'yahoo' | 'static'
  is_live      boolean not null default false,
  updated_at   timestamptz not null default now()
);

create table if not exists public.fx_rates (
  pair        text primary key,           -- 'USDMYR'
  rate        numeric(18, 8) not null,
  source      text,
  is_live     boolean not null default false,
  updated_at  timestamptz not null default now()
);

alter table public.market_rates enable row level security;
alter table public.fx_rates     enable row level security;

-- Baca awam: harga pasaran memang untuk ditunjuk kepada pelawat.
drop policy if exists "market_rates: public read" on public.market_rates;
create policy "market_rates: public read"
  on public.market_rates for select
  to anon, authenticated
  using (true);

drop policy if exists "fx_rates: public read" on public.fx_rates;
create policy "fx_rates: public read"
  on public.fx_rates for select
  to anon, authenticated
  using (true);

-- Tiada INSERT/UPDATE/DELETE policy -> hanya service_role (Edge
-- Function) boleh menulis. Klien tidak boleh memalsukan harga.

grant select on public.market_rates to anon, authenticated;
grant select on public.fx_rates     to anon, authenticated;

-- Benih nilai rujukan statik supaya paparan tidak pernah kosong
-- walaupun Edge Function belum pernah dijalankan.
insert into public.market_rates (mineral_id, symbol, price_usd, quote_unit, price_usd_kg, source, is_live)
values
  ('AURUM',    null, 2675,   'oz',    86000.0,   'static', false),
  ('SILVER',   null, 31.80,  'oz',    1022.5,    'static', false),
  ('COPPER',   null, 9520,   'tonne', 9.52,      'static', false),
  ('TIN',      null, 32200,  'tonne', 32.20,     'static', false),
  ('ALUMINIUM',null, 2620,   'tonne', 2.62,      'static', false),
  ('TITANIUM', null, 11500,  'tonne', 11.50,     'static', false),
  ('LITHIUM',  null, 10800,  'tonne', 10.80,     'static', false),
  ('COLTAN',   null, 85,     'kg',    85.0,      'static', false),
  ('TANTALUM', null, 185,    'kg',    185.0,     'static', false)
on conflict (mineral_id) do nothing;

insert into public.fx_rates (pair, rate, source, is_live)
values ('USDMYR', 4.70, 'static', false)
on conflict (pair) do nothing;
