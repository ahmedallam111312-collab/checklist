-- 002_storage_limits.sql
-- Restrict site-images bucket to JPEG, PNG, and WebP, with a 2 MB (2097152 bytes) limit.

update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'site-images';
