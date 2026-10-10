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
  await new Promise((resolve) => server.listen(8794, '127.0.0.1', resolve));
  console.log('Static server listening on http://127.0.0.1:8794');

  const chromePath = findChrome();
  const remoteDebuggingPort = 9450;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_test_popover');
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

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8794/index.html' });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 400));

  // Initial check: popover is hidden
  const initial = await cdp.evaluate(`(() => {
    const pop = document.getElementById('header-email-popover');
    const emailBtn = document.getElementById('header-btn-email');
    const instaBtn = document.getElementById('header-btn-instagram');
    const floatingWa = document.querySelector('a[href*="wa.me"][class*="fixed"]');

    return {
      popoverHidden: pop ? pop.classList.contains('hidden') : true,
      emailBtnExists: !!emailBtn,
      instaHref: instaBtn ? instaBtn.getAttribute('href') : '',
      instaTarget: instaBtn ? instaBtn.getAttribute('target') : '',
      instaRel: instaBtn ? instaBtn.getAttribute('rel') : '',
      floatingWaHref: floatingWa ? floatingWa.getAttribute('href') : '',
      floatingWaVisible: floatingWa ? !floatingWa.classList.contains('hidden') : false
    };
  })()`);

  console.log('Initial State:');
  console.log('  Popover Hidden initially:', initial.popoverHidden ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('  Email Button Exists:', initial.emailBtnExists ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('  Instagram Link:', initial.instaHref);
  console.log('  Floating WhatsApp:', initial.floatingWaHref);

  // Click email button to toggle popover
  await cdp.evaluate(`document.getElementById('header-btn-email').click()`);
  await new Promise((r) => setTimeout(r, 200));

  const opened = await cdp.evaluate(`(() => {
    const pop = document.getElementById('header-email-popover');
    const emailText = document.getElementById('header-email-text');
    const btnSalin = document.getElementById('btn-salin-email-header');
    const btnKirim = document.getElementById('btn-kirim-email-header');

    const rect = pop ? pop.getBoundingClientRect() : null;

    return {
      popoverVisible: pop ? !pop.classList.contains('hidden') : false,
      emailText: emailText ? emailText.innerText.trim() : '',
      btnSalinExists: !!btnSalin,
      btnKirimHref: btnKirim ? btnKirim.getAttribute('href') : '',
      popoverWidth: rect ? rect.width : 0,
      popoverHeight: rect ? rect.height : 0
    };
  })()`);

  console.log('\nAfter Click Email Button:');
  console.log('  Popover Visible:', opened.popoverVisible ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('  Email Text in Popover:', opened.emailText);
  console.log('  Salin Email Button Exists:', opened.btnSalinExists ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('  Kirim Email Href:', opened.btnKirimHref);
  console.log(`  Popover Dimensions: ${opened.popoverWidth}x${opened.popoverHeight} px`);

  // Test copy action
  await cdp.evaluate(`document.getElementById('btn-salin-email-header').click()`);
  await new Promise((r) => setTimeout(r, 100));

  const copyResult = await cdp.evaluate(`(() => {
    const label = document.getElementById('label-salin-email');
    return {
      labelAfterCopy: label ? label.innerText.trim() : ''
    };
  })()`);

  console.log('  Copy Feedback Label:', copyResult.labelAfterCopy);

  // Capture Desktop Screenshot
  const ssDesktop = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1280, height: 260, scale: 1 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'header_email_popover_desktop.png'), Buffer.from(ssDesktop.data, 'base64'));
  console.log('✓ Saved screenshot: header_email_popover_desktop.png');

  // Test close on Escape
  await cdp.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
  await new Promise((r) => setTimeout(r, 150));

  const closedState = await cdp.evaluate(`(() => {
    const pop = document.getElementById('header-email-popover');
    return {
      isClosed: pop ? pop.classList.contains('hidden') : false
    };
  })()`);

  console.log('  Close on Escape:', closedState.isClosed ? 'PASS' : 'FAIL');

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

  // Click email button on mobile
  await cdp.evaluate(`document.getElementById('header-btn-email').click()`);
  await new Promise((r) => setTimeout(r, 200));

  const mobileCheck = await cdp.evaluate(`(() => {
    const pop = document.getElementById('header-email-popover');
    const rect = pop ? pop.getBoundingClientRect() : null;
    const emailBtn = document.getElementById('header-btn-email');
    const instaBtn = document.getElementById('header-btn-instagram');
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;

    const emailRect = emailBtn ? emailBtn.getBoundingClientRect() : null;
    const instaRect = instaBtn ? instaBtn.getBoundingClientRect() : null;

    const isHorizontal = emailRect && instaRect && Math.abs(emailRect.top - instaRect.top) < 6;

    // Check popover fully inside screen
    const fitsHorizontally = rect && rect.left >= 0 && rect.right <= clientWidth + 2;

    return {
      popoverVisible: pop ? !pop.classList.contains('hidden') : false,
      popoverLeft: rect ? rect.left : 0,
      popoverRight: rect ? rect.right : 0,
      fitsHorizontally,
      hasOverflow: scrollWidth > clientWidth,
      isHorizontal,
      emailTouchTarget: emailRect ? (emailRect.width + 'x' + emailRect.height) : '',
      instaTouchTarget: instaRect ? (instaRect.width + 'x' + instaRect.height) : ''
    };
  })()`);

  console.log('Mobile Check:');
  console.log('  Popover Visible:', mobileCheck.popoverVisible ? 'YES (PASS)' : 'NO (FAIL)');
  console.log(`  Popover Bounds: left=${mobileCheck.popoverLeft.toFixed(1)}, right=${mobileCheck.popoverRight.toFixed(1)} (fits: ${mobileCheck.fitsHorizontally})`);
  console.log('  Horizontal Overflow:', mobileCheck.hasOverflow ? 'DETECTED (FAIL)' : 'NONE (PASS)');
  console.log('  Buttons Horizontal:', mobileCheck.isHorizontal ? 'YES (PASS)' : 'NO (FAIL)');
  console.log(`  Email Touch Target: ${mobileCheck.emailTouchTarget} px`);
  console.log(`  Instagram Touch Target: ${mobileCheck.instaTouchTarget} px`);

  // Capture Mobile Screenshot
  const ssMobile = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 390, height: 320, scale: 2 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'header_email_popover_mobile.png'), Buffer.from(ssMobile.data, 'base64'));
  console.log('✓ Saved screenshot: header_email_popover_mobile.png');

  // Clean up
  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  server.close();
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const passEmail = opened.emailText === 'nanang_kjpp@yahoo.co.id' &&
                    opened.btnSalinExists &&
                    opened.btnKirimHref === 'mailto:nanang_kjpp@yahoo.co.id' &&
                    (copyResult.labelAfterCopy.includes('Tersalin') || copyResult.labelAfterCopy.includes('Salin'));

  const passInstagram = initial.instaHref === 'https://www.instagram.com/kjppnsr/' &&
                        initial.instaTarget === '_blank' &&
                        initial.instaRel === 'noopener noreferrer';

  const passDesktop = opened.popoverVisible && closedState.isClosed;
  const passMobile = mobileCheck.popoverVisible && !mobileCheck.hasOverflow && mobileCheck.fitsHorizontally;
  const passWa = initial.floatingWaHref.includes('wa.me/6285110513157') && initial.floatingWaVisible;

  console.log('\n======================================================');
  console.log('TEST SUMMARY:');
  console.log('  EMAIL POPOVER & ACTIONS: ' + (passEmail ? 'PASS' : 'FAIL'));
  console.log('  INSTAGRAM CORPORATE LINK: ' + (passInstagram ? 'PASS' : 'FAIL'));
  console.log('  DESKTOP HEADER & POPOVER: ' + (passDesktop ? 'PASS' : 'FAIL'));
  console.log('  MOBILE RESPONSIVE & BOUNDS: ' + (passMobile ? 'PASS' : 'FAIL'));
  console.log('  FLOATING WHATSAPP: ' + (passWa ? 'PRESERVED' : 'FAIL'));
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
