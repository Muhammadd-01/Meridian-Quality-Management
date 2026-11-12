-- ============================================================================
-- Meridian CRM — Supabase schema (Accounts, Contacts, Leads, Deals)
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is idempotent.
--
-- Access model: the ASP.NET Core API forwards the signed-in user's Supabase
-- JWT, so Row Level Security below is the real security boundary. Signed-in
-- users share one CRM workspace (full read/write); anonymous callers get nothing.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Keeps updated_at current on every UPDATE and makes the audit columns
-- (created_by, created_at) immutable once a row exists.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  new.created_by := old.created_by;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Accounts (shown as "Companies" in the CRM screens)
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id              text primary key default gen_random_uuid()::text,
  name            text not null check (length(trim(name)) > 0),
  industry        text not null default '',
  category        text not null default 'Enterprise'
                  check (category in ('Enterprise', 'Mid-Market', 'SMB')),
  relationship    text not null default 'Prospect'
                  check (relationship in ('Customer', 'Partner', 'Supplier', 'Prospect')),
  email           text not null default '',
  phone           text not null default '',
  location        text not null default '',
  country         text not null default '',
  contact_person  text not null default '',
  contact_role    text not null default '',
  active_deals    integer not null default 0 check (active_deals >= 0),
  total_spent     numeric(18, 2) not null default 0 check (total_spent >= 0),
  logo_text       text not null default '',
  logo_color      text not null default 'bg-teal-800',
  extra           jsonb not null default '{}'::jsonb,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists accounts_name_idx on public.accounts (lower(name));
create index if not exists accounts_relationship_idx on public.accounts (relationship);
create index if not exists accounts_created_at_idx on public.accounts (created_at desc);

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id          text primary key default gen_random_uuid()::text,
  name        text not null check (length(trim(name)) > 0),
  company     text not null default '',
  role        text not null default '',
  email       text not null default '',
  phone       text not null default '',
  location    text not null default '',
  status      text not null default 'Active' check (status in ('Active', 'Inactive')),
  source      text not null default 'Manual'
              check (source in ('Company record', 'Lead', 'Manual', 'Import')),
  tags        text[] not null default '{}',
  notes       text not null default '',
  is_demo     boolean not null default false,
  extra       jsonb not null default '{}'::jsonb,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists contacts_name_idx on public.contacts (lower(name));
create index if not exists contacts_email_idx on public.contacts (lower(email));
create index if not exists contacts_company_idx on public.contacts (lower(company));
create index if not exists contacts_created_at_idx on public.contacts (created_at desc);

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id                 text primary key default gen_random_uuid()::text,
  contact_name       text not null check (length(trim(contact_name)) > 0),
  company            text not null check (length(trim(company)) > 0),
  email              text not null default '',
  phone              text not null default '',
  source             text not null default 'Other'
                     check (source in ('Website', 'Referral', 'LinkedIn', 'Facebook', 'Conference', 'Cold Call', 'Other')),
  status             text not null default 'New'
                     check (status in ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost')),
  assigned_to        text not null default '',
  deal_value         numeric(18, 2) not null default 0 check (deal_value >= 0),
  last_contact       date,
  notes              text not null default '',
  converted_deal_id  text,
  extra              jsonb not null default '{}'::jsonb,
  created_by         uuid default auth.uid() references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_company_idx on public.leads (lower(company));
create index if not exists leads_assigned_to_idx on public.leads (assigned_to);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- ---------------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------------
create table if not exists public.deals (
  id              text primary key default gen_random_uuid()::text,
  name            text not null check (length(trim(name)) > 0),
  company         text not null check (length(trim(company)) > 0),
  contact         text not null default '',
  owner           text not null default '',
  value           numeric(18, 2) not null default 0 check (value >= 0),
  stage           text not null default 'Lead'
                  check (stage in ('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost')),
  probability     integer not null default 10 check (probability between 0 and 100),
  expected_close  date,
  status          text not null default 'Active' check (status in ('Active', 'Won', 'Lost', 'At Risk')),
  tags            text[] not null default '{}',
  notes           text not null default '',
  closed_at       date,
  lost_reason     text,
  lost_note       text,
  source_lead_id  text,
  extra           jsonb not null default '{}'::jsonb,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists deals_stage_idx on public.deals (stage);
create index if not exists deals_status_idx on public.deals (status);
create index if not exists deals_company_idx on public.deals (lower(company));
create index if not exists deals_owner_idx on public.deals (owner);
create index if not exists deals_source_lead_idx on public.deals (source_lead_id);
create index if not exists deals_created_at_idx on public.deals (created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers, grants and Row Level Security (same rules for all four tables)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'contacts', 'leads', 'deals'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);

    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists "%s_select_authenticated" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_authenticated" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_authenticated" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_authenticated" on public.%I', t, t);

    execute format('create policy "%s_select_authenticated" on public.%I
                    for select to authenticated using (true)', t, t);
    execute format('create policy "%s_insert_authenticated" on public.%I
                    for insert to authenticated with check (created_by is null or created_by = auth.uid())', t, t);
    execute format('create policy "%s_update_authenticated" on public.%I
                    for update to authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s_delete_authenticated" on public.%I
                    for delete to authenticated using (true)', t, t);
  end loop;
end;
$$;

-- Let PostgREST pick up the new tables immediately.
notify pgrst, 'reload schema';
