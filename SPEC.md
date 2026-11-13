# Critical Ease: Build Specification

Companion files: `DESIGN.md` (visual system, typography, motion, light-only) and `supabase/migrations/001_schema.sql` (database, security policies, starter rows).

**Precedence:** `DESIGN.md` decides how things look and move. This file decides behavior, data and security. If they conflict, stop and ask.

**Hard rule:** never invent clinical content. The nursing department supplies every clinical step. Any demo content must be obviously fake (for example "Demo step 1"), flagged as demo, and never loaded into production.

---

## 1. Summary

A public, educational, bilingual website where nursing students browse Emergency and Critical Care procedures. Each procedure has a definition, indications, contraindications, equipment, an interactive checklist with critical steps and optional per-step Arabic translation, a list of common mistakes, and one protected demonstration video. The department's professors maintain everything through an admin dashboard after handover.

### Locked decisions

- The site is public. Students do not sign in. There is exactly one admin account.
- All procedure-related content is English. All other UI is Arabic (RTL).
- Checklist steps are English with an optional Arabic translation per step, revealed by a button.
- Critical points are not a separate section. They are checklist steps flagged `is_critical`. Each procedure has 7 sections: Definition, Indications, Contraindications, Equipment, Checklist, Common Mistakes, Video.
- Procedures are data-driven. The five starters are ABG Sampling, CVP Measurement, 12-Lead ECG, BLS and ACLS. Each suction type is its own procedure and is added later from the admin dashboard. There are no sub-types and no hard-coded procedure count.
- One video per procedure. Videos are not downloadable and are owned by the department.
- Everything except the video file lives in the database.
- Educational, non-commercial project (Vercel Hobby plan is acceptable).

### Out of scope (do not build)

Student accounts or progress sync, quizzes, comments, payments, analytics, additional languages, offline/PWA mode, AI features. Offline support for text content may be a later phase.

---

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS driven by the tokens in `DESIGN.md` (CSS variables, no hard-coded hex values in components) |
| Database, Auth, Storage | Supabase (`@supabase/ssr`), schema in `schema.sql` |
| Video | Mux free plan, signed playback, `@mux/mux-player-react`, `@mux/upchunk`, Mux Node SDK |
| Motion | GSAP with ScrollTrigger, lazy-loaded (see `DESIGN.md` section 8) |
| Hosting | Vercel |
| Fonts | Roboto (Latin 400/500/700) and IBM Plex Sans Arabic (400/500/700) via `next/font` |

Arabic UI strings live in one file, `src/messages/ar.ts`, so the department can review the wording. Use `Intl.PluralRules("ar")` for counts.

### Environment variables (provide `.env.example`, never commit real values)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
NEXT_PUBLIC_SITE_URL=
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_SIGNING_KEY_ID=
MUX_SIGNING_PRIVATE_KEY=          # base64
MUX_WEBHOOK_SECRET=
CRON_SECRET=
```

---

## 3. Routes

| Route | Purpose |
|---|---|
| `/` | Cover screen: logo plate, tagline, "ابدأ" button leading to `/home` |
| `/home` | Hero with the 3D scroll scene, stats row, explore button |
| `/procedures` | Library: search field and procedure cards |
| `/procedures/[slug]` | Procedure page with the 7 sections |
| `/about` | About page (editable placeholders only until department copy is provided) |
| `/admin/login` | Admin sign-in (email and password) |
| `/admin` | Dashboard: procedure list, video usage counter, shortcuts |
| `/admin/procedures/new`, `/admin/procedures/[id]` | Procedure editor |
| `/admin/settings` | Site settings and logo |
| `/api/video-token` | Issues a short-lived signed Mux token |
| `/api/mux/webhook` | Receives Mux events |
| `/api/keepalive` | Daily ping (cron) |

Public pages are statically generated with on-demand revalidation. Every admin save revalidates the affected pages immediately.

---

## 4. Public site behavior

**Home.** Content from `site_settings`. The stats row shows the number of published procedures (computed), a fixed "7" sections, and "EN | AR".

**Library.** Published procedures ordered by `sort_order`. Client-side search filters by title and short description (English). Empty result shows the Arabic "no results" message.

**Procedure page.** Header with back button, title, short description. Then the 7 sections in the order above as accordion cards (see `DESIGN.md` section 7). Checklist is open by default. On desktop (1024px and up) the video moves to a sticky side column. On mobile it is the last section.
- A section with no content shows a muted Arabic "not added yet" message.
- Common Mistakes uses the danger styling from `DESIGN.md`.

**Checklist.**
- Steps in `sort_order`. If a step has a `phase`, show the phase heading when it changes.
- Each step has a checkbox. A progress bar and "done / total" counter sit above the list. A reset button clears progress.
- Critical steps use the critical style from `DESIGN.md` (deep red `#B42318` border/badge, flag icon, `"خطوة حرجة"` label, heavier weight, screen-reader text).
- The "عربي" button appears only when `text_ar` exists. It toggles the Arabic text under that step.
- Progress is stored in localStorage keyed by step id. Ignore ids that no longer exist.

**Equipment.** Checkable rows with a "done / total" counter, stored in localStorage the same way. Optional photo per item.

**Video.** See section 6. If there is no ready video, show the Arabic "video being prepared" message instead of a player.

**Footer.** `footer_text` from settings (department ownership notice). Empty means no footer.

**Draft preview.** Implemented as `/admin/preview/[id]` (dynamic, admin-only, noindex, with a visible "مسودة" banner) reusing the public page components, instead of `?preview=1` on the public route (which is ignored by static generation). Deliberate update in Phase 2A.

---

## 5. Admin dashboard

UI labels in Arabic. Content fields in English (LTR). Per-step Arabic field is RTL. Same design tokens as the public site. Plain and fast, no scroll effects.

**Access:** email and password login. No sign-up, no public admin links. Every admin page, server action and route handler verifies the session and `is_admin()` on the server. Middleware alone is not enough.

**Dashboard:** list of procedures with status (draft or published, video status), drag handles to reorder, "add procedure", a "videos used: n / 10" counter that warns at 8 or more, and an "Export backup (JSON)" button that downloads all content.

**Procedure editor (tabs, each with its own Save button and an unsaved-changes guard):**
1. **Details:** title, slug (auto-generated from the title, editable, validated), short description, cover photo with preview and alt text, publish toggle. Publishing warns, but does not block, if the definition, checklist or video is missing.
2. **Overview:** definition text, and ordered lists for indications, contraindications and common mistakes (add, edit, delete, reorder).
3. **Equipment:** ordered items with optional photo.
4. **Checklist:** ordered steps with English text, optional Arabic text, critical toggle, optional phase. Add, edit, delete and drag to reorder. Includes **bulk import** (below).
5. **Video:** upload, status, replace, remove (section 6).

**Delete procedure:** confirmation dialog, also deletes its Mux asset and its stored images.

**Images:** resize in the browser before upload (maximum 1600px wide, WebP) to protect the free storage limit. Upload to the `site-images` bucket.

**Settings:** all `site_settings` fields and the logo.

### Bulk import format (checklist)

A text area where the admin pastes many steps at once. One line per step. A parser creates the rows and shows a preview before saving.

```
# Phase heading (applies to the steps below it)
Demo step one | خطوة تجريبية أولى
! Demo critical step | خطوة تجريبية حرجة
Demo step with no Arabic translation
```

- A line starting with `#` sets the phase for following lines.
- A leading `!` marks the step critical.
- `|` separates English from the optional Arabic translation.
- Blank lines are ignored. Whitespace is trimmed.
- Import appends to the existing steps, or replaces them if the admin chooses "replace all" (with confirmation).

Write unit tests for this parser.

---

## 6. Video pipeline

Videos are prepared before upload: the department watermark is burned into the file (so it survives screen recording and cropping is harder). Example, with a semi-transparent PNG logo sized for the video:

```
ffmpeg -i input.mp4 -i watermark.png -filter_complex "overlay=W-w-24:H-h-24" \
  -c:v libx264 -preset veryfast -crf 20 -c:a copy -movflags +faststart output.mp4
```

**Upload (admin):**
1. Admin picks a file. The server creates a Mux direct upload with `playback_policy: ["signed"]` and `passthrough` set to the procedure id. The browser uploads with `@mux/upchunk`. Show progress.
2. Store `mux_upload_id` and set `video_status = 'uploading'`, then `'processing'`.
3. `/api/mux/webhook` verifies the Mux signature and handles upload-to-asset, asset ready and asset errored events. On ready, it stores `mux_asset_id` and `mux_playback_id` and sets `'ready'`. On error it sets `'error'`.
4. A "Refresh status" button re-checks Mux, in case a webhook is missed.

**Replace or remove:** delete the old Mux asset through the API. The free plan allows only 10 assets, so never leave orphans.

**Playback (public):**
- Do not enable MP4 downloads or static renditions on Mux assets.
- `/api/video-token?slug=...` checks that the procedure is published and has a ready video, then returns a signed playback token that expires in 2 hours, with `Cache-Control: no-store`. Rate-limit it.
- The client requests the token only when the video section is opened or scrolled into view, and refreshes it before expiry. It passes the token to Mux Player.
- Configure Mux playback restrictions to allow only the production domain (and localhost for development).
- Style Mux Player with the rose accent (`#C87475`) on light surfaces. Remove any download controls. Do not block right-click, F12 or shortcuts.

---

## 7. Arabic UI strings (initial set, department to review)

| Key | Arabic |
|---|---|
| Home | الرئيسية |
| Start | هيا نبدأ |
| Explore | استكشف |
| Back to procedures | العودة إلى الإجراءات |
| Library title | مكتبة الإجراءات |
| Search placeholder | ابحث عن إجراء... |
| No results | لا توجد نتائج مطابقة |
| Definition | التعريف |
| Indications | دواعي الاستخدام |
| Contraindications | موانع الاستخدام |
| Equipment | الأدوات |
| Checklist | قائمة الخطوات |
| Common mistakes | الأخطاء الشائعة |
| Video | الفيديو التوضيحي |
| Arabic toggle | عربي |
| Critical (screen reader) | خطوة حرجة |
| Reset progress | إعادة ضبط |
| Progress | تم {done} من {total} |
| Equipment ready | {done} / {total} جاهز |
| Section empty | لم تتم إضافة المحتوى بعد |
| Video being prepared | الفيديو التوضيحي قيد الإعداد |
| Video error | تعذّر تشغيل الفيديو. حاول مرة أخرى. |
| Stats: procedures | إجراءات |
| Stats: sections | أقسام لكل إجراء |
| Stats: languages | ثنائي اللغة |

Admin labels: draft them in Arabic, short and plain, in the same file.

---

## 8. Security and data rules

- Row-level security is enabled on every table (see `schema.sql`). The anonymous key can only read published content. Never use the service role key in client code.
- Sign-ups are disabled in Supabase Auth. The single admin is created manually and registered in `admins`.
- Render all content as plain text. Never use `dangerouslySetInnerHTML`.
- Validate and sanitize all admin input on the server (lengths, slug format, file type and size for uploads).
- Set standard security headers. The Content Security Policy must still allow Mux Player and Supabase image hosts.
- Keep Mux and Supabase secrets in Vercel environment variables only.

---

## 9. Operations and handover

- **Keep-alive:** Supabase free projects may pause after a period of inactivity, which could happen over a university break. Add a Vercel Cron job (once a day) that calls `/api/keepalive`, protected by `CRON_SECRET`, and runs a trivial query. Verify the current free-tier policy when deploying.
- **Backups:** the admin "Export backup (JSON)" button. Recommend a monthly export.
- **Ownership:** create the Vercel, Supabase and Mux accounts under the department's email so they own them at handover.
- **Documentation to deliver:**
  - `README.md` (English, for developers): setup, environment, deploy, schema, creating the admin user, Mux setup.
  - `docs/ADMIN_GUIDE_AR.md` (Arabic, for professors): sign in, add a procedure, edit content, bulk import steps, upload a video, publish, export a backup.
  - `docs/VIDEO_GUIDE.md`: how to prepare a video with the watermark (the ffmpeg command above) and upload limits.

---

## 10. Build phases

Stop at the end of each phase, summarize what was built, and wait for approval.

**Phase 0: Foundation.** Project setup, Tailwind with the `DESIGN.md` tokens (light-only palette), fonts, the `lang` and `dir` rules, `ar.ts`, Supabase client, run `001_schema.sql`, `.env.example`.

**Phase 1: Public site with demo data.** Cover, home (static hero, no 3D yet), library, procedure page with all 7 sections and the full checklist component (progress, critical style, per-step Arabic toggle, equipment). Add a `seed:demo` script with clearly fake content, for development only. Checkpoint: screenshots at 390px and 1280px in RTL (light-only).

**Phase 2: Admin CMS.** Login, dashboard, procedure editor, uploads, reorder, bulk import with tests, settings, backup export, revalidation, draft preview.

**Phase 3: Video.** Mux direct upload, webhook, status, signed playback, token route, playback restrictions, asset cleanup, usage counter.

**Phase 4: Motion.** Implement `DESIGN.md` section 8 exactly: hero 3D scene, library card entrances, procedure header, count-up, plus all fallbacks (reduced motion, lite mode, no-JavaScript final state). No effects inside sections, checklist, equipment or video.

**Phase 5: Hardening.** Accessibility pass, Lighthouse mobile check, RTL review at 320px, keep-alive cron, documentation, deploy.

**Content loading (after Phase 2):** the department's checklists, definitions and other content are entered through the admin, using bulk import for steps.

---

## 11. Tests and acceptance

**Automated:**
- Unit tests for the bulk import parser (phases, critical flag, translation split, blank lines, empty input).
- End-to-end smoke tests: public flow (cover, home, library, search, procedure, checklist toggle and Arabic button); admin flow (login, create procedure, bulk import, publish, appears publicly); an unauthenticated request cannot read drafts or write anything.

**Manual acceptance (all must pass):**
1. Every item in the `DESIGN.md` acceptance checklist.
2. Anonymous API access can read only published content and cannot write.
3. A draft procedure is invisible publicly and visible to the admin in preview.
4. The home counter changes when a procedure is published or unpublished.
5. Uploading a video through the admin results in a playable video on the public page, with no direct file URL available and no download control.
6. Replacing or deleting a video removes the old Mux asset.
7. Editing text in the admin appears on the public site without redeploying.
8. The site works at 320px, in RTL, in light-only theme, with keyboard only, and with reduced motion.

---

## 12. Open items (not blockers)

- Final list of suction types to add as procedures.
- Whether the client wants an About or credits page (department, university, supervising professors, team).
- Exact wording of the ownership notice for the footer.
- Final domain name.
- Checklist structure once the photos arrive (confirm whether steps are grouped into phases).
