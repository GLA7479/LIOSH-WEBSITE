-- Phase 2B support: explicit revocation + expiry fields for student sessions.
-- Do not expose tokens; API stores only session_token_hash.

begin;

alter table public.student_sessions
  add column if not exists revoked_at timestamptz,
  add column if not exists expires_at timestamptz;

-- Backfill existing rows with a reasonable default expiry if missing.
update public.student_sessions
set expires_at = coalesce(expires_at, created_at + interval '7 days')
where expires_at is null;

create index if not exists student_sessions_session_token_hash_idx
  on public.student_sessions (session_token_hash);

create index if not exists student_sessions_active_lookup_idx
  on public.student_sessions (student_id, expires_at)
  where ended_at is null and revoked_at is null;

commit;

