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
  if (pathname === '/') pathname = 'index.html';
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
  await new Promise((resolve) => server.listen(8791, '127.0.0.1', resolve));
  console.log('Static server listening on http://127.0.0.1:8791');

  const chromePath = findChrome();
  const remoteDebuggingPort = 9447;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_test_header');
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

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8791/index.html' });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 400));

  const desktopData = await cdp.evaluate(`(() => {
    const emailBtn = document.getElementById('header-btn-email');
    const instaBtn = document.getElementById('header-btn-instagram');
    const floatingWa = document.querySelector('a[href*="wa.me"][class*="fixed"]');
    const header = document.getElementById('site-header');

    const emailRect = emailBtn ? emailBtn.getBoundingClientRect() : null;
    const instaRect = instaBtn ? instaBtn.getBoundingClientRect() : null;

    return {
      emailHref: emailBtn?.getAttribute('href') || '',
      emailTitle: emailBtn?.getAttribute('title') || '',
      emailAria: emailBtn?.getAttribute('aria-label') || '',
      emailWidth: emailRect ? emailRect.width : 0,
      emailHeight: emailRect ? emailRect.height : 0,

      instaHref: instaBtn?.getAttribute('href') || '',
      instaTarget: instaBtn?.getAttribute('target') || '',
      instaRel: instaBtn?.getAttribute('rel') || '',
      instaTitle: instaBtn?.getAttribute('title') || '',
      instaAria: instaBtn?.getAttribute('aria-label') || '',
      instaWidth: instaRect ? instaRect.width : 0,
      instaHeight: instaRect ? instaRect.height : 0,

      floatingWaHref: floatingWa?.getAttribute('href') || '',
      floatingWaVisible: floatingWa ? !floatingWa.classList.contains('hidden') : false,
      headerVisible: !!header
    };
  })()`);

  console.log('Desktop Header Data:');
  console.log('  Email Href:', desktopData.emailHref);
  console.log('  Email Title:', desktopData.emailTitle);
  console.log('  Email Aria:', desktopData.emailAria);
  console.log(`  Email Dimensions: ${desktopData.emailWidth}x${desktopData.emailHeight}`);
  console.log('  Instagram Href:', desktopData.instaHref);
  console.log('  Instagram Target:', desktopData.instaTarget);
  console.log('  Instagram Rel:', desktopData.instaRel);
  console.log('  Instagram Title:', desktopData.instaTitle);
  console.log('  Instagram Aria:', desktopData.instaAria);
  console.log(`  Instagram Dimensions: ${desktopData.instaWidth}x${desktopData.instaHeight}`);
  console.log('  Floating WhatsApp Href:', desktopData.floatingWaHref);

  // Assertions
  const emailPass = desktopData.emailHref === 'mailto:nanang_kjpp@yahoo.co.id';
  const instaPass = desktopData.instaHref === 'https://www.instagram.com/kjppnsr/' &&
                    desktopData.instaTarget === '_blank' &&
                    desktopData.instaRel === 'noopener noreferrer';
  const floatingWaPass = desktopData.floatingWaHref.includes('wa.me/6285110513157') && desktopData.floatingWaVisible;

  console.log('\nDesktop Status:');
  console.log('  EMAIL LINK:', emailPass ? 'PASS' : 'FAIL');
  console.log('  INSTAGRAM LINK:', instaPass ? 'PASS' : 'FAIL');
  console.log('  FLOATING WHATSAPP:', floatingWaPass ? 'PRESERVED' : 'FAIL');

  // Screenshot Desktop Header
  const ssDesktop = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1280, height: 180, scale: 1 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'header_desktop_terkoreksi.png'), Buffer.from(ssDesktop.data, 'base64'));
  console.log('✓ Saved screenshot: header_desktop_terkoreksi.png');

  console.log('\n======================================================');
  console.log('2. MOBILE VIEWPORT TEST (390x844 iPhone 12/14/15)');
  console.log('======================================================');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 400));

  const mobileData = await cdp.evaluate(`(() => {
    const emailBtn = document.getElementById('header-btn-email');
    const instaBtn = document.getElementById('header-btn-instagram');
    const emailRect = emailBtn ? emailBtn.getBoundingClientRect() : null;
    const instaRect = instaBtn ? instaBtn.getBoundingClientRect() : null;
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;

    const isHorizontal = emailRect && instaRect && Math.abs(emailRect.top - instaRect.top) < 6;

    return {
      emailWidth: emailRect ? emailRect.width : 0,
      emailHeight: emailRect ? emailRect.height : 0,
      instaWidth: instaRect ? instaRect.width : 0,
      instaHeight: instaRect ? instaRect.height : 0,
      isHorizontal,
      hasOverflow: scrollWidth > clientWidth
    };
  })()`);

  console.log('Mobile Header Data:');
  console.log(`  Email Touch Target: ${mobileData.emailWidth}x${mobileData.emailHeight} px`);
  console.log(`  Instagram Touch Target: ${mobileData.instaWidth}x${mobileData.instaHeight} px`);
  console.log('  Horizontal Layout:', mobileData.isHorizontal ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('  Horizontal Overflow:', mobileData.hasOverflow ? 'DETECTED (FAIL)' : 'NONE (PASS)');

  const mobileTouchPass = mobileData.emailWidth >= 44 && mobileData.emailHeight >= 44 &&
                          mobileData.instaWidth >= 44 && mobileData.instaHeight >= 44 &&
                          mobileData.isHorizontal && !mobileData.hasOverflow;

  console.log('  MOBILE RESPONSIVE:', mobileTouchPass ? 'PASS' : 'FAIL');

  // Screenshot Mobile Header
  const ssMobile = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 390, height: 200, scale: 2 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'header_mobile_terkoreksi.png'), Buffer.from(ssMobile.data, 'base64'));
  console.log('✓ Saved screenshot: header_mobile_terkoreksi.png');

  // Clean up
  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  server.close();
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log('\n======================================================');
  console.log('TEST SUMMARY:');
  console.log('  EMAIL LINK: ' + (emailPass ? 'PASS' : 'FAIL'));
  console.log('  INSTAGRAM LINK: ' + (instaPass ? 'PASS' : 'FAIL'));
  console.log('  DESKTOP HEADER: ' + (emailPass && instaPass ? 'PASS' : 'FAIL'));
  console.log('  MOBILE RESPONSIVE: ' + (mobileTouchPass ? 'PASS' : 'FAIL'));
  console.log('  FLOATING WHATSAPP: ' + (floatingWaPass ? 'PRESERVED' : 'FAIL'));
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
