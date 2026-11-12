-- ============================================================================
-- Meridian CRM — user roles (Admin, CEO, Manager, Employee)
--
-- Run AFTER schema.sql: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run.
--
-- BEFORE RUNNING: put the email you sign in with on the line marked >>> below.
-- That account becomes Admin. (If it is not found and there is no Admin yet,
-- the oldest account becomes Admin so the workspace is never locked.)
--
-- What each role may do (enforced here by Row Level Security, and again by the API):
--
--   | Permission                         | Admin | CEO | Manager | Employee |
--   |------------------------------------|-------|-----|---------|----------|
--   | View accounts/contacts/leads/deals |  yes  | yes |   yes   |   yes    |
--   | Create and edit those records      |  yes  | yes |   yes   |   yes    |
--   | Delete records                     |  yes  | yes |   yes   |   no     |
--   | See the user list                  |  yes  | yes |   yes   |   no     |
--   | Create users, change roles,        |  yes  | yes |   no    |   no     |
--   | activate / deactivate users        |       |     |         |          |
--
-- New accounts that sign up on their own (not created by an Admin/CEO) are
-- inactive Employees: they can sign in to Supabase but see no CRM data until
-- an Admin or CEO activates them.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth user, holding the CRM role
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null default '',
  full_name   text not null default '',
  job_title   text not null default '',
  app_role    text not null default 'Employee'
              check (app_role in ('Admin', 'CEO', 'Manager', 'Employee')),
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- The signed-in user's role, or null when they have no active profile.
-- security definer so policies can call it without recursing into profiles RLS.
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.app_role from public.profiles p where p.id = auth.uid() and p.is_active
$$;

revoke execute on function public.app_role() from public, anon;
grant execute on function public.app_role() to authenticated;

-- New auth user → profile. The very first user becomes an active Admin;
-- everyone else starts as an inactive Employee until an Admin/CEO activates them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles) into is_first;
  insert into public.profiles (id, email, full_name, job_title, app_role, is_active)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', ''),
    case when is_first then 'Admin' else 'Employee' end,
    is_first
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only an Admin or CEO may change a role or activate/deactivate an account,
-- and nobody may change their own role or status (no self-promotion, no lock-out).
-- Statements run from the SQL editor (no signed-in user) are not restricted.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  new.updated_at := now();
  if auth.uid() is not null then
    new.email := old.email;
    if new.app_role is distinct from old.app_role or new.is_active is distinct from old.is_active then
      if old.id = auth.uid() then
        raise exception 'You cannot change your own role or status.' using errcode = '42501';
      end if;
      if coalesce(public.app_role(), '') not in ('Admin', 'CEO') then
        raise exception 'Only an Admin or CEO can change roles.' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
-- Everyone sees their own row (to learn their status); Admin, CEO and Manager see the team list.
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.app_role() in ('Admin', 'CEO', 'Manager'));
-- Own name/title, or anyone's when Admin/CEO (role changes are checked by the trigger above).
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.app_role() in ('Admin', 'CEO'))
  with check (id = auth.uid() or public.app_role() in ('Admin', 'CEO'));

-- ---------------------------------------------------------------------------
-- Existing accounts: give everyone a profile (active Employee)
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name, job_title, app_role, is_active)
select
  u.id,
  lower(coalesce(u.email, '')),
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(u.email, ''), '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'role', ''),
  'Employee',
  true
from auth.users u
on conflict (id) do nothing;

do $$
declare
  owner_email text := 'your-email@example.com';  -- >>> CHANGE THIS to the email you sign in with
begin
  update public.profiles set app_role = 'Admin', is_active = true where email = lower(trim(owner_email));

  if not exists (select 1 from public.profiles where app_role = 'Admin' and is_active) then
    update public.profiles set app_role = 'Admin', is_active = true
    where id = (select u.id from auth.users u order by u.created_at limit 1);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- CRM tables: access by role
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'contacts', 'leads', 'deals'] loop
    -- previous "any signed-in user" policies from schema.sql
    execute format('drop policy if exists "%s_select_authenticated" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_authenticated" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_authenticated" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_authenticated" on public.%I', t, t);

    execute format('drop policy if exists "%s_select_by_role" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_by_role" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_by_role" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_by_role" on public.%I', t, t);

    execute format('create policy "%s_select_by_role" on public.%I
                    for select to authenticated using (public.app_role() is not null)', t, t);
    execute format('create policy "%s_insert_by_role" on public.%I
                    for insert to authenticated
                    with check (public.app_role() is not null and (created_by is null or created_by = auth.uid()))', t, t);
    execute format('create policy "%s_update_by_role" on public.%I
                    for update to authenticated
                    using (public.app_role() is not null) with check (public.app_role() is not null)', t, t);
    execute format('create policy "%s_delete_by_role" on public.%I
                    for delete to authenticated
                    using (public.app_role() in (''Admin'', ''CEO'', ''Manager''))', t, t);
  end loop;
end;
$$;

notify pgrst, 'reload schema';

-- Check the result:
-- select email, app_role, is_active from public.profiles order by created_at;
