-- ============================================================================
-- Meridian CRM — create TEST sign-in accounts (one CEO, one Admin)
--
-- 1. Fill in the four values marked >>> below (emails and passwords you choose).
-- 2. Supabase dashboard → SQL Editor → New query → paste → Run.
--
-- The accounts are confirmed straight away (no confirmation email) and marked
-- as test users, so supabase/remove-test-users.sql can delete exactly them later.
-- Run AFTER roles.sql. Safe to re-run: an email that already exists is skipped.
-- ============================================================================

do $$
declare
  -- >>> fill these in
  ceo_email      text := 'test-ceo@example.com';
  ceo_password   text := 'CHANGE-ME';
  admin_email    text := 'test-admin@example.com';
  admin_password text := 'CHANGE-ME';

  accounts jsonb;
  acc jsonb;
  uid uuid;
begin
  if ceo_password = 'CHANGE-ME' or admin_password = 'CHANGE-ME' then
    raise exception 'Set both passwords at the top of the script first (at least 8 characters).';
  end if;
  if length(ceo_password) < 8 or length(admin_password) < 8 then
    raise exception 'Passwords must be at least 8 characters.';
  end if;

  accounts := jsonb_build_array(
    jsonb_build_object('email', lower(trim(ceo_email)),   'password', ceo_password,   'name', 'Test CEO',   'role', 'CEO'),
    jsonb_build_object('email', lower(trim(admin_email)), 'password', admin_password, 'name', 'Test Admin', 'role', 'Admin')
  );

  for acc in select * from jsonb_array_elements(accounts) loop
    if exists (select 1 from auth.users where email = acc ->> 'email') then
      raise notice 'Skipped %, it already exists.', acc ->> 'email';
      continue;
    end if;

    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      acc ->> 'email', extensions.crypt(acc ->> 'password', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"meridian_test_user":true}'::jsonb,
      jsonb_build_object('full_name', acc ->> 'name', 'role', 'Test account'),
      now(), now(), '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', acc ->> 'email', 'email_verified', true),
      'email', now(), now(), now()
    );

    -- the roles.sql trigger created an inactive Employee profile: give it the role
    update public.profiles
       set app_role = acc ->> 'role', is_active = true, full_name = acc ->> 'name', job_title = 'Test account'
     where id = uid;
  end loop;
end;
$$;

-- Check:
select p.email, p.app_role, p.is_active
from public.profiles p
join auth.users u on u.id = p.id
where u.raw_app_meta_data ->> 'meridian_test_user' = 'true';
