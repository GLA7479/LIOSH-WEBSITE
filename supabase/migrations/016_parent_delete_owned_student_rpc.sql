-- Permanent delete of a student owned by auth.uid(), including arcade rows that reference
-- students with ON DELETE RESTRICT. Learning/coins/inventory cascade when students row is deleted.

begin;

create or replace function public.delete_parent_owned_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_student_id is null then
    raise exception 'DELETE_STUDENT_MISSING_ID';
  end if;

  if not exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and s.parent_id = auth.uid()
  ) then
    raise exception 'DELETE_STUDENT_NOT_OWNED';
  end if;

  delete from public.arcade_results where student_id = p_student_id;
  delete from public.arcade_room_players where student_id = p_student_id;
  delete from public.arcade_rooms where host_student_id = p_student_id;
  delete from public.arcade_quick_match_queue where student_id = p_student_id;

  delete from public.students where id = p_student_id;
end;
$$;

comment on function public.delete_parent_owned_student(uuid) is
  'Deletes one student and dependent data; arcade cleanup before students FK restrict. Caller must be the owning parent (auth.uid()).';

revoke all on function public.delete_parent_owned_student(uuid) from public;
grant execute on function public.delete_parent_owned_student(uuid) to authenticated;

commit;
