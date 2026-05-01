-- Phase 1 foundation for LIOSH learning site only.
-- No games schema in this migration.

begin;

create extension if not exists pgcrypto;

create table if not exists public.parent_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_profiles (id) on delete cascade,
  full_name text not null,
  grade_level text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_access_codes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  code_hash text not null,
  pin_hash text not null,
  is_active boolean not null default true,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  access_code_id uuid references public.student_access_codes (id) on delete set null,
  session_token_hash text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  client_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  subject text,
  topic text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  learning_session_id uuid references public.learning_sessions (id) on delete set null,
  question_id text not null,
  answer_payload jsonb not null default '{}'::jsonb,
  is_correct boolean,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.parent_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  report_type text not null,
  report_payload jsonb not null default '{}'::jsonb,
  source_range jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_coin_balances (
  student_id uuid primary key references public.students (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  direction text not null check (direction in ('earn', 'spend', 'adjust', 'reversal')),
  amount integer not null check (amount > 0),
  reason text not null,
  source_type text,
  source_id text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  constraint coin_transactions_student_idempotency_unique unique (student_id, idempotency_key)
);

create table if not exists public.coin_reward_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  enabled boolean not null default true,
  subject text,
  event_type text not null,
  amount integer not null check (amount > 0),
  daily_cap integer check (daily_cap is null or daily_cap >= 0),
  cooldown_seconds integer check (cooldown_seconds is null or cooldown_seconds >= 0),
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coin_spend_rules (
  id uuid primary key default gen_random_uuid(),
  spend_key text not null unique,
  enabled boolean not null default true,
  target_type text not null,
  amount integer not null check (amount > 0),
  daily_cap integer check (daily_cap is null or daily_cap >= 0),
  requires_parent_approval boolean not null default false,
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,
  name text not null,
  description text not null default '',
  category text not null default 'general',
  price integer not null check (price >= 0),
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_inventory (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  shop_item_id uuid not null references public.shop_items (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  acquired_at timestamptz not null default now(),
  source_transaction_id uuid references public.coin_transactions (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint student_inventory_student_item_unique unique (student_id, shop_item_id)
);

create index if not exists students_parent_id_idx on public.students (parent_id);
create index if not exists student_access_codes_student_id_idx on public.student_access_codes (student_id);
create index if not exists student_sessions_student_id_idx on public.student_sessions (student_id);
create index if not exists learning_sessions_student_id_idx on public.learning_sessions (student_id);
create index if not exists answers_student_id_idx on public.answers (student_id);
create index if not exists answers_learning_session_id_idx on public.answers (learning_session_id);
create index if not exists parent_reports_student_id_idx on public.parent_reports (student_id);
create index if not exists coin_transactions_student_id_idx on public.coin_transactions (student_id);
create index if not exists coin_transactions_created_at_idx on public.coin_transactions (created_at desc);
create index if not exists student_inventory_student_id_idx on public.student_inventory (student_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_parent_profiles_set_updated_at on public.parent_profiles;
create trigger trg_parent_profiles_set_updated_at
before update on public.parent_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_students_set_updated_at on public.students;
create trigger trg_students_set_updated_at
before update on public.students
for each row
execute function public.set_updated_at();

drop trigger if exists trg_student_access_codes_set_updated_at on public.student_access_codes;
create trigger trg_student_access_codes_set_updated_at
before update on public.student_access_codes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_learning_sessions_set_updated_at on public.learning_sessions;
create trigger trg_learning_sessions_set_updated_at
before update on public.learning_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists trg_parent_reports_set_updated_at on public.parent_reports;
create trigger trg_parent_reports_set_updated_at
before update on public.parent_reports
for each row
execute function public.set_updated_at();

drop trigger if exists trg_student_coin_balances_set_updated_at on public.student_coin_balances;
create trigger trg_student_coin_balances_set_updated_at
before update on public.student_coin_balances
for each row
execute function public.set_updated_at();

drop trigger if exists trg_coin_reward_rules_set_updated_at on public.coin_reward_rules;
create trigger trg_coin_reward_rules_set_updated_at
before update on public.coin_reward_rules
for each row
execute function public.set_updated_at();

drop trigger if exists trg_coin_spend_rules_set_updated_at on public.coin_spend_rules;
create trigger trg_coin_spend_rules_set_updated_at
before update on public.coin_spend_rules
for each row
execute function public.set_updated_at();

drop trigger if exists trg_shop_items_set_updated_at on public.shop_items;
create trigger trg_shop_items_set_updated_at
before update on public.shop_items
for each row
execute function public.set_updated_at();

create or replace function public.handle_parent_profile_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.parent_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_parent_profile_created() from public;
grant execute on function public.handle_parent_profile_created() to service_role;

drop trigger if exists on_auth_user_created_parent_profile on auth.users;
create trigger on_auth_user_created_parent_profile
after insert on auth.users
for each row
execute function public.handle_parent_profile_created();

alter table public.parent_profiles enable row level security;
alter table public.students enable row level security;
alter table public.student_access_codes enable row level security;
alter table public.student_sessions enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.answers enable row level security;
alter table public.parent_reports enable row level security;
alter table public.student_coin_balances enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.coin_reward_rules enable row level security;
alter table public.coin_spend_rules enable row level security;
alter table public.shop_items enable row level security;
alter table public.student_inventory enable row level security;

drop policy if exists parent_profiles_select_own on public.parent_profiles;
create policy parent_profiles_select_own
on public.parent_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists parent_profiles_update_own on public.parent_profiles;
create policy parent_profiles_update_own
on public.parent_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists parent_profiles_insert_own on public.parent_profiles;
create policy parent_profiles_insert_own
on public.parent_profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists students_parent_full_access on public.students;
create policy students_parent_full_access
on public.students
for all
to authenticated
using (parent_id = auth.uid())
with check (parent_id = auth.uid());

drop policy if exists student_access_codes_parent_full_access on public.student_access_codes;
drop policy if exists student_access_codes_parent_insert_owned on public.student_access_codes;
drop policy if exists student_access_codes_parent_update_owned on public.student_access_codes;
drop policy if exists student_access_codes_parent_delete_owned on public.student_access_codes;
create policy student_access_codes_parent_insert_owned
on public.student_access_codes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.students s
    where s.id = student_access_codes.student_id
      and s.parent_id = auth.uid()
  )
);

create policy student_access_codes_parent_update_owned
on public.student_access_codes
for update
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_access_codes.student_id
      and s.parent_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = student_access_codes.student_id
      and s.parent_id = auth.uid()
  )
);

create policy student_access_codes_parent_delete_owned
on public.student_access_codes
for delete
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_access_codes.student_id
      and s.parent_id = auth.uid()
  )
);

drop policy if exists student_sessions_parent_read_owned on public.student_sessions;

drop policy if exists learning_sessions_parent_read_owned on public.learning_sessions;
create policy learning_sessions_parent_read_owned
on public.learning_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = learning_sessions.student_id
      and s.parent_id = auth.uid()
  )
);

drop policy if exists answers_parent_read_owned on public.answers;
create policy answers_parent_read_owned
on public.answers
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = answers.student_id
      and s.parent_id = auth.uid()
  )
);

drop policy if exists parent_reports_parent_read_owned on public.parent_reports;
create policy parent_reports_parent_read_owned
on public.parent_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = parent_reports.student_id
      and s.parent_id = auth.uid()
  )
);

drop policy if exists student_coin_balances_parent_read_owned on public.student_coin_balances;
create policy student_coin_balances_parent_read_owned
on public.student_coin_balances
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_coin_balances.student_id
      and s.parent_id = auth.uid()
  )
);

drop policy if exists coin_transactions_parent_read_owned on public.coin_transactions;
create policy coin_transactions_parent_read_owned
on public.coin_transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = coin_transactions.student_id
      and s.parent_id = auth.uid()
  )
);

drop policy if exists coin_reward_rules_read_enabled on public.coin_reward_rules;
create policy coin_reward_rules_read_enabled
on public.coin_reward_rules
for select
to authenticated
using (enabled = true);

drop policy if exists coin_spend_rules_read_enabled on public.coin_spend_rules;
create policy coin_spend_rules_read_enabled
on public.coin_spend_rules
for select
to authenticated
using (enabled = true);

drop policy if exists shop_items_read_enabled on public.shop_items;
create policy shop_items_read_enabled
on public.shop_items
for select
to authenticated
using (enabled = true);

drop policy if exists student_inventory_parent_read_owned on public.student_inventory;
create policy student_inventory_parent_read_owned
on public.student_inventory
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_inventory.student_id
      and s.parent_id = auth.uid()
  )
);

commit;
