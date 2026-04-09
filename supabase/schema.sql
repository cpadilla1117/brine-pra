-- ============================================================
-- BRINE — Supabase Schema
-- The Water Price Reporting Agency
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type basin_enum as enum (
  'Permian',
  'Delaware',
  'DJ',
  'Midland',
  'Eagle Ford',
  'Bakken',
  'Other'
);

create type water_grade_enum as enum (
  'Basic',
  'Secondary',
  'Frac-Ready'
);

create type transaction_type_enum as enum (
  'Sale',
  'Purchase',
  'Disposal',
  'Transfer'
);

create type submission_status_enum as enum (
  'Draft',
  'Submitted',
  'Verified',
  'Published'
);

create type user_role_enum as enum (
  'operator',
  'admin'
);

-- ============================================================
-- COMPANIES
-- ============================================================

create table companies (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  basin         basin_enum not null,
  contact_email text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- PROFILES (linked to Supabase Auth)
-- ============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  role          user_role_enum not null default 'operator',
  company_id    uuid references companies(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- TRANSACTIONS (weekly water transaction submissions)
-- ============================================================

create table transactions (
  id                      uuid primary key default uuid_generate_v4(),
  operator_id             uuid not null references profiles(id) on delete cascade,
  company_id              uuid not null references companies(id) on delete cascade,
  basin                   basin_enum not null,
  transaction_date_start  date not null,
  transaction_date_end    date not null,
  volume_bbl_per_day      numeric(12, 2) not null check (volume_bbl_per_day > 0),
  price_per_bbl           numeric(8, 4) not null check (price_per_bbl > 0),
  water_grade             water_grade_enum not null,
  transaction_type        transaction_type_enum not null,
  buyer_name              text,
  seller_name             text not null,
  tds_ppm                 numeric(10, 2) not null,
  chlorides_ppm           numeric(10, 2),
  tss_ppm                 numeric(10, 2),
  bacteria_count          numeric(10, 2),
  notes                   text,
  status                  submission_status_enum not null default 'Draft',
  submitted_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint valid_date_range check (transaction_date_end >= transaction_date_start)
);

-- Indexes for common query patterns
create index idx_transactions_operator on transactions(operator_id);
create index idx_transactions_company on transactions(company_id);
create index idx_transactions_basin_grade on transactions(basin, water_grade);
create index idx_transactions_status on transactions(status);
create index idx_transactions_dates on transactions(transaction_date_start, transaction_date_end);

-- ============================================================
-- PRICE INDEX (weekly calculated benchmarks)
-- ============================================================

create table price_index (
  id                  uuid primary key default uuid_generate_v4(),
  basin               basin_enum not null,
  water_grade         water_grade_enum not null,
  week_start          date not null,
  week_end            date not null,
  vwap                numeric(8, 4) not null,
  total_volume        numeric(14, 2) not null,
  reporter_count      integer not null,
  transaction_count   integer not null,
  week_on_week_delta  numeric(8, 4),
  prior_vwap          numeric(8, 4),
  is_thin_market      boolean not null default false,
  calculated_at       timestamptz not null default now(),

  constraint unique_index_entry unique (basin, water_grade, week_start)
);

create index idx_price_index_week on price_index(week_start desc);
create index idx_price_index_basin_grade on price_index(basin, water_grade);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table companies enable row level security;
alter table transactions enable row level security;
alter table price_index enable row level security;

-- Profiles: users can read/update their own profile; admins can read all
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Companies: all authenticated users can read companies
create policy "Authenticated users can view companies"
  on companies for select
  to authenticated
  using (true);

create policy "Admins can manage companies"
  on companies for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Transactions: operators see own; admins see all
create policy "Operators can view own transactions"
  on transactions for select
  using (operator_id = auth.uid());

create policy "Operators can insert own transactions"
  on transactions for insert
  with check (operator_id = auth.uid());

create policy "Operators can update own draft transactions"
  on transactions for update
  using (operator_id = auth.uid() and status = 'Draft');

create policy "Admins can view all transactions"
  on transactions for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all transactions"
  on transactions for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Price index: readable by all authenticated users
create policy "Authenticated users can view price index"
  on price_index for select
  to authenticated
  using (true);

create policy "Admins can manage price index"
  on price_index for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_companies_updated_at
  before update on companies
  for each row execute function update_updated_at();

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger update_transactions_updated_at
  before update on transactions
  for each row execute function update_updated_at();

-- ============================================================
-- FUNCTION: auto-create profile on signup
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role_enum, 'operator')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
