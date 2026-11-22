-- Aakar: phase 2 database changes.
-- Run in the Supabase SQL editor. Safe to run more than once.
-- Read 002_check_policies.sql first if you have not looked at your policies yet.

-- 1) Let a REJECTED member send a new application with the same email.
--    The app calls this when someone registers again with the email and password of a rejected account.
--    Only the member's own row, and only while it is 'rejected'.
--    NOTE: if you have a trigger that blocks non-admins from changing profiles.status,
--    it must allow this function (this function runs as its owner, not as the member).
create or replace function public.resubmit_application(
  p_full_name text,
  p_role      text,
  p_country   text,
  p_bio       text,
  p_keywords  text[],
  p_details   jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_role not in ('student', 'professional', 'startup', 'investor', 'organization') then
    raise exception 'Invalid role';
  end if;

  update public.profiles
     set full_name     = p_full_name,
         role          = p_role,
         country       = p_country,
         bio           = p_bio,
         keywords      = coalesce(p_keywords, '{}'),
         details       = coalesce(p_details, '{}'::jsonb),
         status        = 'pending',
         reject_reason = null,
         created_at    = now()          -- shows at the top of the admin queue again
   where id = auth.uid()
     and status = 'rejected'
     and not is_admin;

  if not found then
    raise exception 'Only a rejected application can be sent again';
  end if;
end;
$$;

revoke all on function public.resubmit_application(text, text, text, text, text[], jsonb) from public;
grant execute on function public.resubmit_application(text, text, text, text, text[], jsonb) to authenticated;


-- 2) Public data for the landing page (visitors who are not logged in).
--    Only approved startups, only fields that are meant to be public. No ids, emails or documents.
create or replace view public.public_startups as
select
  p.details->'raw'->>'startupName' as name,
  p.details->'raw'->>'tagline'     as tagline,
  p.details->'raw'->>'sector'      as sector,
  p.details->'raw'->>'stage'       as stage,
  p.details->'raw'->>'location'    as location,
  p.created_at
from public.profiles p
where p.role = 'startup'
  and p.status = 'approved'
  and not p.is_admin;

grant select on public.public_startups to anon, authenticated;

-- Counts for the landing-page numbers (approved members only).
create or replace function public.public_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'startups',      count(*) filter (where role = 'startup'),
    'investors',     count(*) filter (where role = 'investor'),
    'mentors',       count(*) filter (where role = 'professional'),
    'students',      count(*) filter (where role = 'student'),
    'organizations', count(*) filter (where role = 'organization')
  )
  from public.profiles
  where status = 'approved' and not is_admin;
$$;

revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;
