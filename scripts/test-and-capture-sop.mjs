// scripts/test-and-capture-sop.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const OUTPUT_DIR = path.join(ROOT_DIR, 'evidence_ringkas');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
}

function saveDual(filename, buffer) {
  const localPath = path.join(OUTPUT_DIR, filename);
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, buffer);
  try {
    fs.writeFileSync(artifactPath, buffer);
  } catch(e) {}
  console.log('Saved:', filename, '(' + (buffer.length / 1024).toFixed(1) + ' KB)');
}

async function run() {
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(8092, '127.0.0.1', r));
  console.log('Static server ready on http://127.0.0.1:8092');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9251',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9251/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Runtime.enable');

    // =========================================================================
    // 1. DESKTOP VIEWPORT TEST (1440x900)
    // =========================================================================
    console.log('\n--- 1. DESKTOP SOP INTERACTIVE TIMELINE TEST ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8092/layanan.html#alur-penugasan-sop' });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll SOP section into view
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('alur-penugasan-sop');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture Desktop Default View (Tahap 1 active)
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('sop_timeline_desktop_tahap1.png', Buffer.from(shot.data, 'base64'));

    // Click Tahap 4 (Quality Control & NoLap verification)
    console.log('Clicking Tahap 4 (Kendali Mutu & NoLap)...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof window.pilihTahapSop === 'function') {
          window.pilihTahapSop(4);
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('sop_timeline_desktop_tahap4_nolap.png', Buffer.from(shot.data, 'base64'));

    // Click Tahap 5 (Finalization & eLSa-PK)
    console.log('Clicking Tahap 5 (Finalisasi Teal & eLSa-PK)...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof window.pilihTahapSop === 'function') {
          window.pilihTahapSop(5);
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('sop_timeline_desktop_tahap5_teal.png', Buffer.from(shot.data, 'base64'));

    // =========================================================================
    // 2. MOBILE VIEWPORT TEST (390x844 - iPhone 14)
    // =========================================================================
    console.log('\n--- 2. MOBILE VERTICAL TIMELINE TEST ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Runtime.evaluate', {
      expression: `
        window.pilihTahapSop(1);
        const el = document.getElementById('alur-penugasan-sop');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('sop_timeline_mobile_vertical.png', Buffer.from(shot.data, 'base64'));

    // Scroll to see the expandable detail panel on mobile
    await send('Runtime.evaluate', {
      expression: `
        const panel = document.getElementById('sop-detail-panel');
        if (panel) panel.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('sop_timeline_mobile_detail_drawer.png', Buffer.from(shot.data, 'base64'));

    // =========================================================================
    // 3. HOMEPAGE ROOT TEST (index.html#alur-penugasan-sop)
    // =========================================================================
    console.log('\n--- 3. HOMEPAGE ROOT (index.html) SOP TIMELINE TEST ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8092/index.html#alur-penugasan-sop' });
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('alur-penugasan-sop');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('sop_timeline_homepage_desktop.png', Buffer.from(shot.data, 'base64'));

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    server.close();
    console.log('\nTesting and evidence capture finished successfully!');
  }
}

run().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
