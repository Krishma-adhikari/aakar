-- Aakar: students can edit their own profile, photo and CV (same as mentors, see 005 and 006).
-- Run in the Supabase SQL editor AFTER 005_mentor_profile.sql and 006_avatars.sql. Safe to run more than once.

-- 1) Save profile edits. Mentors and students each have their own whitelist of fields.
create or replace function public.update_my_profile(p_raw jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me_role text;
  allowed text[];
  clean jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select role into me_role from public.profiles
   where id = auth.uid() and status = 'approved' and not is_admin;

  if me_role = 'professional' then
    allowed := array['title', 'company', 'bio', 'fields', 'linkedin', 'portfolio'];
  elsif me_role = 'student' then
    allowed := array['institution', 'level', 'city', 'goal', 'interests', 'portfolio'];
  else
    raise exception 'Only an approved mentor or student can edit this profile';
  end if;

  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb)
    into clean
    from jsonb_each(coalesce(p_raw, '{}'::jsonb)) as t(k, v)
   where k = any (allowed);

  update public.profiles
     set details = jsonb_set(
           coalesce(details, '{}'::jsonb), '{raw}',
           coalesce(details -> 'raw', '{}'::jsonb) || clean, true)
   where id = auth.uid();
end;
$$;

revoke all on function public.update_my_profile(jsonb) from public;
grant execute on function public.update_my_profile(jsonb) to authenticated;


-- 2) Replace the caller's CV entry. Mentors use key "cv" (cv-... files), students key "resume" (resume-... files).
create or replace function public.set_my_cv(p_file jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me_role text;
  k text;
  path text := p_file ->> 'path';
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select role into me_role from public.profiles
   where id = auth.uid() and status = 'approved' and not is_admin;

  if me_role = 'professional' then k := 'cv';
  elsif me_role = 'student' then k := 'resume';
  else raise exception 'Only an approved mentor or student can set a CV';
  end if;

  if path is null or path not like auth.uid()::text || '/' || k || '-%' then
    raise exception 'Invalid file path';
  end if;

  update public.profiles
     set details = jsonb_set(
           coalesce(details, '{}'::jsonb), '{files}',
           coalesce((select jsonb_agg(f) from jsonb_array_elements(coalesce(details -> 'files', '[]'::jsonb)) f
                      where f ->> 'key' is distinct from k), '[]'::jsonb)
             || jsonb_build_array(jsonb_build_object(
                  'key', k, 'label', 'CV / résumé', 'name', p_file ->> 'name', 'path', path)),
           true)
   where id = auth.uid();
end;
$$;

revoke all on function public.set_my_cv(jsonb) from public;
grant execute on function public.set_my_cv(jsonb) to authenticated;


-- 3) Profile photo: students may set one too.
create or replace function public.set_my_avatar(p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_url is null or p_url not like '%/storage/v1/object/public/avatars/' || auth.uid()::text || '/%' then
    raise exception 'Invalid photo address';
  end if;

  update public.profiles
     set details = jsonb_set(coalesce(details, '{}'::jsonb), '{avatar}', to_jsonb(p_url), true)
   where id = auth.uid()
     and role in ('professional', 'student')
     and status = 'approved'
     and not is_admin;

  if not found then
    raise exception 'Only an approved mentor or student can set a photo';
  end if;
end;
$$;

revoke all on function public.set_my_avatar(text) from public;
grant execute on function public.set_my_avatar(text) to authenticated;


-- 4) Storage: students may upload a replacement resume-... into their own folder,
--    and any member may read their own files back (for the "View" button).
drop policy if exists "students upload own resume" on storage.objects;
create policy "students upload own resume"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'kyc-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
  and storage.filename(name) like 'resume-%'
);

drop policy if exists "members read own files" on storage.objects;
create policy "members read own files"
on storage.objects for select to authenticated
using (
  bucket_id = 'kyc-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
