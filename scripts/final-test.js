const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9226;

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

async function runFinalTest() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('--- STARTING FINAL COMPREHENSIVE TESTING ---');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    'http://localhost:3000/?debug=1'
  ]);

  await sleep(2500);

  const results = {
    heroScrub: false,
    aboutSection: false,
    eventsGrid: false,
    eventsFilter: false,
    scheduleTimeline: false,
    registerValidation: false,
    registerSuccess: false,
    footerSection: false,
    mobileViewport: false
  };

  try {
    const resp = await fetch(`http://localhost:${PORT}/json`);
    const pages = await resp.json();
    const page = pages.find(p => p.type === 'page');
    if (!page) throw new Error('No page found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    console.log('[CDP] Connected to Chrome instance.');
    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');
    await sleep(2000);

    // 1. DESKTOP VIEWPORT: 1440x900
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Check Hero Scrub
    const heroCheck = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const video = document.getElementById('hero-video');
          const st = ScrollTrigger.getAll()[0];
          return {
            hasVideo: !!video,
            videoSrc: video.src,
            stExists: !!st,
            stLength: st ? (st.end - st.start) : 0
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[TEST] Hero Status:', heroCheck.result.value);
    if (heroCheck.result.value.hasVideo && heroCheck.result.value.stExists) {
      results.heroScrub = true;
    }

    // Scroll to About Section
    console.log('[TEST] Scrolling to About Section...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const about = document.getElementById('about');
          if (about) {
            if (window.lenis) window.lenis.scrollTo(about, { immediate: true });
            else about.scrollIntoView();
            ScrollTrigger.update();
          }
        })()
      `
    });
    await sleep(1500);

    const aboutCheck = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const title = document.getElementById('about-heading').innerText;
          const stats = Array.from(document.querySelectorAll('.stat-number')).map(s => s.innerText);
          return { title, stats };
        })()
      `,
      returnByValue: true
    });
    console.log('[TEST] About Section:', aboutCheck.result.value);
    if (aboutCheck.result.value.title.includes('ALODANAX') && aboutCheck.result.value.stats.length === 3) {
      results.aboutSection = true;
    }

    let shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'test_section_about.png'), Buffer.from(shot.data, 'base64'));

    // Scroll to Events Section
    console.log('[TEST] Scrolling to Events Section...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('events');
          if (el) {
            if (window.lenis) window.lenis.scrollTo(el, { immediate: true });
            else el.scrollIntoView();
            ScrollTrigger.update();
          }
        })()
      `
    });
    await sleep(1500);

    const eventsCheck = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const cards = document.querySelectorAll('.event-card');
          const hasFeatured = !!document.querySelector('.featured-event-span');
          return { cardCount: cards.length, hasFeatured };
        })()
      `,
      returnByValue: true
    });
    console.log('[TEST] Events Grid:', eventsCheck.result.value);
    if (eventsCheck.result.value.cardCount > 0 && eventsCheck.result.value.hasFeatured) {
      results.eventsGrid = true;
    }

    // Test Event Filter Tab (Gaming)
    console.log('[TEST] Testing Events Category Tab filter (Gaming)...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const gamingTab = document.querySelector('.event-tab-btn[data-category="gaming"]');
          if (gamingTab) gamingTab.click();
        })()
      `
    });
    await sleep(600);

    const filterCheck = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const labels = Array.from(document.querySelectorAll('.event-category-label')).map(l => l.innerText);
          return { labels, count: labels.length };
        })()
      `,
      returnByValue: true
    });
    console.log('[TEST] Gaming Filter:', filterCheck.result.value);
    if (filterCheck.result.value.labels.every(l => l === 'GAMING')) {
      results.eventsFilter = true;
    }

    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'test_section_events.png'), Buffer.from(shot.data, 'base64'));

    // Reset tabs to all
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `document.querySelector('.event-tab-btn[data-category="all"]').click();`
    });

    // Scroll to Schedule Section
    console.log('[TEST] Scrolling to Schedule Section...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('schedule');
          if (el) {
            if (window.lenis) window.lenis.scrollTo(el, { immediate: true });
            else el.scrollIntoView();
            ScrollTrigger.update();
          }
        })()
      `
    });
    await sleep(1500);

    const schedCheck = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const items = document.querySelectorAll('.timeline-item');
          const nodes = document.querySelectorAll('.timeline-node');
          const progressLineHeight = document.getElementById('timeline-progress-line').style.height;
          return { itemCount: items.length, nodeCount: nodes.length, progressLineHeight };
        })()
      `,
      returnByValue: true
    });
    console.log('[TEST] Schedule Timeline:', schedCheck.result.value);
    if (schedCheck.result.value.itemCount >= 5) {
      results.scheduleTimeline = true;
    }

    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'test_section_schedule.png'), Buffer.from(shot.data, 'base64'));

    // Scroll to Register Section & Test Form Validation
    console.log('[TEST] Scrolling to Register Form & Testing Validation...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('register');
          if (el) {
            if (window.lenis) window.lenis.scrollTo(el, { immediate: true });
            else el.scrollIntoView();
            ScrollTrigger.update();
          }
        })()
      `
    });
    await sleep(1500);

    // 1. Submit empty form to trigger validation
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          document.getElementById('reg-submit-btn').click();
        })()
      `
    });
    await sleep(500);

    const valCheck = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const errName = document.getElementById('err-name').innerText;
          const isInvalid = document.getElementById('reg-name').classList.contains('is-invalid');
          return { errName, isInvalid };
        })()
      `,
      returnByValue: true
    });
    console.log('[TEST] Form Validation Empty Check:', valCheck.result.value);
    if (valCheck.result.value.isInvalid) {
      results.registerValidation = true;
    }

    // 2. Fill valid data and submit
    console.log('[TEST] Filling valid registration details...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          document.getElementById('reg-name').value = 'Test Participant';
          document.getElementById('reg-email').value = 'participant@university.edu';
          document.getElementById('reg-college').value = 'Department of Computer Science';
          const select = document.getElementById('reg-event');
          select.selectedIndex = 1;
          document.getElementById('reg-submit-btn').click();
        })()
      `
    });
    await sleep(800);

    const successCheck = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const successPanel = document.getElementById('register-success');
          const passId = document.getElementById('success-pass-id').innerText;
          const eventName = document.getElementById('success-event-name').innerText;
          return {
            isDisplayed: successPanel.style.display !== 'none',
            passId,
            eventName
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[TEST] Form Registration Success State:', successCheck.result.value);
    if (successCheck.result.value.isDisplayed && successCheck.result.value.passId.startsWith('AX-')) {
      results.registerSuccess = true;
    }

    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'test_section_register.png'), Buffer.from(shot.data, 'base64'));

    // Footer Check
    console.log('[TEST] Verifying Footer Section...');
    const footerCheck = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const dept = document.getElementById('footer-department').innerText;
          const copy = document.getElementById('footer-copyright').innerText;
          return { dept, copy };
        })()
      `,
      returnByValue: true
    });
    console.log('[TEST] Footer Data:', footerCheck.result.value);
    if (footerCheck.result.value.copy.includes('ALODANAX')) {
      results.footerSection = true;
    }

    // 2. MOBILE VIEWPORT: 390x844
    console.log('[TEST] Testing Mobile Viewport (390x844)...');
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(1000);

    // Scroll to events on mobile
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('events');
          if (el) {
            if (window.lenis) window.lenis.scrollTo(el, { immediate: true });
            else el.scrollIntoView();
            ScrollTrigger.update();
          }
        })()
      `
    });
    await sleep(1200);

    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'test_mobile_events.png'), Buffer.from(shot.data, 'base64'));

    // Scroll to register on mobile
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('register');
          if (el) {
            if (window.lenis) window.lenis.scrollTo(el, { immediate: true });
            else el.scrollIntoView();
            ScrollTrigger.update();
          }
        })()
      `
    });
    await sleep(1200);

    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'test_mobile_register.png'), Buffer.from(shot.data, 'base64'));

    results.mobileViewport = true;

    ws.close();
  } catch (err) {
    console.error('Final test error:', err);
  } finally {
    chromeProc.kill();
    console.log('--- FINAL TEST RESULTS ---');
    console.log(results);
  }
}

runFinalTest();

