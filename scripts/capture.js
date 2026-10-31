const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9224;

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

async function run() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching Chrome headless...');
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

    console.log('Connected to Chrome DevTools Protocol');
    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');

    await sleep(2000);

    // Desktop: 1440x900
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const progressPoints = [0, 0.25, 0.50, 0.64, 0.75, 1.00];

    for (const p of progressPoints) {
      console.log(`Setting progress to ${(p * 100).toFixed(0)}%...`);
      await sendCdp(ws, 'Runtime.evaluate', {
        expression: `
          (() => {
            const st = ScrollTrigger.getAll()[0];
            const max = st.end - st.start;
            const target = st.start + max * ${p};
            if (window.lenis) {
              window.lenis.scrollTo(target, { immediate: true });
            } else {
              window.scrollTo(0, target);
            }
            ScrollTrigger.update();
          })()
        `
      });

      await sleep(1500);

      const shot = await sendCdp(ws, 'Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false
      });

      const filename = path.join(screenshotsDir, `desktop_progress_${Math.round(p * 100)}.png`);
      fs.writeFileSync(filename, Buffer.from(shot.data, 'base64'));
      console.log(`Saved ${filename}`);
    }

    // Mobile: 390x844
    console.log('Switching to mobile viewport (390x844)...');
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(1200);

    for (const p of [0, 0.50, 1.00]) {
      console.log(`Setting mobile progress to ${(p * 100).toFixed(0)}%...`);
      await sendCdp(ws, 'Runtime.evaluate', {
        expression: `
          (() => {
            const st = ScrollTrigger.getAll()[0];
            const max = st.end - st.start;
            const target = st.start + max * ${p};
            if (window.lenis) {
              window.lenis.scrollTo(target, { immediate: true });
            } else {
              window.scrollTo(0, target);
            }
            ScrollTrigger.update();
          })()
        `
      });

      await sleep(1500);

      const shot = await sendCdp(ws, 'Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false
      });

      const filename = path.join(screenshotsDir, `mobile_progress_${Math.round(p * 100)}.png`);
      fs.writeFileSync(filename, Buffer.from(shot.data, 'base64'));
      console.log(`Saved ${filename}`);
    }

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chromeProc.kill();
    console.log('Chrome process terminated.');
  }
}

run();
