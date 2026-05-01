# Phase 1 Supabase Foundation Report

Date: 2026-05-01

## Scope Implemented

Phase 1 foundation was implemented for the learning site only:

- New learning-specific Supabase helpers under `lib/learning-supabase/`
- New migration `supabase/migrations/001_learning_core_foundation.sql`
- New verification script `scripts/verify-learning-supabase-env.mjs`
- Learning-specific env names added to `.env.example`

Not implemented in this phase:

- No games work
- No game tables
- No Snakes/Ludo/online-v2 work
- No MLEO migrations/files/logic reuse
- No UI design changes
- No learning engine changes
- No report logic changes

## Learning-Specific Environment Variables

Required env names:

```env
NEXT_PUBLIC_LEARNING_SUPABASE_URL=https://ajxwmlwbzxwffrtlfuoe.supabase.co
NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY=
LEARNING_SUPABASE_SERVICE_ROLE_KEY=
```

Security rules:

- `NEXT_PUBLIC_LEARNING_SUPABASE_URL` is public.
- `NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY` is public.
- `LEARNING_SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be used in browser code.

## Database Tables Added

The migration defines:

- `parent_profiles`
- `students`
- `student_access_codes`
- `student_sessions`
- `learning_sessions`
- `answers`
- `parent_reports`
- `student_coin_balances`
- `coin_transactions`
- `coin_reward_rules`
- `coin_spend_rules`
- `shop_items`
- `student_inventory`

No game tables are included.

## RLS Summary

RLS is enabled on every table above.

Policies included:

- Parent profile: read/update own row only (`id = auth.uid()`), insert own row.
- Students: parent full access only to rows where `students.parent_id = auth.uid()`.
- Student access codes: parent full access only for owned students.
- Student sessions: parent read only for owned students.
- Learning sessions: parent read only for owned students.
- Answers: parent read only for owned students.
- Parent reports: parent read only for owned students.
- Coin balances: parent read only for owned students.
- Coin transactions: parent read only for owned students.
- Reward/spend rules + shop items: authenticated read of enabled rows only.
- Student inventory: parent read only for owned students.

No broad student direct access policies were added.
No client mutation policies were added for `student_coin_balances` or `coin_transactions`.

## Auth Bootstrap

Added `public.handle_parent_profile_created()` trigger function:

- Trigger fires on `auth.users` insert.
- Creates matching `public.parent_profiles` row with same `id`.
- Uses `security definer`.
- Does not rely on user-editable metadata for authorization.

## Apply Instructions (Supabase SQL Editor)

1. Open the new learning Supabase project:
   - `https://ajxwmlwbzxwffrtlfuoe.supabase.co`
2. Open SQL Editor.
3. Paste and run `supabase/migrations/001_learning_core_foundation.sql`.
4. Confirm tables and policies exist in Table Editor and Policies UI.

## Verification Script

Run:

```bash
npm run verify:learning-supabase-env
```

The script checks:

- Required learning env vars exist.
- URL matches the new learning Supabase host.
- Migration file exists.
- Service role env name is not used in browser/client surfaces.
- No banned MLEO/legacy Supabase env names were introduced in `.env*` files.
