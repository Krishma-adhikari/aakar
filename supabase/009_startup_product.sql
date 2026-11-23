-- Aakar: startups can edit product details, social links and founder photos on "My listing".
-- Run in the Supabase SQL editor (after 003_listing.sql). Safe to run more than once.
-- This replaces update_my_listing with a longer list of accepted fields.

create or replace function public.update_my_listing(p_raw jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb)
    into clean
    from jsonb_each(coalesce(p_raw, '{}'::jsonb)) as t(k, v)
   where k = any (array[
     'tagline', 'sector', 'stage', 'location', 'founded', 'team', 'ask', 'equity',
     'problem', 'problemLine', 'solution', 'market', 'model',
     'pitchVideo', 'tractionNotes', 'tractionMetrics', 'execs', 'useOfFunds',
     'productDesc', 'productWebsite',
     'socialLinkedin', 'socialFacebook', 'socialInstagram', 'socialOther'
   ]);

  update public.profiles
     set details = jsonb_set(
           coalesce(details, '{}'::jsonb),
           '{raw}',
           coalesce(details -> 'raw', '{}'::jsonb) || clean,
           true)
   where id = auth.uid()
     and role = 'startup'
     and status = 'approved'
     and not is_admin;

  if not found then
    raise exception 'Only an approved startup can edit its listing';
  end if;
end;
$$;

revoke all on function public.update_my_listing(jsonb) from public;
grant execute on function public.update_my_listing(jsonb) to authenticated;
