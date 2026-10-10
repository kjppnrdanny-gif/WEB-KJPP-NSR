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
  await new Promise((resolve) => server.listen(8789, '127.0.0.1', resolve));
  console.log('Static server listening on http://127.0.0.1:8789');

  const chromePath = findChrome();
  const remoteDebuggingPort = 9445;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_test_kantor');
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

  console.log('\n========================================');
  console.log('1. TESTING INDEX.HTML (BERANDA SPOTLIGHT)');
  console.log('========================================');

  // Set desktop viewport
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8789/index.html' });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`typeof pilihKantorPeta === 'function' && document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 500));

  // Switch to Tab 4 (tab-kantor)
  await cdp.evaluate(`
    if (typeof gantiTabUtama === 'function') {
      gantiTabUtama('tab-kantor');
    }
  `);
  await new Promise((r) => setTimeout(r, 500));

  const offices = ['pusat', 'bandung', 'padang', 'makassar', 'palembang'];

  for (const k of offices) {
    const res = await cdp.evaluate(`(() => {
      pilihKantorPeta('${k}');
      return {
        nama: document.getElementById('kantor-aktif-nama')?.innerText || '',
        alamat: document.getElementById('kantor-aktif-alamat')?.innerText || '',
        penugasan: document.getElementById('kantor-aktif-penugasan')?.innerText || '',
        telp: document.getElementById('kantor-aktif-telp')?.innerText || '',
        pic: document.getElementById('kantor-aktif-pic')?.innerText || '',
        email: document.getElementById('kantor-aktif-email')?.innerText || '',
        iframeSrc: document.getElementById('map-iframe-kantor')?.src || '',
        labelPeta: document.getElementById('map-label-lokasi')?.innerText || '',
        fallbackNav: document.getElementById('btn-fallback-navigasi')?.href || ''
      };
    })()`);

    console.log(`\n[index.html] Kantor: ${k.toUpperCase()}`);
    console.log(`  Nama: ${res.nama}`);
    console.log(`  Alamat: ${res.alamat}`);
    console.log(`  Wilayah Penugasan: ${res.penugasan}`);
    console.log(`  Telp: ${res.telp}`);
    console.log(`  PIC: ${res.pic}`);
    console.log(`  Iframe: ${res.iframeSrc}`);
    console.log(`  Label: ${res.labelPeta}`);
    console.log(`  Nav Direct: ${res.fallbackNav}`);

    if (k === 'pusat') {
      if (!res.iframeSrc.includes('-6.287972658138783') || !res.iframeSrc.includes('106.82477864308436')) {
        console.error('  FAIL: Jakarta map iframe does NOT match official GPS coordinates (-6.287972658138783, 106.82477864308436)!');
      } else {
        console.log('  PASS: Jakarta map iframe matches official GPS coordinates.');
      }
      if (res.penugasan !== 'Seluruh Indonesia') {
        console.error('  FAIL: Jakarta wilayah penugasan must be Seluruh Indonesia!');
      } else {
        console.log('  PASS: Jakarta wilayah penugasan is Seluruh Indonesia.');
      }
    }
    if (k === 'makassar') {
      if (!res.alamat.includes('Jl. Nuri Lr. 301 No. 7')) {
        console.error('  FAIL: Makassar address must be Jl. Nuri Lr. 301 No. 7!');
      } else {
        console.log('  PASS: Makassar address is official Jl. Nuri Lr. 301 No. 7.');
      }
      if (res.penugasan !== 'Sulawesi Selatan') {
        console.error('  FAIL: Makassar wilayah penugasan must be Sulawesi Selatan!');
      } else {
        console.log('  PASS: Makassar wilayah penugasan is Sulawesi Selatan.');
      }
    }
  }

  // Scroll to spotlight and capture screenshot of Jakarta map
  await cdp.evaluate(`(() => {
    pilihKantorPeta('pusat');
    const spot = document.getElementById('container-spotlight-kantor');
    if (spot) spot.scrollIntoView({ behavior: 'instant', block: 'center' });
  })()`);
  await new Promise((r) => setTimeout(r, 1200));

  const ssPetaJakarta = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'peta_kantor_pusat_jakarta_terkoreksi.png'), Buffer.from(ssPetaJakarta.data, 'base64'));
  console.log('\n✓ Saved screenshot: peta_kantor_pusat_jakarta_terkoreksi.png');

  console.log('\n========================================');
  console.log('2. TESTING TIM-CABANG.HTML (5 KANTOR SECTION)');
  console.log('========================================');

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8789/tim-cabang.html#kantor-cabang' });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`typeof pilihKantor === 'function' && document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 500));

  for (const k of offices) {
    const res = await cdp.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('.btn-kantor')).find(b => b.innerText.toLowerCase().includes('${k}'));
      pilihKantor('${k}', btn);
      const panel = document.getElementById('panel-kantor-${k}');
      return {
        panelHidden: panel ? panel.classList.contains('hidden') : true,
        panelText: panel ? panel.innerText.split('\\n').filter(Boolean).slice(0, 4).join(' | ') : '',
        mapLabel: document.getElementById('cabang-map-label')?.innerText || '',
        mapIframe: document.getElementById('cabang-map-iframe')?.src || '',
        mapAlamat: document.getElementById('cabang-map-alamat')?.innerText || '',
        mapBtn: document.getElementById('cabang-map-btn')?.href || ''
      };
    })()`);

    console.log(`\n[tim-cabang.html] Kantor: ${k.toUpperCase()}`);
    console.log(`  Visible: ${!res.panelHidden}`);
    console.log(`  Panel Summary: ${res.panelText}`);
    console.log(`  Map Label: ${res.mapLabel}`);
    console.log(`  Map Iframe: ${res.mapIframe}`);
    console.log(`  Map Alamat: ${res.mapAlamat}`);
    console.log(`  Map Direct: ${res.mapBtn}`);

    if (k === 'pusat') {
      if (!res.mapIframe.includes('-6.287972658138783') || !res.mapIframe.includes('106.82477864308436')) {
        console.error('  FAIL: Jakarta map iframe does NOT match official coordinates!');
      } else {
        console.log('  PASS: tim-cabang.html Jakarta map iframe matches official coordinates.');
      }
    }
    if (k === 'makassar') {
      if (!res.mapAlamat.includes('Jl. Nuri Lr. 301 No. 7')) {
        console.error('  FAIL: tim-cabang.html Makassar address is not Jl. Nuri Lr. 301 No. 7!');
      } else {
        console.log('  PASS: tim-cabang.html Makassar address is official Jl. Nuri Lr. 301 No. 7.');
      }
    }
  }

  // Screenshot tim-cabang Jakarta
  await cdp.evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('.btn-kantor')).find(b => b.innerText.toLowerCase().includes('pusat'));
    pilihKantor('pusat', btn);
    const sec = document.getElementById('kantor-cabang');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  })()`);
  await new Promise((r) => setTimeout(r, 1200));

  const ssCabangPusat = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'tim_cabang_jakarta_peta_terkoreksi.png'), Buffer.from(ssCabangPusat.data, 'base64'));
  console.log('\n✓ Saved screenshot: tim_cabang_jakarta_peta_terkoreksi.png');

  // Clean up
  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  server.close();
  console.log('\nAll tests completed successfully!');
}

run().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
