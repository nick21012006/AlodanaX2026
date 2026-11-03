# ALODANAX — Annual IT/CS TechFest Platform

A premium, cinematic, scroll-driven website built for **ALODANAX**, the annual TechFest of a college IT/CS department.

Built with plain HTML5, CSS3, and vanilla JavaScript using GSAP + ScrollTrigger, Lenis smooth scrolling, and Google Fonts (Syne & Inter). No build step, no external frameworks.

---

## Multi-Page Architecture

1. **Home (`index.html`)**:
   - Pinned 500vh scroll-scrubbed video canvas with synchronized safe-zone overlays.
   - Global navigation that fades in at 20% scroll and transitions transparent-to-solid on scroll.
   - Post-hero sections in strict order:
     1. `#about`: Genesis of ALODANAX with vision, purpose, and conditional stat counters.
     2. `#collaborator`: Industry alliance overview with company logo, intro, info bullets, and 3 honored guest cards.
     3. `#categories`: Three large arena cards (Technical = Blue, Non-Technical = Silver/White, Gaming = Neon Red) linking to filtered event views.
     4. `#featured-events`: 5 primary event cards (Hackathon, Bit Bash Bonanza, Ideathon, BGMI, Discovering Derlicts).
     5. `#why`: Four foundational pillars (Innovation, Creativity, Collaboration, Competition).
     6. `#cta`: Call to action encouraging national student participation.
     7. Shared footer.

2. **Events Discovery Portal (`events.html`)**:
   - Interactive toolbar with real-time live search (matches title, keywords, descriptions) and category filter chips (`All`, `Technical`, `Non-Technical`, `Gaming`).
   - Deep linking support: `events.html?category=gaming` and `events.html#event=hackathon`.
   - Accessible Details Modal: Focus trap, ESC key dismiss, backdrop click, body scroll lock, and synchronized browser history.
   - Per-event Google Form registration buttons with automatic disabled states (`"Registration Opening Soon"`).

3. **Organizing Committee (`committee.html`)**:
   - Head of Department (HOD) featured first in a full-width hero card.
   - Followed by council tiers: Chief Patron, Patron, Chairperson, Staff Convenors, Student Convenors, and Other Leadership.
   - Tiers with zero members are automatically omitted.

4. **Faculty Directory (`faculty.html`)**:
   - Academic mentors, competition track directors, and technical evaluators.
   - Live client-side name and expertise search bar.

5. **24-Hour Flagship Hackathon (`hackathon.html`)**:
   - Flagship sub-brand design with duration, date, venue, and registration CTA read dynamically from `events.js`.
   - 3 domain problem categories with deep linking support (`#domain=domain-1`, `#domain=domain-2`, `#domain=domain-3`).
   - Problem statement cards with difficulty badges, descriptions, and expected deliverables.
   - Standardized presentation deck (.PPTX) download section with asynchronous `HEAD` availability check.
   - Numbered rules list and coordinator dispatch contacts.

6. **Our Team (`team.html`)**:
   - 40 structured student crew cards in 1:1 square ratio.
   - Real-time search by name or role.
   - Dynamic department filter chips extracted automatically from unique non-placeholder departments.
   - Verified social icons (rendered only when links are valid).

7. **Contact & Inquiries (`contact.html`)**:
   - Campus venue address, direct phone/email, and social media links.
   - Map with graceful degradation: renders an iframe when `site.map.embedUrl` is set; otherwise falls back to a designed dark aesthetic card. Never guesses or geocodes an unknown location.
   - Event coordinators directory aggregated automatically from `events.js` (single source of truth).
   - FAQ Accordion (8 questions from `faq.js`) with accessible disclosure toggles.
   - General inquiry form with honeypot spam protection, client-side validation, and endpoint detection.

---

## Quick Start & Local Testing

Because smooth HTML5 video scrubbing requires **HTTP 206 Partial Content (Range requests)**, do not open `index.html` via `file://` or Python's basic `http.server`.

Use the included zero-dependency Node HTTP Range server:

```bash
node server.js
```
Open **http://localhost:3000/** in your browser.

- To enable the scrub performance HUD (scroll %, video timestamp, real-time FPS), add `?debug=1`:
  ```
  http://localhost:3000/?debug=1
  ```
- To launch the Developer Audit Diagnostic Suite, add `?audit=1`:
  ```
  http://localhost:3000/?audit=1
  ```

---

## Folder Structure for Images

All images are organized by section under `assets/images/`:

```
assets/
├── hero-poster.jpg             # Final frame fallback poster (1920×1080)
├── introvideo.mp4              # 24fps all-keyframe desktop scrub video (1920×1080)
├── introvideo_m.mp4            # Lightweight mobile scrub video (1280×720)
├── downloads/
│   └── hackathon-sample.pptx   # Official pitch deck template
└── images/
    ├── collaborator/
    │   ├── logo.png            # Company logo (Transparent PNG or SVG, ~3:1 ratio)
    │   ├── guest-1.jpg         # Keynote speaker photo (4:5 ratio)
    │   ├── guest-2.jpg         # Industry mentor photo (4:5 ratio)
    │   └── guest-3.jpg         # Jury chair photo (4:5 ratio)
    ├── committee/
    │   ├── hod.jpg             # Head of Department portrait (4:5 ratio)
    │   ├── patron-1.jpg        # Chief Patron photo (4:5 ratio)
    │   ├── convenor-1.jpg      # Staff Convenor photo (4:5 ratio)
    │   └── lead-president.jpg  # Student leadership photo (4:5 ratio)
    ├── events/
    │   ├── hackathon.jpg       # 16:10 competition poster
    │   ├── bit-bash-bonanza.jpg
    │   ├── ideathon.jpg
    │   ├── bgmi.jpg
    │   └── discovering-derlicts.jpg
    ├── faculty/
    │   ├── faculty-hod.jpg     # Faculty mentor portrait (4:5 ratio)
    │   └── faculty-1.jpg
    └── team/
        ├── member-01.jpg       # Crew member portrait (1:1 square ratio)
        ├── member-02.jpg
        └── ... (member-01.jpg to member-40.jpg)
```

> **Zero Broken Images Guarantee**: If an image asset is not yet added to disk or fails to load, `ALODANAX_UTILS.handleImageError()` automatically replaces it with a dark aesthetic SVG panel with an electric blue hairline and placeholder dimensions. Broken image icons never appear.

---

## How to Add Google Form Registration Links

Registration is strictly handled per-event via official Google Forms.

1. Open [`js/data/events.js`](file:///c:/scroll%20effect/js/data/events.js).
2. Locate the event object you wish to update (e.g. `slug: "hackathon"`).
3. Update the `registrationUrl` field with your live Google Form link:
   ```javascript
   registrationUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform",
   ```
4. **Validation Rules**:
   - The URL must use the `https://` protocol.
   - The hostname must be `docs.google.com` (path starting with `/forms`), `forms.gle`, or `www.google.com` (path starting with `/forms`).
   - If the URL is empty, missing, or starts with `[` (e.g. `"[GOOGLE FORM URL TBA]"`), the website automatically renders a disabled button: `"Registration Opening Soon"` (`aria-disabled="true"`).
5. **Security & Uniqueness**:
   - Each event must have its own unique registration link.
   - On page load, `verifyUniqueRegistrationUrls()` audits all links and logs a `console.error` if duplicate Google Form URLs are shared across different events.

---

## How to Edit Each Data File

All content is managed through vanilla JavaScript data stores exposing globals (no bundler required):

| Data File | Purpose & Contents |
| :--- | :--- |
| [`js/data/site.js`](file:///c:/scroll%20effect/js/data/site.js) | **Single source of truth for Brand Name** (`brand.name = "ALODANAX"`), college name/address, official contacts, social links, map `{ embedUrl, link }`, `inquiryEndpoint`, collaborator info & 3 guest cards, and the 4 pillars. |
| [`js/data/events.js`](file:///c:/scroll%20effect/js/data/events.js) | Complete schemas for all events (`slug`, `name`, `category`, `shortDescription`, `image`, `date`, `venue`, `intro`, `description`, `format`, `rules[]`, `requirements[]`, `teamSize`, `instructions[]`, `coordinators[]`, `registrationUrl`, `extraLink`). |
| [`js/data/committee.js`](file:///c:/scroll%20effect/js/data/committee.js) | HOD featured card data followed by tiered councils (Patrons, Convenors, Leadership). Empty tiers are omitted automatically. |
| [`js/data/faculty.js`](file:///c:/scroll%20effect/js/data/faculty.js) | Faculty mentor profiles (name, designation, department, role, area of expertise, photo, intro). |
| [`js/data/team.js`](file:///c:/scroll%20effect/js/data/team.js) | 40 student crew members (`id`, `name`, `role`, `department`, `photo`, `social: { linkedin, instagram, github }`). |
| [`js/data/hackathon.js`](file:///c:/scroll%20effect/js/data/hackathon.js) | 24-Hour hackathon metadata, 3 problem statement domains (`domains[]`), timeline rounds, rules, sample PPT path, and coordinator contacts. |
| [`js/data/faq.js`](file:///c:/scroll%20effect/js/data/faq.js) | 8 common questions and answers regarding eligibility, rules, hardware requirements, and certificates. |

> **Placeholder Safety Rule**: Never invent facts, dates, phone numbers, or names. Anything unknown is marked with brackets (e.g. `"[DATE TBA]"`). The utility helper `ALODANAX_UTILS.isPlaceholder()` ensures unverified phone and email values never render as clickable `tel:` or `mailto:` links, showing a subtle `"TBA"` badge instead.

---

## How to Run the Developer Audit Tool (?audit=1)

The built-in audit diagnostic engine scans all data stores and the DOM to verify data completeness.

1. Start the server (`node server.js`).
2. Navigate to any page with `?audit=1`:
   ```
   http://localhost:3000/?audit=1
   http://localhost:3000/events.html?audit=1
   http://localhost:3000/hackathon.html?audit=1
   ```
3. A floating **DEV AUDIT HUD** will appear in the bottom-left corner showing:
   - Total unfilled `[...]` placeholders.
   - Pending / fallback image assets.
   - Breakdown of pending items per data file (`site.js`, `events.js`, `committee.js`, etc.).
   - A **"COPY REPORT"** button to copy the complete JSON diagnostic report to your clipboard.
4. Open your browser DevTools Console (F12) to inspect detailed interactive tables grouped by file.

---

## Automated QA & Test Suite

An automated end-to-end verification suite is included in `scripts/verify-multipage.js`. It runs headless Chrome via Chrome DevTools Protocol (CDP) to test all acceptance criteria across Desktop (1440×900) and Mobile (390×844):

```bash
node scripts/verify-multipage.js
```

All captured high-resolution verification screenshots are preserved in `screenshots/multipage/`.
