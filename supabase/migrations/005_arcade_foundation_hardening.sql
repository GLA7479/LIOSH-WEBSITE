-- Phase Arcade-1B: hardening (run after 004_arcade_foundation.sql).
-- Safer coin idempotency, balance row bootstrap, queue + active-player constraints.

begin;

-- ---------------------------------------------------------------------------
-- arcade_room_players: allow rejoin after leave — partial uniques for active rows only
-- ---------------------------------------------------------------------------

alter table public.arcade_room_players
  drop constraint if exists arcade_room_players_room_id_student_id_key;

-- legacy alternate name (if created differently)
alter table public.arcade_room_players
  drop constraint if exists arcade_room_players_room_id_student_id_unique;

create unique index if not exists arcade_room_players_active_student_uidx
  on public.arcade_room_players (room_id, student_id)
  where left_at is null;

create unique index if not exists arcade_room_players_active_seat_uidx
  on public.arcade_room_players (room_id, seat_index)
  where left_at is null;

-- ---------------------------------------------------------------------------
-- At most one queued quick-match row per student
-- ---------------------------------------------------------------------------

create unique index if not exists arcade_qm_one_queued_per_student_uidx
  on public.arcade_quick_match_queue (student_id)
  where status = 'queued';

-- ---------------------------------------------------------------------------
-- arcade_coin_apply: normalize idempotency, ensure balance row, duplicate uses ledger balance_after
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
  v_idempotency_key text;
  v_existing_id uuid;
  v_dup_balance_after integer;
  v_balance integer;
  v_new_balance integer;
  v_tx_id uuid;
  v_amount integer := greatest(coalesce(p_amount, 0), 0);
  v_cur_balance integer;
begin
  v_idempotency_key := nullif(trim(coalesce(p_idempotency_key, '')), '');

  if p_student_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_student_id', 'code', 'bad_request');
  end if;

  if p_direction is null or p_direction not in ('earn', 'spend') then
    return jsonb_build_object('ok', false, 'error', 'invalid_direction', 'code', 'bad_request');
  end if;

  if v_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount', 'code', 'bad_request');
  end if;

  insert into public.student_coin_balances (student_id, balance, lifetime_earned, lifetime_spent)
  values (p_student_id, 0, 0, 0)
  on conflict (student_id) do nothing;

  if v_idempotency_key is not null then
    select id, balance_after
    into v_existing_id, v_dup_balance_after
    from public.coin_transactions
    where student_id = p_student_id
      and idempotency_key = v_idempotency_key
    limit 1;

    if v_existing_id is not null then
      return jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'transaction_id', v_existing_id,
        'balance_after', coalesce(
          v_dup_balance_after,
          (select balance from public.student_coin_balances where student_id = p_student_id)
        )
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
    v_idempotency_key,
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
    select id, balance_after
    into v_existing_id, v_dup_balance_after
    from public.coin_transactions
    where student_id = p_student_id
      and idempotency_key = v_idempotency_key
    limit 1;

    select balance into v_cur_balance
    from public.student_coin_balances
    where student_id = p_student_id;

    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'transaction_id', v_existing_id,
      'balance_after', coalesce(v_dup_balance_after, v_cur_balance)
    );
end;
$$;

revoke all on function public.arcade_coin_apply(uuid, text, integer, text, text, text, jsonb, text) from public;
grant execute on function public.arcade_coin_apply(uuid, text, integer, text, text, text, jsonb, text) to service_role;

commit;
