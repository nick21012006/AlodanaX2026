# ALODANAX 2026 — Pre-Flight & Launch Checklist

This document is the single source of truth for the production launch of **ALODANAX 2026** (1st Edition).

---

## 1. Confirmed Event Specifications & Registration Links

All 5 event names, slugs, and verified Google Form registration links have been confirmed and integrated across all portal pages (`index.html`, `events.html`, `hackathon.html`, `contact.html`).

| Final Event Name | Category | Final Slug | Registration URL | HTTP Status |
|---|---|---|---|---|
| **Hackathon** | Technical | `hackathon` | `https://forms.gle/iTh2dt56ueLDLSLK8` | `302 Found` (Verified) |
| **BitBash Bonanza** | Technical | `bitbash-bonanza` | `https://forms.gle/ZWLtwwXLf3e11X2u8` | `302 Found` (Verified) |
| **Ideathon** | Non-Technical | `ideathon` | `https://forms.gle/hQ9cBX9iVSTTyhk69` | `302 Found` (Verified) |
| **BattleStorm** | Gaming | `battlestorm` | `https://forms.gle/69gYf1w9RuPxXQun9` | `302 Found` (Verified) |
| **Discovering Derelicts** | Gaming | `discovering-derelicts` | `https://forms.gle/5JSqoxvNhS6BVeRb6` | `302 Found` (Verified) |

---

## 2. Event Link & Navigation Behavior

- **`index.html` (Featured Events)**:
  - `REGISTER` buttons link directly to `events.html` (same tab) as an exploratory funnel.
  - `DETAILS` buttons link to `events.html#event=<slug>`, automatically triggering the deep-linked detail modal on arrival.
- **`events.html` (Portal)**:
  - Event card `REGISTER` buttons open the confirmed Google Form in a new tab with `target="_blank" rel="noopener noreferrer"`.
  - Event detail modal `REGISTER NOW` button opens the verified Google Form with `target="_blank" rel="noopener noreferrer"`.
  - Empty link fallback: If an event has no valid registration link, clicking `REGISTER` or `REGISTER NOW` shows a non-blocking toast notification: `"REGISTRATION OPENING SOON"`.
  - Hackathon modal displays the secondary button **Problem Statements** linking to `hackathon.html` in the same tab.
- **`hackathon.html` (Flagship Arena)**:
  - `REGISTER NOW` button links to `https://forms.gle/iTh2dt56ueLDLSLK8` with `target="_blank" rel="noopener noreferrer"`.

---

## 3. Remaining Bracketed Placeholders (Intentional Fill-ins)

The following bracketed placeholders are intentionally left for organizer data entry:

1. **Dates & Schedule**:
   - `[DATE TBA]` in event cards, modal metadata, and hero HUD.
   - `startDateISO` in `SITE_DATA` (triggers the live countdown HUD once populated with an ISO 8601 timestamp like `2026-03-15T09:00:00+05:30`).
2. **College & Department Branding**:
   - College Name: `Model College` (Configured)
   - Department: `IT/CS Department` (Configured)
   - Venue: `Model College Campus, Dombivli (East)` (Configured)
   - Address & Interactive Map: Verified from `model-college.edu.in` and embedded with Google Maps navigation link.
3. **Contact Information & Inquiry System**:
   - Campus Email: `contact@model-college.edu.in` (Configured)
   - Phone: `+91 70456 82157` (Configured)
   - Official Inquiries: Formspree endpoint `https://formspree.io/f/mjywpwpl` connected to `nikunj.s.more@gmail.com` with spam protection and mailto fallback.
4. **Student Coordinators**:
   - Coordinator names and phone numbers in `events.html`, `contact.html`, and `hackathon.html` (`[COORD 1]`, `[PHONE TBA]`).
5. **Hackathon Problem Statements**:
   - `hackathon.html` domain titles and statements (`[DOMAIN 1: ...]`, `[PS-01]`, etc.).

---

## 4. Production Deployment Packaging

### Files to Deploy (Static Hosting — Vercel / Netlify / Cloudflare Pages / GitHub Pages)
Upload **ONLY** static frontend assets:
- `index.html` (Homepage & festival overview)
- `events.html` (Events portal & modal dialogs)
- `hackathon.html` (24H Hackathon portal)
- `team.html` (Crew directory)
- `contact.html` (Contact, coordinators, and FAQ)
- `assets/` (Images, video backgrounds, icons)
- `data/` (Static JSON data, if applicable)
- `favicon.ico`
- `vercel.json` (Security headers and clean routing)

### Files NOT to Deploy (Keep Private / Do Not Upload)
- `backend/` (Local Flask admin panel — hackathon judging only)
- `server.js` (Local development HTTP server)
- `tools/` (Typography and accessibility audit scripts)
- `scripts/` (Automated Chrome acceptance test scripts)
- `.qa/` (Temporary test scripts and logs)
- `.git/` & `.gitignore`
- `TEAM PHOTOS/` (Raw image source folder)

---

## 5. Post-Launch Action Items

- [ ] **Custom Domain**: Connect production DNS (e.g., `alodanax.com` or college subdomain).
- [ ] **OG Social Preview Image**: Design and upload `assets/images/og-preview.jpg` (1200×630px) and update `<meta property="og:image">`.
- [ ] **Event Dates Announcement**: Update `[DATE TBA]` and set `startDateISO` in `SITE_DATA.college.startDateISO` to activate countdown clock.
- [ ] **Real Problem Statements**: Replace Hackathon domain placeholders with final hackathon problem statements when released.
- [ ] **Coordinator Numbers**: Add student lead phone numbers in `contact.html` and `events.html`.
