# Fixing Seeded Auth Users - Implementation Guide

## Problem Summary
Your seeded users (`admin@school.com`, `teacher@school.com`, `student@school.com`, `parent@school.com`) have placeholder encrypted passwords (`mock_hash`) instead of valid Bcrypt hashes, causing "Invalid login credentials" errors.

## Solution Overview
These scripts use PostgreSQL's **`pgcrypto`** extension (already enabled in your migrations) to:
1. Generate a valid Bcrypt hash for `password123`
2. Update all seeded users in `auth.users` table
3. Mark emails as confirmed for Supabase Auth recognition
4. Configure metadata for proper RBAC and user verification

---

## Which Script to Use?

### ✅ **Use this one: `fix_auth_passwords_supabase_editor.sql`**
- Works directly in Supabase's SQL Editor (no special client syntax)
- Computes hash inline in the UPDATE query
- **Recommended for most users**

### Alternative: `fix_auth_passwords.sql`
- Uses psql client-side variables (`\gset`)
- Works in psql terminal clients
- Skip this unless you're running via command-line PostgreSQL

---

## How to Run in Supabase SQL Editor

1. **Open Supabase Dashboard**
   - Go to your project → SQL Editor

2. **Paste the script**
   - Copy contents of `fix_auth_passwords_supabase_editor.sql`
   - Paste into the SQL Editor

3. **Execute**
   - Click "Run" button (or Cmd/Ctrl + Enter)
   - You'll see results showing updated users

4. **Verify the update**
   - The script outputs a summary table
   - Confirms `email_confirmed_at` is set to now()
   - Verifies metadata is properly configured

---

## What Each Query Does

### Extension Setup
```sql
create extension if not exists pgcrypto;
```
Ensures the cryptographic functions are available.

### Password Hash Generation
```sql
encrypted_password = crypt('password123', gen_salt('bf', 10))
```
- Uses **bcrypt** algorithm (`'bf'`)
- Cost factor of **10** (Supabase-compatible)
- Generates a new random salt each time (security best practice)
- Output format: `$2a$10$...` (standard bcrypt format)

### Email Confirmation
```sql
email_confirmed_at = now()
```
Marks emails as confirmed so Supabase Auth recognizes them as fully setup accounts.

### Metadata Configuration

**`raw_app_meta_data`** (Provider information):
```json
{
  "provider": "email",
  "providers": ["email"]
}
```
- Identifies the authentication provider
- Supabase uses this for multi-provider scenarios

**`raw_user_meta_data`** (User verification status):
```json
{
  "email_verified": true,
  "email_confirmed": true,
  "is_sso_user": false
}
```
- Flags the account as verified
- Signals it's not an SSO-only account

---

## Test Your Fix

After running the script, you can authenticate with:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@school.com` | `password123` |
| Teacher | `teacher@school.com` | `password123` |
| Student | `student@school.com` | `password123` |
| Parent | `parent@school.com` | `password123` |

---

## Security Notes ⚠️

### Before Production:
1. **Change passwords immediately**
   - These are demo credentials only
   - Use your application's password change flow or admin panel

2. **Never commit plain-text passwords**
   - Keep `password123` in documentation only for setup
   - Remove from comments before deploying to production

3. **Consider role-based permissions**
   - Even with correct passwords, verify Supabase RLS policies are configured
   - Check `public.profiles` role assignments match intended access

### Hash Format Details
- **Algorithm**: bcrypt (`$2a$`)
- **Cost**: 10 (balance between security and performance)
- **Salt**: Randomly generated per execution
- **Compatible with**: Supabase Auth, standard PostgreSQL

---

## Troubleshooting

### "Invalid login credentials" still happening?
1. ✓ Confirm script ran successfully (check verification output)
2. ✓ Refresh browser/app cache
3. ✓ Check `auth.users` directly:
   ```sql
   select email, email_confirmed_at, encrypted_password 
   from auth.users 
   where email like '%school.com%';
   ```

### Script didn't update any users?
- No users have `encrypted_password = 'mock_hash'`
- Either already fixed or your users have different placeholder values
- Check actual encrypted_password values:
  ```sql
  select distinct encrypted_password from auth.users;
  ```

### Verification queries showing wrong format?
- If password hash doesn't start with `$2a$`, regenerate manually
- Run the UPDATE query again (generates new hash with new salt)

---

## Files Created

- **`fix_auth_passwords_supabase_editor.sql`** — Primary script (use this)
- **`fix_auth_passwords.sql`** — Alternative psql version
- **`AUTH_FIX_GUIDE.md`** — This documentation file

---

## Next Steps

After fixing authentication:

1. Test login with each role in your frontend
2. Verify role-based access works (student ≠ admin features)
3. Set up password policies for production accounts
4. Document any custom authentication requirements
5. Consider implementing password reset flow for real users

---

For more on Supabase Auth configuration, see:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [PostgreSQL pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
