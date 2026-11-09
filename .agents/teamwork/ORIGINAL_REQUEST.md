# Original User Request

## Initial Request — 2026-11-09T12:30:48Z

Execute Phase 2B close-out 3 for the ProfNurse Next.js application, verifying repository baseline, database migrations, isolated test environment execution, credential security, accessibility, and visual assets without mutating the dev database or editing environment files.

Working directory: d:\checklists
Integrity mode: development

## Requirements

### R1. Git Baseline and Secret Check (K0)
Create `.gitignore` first (`.env*`, `.next`, `node_modules`, `test-assets/`, `*.mp4`, `test-results/`, `playwright-report/`), then run `git init` and commit a baseline commit. Show `git status` and the list of ignored files, proving that no `.env` or `.mp4` file is in the git index. Re-run `npm run check:secrets` and state exactly what it scans now.

### R2. Migrations Inspection and Verification (K1)
List all migration files in `supabase/migrations` along with their SHA-256 hashes. Explain `002_fix_equipment_procedure_fk.sql`: who created it and why. Confirm `002_storage_limits.sql` still exists and verify its order in the migration sequence required for the test project.

### R3. Test Environment Isolation and Dev Protection (K2)
Configure Playwright's `webServer` to start the Next.js app with `.env.test` values exclusively, ensuring `.env.local` is never read. Show the config. Add a global setup that records a fingerprint of the DEV project (`smfsmixdymphtgfalupl`) measuring row counts per table plus max `updated_at` (read-only) before the run and compares it after; the run fails if the DEV project changed. Prove with the first run that no `e2e-` row appeared in DEV.

### R4. Test Suite Execution (K3)
Run every Playwright suite (`tests/*.spec.ts`) and unit test suite (`tests/unit/*.test.ts`) against the test project. Report raw output per file. Mark an item PASS only if it ran. Code written but not run is "not run".

### R5. Credential Leak and Build Validation (K4 / T6)
Run `next build` (or fail if `.next` is missing or older than `src`), then scan `.next/static` and the server output for the demo credentials.

### R6. Accessibility, Keyboard Navigation, and Screenshot Matrix (K5 / T7, T8/T10)
Run axe accessibility audits on the new tabs and dialogs. Execute a keyboard-only run through reorder, import, and delete in a browser. Capture the screenshot matrix against the test project with the exact filenames (`equipment-tab-{size}-{theme}`, `checklist-tab-critical-arabic-phase-{size}-{theme}`, `import-preview-error-{size}-{theme}`, `replace-all-confirm-{size}-{theme}`, `dashboard-backup-button-{size}-{theme}`, `public-procedure-{size}-{theme}` at sizes 390px [dark/light], 320px [dark], 1280px [dark]); state the database and the timing for each.

### R7. Agent Execution Disclosure (K6)
Be explicit about agents: state whether separate sub-agents were spawned or role-played in one thread. Do not call anything "independent" unless it ran in a separate session.

### R8. Project Constraints
Do not print or log any secret. Do not edit `.env` files. Do not start Phase 3.

## Verification Resources
- Existing repository test suites: `tests/verification.spec.ts`, `tests/admin-verification.spec.ts`, `tests/admin-security.spec.ts`, `tests/admin-e2e.spec.ts`, and `tests/unit/*.test.ts`.
- Secret checker: `scripts/check-secrets.ts` (`npm run check:secrets`).
- Database migrations: `supabase/migrations/`.
- Additional verification scripts: The team will author and provide any needed additional verification scripts (including DEV project fingerprinting and credential scanning) during task execution.

## Acceptance Criteria

### Git Baseline & Secrets
- [ ] `.gitignore` contains `.env*`, `.next`, `node_modules`, `test-assets/`, `*.mp4`, `test-results/`, and `playwright-report/`
- [ ] Git repository is initialized with a baseline commit
- [ ] `git status` and ignored file list verify zero `.env` or `.mp4` files indexed
- [ ] `check:secrets` passes and its scan scope is explicitly documented
- [ ] No secrets are logged or printed in output

### Migrations
- [ ] All files in `supabase/migrations/` listed with SHA-256 hashes
- [ ] Author and purpose of `002_fix_equipment_procedure_fk.sql` documented
- [ ] Presence and apply order position of `002_storage_limits.sql` verified

### Environment Isolation & Dev Fingerprint
- [ ] Playwright `webServer` configuration shows Next.js started exclusively with `.env.test` without reading `.env.local`
- [ ] Global setup captures DEV project table row counts and max `updated_at` before run and verifies identical values after run
- [ ] Dev project verified to have zero new `e2e-` rows

### Test Execution & Credential Scanning
- [ ] All Playwright suites and unit test files executed against test project with raw output captured per file
- [ ] Status marked PASS only for tests that actually ran
- [ ] `next build` verified current relative to `src` (or failed if `.next` missing/older)
- [ ] Static assets (`.next/static`) and build server output scanned and verified free of demo credentials

### Accessibility, Interaction & Screenshots
- [ ] Axe audits completed on new tabs and dialogs
- [ ] Keyboard-only navigation verified for reorder, import, and delete in a browser
- [ ] Complete screenshot matrix captured in required resolutions and themes with timing and database recorded
- [ ] No `.env` files modified and no Phase 3 work initiated
- [ ] Agent execution methodology explicitly reported per K6
