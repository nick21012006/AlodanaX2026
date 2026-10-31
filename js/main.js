/**
 * ALODANAX TECHFEST - CINEMATIC SCROLL-SCRUB ENGINE
 * Plain vanilla JS + GSAP ScrollTrigger + Lenis
 */

/* ==========================================================================
   TUNING CONSTANTS & CONFIGURATION
   ========================================================================== */
const PIN_LENGTH_VH = 500;        // Hero scroll pin distance in vh
const LERP = 0.14;                 // Smoothing lerp factor (0.12 - 0.18)
const USE_FRAME_SEQUENCE = false;  // Fallback to canvas frame sequence if needed

// Overlay Choreography Progress Ranges [inStart, inEnd, outStart, outEnd]
const CHOREO = {
  SCROLL_CUE:    { inStart: 0.00, inEnd: 0.00, outStart: 0.10, outEnd: 0.12 },
  NAVBAR:        { trigger: 0.20 },
  IMPACT_FLASH:  { inStart: 0.44, peak: 0.465, outEnd: 0.49, maxOpacity: 0.22 },
  PRESENTER:     { inStart: 0.58, inEnd: 0.62, outStart: 0.68, outEnd: 0.70 },
  TAGLINE:       { inStart: 0.70, inEnd: 0.74, outStart: 0.85, outEnd: 0.88 },
  CTAS:          { inStart: 0.88, inEnd: 0.92, outStart: 1.00, outEnd: 1.00 },
  ACCENTS: [
    { start: 0.00, end: 0.10, color: 'rgba(255, 23, 68, 0.4)' },
    { start: 0.10, end: 0.20, color: '#FF1744' }, // Neon Red
    { start: 0.20, end: 0.55, color: '#0A84FF' }, // Electric Blue
    { start: 0.55, end: 0.70, color: '#0A84FF' },
    { start: 0.70, end: 0.88, color: '#D6ECFF' }, // White-Blue starburst
    { start: 0.88, end: 1.00, color: '#FF1744' }  // Neon Red CTAs
  ]
};

/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */
let lenis = null;
let scrollTriggerInstance = null;
let video = null;
let targetTime = 0;
let isSeeking = false;
let isVideoReady = false;
let videoDuration = 9.96;
let isReducedMotion = false;
let debugMode = false;

// DOM Elements
const loaderEl = document.getElementById('loader');
const loaderBarEl = document.getElementById('loader-bar');
const siteHeaderEl = document.getElementById('site-header');
const heroPresenterEl = document.getElementById('hero-presenter');
const scrollCueEl = document.getElementById('scroll-cue');
const heroTaglineWrapEl = document.getElementById('hero-tagline-wrap');
const heroTaglineEl = document.getElementById('hero-tagline');
const heroDateVenueEl = document.getElementById('hero-date-venue');
const heroCtaGroupEl = document.getElementById('hero-cta-group');
const heroCtaRegisterEl = document.getElementById('hero-cta-register');
const heroCtaEventsEl = document.getElementById('hero-cta-events');
const impactFlashEl = document.getElementById('impact-flash');
const heroMediaWrapperEl = document.querySelector('.hero-media-wrapper');
const progressFillEl = document.getElementById('scroll-progress-fill');
const rootStyle = document.documentElement.style;

// Debug HUD elements
const debugHudEl = document.getElementById('debug-hud');
const dbgProgressEl = document.getElementById('dbg-progress');
const dbgTimeEl = document.getElementById('dbg-time');
const dbgDurEl = document.getElementById('dbg-dur');
const dbgFpsEl = document.getElementById('dbg-fps');
let fpsCounter = 0;
let lastFpsTime = performance.now();

/* ==========================================================================
   UTILITY FUNCTIONS
   ========================================================================== */
function calculateRangeFade(p, inStart, inEnd, outStart, outEnd) {
  if (p < inStart || p > outEnd) return 0;
  if (p < inEnd) {
    return inEnd > inStart ? (p - inStart) / (inEnd - inStart) : 1;
  }
  if (p <= outStart) {
    return 1;
  }
  if (p <= outEnd) {
    return outEnd > outStart ? 1 - (p - outStart) / (outEnd - outStart) : 1;
  }
  return 0;
}

function checkReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ==========================================================================
   CONTENT HYDRATION (FROM content.js)
   ========================================================================== */
function hydrateContent() {
  if (typeof SITE_CONTENT === 'undefined') return;

  if (heroPresenterEl) heroPresenterEl.textContent = SITE_CONTENT.hero.presenter;
  if (heroTaglineEl) heroTaglineEl.textContent = SITE_CONTENT.hero.tagline;
  if (heroDateVenueEl) heroDateVenueEl.textContent = SITE_CONTENT.hero.dateVenue;
  if (heroCtaRegisterEl) heroCtaRegisterEl.textContent = SITE_CONTENT.hero.ctaRegister;
  if (heroCtaEventsEl) heroCtaEventsEl.textContent = SITE_CONTENT.hero.ctaEvents;

  if (SITE_CONTENT.meta) {
    document.title = `${SITE_CONTENT.meta.festName} ${SITE_CONTENT.meta.edition} | ${SITE_CONTENT.meta.tagline}`;
  }
}

/* ==========================================================================
   INITIALIZE LENIS & GSAP
   ========================================================================== */
function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    orientation: 'vertical'
  });

  window.lenis = lenis;

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

/* ==========================================================================
   VIDEO SOURCE SELECTION & SETUP
   ========================================================================== */
function setupVideoSource() {
  video = document.getElementById('hero-video');
  if (!video) return;

  const isMobile = window.innerWidth < 768;
  const targetSrc = isMobile ? 'assets/introvideo_m.mp4' : 'assets/introvideo.mp4';

  video.src = targetSrc;
  video.load();

  video.addEventListener('seeking', () => { isSeeking = true; });
  video.addEventListener('seeked', () => { isSeeking = false; });

  video.addEventListener('loadedmetadata', () => {
    if (video.duration && !isNaN(video.duration)) {
      videoDuration = video.duration;
    }
    if (dbgDurEl) dbgDurEl.textContent = `${videoDuration.toFixed(2)}s`;
    try {
      video.currentTime = 0;
    } catch (e) {}
  });

  video.addEventListener('canplaythrough', () => {
    if (!isVideoReady) {
      isVideoReady = true;
      dismissLoader();
    }
  });

  video.addEventListener('error', (e) => {
    console.warn('Video failed to load or unsupported format, entering fallback mode:', e);
    enableFallbackMode();
  });
}

/* ==========================================================================
   DISMISS LOADER
   ========================================================================== */
function dismissLoader() {
  if (!loaderEl) return;
  if (loaderBarEl) loaderBarEl.style.width = '100%';

  setTimeout(() => {
    loaderEl.classList.add('is-hidden');
    if (scrollCueEl) {
      scrollCueEl.style.opacity = '1';
    }
  }, 350);
}

/* ==========================================================================
   FALLBACK MODE (REDUCED MOTION / VIDEO FAILURE)
   ========================================================================== */
function enableFallbackMode() {
  document.body.classList.add('is-fallback');
  dismissLoader();

  if (video) {
    video.style.display = 'none';
  }

  const mediaWrap = document.querySelector('.hero-media-wrapper');
  if (mediaWrap) {
    mediaWrap.style.backgroundImage = 'url("assets/hero-poster.jpg")';
    mediaWrap.style.backgroundSize = 'cover';
    mediaWrap.style.backgroundPosition = 'center';
  }

  if (siteHeaderEl) siteHeaderEl.classList.add('is-visible');
  if (heroPresenterEl) {
    heroPresenterEl.style.opacity = '1';
    heroPresenterEl.style.transform = 'none';
  }
  if (heroTaglineWrapEl) {
    heroTaglineWrapEl.style.opacity = '1';
    heroTaglineWrapEl.style.transform = 'translateX(-50%)';
    heroTaglineWrapEl.style.pointerEvents = 'auto';
  }
  if (heroCtaGroupEl) {
    heroCtaGroupEl.style.opacity = '1';
    heroCtaGroupEl.style.transform = 'translateX(-50%)';
    heroCtaGroupEl.style.pointerEvents = 'auto';
  }
}

/* ==========================================================================
   SCROLL CHOREOGRAPHY & SAFE ZONES
   Safe zone: No text in 30% - 68% viewport during 40% - 100% of scroll
   Top zone: 0% - 25% viewport height
   Bottom zone: 70% - 100% viewport height
   ========================================================================== */
function updateChoreography(progress) {
  // 1. Right Edge Progress Bar & Dynamic Accent Color
  if (progressFillEl) {
    progressFillEl.style.height = `${progress * 100}%`;
  }
  const currentAccent = CHOREO.ACCENTS.find(a => progress >= a.start && progress <= a.end);
  if (currentAccent) {
    rootStyle.setProperty('--accent', currentAccent.color);
  }

  // 2. 0–10% Scroll Cue (Fades out by 12%)
  const cueOpacity = calculateRangeFade(
    progress,
    CHOREO.SCROLL_CUE.inStart,
    CHOREO.SCROLL_CUE.inEnd,
    CHOREO.SCROLL_CUE.outStart,
    CHOREO.SCROLL_CUE.outEnd
  );
  if (scrollCueEl) {
    scrollCueEl.style.opacity = cueOpacity;
    scrollCueEl.style.transform = `translateX(-50%) translateY(${progress * 25}px)`;
  }

  // 3. Navbar fade-in at 20%
  if (siteHeaderEl) {
    if (progress >= CHOREO.NAVBAR.trigger) {
      siteHeaderEl.classList.add('is-visible');
    } else {
      siteHeaderEl.classList.remove('is-visible');
    }
  }

  // 4. Impact Moment at 40–50% (White flash <= 0.25 & subtle shake)
  if (progress >= CHOREO.IMPACT_FLASH.inStart && progress <= CHOREO.IMPACT_FLASH.outEnd) {
    let flashOpacity = 0;
    if (progress <= CHOREO.IMPACT_FLASH.peak) {
      flashOpacity = ((progress - CHOREO.IMPACT_FLASH.inStart) / (CHOREO.IMPACT_FLASH.peak - CHOREO.IMPACT_FLASH.inStart)) * CHOREO.IMPACT_FLASH.maxOpacity;
    } else {
      flashOpacity = (1 - ((progress - CHOREO.IMPACT_FLASH.peak) / (CHOREO.IMPACT_FLASH.outEnd - CHOREO.IMPACT_FLASH.peak))) * CHOREO.IMPACT_FLASH.maxOpacity;
    }
    if (impactFlashEl) impactFlashEl.style.opacity = flashOpacity;

    if (heroMediaWrapperEl) {
      const shakeX = (Math.sin(progress * 280) * 1.5).toFixed(1);
      const shakeY = (Math.cos(progress * 240) * 1.0).toFixed(1);
      heroMediaWrapperEl.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
    }
  } else {
    if (impactFlashEl) impactFlashEl.style.opacity = '0';
    if (heroMediaWrapperEl) heroMediaWrapperEl.style.transform = 'translate(0px, 0px)';
  }

  // 5. 58–70% Top Zone: "[DEPARTMENT, COLLEGE] PRESENTS" (Top 25% zone)
  const presOpacity = calculateRangeFade(
    progress,
    CHOREO.PRESENTER.inStart,
    CHOREO.PRESENTER.inEnd,
    CHOREO.PRESENTER.outStart,
    CHOREO.PRESENTER.outEnd
  );
  if (heroPresenterEl) {
    heroPresenterEl.style.opacity = presOpacity;
    heroPresenterEl.style.transform = `translateY(${(1 - presOpacity) * -8}px)`;
  }

  // 6. 70–88% Bottom Zone: Tagline and Date · Venue (Bottom 30% zone)
  const tagOpacity = calculateRangeFade(
    progress,
    CHOREO.TAGLINE.inStart,
    CHOREO.TAGLINE.inEnd,
    CHOREO.TAGLINE.outStart,
    CHOREO.TAGLINE.outEnd
  );
  if (heroTaglineWrapEl) {
    heroTaglineWrapEl.style.opacity = tagOpacity;
    heroTaglineWrapEl.style.transform = `translateX(-50%) translateY(${(1 - tagOpacity) * 12}px)`;
  }

  // 7. 88–100% Bottom Zone: Final CTAs (Bottom 30% zone)
  const ctaOpacity = calculateRangeFade(
    progress,
    CHOREO.CTAS.inStart,
    CHOREO.CTAS.inEnd,
    CHOREO.CTAS.outStart,
    CHOREO.CTAS.outEnd
  );
  if (heroCtaGroupEl) {
    heroCtaGroupEl.style.opacity = ctaOpacity;
    heroCtaGroupEl.style.transform = `translateX(-50%) translateY(${(1 - ctaOpacity) * 12}px)`;
    heroCtaGroupEl.style.pointerEvents = ctaOpacity > 0.5 ? 'auto' : 'none';
  }

  // Update Debug HUD if active
  if (debugMode) {
    if (dbgProgressEl) dbgProgressEl.textContent = `${(progress * 100).toFixed(2)}%`;
  }
}

/* ==========================================================================
   SMOOTH SCRUB LOOP (GSAP TICKER + LERP)
   ========================================================================== */
function initSmoothScrub() {
  if (isReducedMotion) {
    enableFallbackMode();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  scrollTriggerInstance = ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: `+=${PIN_LENGTH_VH}vh`,
    pin: true,
    scrub: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      targetTime = p * videoDuration;
      updateChoreography(p);
    }
  });

  gsap.ticker.add(() => {
    if (debugMode) {
      fpsCounter++;
      const now = performance.now();
      if (now - lastFpsTime >= 500) {
        const currentFps = Math.round((fpsCounter * 1000) / (now - lastFpsTime));
        if (dbgFpsEl) dbgFpsEl.textContent = currentFps;
        fpsCounter = 0;
        lastFpsTime = now;
      }
      if (video && dbgTimeEl) {
        dbgTimeEl.textContent = `${video.currentTime.toFixed(2)}s`;
      }
    }

    if (!video || !isVideoReady || isSeeking) return;

    const diff = targetTime - video.currentTime;

    if (Math.abs(diff) < 0.01) return;

    const nextTime = video.currentTime + diff * LERP;

    try {
      video.currentTime = Math.max(0, Math.min(videoDuration - 0.02, nextTime));
    } catch (err) {}
  });
}

/* ==========================================================================
   DEBUG HUD CHECK (?debug=1)
   ========================================================================== */
function checkDebugParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    debugMode = true;
    if (debugHudEl) debugHudEl.classList.add('is-active');
  }
}

/* ==========================================================================
   INITIALIZATION LIFECYCLE
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  checkDebugParam();
  hydrateContent();

  isReducedMotion = checkReducedMotion();

  if (isReducedMotion) {
    enableFallbackMode();
    return;
  }

  initLenis();
  setupVideoSource();
  initSmoothScrub();

  setTimeout(() => {
    if (!isVideoReady) {
      console.warn('Loader safety timeout reached (6s); dismissing loader.');
      isVideoReady = true;
      dismissLoader();
    }
  }, 6000);
});
