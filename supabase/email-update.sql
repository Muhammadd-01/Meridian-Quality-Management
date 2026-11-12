-- ============================================================================
-- Meridian CRM — each user's own connected email (send from the CRM)
--
-- Run AFTER roles.sql: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run.
--
-- The app password is encrypted by the Meridian API before it is stored here;
-- this table never holds a readable password. Each user can only see and
-- change their own row.
-- ============================================================================

create table if not exists public.email_accounts (
  user_id             uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  email               text not null,
  display_name        text not null default '',
  provider            text not null default 'custom',
  smtp_host           text not null,
  smtp_port           integer not null check (smtp_port between 1 and 65535),
  smtp_security       text not null default 'ssl' check (smtp_security in ('ssl', 'starttls')),
  username            text not null,
  password_encrypted  text not null,
  verified_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.email_accounts enable row level security;
revoke all on public.email_accounts from anon;
grant select, insert, update, delete on public.email_accounts to authenticated;

drop policy if exists "email_accounts_own" on public.email_accounts;
create policy "email_accounts_own" on public.email_accounts
  for all to authenticated
  using (user_id = auth.uid() and public.app_role() is not null)
  with check (user_id = auth.uid() and public.app_role() is not null);

notify pgrst, 'reload schema';
