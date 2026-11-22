-- Read-only checks. Run each block in the Supabase SQL editor and send me the results.
-- Nothing here changes data.

-- A) Is row-level security ON for every table? (rowsecurity must be true everywhere)
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- B) Every policy (this is where "who can read/write what" is decided)
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by tablename, cmd;

-- C) Every function you wrote (set_profile_status, start_conversation, respond_mentorship, ...)
select proname, pg_get_functiondef(oid) as definition
from pg_proc
where pronamespace = 'public'::regnamespace
order by proname;

-- D) Every trigger (notifications, "messaged you" text, emails)
select tgrelid::regclass as table_name, tgname, pg_get_triggerdef(oid) as definition
from pg_trigger
where not tgisinternal
order by 1, 2;

-- E) Which columns can a signed-in member read on profiles? (look for email, details, last_seen_at)
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;
