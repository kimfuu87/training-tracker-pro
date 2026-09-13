revoke execute on function public.ttp_update_organisation_brand(text,text) from anon;
revoke execute on function public.ttp_update_organisation_brand(text,text) from public;
grant execute on function public.ttp_update_organisation_brand(text,text) to authenticated;
