-- Aakar: mentors can edit their profile links and CV, and students can see them.
-- Run in the Supabase SQL editor. Safe to run more than once.

-- 1) Save edits to a mentor's own profile (details.raw). Whitelisted keys only, own row only.
create or replace function public.update_my_profile(p_raw jsonb)
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
   where k = any (array['title', 'company', 'bio', 'fields', 'linkedin', 'portfolio']);

  update public.profiles
     set details = jsonb_set(
           coalesce(details, '{}'::jsonb),
           '{raw}',
           coalesce(details -> 'raw', '{}'::jsonb) || clean,
           true)
   where id = auth.uid()
     and role = 'professional'
     and status = 'approved'
     and not is_admin;

  if not found then
    raise exception 'Only an approved mentor can edit this profile';
  end if;
end;
$$;

revoke all on function public.update_my_profile(jsonb) from public;
grant execute on function public.update_my_profile(jsonb) to authenticated;


-- 2) Replace a mentor's CV entry in details.files after the file was uploaded to kyc-docs.
--    The path must be inside the caller's own folder and named cv-...
create or replace function public.set_my_cv(p_file jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if (p_file ->> 'path') is null or (p_file ->> 'path') not like auth.uid()::text || '/cv-%' then
    raise exception 'Invalid file path';
  end if;

  update public.profiles
     set details = jsonb_set(
           coalesce(details, '{}'::jsonb),
           '{files}',
           coalesce((select jsonb_agg(f) from jsonb_array_elements(coalesce(details -> 'files', '[]'::jsonb)) f
                      where f ->> 'key' is distinct from 'cv'), '[]'::jsonb)
             || jsonb_build_array(jsonb_build_object(
                  'key', 'cv', 'label', 'CV / résumé',
                  'name', p_file ->> 'name', 'path', p_file ->> 'path')),
           true)
   where id = auth.uid()
     and role = 'professional'
     and status = 'approved'
     and not is_admin;

  if not found then
    raise exception 'Only an approved mentor can set a CV';
  end if;
end;
$$;

revoke all on function public.set_my_cv(jsonb) from public;
grant execute on function public.set_my_cv(jsonb) to authenticated;


-- 3) Mentors may upload their CV into their own folder of kyc-docs (cv-... files only).
drop policy if exists "mentors upload own cv" on storage.objects;
create policy "mentors upload own cv"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'kyc-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
  and storage.filename(name) like 'cv-%'
);


-- 4) Approved students may READ the CV of an approved mentor (not the mentor's ID or other documents).
drop policy if exists "students read mentors' cvs" on storage.objects;
create policy "students read mentors' cvs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kyc-docs'
  and storage.filename(name) like 'cv-%'
  and exists (
    select 1 from public.profiles me
     where me.id = auth.uid() and me.role = 'student' and me.status = 'approved'
  )
  and exists (
    select 1 from public.profiles mentor
     where mentor.id::text = (storage.foldername(name))[1]
       and mentor.role = 'professional' and mentor.status = 'approved'
  )
);
