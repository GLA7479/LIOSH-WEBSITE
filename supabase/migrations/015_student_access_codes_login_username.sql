begin;

alter table public.student_access_codes
  add column if not exists login_username text;

comment on column public.student_access_codes.login_username is
  'Normalized student login username for parent UI; verification remains via code_hash.';

drop policy if exists student_access_codes_parent_select_owned on public.student_access_codes;

commit;
