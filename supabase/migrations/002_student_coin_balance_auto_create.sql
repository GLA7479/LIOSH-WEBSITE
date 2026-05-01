-- Phase 2A follow-up: ensure every student always has a coin balance row.
-- Safe to run once after 001_learning_core_foundation.sql.

begin;

create or replace function public.handle_student_coin_balance_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_coin_balances (
    student_id,
    balance,
    lifetime_earned,
    lifetime_spent
  )
  values (
    new.id,
    0,
    0,
    0
  )
  on conflict (student_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_student_coin_balance_created() from public;
grant execute on function public.handle_student_coin_balance_created() to service_role;

drop trigger if exists trg_students_coin_balance_created on public.students;
create trigger trg_students_coin_balance_created
after insert on public.students
for each row
execute function public.handle_student_coin_balance_created();

-- Backfill existing students that are missing a balance row.
insert into public.student_coin_balances (
  student_id,
  balance,
  lifetime_earned,
  lifetime_spent
)
select
  s.id,
  0,
  0,
  0
from public.students s
left join public.student_coin_balances b
  on b.student_id = s.id
where b.student_id is null;

commit;
