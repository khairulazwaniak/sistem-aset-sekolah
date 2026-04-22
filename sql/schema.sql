-- ============================================================
-- SISTEM PENGURUSAN ASET SEKOLAH
-- Jalankan dalam Supabase SQL Editor
-- ============================================================

-- Table: aset
create table if not exists aset (
  id            uuid        default gen_random_uuid() primary key,
  no_siri       text        unique not null,
  nama          text        not null,
  kategori      text,
  jenama        text,
  model         text,
  tarikh_terima date,
  harga         decimal(10, 2),
  lokasi        text,
  status        text        default 'aktif',
  gambar_url    text,
  created_at    timestamp   default now()
);

-- Table: dokumen_aset
create table if not exists dokumen_aset (
  id             uuid    default gen_random_uuid() primary key,
  aset_id        uuid    references aset(id) on delete cascade,
  jenis          text    default 'lain',
  nama_fail      text,
  fail_url       text,
  tarikh_upload  date    default now(),
  catatan        text
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table aset enable row level security;

create policy "Public read aset"
  on aset for select using (true);

create policy "Auth write aset"
  on aset for all using (true);

alter table dokumen_aset enable row level security;

create policy "Public read dokumen"
  on dokumen_aset for select using (true);

create policy "Auth write dokumen"
  on dokumen_aset for all using (true);

-- ============================================================
-- Storage Buckets (buat dalam Supabase Dashboard)
-- Storage → New Bucket → Public
-- Bucket 1: aset-gambar  (foto JPG/PNG)
-- Bucket 2: aset-dokumen (PDF, invois, waranti)
-- ============================================================
