-- Esquema completo (001 + 002 + 003). Idempotente: se puede correr más de una vez.
-- Pegar en Supabase → SQL Editor, en el proyecto dev y en el prod.
create extension if not exists pgcrypto;

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  nickname text,
  email text not null,
  phone text,
  club text
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  category text not null check (category in ('1/8 SP','GT Eco','GT Nitro','Touring Eco Modified','Touring Eco Stock')),
  transponder text,
  chassis_brand text,
  engine_brand text,
  tire_brand text,
  unique (registration_id, category)
);
alter table entries add column if not exists esc_brand text;

-- Pagos y opt-in de mail (por piloto)
alter table registrations add column if not exists email_optin boolean not null default false;
alter table registrations add column if not exists paid boolean not null default false;
alter table registrations add column if not exists paid_at timestamptz;
alter table registrations add column if not exists payment_email_sent_at timestamptz;

-- RLS activo sin policies: solo accede el service role desde las rutas API.
alter table registrations enable row level security;
alter table entries enable row level security;
