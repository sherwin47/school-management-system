-- Quick fix if 001 failed on attendance_logs indexes.
-- Safe to run alone when public.attendance_logs already exists.

alter table public.attendance_logs add column if not exists session_date date;
alter table public.attendance_logs add column if not exists grade text;
alter table public.attendance_logs add column if not exists section text;
alter table public.attendance_logs add column if not exists student_id text;
alter table public.attendance_logs add column if not exists student_name text;
alter table public.attendance_logs add column if not exists marked_by_name text;
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
  ) then
    update public.attendance_logs
    set session_date = date::date
    where session_date is null and date is not null;
  end if;
end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'late', 'leave');
exception when duplicate_object then null;
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

create index if not exists attendance_logs_session_idx
  on public.attendance_logs (session_date, grade, section);

create index if not exists attendance_logs_student_idx
  on public.attendance_logs (student_id);
