-- Aakar: mentor profile photos.
-- Run in the Supabase SQL editor. Safe to run more than once.
--
-- Photos live in a PUBLIC bucket called "avatars" so students can see them without signed links.
-- Only put profile photos here (never ID documents). Files are stored as  <user id>/photo-<timestamp>.<ext>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png'];

-- Anyone may read photos; members may write only inside their own folder.
drop policy if exists "avatars are public" on storage.objects;
create policy "avatars are public"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "members upload own avatar" on storage.objects;
create policy "members upload own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "members update own avatar" on storage.objects;
create policy "members update own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "members delete own avatar" on storage.objects;
create policy "members delete own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- Save a mentor's photo URL on their profile (details.avatar). The URL must point into their own folder.
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
     and role = 'professional'
     and status = 'approved'
     and not is_admin;

  if not found then
    raise exception 'Only an approved mentor can set a photo';
  end if;
end;
$$;

revoke all on function public.set_my_avatar(text) from public;
grant execute on function public.set_my_avatar(text) to authenticated;
