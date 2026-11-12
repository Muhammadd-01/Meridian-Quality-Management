-- ============================================================================
-- Meridian CRM — remove the TEST accounts made by create-test-users.sql
--
-- Supabase dashboard → SQL Editor → New query → paste → Run.
-- Deletes only accounts marked as test users; real accounts are untouched.
-- Records those accounts created (leads, deals, …) are kept.
-- ============================================================================

-- Accounts that will be removed:
select email, created_at from auth.users where raw_app_meta_data ->> 'meridian_test_user' = 'true';

-- Their profiles are removed automatically (on delete cascade).
delete from auth.users where raw_app_meta_data ->> 'meridian_test_user' = 'true';
