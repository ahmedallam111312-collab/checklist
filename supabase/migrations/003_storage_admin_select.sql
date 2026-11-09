-- 003_storage_admin_select.sql
-- Grant admin SELECT policy on storage.objects for bucket 'site-images'.
-- Supabase Storage client-side and session operations (such as storage.from('site-images').remove()
-- or list()) require SELECT permissions on storage.objects to resolve and verify file paths.
-- This ensures deletes succeed using the authenticated admin session without service_role bypass.

create policy "admin select site images" on storage.objects
  for select to authenticated
  using (bucket_id = 'site-images' and public.is_admin());
