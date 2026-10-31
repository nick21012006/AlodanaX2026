/**
 * ALODANAX TECHFEST - CINEMATIC ENGINE & INTERACTION CONTROLLER
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

// DOM Elements - Hero & Core
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

// DOM Elements - Debug HUD
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

  // 1. Meta & Hero Hydration
  if (SITE_CONTENT.meta) {
    document.title = `${SITE_CONTENT.meta.festName} ${SITE_CONTENT.meta.edition} | ${SITE_CONTENT.meta.tagline}`;
  }
  if (heroPresenterEl) heroPresenterEl.textContent = SITE_CONTENT.hero.presenter;
  if (heroTaglineEl) heroTaglineEl.textContent = SITE_CONTENT.hero.tagline;
  if (heroDateVenueEl) heroDateVenueEl.textContent = SITE_CONTENT.hero.dateVenue;
  if (heroCtaRegisterEl) heroCtaRegisterEl.textContent = SITE_CONTENT.hero.ctaRegister;
  if (heroCtaEventsEl) heroCtaEventsEl.textContent = SITE_CONTENT.hero.ctaEvents;

  // 2. About Section
  const aboutTag = document.getElementById('about-tag');
  const aboutTitle1 = document.getElementById('about-title-1');
  const aboutTitle2 = document.getElementById('about-title-2');
  const aboutDesc = document.getElementById('about-description');
  if (aboutTag) aboutTag.textContent = SITE_CONTENT.about.sectionTag;
  if (aboutTitle1) aboutTitle1.textContent = SITE_CONTENT.about.titlePrimary;
  if (aboutTitle2) aboutTitle2.textContent = SITE_CONTENT.about.titleSecondary;
  if (aboutDesc) aboutDesc.textContent = SITE_CONTENT.about.description;

  // Stat Counters Hydration
  SITE_CONTENT.about.stats.forEach((stat, i) => {
    const valEl = document.getElementById(`stat-val-${i}`);
    const lblEl = document.getElementById(`stat-lbl-${i}`);
    if (valEl) valEl.textContent = stat.value;
    if (lblEl) lblEl.textContent = stat.label;
  });

  // 3. Events Section Hydration
  renderEvents('all');

  // 4. Schedule Section Hydration
  renderSchedule();

  // 5. Register Section Dropdown
  const selectEl = document.getElementById('reg-event');
  if (selectEl && SITE_CONTENT.register && SITE_CONTENT.register.eventOptions) {
    SITE_CONTENT.register.eventOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.name;
      option.textContent = `[${opt.category.toUpperCase()}] ${opt.name}`;
      selectEl.appendChild(option);
    });
  }

  // 6. Footer Hydration
  const footDept = document.getElementById('footer-department');
  const footTag = document.getElementById('footer-tagline');
  const footContact = document.getElementById('footer-contact-info');
  const footVenue = document.getElementById('footer-venue-info');
  const footInsta = document.getElementById('footer-instagram');
  const footCopy = document.getElementById('footer-copyright');

  if (footDept) footDept.textContent = SITE_CONTENT.meta.department;
  if (footTag) footTag.textContent = SITE_CONTENT.meta.tagline;
  if (footContact) footContact.textContent = SITE_CONTENT.contact.email;
  if (footVenue) footVenue.textContent = SITE_CONTENT.meta.venue;
  if (footInsta) footInsta.textContent = SITE_CONTENT.contact.instagram;
  if (footCopy) footCopy.textContent = `© ${SITE_CONTENT.meta.edition} ${SITE_CONTENT.meta.festName}. ${SITE_CONTENT.meta.department}. ${SITE_CONTENT.footer.rights}.`;
}

/* ==========================================================================
   RENDER EVENTS & 3D TILT
   ========================================================================== */
function renderEvents(filterCategory = 'all') {
  const container = document.getElementById('events-grid-container');
  if (!container || !SITE_CONTENT.events) return;

  container.innerHTML = '';
  let cardCount = 0;

  SITE_CONTENT.events.categories.forEach(cat => {
    if (filterCategory !== 'all' && cat.id !== filterCategory) return;

    cat.items.forEach((item, index) => {
      cardCount++;
      const isFeatured = (filterCategory === 'all' && index === 0 && cat.id === 'technical');

      const card = document.createElement('article');
      card.className = `event-card reveal-item ${isFeatured ? 'featured-event-span' : ''}`;
      card.setAttribute('data-tilt-card', 'true');

      card.innerHTML = `
        <div class="event-card-header">
          <span class="event-tag-badge">${item.tag}</span>
          <span class="event-category-label">${cat.name}</span>
        </div>
        <div class="event-card-body">
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
        </div>
        <div class="event-card-footer">
          <div class="event-meta-item">
            <span class="meta-label">REWARD</span>
            <span class="meta-value">${item.prize}</span>
          </div>
          <div class="event-meta-item">
            <span class="meta-label">STRUCTURE</span>
            <span class="meta-value">${item.team}</span>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  });

  init3DTilt();
  initScrollReveals();
}

/* 3D Tilt on Pointer Move (Disabled on touch) */
function init3DTilt() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) return;

  const cards = document.querySelectorAll('[data-tilt-card]');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8; // Max 8 deg
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

/* ==========================================================================
   RENDER SCHEDULE TIMELINE
   ========================================================================== */
function renderSchedule() {
  const wrapper = document.getElementById('timeline-days-wrapper');
  if (!wrapper || !SITE_CONTENT.schedule) return;

  wrapper.innerHTML = '';
  let globalItemIndex = 0;

  SITE_CONTENT.schedule.days.forEach(day => {
    const dayBlock = document.createElement('div');
    dayBlock.className = 'timeline-day-block reveal-item';

    let itemsHtml = '';
    day.events.forEach(ev => {
      const side = (globalItemIndex % 2 === 0) ? 'side-left' : 'side-right';
      itemsHtml += `
        <div class="timeline-item ${side}" data-timeline-index="${globalItemIndex}">
          <div class="item-content">
            <span class="item-time">${ev.time}</span>
            <h4 class="item-title">${ev.title}</h4>
            <span class="item-venue">${ev.venue}</span>
          </div>
          <div class="timeline-node-slot">
            <div class="timeline-node" id="tl-node-${globalItemIndex}" aria-hidden="true"></div>
          </div>
          <div></div>
        </div>
      `;
      globalItemIndex++;
    });

    dayBlock.innerHTML = `
      <div class="timeline-day-header">
        <span class="day-badge">${day.day}</span>
      </div>
      <div class="timeline-events-list">
        ${itemsHtml}
      </div>
    `;

    wrapper.appendChild(dayBlock);
  });

  initScheduleScrollAnimation();
}

/* Schedule Scroll Animation: Drawing line & glowing nodes */
function initScheduleScrollAnimation() {
  const container = document.getElementById('timeline-container');
  const progressLine = document.getElementById('timeline-progress-line');
  if (!container || !progressLine) return;

  ScrollTrigger.create({
    trigger: container,
    start: 'top 75%',
    end: 'bottom 60%',
    scrub: 0.5,
    onUpdate: (self) => {
      const p = self.progress;
      progressLine.style.height = `${(p * 100).toFixed(1)}%`;

      const nodes = document.querySelectorAll('.timeline-node');
      nodes.forEach((node, i) => {
        const threshold = (i + 0.5) / nodes.length;
        if (p >= threshold) {
          node.classList.add('is-active');
        } else {
          node.classList.remove('is-active');
        }
      });
    }
  });
}

/* ==========================================================================
   SCROLL REVEALS & ANIMATED STAT COUNTERS
   ========================================================================== */
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-item:not(.is-revealed)');
  revealElements.forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        el.classList.add('is-revealed');

        // Check if element is a stat card to animate counter
        if (el.classList.contains('stat-card')) {
          animateStatCounter(el);
        }
      }
    });
  });
}

function animateStatCounter(cardEl) {
  const statIndex = cardEl.getAttribute('data-stat-index');
  const numberEl = cardEl.querySelector('.stat-number');
  if (!numberEl || !statIndex || !SITE_CONTENT.about.stats[statIndex]) return;

  const originalText = SITE_CONTENT.about.stats[statIndex].value;
  // If it's a bracketed placeholder like "[50+]", animate with digital rolling effect
  let steps = 0;
  const maxSteps = 12;
  const chars = "0123456789+₹AX";

  const interval = setInterval(() => {
    steps++;
    if (steps >= maxSteps) {
      clearInterval(interval);
      numberEl.textContent = originalText;
    } else {
      let scrambled = "";
      for (let c = 0; c < originalText.length; c++) {
        if (originalText[c] === '[' || originalText[c] === ']') {
          scrambled += originalText[c];
        } else {
          scrambled += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      numberEl.textContent = scrambled;
    }
  }, 50);
}

/* ==========================================================================
   EVENT TABS FILTERING
   ========================================================================== */
function initEventTabs() {
  const tabs = document.querySelectorAll('.event-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const category = tab.getAttribute('data-category');
      renderEvents(category);
    });
  });
}

/* ==========================================================================
   REGISTRATION FORM CONTROLLER (FRONT-END ONLY)
   ========================================================================== */
function initRegistrationForm() {
  const form = document.getElementById('registration-form');
  const successPanel = document.getElementById('register-success');
  const resetBtn = document.getElementById('reg-reset-btn');
  const successEventName = document.getElementById('success-event-name');
  const successPassId = document.getElementById('success-pass-id');

  if (!form) return;

  // NOTE: This interface is a front-end prototype.
  // No live server backend is currently hooked up.
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const collegeInput = document.getElementById('reg-college');
    const eventInput = document.getElementById('reg-event');

    const errName = document.getElementById('err-name');
    const errEmail = document.getElementById('err-email');
    const errCollege = document.getElementById('err-college');
    const errEvent = document.getElementById('err-event');

    // Reset error states
    [nameInput, emailInput, collegeInput, eventInput].forEach(el => el.classList.remove('is-invalid'));
    [errName, errEmail, errCollege, errEvent].forEach(el => el.textContent = '');

    // 1. Name check
    if (!nameInput.value.trim()) {
      nameInput.classList.add('is-invalid');
      errName.textContent = 'Please enter your full name.';
      isValid = false;
    }

    // 2. Email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      emailInput.classList.add('is-invalid');
      errEmail.textContent = 'Please provide a valid institutional email address.';
      isValid = false;
    }

    // 3. College check
    if (!collegeInput.value.trim()) {
      collegeInput.classList.add('is-invalid');
      errCollege.textContent = 'Please specify your college or university.';
      isValid = false;
    }

    // 4. Event check
    if (!eventInput.value) {
      eventInput.classList.add('is-invalid');
      errEvent.textContent = 'Please select a primary competition arena.';
      isValid = false;
    }

    if (!isValid) return;

    // Simulation of front-end registration success state
    const generatedPass = `AX-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    if (successPassId) successPassId.textContent = generatedPass;
    if (successEventName) successEventName.textContent = eventInput.value;

    form.style.display = 'none';
    if (successPanel) successPanel.style.display = 'block';
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.style.display = 'block';
      if (successPanel) successPanel.style.display = 'none';
    });
  }
}

/* ==========================================================================
   SMOOTH ANCHOR NAVIGATION (LENIS INTEGRATION)
   ========================================================================== */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(targetEl, { offset: -60, duration: 1.2 });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
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
  } else {
    initLenis();
    setupVideoSource();
    initSmoothScrub();
  }

  initEventTabs();
  initRegistrationForm();
  initSmoothAnchors();
  initScrollReveals();

  setTimeout(() => {
    if (!isVideoReady) {
      console.warn('Loader safety timeout reached (6s); dismissing loader.');
      isVideoReady = true;
      dismissLoader();
    }
  }, 6000);
});
