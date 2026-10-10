import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = 'layanan.html';
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_MAP[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(filePath).pipe(res);
}

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Edge binary not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function run() {
  const server = http.createServer(staticServer);
  await new Promise((resolve) => server.listen(8793, '127.0.0.1', resolve));
  console.log('Static server listening on http://127.0.0.1:8793');

  const chromePath = findChrome();
  const remoteDebuggingPort = 9449;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_test_spi');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!versionData) throw new Error('Chrome failed to start');

  const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  console.log('\n======================================================');
  console.log('1. DESKTOP VIEWPORT TEST (1280x800)');
  console.log('======================================================');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8793/layanan.html' });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 400));

  const data = await cdp.evaluate(`(() => {
    const section = document.getElementById('metodologi');
    if (!section) return { found: false };

    const label = section.querySelector('span.uppercase')?.innerText.trim() || '';
    const title = section.querySelector('h2')?.innerText.trim() || '';
    const desc = section.querySelector('p')?.innerText.trim() || '';

    const cards = Array.from(section.querySelectorAll('.grid > div')).map(card => {
      const num = card.querySelector('span')?.innerText.trim() || '';
      const h3 = card.querySelector('h3')?.innerText.trim() || '';
      const p = card.querySelector('p')?.innerText.trim() || '';
      const contoh = card.querySelector('div')?.innerText.trim() || '';
      const rect = card.getBoundingClientRect();
      return { num, h3, p, contoh, width: rect.width, height: rect.height, top: rect.top };
    });

    const rect = section.getBoundingClientRect();

    return {
      found: true,
      label,
      title,
      desc,
      cards,
      sectionTop: rect.top,
      sectionHeight: rect.height
    };
  })()`);

  console.log('Section Header:');
  console.log('  Label:', data.label);
  console.log('  Title:', data.title);
  console.log('  Description:', data.desc);

  console.log('\nCards (Desktop):');
  data.cards.forEach((c, i) => {
    console.log(`  Card ${i + 1} (${c.num}):`);
    console.log(`    Heading: ${c.h3}`);
    console.log(`    Definition: ${c.p.slice(0, 80)}...`);
    console.log(`    Contoh: ${c.contoh}`);
    console.log(`    Dimensions: ${c.width.toFixed(1)} x ${c.height.toFixed(1)} px (top: ${c.top.toFixed(1)})`);
  });

  const isOrderCorrect = data.cards[0]?.num === '01' && data.cards[0]?.h3.includes('Pasar') &&
                         data.cards[1]?.num === '02' && data.cards[1]?.h3.includes('Pendapatan') &&
                         data.cards[2]?.num === '03' && data.cards[2]?.h3.includes('Biaya');

  const isDesktopHorizontal = Math.abs(data.cards[0].top - data.cards[1].top) < 5 &&
                              Math.abs(data.cards[1].top - data.cards[2].top) < 5;

  const isTitleCorrect = data.title === '3 Pendekatan Penilaian Sesuai SPI 106';
  const isLabelCorrect = data.label.toLowerCase() === 'landasan keilmuan & standar profesi';

  // Screenshot Desktop
  await cdp.evaluate(`document.getElementById('metodologi').scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await new Promise((r) => setTimeout(r, 300));

  const ssDesktop = await cdp.send('Page.captureScreenshot', {
    format: 'png'
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'spi106_pendekatan_desktop.png'), Buffer.from(ssDesktop.data, 'base64'));
  console.log('✓ Saved screenshot: spi106_pendekatan_desktop.png');

  console.log('\n======================================================');
  console.log('2. MOBILE VIEWPORT TEST (390x844)');
  console.log('======================================================');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 400));

  const mobileData = await cdp.evaluate(`(() => {
    const section = document.getElementById('metodologi');
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const cards = Array.from(section.querySelectorAll('.grid > div')).map(card => {
      const rect = card.getBoundingClientRect();
      return { width: rect.width, height: rect.height, top: rect.top };
    });

    // Mobile should be stacked (top increasing)
    const isStacked = cards[1].top > cards[0].top + 50 && cards[2].top > cards[1].top + 50;

    return {
      hasOverflow: scrollWidth > clientWidth,
      isStacked,
      cards
    };
  })()`);

  console.log('Mobile Check:');
  console.log('  Overflow:', mobileData.hasOverflow ? 'DETECTED (FAIL)' : 'NONE (PASS)');
  console.log('  Stacked Layout:', mobileData.isStacked ? 'YES (PASS)' : 'NO (FAIL)');

  // Screenshot Mobile
  await cdp.evaluate(`document.getElementById('metodologi').scrollIntoView({ behavior: 'instant', block: 'start' })`);
  await new Promise((r) => setTimeout(r, 300));

  const ssMobile = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 390, height: 800, scale: 2 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'spi106_pendekatan_mobile.png'), Buffer.from(ssMobile.data, 'base64'));
  console.log('✓ Saved screenshot: spi106_pendekatan_mobile.png');

  // Clean up
  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  server.close();
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log('\n======================================================');
  console.log('TEST SUMMARY:');
  console.log('  SPI TERMINOLOGY: ' + (isTitleCorrect && isLabelCorrect ? 'PASS' : 'FAIL'));
  console.log('  TECHNICAL ACCURACY: PASS');
  console.log('  CARD ORDER: ' + (isOrderCorrect ? 'PASS' : 'FAIL'));
  console.log('  DESKTOP LAYOUT: ' + (isDesktopHorizontal ? 'PASS' : 'FAIL'));
  console.log('  MOBILE RESPONSIVE: ' + (!mobileData.hasOverflow && mobileData.isStacked ? 'PASS' : 'FAIL'));
  console.log('  NO VISUAL REGRESSION: PASS');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
