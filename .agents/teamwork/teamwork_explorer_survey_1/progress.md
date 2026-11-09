# Progress — teamwork_explorer_survey_1

Last visited: 2026-11-09T13:05:00Z

- [x] Initialized DISPATCH.md and BRIEFING.md
- [x] Investigate Git baseline and status (git repo initialized? untracked files? existing .gitignore?)
  - Verified `git status` -> `fatal: not a git repository`. Git is NOT initialized.
  - Verified existing `.gitignore` missing critical patterns: `.env*`, `test-assets/`, `*.mp4`.
- [x] Check for .env* and *.mp4 files across workspace
  - Found `.env.example` (455 B) and `.env.local` (2985 B). No `.env.test` currently exists.
  - Found `test-assets/ECG_12_Lead_Complete_Subtitled.mp4` (103,383,496 B ~98.6 MB).
- [x] Inspect scripts/check-secrets.ts and package.json scripts (`npm run check:secrets`)
  - Evaluated exact scan logic: recurses filesystem, skips specific sets.
  - Critical discovery: `.mp4` is NOT in `BINARY_EXTENSIONS` and `test-assets/` is NOT in `IGNORED_DIRS`. `check-secrets.ts` reads the 98.6 MB mp4 file as a UTF-8 string.
  - Detailed scan rules: JWT (`eyJ...`), `sb_secret_`, private key block, high-entropy assignments.
- [x] Check .next build status vs src directory timestamps
  - Latest `src`: `src/app/home/page.tsx` (2026-11-09T11:03:53Z).
  - Latest `.next`: `build-manifest.json` (2026-11-09T10:41:28Z), `.next` latest file (2026-11-09T10:42:12Z).
  - Finding: `.next` build is stale (~21m 41s older than `src`). Under R5, it must be rebuilt.
- [x] Check next.config.js / build configuration
  - Config rejects build if `process.env.VERCEL && process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true"`.
  - Next.js inlines `NEXT_PUBLIC_*` at build time. Server actions dynamically read `process.env`.
- [x] Identify demo credentials and sensitive patterns in docs/project to scan for
  - Identified: `admin@profnurse.local`, `AdminPass123!`, `admin@profnurse.ps`, `TestAdmin123!Safe`, `admin@example.com`, `your-admin-password`, `your-secret-key`, `your-publishable-key`, `sb_secret_`.
  - Scanned `.next/static`: clean of demo credentials.
  - Verified `npm run test:unit` passes 50/50 tests (including T6 credential leak test).
- [x] Synthesize findings into survey_git_secrets.md
- [x] Update BRIEFING.md
- [x] Write handoff.md and send message to parent
