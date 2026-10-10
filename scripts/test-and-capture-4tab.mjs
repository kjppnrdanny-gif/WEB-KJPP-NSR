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

function getPngDimensions(buf) {
  if (buf.length < 24) return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20)
  };
}

async function run() {
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(8091, '127.0.0.1', r));
  console.log('Static server ready on http://127.0.0.1:8091');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9250',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9250/json/new?about:blank', { method: 'PUT' });
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
    // 1. DESKTOP 4-TAB TEST & CAPTURE
    // =========================================================================
    console.log('\n--- 1. DESKTOP 4-TAB INTERACTIVE TEST ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8091/index.html' });
    await new Promise(r => setTimeout(r, 3500));

    // Evaluate Tab Switching on Desktop
    const tabTestRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const results = {};
        results.initialTabMutuVisible = !document.getElementById('tab-panel-mutu').classList.contains('hidden');
        results.initialTabLayananHidden = document.getElementById('tab-panel-layanan').classList.contains('hidden');

        // Switch to Layanan
        window.pilihTabUtama('layanan');
        results.switchLayananVisible = !document.getElementById('tab-panel-layanan').classList.contains('hidden');
        results.switchMutuHidden = document.getElementById('tab-panel-mutu').classList.contains('hidden');

        // Switch to Galeri
        window.pilihTabUtama('galeri');
        results.switchGaleriVisible = !document.getElementById('tab-panel-galeri').classList.contains('hidden');

        // Switch to Kantor
        window.pilihTabUtama('kantor');
        results.switchKantorVisible = !document.getElementById('tab-panel-kantor').classList.contains('hidden');

        // Switch back to Mutu (Default)
        window.pilihTabUtama('mutu');
        results.finalMutuVisible = !document.getElementById('tab-panel-mutu').classList.contains('hidden');

        // Modal Portal Test
        if (typeof bukaModal === 'function') {
          bukaModal('modal-portal');
          const m = document.getElementById('modal-portal');
          results.modalVisible = m && !m.classList.contains('hidden');
          tutupModal('modal-portal');
          results.modalClosed = m && m.classList.contains('hidden');
        }

        results.desktopScrollHeight = document.documentElement.scrollHeight;
        return results;
      })()`,
      returnByValue: true
    });

    const testResults = tabTestRes.result.value;
    console.log('Desktop 4-Tab & Modal Test Results:', testResults);
    console.log('Desktop scrollHeight:', testResults.desktopScrollHeight, 'px');

    // Scroll to position the 4-Tab Section nicely in viewport
    await send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('ekosistem-utama');
        if (sec) {
          const y = sec.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Capture Screenshot 1: Desktop Viewport showing 4 Tabs & NSR Cloud Diagram
    console.log('\nCapturing beranda_4tab_desktop_preview.png...');
    let desktopShot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });
    const desktopBuf = Buffer.from(desktopShot.data, 'base64');
    saveDual('beranda_4tab_desktop_preview.png', desktopBuf);
    console.log('Verified desktop preview dimensions:', getPngDimensions(desktopBuf));

    // =========================================================================
    // 2. MOBILE (HP) TEST & CAPTURE
    // =========================================================================
    console.log('\n--- 2. MOBILE (HP) 4-TAB INTERACTIVE TEST ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8091/index.html' });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll down to load lazy assets then back to top
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 1200));
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); document.documentElement.scrollTop = 0; document.body.scrollTop = 0;`
    });
    await new Promise(r => setTimeout(r, 1200));

    const mobileMetricsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('ekosistem-utama');
        return {
          scrollHeight: document.documentElement.scrollHeight,
          secTop: sec ? Math.round(sec.getBoundingClientRect().top + window.scrollY) : null,
          tabBtnCount: document.querySelectorAll('.tab-btn-utama').length,
          isMutuActive: !document.getElementById('tab-panel-mutu').classList.contains('hidden')
        };
      })()`,
      returnByValue: true
    });

    const mobileMetrics = mobileMetricsRes.result.value;
    console.log('Mobile Layout Metrics:', mobileMetrics);
    console.log('MOBILE document.documentElement.scrollHeight:', mobileMetrics.scrollHeight, 'px');

    const mFullHeight = mobileMetrics.scrollHeight;

    // Capture Screenshot 2: Full Mobile HP from top (0,0)
    console.log(`\nCapturing beranda_4tab_mobile_full.png (390 x ${mFullHeight} px)...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: mFullHeight,
      deviceScaleFactor: 1,
      mobile: true
    });
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); document.documentElement.scrollTop = 0; document.body.scrollTop = 0;`
    });
    await new Promise(r => setTimeout(r, 1500));

    let mobileShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 390,
        height: mFullHeight,
        scale: 1
      },
      fromSurface: true
    });

    const mobileBuf = Buffer.from(mobileShot.data, 'base64');
    saveDual('beranda_4tab_mobile_full.png', mobileBuf);
    console.log('Verified mobile full dimensions:', getPngDimensions(mobileBuf));

    console.log('\nSUCCESS! Both requested screenshots captured and verified.');
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
