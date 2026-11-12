-- ============================================================================
-- Meridian CRM — profile photos + tighter team-list access
--
-- Run AFTER roles.sql: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run.
-- ============================================================================

-- Only Admin, CEO and Manager may read the team list (Employees see only themselves).
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.app_role() in ('Admin', 'CEO', 'Manager'));

-- ---------------------------------------------------------------------------
-- Profile photos
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text not null default '';

-- Public bucket (photos are shown with a plain <img> URL), images only, max 2 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Each active user may only write inside their own folder: avatars/<their user id>/...
drop policy if exists "avatars_read_own" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_read_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.app_role() is not null);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.app_role() is not null);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
