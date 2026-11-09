---
name: ProfNurse Clinical Navy
colors:
  # ---- Dark theme (default) ----
  background: '#07182a'
  surface: '#0d2740'
  surface-raised: '#123552'
  surface-sunken: '#051220'
  border: '#1f4466'
  border-subtle: 'rgba(255, 255, 255, 0.08)'
  text: '#f1f7fb'
  text-secondary: '#b4c7d6'
  text-muted: '#8fa8bb'
  primary: '#00d2ff'
  primary-hover: '#33dcff'
  primary-pressed: '#00a8cc'
  on-primary: '#03202b'
  focus-ring: '#7be7ff'
  critical: '#ffb020'
  critical-surface: 'rgba(255, 176, 32, 0.12)'
  on-critical: '#1c1200'
  danger: '#ff7b7b'
  danger-surface: 'rgba(255, 123, 123, 0.12)'
  success: '#34d399'
  # ---- Light theme (applied under [data-theme="light"]) ----
  light-background: '#e8f1f8'
  light-surface: '#ffffff'
  light-surface-raised: '#f3f8fc'
  light-surface-sunken: '#dce7f0'
  light-border: '#c3d6e4'
  light-text: '#0b2540'
  light-text-secondary: '#3b566d'
  light-text-muted: '#4d667a'
  light-primary: '#006b94'
  light-on-primary: '#ffffff'
  light-primary-hover: '#005a7d'
  light-primary-pressed: '#004a66'
  light-focus-ring: '#006b94'
  light-on-critical: '#ffffff'
  light-critical: '#8a5300'
  light-critical-surface: '#fff1d6'
  light-danger: '#b42318'
  light-danger-surface: '#fde8e6'
  light-success: '#0f7a55'
typography:
  # English / Latin baseline. Arabic overrides are in the Typography section.
  display:
    fontFamily: IBM Plex Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  h1:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  h1-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  h2:
    fontFamily: IBM Plex Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  h3:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  step:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  step-critical:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  button:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  caption:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  space-1: 0.25rem
  space-2: 0.5rem
  space-3: 0.75rem
  space-4: 1rem
  space-6: 1.5rem
  space-8: 2rem
  space-12: 3rem
  space-16: 4rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  content-max: 70rem
  tap-target: 2.75rem
motion:
  ease-out: 'cubic-bezier(0.16, 1, 0.3, 1)'
  ease-in-out: 'cubic-bezier(0.65, 0, 0.35, 1)'
  duration-fast: 150ms
  duration-base: 250ms
  duration-slow: 450ms
  duration-scene: 700ms
---

## 1. Brand & Style

ProfNurse is a calm, trustworthy learning site for nursing students practising emergency and critical-care procedures, mostly on phones, often in a skills lab or at the bedside. It is not a monitoring dashboard. The design should feel clinical and precise without being cold or crowded.

- **Look:** deep navy surfaces, one electric-cyan accent, generous spacing, rounded cards. This continues the look of the original prototype. The logo is built in code: an SVG mark (a navy tile with a cyan ECG line) plus the site name as live text. It needs no plate and works on both themes.
- **Principle 1, content first:** the learning content (sections, checklist, video) is always static, readable and fast. Motion lives in the showcase areas only (see section 8).
- **Principle 2, one accent:** cyan means "interactive or active". It never means a warning. Warnings use amber, mistakes use coral.
- **Principle 3, bilingual by design:** the UI is Arabic and RTL. All procedure content is English and LTR. Every component must work in both directions.

## 2. Language & Direction Rules

- `<html lang="ar" dir="rtl">` for the whole site.
- Every block of procedure content (titles, descriptions, definition, indications, contraindications, equipment, checklist, common mistakes) is wrapped in `lang="en" dir="ltr"` and left-aligned.
- Arabic UI: navigation, buttons, section headings, hero text, empty states, admin labels.
- Each checklist step may have an Arabic translation, revealed by a per-step button. The revealed text is `lang="ar" dir="rtl"`.
- Use CSS logical properties everywhere (`margin-inline-start`, `padding-inline`, `border-inline-start`, `inset-inline-end`, `text-align: start`). Never hard-code `left` or `right` except inside the English block when it is intentional.
- Mirror directional icons (arrows, chevrons) in RTL. Do not mirror the logo, the ECG waveform, or numbers.
- Digits are written as Western digits (0-9) everywhere, including Arabic text.
- There is no global language toggle. There is a dark/light toggle only.

## 3. Colors

Dark is the brand default. On a visitor's first visit, follow `prefers-color-scheme` (fall back to dark if there is no preference), then remember the toggle choice. Apply the theme with a small inline script before first paint so there is no flash of the wrong theme. Light applies under `[data-theme="light"]` using the `light-*` tokens above. All text and background pairs must meet WCAG AA (4.5:1 for body text, 3:1 for large text and UI borders). The values are chosen for this, but verify with a contrast checker before launch.

- **Canvas:** `background`. Page backdrop may use a very subtle gradient from `background` to `#0b2a45` at the top of the hero only.
- **Cards and panels:** `surface`, with a 1px `border-subtle` border. Raised or active items use `surface-raised`.
- **Inputs and wells:** `surface-sunken`.
- **Text:** `text` for headings and content, `text-secondary` for supporting copy, `text-muted` for captions and placeholders (still AA).
- **Primary (cyan):** buttons, links, active states, checked checkboxes, progress fill, focus ring. Text on cyan is always `on-primary`.
- **Critical (amber):** reserved for critical checklist steps and nothing else.
- **Danger (coral):** reserved for the Common Mistakes section.
- **Success:** completed progress (100%) only.

## 4. Typography

**Fonts (all free on Google Fonts, loaded through `next/font` with `display: swap`, subsets `latin` and `arabic`):**
- IBM Plex Sans (400, 500, 600) for English.
- IBM Plex Sans Arabic (400, 500, 600) for Arabic.
- IBM Plex Mono (500) for small uppercase labels, English only.

Plex Sans and Plex Sans Arabic are designed as a family, so weights and proportions match across the two scripts. Load only the weights listed, to keep the page fast on mobile data.

**Scale:** use the tokens in the frontmatter. Use the `-mobile` variants below 768px.

**Rules:**
- Body text is never below 16px on mobile. 14px (`body-sm`) is for secondary text only, 13px for captions only. No text below 12px.
- Checklist step text is 18px (`step`), so it can be read at arm's length.
- Uppercase and positive tracking (the `label` style) are for English only. Never apply uppercase or tracking to Arabic.
- Negative tracking on English headlines is allowed. It must be reset to 0 for Arabic.
- Set `font-variant-numeric: tabular-nums` on step numbers, progress values and stats.

**Arabic overrides (required, because Arabic needs more room and unbroken letter joining):**

```css
:root { --ar-bump: 1px; }

:lang(ar) {
  font-family: "IBM Plex Sans Arabic", "IBM Plex Sans", system-ui, sans-serif;
  letter-spacing: 0;          /* any spacing breaks Arabic letter joining */
  text-transform: none;
  line-height: 1.75;          /* taller than English (about 1.6) */
  font-size: calc(var(--fs) + var(--ar-bump));
}
:lang(en) {
  font-family: "IBM Plex Sans", system-ui, sans-serif;
}
```

Every text style sets a `--fs` custom property alongside `font-size`, so the Arabic bump applies cleanly. English blocks inside the Arabic page use `lang="en"` so they receive the English font and spacing.

## 5. Layout & Spacing

- 4px base unit. Use the spacing tokens only.
- **Mobile first (320px to 767px):** single column, 16px side margins, 16px gaps, cards full width.
- **Tablet (768px to 1023px):** 2-column card grid, 24px margins.
- **Desktop (1024px and up):** content max width 70rem, 40px margins, 3-column card grid on the library, and a two-column procedure page (content column plus a sticky video column).
- **Header:** one compact row, 56px tall: logo, Home, theme toggle. It is sticky. Do not let it wrap into two rows on mobile.
- **Tap targets:** every interactive element is at least 44px tall and wide (visual size may be smaller if padding makes up the difference).
- Use `svh` units (not `vh`) for full-screen sections so mobile browser bars do not cut content.

## 6. Elevation, Shape & Surfaces

- **Level 0:** canvas.
- **Level 1:** `surface` with a 1px `border-subtle` border. No shadow. Used for all cards and list items.
- **Level 2:** `surface-raised`, shadow `0 12px 32px rgba(0, 0, 0, 0.35)`. Used for modals, menus and the active procedure card.
- **Blur:** `backdrop-filter: blur(12px)` is allowed only on the sticky header and modals. List cards use solid colours, because blur on many cards makes scrolling janky on mid-range Android phones.
- **Radius:** cards `lg` (16px), buttons and inputs `md` (12px), chips and the progress bar `full`, section icons `md`.
- **Focus:** a 2px `focus-ring` outline with 2px offset, visible on every interactive element, on both themes.

## 7. Components

**Header.** Logo (SVG mark plus live-text name, no plate; mark only below 360px), Home button, theme toggle. Icons only for the toggle, with an accessible Arabic label.

**Logo.** An inline SVG mark (`public/brand/mark.svg`; use `useId()` for the gradient id so several instances on one page do not collide) followed by the site name as live text in IBM Plex Sans 600, `lang="en"`. Two-tone ("Prof" in `text`, "Nurse" in `primary`) when the name is two camel-case words, otherwise one colour. The mark is `aria-hidden` when the name text sits next to it. If an admin uploads a logo image in settings, show that instead.

**Buttons.** Primary: `primary` fill, `on-primary` text, `button` style, min height 48px, radius `md`. Hover `primary-hover`, pressed `primary-pressed`. Secondary: transparent, 1px `border`, `text`. Ghost: transparent, `text-secondary`, cyan on hover. Disabled: 40% opacity, no hover.

**Search field.** `surface-sunken`, 1px `border`, min height 48px, placeholder in `text-muted`. Focus: 2px `primary` border. Input is `lang="en" dir="ltr"` because procedure names are English; the placeholder text is Arabic.

**Procedure card.** `surface`, radius `lg`. Top: image area (16:10) showing the photo, or a placeholder with the ECG-pulse icon until a photo is uploaded. Then the English title (`h3`), English one-line description (`body-sm`, `text-secondary`), and an Arabic "استكشف" primary button with a mirrored arrow. The whole card is tappable.

**Section card (accordion).** One per section, in this order: Definition, Indications, Contraindications, Equipment, Checklist, Common Mistakes, Video. Header row: a numbered badge (`primary` fill, `on-primary` text, radius `md`), the Arabic section title (`h3`), and a chevron. The Checklist section is open by default; the others are collapsed. Content area padding `space-4`. The Common Mistakes section uses a `danger` start-edge and `danger-surface` header tint, with an icon so it does not rely on colour alone.

**Text sections (definition, indications, contraindications, common mistakes).** English `body`, bullet lists with `space-2` between items, max line length about 65 characters on desktop.

**Equipment item.** A checkable row: 24px checkbox (visual) inside a 44px tap area, English item name (`body`). The section header shows a small "3 / 8 ready" counter. Checked state is saved in localStorage only.

**Checkbox.** Unchecked: `surface-sunken` fill, 1.5px `border`. Checked: `primary` fill, `on-primary` check glyph, with a 150ms scale-in on the tick.

**Checklist step.** The core component. English only by default.
- Layout (inside the `dir="ltr"` block): checkbox, step number (`label`-style number with tabular figures), step text (`step`), and an Arabic-translation button at the end of the row.
- **Normal step:** `step` style, transparent 4px start border (so text alignment is identical to critical steps).
- **Critical step** (data flag `is_critical`): must be unmistakable and must not rely on colour alone:
  - 4px `border-inline-start` in `critical`
  - `critical-surface` background
  - text in `step-critical` (weight 600)
  - a "CRITICAL" chip: `critical` fill, `on-critical` text, `label` style, with a warning-triangle icon
  - visually hidden text for screen readers: "خطوة حرجة"
  - the chip appears on the first line before the step text
- **Checked step:** the checkbox fills in cyan, text colour drops to `text-secondary`. Do not apply strikethrough. Critical steps keep their amber border and chip even when checked.
- **Arabic toggle button:** a small ghost button labelled "عربي", min 44px tap area, `aria-expanded`, `aria-controls`. On press, a panel expands under that step (250ms, height and opacity only) containing the Arabic text in `lang="ar" dir="rtl"`, with the Arabic type overrides, on a `surface-raised` background and radius `md`. Press again to collapse. If a step has no Arabic text, the button is not rendered.
- **Progress bar** at the top of the checklist: 8px tall, `surface-sunken` track, `primary` fill (turns `success` at 100%), with a "5 / 12" counter using tabular figures. Fill animates over `duration-base`.

**Video frame.** 16:9, radius `lg`, black background, poster image before play, controls styled with the cyan accent. The department watermark is burned into the video file before upload (not an overlay), so it also survives screen recording. Download controls are removed. The video section is last in the list on mobile. On desktop it lives in a sticky column (`top: 72px`) next to the content.

**Chips and badges.** Pill, `surface-raised`, `body-sm`, optional icon. Used for tags only.

**Stats row (home).** Three items separated by 1px `border` rules, a large tabular number (`h1`) over an Arabic caption. Counts are computed from the database, never hard-coded.

**Admin dashboard.** Uses the same tokens in Arabic UI. Content fields are English and LTR. The per-step Arabic field is RTL. Forms are single-column with 48px inputs, clear inline validation, drag handles for reordering steps and equipment, and an "Unsaved changes" bar. Image upload shows a preview. Keep it plain and fast; no motion beyond 150ms feedback.

## 8. Motion & 3D Scroll

Goal: a premium first impression and a sense of depth in the showcase areas, with zero cost to learning, speed or accessibility.

### 8.1 Where motion is used

| Area | Treatment |
|---|---|
| Splash screen | 3D entrance of the logo plate |
| Home hero | Scroll-driven 3D ECG-monitor scene (the signature effect) |
| Stats row | Count-up when it enters view, once |
| Procedures library | Perspective card entrance, image parallax, press and hover tilt |
| Procedure page header | ECG waveform line draws in, title slides up |
| **Sections, checklist, equipment, video** | **No scroll or 3D effects. Only expand/collapse and tick feedback, 250ms or less.** Students are reading steps; motion competes for attention. |

### 8.2 Signature scene: scroll-driven 3D ECG monitor (home hero)

A monitor matching the logo (screen with a waveform and two small readouts), built from stacked layers in 3D space, that rotates to face the viewer as the user scrolls past the hero.

- **Structure:** a wrapper with `perspective: 1000px`, an inner stage with `transform-style: preserve-3d`, and layers at different depths: bezel (z 0), screen glass (z 20px), ECG waveform as an SVG path (z 40px), two floating readout chips (z 70px) with decorative values such as 72 and 98 (`aria-hidden`), and a soft cyan glow behind (z -40px).
- **Build:** CSS 3D transforms plus SVG only. No WebGL, no 3D model files, no extra payload. If a real glTF model is wanted later, keep the same scroll hooks and swap the stage.
- **Pin:** the hero is pinned for about 120svh of scroll (never longer), then releases.
- **Scroll mapping (progress 0 to 1, scrubbed with about 0.6s smoothing):**
  - rotateY: -30deg to 0deg (flip the sign in RTL so it turns toward the content)
  - rotateX: 14deg to 0deg
  - translateZ of the stage: -120px to 0
  - scale: 0.9 to 1
  - waveform stroke draws from 0% to 100% between progress 0.2 and 0.8 (`stroke-dashoffset`)
  - glow opacity: 0.2 to 0.8
  - readout chips drift 12px relative to the stage for parallax depth
  - at progress 1 the "Explore procedures" button fades up (`duration-base`)
- **Text:** the headline and description are static HTML above the scene. They never animate in a way that delays reading.

### 8.3 Other scenes

- **Splash:** logo plate enters with scale 0.92 to 1, rotateX 10deg to 0, opacity 0 to 1 over `duration-scene`, using `ease-out`. Then an optional idle float of about 4px every 6s, paused when the tab is hidden and disabled in reduced motion.
- **Library cards:** as each card enters the viewport, it animates from `translateY(24px) rotateX(12deg)` and opacity 0 to its resting state over `duration-slow`, with 60ms stagger (max 6 cards staggered, the rest appear together). The card's image layer moves about 8px slower than the card for depth. Press: scale 0.98 and rotateX 2deg. Desktop hover: tilt follows the pointer, max 6deg, with a short `ease-out` return.
- **Procedure header:** the waveform line draws in over `duration-scene`, the title slides up 16px and fades in.
- **Count-up:** stats count from 0 to their value over 800ms, `ease-out`, once per page view.

### 8.4 Rules (all required)

1. Animate only `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `box-shadow` or `filter` during scroll.
2. Use native scrolling. No scroll-jacking and no smooth-scroll libraries that take over the scroll wheel or touch.
3. **Recommended tooling:** GSAP with ScrollTrigger for the scrubbed scenes (works in every browser). CSS scroll-driven animations (`animation-timeline`) may be used only as an optional enhancement for simple effects and must not be required. Lazy-load the motion code after first paint.
4. **RTL:** vertical motion is preferred. Any horizontal or rotateY motion must flip direction when `dir="rtl"`.
5. **Initial state:** server-render every element in its final, visible state. JavaScript applies the starting state after hydration, so there is no flash, no layout shift and no blank content if JavaScript fails.
6. **Cleanup:** kill all ScrollTrigger instances and timelines on route change and component unmount (Next.js navigation).
7. Use `will-change: transform` only on the actively animating element, and remove it afterwards.

### 8.5 Fallbacks

- **`prefers-reduced-motion: reduce`:** no pin, no 3D, no parallax, no count-up. Show the final state at once. Expand/collapse becomes instant.
- **Low-end devices** (`navigator.deviceMemory <= 4`, `navigator.hardwareConcurrency <= 4`, or `saveData` enabled): "lite mode". No pin and no 3D; use a simple 250ms fade-up for entrances.
- **Mobile:** the hero pin is shortened to about 100svh. If frame rate drops, drop to lite mode for the rest of the session.
- **Budget:** keep mobile Lighthouse performance at 85 or higher with all effects on. Test on a mid-range Android phone, not only on a desktop.

## 9. Accessibility

- All text meets AA contrast on both themes. Critical, mistakes and success states always pair colour with an icon or label.
- Full keyboard operation and a visible focus ring everywhere. Accordions and the Arabic toggle use correct ARIA (`aria-expanded`, `aria-controls`).
- Real `lang` and `dir` attributes on every language block, so screen readers pronounce each language correctly.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (default theme follows the device, with the toggle overriding and remembering the choice).
- Alt text for procedure photos is editable in the admin and is English.

## 10. Do and Don't

- **Do** keep one source of truth for tokens (this file), exposed as CSS variables, with no hard-coded hex values in components.
- **Do** use logical CSS properties and test every screen in RTL and in a 320px viewport.
- **Do** keep the checklist calm: no animation beyond the tick, the expand and the progress bar.
- **Don't** use cyan for warnings or amber for anything but critical steps.
- **Don't** apply letter-spacing, uppercase or negative tracking to Arabic text.
- **Don't** use backdrop blur on lists of cards.
- **Don't** block right-click, F12 or keyboard shortcuts. Protect videos through signed streaming and a burned-in watermark instead.
- **Don't** hard-code procedure counts, section counts or any content that comes from the database.

## 11. Acceptance Checklist (for the build)

1. Arabic text has zero letter-spacing and the 1.75 line-height everywhere, with Arabic font bump applied.
2. English content blocks are LTR, left-aligned, with `lang="en"`, inside the RTL page.
3. A critical step is visibly different in a grayscale screenshot (border, chip with icon, heavier weight).
4. The per-step Arabic button expands and collapses, has a 44px tap target, and correct ARIA.
5. Header stays one row at 320px width.
6. Body text is 16px or larger on mobile; step text is 18px.
7. Hero 3D scene works with scroll on mobile, mirrors correctly in RTL, and shows a static final state with reduced motion, with JavaScript disabled, and in lite mode.
8. No scroll or 3D effects exist inside the sections, checklist, equipment or video areas.
9. Dark and light themes both pass AA contrast; theme choice persists.
10. Mobile Lighthouse performance is 85 or higher with effects on; no layout shift from animations.
