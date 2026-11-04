import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9252;

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

async function evalInPage(ws, expression) {
  const res = await sendCdp(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error('JS Exception: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result ? res.result.value : undefined;
}

async function run() {
  console.log('=== RUNNING COMPREHENSIVE WCAG ACCESSIBILITY AUDIT ===\n');

  // Fetch axe-core script from cdnjs
  let axeSource = '';
  try {
    const resp = await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js');
    axeSource = await resp.text();
    console.log(`v Loaded axe-core 4.9.1 (${axeSource.length} bytes)`);
  } catch (e) {
    console.warn('Could not fetch axe from CDN, will perform built-in WCAG heuristics');
  }

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-extensions',
    'http://localhost:3000/'
  ]);

  await sleep(2500);

  const pagesToAudit = [
    { name: 'index', path: '/' },
    { name: 'events', path: '/events.html' },
    { name: 'committee', path: '/committee.html' },
    { name: 'faculty', path: '/faculty.html' },
    { name: 'hackathon', path: '/hackathon.html' },
    { name: 'team', path: '/team.html' },
    { name: 'contact', path: '/contact.html' }
  ];

  let totalViolations = 0;

  try {
    const resp = await fetch(`http://localhost:${PORT}/json`);
    const pages = await resp.json();
    const page = pages.find(p => p.type === 'page');
    if (!page) throw new Error('Target page not found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');

    for (const p of pagesToAudit) {
      console.log(`Auditing: ${p.name} (http://localhost:3000${p.path})...`);
      await sendCdp(ws, 'Page.navigate', { url: `http://localhost:3000${p.path}` });
      await sleep(1500);

      if (axeSource) {
        // Inject axe and run audit
        await evalInPage(ws, axeSource);
        const results = await evalInPage(ws, `axe.run({
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
          }
        })`);

        const passes = results.passes ? results.passes.length : 0;
        const violations = results.violations || [];
        const score = Math.round((passes / (passes + violations.length)) * 100);

        console.log(`  -> Axe Score: ${score}% (${passes} rules passed, ${violations.length} violations)`);

        if (violations.length > 0) {
          console.log(`  Violations for ${p.name}:`);
          violations.forEach(v => {
            console.log(`    [${v.impact.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} occurrences)`);
            v.nodes.slice(0, 2).forEach(n => console.log(`      Target: ${n.target.join(' ')}`));
          });
          totalViolations += violations.length;
        }
      } else {
        // Heuristic fallback
        const checks = await evalInPage(ws, `(() => {
          let issues = 0;
          document.querySelectorAll('img:not([alt])').forEach(() => issues++);
          document.querySelectorAll('button:not([aria-label]):empty').forEach(() => issues++);
          document.querySelectorAll('a:not([aria-label]):empty').forEach(() => issues++);
          return { issues };
        })()`);
        console.log(`  -> Built-in checks: ${checks.issues} issues`);
      }
    }

    console.log(`\nAudit complete. Total critical violations: ${totalViolations}`);
  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    try {
      chromeProc.kill();
    } catch (e) {}
    process.exit(totalViolations > 0 ? 1 : 0);
  }
}

run();
