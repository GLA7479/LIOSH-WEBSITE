-- Phase Arcade-1: shared arcade tables + idempotent internal coin moves.
-- Prerequisite: students, student_coin_balances, coin_transactions from learning foundation.
-- Does not use vault/settlement/double/wallet_state/participant_key.

begin;

-- ---------------------------------------------------------------------------
-- Coin ledger extensions (non-breaking; 001 may already define source_*/metadata)
-- ---------------------------------------------------------------------------

alter table public.coin_transactions
  add column if not exists balance_after integer;

-- ---------------------------------------------------------------------------
-- Idempotent coin apply (service-role APIs only; SECURITY DEFINER)
-- ---------------------------------------------------------------------------

create or replace function public.arcade_coin_apply(
  p_student_id uuid,
  p_direction text,
  p_amount integer,
  p_idempotency_key text,
  p_source_type text,
  p_source_id text,
  p_metadata jsonb,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id uuid;
  v_existing_balance integer;
  v_balance integer;
  v_new_balance integer;
  v_tx_id uuid;
  v_amount integer := greatest(coalesce(p_amount, 0), 0);
begin
  if p_student_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_student_id', 'code', 'bad_request');
  end if;

  if p_direction is null or p_direction not in ('earn', 'spend') then
    return jsonb_build_object('ok', false, 'error', 'invalid_direction', 'code', 'bad_request');
  end if;

  if v_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount', 'code', 'bad_request');
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select id into v_existing_id
    from public.coin_transactions
    where student_id = p_student_id
      and idempotency_key = p_idempotency_key
    limit 1;

    if v_existing_id is not null then
      select balance into v_existing_balance
      from public.student_coin_balances
      where student_id = p_student_id;

      return jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'transaction_id', v_existing_id,
        'balance_after', coalesce(v_existing_balance, 0)
      );
    end if;
  end if;

  select balance into v_balance
  from public.student_coin_balances
  where student_id = p_student_id
  for update;

  if v_balance is null then
    return jsonb_build_object('ok', false, 'error', 'balance_row_missing', 'code', 'not_found');
  end if;

  if p_direction = 'spend' then
    if v_balance < v_amount then
      return jsonb_build_object('ok', false, 'error', 'insufficient_funds', 'code', 'insufficient_funds', 'balance', v_balance);
    end if;
    v_new_balance := v_balance - v_amount;
  else
    v_new_balance := v_balance + v_amount;
  end if;

  update public.student_coin_balances
  set
    balance = v_new_balance,
    lifetime_spent = case when p_direction = 'spend' then lifetime_spent + v_amount else lifetime_spent end,
    lifetime_earned = case when p_direction = 'earn' then lifetime_earned + v_amount else lifetime_earned end,
    updated_at = now()
  where student_id = p_student_id;

  insert into public.coin_transactions (
    student_id,
    direction,
    amount,
    reason,
    idempotency_key,
    source_type,
    source_id,
    metadata,
    balance_after
  )
  values (
    p_student_id,
    p_direction,
    v_amount,
    coalesce(nullif(trim(p_reason), ''), 'arcade'),
    nullif(trim(p_idempotency_key), ''),
    nullif(trim(p_source_type), ''),
    nullif(trim(p_source_id), ''),
    coalesce(p_metadata, '{}'::jsonb),
    v_new_balance
  )
  returning id into v_tx_id;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'transaction_id', v_tx_id,
    'balance_after', v_new_balance
  );

exception
  when unique_violation then
    select id into v_existing_id
    from public.coin_transactions
    where student_id = p_student_id
      and idempotency_key = nullif(trim(p_idempotency_key), '')
    limit 1;

    select balance into v_existing_balance
    from public.student_coin_balances
    where student_id = p_student_id;

    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'transaction_id', v_existing_id,
      'balance_after', coalesce(v_existing_balance, 0)
    );
end;
$$;

revoke all on function public.arcade_coin_apply(uuid, text, integer, text, text, text, jsonb, text) from public;
grant execute on function public.arcade_coin_apply(uuid, text, integer, text, text, text, jsonb, text) to service_role;

-- ---------------------------------------------------------------------------
-- Arcade tables
-- ---------------------------------------------------------------------------

create table if not exists public.arcade_games (
  id uuid primary key default gen_random_uuid(),
  game_key text not null unique,
  title text not null,
  enabled boolean not null default false,
  foundation_only boolean not null default true,
  min_players int not null default 2,
  max_players int not null default 2,
  supports_quick_match boolean not null default true,
  supports_public_rooms boolean not null default true,
  supports_private_rooms boolean not null default true,
  allowed_entry_costs int[] not null default array[10, 100, 1000, 10000]::int[],
  created_at timestamptz not null default now()
);

create table if not exists public.arcade_rooms (
  id uuid primary key default gen_random_uuid(),
  game_key text not null references public.arcade_games (game_key) on delete restrict,
  host_student_id uuid not null references public.students (id) on delete restrict,
  room_type text not null check (room_type in ('quick', 'public', 'private')),
  entry_cost integer not null check (entry_cost in (10, 100, 1000, 10000)),
  join_code text,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished', 'cancelled')),
  max_players int not null default 2,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create unique index if not exists arcade_rooms_join_code_uidx
  on public.arcade_rooms (join_code)
  where join_code is not null and length(trim(join_code)) > 0;

create index if not exists arcade_rooms_game_status_idx
  on public.arcade_rooms (game_key, status);

create table if not exists public.arcade_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.arcade_rooms (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete restrict,
  seat_index int not null default 0,
  ready_state boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  result text,
  metadata jsonb not null default '{}'::jsonb,
  unique (room_id, student_id)
);

create index if not exists arcade_room_players_room_idx on public.arcade_room_players (room_id);
create index if not exists arcade_room_players_student_idx on public.arcade_room_players (student_id);

create table if not exists public.arcade_quick_match_queue (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  game_key text not null references public.arcade_games (game_key) on delete restrict,
  entry_cost integer not null check (entry_cost in (10, 100, 1000, 10000)),
  status text not null default 'queued' check (status in ('queued', 'matched', 'cancelled', 'expired')),
  matched_room_id uuid references public.arcade_rooms (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists arcade_qm_queue_lookup_idx
  on public.arcade_quick_match_queue (status, game_key, entry_cost, created_at);

create index if not exists arcade_qm_student_status_idx
  on public.arcade_quick_match_queue (student_id, status);

create table if not exists public.arcade_game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.arcade_rooms (id) on delete cascade,
  game_key text not null references public.arcade_games (game_key) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'active', 'finished', 'cancelled')),
  current_turn_student_id uuid references public.students (id) on delete set null,
  state jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create unique index if not exists arcade_game_sessions_room_uidx on public.arcade_game_sessions (room_id);

create table if not exists public.arcade_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.arcade_rooms (id) on delete cascade,
  game_session_id uuid references public.arcade_game_sessions (id) on delete set null,
  student_id uuid not null references public.students (id) on delete restrict,
  result_type text,
  placement int,
  score bigint,
  reward_amount integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists arcade_results_room_idx on public.arcade_results (room_id);
create index if not exists arcade_results_student_idx on public.arcade_results (student_id);

-- ---------------------------------------------------------------------------
-- Seed games (foundation only — disabled until a game is wired)
-- ---------------------------------------------------------------------------

insert into public.arcade_games (
  game_key, title, enabled, foundation_only, min_players, max_players,
  supports_quick_match, supports_public_rooms, supports_private_rooms, allowed_entry_costs
) values
  ('fourline', 'Four in a Row', false, true, 2, 2, true, true, true, array[10,100,1000,10000]::int[]),
  ('checkers', 'Checkers', false, true, 2, 2, true, true, true, array[10,100,1000,10000]::int[]),
  ('chess', 'Chess', false, true, 2, 2, true, true, true, array[10,100,1000,10000]::int[]),
  ('snakes-and-ladders', 'Snakes and Ladders', false, true, 2, 4, true, true, true, array[10,100,1000,10000]::int[]),
  ('dominoes', 'Dominoes', false, true, 2, 4, true, true, true, array[10,100,1000,10000]::int[]),
  ('bingo', 'Bingo', false, true, 2, 8, true, true, true, array[10,100,1000,10000]::int[]),
  ('ludo', 'Ludo', false, true, 2, 4, true, true, true, array[10,100,1000,10000]::int[])
on conflict (game_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS (API uses service role; direct client access remains blocked)
-- ---------------------------------------------------------------------------

alter table public.arcade_games enable row level security;
alter table public.arcade_rooms enable row level security;
alter table public.arcade_room_players enable row level security;
alter table public.arcade_quick_match_queue enable row level security;
alter table public.arcade_game_sessions enable row level security;
alter table public.arcade_results enable row level security;

commit;
