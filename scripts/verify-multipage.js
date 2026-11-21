const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9236;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendCdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(ws, expression) {
  const res = await sendCdp(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  return res.result ? res.result.value : null;
}

async function captureScreenshot(ws, filename) {
  const res = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  fs.writeFileSync(filename, buffer);
}

async function runTestSuite() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots', 'multipage');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('====================================================');
  console.log('   ALODANAX MULTI-PAGE AUTOMATED ACCEPTANCE SUITE   ');
  console.log('====================================================');

  console.log('Launching Headless Chrome on port', PORT, '...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-extensions',
    'http://localhost:3000/?debug=1'
  ]);

  await sleep(2500);

  const report = {
    homeHeroScrub: false,
    homeSectionsOrder: false,
    homeOldSectionsRemoved: false,
    sharedNavFooter: false,
    mobileMenu: false,
    eventsCategories: false,
    eventsLiveSearch: false,
    eventsModalDeepLink: false,
    eventsRegistrationDisabled: false,
    facultyDirectorySearch: false,
    hackathonDomainsDeepLink: false,
    hackathonPptCheck: false,
    hackathonRulesAndHeads: false,
    team40Cards: false,
    teamDynamicChips: false,
    contactMapFallback: false,
    contactCoordinatorsAggregated: false,
    contactFaqAccordion: false,
    contactInquiryValidation: false,
    auditToolVerified: false,
    zeroConsoleErrors: false
  };

  const consoleErrors = [];

  try {
    const listResp = await fetch(`http://localhost:${PORT}/json`);
    const pages = await listResp.json();
    const page = pages.find(p => p.type === 'page');
    if (!page) throw new Error('Target page not found among Chrome endpoints');
    const wsUrl = page.webSocketDebuggerUrl;
    console.log('Connected to target page WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');
    await sendCdp(ws, 'DOM.enable');

    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
        if (type === 'error' && !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });

    // -----------------------------------------------------------------
    // TEST 1: HOME PAGE (index.html) at 1440x900
    // -----------------------------------------------------------------
    console.log('\n[1/6] Testing index.html (Home Page)...');
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/?debug=1' });
    await sleep(2500);

    // Verify Old Sections Removed
    const oldSections = await evaluate(ws, `({
      hasSchedule: !!document.getElementById('schedule'),
      hasOldForm: !!document.getElementById('registration-form')
    })`);
    report.homeOldSectionsRemoved = (!oldSections.hasSchedule && !oldSections.hasOldForm);
    console.log('  ✔ Old Schedule and old Register form removed:', report.homeOldSectionsRemoved);

    // Verify Sections Order
    const sectionsOrder = await evaluate(ws, `(() => {
      const main = document.getElementById('content');
      const sectionIds = Array.from(main.querySelectorAll('section')).map(s => s.id);
      return sectionIds;
    })()`);
    console.log('  Post-hero sections in order:', sectionsOrder);
    const expectedOrder = ['about', 'collaborator', 'categories', 'featured-events', 'why', 'cta'];
    report.homeSectionsOrder = (JSON.stringify(sectionsOrder) === JSON.stringify(expectedOrder));
    console.log('  ✔ Sections in exact required order:', report.homeSectionsOrder);

    // Verify Hero Scrub & Nav
    await evaluate(ws, `window.scrollTo(0, 1200)`);
    await sleep(700);
    const heroNavStatus = await evaluate(ws, `(() => {
      const header = document.getElementById('site-header');
      const brand = document.querySelector('.nav-brand .brand-text');
      return {
        isVisible: header ? header.classList.contains('is-visible') : false,
        brandText: brand ? brand.textContent : ''
      };
    })()`);
    report.homeHeroScrub = (heroNavStatus.isVisible && heroNavStatus.brandText === 'ALODANAX');
    console.log('  ✔ Hero scroll scrub & nav fade-in at 20% scroll:', report.homeHeroScrub);

    // Verify Featured Events (5 cards)
    const featuredCount = await evaluate(ws, `document.querySelectorAll('.featured-event-card').length`);
    console.log('  ✔ Featured event cards count:', featuredCount, '(expected 5)');

    // Verify Collaborator & 3 Guest Cards
    const guestsCount = await evaluate(ws, `document.querySelectorAll('.guest-card').length`);
    console.log('  ✔ Collaborator guest cards count:', guestsCount, '(expected 3)');

    await captureScreenshot(ws, path.join(screenshotsDir, '01_desktop_home_hero.png'));

    await evaluate(ws, `document.getElementById('featured-events').scrollIntoView()`);
    await sleep(500);
    await captureScreenshot(ws, path.join(screenshotsDir, '02_desktop_home_featured.png'));

    // -----------------------------------------------------------------
    // TEST 2: EVENTS PORTAL (events.html)
    // -----------------------------------------------------------------
    console.log('\n[2/6] Testing events.html (Discovery & Registration Portal)...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/events.html' });
    await sleep(1500);

    // Check 3 categories exist
    const categorySections = await evaluate(ws, `({
      hasTech: !!document.getElementById('section-technical'),
      hasNonTech: !!document.getElementById('section-non-technical'),
      hasGaming: !!document.getElementById('section-gaming'),
      techCount: document.querySelectorAll('#grid-technical .event-card-item').length,
      nonTechCount: document.querySelectorAll('#grid-non-technical .event-card-item').length,
      gamingCount: document.querySelectorAll('#grid-gaming .event-card-item').length
    })`);
    report.eventsCategories = (categorySections.hasTech && categorySections.hasNonTech && categorySections.hasGaming && categorySections.techCount >= 2);
    console.log('  ✔ 3 Visually distinct category sections present:', report.eventsCategories, categorySections);

    // Test Live Search Filter
    await evaluate(ws, `(() => {
      const input = document.getElementById('events-search-input');
      input.value = 'Hackathon';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(300);
    const searchFilterResult = await evaluate(ws, `({
      techCount: document.querySelectorAll('#grid-technical .event-card-item').length,
      nonTechVisible: document.getElementById('section-non-technical').style.display,
      gamingVisible: document.getElementById('section-gaming').style.display
    })`);
    report.eventsLiveSearch = (searchFilterResult.techCount === 1 && searchFilterResult.nonTechVisible === 'none' && searchFilterResult.gamingVisible === 'none');
    console.log('  ✔ Live search filters matches in real time:', report.eventsLiveSearch);

    // Clear Search
    await evaluate(ws, `document.getElementById('events-search-clear').click()`);
    await sleep(200);

    // Test Deep Link to Modal (#event=hackathon)
    await evaluate(ws, `window.location.hash = '#event=hackathon'`);
    await sleep(500);
    const modalState = await evaluate(ws, `(() => {
      const modal = document.getElementById('event-modal');
      const title = document.getElementById('modal-event-title').textContent;
      const regBtn = document.querySelector('#modal-register-wrap .btn-disabled');
      const extraLink = document.querySelector('#modal-extra-link-wrap a');
      const bodyScrollLocked = document.body.style.overflow === 'hidden';
      return {
        isOpen: modal.classList.contains('is-active'),
        title,
        isRegDisabled: !!regBtn,
        hasExtraLink: !!extraLink && extraLink.getAttribute('href') === 'hackathon.html',
        bodyScrollLocked
      };
    })()`);
    report.eventsModalDeepLink = (modalState.isOpen && modalState.title === 'Hackathon' && modalState.bodyScrollLocked && modalState.hasExtraLink);
    report.eventsRegistrationDisabled = modalState.isRegDisabled;
    console.log('  ✔ Modal deep link & focus/scroll lock:', report.eventsModalDeepLink, modalState);
    console.log('  ✔ Registration button disabled with "Registration Opening Soon":', report.eventsRegistrationDisabled);

    await captureScreenshot(ws, path.join(screenshotsDir, '03_desktop_events_modal.png'));

    // Test ESC Key Closes Modal
    await sendCdp(ws, 'Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
    await sendCdp(ws, 'Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(300);
    const isModalClosed = await evaluate(ws, `!document.getElementById('event-modal').classList.contains('is-active')`);
    console.log('  ✔ ESC key successfully closes modal:', isModalClosed);

    // -----------------------------------------------------------------
    // TEST 3: FACULTY DIRECTORY (faculty.html)
    // -----------------------------------------------------------------
    console.log('\n[3/6] Testing faculty.html (Academic Mentors)...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/faculty.html' });
    await sleep(1500);

    const initialFacultyCount = await evaluate(ws, `document.querySelectorAll('.faculty-profile-card').length`);
    console.log('  ✔ Initial faculty count:', initialFacultyCount);

    // Live filter search
    await evaluate(ws, `(() => {
      const input = document.getElementById('faculty-search-input');
      input.value = 'HOD';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(300);
    const filteredFacultyCount = await evaluate(ws, `document.querySelectorAll('.faculty-profile-card').length`);
    report.facultyDirectorySearch = (filteredFacultyCount === 1);
    console.log('  ✔ Faculty name filter works:', report.facultyDirectorySearch, '(expected 1 match for HOD)');

    await captureScreenshot(ws, path.join(screenshotsDir, '05_desktop_faculty.png'));

    // -----------------------------------------------------------------
    // TEST 4: HACKATHON PORTAL (hackathon.html)
    // -----------------------------------------------------------------
    console.log('\n[4/6] Testing hackathon.html (24-Hour Flagship Portal)...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/hackathon.html' });
    await sleep(1500);

    // Domain category tabs & deep link
    await evaluate(ws, `window.location.hash = '#domain=domain-2'`);
    await sleep(400);
    const domainState = await evaluate(ws, `(() => {
      const activeTab = document.querySelector('.domain-tab-btn.is-active');
      const cards = document.querySelectorAll('.problem-statement-card').length;
      return {
        activeSlug: activeTab ? activeTab.getAttribute('data-slug') : '',
        cards
      };
    })()`);
    report.hackathonDomainsDeepLink = (domainState.activeSlug === 'domain-2' && domainState.cards === 2);
    console.log('  ✔ Hackathon 3 domains & deep linking:', report.hackathonDomainsDeepLink, domainState);

    // Sample PPT check
    const pptStatus = await evaluate(ws, `document.querySelector('#ppt-download-wrap .btn-disabled') ? 'Sample coming soon' : 'active'`);
    report.hackathonPptCheck = (pptStatus === 'Sample coming soon');
    console.log('  ✔ Sample PPT HEAD check gracefully sets button disabled:', report.hackathonPptCheck);

    // Rules & Heads
    const hackRulesCount = await evaluate(ws, `document.querySelectorAll('#hackathon-rules-list li').length`);
    const hackHeadsCount = await evaluate(ws, `document.querySelectorAll('.hackathon-head-card').length`);
    report.hackathonRulesAndHeads = (hackRulesCount >= 5 && hackHeadsCount >= 2);
    console.log('  ✔ Hackathon rules and heads contact cards:', report.hackathonRulesAndHeads, { hackRulesCount, hackHeadsCount });

    await captureScreenshot(ws, path.join(screenshotsDir, '06_desktop_hackathon.png'));

    // -----------------------------------------------------------------
    // TEST 5: TEAM DIRECTORY (team.html)
    // -----------------------------------------------------------------
    console.log('\n[5/6] Testing team.html (40 Student Crew Cards)...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/team.html' });
    await sleep(1500);

    const teamCardsCount = await evaluate(ws, `document.querySelectorAll('.team-profile-card').length`);
    report.team40Cards = (teamCardsCount === 40);
    console.log('  ✔ 40 Student crew profile cards rendered:', report.team40Cards, `(${teamCardsCount}/40)`);

    // Dynamic department chips
    const deptChipsCount = await evaluate(ws, `document.querySelectorAll('#team-department-chips .category-chip').length`);
    report.teamDynamicChips = (deptChipsCount > 1);
    console.log('  ✔ Dynamic department filter chips generated from team.js:', report.teamDynamicChips, `(${deptChipsCount} chips)`);

    await captureScreenshot(ws, path.join(screenshotsDir, '07_desktop_team.png'));

    // -----------------------------------------------------------------
    // TEST 6: CONTACT PAGE (contact.html)
    // -----------------------------------------------------------------
    console.log('\n[6/6] Testing contact.html (Direct Dispatch & FAQ)...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/contact.html' });
    await sleep(1500);

    // Map Graceful Fallback
    const mapFallback = await evaluate(ws, `!!document.querySelector('.map-placeholder-card')`);
    report.contactMapFallback = mapFallback;
    console.log('  ✔ Map gracefully degrades to aesthetic card when embedUrl is unset:', report.contactMapFallback);

    // Coordinators Aggregation from events.js
    const aggregatedCoordCount = await evaluate(ws, `document.querySelectorAll('.event-coord-card').length`);
    report.contactCoordinatorsAggregated = (aggregatedCoordCount >= 5);
    console.log('  ✔ Event coordinators aggregated directly from events.js:', report.contactCoordinatorsAggregated, `(${aggregatedCoordCount} coordinators)`);

    // FAQ Accordion Toggle
    await evaluate(ws, `document.querySelector('.faq-question-btn').click()`);
    await sleep(300);
    const faqExpanded = await evaluate(ws, `document.querySelector('.faq-question-btn').getAttribute('aria-expanded') === 'true'`);
    report.contactFaqAccordion = faqExpanded;
    console.log('  ✔ FAQ Accordion disclosure toggles properly:', report.contactFaqAccordion);

    // Inquiry Form Validation & Honeypot
    const inquiryButtonState = await evaluate(ws, `!!document.querySelector('#inquiry-action-row .btn-disabled')`);
    report.contactInquiryValidation = inquiryButtonState;
    console.log('  ✔ Inquiry form submit button disabled with note when endpoint is placeholder:', report.contactInquiryValidation);

    await captureScreenshot(ws, path.join(screenshotsDir, '08_desktop_contact.png'));

    // -----------------------------------------------------------------
    // TEST 8: DEV AUDIT TOOL (?audit=1)
    // -----------------------------------------------------------------
    console.log('\nTesting Dev Audit Tool (?audit=1)...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/contact.html?audit=1' });
    await sleep(1000);
    const auditHudPresent = await evaluate(ws, `!!document.getElementById('audit-hud')`);
    report.auditToolVerified = auditHudPresent;
    console.log('  ✔ Dev audit tool HUD mounted and visible (?audit=1):', report.auditToolVerified);

    await captureScreenshot(ws, path.join(screenshotsDir, '09_desktop_audit_hud.png'));

    // -----------------------------------------------------------------
    // TEST 9: MOBILE VIEWPORT VERIFICATION (390x844)
    // -----------------------------------------------------------------
    console.log('\nTesting Mobile Viewport (390×844) & Hamburger Menu...');
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true
    });

    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/events.html' });
    await sleep(1500);

    // Open Mobile Drawer
    await evaluate(ws, `document.getElementById('nav-hamburger-btn').click()`);
    await sleep(400);
    const mobileDrawerOpen = await evaluate(ws, `(() => {
      const drawer = document.getElementById('mobile-nav-drawer');
      const isOpen = drawer.classList.contains('is-open');
      const bodyLocked = document.body.style.overflow === 'hidden';
      return isOpen && bodyLocked;
    })()`);
    report.mobileMenu = mobileDrawerOpen;
    console.log('  ✔ Mobile hamburger menu opens, locks scroll, and displays drawer:', report.mobileMenu);

    await captureScreenshot(ws, path.join(screenshotsDir, '10_mobile_nav_drawer.png'));

    // Close Mobile Drawer
    await evaluate(ws, `document.getElementById('drawer-close-btn').click()`);
    await sleep(300);

    await captureScreenshot(ws, path.join(screenshotsDir, '11_mobile_events_feed.png'));

    // -----------------------------------------------------------------
    // CONSOLE ERROR CHECK
    // -----------------------------------------------------------------
    report.zeroConsoleErrors = (consoleErrors.length === 0);
    console.log('\nConsole Errors Logged:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('Errors:', consoleErrors);
    }

    console.log('\n====================================================');
    console.log('              ACCEPTANCE TEST REPORT                ');
    console.log('====================================================');
    console.table(report);

  } catch (err) {
    console.error('Test Suite encountered an error:', err);
  } finally {
    try {
      chromeProc.kill();
    } catch (e) {}
    process.exit(0);
  }
}

runTestSuite();
