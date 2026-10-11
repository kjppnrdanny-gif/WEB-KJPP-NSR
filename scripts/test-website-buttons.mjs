import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const EXPECTED_URL = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome binary not found');
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
}

// Simple static HTTP server
function startServer(port = 8787) {
  const root = process.cwd();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(root, decodeURIComponent(reqPath));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  console.log('=== MEMULAI PENGUJIAN TOMBOL WEBSITE & PORTAL ===');
  const server = await startServer(8787);
  console.log('✓ Server lokal aktif di http://127.0.0.1:8787');

  const chromePath = findChrome();
  const remoteDebuggingPort = 9488;
  const userDataDir = path.join(os.tmpdir(), 'chrome_buttons_test_' + Date.now());

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
        if (res.ok) break;
      } catch (_) {}
      await new Promise(r => setTimeout(r, 200));
    }

    const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');

    const testResults = [];

    // TEST 1: index.html Desktop
    console.log('\n--- Uji 1: index.html (Desktop Viewport: 1280x800) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8787/index.html' });
    await new Promise(r => setTimeout(r, 3000));

    // Buka modal portal via click tombol atau JS evaluate
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[onclick*="bukaModalPortal"]');
        if (btn) btn.click();
        else if (typeof bukaModalPortal === 'function') bukaModalPortal();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Cek link absensi
    const resDesktop = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-portal');
        const isVisible = modal && !modal.classList.contains('hidden');
        const link = modal ? modal.querySelector('a[href*="macros/s/"]') : null;
        return {
          modalVisible: isVisible,
          linkText: link ? link.innerText.trim().replace(/\\n/g, ' ') : null,
          href: link ? link.href : null
        };
      })()`,
      returnByValue: true
    });

    const dVal = resDesktop.result.value;
    console.log('Hasil Evaluasi Desktop:', dVal);
    const passDesktop = dVal.modalVisible && dVal.href === EXPECTED_URL;
    console.log('Status Desktop:', passDesktop ? '✅ PASS' : '❌ FAIL');
    testResults.push({ test: 'index.html Desktop', pass: passDesktop, detail: dVal });

    const shotDesktop = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_btn_absensi_desktop.png'), Buffer.from(shotDesktop.data, 'base64'));

    // TEST 2: index.html Mobile
    console.log('\n--- Uji 2: index.html (Mobile Viewport: 390x844) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8787/index.html' });
    await new Promise(r => setTimeout(r, 2000));

    await cdp.send('Runtime.evaluate', {
      expression: 'bukaModalPortal();'
    });
    await new Promise(r => setTimeout(r, 500));

    const resMobile = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-portal');
        const isVisible = modal && !modal.classList.contains('hidden');
        const link = modal ? modal.querySelector('a[href*="macros/s/"]') : null;
        return {
          modalVisible: isVisible,
          linkText: link ? link.innerText.trim().replace(/\\n/g, ' ') : null,
          href: link ? link.href : null
        };
      })()`,
      returnByValue: true
    });

    const mVal = resMobile.result.value;
    console.log('Hasil Evaluasi Mobile:', mVal);
    const passMobile = mVal.modalVisible && mVal.href === EXPECTED_URL;
    console.log('Status Mobile:', passMobile ? '✅ PASS' : '❌ FAIL');
    testResults.push({ test: 'index.html Mobile', pass: passMobile, detail: mVal });

    const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_btn_absensi_mobile.png'), Buffer.from(shotMobile.data, 'base64'));

    // TEST 3: portal-nolap.html
    console.log('\n--- Uji 3: portal-nolap.html Header Link ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8787/portal-nolap.html' });
    await new Promise(r => setTimeout(r, 1500));

    const resNolap = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const link = document.querySelector('a[href*="macros/s/"]');
        return {
          exists: !!link,
          title: link ? link.getAttribute('title') : null,
          text: link ? link.innerText.trim() : null,
          href: link ? link.href : null
        };
      })()`,
      returnByValue: true
    });
    const nolapVal = resNolap.result.value;
    console.log('Hasil Evaluasi NoLap:', nolapVal);
    const passNolap = nolapVal.exists && nolapVal.href === EXPECTED_URL;
    console.log('Status NoLap:', passNolap ? '✅ PASS' : '❌ FAIL');
    testResults.push({ test: 'portal-nolap.html', pass: passNolap, detail: nolapVal });

    const shotNolap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_portal_nolap_link.png'), Buffer.from(shotNolap.data, 'base64'));

    // TEST 4: portal-kwitansi.html
    console.log('\n--- Uji 4: portal-kwitansi.html Header Link ---');
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8787/portal-kwitansi.html' });
    await new Promise(r => setTimeout(r, 1500));

    const resKwitansi = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const link = document.querySelector('a[href*="macros/s/"]');
        return {
          exists: !!link,
          title: link ? link.getAttribute('title') : null,
          text: link ? link.innerText.trim() : null,
          href: link ? link.href : null
        };
      })()`,
      returnByValue: true
    });
    const kwitansiVal = resKwitansi.result.value;
    console.log('Hasil Evaluasi Kwitansi:', kwitansiVal);
    const passKwitansi = kwitansiVal.exists && kwitansiVal.href === EXPECTED_URL;
    console.log('Status Kwitansi:', passKwitansi ? '✅ PASS' : '❌ FAIL');
    testResults.push({ test: 'portal-kwitansi.html', pass: passKwitansi, detail: kwitansiVal });

    const shotKwitansi = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_portal_kwitansi_link.png'), Buffer.from(shotKwitansi.data, 'base64'));

    console.log('\n========================================================');
    console.log('📊 RINGKASAN SELURUH UJI TOMBOL WEBSITE:');
    const allPassed = testResults.every(r => r.pass);
    console.log(allPassed ? '🎉 SEMUA UJI PASS 100%!' : '⚠️ ADA UJI GAGAL');
    console.log('========================================================');

  } finally {
    try { chromeProc.kill(); } catch (_) {}
    server.close();
  }
}

main().catch(console.error);
