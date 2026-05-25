-- ═══════════════════════════════════════════════════════════════════════════════
-- Fix Invalid Login Credentials for Seeded Auth Users
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script:
-- 1. Generates a valid Bcrypt hash for password: 'password123'
-- 2. Replaces 'mock_hash' with the encrypted password in auth.users
-- 3. Marks all seeded accounts as email_confirmed
-- 4. Configures raw_app_meta_data and raw_user_meta_data for proper recognition
--
-- ⚠️  WARNING: This will update ALL users with 'mock_hash' encrypted_password.
--     Run only once or after verifying which users need fixing.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure pgcrypto extension is available
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Generate Bcrypt hash for 'password123'
-- Using pgcrypto's crypt() with bcrypt algorithm (cost factor 10, compatible with Supabase)
-- ─────────────────────────────────────────────────────────────────────────────

-- Store the hash in a temporary variable (PostgreSQL session variable)
select crypt('password123', gen_salt('bf', 10)) as password_hash \gset

-- Display the generated hash for verification (remove if not needed)
-- select 'Generated Bcrypt hash:' as message, :'password_hash' as hash;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Update auth.users table
-- Replace 'mock_hash' with valid Bcrypt hash and configure metadata
-- ─────────────────────────────────────────────────────────────────────────────

update auth.users
set
  -- Replace plain-text 'mock_hash' with valid Bcrypt hash
  encrypted_password = :'password_hash',
  
  -- Mark email as confirmed (required for Supabase Auth to recognize the account)
  email_confirmed_at = now(),
  
  -- Configure raw_app_meta_data for role-based access control (RBAC)
  raw_app_meta_data = jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email')
  ),
  
  -- Configure raw_user_meta_data for user profile information
  raw_user_meta_data = jsonb_build_object(
    'email_verified', true,
    'email_confirmed', true,
    'is_sso_user', false
  ),
  
  -- Ensure the user is not banned
  banned_until = null,
  
  -- Update modification timestamp
  updated_at = now()
  
where
  -- Target only users with placeholder 'mock_hash' (those that need fixing)
  encrypted_password = 'mock_hash'
  -- Optional: Uncomment to target specific roles
  -- and role = 'authenticated'
;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Verify the update
-- ─────────────────────────────────────────────────────────────────────────────

-- Show updated users summary
select 
  id,
  email,
  email_confirmed_at,
  (raw_app_meta_data ->> 'provider') as provider,
  (raw_user_meta_data ->> 'email_verified')::boolean as email_verified
from auth.users
where email_confirmed_at is not null
  and encrypted_password != 'mock_hash'
order by created_at;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Sync profiles with updated auth data (if needed)
-- Uncomment if you need to ensure public.profiles is aligned
-- ─────────────────────────────────────────────────────────────────────────────

-- update public.profiles
-- set updated_at = now()
-- where id in (
--   select id from auth.users
--   where email_confirmed_at is not null
--     and encrypted_password != 'mock_hash'
-- );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔐 Test Login Credentials
-- ═══════════════════════════════════════════════════════════════════════════════
-- After running this script, you can authenticate with:
--
--   Email: admin@school.com (or any seeded user email)
--   Password: password123
--
-- Make sure to change passwords in production! 🔑
-- ═══════════════════════════════════════════════════════════════════════════════
