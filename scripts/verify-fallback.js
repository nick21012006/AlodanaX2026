const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9225;

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
  console.log('Testing Reduced Motion & Fallback...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    'http://localhost:3000/'
  ]);

  await sleep(2000);

  try {
    const resp = await fetch(`http://localhost:${PORT}/json`);
    const pages = await resp.json();
    const page = pages.find(p => p.type === 'page');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });

    await sendCdp(ws, 'Page.reload');
    await sleep(2000);

    const shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('screenshots/desktop_fallback_reduced_motion.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshots/desktop_fallback_reduced_motion.png');

    const evalResult = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          return {
            isFallbackClass: document.body.classList.contains('is-fallback'),
            headerVisible: document.getElementById('site-header').classList.contains('is-visible'),
            presenterOpacity: window.getComputedStyle(document.getElementById('hero-presenter')).opacity,
            taglineOpacity: window.getComputedStyle(document.getElementById('hero-tagline-wrap')).opacity,
            ctaOpacity: window.getComputedStyle(document.getElementById('hero-cta-group')).opacity
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Fallback Evaluation Result:', evalResult.result.value);

    ws.close();
  } catch (err) {
    console.error('Fallback test error:', err);
  } finally {
    chromeProc.kill();
  }
}

run();

