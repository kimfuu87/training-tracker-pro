create or replace function private.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select (select auth.uid()) is not null and (
    exists (select 1 from public.organization_members om where om.organization_id=target_org and om.user_id=(select auth.uid()) and om.status='active')
    or exists (select 1 from public.ttp_user_access ua where ua.organization_id=target_org and ua.user_id=(select auth.uid()) and ua.active)
  );
$$;

create or replace function private.is_training_admin(target_org uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select private.is_platform_admin()
    or private.has_org_role(target_org,array['organization_admin','training_admin']::text[])
    or exists (select 1 from public.ttp_user_access ua where ua.organization_id=target_org and ua.user_id=(select auth.uid()) and ua.active and ua.role in ('super_admin','training_admin'));
$$;

create or replace function private.training_can_manage_department(p_org uuid,p_department uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select private.is_training_admin(p_org)
    or exists (select 1 from public.organization_members om join public.member_departments md on md.organization_member_id=om.id where om.organization_id=p_org and om.user_id=(select auth.uid()) and om.status='active' and om.role='manager' and md.department_id=p_department)
    or exists (select 1 from public.ttp_user_access ua join public.ttp_hod_departments hd on hd.user_id=ua.user_id where ua.organization_id=p_org and ua.user_id=(select auth.uid()) and ua.active and ua.role='hod' and hd.department_id=p_department);
$$;

create or replace function private.training_can_view_department(p_org uuid,p_department uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select private.training_can_manage_department(p_org,p_department); $$;

create or replace function private.training_can_view_roster(p_org uuid,p_roster uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select private.is_training_admin(p_org)
    or exists (select 1 from public.staff_roster sr where sr.id=p_roster and sr.organization_id=p_org and sr.linked_user_id=(select auth.uid()))
    or exists (select 1 from public.ttp_user_access ua where ua.organization_id=p_org and ua.user_id=(select auth.uid()) and ua.active and ua.staff_roster_id=p_roster)
    or exists (select 1 from public.staff_roster sr join public.organization_members om on om.organization_id=sr.organization_id and om.user_id=(select auth.uid()) and om.status='active' and om.role='manager' join public.member_departments md on md.organization_member_id=om.id and md.department_id=sr.department_id where sr.id=p_roster and sr.organization_id=p_org)
    or exists (select 1 from public.staff_roster sr join public.ttp_user_access ua on ua.organization_id=sr.organization_id and ua.user_id=(select auth.uid()) and ua.active and ua.role='hod' join public.ttp_hod_departments hd on hd.user_id=ua.user_id and hd.department_id=sr.department_id where sr.id=p_roster and sr.organization_id=p_org);
$$;

create or replace function private.is_room_admin(target_org uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select private.is_platform_admin()
    or private.has_org_role(target_org,array['organization_admin']::text[])
    or exists (select 1 from public.ttp_user_access ua where ua.organization_id=target_org and ua.user_id=(select auth.uid()) and ua.active and ua.role in ('super_admin','training_admin','hod'))
    or exists (select 1 from public.room_booking_admins rba join public.organization_members om on om.id=rba.organization_member_id and om.organization_id=rba.organization_id where rba.organization_id=target_org and om.user_id=(select auth.uid()) and om.status='active');
$$;
