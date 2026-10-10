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

function getPngDimensions(buf) {
  if (buf.length < 24) return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20)
  };
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

    // 1. Configure Mobile Viewport (iPhone 390px wide, deviceScaleFactor: 1)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });

    console.log('Navigating to http://127.0.0.1:8097/index.html...');
    await send('Page.navigate', { url: 'http://127.0.0.1:8097/index.html' });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll down to load all images, then scroll back to top
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 1200));

    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); document.documentElement.scrollTop = 0; document.body.scrollTop = 0;`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Measure exact layout and scrollHeight
    const metricsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const sections = Array.from(document.querySelectorAll('section')).map(s => ({
          id: s.id,
          top: Math.round(s.getBoundingClientRect().top + window.scrollY),
          height: Math.round(s.offsetHeight)
        }));
        return JSON.stringify({
          scrollHeight: document.documentElement.scrollHeight,
          bodyScrollHeight: document.body.scrollHeight,
          innerHeight: window.innerHeight,
          sections
        });
      })()`,
      returnByValue: true
    });

    const metrics = JSON.parse(metricsRes.result.value);
    console.log('\n--- MOBILE LAYOUT METRICS ---');
    console.log('document.documentElement.scrollHeight:', metrics.scrollHeight, 'px');
    console.log('document.body.scrollHeight:', metrics.bodyScrollHeight, 'px');
    metrics.sections.forEach(s => {
      console.log(`  - #${s.id || '(section)'} : top ${s.top}px, height ${s.height}px`);
    });

    const fullHeight = metrics.scrollHeight;

    // 2. Capture FULL Mobile Beranda from top (0,0)
    console.log(`\nCapturing beranda_ringkas_hp_final.png (390 x ${fullHeight} px)...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: fullHeight,
      deviceScaleFactor: 1,
      mobile: true
    });
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); document.documentElement.scrollTop = 0; document.body.scrollTop = 0;`
    });
    await new Promise(r => setTimeout(r, 1500));

    let fullShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 390,
        height: fullHeight,
        scale: 1
      },
      fromSurface: true
    });

    const fullBuf = Buffer.from(fullShot.data, 'base64');
    saveDual('beranda_ringkas_hp_final.png', fullBuf);
    const fullDim = getPngDimensions(fullBuf);
    console.log('Verified beranda_ringkas_hp_final.png physical dimensions:', fullDim);

    // 3. Capture Focused Map Viewport (Fixed Jakarta Map on Mobile)
    console.log('\nCapturing peta_jakarta_hp_fixed.png...');
    // Reset to standard mobile viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });

    // Scroll to the contact & map section: #kontak
    await send('Runtime.evaluate', {
      expression: `(() => {
        const kontakSec = document.getElementById('kontak');
        if (kontakSec) {
          const mapEl = document.getElementById('map-iframe-kantor') || kontakSec;
          const rect = mapEl.getBoundingClientRect();
          const targetY = window.scrollY + rect.top - 180; // Show tab switcher, address card, and map together
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'instant' });
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    let mapShot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });

    const mapBuf = Buffer.from(mapShot.data, 'base64');
    saveDual('peta_jakarta_hp_fixed.png', mapBuf);
    const mapDim = getPngDimensions(mapBuf);
    console.log('Verified peta_jakarta_hp_fixed.png physical dimensions:', mapDim);

    console.log('\nSUCCESS! Both mobile screenshots captured and verified.');
    ws.close();
  } finally {
    try { chrome.kill(); } catch(e) {}
    try { server.close(); } catch(e) {}
  }
}

run().catch(err => {
  console.error('Error in capture script:', err);
  process.exit(1);
});
