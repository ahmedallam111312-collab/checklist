# Project: ProfNurse Next.js Application — Phase 2B Close-out 3

## Architecture
- Next.js 16 (App Router) with TypeScript, Tailwind CSS, shadcn/ui.
- Supabase Backend: PostgreSQL with Row-Level Security (RLS), Supabase Auth, Storage bucket `site-images`.
- Environment Isolation: DEV project (`smfsmixdymphtgfalupl`) vs Isolated Test environment (`.env.test`).
- Testing Infrastructure: Playwright E2E suites (`tests/*.spec.ts`), Vitest/Jest unit suites (`tests/unit/*.test.ts`), Axe-core a11y audits, Playwright visual screenshot matrix.

## Feature Inventory
Every requirement from ORIGINAL_REQUEST.md mapped to its assigned milestone:
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Git Baseline & .gitignore | Create .gitignore (.env*, .next, node_modules, test-assets/, *.mp4, test-results/, playwright-report/), run git init, commit baseline, verify zero .env or .mp4 in index | M1 | R1 (K0) |
| 2 | Secret Scanner Verification | Update scripts/check-secrets.ts to ignore test-assets, .agents, .mp4, run check:secrets, document exact scanned files/directories | M1 | R1 (K0) |
| 3 | Migrations Hash & Inventory | Enumerate all supabase/migrations/*.sql and compute SHA-256 hashes | M2 | R2 (K1) |
| 4 | FK Migration Analysis | Explain 002_fix_equipment_procedure_fk.sql: who created it, why, or prove non-existence and explain 001_schema.sql cascade integrity | M2 | R2 (K1) |
| 5 | Storage Limits Sequence | Confirm 002_storage_limits.sql existence and verify strict apply sequence order | M2 | R2 (K1) |
| 6 | Playwright webServer Isolation | Configure webServer with NODE_ENV=test and .env.test exclusively, ensuring .env.local is never read | M3 | R3 (K2) |
| 7 | DEV Project Fingerprinting | Global setup/teardown recording DEV table row counts and max updated_at before/after run; verify zero e2e- rows | M3 | R3 (K2) |
| 8 | Fresh Build Validation | Ensure .next is fresh relative to src, compile with test configuration so DEV ref is not baked into client static bundles | M4 | R5 (K4/T6) |
| 9 | Credential Leak Scanning | Scan .next/static and server output for demo credentials, verify zero leak | M4 | R5 (K4/T6) |
| 10 | Playwright Suite Execution | Execute all tests/*.spec.ts against test project; capture raw outputs per file | M5 | R4 (K3) |
| 11 | Unit Suite Execution | Execute all tests/unit/*.test.ts; capture raw outputs per file | M5 | R4 (K3) |
| 12 | Axe Accessibility Audits | Run axe audits on new tabs (EquipmentTab, ChecklistTab) and dialogs (Bulk Import, Replace-All confirm, Delete) | M6 | R6 (K5/T7) |
| 13 | Keyboard Navigation Verification | Verify keyboard-only navigation for reorder, import, and delete in browser | M6 | R6 (K5/T8) |
| 14 | Screenshot Matrix Capture | Capture 24 exact screenshots (6 states × 4 viewport/theme combos: 390px [dark/light], 320px [dark], 1280px [dark]) with DB and timing | M6 | R6 (K5/T10) |
| 15 | Agent Execution Disclosure | Explicitly report sub-agent spawn methodology, proving independent sessions per K6 | M7 | R7 (K6) |
| 16 | Project Constraints Verification | Verify zero secrets printed/logged, no .env files modified, no Phase 3 work initiated | M7 | R8 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Git Baseline & Secret Check | R1 (K0): .gitignore, git init, baseline commit, check:secrets scope | none | READY |
| M2 | Migrations Inspection & Verification | R2 (K1): SHA-256 hashes, FK analysis, 002_storage_limits sequence | none | READY |
| M3 | Test Environment Isolation & Dev Fingerprint | R3 (K2): webServer .env.test config, DEV fingerprint setup/teardown, zero e2e- rows | M1 | PENDING |
| M4 | Fresh Build Validation & Credential Leak Scan | R5 (K4/T6): fresh next build, .next/static & server output scan for demo creds | M3 | PENDING |
| M5 | Test Suite Execution | R4 (K3): run all tests/*.spec.ts and tests/unit/*.test.ts with raw outputs | M4 | PENDING |
| M6 | Accessibility, Keyboard Nav & Screenshot Matrix | R6 (K5/T7, T8/T10): axe audits, keyboard runs, 24 screenshots with DB/timing | M5 | PENDING |
| M7 | Forensic Integrity Audit & Synthesis Disclosure | R7, R8: teamwork_auditor forensic verification, disclosure report | M6 | PENDING |

## Interface Contracts
- Git Baseline: .gitignore entries must match exact requirement: `.env*`, `.next`, `node_modules`, `test-assets/`, `*.mp4`, `test-results/`, `playwright-report/`.
- Secret Checker: scripts/check-secrets.ts ignores `test-assets`, `.agents`, `.env.test`, `.mp4`. Must exit 0.
- DEV Fingerprint: Read-only Supabase client for DEV (`smfsmixdymphtgfalupl`). Table counts: procedures, checklist_steps, equipment_items, list_items, site_settings, admins, storage.objects. Fail test run if any count or max(updated_at) changes.
- WebServer Isolation: `NODE_ENV=test` in playwright.config.ts and webServer env to strictly bypass `.env.local`.
- Screenshots: Exact naming pattern `{target}-{size}-{theme}.png` where targets are `equipment-tab`, `checklist-tab-critical-arabic-phase`, `import-preview-error`, `replace-all-confirm`, `dashboard-backup-button`, `public-procedure` across sizes `390px` (dark, light), `320px` (dark), `1280px` (dark).

## Code Layout
- `src/` — Application source code (Next.js App Router, components, actions, lib)
- `tests/` — Playwright test specifications
- `tests/unit/` — Unit test specifications
- `scripts/` — Utility scripts (check-secrets, dev-fingerprint, screenshot-matrix)
- `supabase/migrations/` — Database migrations
- `.agents/teamwork/` — Orchestration, agent state, logs, and metadata
