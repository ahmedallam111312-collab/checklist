-- ProfNurse database schema (Supabase / Postgres)
-- Run ONCE on a fresh Supabase project (SQL editor or migration).
--
-- Before running:
--   1. Supabase dashboard > Authentication > disable "Allow new users to sign up".
--   2. Create the single admin user manually (Authentication > Users > Add user).
-- After running:
--   3. Register that user as admin (replace the UUID with the user's id):
--        insert into public.admins (user_id) values ('00000000-0000-0000-0000-000000000000');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Site settings (single row). Arabic UI copy that admins may edit.
-- ---------------------------------------------------------------------------

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'ProfNurse',
  tagline text not null default 'Learn. Practice. Perform.',
  splash_cta text not null default 'ابدأ',
  hero_eyebrow text not null default 'تمريض الطوارئ والرعاية الحرجة',
  hero_title text not null default 'مرحبًا بك في ProfNurse',
  hero_description text not null default 'منصة تعليمية عملية لإجراءات تمريض الطوارئ والرعاية الحرجة: خطوات واضحة، وقوائم تحقق تفاعلية، وفيديوهات توضيحية.',
  hero_cta text not null default 'استكشف الإجراءات',
  footer_text text not null default '',
  logo_path text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1);

create trigger site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Procedures. All procedure content is English. One video per procedure.
-- Each suction type is its own procedure (no sub-types).
-- ---------------------------------------------------------------------------

create type public.video_status as enum ('none', 'uploading', 'processing', 'ready', 'error');

create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  short_description text not null default '',
  definition text not null default '',
  cover_path text,
  cover_alt text not null default '',
  sort_order int not null default 0,
  published boolean not null default false,
  mux_upload_id text,
  mux_asset_id text,
  mux_playback_id text,
  video_status public.video_status not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index procedures_published_sort_idx on public.procedures (published, sort_order);

create trigger procedures_updated_at
before update on public.procedures
for each row execute function public.set_updated_at();

-- Indications, contraindications and common mistakes (ordered bullet items).
create type public.list_kind as enum ('indication', 'contraindication', 'common_mistake');

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures (id) on delete cascade,
  kind public.list_kind not null,
  text text not null,
  sort_order int not null default 0
);

create index list_items_lookup_idx on public.list_items (procedure_id, kind, sort_order);

create table public.equipment_items (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures (id) on delete cascade,
  name text not null,
  image_path text,
  sort_order int not null default 0
);

create index equipment_items_lookup_idx on public.equipment_items (procedure_id, sort_order);

-- Checklist steps. text_en is the English step; text_ar is the optional Arabic
-- translation shown by the per-step button. is_critical marks steps flagged as
-- important in the source material. phase is an optional group heading
-- (for example "Preparation"), confirm once the checklist photos arrive.
create table public.checklist_steps (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures (id) on delete cascade,
  sort_order int not null default 0,
  phase text,
  text_en text not null,
  text_ar text,
  is_critical boolean not null default false
);

create index checklist_steps_lookup_idx on public.checklist_steps (procedure_id, sort_order);

-- ---------------------------------------------------------------------------
-- Row level security
-- Public: read published content only. Admin: full access.
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.procedures enable row level security;
alter table public.list_items enable row level security;
alter table public.equipment_items enable row level security;
alter table public.checklist_steps enable row level security;

-- admins: nobody reads or writes through the API (is_admin() is security definer).

-- site_settings
create policy "public read site settings" on public.site_settings
  for select using (true);
create policy "admin update site settings" on public.site_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- procedures
create policy "public read published procedures" on public.procedures
  for select using (published or public.is_admin());
create policy "admin write procedures" on public.procedures
  for all using (public.is_admin()) with check (public.is_admin());

-- list_items
create policy "public read list items of published procedures" on public.list_items
  for select using (
    exists (
      select 1 from public.procedures p
      where p.id = list_items.procedure_id and (p.published or public.is_admin())
    )
  );
create policy "admin write list items" on public.list_items
  for all using (public.is_admin()) with check (public.is_admin());

-- equipment_items
create policy "public read equipment of published procedures" on public.equipment_items
  for select using (
    exists (
      select 1 from public.procedures p
      where p.id = equipment_items.procedure_id and (p.published or public.is_admin())
    )
  );
create policy "admin write equipment" on public.equipment_items
  for all using (public.is_admin()) with check (public.is_admin());

-- checklist_steps
create policy "public read steps of published procedures" on public.checklist_steps
  for select using (
    exists (
      select 1 from public.procedures p
      where p.id = checklist_steps.procedure_id and (p.published or public.is_admin())
    )
  );
create policy "admin write steps" on public.checklist_steps
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: public bucket for procedure photos, equipment photos and the logo.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "admin upload site images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-images' and public.is_admin());

create policy "admin update site images" on storage.objects
  for update to authenticated
  using (bucket_id = 'site-images' and public.is_admin());

create policy "admin delete site images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Starter procedures (unpublished, no clinical content).
-- Suction types are added later from the admin dashboard, one procedure each.
-- ---------------------------------------------------------------------------

insert into public.procedures (slug, title, sort_order) values
  ('abg-sampling', 'ABG Sampling', 10),
  ('cvp-measurement', 'CVP Measurement', 20),
  ('12-lead-ecg', '12-Lead ECG', 30),
  ('bls', 'BLS', 40),
  ('acls', 'ACLS', 50);
