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
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = 'portofolio-rekanan.html';
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + filePath);
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_MAP[ext] || 'application/octet-stream'
  });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise(r => server.listen(8210, '127.0.0.1', r));

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9458',
  '--no-sandbox',
  'about:blank'
]);
await new Promise(r => setTimeout(r, 1500));

const targetRes = await fetch('http://127.0.0.1:9458/json/new?about:blank', { method: 'PUT' });
const targetData = await targetRes.json();
const ws = new WebSocket(targetData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
const send = (method, params = {}) => new Promise(res => {
  const curId = id++;
  const handler = (e) => {
    const data = JSON.parse(e.data);
    if (data.id === curId) {
      ws.removeEventListener('message', handler);
      res(data.result);
    }
  };
  ws.addEventListener('message', handler);
  ws.send(JSON.stringify({ id: curId, method, params }));
});

await send('Page.enable');
await send('Network.enable');

await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false
});

await send('Page.setLifecycleEventsEnabled', { enabled: true });
await send('Page.navigate', { url: 'http://127.0.0.1:8210/portofolio-rekanan.html' });

// Wait for load
await new Promise(resolve => {
  const handler = e => {
    const d = JSON.parse(e.data);
    if (d.method === 'Page.loadEventFired') {
      ws.removeEventListener('message', handler);
      resolve();
    }
  };
  ws.addEventListener('message', handler);
});

await new Promise(r => setTimeout(r, 1000));

// Wait for all images in the gallery to decode
const decodeResult = await send('Runtime.evaluate', {
  expression: `(async () => {
    const el = document.getElementById('galeri-kegiatan');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    const imgs = Array.from(document.querySelectorAll('#galeri-kegiatan img'));
    imgs.forEach(img => {
      // remove loading=lazy to force eager load during test
      img.loading = 'eager';
    });
    await Promise.all(imgs.map(async img => {
      try {
        if (!img.complete) {
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });
        }
        await img.decode();
      } catch (err) {}
    }));
    return imgs.map(img => ({
      src: img.getAttribute('src'),
      complete: img.complete,
      width: img.naturalWidth,
      height: img.naturalHeight
    }));
  })()`,
  awaitPromise: true,
  returnByValue: true
});

console.log('Decode results:', JSON.stringify(decodeResult.result.value, null, 2));

await new Promise(r => setTimeout(r, 500));
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'galeri_kegiatan_16_makassar_desktop.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved galeri_kegiatan_16_makassar_desktop.png');

// Mobile view (390 x 844)
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true
});

await send('Runtime.evaluate', {
  expression: `
    const el = document.getElementById('galeri-kegiatan');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    const makassarEl = document.querySelector('img[src*="kantor-cabang-makassar.jpeg"]');
    if (makassarEl) makassarEl.scrollIntoView({ behavior: 'instant', block: 'center' });
  `
});
await new Promise(r => setTimeout(r, 600));

const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'galeri_kegiatan_16_makassar_mobile.png'), Buffer.from(shotMobile.data, 'base64'));
console.log('Saved galeri_kegiatan_16_makassar_mobile.png');

chrome.kill();
server.close();
process.exit(0);
