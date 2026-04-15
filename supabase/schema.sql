-- ============================================
-- PetCare - Schema SQL para Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Tabla de perros
create table if not exists dogs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  breed text,
  birthdate date,
  emoji text default '🐶',
  photo_url text,
  height numeric(5,2),
  created_at timestamptz default now()
);

-- Bucket de Storage para fotos de mascotas
insert into storage.buckets (id, name, public) values ('dog-photos', 'dog-photos', true)
  on conflict (id) do nothing;

-- Política: usuarios autenticados pueden subir fotos a su carpeta
create policy "Users can upload dog photos"
  on storage.objects for insert
  with check (bucket_id = 'dog-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Política: cualquiera puede ver fotos (bucket público)
create policy "Public read dog photos"
  on storage.objects for select
  using (bucket_id = 'dog-photos');

-- Política: usuarios pueden borrar sus propias fotos
create policy "Users can delete own dog photos"
  on storage.objects for delete
  using (bucket_id = 'dog-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Tabla de registros de cuidado
create table if not exists care_records (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  type text not null,           -- 'vacuna', 'desparasitante', 'baño', 'otro'
  name text not null,
  date date not null,
  next_date date,
  notes text,
  created_at timestamptz default now()
);

-- Tabla de visitas veterinarias
create table if not exists vet_visits (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  date date not null,
  vet text,
  reason text not null,
  notes text,
  created_at timestamptz default now()
);

-- Tabla de registros de peso
create table if not exists weight_records (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  date date not null,
  lb numeric(5,2) not null,
  created_at timestamptz default now()
);

-- Tabla de veterinarias
create table if not exists vet_clinics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  phone text,
  whatsapp text,
  lat numeric(10,7),
  lng numeric(10,7),
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table dogs enable row level security;
alter table care_records enable row level security;
alter table vet_visits enable row level security;
alter table weight_records enable row level security;
alter table vet_clinics enable row level security;

-- Política para dogs: el usuario solo ve/crea/edita/borra sus propios perros
create policy "Users can view own dogs"
  on dogs for select
  using (auth.uid() = user_id);

create policy "Users can insert own dogs"
  on dogs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own dogs"
  on dogs for update
  using (auth.uid() = user_id);

create policy "Users can delete own dogs"
  on dogs for delete
  using (auth.uid() = user_id);

-- Política para care_records: acceso via dog_id → user_id
create policy "Users can view own care_records"
  on care_records for select
  using (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can insert own care_records"
  on care_records for insert
  with check (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can update own care_records"
  on care_records for update
  using (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can delete own care_records"
  on care_records for delete
  using (dog_id in (select id from dogs where user_id = auth.uid()));

-- Política para vet_visits
create policy "Users can view own vet_visits"
  on vet_visits for select
  using (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can insert own vet_visits"
  on vet_visits for insert
  with check (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can update own vet_visits"
  on vet_visits for update
  using (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can delete own vet_visits"
  on vet_visits for delete
  using (dog_id in (select id from dogs where user_id = auth.uid()));

-- Política para weight_records
create policy "Users can view own weight_records"
  on weight_records for select
  using (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can insert own weight_records"
  on weight_records for insert
  with check (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can update own weight_records"
  on weight_records for update
  using (dog_id in (select id from dogs where user_id = auth.uid()));

create policy "Users can delete own weight_records"
  on weight_records for delete
  using (dog_id in (select id from dogs where user_id = auth.uid()));

-- Política para vet_clinics
create policy "Users can view own vet_clinics"
  on vet_clinics for select
  using (auth.uid() = user_id);

create policy "Users can insert own vet_clinics"
  on vet_clinics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vet_clinics"
  on vet_clinics for update
  using (auth.uid() = user_id);

create policy "Users can delete own vet_clinics"
  on vet_clinics for delete
  using (auth.uid() = user_id);
