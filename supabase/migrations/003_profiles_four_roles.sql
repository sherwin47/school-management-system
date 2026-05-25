-- Align DB role constraint with Campus OS frontend (admin, teacher, student, parent).
-- Run only if profiles still allow accountant/librarian/etc.

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role::text in ('admin', 'teacher', 'student', 'parent'));

-- If role column uses public.app_role enum with extra values, recreate enum:
-- (Uncomment and adjust only when no rows use removed roles.)
-- alter table public.profiles alter column role type text using role::text;
-- drop type if exists public.app_role cascade;
-- create type public.app_role as enum ('admin', 'teacher', 'student', 'parent');
-- alter table public.profiles alter column role type public.app_role using role::public.app_role;
