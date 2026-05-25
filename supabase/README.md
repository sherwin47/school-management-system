# Supabase setup — Campus OS

## 1. Apply schema

In the [Supabase SQL Editor](https://supabase.com/dashboard), run migrations in order:

1. `migrations/001_operational_schema.sql` — **safe to re-run** if `profiles` or other objects already exist
2. `seed.sql` (optional demo rows)

Or with the CLI: `supabase db push`

### Already have `public.profiles` or `public.attendance_logs`?

That is normal (Supabase starter / prior setup). Migrations use `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`. Legacy `attendance_logs.date` is renamed to `session_date` automatically.

If `001` failed on `session_date`, run `002_fix_attendance_logs_columns.sql` first, then re-run `001`.

## 2. Create auth users

In **Authentication → Users**, create users (e.g. `admin@school.com`) with passwords.

If seeded users show **Invalid login credentials** (`encrypted_password = 'mock_hash'`), run:

`supabase/fix_auth_passwords_supabase_editor.sql` in the SQL Editor, then sign in with **password123**.

The `on_auth_user_created` trigger inserts a `public.profiles` row. Set roles explicitly:

```sql
update public.profiles
set role = 'admin', full_name = 'Priya Menon', subtitle = 'Principal'
where email = 'admin@school.com';

update public.profiles set role = 'teacher', full_name = 'Anita Iyer' where email = 'teacher@school.com';
update public.profiles set role = 'student', full_name = 'Aarav Sharma' where email = 'student@school.com';
update public.profiles set role = 'parent', full_name = 'Ramesh Sharma' where email = 'parent@school.com';
```

Supported roles (`profiles_role_check`): `admin`, `teacher`, `parent`, `student`.

Frontend canonical IDs live in `src/lib/demo-ids.ts` (prefixes: `f10` classes, `b00` subjects, `d00` invoices, `001` exams, `aa10` hostel, `cc10` transport, `bb10` library, `a10` students).

## 3. Frontend environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Realtime (optional)

Enable Realtime for `hostel_rooms`, `transport_routes`, `attendance_logs` in **Database → Replication** when wiring live UI updates.
