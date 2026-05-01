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
- Student access codes: parent **insert/update/delete** for owned students only; **no SELECT policy** (raw hashes not exposed via PostgREST).
- Student sessions: no `SELECT` policy for `authenticated` in Phase 1 (raw session data not exposed to the parent client).
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

## Phase 1B Verification Additions

- Added server-side health route: `pages/api/learning-supabase/health.js`
- Route is server-only and uses `getLearningSupabaseServerClient()` (anon key path, no service role usage).
- Route checks reachability of all Phase 1 tables and returns safe status only:
  - `ok`
  - fixed `service` name
  - fixed `projectHost`
  - per-table `ok` and `errorCode`
  - `checkedAt`
- Route returns no secrets and no env key values.

## Minimal Auth Verification Plan (No UI Build Yet)

1. Create one test parent user in Supabase Auth:
   - Supabase Dashboard -> Authentication -> Users -> Add user
   - Use email/password for a dedicated test parent account
2. Confirm trigger-created profile:
   - Query `public.parent_profiles`
   - Verify a row exists with `id = auth.users.id` for the test parent
3. Add one test student:
   - Option A: SQL editor insert into `public.students` with `parent_id = <test_parent_id>`
   - Option B: safe server script later (not added in this step)
4. Verify ownership behavior:
   - Confirm the student row references the test parent in `students.parent_id`
   - Confirm RLS policies are present as expected
5. Optional follow-up:
   - Add a safe read-only server route/view later for parent-facing status fields that excludes sensitive hashes

## Phase 1C — RLS verification script

Script: `scripts/verify-learning-rls.mjs`

Run (from `LIOSH-WEB-TRY`):

```bash
npm run verify:learning-rls
```

Or:

```bash
node scripts/verify-learning-rls.mjs
```

**Always runs:** anon-key checks — every private Phase 1 table plus `coin_reward_rules`, `coin_spend_rules`, and `shop_items` must return **no rows** without authentication.

**Authenticated checks** run only if you set **either**:

1. **Manual (non-destructive):** two existing parent accounts  
   - `LEARNING_RLS_PARENT_A_EMAIL`, `LEARNING_RLS_PARENT_A_PASSWORD`  
   - `LEARNING_RLS_PARENT_B_EMAIL`, `LEARNING_RLS_PARENT_B_PASSWORD`  
   Each parent must already have at least one student row. Coin balance assertions run only if a balance row already exists (otherwise a WARN and skip).

2. **Auto-setup:** `LEARNING_RLS_AUTO_SETUP=1` and `LEARNING_SUPABASE_SERVICE_ROLE_KEY`  
   Creates two Auth users with email prefix `rls-verify-`, inserts test students, inserts a `student_access_codes` row to prove **SELECT still returns nothing**, seeds `student_coin_balances` via service role, runs checks, then **deletes only** those Auth users if cleanup succeeds (orphan app rows may remain unless you add DB cleanup; Auth users are removed by id).

**Never printed:** API keys or service role secrets.

**Required env:** `NEXT_PUBLIC_LEARNING_SUPABASE_URL`, `NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY` (same as Phase 1).

**What the script checks (authenticated path):**

- Each parent can read only **own** `parent_profiles` row; cannot read the other parent’s profile by id.
- Each parent sees **own** students; cannot `SELECT` the other parent’s student by id.
- Parent cannot `SELECT` rows from `student_access_codes` (even after inserting in auto-setup).
- Parent cannot `SELECT` `student_sessions`.
- Parent can read **own** student’s `student_coin_balances` when a row exists (auto-setup seeds one).
- Client **insert** into `student_coin_balances` and **update** on owned balance **rejected**.
- Client **insert** into `coin_transactions` **rejected**.
