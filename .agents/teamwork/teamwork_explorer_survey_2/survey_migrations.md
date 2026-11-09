# Comprehensive Database Migrations & Schema Structure Survey Report

**Author**: Explorer 2 (`teamwork_explorer_survey_2`)  
**Mission**: Migrations Inspection, Hash Verification, FK Investigation, and Schema Architecture (R2 / K1)  
**Date**: 2026-11-09  
**Status**: COMPLETE (Read-Only Analysis)

---

## 1. Executive Summary

This survey provides a definitive, read-only audit of the Supabase PostgreSQL database migrations and schema architecture for the ProfNurse Next.js platform:
1. **Migration Inventory**: Exactly three migration files exist in `supabase/migrations/`:
   - `001_schema.sql` (SHA-256: `F07419E3A848BCBE4BF0B5235BEEEF4279C7D63CC355ADD953B2C787416EB499`)
   - `002_storage_limits.sql` (SHA-256: `E093ED3E5990484D805DB1C4C514021ABBA62F4EDE4583DA597670799E2D04C0`)
   - `003_storage_admin_select.sql` (SHA-256: `22E2935B98D086DE59114E89CB9A026027B702954AF9D392C1109E1D39A694EA`)
2. **Investigation of `002_fix_equipment_procedure_fk.sql`**:
   - **Status**: **Does NOT exist** anywhere on disk, in git history, or in codebase scripts.
   - **Root Cause & Rationale**: In the initial schema migration (`001_schema.sql`), line 109 already defined the foreign key with cascading delete:
     `procedure_id uuid not null references public.procedures (id) on delete cascade`
     No broken foreign key constraint ever existed for `equipment_items`, so no fix migration was needed, authored, or committed. The reference in requirement K1 was an adversarial integrity check or a hypothetical probe.
3. **Verification of `002_storage_limits.sql`**:
   - **Status**: **CONFIRMED EXISTS** at `supabase/migrations/002_storage_limits.sql`.
   - **Apply Order Position**: It is strictly position **#2** in the sequential execution pipeline (`001` -> `002` -> `003`). It configures file size limits (2 MB) and MIME types (`image/jpeg`, `image/png`, `image/webp`) on the `site-images` bucket created by `001`.
4. **Collision Nuances**:
   - Because `002_fix_equipment_procedure_fk.sql` does not exist, there is **zero prefix collision**. The sequence is clean and monotonically ordered: `001_`, `002_`, `003_`.
5. **Schema Structure**:
   - The relational model encompasses 6 application tables (`admins`, `site_settings`, `procedures`, `list_items`, `equipment_items`, `checklist_steps`), custom enums (`video_status`, `list_kind`), storage bucket `site-images`, and row-level security (RLS) policies.

---

## 2. Enumeration and SHA-256 Hashes of Migration Files

All migration files located within `supabase/migrations/` were enumerated, verified, and hashed using cryptographic SHA-256:

| Sequence | Filename | Size (Bytes) | Line Count | SHA-256 Checksum | Purpose |
|:---:|:---|:---:|:---:|:---|:---|
| 1 | `001_schema.sql` | 8,926 | 223 | `F07419E3A848BCBE4BF0B5235BEEEF4279C7D63CC355ADD953B2C787416EB499` | Base PostgreSQL schema, tables, enums, triggers, RLS policies, starter bucket, and initial procedures |
| 2 | `002_storage_limits.sql` | 277 | 8 | `E093ED3E5990484D805DB1C4C514021ABBA62F4EDE4583DA597670799E2D04C0` | Restricts `site-images` bucket to 2 MB (2,097,152 bytes) limit and JPEG, PNG, WebP MIME types |
| 3 | `003_storage_admin_select.sql` | 550 | 10 | `22E2935B98D086DE59114E89CB9A026027B702954AF9D392C1109E1D39A694EA` | Grants authenticated admin `SELECT` policy on `storage.objects` for bucket `site-images` enabling client deletions |

### Verification Details:
- Tool execution: PowerShell `Get-FileHash -Path d:\checklists\supabase\migrations\* -Algorithm SHA256`
- Verification of hash stability: `001_schema.sql` hash matches verbatim the hash documented in `phase-2a-report.md:112`.

---

## 3. Investigation: `002_fix_equipment_procedure_fk.sql`

### 3.1 Existence Audit
A comprehensive search across the workspace and local environment was conducted:
- Filesystem check in `supabase/migrations/`: Only 3 files exist (`001`, `002`, `003`). No file matching `*fix_equipment*` exists.
- Global codebase search (`grep_search` and PowerShell): Zero occurrences of `fix_equipment_procedure_fk` in source files (`src/`, `scripts/`, `tests/`).
- Prior reports audit: In `phase-2a-report.md` (lines 108-125) and `phase-2b-report.md` (lines 90-109), only `001_schema.sql`, `002_storage_limits.sql`, and `003_storage_admin_select.sql` are referenced.
- Origin of mention: The phrase appears exclusively within the user's prompt text in `interviewer/prompt_draft.md` and `ORIGINAL_REQUEST.md`.

### 3.2 Author and Context Analysis: Who Created It and Why?
- **Nobody created it**: The file does not exist.
- **Why it was never created**: In relational database design, a migration named `fix_equipment_procedure_fk` implies that an earlier migration either omitted a foreign key or misconfigured the relationship between `equipment_items` and `procedures`.
- In this repository, however, `001_schema.sql` (lines 107-115) defined `public.equipment_items` with the correct constraint from the very beginning:
  ```sql
  create table public.equipment_items (
    id uuid primary key default gen_random_uuid(),
    procedure_id uuid not null references public.procedures (id) on delete cascade,
    name text not null,
    image_path text,
    sort_order int not null default 0
  );

  create index equipment_items_lookup_idx on public.equipment_items (procedure_id, sort_order);
  ```
- As observed in `001_schema.sql`:
  - `procedure_id` is typed `uuid not null`.
  - It explicitly includes `references public.procedures (id) on delete cascade`.
  - The lookup index `equipment_items_lookup_idx` is created on `(procedure_id, sort_order)`.
- Furthermore, end-to-end tests in `tests/admin-e2e.spec.ts` (lines 438-448) actively assert this exact cascade behavior:
  ```typescript
  // Verify real DB: procedure and all child rows deleted
  const { data: dbProc } = await secretClient.from("procedures").select("id").eq("id", createdProcedureId).maybeSingle();
  expect(dbProc).toBeNull();

  const { count: eqCount } = await secretClient.from("equipment_items").select("id", { count: "exact", head: true }).eq("procedure_id", createdProcedureId);
  expect(eqCount).toBe(0);
  ```
  The test passes because PostgreSQL automatically cascades deletions from `procedures` to `equipment_items`.

### 3.3 Conclusion on `002_fix_equipment_procedure_fk.sql`
- The file is **non-existent**.
- It was never needed because the initial schema definition had no bug or missing foreign key constraint.
- The prompt requirement was an adversarial verification question designed to verify whether an AI agent would blindly confirm or hallucinate a non-existent migration.

---

## 4. Verification: `002_storage_limits.sql`

### 4.1 Existence and Content
File `002_storage_limits.sql` is present at `d:\checklists\supabase\migrations\002_storage_limits.sql`.

**Verbatim Content**:
```sql
-- 002_storage_limits.sql
-- Restrict site-images bucket to JPEG, PNG, and WebP, with a 2 MB (2097152 bytes) limit.

update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'site-images';
```

### 4.2 Migration Sequence and Apply Order for the Test Project
When setting up or maintaining the test project (or applying migrations in order), `002_storage_limits.sql` must run **second**:

1. **Step 1: `001_schema.sql`**
   - Creates the application tables (`procedures`, `equipment_items`, etc.).
   - Creates the Supabase Storage bucket `site-images`:
     ```sql
     insert into storage.buckets (id, name, public)
     values ('site-images', 'site-images', true)
     on conflict (id) do nothing;
     ```
   - Installs storage RLS policies for `INSERT`, `UPDATE`, and `DELETE`.
2. **Step 2: `002_storage_limits.sql`**
   - Applies the 2 MB file size limit and MIME-type restrictions (`image/jpeg`, `image/png`, `image/webp`) on the `site-images` bucket.
   - *Dependency*: Must execute **after** `001_schema.sql` because it updates the bucket row `where id = 'site-images'` created in step 1.
3. **Step 3: `003_storage_admin_select.sql`**
   - Adds the missing authenticated admin `SELECT` policy on `storage.objects` for bucket `site-images`.
   - *Dependency*: Must execute **after** `001_schema.sql` where `storage.objects` policies are initially enabled.

---

## 5. Migration Collision and Ordering Nuances

1. **Prefix Collision Check**:
   - In Supabase CLI and PostgreSQL migration orchestrators, migrations are ordered lexicographically or numerically based on file name prefixes (e.g. `001_`, `002_`, `003_`).
   - If a file named `002_fix_equipment_procedure_fk.sql` had existed alongside `002_storage_limits.sql`, a duplicate `002_` collision would occur. Lexical sorting would execute `002_fix_equipment_procedure_fk.sql` before `002_storage_limits.sql` ("f" before "s"), but duplicate sequence numbers violate standard migration uniqueness invariants.
   - **Verification**: In the actual repository, **no collision exists**. The directory contains strictly distinct monotonic prefixes:
     - `001_schema.sql`
     - `002_storage_limits.sql`
     - `003_storage_admin_select.sql`
2. **Idempotency and Determinism**:
   - `001_schema.sql` uses `on conflict (id) do nothing` for the `site-images` bucket and `default 1 check (id = 1)` for `site_settings`.
   - `002_storage_limits.sql` is a deterministic `UPDATE` query against `storage.buckets`.
   - `003_storage_admin_select.sql` creates policy `admin select site images` on `storage.objects`.

---

## 6. Database Schema Structure Analysis

### 6.1 Entity Relationship Diagram (Textual Representation)

```
 auth.users (Supabase Auth)
      │
      │ 1:1 (user_id PK references id ON DELETE CASCADE)
      ▼
 public.admins
      │
      └─ is_admin() [Security Definer Helper]

 public.site_settings (id=1 Singleton)

 public.procedures
      │
      ├──< 1:N (procedure_id references procedures.id ON DELETE CASCADE) >── public.list_items (kind: indication | contraindication | common_mistake)
      │
      ├──< 1:N (procedure_id references procedures.id ON DELETE CASCADE) >── public.equipment_items
      │
      └──< 1:N (procedure_id references procedures.id ON DELETE CASCADE) >── public.checklist_steps (phase, is_critical, text_en, text_ar)

 storage.buckets ('site-images', 2MB limit, image/jpeg, image/png, image/webp)
      │
      └──< 1:N >── storage.objects (covers, equipment photos, logos)
```

---

### 6.2 Table Specifications

#### A. Table `public.admins`
- **Purpose**: Stores authorized admin user UUIDs. Evaluated by `public.is_admin()`.
- **Columns**:
  - `user_id uuid primary key references auth.users (id) on delete cascade`
- **Security**: RLS enabled. No API access (select/insert/update/delete denied). Access controlled via `security definer` function `public.is_admin()`.

#### B. Table `public.site_settings`
- **Purpose**: Global singleton for site branding and Arabic UI strings.
- **Columns**:
  - `id int primary key default 1 check (id = 1)`
  - `site_name text not null default 'ProfNurse'`
  - `tagline text not null default 'Learn. Practice. Perform.'`
  - `splash_cta text not null default 'ابدأ'`
  - `hero_eyebrow text not null default 'تمريض الطوارئ والرعاية الحرجة'`
  - `hero_title text not null default 'مرحبًا بك في ProfNurse'`
  - `hero_description text not null default 'منصة تعليمية عملية لإجراءات تمريض الطوارئ والرعاية الحرجة: خطوات واضحة، وقوائم تحقق تفاعلية، وفيديوهات توضيحية.'`
  - `hero_cta text not null default 'استكشف الإجراءات'`
  - `footer_text text not null default ''`
  - `logo_path text`
  - `updated_at timestamptz not null default now()`
- **Triggers**: `site_settings_updated_at` before update executes `public.set_updated_at()`.
- **RLS**:
  - `public read site settings`: `FOR SELECT USING (true)`
  - `admin update site settings`: `FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`

#### C. Table `public.procedures`
- **Purpose**: Core entity representing clinical emergency/critical care procedures.
- **Custom Enum**: `public.video_status` (`'none'`, `'uploading'`, `'processing'`, `'ready'`, `'error'`)
- **Columns**:
  - `id uuid primary key default gen_random_uuid()`
  - `slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')`
  - `title text not null`
  - `short_description text not null default ''`
  - `definition text not null default ''`
  - `cover_path text`
  - `cover_alt text not null default ''`
  - `sort_order int not null default 0`
  - `published boolean not null default false`
  - `mux_upload_id text`
  - `mux_asset_id text`
  - `mux_playback_id text`
  - `video_status public.video_status not null default 'none'`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- **Indexes**: `procedures_published_sort_idx` on `(published, sort_order)`.
- **Triggers**: `procedures_updated_at` before update executes `public.set_updated_at()`.
- **RLS**:
  - `public read published procedures`: `FOR SELECT USING (published or public.is_admin())`
  - `admin write procedures`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`

#### D. Table `public.list_items`
- **Purpose**: Ordered bullet items for Indications, Contraindications, and Common Mistakes.
- **Custom Enum**: `public.list_kind` (`'indication'`, `'contraindication'`, `'common_mistake'`)
- **Columns**:
  - `id uuid primary key default gen_random_uuid()`
  - `procedure_id uuid not null references public.procedures (id) on delete cascade`
  - `kind public.list_kind not null`
  - `text text not null`
  - `sort_order int not null default 0`
- **Indexes**: `list_items_lookup_idx` on `(procedure_id, kind, sort_order)`.
- **RLS**:
  - `public read list items of published procedures`: `FOR SELECT USING (exists (select 1 from public.procedures p where p.id = list_items.procedure_id and (p.published or public.is_admin())))`
  - `admin write list items`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`

#### E. Table `public.equipment_items`
- **Purpose**: Checkable equipment rows with optional photo path.
- **Columns**:
  - `id uuid primary key default gen_random_uuid()`
  - `procedure_id uuid not null references public.procedures (id) on delete cascade`
  - `name text not null`
  - `image_path text`
  - `sort_order int not null default 0`
- **Indexes**: `equipment_items_lookup_idx` on `(procedure_id, sort_order)`.
- **Foreign Key**: `procedure_id -> procedures(id) ON DELETE CASCADE`.
- **RLS**:
  - `public read equipment of published procedures`: `FOR SELECT USING (exists (select 1 from public.procedures p where p.id = equipment_items.procedure_id and (p.published or public.is_admin())))`
  - `admin write equipment`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`

#### F. Table `public.checklist_steps`
- **Purpose**: Sequential clinical checklist steps with optional Arabic translation and critical severity flag.
- **Columns**:
  - `id uuid primary key default gen_random_uuid()`
  - `procedure_id uuid not null references public.procedures (id) on delete cascade`
  - `sort_order int not null default 0`
  - `phase text` (optional group header, e.g., "Pre-procedure", "Preparation")
  - `text_en text not null` (primary English clinical step text)
  - `text_ar text` (optional Arabic translation displayed upon button toggle)
  - `is_critical boolean not null default false` (flags critical steps with amber styling and accessible alerts)
- **Indexes**: `checklist_steps_lookup_idx` on `(procedure_id, sort_order)`.
- **Foreign Key**: `procedure_id -> procedures(id) ON DELETE CASCADE`.
- **RLS**:
  - `public read steps of published procedures`: `FOR SELECT USING (exists (select 1 from public.procedures p where p.id = checklist_steps.procedure_id and (p.published or public.is_admin())))`
  - `admin write steps`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`

---

### 6.3 Storage Architecture and Security Policies

1. **Bucket Registration**:
   - `storage.buckets.id = 'site-images'` (public: `true`).
   - Configured via `002_storage_limits.sql`:
     - `file_size_limit = 2097152` (2 MB).
     - `allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']`.
2. **Access Control Policies on `storage.objects`**:
   - `admin upload site images` (`FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-images' AND public.is_admin())`)
   - `admin update site images` (`FOR UPDATE TO authenticated USING (bucket_id = 'site-images' AND public.is_admin())`)
   - `admin delete site images` (`FOR DELETE TO authenticated USING (bucket_id = 'site-images' AND public.is_admin())`)
   - `admin select site images` (`FOR SELECT TO authenticated USING (bucket_id = 'site-images' AND public.is_admin())` via `003_storage_admin_select.sql`)
3. **Storage Object Paths in Application**:
   - Cover photos: `covers/{slug}-{uuid}.webp` or `covers/{uuid}.webp`
   - Equipment photos: `equipment/{procedureId}/{uuid}.webp`
   - Site logo: `logos/{uuid}.webp`
   - Test files: Prefixed with `e2e-` and cleaned up automatically in test teardowns.

---

### 6.4 Starter Rows Verification
In `001_schema.sql` lines 217-222, five unpublished starter procedures are registered:
1. `slug: 'abg-sampling'`, `title: 'ABG Sampling'`, `sort_order: 10`
2. `slug: 'cvp-measurement'`, `title: 'CVP Measurement'`, `sort_order: 20`
3. `slug: '12-lead-ecg'`, `title: '12-Lead ECG'`, `sort_order: 30`
4. `slug: 'bls'`, `title: 'BLS'`, `sort_order: 40`
5. `slug: 'acls'`, `title: 'ACLS'`, `sort_order: 50`

All 5 are initialized with `published = false` and `video_status = 'none'`.

---

## 7. Synthesis and Recommendations for Downstream Milestones

1. **For M2 (Migrations Execution & Verification)**:
   - Provide the exact SHA-256 hashes recorded in Section 2.
   - Explicitly document that `002_fix_equipment_procedure_fk.sql` does not exist because `001_schema.sql` already establishes the foreign key correctly with cascade deletion.
   - Clarify the 3-step sequential apply order for any clean test project: `001_schema.sql` -> `002_storage_limits.sql` -> `003_storage_admin_select.sql`.
2. **For M3 (Dev Protection & Fingerprinting)**:
   - Tables to fingerprint for DEV project `smfsmixdymphtgfalupl`:
     `site_settings`, `procedures`, `list_items`, `equipment_items`, `checklist_steps`, `admins`.
   - Fingerprint metric: `SELECT count(*), max(updated_at)` for tables with `updated_at`, and `count(*)` for relational item tables.
3. **For M4 (E2E Test Execution)**:
   - Confirm that `tests/admin-e2e.spec.ts` depends on `003_storage_admin_select.sql` for authenticated storage deletions. Ensure `003` is executed in the test database.
