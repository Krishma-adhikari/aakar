-- Aakar: startups can replace their pitch deck, and investors can open it.
-- Run in the Supabase SQL editor. Safe to run more than once.
--
-- Decks live in the private "kyc-docs" bucket as  <startup user id>/deck-<timestamp>.pdf
-- (registration already uploads them this way).

-- 1) Record the new deck on the startup's own profile (replaces the previous "deck" entry).
create or replace function public.set_my_deck(p_file jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  path text := p_file ->> 'path';
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if path is null or path not like auth.uid()::text || '/deck-%' then
    raise exception 'Invalid file path';
  end if;

  update public.profiles
     set details = jsonb_set(
           coalesce(details, '{}'::jsonb), '{files}',
           coalesce((select jsonb_agg(f) from jsonb_array_elements(coalesce(details -> 'files', '[]'::jsonb)) f
                      where f ->> 'key' is distinct from 'deck'), '[]'::jsonb)
             || jsonb_build_array(jsonb_build_object(
                  'key', 'deck', 'label', 'Pitch deck', 'name', p_file ->> 'name', 'path', path)),
           true)
   where id = auth.uid()
     and role = 'startup'
     and status = 'approved'
     and not is_admin;

  if not found then
    raise exception 'Only an approved startup can set a pitch deck';
  end if;
end;
$$;

revoke all on function public.set_my_deck(jsonb) from public;
grant execute on function public.set_my_deck(jsonb) to authenticated;


-- 2) A startup may upload deck-... files into its own folder.
drop policy if exists "startups upload own deck" on storage.objects;
create policy "startups upload own deck"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'kyc-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
  and storage.filename(name) like 'deck-%'
);

-- 3) Approved investors may READ the deck of an approved startup (nothing else from its folder).
drop policy if exists "investors read startup decks" on storage.objects;
create policy "investors read startup decks"
on storage.objects for select to authenticated
using (
  bucket_id = 'kyc-docs'
  and storage.filename(name) like 'deck-%'
  and exists (
    select 1 from public.profiles me
     where me.id = auth.uid() and me.role = 'investor' and me.status = 'approved'
  )
  and exists (
    select 1 from public.profiles st
     where st.id::text = (storage.foldername(name))[1]
       and st.role = 'startup' and st.status = 'approved'
  )
);

-- 4) A startup may read its own files back (for the "View" button). Skip if you already ran 007.
drop policy if exists "members read own files" on storage.objects;
create policy "members read own files"
on storage.objects for select to authenticated
using (
  bucket_id = 'kyc-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
