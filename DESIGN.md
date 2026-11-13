# Critical Ease — Design System & Brand Tokens

**Version:** 2.0 (Critical Ease Full Rebrand — Light-Only)  
**Primary Language:** Arabic (`dir="rtl"`, `lang="ar"`) with embedded English clinical fragments inside `<bdi dir="ltr">`  
**Tagline:** `Learn • Practice • Excel` (English only, rendered inside `<bdi dir="ltr">`, never translated)  
**Theme Mode:** Light-only (`color-scheme: light`). Dark mode is completely removed.  
**Visual Source of Truth:** Client mobile screenshots in `docs/referance/01-cover.jpg`, `02-home.jpg`, `03-procedures-list.jpg`, `04-procedure-page.jpg` (RTL-mirrored cleanly for Arabic UI).

---

## 1. Brand Assets (`public/brand/*`)

Use the official client raster files verbatim — **never redraw, trace, or recolor**:

| Surface / Slot | File | Dimensions | Notes |
| --- | --- | --- | --- |
| Cover card (`/`) | `/brand/critical-ease-logo.png` | `929 × 474` | Centered on white rounded card (`#FFFFFF`) |
| Sticky header & Admin header | `/brand/critical-ease-logo-chip.png` | `1003 × 548` | White rounded chip sitting on `#0B2146` navy header (`priority`) |
| Navy footer | `/brand/critical-ease-logo-reversed.png` | `929 × 474` | Full reversed logo on `#0B2146` navy background |
| Compact mark / card emblem | `/brand/critical-ease-mark.png` / `-reversed.png` | `434 × 374` | Heart/ECG mark only |
| App & PWA icons | `/brand/favicon.ico`, `/brand/favicon-32.png`, `/brand/apple-touch-icon.png`, `/brand/icon-192.png`, `/brand/icon-512.png`, `/brand/icon-maskable-512.png` | `32`, `180`, `192`, `512` | Configured via `layout.tsx` metadata & `src/app/manifest.ts` |
| Video watermark | `/brand/watermark.png` | `260 × 48` | Non-downloadable Mux player overlay |

Always declare explicit `width` and `height` and `alt="Critical Ease"` to eliminate Cumulative Layout Shift (`CLS = 0`).

---

## 2. Color Tokens (Zero Hardcoded Hex in Components)

### Core Brand & Surface Palette

| Token (`CSS` / Tailwind) | Hex | Role |
| --- | --- | --- |
| `--color-navy` / `navy` | `#0B2146` | Header bar, footer, hero start, dark text on light surfaces & rose buttons |
| `--color-logo-navy` / `logo-navy` | `#071D3C` | High-contrast ink on rose CTAs if deeper anchor needed |
| `--color-card-navy` / `card-navy` | `#0C2043` | Start stop of procedure & section cards (`135deg`) |
| `--color-plum` / `plum` | `#524056` | Far/bottom corner stop of hero & card gradients |
| `--color-rose` / `rose` | `#C87475` | Primary CTA fill, 3px card/header accents, vertical dividers, progress/slider fills |
| `--color-rose-hover` / `rose-hover` | `#D38586` | Hover state for primary rose CTA (increases contrast with `#0B2146` text to `5.66:1`) |
| `--color-rose-dark` / `rose-dark` | `#9A4450` | **Rose text on light surfaces** (`#FFFFFF`, `#FBF3F3`, `#F6E6E6`, `#EBD8DA`) and focus rings on light |
| `--color-rose-light` / `rose-light` | `#EAB2B3` | **Small rose text & focus rings on navy/plum gradients** (`>= 5.17:1` even over `#524056`) |
| `--color-light-1` / `light-1` | `#FBF3F3` | Elevated subtle rose-tinted light panel / card surface |
| `--color-search-bg` / `search-bg` | `#F9F3F3` | Search input & light control fill |
| `--color-page` / `page` | `#F6E6E6` | Top stop of vertical page background |
| `--color-light-2` / `light-2` | `#EBD8DA` | Bottom stop of vertical page background |
| `--color-list-page` / `list-page` | `#E4D3D3` | List / library recessed surface background |
| `--color-tile-blue` / `tile-blue` | `#3B467A` | End stop of `135deg` section number tiles (`#C87475 -> #3B467A`) |
| `--color-white` / `white` | `#FFFFFF` | Expanded content cards, admin cards, cover logo card, text on navy/plum |
| `--color-text-muted` / `muted-light` | `#334866` | Secondary / helper text on light surfaces (`>= 6.44:1` everywhere) |
| `--color-text-muted-navy` / `muted-navy` | `#CBD5E1` | Secondary text on navy/plum surfaces (`>= 6.35:1` everywhere) |
| `--color-border-ui` / `border-ui` | `#7A6368` | Accessible input & control borders (`>= 3.82:1` on all light surfaces) |
| `--color-border-subtle` / `border-subtle` | `#E5D2D4` | Hairline decorative dividers inside white/light-1 cards |

### Gradients

| Gradient Token | CSS Value | Usage |
| --- | --- | --- |
| `--grad-hero` | `linear-gradient(135deg, #0B2146 0%, #524056 100%)` | Home hero, procedure hero, 3D ECG monitor housing |
| `--grad-card` | `linear-gradient(135deg, #0C2043 0%, #524056 100%)` | Procedure library cards & section accordion headers |
| `--grad-page` | `linear-gradient(180deg, #F6E6E6 0%, #EBD8DA 100%)` | Default page body, cover screen, admin body |
| `--grad-tile` | `linear-gradient(135deg, #C87475 0%, #3B467A 100%)` | Procedure section number tiles (`1`–`7`) |

### Non-Rose Semantic Tokens

Critical, success, warning, and error colors intentionally avoid rose so clinical safety cues are unmistakable and never rely on color alone:

| Semantic Role | Foreground | Surface Tint | Border | Required Icon / Text Cue |
| --- | --- | --- | --- | --- |
| **Critical Step** | `#B42318` | `#FEF2F2` | `#B42318` | Lucide `Flag` icon + label `خطوة حرجة` |
| **Error / Destructive** | `#B42318` | `#FEF2F2` | `#B42318` | Lucide `AlertCircle` / explicit error text |
| **Success** | `#156A3B` | `#ECFDF3` | `#156A3B` | Lucide `CheckCircle2` / explicit Arabic label |
| **Warning / Quota** | `#92400E` | `#FFFBEB` | `#92400E` | Lucide `AlertTriangle` / explicit percentage & label |

---

## 3. WCAG 2.1 AA Contrast Audit Table (Every Used Pair)

Thresholds: Normal/small text `>= 4.5:1`, Large text (`>= 24px` regular or `>= 18.66px` bold) `>= 3.0:1`, UI borders & focus rings `>= 3.0:1`. Gradients are measured at the **worst-case stop**.

| Foreground | Background (or Worst Gradient Stop) | Ratio | Requirement | Status | Usage |
| --- | --- | --- | --- | --- | --- |
| `#FFFFFF` (white) | `#0B2146` (navy) | `15.91:1` | `>= 4.5:1` | PASS | Header/footer/hero headings & body |
| `#FFFFFF` (white) | `#0C2043` (card start) | `16.11:1` | `>= 4.5:1` | PASS | Card titles & accordion titles |
| `#FFFFFF` (white) | `#524056` (plum worst stop) | `9.43:1` | `>= 4.5:1` | PASS | Text extending over hero/card plum end |
| `#EAB2B3` (rose-light) | `#0B2146` (navy) | `8.72:1` | `>= 4.5:1` | PASS | Eyebrow, tagline, nav accents on navy |
| `#EAB2B3` (rose-light) | `#524056` (plum worst stop) | `5.17:1` | `>= 4.5:1` | PASS | Small rose-tinted text & focus rings over hero/cards |
| `#CBD5E1` (muted-navy) | `#524056` (plum worst stop) | `6.35:1` | `>= 4.5:1` | PASS | Subtitles, card short descriptions, footer muted links |
| `#C87475` (rose) | `#0B2146` (navy) | `4.70:1` | `>= 3.0:1` | PASS (UI/Large) | 3px header/card accent lines & ECG trace over `#0B2146` (never as small text on plum!) |
| `#0B2146` (navy) | `#C87475` (rose CTA) | `4.70:1` | `>= 4.5:1` | PASS | Primary rose button text (`هيا نبدأ`, `استكشف الإجراءات`, `استكشاف`, Admin save) |
| `#0B2146` (navy) | `#D38586` (rose-hover) | `5.66:1` | `>= 4.5:1` | PASS | Primary rose button hover state |
| `#0B2146` (navy) | `#FFFFFF` (white) | `15.91:1` | `>= 4.5:1` | PASS | Expanded procedure sections, admin cards, cover card |
| `#0B2146` (navy) | `#FBF3F3` (light-1) | `14.56:1` | `>= 4.5:1` | PASS | Soft pink panels, command menu rows |
| `#0B2146` (navy) | `#F9F3F3` (search-bg) | `14.50:1` | `>= 4.5:1` | PASS | Search input text |
| `#0B2146` (navy) | `#F6E6E6` (page) | `13.16:1` | `>= 4.5:1` | PASS | Headings & copy directly on page gradient |
| `#0B2146` (navy) | `#EBD8DA` (light-2 worst stop) | `11.64:1` | `>= 4.5:1` | PASS | Copy at bottom stop of page gradient |
| `#0B2146` (navy) | `#E4D3D3` (list-page) | `11.03:1` | `>= 4.5:1` | PASS | Section headings & status text over library bg |
| `#9A4450` (rose-dark) | `#FFFFFF` (white) | `6.33:1` | `>= 4.5:1` | PASS | Links, section icons, secondary rose labels on white |
| `#9A4450` (rose-dark) | `#FBF3F3` (light-1) | `5.79:1` | `>= 4.5:1` | PASS | Active tab/badge rose labels on `#FBF3F3` |
| `#9A4450` (rose-dark) | `#F6E6E6` (page) | `5.24:1` | `>= 4.5:1` | PASS | Rose-dark links/labels on `#F6E6E6` |
| `#9A4450` (rose-dark) | `#EBD8DA` (light-2) | `4.63:1` | `>= 4.5:1` | PASS | Rose-dark links on `#EBD8DA` (never use `#9A4450` small text on `#E4D3D3` `4.39:1`) |
| `#334866` (muted-light) | `#E4D3D3` (list-page worst light) | `6.44:1` | `>= 4.5:1` | PASS | Helper captions, counters, secondary descriptions on any light surface |
| `#FFFFFF` (24px bold) | `#C87475` (tile rose worst stop) | `3.38:1` | `>= 3.0:1` (Large >= 18.66px bold) | PASS | Number tile (`text-2xl font-bold`, `24px`) at `#C87475` corner |
| `#FFFFFF` (24px bold) | `#3B467A` (tile blue) | `8.96:1` | `>= 3.0:1` | PASS | Number tile numeral at `#3B467A` corner |
| `#B42318` (critical/error) | `#FEF2F2` / `#FFFFFF` / `#FBF3F3` | `6.01–6.57:1` | `>= 4.5:1` | PASS | Critical step text & flag badge; error messages |
| `#FFFFFF` (white) | `#B42318` (critical badge) | `6.57:1` | `>= 4.5:1` | PASS | `خطوة حرجة` filled badge / critical active toggle |
| `#156A3B` (success) | `#ECFDF3` / `#FFFFFF` | `6.31–6.65:1` | `>= 4.5:1` | PASS | Success banner, published status, copy confirmation |
| `#92400E` (warning) | `#FFFBEB` / `#FFFFFF` | `6.84–7.09:1` | `>= 4.5:1` | PASS | Warning alerts, video quota threshold text |
| `#7A6368` (border-ui) | `#E4D3D3` (worst light bg) | `3.82:1` | `>= 3.0:1` | PASS | Form input & button borders on light surfaces (`5.51:1` on white) |
| `#9A4450` (focus light) | `#E4D3D3` / `#F6E6E6` / `#FFFFFF` | `4.39–6.33:1` | `>= 3.0:1` | PASS | `:focus-visible` outline on light backgrounds |
| `#EAB2B3` (focus navy) | `#524056` / `#0B2146` | `5.17–8.72:1` | `>= 3.0:1` | PASS | `:focus-visible` outline on navy/plum surfaces |

---

## 4. Typography

- **Arabic font:** `IBM Plex Sans Arabic` (`arabic` subset only; weights `400`, `500`, `700` only) with `adjustFontFallback: true`.
- **Latin font:** `Roboto` (`latin` subset only; weights `400`, `500`, `700` only) with `adjustFontFallback: true`, scoped to English `<bdi dir="ltr">` / `font-latin` fragments and monospace `ui-monospace` where technical IDs/slugs appear.
- **Arabic rules (`:lang(ar)`):**
  - `text-transform: none` and `letter-spacing: 0` (never uppercase or wide-track Arabic!).
  - Body text: minimum `16px` mobile (`17px` standard Arabic body copy), `line-height: 1.75`.
  - Mobile `H1`: `40px` (`2.5rem`), `font-weight: 700`, `line-height: 1.25`, `text-wrap: balance`.
  - Western digits (`font-variant-numeric: lining-nums tabular-nums`).
- **Latin rules (`.font-latin` / `<bdi dir="ltr">`):**
  - Eyebrow / button metadata labels (where English): `text-transform: uppercase; letter-spacing: 0.15em`.
  - All clinical English titles, subtitles, step text, and tagline (`Learn • Practice • Excel`) wrapped in `<bdi dir="ltr">`.

---

## 5. Geometry, Borders & Elevation

- **Cards radius:** `28px` (`--radius-card`)
- **Section number tiles radius:** `24px` (`--radius-tile`)
- **Buttons, pills & inputs radius:** `16px` (`--radius-pill`)
- **Continuous corners:** `@supports (corner-shape: squircle) { corner-shape: squircle; }` applied to `.squircle-card`, `.squircle-tile`, and `.squircle-pill`.
- **Navy card signature accent:** `border-top: 3px solid var(--color-rose)` (`#C87475`), paired with soft navy shadow (`0 14px 36px -10px rgba(11, 33, 70, 0.28)`).
- **Sticky header bottom border:** `border-bottom: 3px solid var(--color-rose)`.
- **Primary CTA glow:** `box-shadow: 0 12px 26px -6px rgba(200, 116, 117, 0.45)`.
- **Touch targets:** minimum `44px × 44px` (`min-h-[44px] min-w-[44px]`) on all interactive buttons, nav links, accordion triggers, and controls.
