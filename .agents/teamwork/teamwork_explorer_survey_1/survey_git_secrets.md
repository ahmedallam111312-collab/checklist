# Comprehensive Survey Report: Git Baseline, Secret Scanner, and Build Credential Hygiene

**Surveyor**: Teamwork Explorer (`teamwork_explorer_survey_1`)  
**Date**: 2026-11-09T13:00:00Z  
**Target Workspace**: `d:\checklists`  
**Scope**: Requirements R1 / K0 (Git baseline & secrets) and R5 / K4 / T6 (Build validation & static credential scanning)  
**Security Constraint Notice**: In compliance with R8, no full secret values or tokens are printed or logged in this report. All sensitive items are masked or referred to by variable name/safe structural pattern.

---

## Executive Summary

1. **Git Repository Status**:
   - Git is **NOT initialized** in `d:\checklists` (`git status` outputs `fatal: not a git repository (or any of the parent directories): .git`).
   - The root contains 11 directories (`.agents`, `.next`, `docs`, `node_modules`, `public`, `scripts`, `src`, `supabase`, `test-assets`, `test-results`, `tests`) and 15 root files.
2. **Existing `.gitignore` Deficiencies**:
   - The current `.gitignore` **fails to ignore** three critical requirements specified in R1:
     - Missing `.env*` (only `.env*.local` is listed; `.env.example`, `.env`, and un-suffixed `.env.test` would be tracked).
     - Missing `test-assets/` completely.
     - Missing `*.mp4` completely.
   - **Critical Hazard**: `test-assets/ECG_12_Lead_Complete_Subtitled.mp4` is a **98.59 MB (103,383,496 bytes)** video file. If `git init` and `git add .` were executed without first amending `.gitignore`, this ~100 MB binary would be committed to the git index!
3. **Secret Scanner Inspection (`scripts/check-secrets.ts`)**:
   - `npm run check:secrets` runs `tsx scripts/check-secrets.ts`.
   - The script performs a custom filesystem walk (`fs.readdirSync`) starting at `process.cwd()`, completely independent of git.
   - **Flaw / Hazard identified**: `.mp4` is **missing** from `BINARY_EXTENSIONS` and `test-assets/` is **missing** from `IGNORED_DIRS`. Consequently, `check-secrets.ts` currently reads the entire 98.6 MB video file into Node memory as a UTF-8 string and parses it line-by-line!
   - Current scan passes with 112 files checked (113 when temporary scripts are present), with zero rule violations.
4. **Build Staleness (`.next` vs `src`)**:
   - Latest file modified in `src`: `src/app/home/page.tsx` at `2026-11-09T11:03:53.952Z`.
   - `.next` build manifest timestamp: `2026-11-09T10:41:28.713Z`.
   - Latest `.next` generated file timestamp: `2026-11-09T10:42:12.046Z`.
   - **Conclusion**: The current `.next` build is **stale** (older than `src` by 21 minutes, 41 seconds). Under Requirement R5 ("Run `next build` (or fail if `.next` is missing or older than `src`)"), this build must be re-run prior to validation.
5. **Credential Leak Scan**:
   - Unit test `tests/unit/build-credentials.test.ts` scans `.next/static` for `admin@profnurse.local` and `AdminPass123!`.
   - Comprehensive scan across `.next/static` confirmed **zero occurrences** of known demo emails, demo passwords, Supabase secret keys (`sb_secret_`), or JWT secret tokens.
   - Server Actions (`src/app/admin/actions/auth.ts`) dynamically reference `process.env.E2E_ADMIN_EMAIL` and `process.env.E2E_ADMIN_PASSWORD` at runtime without leaking them into client JS bundles.

---

## 1. Git Baseline and Secret Check (R1 / K0)

### 1.1 Git Status & Workspace Initialization
- **Command Executed**: `git status`
- **Output**:
  ```
  fatal: not a git repository (or any of the parent directories): .git
  Exit code: 1
  ```
- **Verification**: `git rev-parse --is-inside-work-tree` returned exit code 1.
- **Finding**: The workspace has not had `git init` executed. No commits, index, or branches exist yet.

### 1.2 Inventory of Files in Workspace Root
Directories present at root:
- `.agents/` (agent metadata, plans, reports)
- `.next/` (Next.js build artifacts)
- `docs/` (documentation and static guides)
- `node_modules/` (npm dependencies)
- `public/` (public web assets: logos, SVGs, manifest)
- `scripts/` (utility scripts: `check-secrets.ts`, `seed-demo.ts`, `generate-icons.ts`)
- `src/` (application source code)
- `supabase/` (migrations and config)
- `test-assets/` (contains binary test video)
- `test-results/` (Playwright run artifacts, currently `.last-run.json`)
- `tests/` (unit and E2E test suites)

Root files present:
- `.env.example` (455 B)
- `.env.local` (2,985 B)
- `.eslintrc.json` (42 B)
- `.gitignore` (411 B)
- `DESIGN.md` (22,466 B)
- `next-env.d.ts` (268 B)
- `next.config.ts` (860 B)
- `package-lock.json` (256,984 B)
- `package.json` (1,162 B)
- `playwright.config.ts` (543 B)
- `postcss.config.mjs` (105 B)
- `SPEC.md` (16,287 B)
- `tailwind.config.ts` (2,249 B)
- `tsconfig.json` (602 B)
- `tsconfig.tsbuildinfo` (145,447 B)

### 1.3 Comparison of Existing `.gitignore` vs R1 Requirements
Existing `.gitignore` content (`d:\checklists\.gitignore`):
```gitignore
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage
/test-results
/playwright-report
/blob-report
tests/.auth/
.auth/
docs/screenshots/

# Next.js build output
/.next/
/out/

# Production
/build

# Local environment files
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS Files
.DS_Store
Thumbs.db
```

#### Detailed Gap Analysis against Requirement R1:
| Required Pattern | Present in `.gitignore`? | Current Match Pattern | Risk / Impact |
| :--- | :---: | :--- | :--- |
| `.env*` | **NO** | Only `.env*.local` | `.env.example`, `.env`, and un-suffixed `.env.test` are NOT ignored. |
| `.next` | Partial | `/.next/` | Matches root `/.next/`, but standard convention is `.next` or `.next/`. |
| `node_modules` | Partial | `/node_modules` | Matches root `/node_modules`. |
| `test-assets/` | **NO** | *None* | `test-assets/` directory is completely unignored; large files inside will be staged. |
| `*.mp4` | **NO** | *None* | Binary video files anywhere in the repo will be tracked. |
| `test-results/` | Partial | `/test-results` | Matches root `/test-results`. |
| `playwright-report/` | Partial | `/playwright-report` | Matches root `/playwright-report`. |

### 1.4 File Tree Scan: `.env` and `.mp4` Files
1. **`.env*` files found**:
   - `d:\checklists\.env.example` (Length: 455 bytes, LastWriteTime: 2026-11-07 16:26:11)
   - `d:\checklists\.env.local` (Length: 2,985 bytes, LastWriteTime: 2026-11-09 10:49:09)
   - *Note*: `.env.test` does **not** currently exist on disk.
2. **`*.mp4` files found**:
   - `d:\checklists\test-assets\ECG_12_Lead_Complete_Subtitled.mp4` (Length: 103,383,496 bytes ~98.59 MB, LastWriteTime: 2026-11-06 21:20:24)
   - *Note*: No other `.mp4` files exist anywhere in the repository.

### 1.5 Detailed Audit of `scripts/check-secrets.ts`
- **Execution Script**: `"check:secrets": "tsx scripts/check-secrets.ts"`
- **Scan Mechanism**:
  1. Recursively enumerates `process.cwd()` using `fs.readdirSync`.
  2. Skips directories matching `IGNORED_DIRS`:
     - `node_modules`
     - `.next`
     - `.git`
     - `test-results`
     - `playwright-report`
     - `.auth`
     - Any path starting with `tests/.auth`
  3. Skips files matching `IGNORED_FILES`:
     - `.env.local`
     - `.env.development.local`
     - `.env.test.local`
     - `.env.production.local`
     - `package-lock.json`
     - Also ignores files ending with `.env.local` (line 91).
  4. Skips files with extensions in `BINARY_EXTENSIONS`:
     - `.png`, `.jpg`, `.jpeg`, `.webp`, `.ico`, `.svg`, `.woff`, `.woff2`, `.ttf`, `.eot`, `.zip`, `.pdf`.
- **Active Scanning Rules (lines 96–134)**:
  - **Rule 1 (JWT)**: Matches `/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}/`.
  - **Rule 2 (Supabase Secret Key)**: Matches `line.includes("sb_secret_")`.
  - **Rule 3 (Private Key Blocks)**: Matches `/BEGIN [A-Z0-9_-]*PRIVATE KEY/` or base64 prefix `LS0tLS1CRUdJTi`.
  - **Rule 4 (High-Entropy Variable Assignment)**: Matches `/(?:KEY|SECRET|TOKEN|PASSWORD)\s*[:=]\s*['"]?([A-Za-z0-9_\-+/=]{25,})['"]?/i`.
    - Skips `KNOWN_PLACEHOLDERS`:
      - `"your-secret-key"`
      - `"your-publishable-key"`
      - `"your-admin-password"`
      - `"admin123"`
      - `"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"`
      - `"SUPABASE_SECRET_KEY"`
    - Calculates Shannon entropy: flags any value where `entropy > 3.5`.
- **Current Run Result**:
  - Scanned 112 files (all source code, tests, docs, scripts, supabase migrations, `.agents` files, and `test-assets/ECG_12_Lead_Complete_Subtitled.mp4`).
  - Output: `✅ [check:secrets] Scanned 112 tracked files. Zero secrets or sensitive tokens detected.`
- **Critical Observations & Recommendations for Implementer**:
  - `check-secrets.ts` logs "Scanned X tracked files", but it is actually a **filesystem scanner**, not a git-index scanner.
  - `test-assets/` and `.mp4` should be added to `IGNORED_DIRS` / `BINARY_EXTENSIONS` to prevent Node from opening 100 MB binary video files as UTF-8 strings.
  - `.agents/` should ideally be added to `IGNORED_DIRS` so agent workspace notes are not scanned as application code.
  - If a `.env.test` file is created without `.local` suffix, `check-secrets.ts` will scan it unless `.env.test` is added to `IGNORED_FILES` (or named `.env.test.local`).

---

## 2. Build Validation and Static Credential Scanning (R5 / K4 / T6)

### 2.1 Timestamp Verification: `.next` vs `src`
A precise UTC timestamp inspection of `d:\checklists\src` versus `d:\checklists\.next` revealed:

| Target | File / Path | UTC Timestamp (`LastWriteTimeUtc`) | Status |
| :--- | :--- | :--- | :--- |
| **Latest `src` file** | `src\app\home\page.tsx` | `2026-11-09T11:03:53.952Z` | Source is newer |
| **`.next` manifest** | `.next\build-manifest.json` | `2026-11-09T10:41:28.713Z` | Older by 22m 25s |
| **`.next` root directory** | `.next` | `2026-11-09T10:41:41.562Z` | Older |
| **Latest `.next` file** | `.next\server\route-cache\...\login.rsc`| `2026-11-09T10:42:12.046Z` | Older by 21m 41s |

**Verdict**: The current `.next` build is **STALE**. Requirement R5 specifies:
> "Run `next build` (or fail if `.next` is missing or older than `src`), then scan `.next/static` and the server output for the demo credentials."

Prior to performing credential leak verification and starting the test server, a fresh `npm run build` must be executed.

### 2.2 Next.js Build Configuration & Environment Inlining
Inspection of `next.config.ts`:
- Enforces runtime safety check:
  ```ts
  if (process.env.VERCEL && process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true") {
    throw new Error(
      "BUILD REJECTED: NEXT_PUBLIC_USE_DEMO_DATA cannot be 'true' on a deployed Vercel build. Disable demo mode in environment variables."
    );
  }
  ```
- Configures `reactStrictMode: true`, `images.remotePatterns` for Supabase storage, and sets `X-Robots-Tag: noindex, nofollow` on `/admin/:path*`.
- **Environment Inlining Behavior in Next.js**:
  - `NEXT_PUBLIC_*` variables are compiled into static client bundles (`.next/static/**`) as string literals at build time.
  - Server actions in `src/app/admin/actions/auth.ts`:
    - Marked `"use server"`.
    - Dynamically read `process.env.E2E_ADMIN_EMAIL` and `process.env.E2E_ADMIN_PASSWORD` at runtime on the server.
    - Verified in `.next/server/chunks/789.js`: the action references `process.env.E2E_ADMIN_EMAIL` and `process.env.E2E_ADMIN_PASSWORD` dynamically and does not bake these values into static client bundles.

### 2.3 Inventory of Demo Credentials & Sensitive Patterns in Workspace
The following demo credentials, placeholder keys, and sensitive tokens were identified across the workspace:

1. **Demo Admin Credentials in Test Suites**:
   - `admin@profnurse.local` — Referenced in `tests/unit/build-credentials.test.ts:14`.
   - `AdminPass123!` — Referenced in `tests/unit/build-credentials.test.ts:15`.
   - `admin@profnurse.ps` — Referenced in `tests/admin-security.spec.ts:81`.
   - `TestAdmin123!Safe` — Referenced in `tests/admin-security.spec.ts:82`.
2. **Placeholder Values in Templates / Configs**:
   - `admin@example.com` — In `.env.example:10`.
   - `your-admin-password` — In `.env.example:11`.
   - `your-secret-key` — In `.env.example:8` and `check-secrets.ts:54`.
   - `your-publishable-key` — In `.env.example:7` and `check-secrets.ts:55`.
   - `admin123` — In `check-secrets.ts:57`.
3. **Sensitive Production / Dev Tokens (Must NEVER appear in `.next/static`)**:
   - `SUPABASE_SECRET_KEY` (Supabase Service Role Secret)
   - `sb_secret_` (Secret key prefix)
   - Raw JWT patterns (`eyJ...`)
   - `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_PRIVATE_KEY`, `MUX_WEBHOOK_SECRET`
   - `CRON_SECRET`
   - Real passwords or emails loaded via environment

### 2.4 Static Bundle Scan Results (`.next/static`)
Searched `.next/static` for all identified demo credentials and sensitive tokens:
- `admin@profnurse.local`: **0 matches** (CLEAN)
- `AdminPass123!`: **0 matches** (CLEAN)
- `admin@profnurse.ps`: **0 matches** (CLEAN)
- `TestAdmin123!Safe`: **0 matches** (CLEAN)
- `admin@example.com`: **0 matches** (CLEAN)
- `your-admin-password`: **0 matches** (CLEAN)
- `your-secret-key`: **0 matches** (CLEAN)
- `sb_secret_`: **0 matches** (CLEAN)
- Unit test `tests/unit/build-credentials.test.ts` ran and passed:
  ```
  ▶ T6 Production Build Hygiene: Demo Admin Credentials Absence
    ✔ ensures demo admin email and password are never compiled into .next client bundles (26.5932ms)
  ```

---

## 3. Actionable Recommendations for Implementation Phase

1. **For Git Baseline (R1 / K0)**:
   - Update `.gitignore` before initializing git to include:
     ```gitignore
     # Environment files
     .env*
     
     # Next.js build
     .next
     
     # Dependencies
     node_modules
     
     # Test artifacts & large binaries
     test-assets/
     *.mp4
     test-results/
     playwright-report/
     ```
   - Initialize git: `git init`.
   - Verify ignored files: `git status --ignored` to confirm `.env.example`, `.env.local`, and `test-assets/ECG_12_Lead_Complete_Subtitled.mp4` are completely ignored and not indexed.
   - Commit the initial baseline commit.
2. **For `check-secrets.ts`**:
   - Add `test-assets` and `.agents` to `IGNORED_DIRS`.
   - Add `.mp4` to `BINARY_EXTENSIONS`.
   - If `.env.test` is created, ensure it is added to `IGNORED_FILES` in `check-secrets.ts` so `check:secrets` does not fail when scanning `.env.test`.
3. **For Build Validation & Test Environment (R3 & R5)**:
   - Run `npm run build` so that `.next` is newer than `src`.
   - Ensure the Next.js app starts with `.env.test` values exclusively, protecting the development Supabase project (`smfsmixdymphtgfalupl`).
   - Run the credential leak scan against `.next/static` after the fresh build.
