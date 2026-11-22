# ALODANAX — Annual IT/CS TechFest Platform

A premium, cinematic, scroll-driven website built for **ALODANAX**, the annual TechFest of a college IT/CS department.

Built with plain HTML5, CSS3, and vanilla JavaScript using GSAP + ScrollTrigger, Lenis smooth scrolling, and Google Fonts (Space Grotesk & Inter). No build step, no framework overhead, zero local external `.css` or `.js` file dependencies.

---

## Architecture: Self-Contained Pages

Following **Phase A & Phase B refactoring**, every HTML page is completely **self-contained**:
- Exactly **one `<style>` block** in `<head>` containing both the shared design tokens and page-specific styles.
- **Inline `<script>` blocks** placed at the bottom of `<body>` containing data models, shared component engines, and page controllers.
- There is **no `css/` directory and no `js/` directory**. Opening any `.html` file locally or over an HTTP server operates independently without broken stylesheet or script paths.
- The only permitted external network dependencies are:
  1. Google Fonts (`Space Grotesk` & `Inter`).
  2. The CDN runtime libraries for the cinematic hero scrub on `index.html` (`GSAP 3.12.5`, `ScrollTrigger`, `Lenis 1.1.18`).
  3. Media assets, video copies, and download files located under `assets/`.

---

## Synchronizing Shared Code (`tools/sync-shared.mjs`)

To prevent code duplication drift across the 7 HTML pages, standardized comment markers partition the files into shared vs. page-specific blocks.

### The 4 Canonical Shared Blocks
1. `/* ==== SHARED:BASE-CSS START ==== */` ... `/* ==== SHARED:BASE-CSS END ==== */`
   (Design tokens, reset, typography scale, buttons, navigation header & mobile drawer, footer, subpage hero, accessible modal, category badges, dev audit HUD styles)
2. `/* ==== SHARED:DATA-SITE START ==== */` ... `/* ==== SHARED:DATA-SITE END ==== */`
   (Single Source of Truth for Brand Name, college details, contacts, socials, and map)
3. `/* ==== SHARED:DATA-EVENTS START ==== */` ... `/* ==== SHARED:DATA-EVENTS END ==== */`
   (Festival-wide competition database, registration links, rules, and coordinator contacts — included on `index`, `events`, `hackathon`, and `contact`)
4. `/* ==== SHARED:COMPONENTS START ==== */` ... `/* ==== SHARED:COMPONENTS END ==== */`
   (Shared navigation injection, mobile focus-trapped drawer, shared footer, subpage hero generator, image error fallbacks, and the `?audit=1` engine)

### Single Source of Truth
`index.html` is the **canonical source of truth** for all 4 shared blocks.

Whenever you update design tokens, global site data, or shared navigation in `index.html`, run the zero-dependency synchronizer:

```bash
node tools/sync-shared.mjs
```

The script automatically updates all target subpages (`events.html`, `faculty.html`, `hackathon.html`, `team.html`, `contact.html`) and reports sync status.

---

## How to Edit Content on Each Page

Every page houses its editable content inside an inline `<script>` block under the clearly marked header:

```javascript
// ===== EDIT YOUR CONTENT HERE =====
```

### Where to Find Each Data Model

| Page | Data Location | What to Edit |
| :--- | :--- | :--- |
| **`index.html`** | `SHARED:DATA-SITE`<br>`SHARED:DATA-EVENTS`<br>`SITE_CONTENT` | Fest edition, hero copy, about paragraphs, statistics, pillars, and post-hero section text. |
| **`events.html`** | `SHARED:DATA-EVENTS` | Competition names, categories (`technical`, `non-technical`, `gaming`), descriptions, dates, rules, team sizes, and registration links. |
| **`faculty.html`** | `FACULTY_DATA` | Faculty mentor directory (names, roles, departments, areas of expertise, photos, and biographies). |
| **`hackathon.html`** | `HACKATHON_DATA` | 24-Hour hackathon metadata, 3 problem statement domains (`domains[]`), round timelines, and official PPT deck link. |
| **`team.html`** | `TEAM_DATA` | 40 student organizing team members (`name`, `role`, `photo`, `social`). |
| **`contact.html`** | `FAQ_DATA` | 8 festival FAQ questions and detailed answers. |

> **Placeholder Safety Rule**: Never invent facts, dates, phone numbers, or names. Unfilled details remain marked with brackets (e.g. `"[DATE TBA]"`). The utility helper `ALODANAX_UTILS.isPlaceholder()` ensures unverified phone and email values never render as clickable `tel:` or `mailto:` links, displaying a subtle `"TBA"` badge instead.

---

## How to Add Google Form Registration Links

Registration is strictly handled per-event via official Google Forms.

1. Open `index.html` (or `events.html`) and locate `SHARED:DATA-EVENTS`.
2. Locate the event object you wish to update (e.g. `slug: "hackathon"`).
3. Update the `registrationUrl` field with your live Google Form link:
   ```javascript
   registrationUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform",
   ```
4. **Validation Rules**:
   - The URL must start with `https://`.
   - The hostname must be `docs.google.com` (path `/forms`), `forms.gle`, or `www.google.com` (path `/forms`).
   - If the URL is empty or starts with `[` (e.g. `"[GOOGLE FORM URL TBA]"`), the website automatically renders a disabled button: `"Registration Opening Soon"` (`aria-disabled="true"`).
5. Run `node tools/sync-shared.mjs` to propagate the updated link to `events.html`, `hackathon.html`, and `contact.html`.

---

## Typography & Design Tokens System

The site implements a **WCAG AA compliant** cinematic design language:

### Fonts Loaded
- **Space Grotesk** (Weights 500, 600, 700): Used for display headings, section titles, card titles, navigation links, and action buttons.
- **Inter** (Weights 400, 500, 600): Used for body text, descriptions, bios, FAQ answers, modal dialogs, and form inputs.

### Customizing Design Tokens in `:root`
Defined in `/* ==== SHARED:BASE-CSS START ==== */` inside `index.html`:

```css
:root {
  /* Color Palette */
  --black: #000000;
  --page-bg: #05060A;
  --surface: #0B0D14;
  --surface-alt: #10131E;
  
  /* Brand Accents */
  --blue: #0A84FF;
  --blue-bright: #409CFF; /* WCAG AA accessible tint for small/accent text */
  --neon-red: #FF1744;
  --neon-red-bright: #FF4D6D; /* WCAG AA accessible tint */
  
  /* High-Contrast Readability */
  --text-primary: rgba(255, 255, 255, 0.94); /* 17.5:1 contrast on black */
  --text-secondary: rgba(255, 255, 255, 0.78); /* 10.2:1 contrast on black */
  --text-tertiary: #8A94A6; /* 5.8:1 contrast on black */
  
  /* Typography Families */
  --font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
```

### Readability Guardrails
- **Body Text**: Minimum `17px` (`1.0625rem`) on desktop, minimum `16px` on mobile. Line-height `1.65`.
- **Line Length**: Max-width `68ch` on paragraphs and descriptions to prevent eye strain on ultrawide displays.
- **Minimum Font Size**: **Zero text smaller than 13px** anywhere across the entire website.
- **Uppercase Restriction**: Strictly limited to short labels, section tags, category badges, and button labels (≤ 3 words, letter-spacing ≤ 0.08em). Paragraphs, descriptions, quotes, and bios are in natural sentence case.
- **Hero Readability**: Soft radial backdrop vignettes and multi-layer text shadows guarantee 100% legibility across bright spotlight frames (0–1s) and neon red streaks (1–3s).
- **Interactive Targets**: Minimum touch target height of `44px` for buttons, navigation links, and chips.

---

## Quick Start & Local Testing

Because smooth HTML5 video scrubbing requires **HTTP 206 Partial Content (Range requests)**, do not open `index.html` via `file://` or Python's basic `http.server`.

Use the included zero-dependency Node HTTP Range server:

```bash
node server.js
```
Open **http://localhost:3000/** in your browser.

- To enable the scrub performance HUD (scroll %, video timestamp, real-time FPS), append `?debug=1`:
  ```
  http://localhost:3000/?debug=1
  ```
- To launch the Developer Audit Diagnostic Suite, append `?audit=1`:
  ```
  http://localhost:3000/?audit=1
  ```

---

## Developer Audit Tool (?audit=1)

The built-in audit diagnostic engine scans all data stores and the DOM to verify data completeness.

1. Start the server (`node server.js`).
2. Navigate to any page with `?audit=1` (e.g. `http://localhost:3000/events.html?audit=1`).
3. A floating **DEV AUDIT HUD** will appear in the bottom-left corner showing:
   - Total unfilled `[...]` placeholders.
   - Pending / fallback image assets.
   - Breakdown of pending items per data model.
   - A **"COPY REPORT"** button to copy the complete JSON diagnostic report to your clipboard.

---

## Automated QA & Accessibility Verification

The repository includes automated tools in `tools/`:

- **Shared Synchronization**: `node tools/sync-shared.mjs`
- **Typography & Font Size Audit**: `node tools/audit-typography.mjs`
- **WCAG AA Accessibility Audit**: `node tools/run-accessibility-audit.mjs`

### Accessibility Test Results
Tested using **axe-core 4.9.1** across all 6 pages:
- `index.html`: **100%** (41 passed, 0 violations)
- `events.html`: **100%** (47 passed, 0 violations)
- `faculty.html`: **100%** (43 passed, 0 violations)
- `hackathon.html`: **100%** (40 passed, 0 violations)
- `team.html`: **100%** (45 passed, 0 violations)
- `contact.html`: **100%** (41 passed, 0 violations)
