-- ═══════════════════════════════════════════════════════════════════════════════
-- Fix "Invalid login credentials" for seeded users (Supabase SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Replaces plain-text encrypted_password placeholders (e.g. 'mock_hash') with
-- valid Bcrypt hashes for password: password123
--
-- Uses pgcrypto: crypt('password123', gen_salt('bf', 10))
--   → Bcrypt cost 10, $2a$ prefix — same family Supabase GoTrue expects
--
-- Dashboard → SQL Editor → paste → Run
-- ═══════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── 1) Preview affected users ─────────────────────────────────────────────────
select
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at
from auth.users
where encrypted_password = 'mock_hash'
   or encrypted_password is null
   or encrypted_password !~ '^\$2[aby]\$'
order by email;

-- ── 2) Fix passwords + confirm emails + auth metadata ───────────────────────
-- gen_salt('bf', 10) runs once per row so each user gets a unique bcrypt hash
update auth.users
set
  encrypted_password = crypt('password123', gen_salt('bf', 10)),

  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at       = coalesce(confirmed_at, now()),

  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email')
    ),

  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'email_verified', true,
      'email_confirmed', true
    ),

  confirmation_token     = null,
  recovery_token         = null,
  email_change_token_new = null,
  email_change           = null,

  aud  = coalesce(nullif(aud, ''), 'authenticated'),
  role = coalesce(nullif(role, ''), 'authenticated'),

  banned_until = null,
  deleted_at   = null,
  is_sso_user  = false,
  updated_at   = now()

where
  encrypted_password = 'mock_hash'
  or encrypted_password is null
  or encrypted_password !~ '^\$2[aby]\$';

-- ── 3) Merge role + full_name from public.profiles into auth metadata ─────────
update auth.users u
set
  raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'role', p.role::text,
      'full_name', p.full_name
    )
from public.profiles p
where p.id = u.id;

-- ── 4) Verification ───────────────────────────────────────────────────────────
select
  email,
  left(encrypted_password, 7) as hash_prefix,
  email_confirmed_at is not null as email_confirmed,
  confirmed_at is not null as account_confirmed,
  raw_app_meta_data ->> 'provider' as provider,
  raw_user_meta_data ->> 'email_verified' as email_verified,
  raw_user_meta_data ->> 'role' as meta_role
from auth.users
order by email;

select count(*) as remaining_mock_hashes
from auth.users
where encrypted_password = 'mock_hash';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Test login
--   admin@school.com / teacher@school.com / student@school.com / parent@school.com
--   Password: password123
-- ═══════════════════════════════════════════════════════════════════════════════
