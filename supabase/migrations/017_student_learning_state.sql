-- Server-authoritative child learning profile (HUD / gamification).
-- Parent-facing reports stay on answers + learning_sessions; this table is child UI sync only.

begin;

create table if not exists public.student_learning_state (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students (id) on delete cascade,
  subjects jsonb not null default '{}'::jsonb,
  monthly jsonb not null default '{}'::jsonb,
  challenges jsonb not null default '{}'::jsonb,
  streaks jsonb not null default '{}'::jsonb,
  achievements jsonb not null default '{}'::jsonb,
  -- profile: small prefs only (e.g. avatar emoji). Do NOT store large base64 images here;
  -- TODO: move custom avatar images to Supabase Storage + URL pointer on students or profile.
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_learning_state_student_id_idx
  on public.student_learning_state (student_id);

-- RLS: table is server-owned. Next.js APIs use the Supabase service role client, which bypasses RLS.
-- We intentionally do NOT add policies for anon/authenticated: the browser must not read/write
-- this table directly (no broad client policies). Same security posture as "only via API + service_role".
alter table public.student_learning_state enable row level security;

drop trigger if exists trg_student_learning_state_set_updated_at on public.student_learning_state;
create trigger trg_student_learning_state_set_updated_at
before update on public.student_learning_state
for each row
execute function public.set_updated_at();

commit;
