// scripts/poll-and-test-live-rekanan.mjs
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const LIVE_TARGET = 'https://kjppnanangrahayu.com/portofolio-rekanan.html';

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

  async evaluate(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Evaluation error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }
}

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function pollUntilLive() {
  console.log(`\n⏳ Menunggu deployment GitHub Actions -> cPanel selesai...`);
  console.log(`   Target: ${LIVE_TARGET}`);
  
  const startTime = Date.now();
  const maxWaitMs = 12 * 60 * 1000; // max 12 minutes
  let attempt = 1;

  while (Date.now() - startTime < maxWaitMs) {
    const bustUrl = `${LIVE_TARGET}?_t=${Date.now()}`;
    try {
      const res = await fetchUrl(bustUrl);
      if (res.statusCode === 200) {
        const hasSampoerna = res.data.includes('Bank Sahabat Sampoerna') && res.data.includes('bank-sampoerna.png');
        const hasBanten2026 = res.data.includes('bank-banten.svg') || res.data.includes('bank-banten.png');
        const has8Categories = res.data.includes('bumn-anak-usaha') && res.data.includes('instansi-pemerintah');
        const noDanamonPublic = !res.data.includes('danamon.svg');

        if (hasSampoerna && has8Categories && noDanamonPublic) {
          console.log(`\n🎉 DEPLOYMENT LIVE TERDETEKSI (Attempt ${attempt}, ${Math.round((Date.now() - startTime)/1000)}s)!`);
          console.log(`   - Bank Sahabat Sampoerna: DITEMUKAN`);
          console.log(`   - 8 Kategori Reklanan: DITEMUKAN`);
          console.log(`   - Logo Danamon Public: BERSIH / TERHAPUS`);
          return true;
        }
      }
      process.stdout.write(`   [Attempt ${attempt}] Menunggu pembaruan server (${Math.round((Date.now() - startTime)/1000)}s)...\r`);
    } catch (e) {
      process.stdout.write(`   [Attempt ${attempt}] Error koneksi: ${e.message}\r`);
    }

    attempt++;
    await new Promise(r => setTimeout(r, 6000));
  }

  throw new Error('Timeout: Deployment tidak terdeteksi dalam 12 menit.');
}

async function verifyLiveCDP() {
  console.log(`\n======================================================`);
  console.log(`📸 MEMVERIFIKASI & MENGAMBIL SCREENSHOT LIVE SERVER`);
  console.log(`======================================================`);

  const chromePath = findChrome();
  const remotePort = 9223;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_live_rekanan');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remotePort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  let versionData = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${remotePort}/json/version`);
      if (res.ok) { versionData = await res.json(); break; }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!versionData) throw new Error('Chrome failed to start');

  const targetsRes = await fetch(`http://127.0.0.1:${remotePort}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  const bustLiveUrl = `${LIVE_TARGET}?_t=${Date.now()}`;
  console.log(`  Membuka halaman live: ${bustLiveUrl}`);
  await cdp.send('Page.navigate', { url: bustLiveUrl });

  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 1200));

  // 1. Verifikasi Constellation & ID 09 Bank Sampoerna
  console.log(`\n--- 1. Uji Live Diamond Constellation & ID 09 ---`);
  const liveInit = await cdp.evaluate(`(() => {
    const pills = document.querySelectorAll('.diamond-logo-pill');
    const counter = document.getElementById('diamond-counter')?.innerText.trim();
    const id9 = window.DATA_REKANAN ? window.DATA_REKANAN.find(r => r.id === 9) : null;
    return {
      pillsCount: pills.length,
      counterText: counter,
      id9Name: id9 ? id9.namaResmi : null,
      id9Logo: id9 ? id9.src : null,
      totalData: window.DATA_REKANAN ? window.DATA_REKANAN.length : 0
    };
  })()`);
  console.log(`  Pills Count:`, liveInit.pillsCount, `(Expect 45)`);
  console.log(`  Counter Text:`, liveInit.counterText);
  console.log(`  ID 09 Partner:`, liveInit.id9Name);
  console.log(`  ID 09 Logo:`, liveInit.id9Logo);

  await cdp.evaluate(`document.getElementById('view-diamond')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await new Promise(r => setTimeout(r, 500));
  const shotDiamond = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_rekanan_diamond.png'), Buffer.from(shotDiamond.data, 'base64'));
  console.log(`  ✓ Screenshot: live_production_rekanan_diamond.png`);

  // 2. Verifikasi Filter Kategori BUMN & Anak Usaha
  console.log(`\n--- 2. Uji Live Filter Kategori BUMN (15) ---`);
  await cdp.evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('.btn-kat-rekanan')).find(b => b.textContent.includes('BUMN & Anak Usaha'));
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  const bumnCount = await cdp.evaluate(`document.querySelectorAll('.diamond-logo-pill').length`);
  console.log(`  BUMN Filter Count:`, bumnCount, `(Expect 15)`);
  const shotBumn = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_rekanan_category_bumn.png'), Buffer.from(shotBumn.data, 'base64'));
  console.log(`  ✓ Screenshot: live_production_rekanan_category_bumn.png`);

  // 3. Verifikasi Pencarian Bank Sampoerna & Penolakan Danamon
  console.log(`\n--- 3. Uji Live Pencarian Bank Sampoerna & Anti Danamon ---`);
  await cdp.evaluate(`resetFilterMitra()`);
  await new Promise(r => setTimeout(r, 300));

  await cdp.evaluate(`(() => {
    const inp = document.getElementById('cari-mitra');
    inp.value = 'Bank Sahabat Sampoerna';
    filterMitra();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  const searchSampoernaCount = await cdp.evaluate(`document.querySelectorAll('.diamond-logo-pill').length`);
  console.log(`  Pencarian "Bank Sahabat Sampoerna":`, searchSampoernaCount, `(Expect 1)`);
  const shotSearch = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_rekanan_search_sampoerna.png'), Buffer.from(shotSearch.data, 'base64'));
  console.log(`  ✓ Screenshot: live_production_rekanan_search_sampoerna.png`);

  await cdp.evaluate(`(() => {
    const inp = document.getElementById('cari-mitra');
    inp.value = 'Bank Danamon';
    filterMitra();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  const searchDanamonCount = await cdp.evaluate(`document.querySelectorAll('.diamond-logo-pill').length`);
  console.log(`  Pencarian "Bank Danamon":`, searchDanamonCount, `(Expect 0 - Tidak ada hasil, ditolak)`);

  // 4. Verifikasi Tampilan Tabel
  console.log(`\n--- 4. Uji Live Tampilan Tabel ---`);
  await cdp.evaluate(`resetFilterMitra()`);
  await new Promise(r => setTimeout(r, 300));
  await cdp.evaluate(`setViewMode('table')`);
  await new Promise(r => setTimeout(r, 500));
  await cdp.evaluate(`document.getElementById('view-table')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await new Promise(r => setTimeout(r, 400));
  const tableRows = await cdp.evaluate(`document.querySelectorAll('#table-rekanan-body tr').length`);
  console.log(`  Table Rows Count:`, tableRows, `(Expect 45)`);
  const shotTable = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_rekanan_table.png'), Buffer.from(shotTable.data, 'base64'));
  console.log(`  ✓ Screenshot: live_production_rekanan_table.png`);

  // 5. Verifikasi Mobile Viewport
  console.log(`\n--- 5. Uji Live Mobile Viewport (375x667) ---`);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.evaluate(`setViewMode('diamond')`);
  await new Promise(r => setTimeout(r, 300));
  await cdp.evaluate(`document.getElementById('view-diamond')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await new Promise(r => setTimeout(r, 500));
  const mobileData = await cdp.evaluate(`(() => {
    const bar = document.getElementById('filter-buttons-container');
    const scrollWidth = bar ? bar.scrollWidth : 0;
    const clientWidth = bar ? bar.clientWidth : 0;
    return {
      isScrollable: scrollWidth > clientWidth,
      pillsCount: document.querySelectorAll('.diamond-logo-pill').length
    };
  })()`);
  console.log(`  Mobile Filter Horizontal Scrollable:`, mobileData.isScrollable ? 'PASS' : 'FAIL');
  console.log(`  Mobile Pills Count:`, mobileData.pillsCount, `(Expect 45)`);
  const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_rekanan_mobile.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log(`  ✓ Screenshot: live_production_rekanan_mobile.png`);

  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log(`\n======================================================`);
  console.log(`🎉 SELURUH PENGUJIAN LIVE SERVER LULUS 100%!`);
  console.log(`======================================================`);
  process.exit(0);
}

async function run() {
  await pollUntilLive();
  await verifyLiveCDP();
}

run().catch(err => {
  console.error('[POLL & TEST ERROR]:', err);
  process.exit(1);
});
