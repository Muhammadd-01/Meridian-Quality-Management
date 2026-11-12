-- ============================================================================
-- Meridian CRM — role permission test
--
-- Run AFTER roles.sql and profiles-update.sql.
-- Supabase dashboard → SQL Editor → New query → paste → Run.
-- Creates throw-away users for each role, tries every action as that user
-- under Row Level Security, and lists PASS / FAIL for each check.
-- Everything it creates is rolled back: no users or records are left behind.
-- ============================================================================

create or replace function pg_temp.meridian_role_tests()
returns table (role_name text, action text, expected text, actual text, result text)
language plpgsql
as $$
declare
  r record;
  ids jsonb := '{}'::jsonb;
  target uuid;
  n int;
  outcome text;
  results jsonb := '[]'::jsonb;
  roles text[] := array['Admin', 'CEO', 'Manager', 'Employee', 'Inactive'];
  role_label text;
  uid uuid;
begin
  begin -- everything inside this block is undone by the exception at the end
    foreach role_label in array roles loop
      uid := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
              'role-test-' || lower(role_label) || '-' || left(uid::text, 8) || '@example.invalid', '', now(),
              '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', 'Test ' || role_label), now(), now());
      update public.profiles
         set app_role = case when role_label = 'Inactive' then 'Employee' else role_label end,
             is_active = role_label <> 'Inactive'
       where id = uid;
      ids := ids || jsonb_build_object(role_label, uid);
    end loop;

    -- a user whose role the testers try to change
    target := (ids ->> 'Employee')::uuid;

    for r in select unnest(roles) as role_label loop
      uid := (ids ->> r.role_label)::uuid;
      insert into public.leads (id, contact_name, company) values ('role-test-' || r.role_label, 'Role Test', 'Role Test Co');

      perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
      perform set_config('role', 'authenticated', true);

      -- view
      select count(*) into n from public.leads where id = 'role-test-' || r.role_label;
      results := results || jsonb_build_object('r', r.role_label, 'a', 'View leads', 'e', case when r.role_label = 'Inactive' then 'denied' else 'allowed' end, 'x', case when n > 0 then 'allowed' else 'denied' end);

      -- create
      begin
        insert into public.leads (id, contact_name, company) values ('role-test-new-' || r.role_label, 'New', 'New Co');
        outcome := 'allowed';
      exception when others then outcome := 'denied';
      end;
      results := results || jsonb_build_object('r', r.role_label, 'a', 'Create lead', 'e', case when r.role_label = 'Inactive' then 'denied' else 'allowed' end, 'x', outcome);

      -- edit
      begin
        update public.leads set notes = 'edited' where id = 'role-test-' || r.role_label;
        get diagnostics n = row_count;
        outcome := case when n > 0 then 'allowed' else 'denied' end;
      exception when others then outcome := 'denied';
      end;
      results := results || jsonb_build_object('r', r.role_label, 'a', 'Edit lead', 'e', case when r.role_label = 'Inactive' then 'denied' else 'allowed' end, 'x', outcome);

      -- delete
      begin
        delete from public.leads where id = 'role-test-' || r.role_label;
        get diagnostics n = row_count;
        outcome := case when n > 0 then 'allowed' else 'denied' end;
      exception when others then outcome := 'denied';
      end;
      results := results || jsonb_build_object('r', r.role_label, 'a', 'Delete lead', 'e', case when r.role_label in ('Admin', 'CEO', 'Manager') then 'allowed' else 'denied' end, 'x', outcome);

      -- see the user list
      select count(*) into n from public.profiles where id <> uid;
      results := results || jsonb_build_object('r', r.role_label, 'a', 'See other users', 'e', case when r.role_label in ('Admin', 'CEO', 'Manager') then 'allowed' else 'denied' end, 'x', case when n > 0 then 'allowed' else 'denied' end);

      -- change someone else's role
      if r.role_label <> 'Employee' then
        begin
          update public.profiles set app_role = case when app_role = 'Manager' then 'Employee' else 'Manager' end where id = target;
          get diagnostics n = row_count;
          outcome := case when n > 0 then 'allowed' else 'denied' end;
        exception when others then outcome := 'denied';
        end;
        results := results || jsonb_build_object('r', r.role_label, 'a', 'Change another user''s role', 'e', case when r.role_label in ('Admin', 'CEO') then 'allowed' else 'denied' end, 'x', outcome);
      end if;

      -- promote yourself
      begin
        update public.profiles set app_role = 'Admin', is_active = true where id = uid;
        get diagnostics n = row_count;
        outcome := case when n > 0 then 'allowed' else 'denied' end;
      exception when others then outcome := 'denied';
      end;
      results := results || jsonb_build_object('r', r.role_label, 'a', 'Change own role', 'e', 'denied', 'x', outcome);

      perform set_config('role', 'postgres', true);
      perform set_config('request.jwt.claims', '', true);
    end loop;

    raise exception using errcode = 'P0001', message = 'meridian-role-test-rollback';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'meridian-role-test-rollback' then raise; end if;
  end;

  return query
    select x ->> 'r', x ->> 'a', x ->> 'e', x ->> 'x',
           case when x ->> 'e' = x ->> 'x' then 'PASS' else 'FAIL' end
    from jsonb_array_elements(results) x;
end;
$$;

select * from pg_temp.meridian_role_tests();
