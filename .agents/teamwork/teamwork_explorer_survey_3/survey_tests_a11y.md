# Comprehensive Survey Report: Test Environment Isolation, DEV Protection, Test Suites & Accessibility

**Date**: 2026-11-09T13:00:00Z  
**Author**: Teamwork Explorer (Explorer 3)  
**Workspace**: `d:\checklists`  
**Target Areas**: R3 / K2 (Environment Isolation & DEV Fingerprinting), R4 / K3 (Test Suite Enumeration & Readiness), R6 / K5 / T7, T8/T10 (Accessibility, Keyboard Navigation & Screenshot Matrix)

---

## Executive Summary

1. **Environment Isolation Flaw Identified**: Next.js by default runs `npm run start` (`next start`) with `NODE_ENV=production`. Under `production`, Next.js's `@next/env` package eagerly loads `.env.local` if present, overriding baseline variables. Currently, `.env.local` points to the production/DEV Supabase project (`smfsmixdymphtgfalupl`). Furthermore, `.next/static/chunks/612-d4daca1464642438.js` currently has the DEV project ref `smfsmixdymphtgfalupl` baked into client JavaScript.
2. **Guaranteed Isolation Solution**: Setting `NODE_ENV=test` inside Playwright's `playwright.config.ts` and in `webServer.env` guarantees that Next.js `@next/env` excludes `.env.local` entirely (`d !== "test" && ".env.local"` evaluates to `false`). In addition, re-building the Next.js application (`next build`) with `NODE_ENV=test` and `.env.test` ensures client-side bundles inline the TEST Supabase project URL and never contact DEV.
3. **DEV Database Fingerprint Verified (Read-Only)**: Empirical read-only queries against DEV project (`smfsmixdymphtgfalupl`) establish the pristine baseline:
   - `procedures`: 5 rows (`max(updated_at)` = `2026-11-09T10:46:41.175829+00:00`)
   - `checklist_steps`: 0 rows
   - `equipment_items`: 0 rows
   - `list_items`: 0 rows
   - `site_settings`: 1 row (`max(updated_at)` = `2026-11-07T08:58:07.905344+00:00`)
   - `admins`: 1 row
   - `e2e-*` procedures: 0 rows
   - `site-images` storage objects: 0 files (0 `e2e-*`)
   A global setup script capturing these values before tests and a global teardown script asserting identical values afterwards guarantees 100% DEV safety.
4. **Test Suites Enumerated**:
   - **4 Playwright E2E suites**: `tests/verification.spec.ts` (Phase 0/1 public), `tests/admin-verification.spec.ts` (Phase 2A admin), `tests/admin-security.spec.ts` (Phase 2A security & RLS), `tests/admin-e2e.spec.ts` (Phase 2B lifecycle). All 4 suites enforce `assertTestDataSafety()` at module load time.
   - **7 Unit test files** (`tests/unit/*.test.ts`) comprising 50 unit tests: all 50 currently pass cleanly via `npm run test:unit`.
5. **Accessibility & Screenshot Matrix Plan**:
   - Identified gaps in existing axe-core coverage: existing tests audited page-level containers but omitted `EquipmentTab`, `ChecklistTab`, the Bulk Import Modal dialog (`[role='dialog']`), Replace-All confirmation, and Delete Procedure dialog.
   - Defined precise routes, component selectors, and interaction flows for the 24 required screenshots (6 target states × 4 viewport/theme combinations).
   - Documented full keyboard-only interaction flows for reordering, bulk import, and procedure deletion.

---

## 1. Test Environment Isolation and DEV Protection (R3 / K2)

### 1.1 Architecture Analysis of `playwright.config.ts` and Next.js Env Loading

`playwright.config.ts` currently contains:
```ts
// File: d:\checklists\playwright.config.ts, lines 1-24
import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
```

#### How `@next/env` Evaluates Environment Files
Inspecting `node_modules/@next/env/dist/index.js` (line 1):
```javascript
const c = process.env.NODE_ENV === "test";
const d = c ? "test" : n ? "development" : "production";
const f = [
  `.env.${d}.local`,
  d !== "test" && `.env.local`,
  `.env.${d}`,
  ".env"
].filter(Boolean);
```

| `NODE_ENV` Value | Target `d` | Files Evaluated in Priority Order | Includes `.env.local`? |
| :--- | :--- | :--- | :--- |
| `development` (or default `next dev`) | `"development"` | `.env.development.local`, `.env.local`, `.env.development`, `.env` | **YES** |
| `production` (default `next start`, `next build`) | `"production"` | `.env.production.local`, `.env.local`, `.env.production`, `.env` | **YES** |
| `test` | `"test"` | `.env.test.local`, `.env.test`, `.env` | **STRICTLY NO** (`d !== "test"` is `false`) |

#### The Client-Side Bundle Inlining Risk
Next.js inlines all `process.env.NEXT_PUBLIC_*` variables at **build time** into the client JavaScript bundles created in `.next/static`.
- Verified empirical fact: `.next\static\chunks\612-d4daca1464642438.js` contains `smfsmixdymphtgfalupl` (the DEV Supabase project ref).
- If `webServer` merely starts the existing build without re-building under `.env.test`, the client browser will download JavaScript pointing directly to DEV!
- Therefore, `next build` MUST be run with `NODE_ENV=test` and `.env.test` loaded prior to launching tests, or the test runner will fail `assertTestDataSafety()` and risk DEV contamination.

### 1.2 Recommended Hardened `playwright.config.ts` Configuration

To guarantee that Next.js and Playwright strictly load `.env.test` and never touch `.env.local`:

```ts
import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import path from "path";
import fs from "fs";

// 1. Force NODE_ENV to "test" BEFORE loading env config
process.env.NODE_ENV = "test";

// 2. Load env config in test mode (strictly loads .env.test.local, .env.test, .env; skips .env.local)
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx next start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NODE_ENV: "test",
      PORT: "3000",
      // Pass all test environment variables explicitly
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || "",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_USE_DEMO_DATA: "false",
      E2E_ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL || "",
      E2E_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD || "",
    },
  },
});
```

### 1.3 DEV Project Fingerprinting Architecture (`smfsmixdymphtgfalupl`)

The DEV project ref `smfsmixdymphtgfalupl` is extracted from `.env.local`.
To guarantee zero dev mutations without polluting `.agents/teamwork` or modifying existing files:

#### Read-Only Baseline Fingerprint (Captured 2026-11-09T12:59:10Z)

| Table | Current Row Count | Max `updated_at` | Notes |
| :--- | :--- | :--- | :--- |
| `public.procedures` | 5 | `2026-11-09T10:46:41.175829+00:00` | Baseline clinical procedures |
| `public.checklist_steps` | 0 | `null` | No steps currently attached to dev rows |
| `public.equipment_items` | 0 | `null` | No equipment rows in dev |
| `public.list_items` | 0 | `null` | No indications/contraindications |
| `public.site_settings` | 1 | `2026-11-07T08:58:07.905344+00:00` | Singleton settings row |
| `public.admins` | 1 | `null` | Single admin user link |
| `e2e-*` Procedures | 0 | `null` | **Zero test rows present** |
| `storage.objects` (`site-images`) | 0 | `null` | **Zero storage files** |

#### Implementation Architecture for `tests/global-setup.ts` & `tests/global-teardown.ts`:
1. **`globalSetup`**:
   - Parses `.env.local` to read DEV credentials (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`).
   - Verifies DEV project ref equals `smfsmixdymphtgfalupl`.
   - Executes `select count(*)` and `select max(updated_at)` for all 6 tables plus storage.
   - Asserts `e2eProceduresCount === 0`.
   - Writes the fingerprint snapshot to a temporary file (`test-results/dev-fingerprint-before.json`).
2. **`globalTeardown`**:
   - Queries DEV database again using identical read-only queries.
   - Compares the `after` state against `before` state.
   - Throws a hard test failure if:
     * Any table row count differs.
     * Any table max `updated_at` differs.
     * Any procedure with `slug LIKE 'e2e-%'` exists.
     * Any storage file prefixed with `e2e-` exists.

---

## 2. Test Suite Enumeration and Execution Readiness (R4 / K3)

### 2.1 Playwright E2E Test Suites (`tests/*.spec.ts`)

| Suite File | Estimated Runtime | Safety Guard | Core Areas Tested |
| :--- | :--- | :--- | :--- |
| `tests/verification.spec.ts` | ~45s - 90s | `assertTestDataSafety()` | Phase 0 & 1 public verification: Homepage, procedures library, procedure detail (`/procedures/e2e-public-test`), Arabic RTL/LTR bidi, header sizes, critical step 4px amber border, 320px layout, keyboard checklist navigation, Axe-core audit (WCAG 2.1 AA) including video placeholder. |
| `tests/admin-verification.spec.ts` | ~60s - 120s | `assertTestDataSafety()` | Phase 2A admin quality gate: Login, dashboard, procedures editor tabs (Details, Overview, Equipment, Checklist), 320px/390px responsive masks, bidi visual ordering ('12-Lead ECG'), no Arabic-Indic digits, Axe-core audit across admin pages, keyboard reorder navigation, full admin screenshot matrix. |
| `tests/admin-security.spec.ts` | ~45s - 75s | `assertTestDataSafety()` | Phase 2A security & authorization: Unauthenticated route redirects to `/admin/login`, demo credentials rejection in real mode, server actions authorization, backup route 401 unauthenticated check, `check:secrets` hygiene, anonymous access probing across all tables (RLS enforcement), signed-in admin storage deletion via RLS. |
| `tests/admin-e2e.spec.ts` | ~90s - 150s | `assertTestDataSafety()` | Phase 2B CMS full lifecycle: Real admin login, create procedure with cover image upload, equipment tab with photo upload, checklist tab bulk import with syntax error handling, procedure publishing, public page verification, 10s revalidation check & step ID preservation, bulk import replace-all with title confirmation, JSON backup export route, `restore-backup.ts` dry-run & apply verification, procedure deletion with cascading child rows and storage cleanup. |

### 2.2 Unit Test Suites (`tests/unit/*.test.ts`)

Run via: `npm run test:unit` (`tsx --test tests/unit/**/*.test.ts`).  
Current Status: **50 / 50 Passing** (duration: ~630ms).

| Unit Test File | Tests Count | Runner | Dependencies / Prerequisites | Tested Scope |
| :--- | :---: | :--- | :--- | :--- |
| `tests/unit/test-data-safety.test.ts` | 3 | `tsx --test` | None (tests `assertTestDataSafety` and `extractProjectRef`) | Verifies URL project ref parsing and safety violation exception when `.env.test` is missing. |
| `tests/unit/build-credentials.test.ts` | 1 | `tsx --test` | Requires `.next/static` build output | Recursively scans `.next/static` JS chunks to ensure demo credentials (`admin@profnurse.local`, `AdminPass123!`) are absent. |
| `tests/unit/checklist-import.test.ts` | 25 | `tsx --test` | Pure in-memory | Tests bulk import parser: pipe delimiter, critical `!` prefix, phase `#` headers, Unicode NFC normalization, bidi override stripping (U+202A-202E, U+2066-2069), directional mark preservation (LRM, RLM, ZWJ, ZWNJ), duplicate & numbering warnings, error thresholds (500 char en/ar, 80 char phase, 200 step limit). |
| `tests/unit/reorder.test.ts` | 4 | `tsx --test` | Pure in-memory | Array position mutation, out-of-bounds guards, and 10-interval ascending `sort_order` assignment. |
| `tests/unit/resizer.test.ts` | 3 | `tsx --test` | Pure in-memory | Validates pre-upload 5 MB client limit and MIME type restriction (rejecting non-images). |
| `tests/unit/slug-and-validation.test.ts` | 11 | `tsx --test` | Pure in-memory | Kebab-case slug generator, 60 char limit, and Zod schemas for details (title 80, short_desc 200, alt 200), overview (definition 2000, items 500), settings (footer 300), equipment batch (100 items), checklist batch (200 steps). |
| `tests/unit/ui-fixes.test.ts` | 3 | `tsx --test` | Pure in-memory | Verifies Arabic text helper, correct Arabic plural rules (zero, one, two, few, many, other), and backup note spelling ('تتضمن' vs 'تضمن'). |

### 2.3 Prerequisites for E2E Test Execution Readiness
1. **Dedicated Second Supabase Project (Test DB)**:
   - Must be created on Supabase.
   - Migrations executed: `001_schema.sql`, `002_storage_limits.sql`, `003_storage_admin_select.sql`.
   - Dedicated admin user created and added to `public.admins`.
   - Public bucket `site-images` created.
2. **`.env.test` Configuration**:
   - `TEST_SUPABASE_PROJECT_REF=<test-ref>`
   - `NEXT_PUBLIC_SUPABASE_URL=https://<test-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<test-anon-key>`
   - `SUPABASE_SECRET_KEY=<test-service-role-key>`
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
   - `NEXT_PUBLIC_USE_DEMO_DATA=false`
   - `E2E_ADMIN_EMAIL=<test-admin-email>`
   - `E2E_ADMIN_PASSWORD=<test-admin-password>`
3. **Build Step**:
   - Run `npx next build` with `NODE_ENV=test` and `.env.test` loaded so client JavaScript inlines the TEST project ref.

---

## 3. Accessibility, Keyboard Navigation, and Screenshot Matrix (R6 / K5 / T7, T8/T10)

### 3.1 Axe-Core Accessibility Audit Survey & Gaps

#### Current State in Codebase
- **Public pages** (`tests/verification.spec.ts:515-551`): Scans `/`, `/home`, `/procedures`, `/procedures/e2e-public-test` in light and dark modes with tags `['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']`. Audits video placeholder explicitly.
- **Admin pages** (`tests/admin-verification.spec.ts:404-456`): Scans `/admin/login`, `/admin`, `/admin/procedures/new`, `/admin/procedures/[id]`, `/admin/settings`, `/admin/preview/[id]`.

#### Critical Gaps Identified for Phase 2B Close-out (R6)
Existing tests do NOT perform accessibility audits on:
1. **Equipment Tab** (`#tab-equipment`): Needs dedicated scan of items, photo upload triggers, and reorder buttons.
2. **Checklist Tab** (`#tab-checklist`): Needs scan of phase headers, critical step badges, Arabic translation textareas.
3. **Bulk Import Modal Dialog** (`[role='dialog']`): Needs audit while open with error alert (`role="alert"`) and preview table rendered.
4. **Replace All Confirmation Dialog State**: Needs audit of radio buttons, warning box, and confirmation text input.
5. **Delete Procedure Dialog** (`DeleteProcedureDialog.tsx`, `role="dialog"`): Needs audit of confirmation modal with `#confirm-title-input`.

### 3.2 Required Screenshot Matrix (24 Screenshots)

| Target Name Pattern | Route / Trigger | Viewport Sizes & Themes | Exact Filenames | Key UI Elements Captured |
| :--- | :--- | :--- | :--- | :--- |
| **`equipment-tab-{size}-{theme}`** | `/admin/procedures/[id]` → Click `#tab-equipment` | 390px (dark, light)<br>320px (dark)<br>1280px (dark) | `equipment-tab-390px-dark.png`<br>`equipment-tab-390px-light.png`<br>`equipment-tab-320px-dark.png`<br>`equipment-tab-1280px-dark.png` | Equipment items list, item names, photo uploaders, reorder buttons (min 44x44px), "إضافة أداة جديدة", "حفظ التعديلات". |
| **`checklist-tab-critical-arabic-phase-{size}-{theme}`** | `/admin/procedures/[id]` → Click `#tab-checklist` | 390px (dark, light)<br>320px (dark)<br>1280px (dark) | `checklist-tab-critical-arabic-phase-390px-dark.png`<br>`checklist-tab-critical-arabic-phase-390px-light.png`<br>`checklist-tab-critical-arabic-phase-320px-dark.png`<br>`checklist-tab-critical-arabic-phase-1280px-dark.png` | Phase group header (e.g. "Pre-procedure"), critical badge (`is_critical: true`), Arabic translation text field, step numbering. |
| **`import-preview-error-{size}-{theme}`** | In Checklist Tab → Click "استيراد مجمّع" → Input invalid syntax (e.g. ` \| Arabic only`) → Click "معاينة" | 390px (dark, light)<br>320px (dark)<br>1280px (dark) | `import-preview-error-390px-dark.png`<br>`import-preview-error-390px-light.png`<br>`import-preview-error-320px-dark.png`<br>`import-preview-error-1280px-dark.png` | Modal dialog (`role="dialog"`), error container (`role="alert"`), Arabic error message ("نص الخطوة باللغة الإنجليزية مطلوب"), disabled confirm button. |
| **`replace-all-confirm-{size}-{theme}`** | In Import Modal → Enter valid steps → Click "معاينة" → Select "استبدال كافة الخطوات الحالية" | 390px (dark, light)<br>320px (dark)<br>1280px (dark) | `replace-all-confirm-390px-dark.png`<br>`replace-all-confirm-390px-light.png`<br>`replace-all-confirm-320px-dark.png`<br>`replace-all-confirm-1280px-dark.png` | Red warning box (`AR_STRINGS.bulkImportConfirmReplaceWarning`), title confirmation input matching procedure title. |
| **`dashboard-backup-button-{size}-{theme}`** | `/admin` (dashboard) | 390px (dark, light)<br>320px (dark)<br>1280px (dark) | `dashboard-backup-button-390px-dark.png`<br>`dashboard-backup-button-390px-light.png`<br>`dashboard-backup-button-320px-dark.png`<br>`dashboard-backup-button-1280px-dark.png` | Top header action bar showing "تصدير نسخة احتياطية" (`/api/admin/backup`), video quota widget (e.g. "0 / 10"), procedure cards. |
| **`public-procedure-{size}-{theme}`** | `/procedures/[slug]` (published e2e procedure) | 390px (dark, light)<br>320px (dark)<br>1280px (dark) | `public-procedure-390px-dark.png`<br>`public-procedure-390px-light.png`<br>`public-procedure-320px-dark.png`<br>`public-procedure-1280px-dark.png` | Procedure detail page, expanded Equipment accordion ("الأدوات"), expanded per-step Arabic translation panel, 4px critical step border. |

### 3.3 Keyboard-Only Navigation Interaction Flows

All three required keyboard interactions were surveyed in the source components:

#### 1. Keyboard-Only Reorder Flow (`src/components/admin/ReorderableList.tsx`)
1. Admin user presses `Tab` to navigate through dashboard procedure list.
2. Focus lands on `button[aria-label*='تحريك لأسفل']` (Move Down) or `button[aria-label*='تحريك لأعلى']` (Move Up).
3. Pressing `Enter` or `Space` executes `moveDown(index)` / `moveUp(index)`.
4. The list items swap DOM order immediately; `isDirty` state becomes `true`.
5. Visible batch save bar appears with `button:has-text('حفظ الترتيب')` (`AR_STRINGS.adminReorderBatchSave`).
6. User presses `Tab` to focus on the save button and presses `Enter` to call `reorderProceduresBatch()`.

#### 2. Keyboard-Only Bulk Import Flow (`src/components/admin/tabs/ChecklistTab.tsx`)
1. On `/admin/procedures/[id]` with Checklist Tab active, user tabs to `button:has-text('استيراد مجمّع')` and presses `Enter`.
2. Modal dialog (`role="dialog"`, `aria-modal="true"`) opens.
3. User tabs to `textarea`, inputs or pastes step definitions (e.g. `# Phase\nStep 1 | خطوة 1\n! Step 2 | خطوة 2`).
4. User tabs to `button:has-text('معاينة')` and presses `Enter`.
5. Preview table is rendered.
6. User tabs to radio button options (`Append` vs `Replace All`). If `Replace All`, user tabs to confirmation input and types procedure title.
7. User tabs to `button:has-text('تأكيد واستيراد')` (`AR_STRINGS.bulkImportConfirmButton`) and presses `Enter`.
8. Modal closes; steps are inserted into the editor.
9. User tabs to `button:has-text('حفظ التعديلات')` and presses `Enter` to commit to Supabase.

#### 3. Keyboard-Only Delete Flow (`src/components/admin/DeleteProcedureDialog.tsx`)
1. On `/admin`, user tabs to `button[title='حذف الإجراء']` on the target procedure row and presses `Enter`.
2. `DeleteProcedureDialog` opens (`role="dialog"`). Focus automatically lands on `#confirm-title-input` (`autoFocus`).
3. User types the exact procedure title (case-insensitive check).
4. User tabs to `button[type='submit']` (`AR_STRINGS.deleteConfirmButton`, "حذف نهائي للإجراء").
5. Pressing `Enter` triggers `deleteProcedure(id, title)`.
6. Modal closes, feedback banner announces deletion, row is removed from list.

---

## 4. Execution Commands Summary

| Target Suite / Task | Command | Environment Pre-requisite |
| :--- | :--- | :--- |
| **All Unit Tests** | `npm run test:unit` | In-memory, passes immediately |
| **Individual Unit Test** | `npx tsx --test tests/unit/<filename>.test.ts` | In-memory |
| **Secret Check** | `npm run check:secrets` | Scans tracked repository files |
| **Re-build for Tests** | `npx next build` | Must run with `NODE_ENV=test` & `.env.test` loaded |
| **All E2E Suites** | `npx playwright test` | Requires `.env.test` & test DB running |
| **Public Verification** | `npx playwright test tests/verification.spec.ts` | Requires `.env.test` & test DB |
| **Admin Verification** | `npx playwright test tests/admin-verification.spec.ts` | Requires `.env.test` & test DB |
| **Admin Security** | `npx playwright test tests/admin-security.spec.ts` | Requires `.env.test` & test DB |
| **Admin E2E Lifecycle** | `npx playwright test tests/admin-e2e.spec.ts` | Requires `.env.test` & test DB |
