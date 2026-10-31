# ALODANAX — Annual IT/CS TechFest Landing Experience

A premium, cinematic, scroll-driven landing website built for **ALODANAX**, the annual TechFest of a college IT/CS department.

Built with plain HTML5, CSS3, and vanilla JavaScript using GSAP + ScrollTrigger, Lenis smooth scrolling, and Google Fonts (Syne & Inter). No build step, no external frameworks.

---

## Quick Start & Local Testing

Because smooth HTML5 video scrubbing requires **HTTP 206 Partial Content (Range requests)**, do not open `index.html` via `file://` or Python's basic `http.server`.

Use the included zero-dependency Node HTTP Range server or `npx serve`:

### Option A: Built-in Range Server (Recommended)
```bash
node server.js
```
Open **http://localhost:3000/** in your browser.

### Option B: npx serve
```bash
npx serve .
```
Open the provided URL (e.g. **http://localhost:3000/**).

To enable the performance HUD (scroll %, video timestamp, real-time FPS), add `?debug=1`:
```
http://localhost:3000/?debug=1
```

---

## How to Edit Content

All copy, event details, schedules, and bracketed placeholders are centrally managed in:
[`js/content.js`](file:///c:/scroll%20effect/js/content.js)

To update fest information:
1. Open `js/content.js`.
2. Replace any bracketed placeholders:
   - `department`: Replace `"[DEPARTMENT, COLLEGE]"` with your department/institution name.
   - `tagline`: Replace `"[TAGLINE]"` with your fest theme.
   - `dateVenue`: Replace `"[DATE] · [VENUE]"`.
   - `events`: Update titles, descriptions, prize pools, and team requirements.
   - `contact`: Update email, phone, Instagram handle, and address.
3. Save the file. The page updates automatically on reload.

---

## How to Swap or Re-encode the Intro Video (Step 0)

1. Place your new raw video file into `assets/source/introvideo.mp4` (preserving original source).
2. Run the following terminal commands to generate the all-keyframe copy (stripping audio, removing watermarks, and producing instant seekable frames):

```bash
# Re-encode to all-keyframe copy (with delogo filter)
ffmpeg -i assets/source/introvideo.mp4 -an -vf "delogo=x=1690:y=852:w=100:h=96" \
  -c:v libx264 -g 1 -crf 20 -pix_fmt yuv420p -movflags +faststart \
  assets/introvideo.mp4

# Generate poster fallback frame at 9.8s
ffmpeg -ss 9.8 -i assets/introvideo.mp4 -frames:v 1 -q:v 2 assets/hero-poster.jpg

# Generate lightweight mobile copy (viewport < 768px)
ffmpeg -i assets/source/introvideo.mp4 -an -vf "delogo=x=1690:y=852:w=100:h=96,scale=1280:-2" \
  -c:v libx264 -g 1 -crf 23 -pix_fmt yuv420p -movflags +faststart \
  assets/introvideo_m.mp4
```

---

## Canvas Frame-Sequence Fallback

If you require canvas frame scrubbing on legacy touch devices:
1. Generate the WebP frame sequence:
```bash
mkdir -p assets/frames && ffmpeg -i assets/introvideo.mp4 -vf "scale=1280:-2" \
  -c:v libwebp -quality 80 assets/frames/frame_%04d.webp
```
2. Open [`js/main.js`](file:///c:/scroll%20effect/js/main.js) and toggle:
```javascript
const USE_FRAME_SEQUENCE = true;
```

---

## Architecture & Safe Zones

- **Strict Palette**:
  - Pure Black: `#000000` / `#05060A`
  - Surface: `#0B0D14`
  - Electric Blue: `#0A84FF`
  - Neon Red: `#FF1744` (glow `rgba(255, 23, 68, 0.55)`)
  - Crisp White: `#FFFFFF`
- **Safe Zone Rule**: No text ever overlaps the vertical band 30%–68% of the viewport during 40%–100% of the scroll timeline.
- **Fallbacks**: `prefers-reduced-motion` and video error fallbacks automatically display a static poster with zero scroll-pin lock and full overlay access.
