-- ============================================================
--  06_radar_demo_seed.sql
--  Data DEMO untuk Radar Prospek — supaya metrik (bilangan
--  pembeli, negara, komoditi) bermakna semasa pitch.
--
--  Semua e-mel menggunakan TLD .example (RFC 2606) supaya tiada
--  domain sebenar tersentuh. Nombor telefon adalah rekaan.
--
--  GUNA:  psql -f 06_radar_demo_seed.sql
--  BUANG: lihat bahagian akhir fail (padam mengikut ID tetap).
-- ============================================================

-- Pemilik: akaun pentadbir FSG (info@fsgminerals.trade)
-- Semua baris demo menggunakan seller_id yang sama supaya
-- pembersihan mudah dan tiada akaun tambahan dicipta.
do $$
declare
  v_owner uuid;
begin
  select id into v_owner
  from public.profiles
  where full_name is not null
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
    -- ---------------- PEMBELI (BUY) ----------------
    ('a1000000-0000-4000-8000-000000000001', v_owner,
     'Copper Cathode Grade A — 2,000 MT', 'Copper', 'China', 'Asia',
     '2,000 MT / month', 'USD 9,480 / MT',
     'Jiangxi Copper Import Co. Ltd', 'Li Wei', '+86 791 8800 1200',
     'procurement@jiangxi-import.example', 'Nanchang bonded warehouse, Jiangxi',
     'active', true, 'buy', 'CIF'),

    ('a1000000-0000-4000-8000-000000000002', v_owner,
     'Gold Dore 22K — 50 kg / month', 'Aurum', 'United Arab Emirates', 'Middle East',
     '50 kg / month', 'USD 2,640 / oz',
     'Dubai Precious Metals DMCC', 'Rashid Al Mansoori', '+971 4 355 8800',
     'trade@dubai-pm.example', 'DMCC Free Zone, Tower 2, Dubai',
     'active', true, 'buy', 'CIF'),

    ('a1000000-0000-4000-8000-000000000003', v_owner,
     'Tantalum Concentrate Ta2O5 30%', 'Tantalum', 'Germany', 'Europe',
     '20 MT / quarter', 'USD 185 / lb',
     'Rheinland Rohstoffe GmbH', 'Klaus Brenner', '+49 211 8800 440',
     'einkauf@rheinland-rohstoffe.example', 'Industriestrasse 44, Düsseldorf',
     'active', true, 'buy', 'FOB'),

    ('a1000000-0000-4000-8000-000000000004', v_owner,
     'Lithium Carbonate Battery Grade', 'Lithium', 'India', 'Asia',
     '500 MT / month', 'USD 14,200 / MT',
     'Gujarat Battery Materials Pvt Ltd', 'Priya Raman', '+91 79 4000 2200',
     'sourcing@gujarat-battery.example', 'Plot 22, Sanand GIDC, Ahmedabad',
     'active', true, 'buy', 'CIF'),

    ('a1000000-0000-4000-8000-000000000005', v_owner,
     'Tin Ingot 99.9% — 300 MT', 'Tin', 'Singapore', 'Asia',
     '300 MT / month', 'USD 28,400 / MT',
     'Straits Metals Pte Ltd', 'Daniel Tan', '+65 6220 1100',
     'buying@straits-metals.example', '8 Marina Boulevard, Singapore',
     'active', true, 'buy', 'FOB'),

    ('a1000000-0000-4000-8000-000000000006', v_owner,
     'Aluminium Ingot A7 — 5,000 MT', 'Aluminium', 'Turkey', 'Europe',
     '5,000 MT / month', 'USD 2,480 / MT',
     'Anadolu Metal Ithalat A.S.', 'Mehmet Yilmaz', '+90 212 880 4400',
     'satinalma@anadolu-metal.example', 'Organize Sanayi Bölgesi, Istanbul',
     'active', false, 'buy', 'CIF'),

    -- ---------------- PEMBEKAL (SELL) ----------------
    ('a1000000-0000-4000-8000-000000000007', v_owner,
     'Titanium Ilmenite Sand 54% TiO2', 'Titanium', 'Somaliland', 'Africa',
     '3,000 MT / month', 'USD 320 / MT',
     'Berbera Sands Minerals Ltd', 'Ahmed Yusuf', '+252 63 4421901',
     'sales@berbera-sands.example', 'Concession Block 7, Berbera Coast',
     'active', true, 'sell', 'FOB'),

    ('a1000000-0000-4000-8000-000000000008', v_owner,
     'Gold Dore Bars 21K — Artisanal', 'Aurum', 'Zambia', 'Africa',
     '25 kg / month', 'USD 2,600 / oz',
     'Copperbelt Gold Traders Ltd', 'Grace Mwansa', '+260 212 880 330',
     'trade@copperbelt-gold.example', 'Kitwe Mining District, Copperbelt',
     'active', true, 'sell', 'CIF'),

    ('a1000000-0000-4000-8000-000000000009', v_owner,
     'Coltan Ta2O5 25% — DRC Origin', 'Coltan', 'Congo (DRC)', 'Africa',
     '15 MT / month', 'USD 140 / lb',
     'Kivu Mineral Resources SARL', 'Jean Mukendi', '+243 990 880 220',
     'export@kivu-minerals.example', 'Bukavu Trading Post, South Kivu',
     'active', false, 'sell', 'FOB'),

    ('a1000000-0000-4000-8000-00000000000a', v_owner,
     'Silver Granules 99.95%', 'Silver', 'South Africa', 'Africa',
     '800 kg / month', 'USD 810 / kg',
     'Rand Refinery Partners Pty', 'Pieter van Wyk', '+27 11 880 5500',
     'sales@rand-partners.example', 'Germiston Refining Complex, Gauteng',
     'active', true, 'sell', 'FOB'),

    ('a1000000-0000-4000-8000-00000000000b', v_owner,
     'Copper Ore 22% Cu — ROM', 'Copper', 'Indonesia', 'Asia',
     '4,000 MT / month', 'USD 1,850 / MT',
     'Nusantara Mining Nusantara PT', 'Budi Santoso', '+62 21 8800 7700',
     'marketing@nusantara-mining.example', 'Site Block C, Sumbawa, NTB',
     'active', false, 'sell', 'FOB'),

    ('a1000000-0000-4000-8000-00000000000c', v_owner,
     'Lithium Spodumene 6% Li2O', 'Lithium', 'Zimbabwe', 'Africa',
     '1,200 MT / month', 'USD 1,050 / MT',
     'Mashonaland Lithium Ltd', 'Tendai Chikore', '+263 24 880 990',
     'sales@mashonaland-li.example', 'Bikita Belt, Masvingo Province',
     'active', true, 'sell', 'FOB')
  on conflict (id) do nothing;
end $$;

-- ------------------------------------------------------------
--  Pembersihan data demo (jalankan bila tidak diperlukan):
--
--  delete from public.listings
--  where id::text like 'a1000000-0000-4000-8000-%';
-- ------------------------------------------------------------
