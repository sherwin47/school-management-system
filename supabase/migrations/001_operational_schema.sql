-- Campus OS — Operational schema (idempotent / safe to re-run)
-- If you already have public.profiles, this script skips creating it and only adds missing columns.

create extension if not exists "pgcrypto";

-- ── Enums (skip if already created) ─────────────────────────────────────────
do $$ begin
  create type public.app_role as enum (
    'admin', 'accountant', 'librarian', 'warden', 'receptionist',
    'teacher', 'parent', 'student', 'driver'
  );
exception when duplicate_object then null;
end $$;

do $$ begin create type public.hostel_room_status as enum ('available', 'full', 'maintenance');
exception when duplicate_object then null; end $$;
do $$ begin create type public.hostel_complaint_status as enum ('open', 'in-progress', 'resolved', 'emergency');
exception when duplicate_object then null; end $$;
do $$ begin create type public.hostel_visitor_status as enum ('checked-in', 'checked-out', 'pending');
exception when duplicate_object then null; end $$;
do $$ begin create type public.fee_record_status as enum ('paid', 'partial', 'overdue', 'pending');
exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('success', 'pending', 'failed');
exception when duplicate_object then null; end $$;
do $$ begin create type public.attendance_status as enum ('present', 'absent', 'late', 'leave');
exception when duplicate_object then null; end $$;
do $$ begin create type public.circulation_status as enum ('issued', 'returned', 'overdue');
exception when duplicate_object then null; end $$;

-- ── Shared trigger helper ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Profiles (RBAC) — create only if missing; otherwise align columns ─────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  role public.app_role not null default 'student',
  avatar_url text,
  subtitle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists subtitle text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Add role column only when absent (starter templates may already have role as text)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles
      add column role public.app_role not null default 'student';
  end if;
end $$;

create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role := 'student';
  v_meta_role text;
begin
  v_meta_role := new.raw_user_meta_data->>'role';
  if v_meta_role is not null and v_meta_role <> '' then
    begin
      v_role := v_meta_role::public.app_role;
    exception when others then
      v_role := 'student';
    end;
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    v_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Hostel ────────────────────────────────────────────────────────────────────
create table if not exists public.hostel_rooms (
  id uuid primary key default gen_random_uuid(),
  block text not null,
  room_no text not null,
  capacity int not null default 4 check (capacity > 0),
  occupied int not null default 0 check (occupied >= 0),
  student_ids uuid[] not null default '{}',
  status public.hostel_room_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block, room_no)
);

create table if not exists public.hostel_complaints (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  room text not null,
  category text not null,
  description text not null,
  status public.hostel_complaint_status not null default 'open',
  reported_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hostel_visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  student_name text not null,
  room text not null,
  purpose text not null,
  check_in timestamptz not null default now(),
  check_out timestamptz,
  status public.hostel_visitor_status not null default 'pending',
  created_at timestamptz not null default now()
);

drop trigger if exists hostel_rooms_updated_at on public.hostel_rooms;
create trigger hostel_rooms_updated_at before update on public.hostel_rooms
  for each row execute function public.set_updated_at();
drop trigger if exists hostel_complaints_updated_at on public.hostel_complaints;
create trigger hostel_complaints_updated_at before update on public.hostel_complaints
  for each row execute function public.set_updated_at();

-- ── Transport ─────────────────────────────────────────────────────────────────
create table if not exists public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  route_no text not null unique,
  driver_name text not null,
  driver_phone text,
  driver_profile_id uuid references public.profiles (id) on delete set null,
  bus_no text not null,
  capacity int not null default 40,
  student_count int not null default 0,
  stops jsonb not null default '[]',
  current_lat double precision,
  current_lng double precision,
  trip_active boolean not null default false,
  last_location_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists transport_routes_updated_at on public.transport_routes;
create trigger transport_routes_updated_at before update on public.transport_routes
  for each row execute function public.set_updated_at();

-- ── Fees & Finance ────────────────────────────────────────────────────────────
create table if not exists public.fee_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  amount numeric(12, 2) not null check (amount >= 0),
  frequency text not null default 'Annual',
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.fee_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid,
  student_name text not null,
  grade text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  paid numeric(12, 2) not null default 0 check (paid >= 0),
  due numeric(12, 2) not null default 0 check (due >= 0),
  due_date date not null,
  status public.fee_record_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid,
  student_name text not null,
  fee_record_id uuid references public.fee_records (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  method text not null default 'Online',
  receipt_no text,
  gateway_ref text,
  status public.payment_status not null default 'pending',
  paid_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists payment_ledger_student_idx on public.payment_ledger (student_id);
drop trigger if exists fee_records_updated_at on public.fee_records;
create trigger fee_records_updated_at before update on public.fee_records
  for each row execute function public.set_updated_at();

-- ── Attendance & grades ───────────────────────────────────────────────────────
create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  grade text not null,
  section text not null,
  student_id text not null,
  student_name text not null,
  status public.attendance_status not null,
  marked_by uuid references public.profiles (id) on delete set null,
  marked_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Align legacy attendance_logs (table may exist without session_date)
alter table public.attendance_logs add column if not exists session_date date;
alter table public.attendance_logs add column if not exists grade text;
alter table public.attendance_logs add column if not exists section text;
alter table public.attendance_logs add column if not exists student_id text;
alter table public.attendance_logs add column if not exists student_name text;
alter table public.attendance_logs add column if not exists marked_by_name text;
alter table public.attendance_logs add column if not exists marked_by uuid references public.profiles (id) on delete set null;
alter table public.attendance_logs add column if not exists created_at timestamptz default now();
alter table public.attendance_logs add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attendance_logs' and column_name = 'date'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attendance_logs' and column_name = 'session_date'
  ) then
    alter table public.attendance_logs rename column date to session_date;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attendance_logs' and column_name = 'date'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attendance_logs' and column_name = 'session_date'
  ) then
    update public.attendance_logs
    set session_date = date::date
    where session_date is null and date is not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attendance_logs' and column_name = 'status'
  ) then
    alter table public.attendance_logs
      add column status public.attendance_status not null default 'present';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.attendance_logs'::regclass
      and contype = 'u'
      and conname = 'attendance_logs_session_grade_section_student_key'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attendance_logs' and column_name = 'session_date'
  ) then
    alter table public.attendance_logs
      add constraint attendance_logs_session_grade_section_student_key
      unique (session_date, grade, section, student_id);
  end if;
exception
  when duplicate_object then null;
  when undefined_column then null;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attendance_logs' and column_name = 'session_date'
  ) then
    execute 'create index if not exists attendance_logs_session_idx on public.attendance_logs (session_date, grade, section)';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attendance_logs' and column_name = 'student_id'
  ) then
    execute 'create index if not exists attendance_logs_student_idx on public.attendance_logs (student_id)';
  end if;
end $$;

drop trigger if exists attendance_logs_updated_at on public.attendance_logs;
create trigger attendance_logs_updated_at before update on public.attendance_logs
  for each row execute function public.set_updated_at();

create table if not exists public.academic_grades (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  student_name text not null,
  subject text not null,
  grade text not null,
  section text not null,
  score numeric(5, 2) not null check (score >= 0 and score <= 100),
  max_score numeric(5, 2) not null default 100,
  term text not null,
  recorded_at timestamptz not null default now()
);

create index if not exists academic_grades_student_idx on public.academic_grades (student_id);

-- ── Library ───────────────────────────────────────────────────────────────────
create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn text,
  category text not null,
  total_copies int not null default 1 check (total_copies >= 0),
  available_copies int not null default 1 check (available_copies >= 0),
  shelf text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_circulations (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.library_books (id) on delete cascade,
  book_title text not null,
  student_name text not null,
  issued_date date not null default current_date,
  due_date date not null,
  returned_date date,
  status public.circulation_status not null default 'issued',
  created_at timestamptz not null default now()
);

drop trigger if exists library_books_updated_at on public.library_books;
create trigger library_books_updated_at before update on public.library_books
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.hostel_rooms enable row level security;
alter table public.hostel_complaints enable row level security;
alter table public.hostel_visitors enable row level security;
alter table public.transport_routes enable row level security;
alter table public.fee_categories enable row level security;
alter table public.fee_records enable row level security;
alter table public.payment_ledger enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.academic_grades enable row level security;
alter table public.library_books enable row level security;
alter table public.library_circulations enable row level security;

-- Works whether profiles.role is app_role enum or text
create or replace function public.is_staff_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role::text in (
      'admin', 'accountant', 'librarian', 'warden', 'receptionist', 'teacher', 'driver'
    ) from public.profiles where id = auth.uid()),
    false
  );
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_staff_role());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "hostel_staff_all" on public.hostel_rooms;
create policy "hostel_staff_all" on public.hostel_rooms
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

drop policy if exists "hostel_complaints_staff_all" on public.hostel_complaints;
create policy "hostel_complaints_staff_all" on public.hostel_complaints
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

drop policy if exists "hostel_visitors_staff_all" on public.hostel_visitors;
create policy "hostel_visitors_staff_all" on public.hostel_visitors
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

drop policy if exists "transport_authenticated" on public.transport_routes;
create policy "transport_authenticated" on public.transport_routes
  for all using (auth.role() = 'authenticated');

drop policy if exists "fees_staff_all" on public.fee_categories;
create policy "fees_staff_all" on public.fee_categories
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

drop policy if exists "fee_records_staff_all" on public.fee_records;
create policy "fee_records_staff_all" on public.fee_records
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

drop policy if exists "payment_ledger_insert" on public.payment_ledger;
create policy "payment_ledger_insert" on public.payment_ledger
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "payment_ledger_select" on public.payment_ledger;
create policy "payment_ledger_select" on public.payment_ledger
  for select using (auth.role() = 'authenticated');

drop policy if exists "attendance_staff_write" on public.attendance_logs;
create policy "attendance_staff_write" on public.attendance_logs
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

drop policy if exists "attendance_authenticated_read" on public.attendance_logs;
create policy "attendance_authenticated_read" on public.attendance_logs
  for select using (auth.role() = 'authenticated');

drop policy if exists "academic_grades_staff" on public.academic_grades;
create policy "academic_grades_staff" on public.academic_grades
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

drop policy if exists "academic_grades_read" on public.academic_grades;
create policy "academic_grades_read" on public.academic_grades
  for select using (auth.role() = 'authenticated');

drop policy if exists "library_books_staff" on public.library_books;
create policy "library_books_staff" on public.library_books
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

drop policy if exists "library_books_read" on public.library_books;
create policy "library_books_read" on public.library_books
  for select using (auth.role() = 'authenticated');

drop policy if exists "library_circulations_staff" on public.library_circulations;
create policy "library_circulations_staff" on public.library_circulations
  for all using (auth.role() = 'authenticated' and public.is_staff_role());

comment on table public.hostel_rooms is 'Hostel room matrix and occupancy';
comment on table public.transport_routes is 'Bus routes with live geolocation for active trips';
comment on table public.payment_ledger is 'Online gateway payment log';
comment on table public.attendance_logs is 'Per-student daily attendance marks (upsert key: date+grade+section+student)';
