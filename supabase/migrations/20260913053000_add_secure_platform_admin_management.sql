create table if not exists private.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

insert into private.platform_admins (user_id)
select u.id from auth.users u
join private.platform_owner_emails p on lower(p.email) = lower(u.email)
on conflict (user_id) do nothing;

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from private.platform_admins pa
      where pa.user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_platform_admin() from public;
grant execute on function private.is_platform_admin() to authenticated;

create or replace function public.ttp_is_platform_admin()
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.is_platform_admin(); $$;

revoke all on function public.ttp_is_platform_admin() from public;
grant execute on function public.ttp_is_platform_admin() to authenticated;

drop policy if exists organizations_platform_manage on public.organizations;
create policy organizations_platform_manage on public.organizations for all to authenticated
using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists plans_platform_manage on public.subscription_plans;
create policy plans_platform_manage on public.subscription_plans for all to authenticated
using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists subscriptions_platform_manage on public.subscriptions;
create policy subscriptions_platform_manage on public.subscriptions for all to authenticated
using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists organization_modules_platform_manage on public.organization_modules;
create policy organization_modules_platform_manage on public.organization_modules for all to authenticated
using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists organization_access_settings_platform_manage on public.organization_access_settings;
create policy organization_access_settings_platform_manage on public.organization_access_settings for all to authenticated
using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists organization_members_platform_manage on public.organization_members;
create policy organization_members_platform_manage on public.organization_members for all to authenticated
using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists organization_invitations_platform_manage on public.organization_admin_invitations;
create policy organization_invitations_platform_manage on public.organization_admin_invitations for all to authenticated
using (private.is_platform_admin()) with check (private.is_platform_admin());

create index if not exists subscriptions_organization_id_idx on public.subscriptions (organization_id);
create index if not exists organization_members_organization_id_idx on public.organization_members (organization_id);
