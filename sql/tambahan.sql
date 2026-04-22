-- ============================================================
-- TAMBAHAN: Log Penyelenggaraan + Sejarah Perpindahan
-- Jalankan dalam Supabase SQL Editor
-- ============================================================

-- Table: penyelenggaraan
create table if not exists penyelenggaraan (
  id              uuid        default gen_random_uuid() primary key,
  aset_id         uuid        references aset(id) on delete cascade,
  tarikh          date        not null,
  jenis           text        default 'pembaikan',
  deskripsi       text,
  kos             decimal(10,2),
  nama_teknisyen  text,
  syarikat        text,
  status          text        default 'selesai',
  created_at      timestamp   default now()
);

-- Table: perpindahan
create table if not exists perpindahan (
  id            uuid        default gen_random_uuid() primary key,
  aset_id       uuid        references aset(id) on delete cascade,
  lokasi_lama   text,
  lokasi_baru   text,
  tarikh        date        not null,
  sebab         text,
  nama_pegawai  text,
  created_at    timestamp   default now()
);

-- RLS
alter table penyelenggaraan enable row level security;
create policy "Enable read penyelenggaraan" on penyelenggaraan for select to anon, authenticated using (true);
create policy "Enable write penyelenggaraan" on penyelenggaraan for insert to anon, authenticated with check (true);
create policy "Enable update penyelenggaraan" on penyelenggaraan for update to anon, authenticated using (true);
create policy "Enable delete penyelenggaraan" on penyelenggaraan for delete to anon, authenticated using (true);

alter table perpindahan enable row level security;
create policy "Enable read perpindahan" on perpindahan for select to anon, authenticated using (true);
create policy "Enable write perpindahan" on perpindahan for insert to anon, authenticated with check (true);
create policy "Enable update perpindahan" on perpindahan for update to anon, authenticated using (true);
create policy "Enable delete perpindahan" on perpindahan for delete to anon, authenticated using (true);
