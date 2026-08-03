-- ============================================================
-- Petty Cash KOPKAR MAJU — Supabase Schema
-- Jalankan sekali di Supabase Dashboard -> SQL Editor
-- ============================================================

-- ---------- 1. Profil user (terhubung ke Supabase Auth) ----------
-- Login/register memakai auth.users bawaan Supabase. Tabel ini
-- menyimpan role, status aktif, dan approval superadmin.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'admin' check (role in ('superadmin', 'admin')),
  is_active boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Buat profile otomatis saat user mendaftar lewat Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- 2. Anggota ----------
create table public.employees (
  id text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 3. Kategori Utama (jenis) ----------
create table public.kategori_utama (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- 4. Sub Kategori (sub jenis) ----------
-- Kode 1xx = pengeluaran, 2xx = pemasukan (arah transaksi)
create table public.sub_kategori (
  id text primary key,
  kategori_utama_id text not null references public.kategori_utama (id) on delete cascade,
  code integer not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  unique (kategori_utama_id, name)
);

create index sub_kategori_kategori_utama_idx on public.sub_kategori (kategori_utama_id);

-- ---------- 5. Denominasi pecahan ----------
create table public.denominations (
  id text primary key, -- contoh: 'd-100k', 'k-500'
  value bigint not null,
  type text not null check (type in ('lembar', 'koin')),
  is_active boolean not null default true
);

-- ---------- 6. Pemasukan ----------
create table public.inflows (
  id text primary key,
  date date not null,
  description text not null,
  receipt_no text not null default '',
  kategori_utama_id text not null references public.kategori_utama (id),
  sub_kategori_id text not null references public.sub_kategori (id),
  employee_id text not null references public.employees (id),
  amount bigint not null check (amount >= 0),
  attachments jsonb not null default '[]'::jsonb, -- array Attachment { id, name, type, size, dataUrl }
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index inflows_date_idx on public.inflows (date);

create table public.inflow_details (
  id text primary key,
  inflow_id text not null references public.inflows (id) on delete cascade,
  denomination_id text not null references public.denominations (id),
  quantity integer not null default 0 check (quantity >= 0)
);

-- ---------- 7. Pengeluaran ----------
create table public.outflows (
  id text primary key,
  date date not null,
  description text not null,
  receipt_no text not null default '',
  kategori_utama_id text not null references public.kategori_utama (id),
  sub_kategori_id text not null references public.sub_kategori (id),
  employee_id text not null references public.employees (id),
  amount_out bigint not null check (amount_out >= 0),
  attachments jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index outflows_date_idx on public.outflows (date);

create table public.outflow_details (
  id text primary key,
  outflow_id text not null references public.outflows (id) on delete cascade,
  denomination_id text not null references public.denominations (id),
  quantity integer not null default 0 check (quantity >= 0)
);

-- ---------- 8. Kas Fisik (editable oleh admin) ----------
create table public.kas_fisik (
  id text primary key,
  denomination_id text not null unique references public.denominations (id),
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger kas_fisik_updated_at
  before update on public.kas_fisik
  for each row execute procedure public.set_updated_at();

-- ---------- 9. View buku besar (ledger list) ----------
-- Nominal minus untuk pengeluaran, plus untuk pemasukan, plus saldo berjalan
create or replace view public.ledger as
with entries as (
  select
    id,
    'in' as kind,
    date,
    amount as nominal,
    kategori_utama_id,
    sub_kategori_id,
    employee_id,
    description,
    receipt_no,
    created_by,
    created_at
  from public.inflows
  union all
  select
    id,
    'out' as kind,
    date,
    -amount_out as nominal,
    kategori_utama_id,
    sub_kategori_id,
    employee_id,
    description,
    receipt_no,
    created_by,
    created_at
  from public.outflows
)
select
  *,
  sum(nominal) over (
    order by date asc, created_at asc
    rows between unbounded preceding and current row
  ) as saldo
from entries;

-- ---------- 10. RLS (Row Level Security) ----------
-- Semua user yang sudah login (authenticated) boleh mengelola data bisnis.
-- Tabel profiles dibatasi: user hanya bisa melihat/edit dirinya sendiri,
-- kecuali superadmin yang bisa mengelola semua user.

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.kategori_utama enable row level security;
alter table public.sub_kategori enable row level security;
alter table public.denominations enable row level security;
alter table public.inflows enable row level security;
alter table public.inflow_details enable row level security;
alter table public.outflows enable row level security;
alter table public.outflow_details enable row level security;
alter table public.kas_fisik enable row level security;

create policy "profiles_own"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_superadmin_read"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'superadmin'
    )
  );

create policy "profiles_superadmin_manage"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'superadmin'
    )
  );

create policy "profiles_superadmin_delete"
  on public.profiles for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'superadmin'
    )
  );

create policy "authenticated_all"
  on public.employees for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all"
  on public.kategori_utama for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all"
  on public.sub_kategori for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all"
  on public.denominations for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all"
  on public.inflows for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all"
  on public.inflow_details for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all"
  on public.outflows for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all"
  on public.outflow_details for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all"
  on public.kas_fisik for all
  to authenticated
  using (true)
  with check (true);

-- ---------- 11. Storage bucket untuk bukti / nota ----------
insert into storage.buckets (id, name, public)
values ('bukti', 'bukti', true)
on conflict (id) do nothing;

create policy "authenticated_upload_bukti"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bukti');

create policy "authenticated_read_bukti"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'bukti');

create policy "authenticated_delete_bukti"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bukti');

-- ---------- 12. Seed data awal ----------

insert into public.denominations (id, value, type) values
  ('d-100k', 100000, 'lembar'),
  ('d-50k',  50000,  'lembar'),
  ('d-20k',  20000,  'lembar'),
  ('d-10k',  10000,  'lembar'),
  ('d-5k',   5000,   'lembar'),
  ('d-2k',   2000,   'lembar'),
  ('d-1k',   1000,   'lembar'),
  ('k-1k',   1000,   'koin'),
  ('k-500',  500,    'koin'),
  ('k-200',  200,    'koin'),
  ('k-100',  100,    'koin')
on conflict (id) do nothing;

insert into public.kategori_utama (id, name) values
  ('ku-1', 'Pencairan'),
  ('ku-2', 'Pembelian'),
  ('ku-3', 'Pembayaran'),
  ('ku-4', 'Biaya'),
  ('ku-5', 'Pendapatan'),
  ('ku-6', 'Setoran lainnya')
on conflict (id) do nothing;

insert into public.sub_kategori (id, kategori_utama_id, code, name) values
  ('c-111', 'ku-1', 111, 'Pinjaman'),
  ('c-112', 'ku-1', 112, 'Sukarela'),
  ('c-113', 'ku-1', 113, 'Hak Terakhir Anggota'),
  ('c-121', 'ku-2', 121, 'Stock showcase'),
  ('c-122', 'ku-2', 122, 'Asset'),
  ('c-131', 'ku-3', 131, 'Pembayaran konsinyasi'),
  ('c-132', 'ku-3', 132, 'Kelebihan Potong'),
  ('c-141', 'ku-4', 141, 'Operasional (termasuk insentif pengelola toko)'),
  ('c-142', 'ku-4', 142, 'Pajak bank'),
  ('c-143', 'ku-4', 143, 'Administrasi bank'),
  ('c-211', 'ku-5', 211, 'Administrasi (pelunasan pinjaman)'),
  ('c-212', 'ku-5', 212, 'Bunga Bank'),
  ('c-221', 'ku-6', 221, 'Pelunasan pinjaman'),
  ('c-222', 'ku-6', 222, 'Saldo Awal'),
  ('c-223', 'ku-6', 223, 'Operational Petty Cash'),
  ('c-224', 'ku-6', 224, 'Penjualan showcase'),
  ('c-225', 'ku-6', 225, 'Setoran Sukarela'),
  ('c-226', 'ku-6', 226, 'Iuran Wajib'),
  ('c-227', 'ku-6', 227, 'Pengembalian dana')
on conflict (id) do nothing;

insert into public.employees (id, name) values
  ('e-1', 'ACHMAD FAONIZAN'),
  ('e-2', 'Adelia Ramadhani'),
  ('e-3', 'Adrian Rizky Aulia'),
  ('e-4', 'AGUS SETIAWAN'),
  ('e-5', 'AGUS TRIYANTO'),
  ('e-6', 'AIDIN SALINDEHO'),
  ('e-7', 'Alif Dwi Prayogo'),
  ('e-8', 'Alvino Bimantoro Susanto'),
  ('e-9', 'Alwi Hafizhan'),
  ('e-10', 'ANDI MULYADINATA'),
  ('e-11', 'Andi Risal'),
  ('e-12', 'Andi Saputra'),
  ('e-13', 'ANDI SYARIFUDDIN'),
  ('e-14', 'ANDRI INDRA LUKMAN'),
  ('e-15', 'ANGELINA HERIN PRAVITA PUTRI'),
  ('e-16', 'ANNA MATOFANI'),
  ('e-17', 'ANSOR'),
  ('e-18', 'Anwar'),
  ('e-19', 'Anzilal Dwi Karisma'),
  ('e-20', 'ARGHA PATRIA PERDHANA'),
  ('e-21', 'ARI MASSRIYADI'),
  ('e-22', 'ARIF DARMAWAN'),
  ('e-23', 'ARNY RATNASARI'),
  ('e-24', 'ARY BHINUKO'),
  ('e-25', 'AWAN SUTIYO'),
  ('e-26', 'Bagaswara Erzha Rafsanjani'),
  ('e-27', 'BAGUS WIDAGDO'),
  ('e-28', 'Baharuddin'),
  ('e-29', 'BAMBANG HARYONO'),
  ('e-30', 'BAMBANG SURYANTO'),
  ('e-31', 'BAYU ADITYA PURNOMO'),
  ('e-32', 'BERNADETA LITA UDAWATI'),
  ('e-33', 'BUDI CAHYONO'),
  ('e-34', 'BUYUNG RIZKI ALI'),
  ('e-35', 'CECILIA KESTI WININGTYAS'),
  ('e-36', 'CHANDRA HALIM WIJAYA'),
  ('e-37', 'CHRISTINA LINAWATI'),
  ('e-38', 'Dani Ramdani'),
  ('e-39', 'DEDI RUSLIADI LEMAN'),
  ('e-40', 'DEDY IRAWAN S. SINAGA'),
  ('e-41', 'DESI ASTIKA INDAH'),
  ('e-42', 'Difa Alfaridz Fiscalaga'),
  ('e-43', 'DIKQI WIBOWO'),
  ('e-44', 'Dony Sasmita'),
  ('e-45', 'Dwi Agung Zulkarnaen'),
  ('e-46', 'Dwi Santoso'),
  ('e-47', 'Dwi Septiani Darmayanti'),
  ('e-48', 'DZULFIKRI FATHONI'),
  ('e-49', 'E. DJODIK SUKADI'),
  ('e-50', 'EDIANTO'),
  ('e-51', 'Edy Agung Setiyawan'),
  ('e-52', 'EKO HURI CAHYONO'),
  ('e-53', 'Enjang Lukman Nuryadin'),
  ('e-54', 'ESTU SASONGKO'),
  ('e-55', 'Fajar Ahdiansyah'),
  ('e-56', 'Fajar Putra Hadi Wijaya'),
  ('e-57', 'Fanny Dian Rosari'),
  ('e-58', 'Fauzan Gusta Rozaqi'),
  ('e-59', 'FENIKA LESMANA PUTRA'),
  ('e-60', 'Ferdinandus Samuel Doni'),
  ('e-61', 'FIRMAN'),
  ('e-62', 'Franz Tangke Tasik'),
  ('e-63', 'Fredyk Patabang'),
  ('e-64', 'FRIZKY RAMADHAN'),
  ('e-65', 'Fx. Nugroho Tribayu Siwi'),
  ('e-66', 'GASPAR JOHANES RIWU'),
  ('e-67', 'Ghofar Fauzi'),
  ('e-68', 'GUFRANSYAH'),
  ('e-69', 'HAIYONO'),
  ('e-70', 'Hajar Ardianto'),
  ('e-71', 'HANGGORO'),
  ('e-72', 'HARI CAHYADI'),
  ('e-73', 'HARIM'),
  ('e-74', 'Harmono'),
  ('e-75', 'Hartomo amin saputra'),
  ('e-76', 'HEINCE'),
  ('e-77', 'HENDRA WIJAYA'),
  ('e-78', 'Heri Susanto'),
  ('e-79', 'Heribertus Budi Dermawan'),
  ('e-80', 'Heriyandi'),
  ('e-81', 'Hermanto'),
  ('e-82', 'Hermoyo Kusumo'),
  ('e-83', 'HERRY'),
  ('e-84', 'HIMELDA INDRITA'),
  ('e-85', 'I GUSTI NGURAH PERMANA ADHI PUTRA'),
  ('e-86', 'Imam Safi''i'),
  ('e-87', 'IRPANDI MUSLIMIN'),
  ('e-88', 'IRWAN GUSMAN DIARDY PONTOH'),
  ('e-89', 'Jefri Riyanto'),
  ('e-90', 'JHONEST MARTUA HUTAGAOL'),
  ('e-91', 'JHONY EMBANG SALULINGGI'),
  ('e-92', 'Jihad Fahrurrozi'),
  ('e-93', 'JINUT MUHLITANTO'),
  ('e-94', 'Joko Purnomo'),
  ('e-95', 'JOKO SUTIKNO'),
  ('e-96', 'Juni Purwanto'),
  ('e-97', 'KAREL SIMARMATA'),
  ('e-98', 'khaerunnisa Amrun'),
  ('e-99', 'Kodirun'),
  ('e-100', 'LIDA'),
  ('e-101', 'M. REZA'),
  ('e-102', 'MANSYUR PANTJE'),
  ('e-103', 'MARIO LOVER SEKO'),
  ('e-104', 'Markus Wasa Wangge'),
  ('e-105', 'MATEUS DARYADI'),
  ('e-106', 'MAYA SARI'),
  ('e-107', 'Menaldhi nafadin'),
  ('e-108', 'Moch Arif Trianto'),
  ('e-109', 'Muhammad Abdul Rochim'),
  ('e-110', 'Muhammad Adam Saleh'),
  ('e-111', 'Muhammad Fadhlan Ramadhan'),
  ('e-112', 'Muhammad Fahmi Triaji'),
  ('e-113', 'Muhammad Harianto'),
  ('e-114', 'Muhammad Taufik Nur'),
  ('e-115', 'Muhammad Yakop'),
  ('e-116', 'Muhsin Miratul Bilad'),
  ('e-117', 'Mukti Indriadi Wibowo'),
  ('e-118', 'NABILA AYU PUSPITA'),
  ('e-119', 'NANIK AGUSTININGSIH'),
  ('e-120', 'Noor Rahmat Hidayat'),
  ('e-121', 'NORSAIT'),
  ('e-122', 'NURDIN LATHIEF'),
  ('e-123', 'NURHAYANI RUSMAN'),
  ('e-124', 'PARMI'),
  ('e-125', 'PONCO TEGUH RAHARJO'),
  ('e-126', 'PRANA DIAN ADRIYANI'),
  ('e-127', 'PRASETYA EKA INDRADIANTO'),
  ('e-128', 'PUJO'),
  ('e-129', 'Putri Aprilianti'),
  ('e-130', 'Qadari Muchlis'),
  ('e-131', 'R. Irfa Rais Yogaswara'),
  ('e-132', 'RACHMAN YULIKISWANTO'),
  ('e-133', 'Radian Tri Atmaja'),
  ('e-134', 'Rahmat Budi Prasetya'),
  ('e-135', 'Ridwan'),
  ('e-136', 'Rizky Dwi Fadlirohim'),
  ('e-137', 'Rizky kurnia adi nugraha'),
  ('e-138', 'RIZKY ROSDIANA'),
  ('e-139', 'ROBIANSYAH'),
  ('e-140', 'rofiqoh'),
  ('e-141', 'ROMDI'),
  ('e-142', 'RYIAN IRPHIN'),
  ('e-143', 'RYOGA ADITYO DIPOWIKORO'),
  ('e-144', 'SALIM'),
  ('e-145', 'Samsudin'),
  ('e-146', 'Samsudin (14628)'),
  ('e-147', 'SETYO NUGROHO AGUNG WAHONO'),
  ('e-148', 'SITI SUKRIYAH'),
  ('e-149', 'Slamet'),
  ('e-150', 'SLAMET HARIYANTO'),
  ('e-151', 'STEVEN 11916'),
  ('e-152', 'STEVEN 15063'),
  ('e-153', 'SUDARJAT'),
  ('e-154', 'Sudarti'),
  ('e-155', 'Sudin Sion'),
  ('e-156', 'SUHARMIN'),
  ('e-157', 'Suhrawardi'),
  ('e-158', 'Sukarman'),
  ('e-159', 'SUKRAN'),
  ('e-160', 'SUMANTRI'),
  ('e-161', 'SURIANSYAH'),
  ('e-162', 'Suwanto'),
  ('e-163', 'SUWOTO'),
  ('e-164', 'SUYANTO'),
  ('e-165', 'Teguh Satria Aditya Wardana'),
  ('e-166', 'Theodoris Junus'),
  ('e-167', 'Tony'),
  ('e-168', 'TRI ARI HENDIK SAPUTRA'),
  ('e-169', 'UM. EDDY NASRI JAYAPATI S.'),
  ('e-170', 'UU Hudaya'),
  ('e-171', 'WAHYU ANSYAR'),
  ('e-172', 'Wahyudi'),
  ('e-173', 'WISNU BAGUS SANTOSO'),
  ('e-174', 'Yemima Maria Gabriel'),
  ('e-175', 'Yoga Tri Nugraha'),
  ('e-176', 'YOSEF COPERTINO ADHIE SITORUS'),
  ('e-177', 'YUDHA DWI ARYANDHI'),
  ('e-178', 'YUDI KRISYANTO'),
  ('e-179', 'YUDITH BANDASO'),
  ('e-180', 'YULI ISNAWAN'),
  ('e-181', 'Yusran'),
  ('e-182', 'Zainuri wahid'),
  ('e-183', 'Zufrizer'),
  ('e-184', 'ULUL ABSHOR')
on conflict (id) do nothing;

-- ============================================================
-- CATATAN BOOTSTRAP SUPERADMIN
-- ============================================================
-- 1) Jalankan seluruh schema.sql di atas.
-- 2) Daftar 1 akun pertama lewat halaman Register aplikasi (atau buat di Dashboard -> Authentication).
-- 3) Jalankan query berikut agar akun itu menjadi superadmin aktif:
--
-- update public.profiles
-- set role = 'superadmin', is_active = true, approved_at = now()
-- where email = 'EMAIL_AKUN_PERTAMA_ANDA';

