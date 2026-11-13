-- 004_video.sql
-- Video pipeline schema updates:
-- Supports Mux direct upload, signed playback, processing status tracking, and error reporting.

-- 1. Extend video_status enum to include 'errored' if not present
alter type public.video_status add value if not exists 'errored';

-- 2. Ensure all video columns exist on public.procedures
alter table public.procedures
  add column if not exists mux_upload_id text,
  add column if not exists mux_asset_id text,
  add column if not exists mux_playback_id text,
  add column if not exists video_status public.video_status not null default 'none',
  add column if not exists video_duration_seconds numeric(10, 2),
  add column if not exists video_error text,
  add column if not exists video_updated_at timestamptz default now();

-- 3. Add an index for quick video asset lookups and usage aggregation
create index if not exists procedures_mux_asset_idx on public.procedures (mux_asset_id) where mux_asset_id is not null;
create index if not exists procedures_video_status_idx on public.procedures (video_status);
