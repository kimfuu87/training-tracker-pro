create or replace function private.ttp_protect_lms_assignment_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select c.organization_id into v_org
  from public.lms_courses c
  where c.id = old.course_id;

  if private.is_training_admin(v_org) then
    return new;
  end if;

  if not exists (
    select 1 from public.staff_roster sr
    where sr.id = old.staff_roster_id
      and (sr.linked_user_id = (select auth.uid()) or exists (
        select 1 from public.ttp_user_access ua
        where ua.user_id = (select auth.uid())
          and ua.staff_roster_id = sr.id
          and ua.active
      ))
  ) then
    raise exception 'Not authorised';
  end if;

  if new.course_id is distinct from old.course_id
     or new.staff_roster_id is distinct from old.staff_roster_id
     or new.assigned_by_user_id is distinct from old.assigned_by_user_id
     or new.due_date is distinct from old.due_date
     or new.verified_at is distinct from old.verified_at
     or new.verified_by_user_id is distinct from old.verified_by_user_id then
    raise exception 'Staff may only update their own learning progress';
  end if;

  if new.status not in ('assigned', 'in_progress', 'completed')
     or new.progress < 0 or new.progress > 100 then
    raise exception 'Invalid learning progress';
  end if;

  return new;
end;
$$;

revoke all on function private.ttp_protect_lms_assignment_verification() from public;

drop trigger if exists ttp_protect_lms_assignment_verification on public.lms_assignments;
create trigger ttp_protect_lms_assignment_verification
before update on public.lms_assignments
for each row execute function private.ttp_protect_lms_assignment_verification();
