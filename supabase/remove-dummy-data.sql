-- ============================================================================
-- Meridian CRM — remove the dummy data loaded by seed.sql
--
-- Supabase dashboard → SQL Editor → New query → paste → Run.
-- Deletes only the demo rows seed.sql inserted (matched by their fixed ids,
-- plus contacts flagged is_demo), and records that were made FROM demo data:
-- deals converted from demo leads, and leads/contacts added from the demo
-- "Social Lead Capture" list (matched by exact name + company).
-- Records you created yourself are kept. Safe to run more than once.
-- ============================================================================

begin;

-- Demo people (name, company): the sample "Social Lead Capture" page and the seed.sql leads.
create temporary table demo_people (name text, company text) on commit drop;
insert into demo_people values
  ('Usman Ghani', 'Karachi Bottlers'), ('Mehreen Akhtar', 'Systems Pharma'), ('Asad Rafiq', 'Engro Fertilizers'),
  ('Hina Pervaiz', 'Gul Ahmed Textiles'), ('Kamran Yousuf', 'Prime Packaging'), ('Sobia Nadeem', 'Lucky Motors'),
  ('Zeeshan Ali', 'Shan Foods'), ('Areeba Khan', 'Getz Pharma'), ('Naveed Iqbal', 'Pak Elektron'),
  ('Laiba Sohail', 'Interloop'), ('Faisal Rana', 'Nishat Mills'), ('Amna Siddiq', 'Hilton Pharma'),
  ('Junaid Malik', 'Atlas Honda'), ('Sara Qadir', 'Unilever Pakistan'), ('Taimoor Shah', 'K-Electric'),
  ('Rabia Aziz', 'Dawood Hercules'), ('Hassan Mirza', 'Millat Tractors'), ('Noor Ul Ain', 'Searle'),
  -- people on the seed.sql demo leads
  ('Amina Tahir', 'AutoParts Manufacturing'), ('Bilal Chaudhry', 'Lahore Steel Works'), ('Bushra Ahmed', 'TechSolutions Pvt Ltd'), ('Farah Naz', 'Horizon Chemicals'), ('Imran Siddiqui', 'BuildRight Construction'), ('Kevin Brooks', 'Northstar Electronics'), ('Khalid Hussain', 'Steel Works International'), ('Mariam Siddiqui', 'Karachi Port Services'), ('Muhammad Azhar', 'Textile Corp Pakistan'), ('Naeem Akhtar', 'Precision Engineering'), ('Nida Iqbal', 'EduTech Academy'), ('Rashid Mehmood', 'Premier Foods Ltd'), ('Rubina Shaheen', 'HealthFirst Clinics'), ('Samira Khan', 'PharmaCare Solutions'), ('Sana Riaz', 'Crescent Textiles'), ('Shahid Alam', 'Universal Exports'), ('Tariq Bashir', 'PAK Cement Ltd'), ('Usman Tariq', 'Faisal Food Industries'), ('Waqar Ali', 'Metro Logistics'), ('Zara Batool', 'GreenEnergy Solutions');

create temporary table demo_lead_ids on commit drop as
select id from public.leads
where id in (
  'lead-001','lead-002','lead-003','lead-004','lead-005','lead-006','lead-007','lead-008',
  'lead-009','lead-010','lead-011','lead-012','lead-013','lead-014','lead-015',
  'lead-101','lead-102','lead-103','lead-104','lead-105'
)
or exists (select 1 from demo_people d where lower(d.name) = lower(leads.contact_name) and lower(d.company) = lower(leads.company));

-- Deals converted from demo leads (either side of the link).
delete from public.deals
where source_lead_id in (select id from demo_lead_ids)
   or id in (select converted_deal_id from public.leads where id in (select id from demo_lead_ids) and converted_deal_id is not null)
   or source_lead_id in (
     'lead-001','lead-002','lead-003','lead-004','lead-005','lead-006','lead-007','lead-008',
     'lead-009','lead-010','lead-011','lead-012','lead-013','lead-014','lead-015',
     'lead-101','lead-102','lead-103','lead-104','lead-105');

-- Deals with a demo contact at a demo company (e.g. "AutoParts Manufacturing — Amina Tahir").
delete from public.deals dl
where exists (select 1 from demo_people d where lower(d.name) = lower(dl.contact) and lower(d.company) = lower(dl.company));

delete from public.leads where id in (select id from demo_lead_ids);

delete from public.contacts c
where exists (select 1 from demo_people d where lower(d.name) = lower(c.name) and lower(d.company) = lower(c.company));

delete from public.deals where id in (
  'deal-001','deal-002','deal-003','deal-004','deal-005','deal-006','deal-007','deal-008','deal-009',
  'deal-101','deal-102','deal-103','deal-104'
);

delete from public.leads where id in (
  'lead-001','lead-002','lead-003','lead-004','lead-005','lead-006','lead-007','lead-008',
  'lead-009','lead-010','lead-011','lead-012','lead-013','lead-014','lead-015',
  'lead-101','lead-102','lead-103','lead-104','lead-105'
);

delete from public.contacts where is_demo = true or id in (
  'contact-001','contact-002','contact-003','contact-004','contact-005','contact-006','contact-007',
  'contact-008','contact-009','contact-010','contact-011','contact-012','contact-013','contact-014',
  'contact-015','contact-016','contact-017','contact-018','contact-019','contact-020',
  'contact-101','contact-102','contact-103','contact-104','contact-105'
);

delete from public.accounts where id in (
  'comp-001','comp-002','comp-003','comp-004','comp-005','comp-006','comp-007','comp-008',
  'acc-101','acc-102','acc-103','acc-104','acc-105'
);

commit;

-- Optional: also delete the demo login (admin@meridian.com).
-- Only do this once you can sign in with your own account.
--
-- delete from auth.users where email = 'admin@meridian.com';
