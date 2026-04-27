-- Tambah 10 field baru ke table aset
alter table aset
  add column if not exists no_siri_pembuat          text,
  add column if not exists pembekal                 text,
  add column if not exists no_kontrak               text,
  add column if not exists cara_diperoleh           text default 'Beli',
  add column if not exists tarikh_waranti_tamat     date,
  add column if not exists spesifikasi              text,
  add column if not exists pegawai_bertanggungjawab text,
  add column if not exists tarikh_penempatan        date,
  add column if not exists ketua_jabatan            text,
  add column if not exists nilai_semasa             decimal(10,2);
