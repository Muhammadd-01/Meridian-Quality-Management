-- ============================================================================
-- Meridian CRM — dummy seed data + demo login
--
-- Run AFTER schema.sql (SQL Editor → New query → paste → Run). Re-running is
-- safe: existing rows are left untouched.
--
-- Demo login (matches the one-click demo button on the sign-in page):
--   email:    admin@meridian.com
--   password: password123
-- Change or delete this user before going to production.
-- ============================================================================

do $$
declare
  demo_id uuid;
begin
  select id into demo_id from auth.users where email = 'admin@meridian.com';
  if demo_id is null then
    demo_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', demo_id, 'authenticated', 'authenticated',
      'admin@meridian.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin User","company":"Meridian Quality Management","role":"Quality Manager"}'::jsonb,
      now(), now(), '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      demo_id::text, demo_id,
      jsonb_build_object('sub', demo_id::text, 'email', 'admin@meridian.com', 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
end;
$$;

-- Accounts (13)
insert into public.accounts (id, name, industry, category, relationship, email, phone, location, country, contact_person, contact_role, active_deals, total_spent, logo_text, logo_color, created_at, updated_at) values
  ('acc-101', 'Indus Pharma Labs', 'Pharmaceuticals', 'Enterprise', 'Customer', 'qa@induspharma.pk', '+92-21-3456-7788', 'Karachi', 'Pakistan', 'Dr. Saima Qureshi', 'Head of Quality Assurance', 2, 5400000, 'IP', 'bg-teal-800', now() - interval '0 minutes', now() - interval '0 minutes'),
  ('acc-102', 'Lahore Steel Works', 'Metals & Manufacturing', 'Mid-Market', 'Prospect', 'info@lahoresteel.pk', '+92-42-3577-1200', 'Lahore', 'Pakistan', 'Bilal Chaudhry', 'Plant Manager', 1, 0, 'LS', 'bg-rust', now() - interval '1 minutes', now() - interval '1 minutes'),
  ('acc-103', 'Gulf Logistics FZE', 'Logistics & Warehousing', 'Enterprise', 'Partner', 'ops@gulflogistics.ae', '+971-4-555-0187', 'Dubai', 'United Arab Emirates', 'Omar Al Mansoori', 'Operations Director', 1, 2750000, 'GL', 'bg-accent', now() - interval '2 minutes', now() - interval '2 minutes'),
  ('acc-104', 'GreenLeaf Packaging', 'Packaging', 'SMB', 'Supplier', 'sales@greenleafpack.com', '+92-51-2233-445', 'Islamabad', 'Pakistan', 'Hina Javed', 'Sales Lead', 0, 650000, 'GP', 'bg-success-500', now() - interval '3 minutes', now() - interval '3 minutes'),
  ('acc-105', 'Northstar Electronics', 'Electronics Assembly', 'Mid-Market', 'Customer', 'quality@northstar-elec.com', '+1 (408) 555-0163', 'San Jose, CA', 'United States', 'Kevin Brooks', 'Quality Engineering Manager', 1, 3100000, 'NE', 'bg-teal-500', now() - interval '4 minutes', now() - interval '4 minutes'),
  ('comp-001', 'Cascade Retail Grp', 'Retail & Consumer Goods', 'Enterprise', 'Customer', 'compliance@cascaderetail.com', '+1 (312) 555-0142', 'Chicago, IL', 'United States', 'Amelia Hart', 'Director of QA', 3, 4200000, 'CR', 'bg-danger-500', now() - interval '5 minutes', now() - interval '5 minutes'),
  ('comp-002', 'Vantage Retail Group', 'Omnichannel Retail', 'Mid-Market', 'Customer', 'quality@vantageretail.com', '+1 (512) 555-0199', 'Austin, TX', 'United States', 'Marco Diaz', 'VP Operations', 2, 2850000, 'VR', 'bg-warning-500', now() - interval '6 minutes', now() - interval '6 minutes'),
  ('comp-003', 'Northwind Engineering Corp', 'Industrial Equipment', 'Enterprise', 'Customer', 'iso@northwindcorp.com', '+1 (206) 555-0181', 'Seattle, WA', 'United States', 'Marcus Lee', 'VP Quality & Compliance', 4, 5600000, 'NW', 'bg-success-500', now() - interval '7 minutes', now() - interval '7 minutes'),
  ('comp-004', 'Meridian Labs & Diagnostics', 'Biotechnology & Healthcare', 'Enterprise', 'Partner', 'info@meridianlabs.pk', '+92 (21) 3456-7890', 'Karachi, Sindh', 'Pakistan', 'Dr. Kamran Hussain', 'Chief Pathologist', 2, 3900000, 'ML', 'bg-teal-500', now() - interval '8 minutes', now() - interval '8 minutes'),
  ('comp-005', 'BrightPath Learning Inc', 'Corporate Education', 'Mid-Market', 'Customer', 'support@brightpath.com', '+1 (303) 555-0133', 'Denver, CO', 'United States', 'Carlos Mendez', 'Head of Learning', 1, 1450000, 'BP', 'bg-info-500', now() - interval '9 minutes', now() - interval '9 minutes'),
  ('comp-006', 'Premier Foods Pakistan', 'Food Processing & Agribusiness', 'Enterprise', 'Prospect', 'qa@premierfoods.pk', '+92 (42) 3578-9012', 'Lahore, Punjab', 'Pakistan', 'Rashid Mehmood', 'Food Safety Lead', 1, 0, 'PF', 'bg-success-600', now() - interval '10 minutes', now() - interval '10 minutes'),
  ('comp-007', 'PharmaCare Solutions Ltd', 'Pharmaceuticals', 'Enterprise', 'Customer', 'gmp@pharmacare.pk', '+92 (51) 2234-5678', 'Islamabad', 'Pakistan', 'Samira Khan', 'QA Regulatory Manager', 2, 4800000, 'PC', 'bg-teal-600', now() - interval '11 minutes', now() - interval '11 minutes'),
  ('comp-008', 'Apex Precision Engineering', 'Precision Manufacturing', 'Mid-Market', 'Prospect', 'naeem@precision.pk', '+92 (41) 8765-4321', 'Faisalabad, Punjab', 'Pakistan', 'Naeem Akhtar', 'Plant Manager', 1, 0, 'AP', 'bg-teal-600', now() - interval '12 minutes', now() - interval '12 minutes')
on conflict (id) do nothing;

-- Contacts (25)
insert into public.contacts (id, name, company, role, email, phone, location, status, source, tags, notes, is_demo, created_at, updated_at) values
  ('contact-101', 'Dr. Saima Qureshi', 'Indus Pharma Labs', 'Head of Quality Assurance', 'saima.qureshi@induspharma.pk', '+92-300-4455667', 'Karachi', 'Active', 'Manual', array['Pharma', 'Decision maker']::text[], 'Prefers Tuesday morning calls. GMP audit due in Q1.', true, now() - interval '0 minutes', now() - interval '0 minutes'),
  ('contact-102', 'Bilal Chaudhry', 'Lahore Steel Works', 'Plant Manager', 'bilal@lahoresteel.pk', '+92-321-7788990', 'Lahore', 'Active', 'Lead', array['Manufacturing']::text[], 'Evaluating ISO 45001 alongside ISO 9001.', true, now() - interval '1 minutes', now() - interval '1 minutes'),
  ('contact-103', 'Omar Al Mansoori', 'Gulf Logistics FZE', 'Operations Director', 'omar@gulflogistics.ae', '+971-50-555-0144', 'Dubai', 'Active', 'Company record', array['Partner', 'GCC']::text[], 'Partner for regional warehouse audits.', true, now() - interval '2 minutes', now() - interval '2 minutes'),
  ('contact-104', 'Hina Javed', 'GreenLeaf Packaging', 'Sales Lead', 'hina@greenleafpack.com', '+92-333-1122334', 'Islamabad', 'Inactive', 'Import', array['Supplier']::text[], 'Packaging supplier for training kits.', true, now() - interval '3 minutes', now() - interval '3 minutes'),
  ('contact-105', 'Kevin Brooks', 'Northstar Electronics', 'Quality Engineering Manager', 'kbrooks@northstar-elec.com', '+1 (408) 555-0171', 'San Jose, CA', 'Active', 'Manual', array['Six Sigma', 'Electronics']::text[], 'Green Belt cohort of 12 engineers planned.', true, now() - interval '4 minutes', now() - interval '4 minutes'),
  ('contact-001', 'Amelia Hart', 'Cascade Retail Grp', 'Director of QA', 'compliance@cascaderetail.com', '+1 (312) 555-0142', 'Chicago, IL', 'Active', 'Company record', array['Customer']::text[], '', true, now() - interval '5 minutes', now() - interval '5 minutes'),
  ('contact-002', 'Marco Diaz', 'Vantage Retail Group', 'VP Operations', 'quality@vantageretail.com', '+1 (512) 555-0199', 'Austin, TX', 'Active', 'Company record', array['Customer']::text[], '', true, now() - interval '6 minutes', now() - interval '6 minutes'),
  ('contact-003', 'Marcus Lee', 'Northwind Engineering Corp', 'VP Quality & Compliance', 'iso@northwindcorp.com', '+1 (206) 555-0181', 'Seattle, WA', 'Active', 'Company record', array['Customer']::text[], '', true, now() - interval '7 minutes', now() - interval '7 minutes'),
  ('contact-004', 'Dr. Kamran Hussain', 'Meridian Labs & Diagnostics', 'Chief Pathologist', 'info@meridianlabs.pk', '+92 (21) 3456-7890', 'Karachi, Sindh', 'Active', 'Company record', array['Partner']::text[], '', true, now() - interval '8 minutes', now() - interval '8 minutes'),
  ('contact-005', 'Carlos Mendez', 'BrightPath Learning Inc', 'Head of Learning', 'support@brightpath.com', '+1 (303) 555-0133', 'Denver, CO', 'Active', 'Company record', array['Customer']::text[], '', true, now() - interval '9 minutes', now() - interval '9 minutes'),
  ('contact-006', 'Rashid Mehmood', 'Premier Foods Pakistan', 'Food Safety Lead', 'qa@premierfoods.pk', '+92 (42) 3578-9012', 'Lahore, Punjab', 'Active', 'Company record', array['Prospect']::text[], '', true, now() - interval '10 minutes', now() - interval '10 minutes'),
  ('contact-007', 'Samira Khan', 'PharmaCare Solutions Ltd', 'QA Regulatory Manager', 'gmp@pharmacare.pk', '+92 (51) 2234-5678', 'Islamabad', 'Active', 'Company record', array['Customer']::text[], '', true, now() - interval '11 minutes', now() - interval '11 minutes'),
  ('contact-008', 'Naeem Akhtar', 'Apex Precision Engineering', 'Plant Manager', 'naeem@precision.pk', '+92 (41) 8765-4321', 'Faisalabad, Punjab', 'Active', 'Company record', array['Prospect']::text[], '', true, now() - interval '12 minutes', now() - interval '12 minutes'),
  ('contact-009', 'Muhammad Azhar', 'Textile Corp Pakistan', '', 'azhar@textilecorp.pk', '+92-300-1234567', '', 'Active', 'Lead', array['Lead']::text[], 'Interested in ISO 9001 certification consulting', true, now() - interval '13 minutes', now() - interval '13 minutes'),
  ('contact-010', 'Amina Tahir', 'AutoParts Manufacturing', '', 'amina@autoparts.pk', '+92-321-9876543', '', 'Active', 'Lead', array['Lead']::text[], 'Needs quality audit services for export compliance', true, now() - interval '14 minutes', now() - interval '14 minutes'),
  ('contact-011', 'Khalid Hussain', 'Steel Works International', '', 'khalid@steelworks.pk', '+92-312-7778899', '', 'Active', 'Lead', array['Lead']::text[], 'Interested in non-destructive testing services', true, now() - interval '15 minutes', now() - interval '15 minutes'),
  ('contact-012', 'Bushra Ahmed', 'TechSolutions Pvt Ltd', '', 'bushra@techsol.pk', '+92-300-4445566', '', 'Inactive', 'Lead', array['Lead']::text[], 'Went with competitor for ISO 27001', true, now() - interval '16 minutes', now() - interval '16 minutes'),
  ('contact-013', 'Imran Siddiqui', 'BuildRight Construction', '', 'imran@buildright.pk', '+92-315-8889900', '', 'Active', 'Lead', array['Lead']::text[], 'Construction quality management consulting', true, now() - interval '17 minutes', now() - interval '17 minutes'),
  ('contact-014', 'Zara Batool', 'GreenEnergy Solutions', '', 'zara@greenenergy.pk', '+92-331-2223344', '', 'Active', 'Lead', array['Lead']::text[], 'Environmental management system implementation', true, now() - interval '18 minutes', now() - interval '18 minutes'),
  ('contact-015', 'Farah Naz', 'Horizon Chemicals', '', 'farah@horizon.pk', '+92-342-3334455', '', 'Active', 'Lead', array['Lead']::text[], 'Chemical safety and quality compliance', true, now() - interval '19 minutes', now() - interval '19 minutes'),
  ('contact-016', 'Waqar Ali', 'Metro Logistics', '', 'waqar@metrologistics.pk', '+92-308-9990011', '', 'Active', 'Lead', array['Lead']::text[], 'Supply chain quality assessment', true, now() - interval '20 minutes', now() - interval '20 minutes'),
  ('contact-017', 'Rubina Shaheen', 'HealthFirst Clinics', '', 'rubina@healthfirst.pk', '+92-320-1112233', '', 'Active', 'Lead', array['Lead']::text[], 'Healthcare quality accreditation support', true, now() - interval '21 minutes', now() - interval '21 minutes'),
  ('contact-018', 'Tariq Bashir', 'PAK Cement Ltd', '', 'tariq@pakcement.pk', '+92-346-5556677', '', 'Active', 'Lead', array['Lead']::text[], 'Integrated management system for manufacturing', true, now() - interval '22 minutes', now() - interval '22 minutes'),
  ('contact-019', 'Nida Iqbal', 'EduTech Academy', '', 'nida@edutech.pk', '+92-302-7778899', '', 'Active', 'Lead', array['Lead']::text[], 'Quality management training courses', true, now() - interval '23 minutes', now() - interval '23 minutes'),
  ('contact-020', 'Shahid Alam', 'Universal Exports', '', 'shahid@universal.pk', '+92-311-4445566', '', 'Active', 'Lead', array['Lead']::text[], 'Export quality compliance and certification', true, now() - interval '24 minutes', now() - interval '24 minutes')
on conflict (id) do nothing;

-- Leads (20)
insert into public.leads (id, contact_name, company, email, phone, source, status, assigned_to, deal_value, last_contact, notes, converted_deal_id, created_at, updated_at) values
  ('lead-101', 'Bilal Chaudhry', 'Lahore Steel Works', 'bilal@lahoresteel.pk', '+92-321-7788990', 'Conference', 'Contacted', 'Ali Khan', 1750000, '2026-10-28'::date, 'Met at the Lahore Quality Summit. Wants ISO 9001 + 45001 bundle.', null, now() - interval '0 minutes', now() - interval '0 minutes'),
  ('lead-102', 'Sana Riaz', 'Crescent Textiles', 'sana.riaz@crescenttex.pk', '+92-300-9988776', 'Website', 'New', 'Sarah Ahmed', 950000, '2026-11-01'::date, 'Downloaded the Lean Six Sigma brochure.', null, now() - interval '1 minutes', now() - interval '1 minutes'),
  ('lead-103', 'Kevin Brooks', 'Northstar Electronics', 'kbrooks@northstar-elec.com', '+1 (408) 555-0171', 'LinkedIn', 'Proposal', 'Fatima Zahra', 2600000, '2026-10-30'::date, 'Green Belt training for 12 engineers - proposal sent.', 'deal-102', now() - interval '2 minutes', now() - interval '2 minutes'),
  ('lead-104', 'Usman Tariq', 'Faisal Food Industries', 'usman@faisalfoods.pk', '+92-345-6677889', 'Cold Call', 'Lost', 'Ali Khan', 600000, '2026-10-05'::date, 'Chose a local consultant on price.', null, now() - interval '3 minutes', now() - interval '3 minutes'),
  ('lead-105', 'Mariam Siddiqui', 'Karachi Port Services', 'mariam@kps.com.pk', '+92-21-3999-1234', 'Referral', 'Qualified', 'Sarah Ahmed', 3200000, '2026-10-29'::date, 'Referred by Gulf Logistics. Port-wide QMS gap assessment.', null, now() - interval '4 minutes', now() - interval '4 minutes'),
  ('lead-001', 'Muhammad Azhar', 'Textile Corp Pakistan', 'azhar@textilecorp.pk', '+92-300-1234567', 'Website', 'Qualified', 'Sarah Ahmed', 1500000, '2026-10-12'::date, 'Interested in ISO 9001 certification consulting', null, now() - interval '5 minutes', now() - interval '5 minutes'),
  ('lead-002', 'Amina Tahir', 'AutoParts Manufacturing', 'amina@autoparts.pk', '+92-321-9876543', 'Referral', 'New', 'Ali Khan', 800000, '2026-10-14'::date, 'Needs quality audit services for export compliance', null, now() - interval '6 minutes', now() - interval '6 minutes'),
  ('lead-003', 'Rashid Mehmood', 'Premier Foods Ltd', 'rashid@premierfoods.pk', '+92-333-5556789', 'LinkedIn', 'Proposal', 'Fatima Zahra', 2200000, '2026-10-10'::date, 'Food safety management system implementation', null, now() - interval '7 minutes', now() - interval '7 minutes'),
  ('lead-004', 'Samira Khan', 'PharmaCare Solutions', 'samira@pharmacare.pk', '+92-345-1112233', 'Conference', 'Won', 'Omar Farooq', 3500000, '2026-10-08'::date, 'GMP compliance and quality system setup', null, now() - interval '8 minutes', now() - interval '8 minutes'),
  ('lead-005', 'Khalid Hussain', 'Steel Works International', 'khalid@steelworks.pk', '+92-312-7778899', 'Cold Call', 'Contacted', 'Sarah Ahmed', 950000, '2026-10-13'::date, 'Interested in non-destructive testing services', null, now() - interval '9 minutes', now() - interval '9 minutes'),
  ('lead-006', 'Bushra Ahmed', 'TechSolutions Pvt Ltd', 'bushra@techsol.pk', '+92-300-4445566', 'Website', 'Lost', 'Ali Khan', 600000, '2026-09-25'::date, 'Went with competitor for ISO 27001', null, now() - interval '10 minutes', now() - interval '10 minutes'),
  ('lead-007', 'Imran Siddiqui', 'BuildRight Construction', 'imran@buildright.pk', '+92-315-8889900', 'Referral', 'Qualified', 'Fatima Zahra', 1800000, '2026-10-11'::date, 'Construction quality management consulting', null, now() - interval '11 minutes', now() - interval '11 minutes'),
  ('lead-008', 'Zara Batool', 'GreenEnergy Solutions', 'zara@greenenergy.pk', '+92-331-2223344', 'Website', 'New', 'Omar Farooq', 1200000, '2026-10-15'::date, 'Environmental management system implementation', null, now() - interval '12 minutes', now() - interval '12 minutes'),
  ('lead-009', 'Naeem Akhtar', 'Precision Engineering', 'naeem@precision.pk', '+92-306-6667788', 'LinkedIn', 'Proposal', 'Sarah Ahmed', 2800000, '2026-10-09'::date, 'Complete quality lab setup and training', null, now() - interval '13 minutes', now() - interval '13 minutes'),
  ('lead-010', 'Farah Naz', 'Horizon Chemicals', 'farah@horizon.pk', '+92-342-3334455', 'Conference', 'Contacted', 'Ali Khan', 1100000, '2026-10-06'::date, 'Chemical safety and quality compliance', null, now() - interval '14 minutes', now() - interval '14 minutes'),
  ('lead-011', 'Waqar Ali', 'Metro Logistics', 'waqar@metrologistics.pk', '+92-308-9990011', 'Cold Call', 'New', 'Fatima Zahra', 500000, '2026-10-14'::date, 'Supply chain quality assessment', null, now() - interval '15 minutes', now() - interval '15 minutes'),
  ('lead-012', 'Rubina Shaheen', 'HealthFirst Clinics', 'rubina@healthfirst.pk', '+92-320-1112233', 'Referral', 'Won', 'Omar Farooq', 900000, '2026-10-07'::date, 'Healthcare quality accreditation support', null, now() - interval '16 minutes', now() - interval '16 minutes'),
  ('lead-013', 'Tariq Bashir', 'PAK Cement Ltd', 'tariq@pakcement.pk', '+92-346-5556677', 'Website', 'Qualified', 'Sarah Ahmed', 4200000, '2026-10-05'::date, 'Integrated management system for manufacturing', null, now() - interval '17 minutes', now() - interval '17 minutes'),
  ('lead-014', 'Nida Iqbal', 'EduTech Academy', 'nida@edutech.pk', '+92-302-7778899', 'LinkedIn', 'Contacted', 'Ali Khan', 350000, '2026-10-12'::date, 'Quality management training courses', null, now() - interval '18 minutes', now() - interval '18 minutes'),
  ('lead-015', 'Shahid Alam', 'Universal Exports', 'shahid@universal.pk', '+92-311-4445566', 'Referral', 'Proposal', 'Fatima Zahra', 1600000, '2026-10-03'::date, 'Export quality compliance and certification', null, now() - interval '19 minutes', now() - interval '19 minutes')
on conflict (id) do nothing;

-- Deals (13)
insert into public.deals (id, name, company, contact, owner, value, stage, probability, expected_close, status, tags, notes, closed_at, lost_reason, lost_note, source_lead_id, created_at, updated_at) values
  ('deal-101', 'Indus Pharma — GMP Readiness Audit', 'Indus Pharma Labs', 'Dr. Saima Qureshi', 'Sarah Ahmed', 3400000, 'Negotiation', 75, '2026-11-28'::date, 'Active', array['Pharma', 'Audit']::text[], 'Two-site GMP readiness audit before regulator inspection.', null, null, null, null, now() - interval '0 minutes', now() - interval '0 minutes'),
  ('deal-102', 'Northstar — Green Belt Cohort', 'Northstar Electronics', 'Kevin Brooks', 'Fatima Zahra', 2600000, 'Proposal', 55, '2026-12-10'::date, 'Active', array['Training', 'Six Sigma']::text[], '12 engineers, blended delivery.', null, null, null, 'lead-103', now() - interval '1 minutes', now() - interval '1 minutes'),
  ('deal-103', 'Gulf Logistics — Warehouse ISO 9001', 'Gulf Logistics FZE', 'Omar Al Mansoori', 'Ali Khan', 2750000, 'Closed Won', 100, '2026-10-20'::date, 'Won', array['Logistics', 'Certification']::text[], 'Signed for three Dubai warehouses.', '2026-10-20'::date, null, null, null, now() - interval '2 minutes', now() - interval '2 minutes'),
  ('deal-104', 'Lahore Steel — Safety & Quality Bundle', 'Lahore Steel Works', 'Bilal Chaudhry', 'Ali Khan', 1750000, 'Qualified', 35, '2027-01-15'::date, 'At Risk', array['Manufacturing', 'ISO 45001']::text[], 'Budget approval pending from the board.', null, null, null, null, now() - interval '3 minutes', now() - interval '3 minutes'),
  ('deal-001', 'Cascade Retail Grp — ISO 9001 Renewal', 'Cascade Retail Grp', 'Amelia Hart', 'Renee Foster', 2100000, 'Negotiation', 92, '2026-10-31'::date, 'Active', array['Retail', 'Renewal', 'High Priority']::text[], 'Multi-site audit covering 5 distribution hubs in Chicago and Dallas.', null, null, null, null, now() - interval '4 minutes', now() - interval '4 minutes'),
  ('deal-002', 'Vantage Retail — QMS Expansion', 'Vantage Retail Group', 'Marco Diaz', 'Marco Diaz', 1425000, 'Proposal', 68, '2026-11-15'::date, 'Active', array['Retail', 'Expansion']::text[], 'Expanding supplier scorecard module across 40 vendors.', null, null, null, null, now() - interval '5 minutes', now() - interval '5 minutes'),
  ('deal-003', 'Northwind Corp — ISO 14001 Implementation', 'Northwind Engineering Corp', 'Marcus Lee', 'Renee Foster', 960000, 'Closed Won', 100, '2026-10-10'::date, 'Won', array['Engineering', 'New Business']::text[], 'Full environmental standard deployment with on-site auditor training.', null, null, null, null, now() - interval '6 minutes', now() - interval '6 minutes'),
  ('deal-004', 'Meridian Labs — Lab Calibration System', 'Meridian Labs & Diagnostics', 'Dr. Kamran Hussain', 'Marco Diaz', 542000, 'Qualified', 54, '2026-11-30'::date, 'Active', array['Medtech', 'Watching']::text[], 'Automated calibration tracking for precision bio-analyzers.', null, null, null, null, now() - interval '7 minutes', now() - interval '7 minutes'),
  ('deal-005', 'BrightPath Inc — Quality Academy Cohort', 'BrightPath Learning Inc', 'Carlos Mendez', 'Carlos Mendez', 278000, 'Closed Won', 100, '2026-10-05'::date, 'Won', array['Education', 'Closed Won']::text[], 'Access for 100 corporate learners to ISO 9001 and Six Sigma curricula.', null, null, null, null, now() - interval '8 minutes', now() - interval '8 minutes'),
  ('deal-006', 'Premier Foods — FSSC 22000 Food Safety Package', 'Premier Foods Pakistan', 'Rashid Mehmood', 'Fatima Zahra', 2200000, 'Proposal', 60, '2026-11-20'::date, 'Active', array['Food Safety', 'HACCP']::text[], 'Complete food safety management system implementation and audit prep.', null, null, null, null, now() - interval '9 minutes', now() - interval '9 minutes'),
  ('deal-007', 'PharmaCare — GMP Compliance Package', 'PharmaCare Solutions Ltd', 'Samira Khan', 'Omar Farooq', 3500000, 'Closed Won', 100, '2026-10-08'::date, 'Won', array['Pharma', 'GMP']::text[], 'GMP validation and cleanroom quality management suite.', null, null, null, null, now() - interval '10 minutes', now() - interval '10 minutes'),
  ('deal-008', 'Apex Precision — ISO 17025 Testing Lab Setup', 'Apex Precision Engineering', 'Naeem Akhtar', 'Sarah Ahmed', 2800000, 'Lead', 25, '2026-12-15'::date, 'Active', array['Testing Lab', 'Hot Lead']::text[], 'Laboratory accreditation assistance and precision gage calibration.', null, null, null, null, now() - interval '11 minutes', now() - interval '11 minutes'),
  ('deal-009', 'Orbit Logistics — Fleet QA Assessment', 'Orbit Logistics Ltd', 'Waqar Ali', 'Nora Whitfield', 278000, 'Negotiation', 22, '2026-10-25'::date, 'At Risk', array['Logistics', 'At Risk']::text[], 'Budget freeze reported by CFO. Awaiting re-evaluation.', null, null, null, null, now() - interval '12 minutes', now() - interval '12 minutes')
on conflict (id) do nothing;
