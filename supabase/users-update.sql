-- ============================================================================
-- Meridian CRM — user phone numbers, no role changes while inactive,
-- changing your password with an emailed code, and Admin/CEO user
-- management (create without emails, permanently delete)
--
-- Run AFTER roles.sql: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run.
-- ============================================================================

-- Phone number in international format, e.g. +923001234567 (empty when not given).
alter table public.profiles add column if not exists phone text not null default '';

alter table public.profiles drop constraint if exists profiles_phone_format;
alter table public.profiles add constraint profiles_phone_format
  check (phone = '' or phone ~ '^\+[1-9][0-9]{7,14}$');

-- Same rules as roles.sql, plus: the role of an account that stays deactivated
-- cannot be changed (activate it first). Activating / deactivating works as before.
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
      -- Changing the role of an account that stays deactivated is refused;
      -- activating it and setting its role in one step (new users) is fine.
      if new.app_role is distinct from old.app_role and not old.is_active and not new.is_active then
        raise exception 'This account is deactivated. Activate it before changing its role.' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Change password with an emailed code (Settings → Profile)
--
-- Supabase emails the code with its "Reauthentication" template and stores a
-- hash of it on the user (sha224 of email + code, valid for 1 hour). These
-- functions let a signed-in user check THEIR OWN code against that hash, so the
-- API only changes the password when the code is right.
-- ---------------------------------------------------------------------------
create or replace function public.verify_reauthentication_code(code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and coalesce(u.reauthentication_token, '') <> ''
      and u.reauthentication_sent_at > now() - interval '1 hour'
      and u.reauthentication_token = encode(extensions.digest(coalesce(u.email, '') || trim(code), 'sha224'), 'hex')
  )
$$;

-- Makes a used code unusable (called after the password was changed).
create or replace function public.clear_reauthentication_code()
returns void
language sql
security definer
set search_path = ''
as $$
  update auth.users set reauthentication_token = '' where id = auth.uid()
$$;

revoke execute on function public.verify_reauthentication_code(text) from public, anon;
revoke execute on function public.clear_reauthentication_code() from public, anon;
grant execute on function public.verify_reauthentication_code(text) to authenticated;
grant execute on function public.clear_reauthentication_code() to authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Users & Roles: create and permanently delete accounts (Admin / CEO only)
--
-- Creating through these functions sends NO email (so Supabase's email limit
-- never blocks it): the account is confirmed and ready to sign in at once.
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_job_title text default '',
  p_phone text default ''
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := gen_random_uuid();
  email_norm text := lower(trim(p_email));
  result public.profiles;
begin
  if coalesce(public.app_role(), '') not in ('Admin', 'CEO') then
    raise exception 'Only an Admin or CEO can create users.' using errcode = '42501';
  end if;
  if p_role not in ('Admin', 'CEO', 'Manager', 'Employee') then
    raise exception 'Unknown role.' using errcode = '22023';
  end if;
  if email_norm !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'That email address isn''t valid.' using errcode = '22023';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'The password must be at least 8 characters.' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where email = email_norm) then
    raise exception 'An account with this email already exists.' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    email_norm, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', trim(p_full_name), 'role', coalesce(trim(p_job_title), '')),
    now(), now(), '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (uid::text, uid, jsonb_build_object('sub', uid::text, 'email', email_norm, 'email_verified', true), 'email', now(), now(), now());

  -- the roles.sql trigger created an inactive Employee profile: apply the chosen role
  update public.profiles
     set app_role = p_role, is_active = true, full_name = trim(p_full_name),
         job_title = coalesce(trim(p_job_title), ''), phone = coalesce(trim(p_phone), '')
   where id = uid
  returning * into result;
  return result;
end;
$$;

-- Permanently removes a sign-in account and its profile. Records the person
-- created (leads, deals, …) are kept. You cannot delete your own account.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.app_role(), '') not in ('Admin', 'CEO') then
    raise exception 'Only an Admin or CEO can delete users.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account.' using errcode = '42501';
  end if;
  delete from auth.users where id = p_user_id;
  if not found then
    raise exception 'No user with that id was found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_create_user(text, text, text, text, text, text) from public, anon;
revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_create_user(text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

notify pgrst, 'reload schema';
