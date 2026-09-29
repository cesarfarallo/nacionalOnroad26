create extension if not exists pgcrypto;

create table registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  nickname text,
  email text not null,
  phone text,
  club text
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  category text not null check (category in ('1/8 SP','GT Eco','GT Nitro','Touring Eco Modified','Touring Eco Stock')),
  transponder text,
  chassis_brand text,
  engine_brand text,
  tire_brand text,
  unique (registration_id, category)
);

-- RLS activo sin policies: solo accede el service role desde las rutas API.
alter table registrations enable row level security;
alter table entries enable row level security;
