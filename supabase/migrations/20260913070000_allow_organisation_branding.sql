drop policy if exists organizations_member_read on public.organizations;
create policy organizations_member_read on public.organizations
for select to authenticated
using (private.is_org_member(id));

create or replace function public.ttp_update_organisation_brand(p_primary text, p_secondary text)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_org uuid;
begin
  if p_primary !~ '^#[0-9A-Fa-f]{6}$' or p_secondary !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Invalid colour value';
  end if;
  select ua.organization_id into v_org from public.ttp_user_access ua
  where ua.user_id = (select auth.uid()) and ua.active and ua.role = 'super_admin';
  if v_org is null and not private.is_platform_admin() then raise exception 'Not authorised'; end if;
  if v_org is null then raise exception 'Platform owner must edit branding from an organisation context'; end if;
  update public.organizations set primary_color=p_primary, secondary_color=p_secondary, updated_at=now() where id=v_org;
end; $$;

revoke all on function public.ttp_update_organisation_brand(text,text) from public;
grant execute on function public.ttp_update_organisation_brand(text,text) to authenticated;
