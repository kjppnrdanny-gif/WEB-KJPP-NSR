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
  '.webm': 'video/webm'
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
  await new Promise(r => server.listen(8097, '127.0.0.1', r));
  console.log('Static server ready on http://127.0.0.1:8097');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9257',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9257/json/new?about:blank', { method: 'PUT' });
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
    await send('DOM.enable');
    await send('Runtime.enable');

    // 1. DESKTOP VIEWPORT TEST (1440 x 900)
    console.log('\n--- 1. DESKTOP CAPTURE (1440x900) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8097/index.html' });
    await new Promise(r => setTimeout(r, 3500));

    // Evaluate total height and section bounding boxes
    const pageMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const sections = Array.from(document.querySelectorAll('section')).map(s => ({
          id: s.id,
          top: Math.round(s.getBoundingClientRect().top + window.scrollY),
          height: Math.round(s.offsetHeight)
        }));
        return JSON.stringify({
          scrollHeight: document.documentElement.scrollHeight,
          sections
        });
      })()`,
      returnByValue: true
    });

    const metricsData = JSON.parse(pageMetrics.result.value);
    console.log('Desktop Scroll Height:', metricsData.scrollHeight, 'px');
    console.log('Sections layout:', metricsData.sections);

    // Desktop Viewport 1: Hero & NSR Cloud
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 600));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_desktop_01_hero.png', Buffer.from(shot.data, 'base64'));

    // Desktop Viewport 2: NSR Cloud (prominent placement!)
    const nsrTop = metricsData.sections.find(s => s.id === 'sistem-mutu')?.top || 850;
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${nsrTop}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_desktop_02_nsr_cloud.png', Buffer.from(shot.data, 'base64'));

    // Desktop Viewport 3: Layanan & FlexCarousel 3D
    const layananTop = metricsData.sections.find(s => s.id === 'layanan')?.top || 1800;
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${layananTop}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_desktop_03_layanan.png', Buffer.from(shot.data, 'base64'));

    const galeriTop = metricsData.sections.find(s => s.id === 'galeri')?.top || 2700;
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${galeriTop}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_desktop_04_flexcarousel_3d.png', Buffer.from(shot.data, 'base64'));

    // Desktop Viewport 4: 5 Kantor & Peta
    const kontakTop = metricsData.sections.find(s => s.id === 'kontak')?.top || 3500;
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${kontakTop}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_desktop_05_5kantor_peta.png', Buffer.from(shot.data, 'base64'));

    // Desktop Full Page Screenshot
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: metricsData.scrollHeight,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 1000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_desktop_full_beranda.png', Buffer.from(shot.data, 'base64'));

    // 2. MOBILE VIEWPORT TEST (390 x 844 - iPhone 14 / modern smartphone)
    console.log('\n--- 2. MOBILE CAPTURE (390x844) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8097/index.html' });
    await new Promise(r => setTimeout(r, 3500));

    const mobileMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const sections = Array.from(document.querySelectorAll('section')).map(s => ({
          id: s.id,
          top: Math.round(s.getBoundingClientRect().top + window.scrollY),
          height: Math.round(s.offsetHeight)
        }));
        return JSON.stringify({
          scrollHeight: document.documentElement.scrollHeight,
          sections
        });
      })()`,
      returnByValue: true
    });

    const mobileData = JSON.parse(mobileMetrics.result.value);
    console.log('Mobile Scroll Height:', mobileData.scrollHeight, 'px');

    // Mobile Viewport 1: Hero
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 600));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_mobile_01_hero.png', Buffer.from(shot.data, 'base64'));

    // Mobile Viewport 2: NSR Cloud
    const mNsrTop = mobileData.sections.find(s => s.id === 'sistem-mutu')?.top || 950;
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${mNsrTop}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_mobile_02_nsr_cloud.png', Buffer.from(shot.data, 'base64'));

    // Mobile Viewport 3: FlexCarousel 3D
    const mGaleriTop = mobileData.sections.find(s => s.id === 'galeri')?.top || 3000;
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${mGaleriTop}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_mobile_03_galeri.png', Buffer.from(shot.data, 'base64'));

    // Mobile Viewport 4: 5 Kantor
    const mKontakTop = mobileData.sections.find(s => s.id === 'kontak')?.top || 4000;
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${mKontakTop}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_mobile_04_kantor.png', Buffer.from(shot.data, 'base64'));

    // Mobile Full Page Screenshot
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: mobileData.scrollHeight,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_mobile_full_beranda.png', Buffer.from(shot.data, 'base64'));

    console.log('\nAll preview screenshots generated successfully!');
    ws.close();
  } finally {
    try { chrome.kill(); } catch(e) {}
    try { server.close(); } catch(e) {}
  }
}

run().catch(err => {
  console.error('Error running preview capture:', err);
  process.exit(1);
});
