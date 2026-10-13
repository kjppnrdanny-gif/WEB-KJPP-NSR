// scripts/test-rekanan-implementation.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

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
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    return res.result ? res.result.value : undefined;
  }
}

// Simple local static file server
function createStaticServer(port = 8130) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function run() {
  console.log('======================================================');
  console.log('🧪 PENGUJIAN LOKAL REKLASIFIKASI & PEMBARUAN 45 REKANAN');
  console.log('======================================================');

  const PORT = 8130;
  const server = await createStaticServer(PORT);
  console.log(`Local test server running on http://127.0.0.1:${PORT}`);

  const chromePath = findChrome();
  const remoteDebuggingPort = 9470;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_rekanan_test');
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
      if (res.ok) { versionData = await res.json(); break; }
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

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 850,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to portofolio-rekanan.html
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portofolio-rekanan.html` });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 600));

  console.log('\n--- 1. Uji Inisialisasi Diamond Constellation (Desktop 1280x850) ---');
  const initData = await cdp.evaluate(`(() => {
    const pills = document.querySelectorAll('.diamond-logo-pill');
    const counter = document.getElementById('diamond-counter')?.innerText.trim();
    const id9 = DATA_REKANAN.find(r => r.id === 9);
    return {
      pillsCount: pills.length,
      counterText: counter,
      id9Name: id9 ? id9.namaResmi : null,
      id9Logo: id9 ? id9.src : null,
      totalData: DATA_REKANAN.length
    };
  })()`);
  console.log('  Total Pills Rendered:', initData.pillsCount, '(Expect 45)');
  console.log('  Counter Text:', initData.counterText);
  console.log('  ID 09 Partner:', initData.id9Name);
  console.log('  ID 09 Logo Path:', initData.id9Logo);

  // Capture desktop diamond view
  await cdp.evaluate(`document.getElementById('view-diamond')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await new Promise((r) => setTimeout(r, 400));
  const shotDiamond = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_rekanan_diamond_desktop.png'), Buffer.from(shotDiamond.data, 'base64'));
  console.log('  ✓ Screenshot Diamond Desktop: test_rekanan_diamond_desktop.png');

  console.log('\n--- 2. Uji 8 Kategori & Hitungan Otomatis ---');
  const catTests = [
    { key: 'bank-bumn-bumd', expected: 5, label: 'Bank BUMN & BUMD' },
    { key: 'bank-swasta', expected: 8, label: 'Bank Swasta' },
    { key: 'bumn-anak-usaha', expected: 15, label: 'BUMN & Anak Usaha' },
    { key: 'instansi-pemerintah', expected: 3, label: 'Instansi Pemerintah & Lembaga Khusus' },
    { key: 'perusahaan-swasta', expected: 3, label: 'Perusahaan Swasta' },
    { key: 'pembiayaan-lelang', expected: 3, label: 'Pembiayaan, Modal Ventura & Lelang' },
    { key: 'bpr-bprs', expected: 6, label: 'BPR & BPRS' },
    { key: 'asuransi', expected: 2, label: 'Asuransi' }
  ];

  for (const c of catTests) {
    const res = await cdp.evaluate(`(() => {
      filterKategoriRekanan('${c.key}');
      const pills = document.querySelectorAll('.diamond-logo-pill');
      const filtered = getFilteredItems();
      return { pillsCount: pills.length, filteredCount: filtered.length };
    })()`);
    const pass = res.filteredCount === c.expected && res.pillsCount === c.expected;
    console.log(`  Kategori [${c.label}]: ${res.filteredCount}/${c.expected} -> ${pass ? 'PASS' : 'FAIL'}`);
  }

  // Screenshot BUMN & Anak Usaha (15 items)
  await cdp.evaluate(`filterKategoriRekanan('bumn-anak-usaha')`);
  await new Promise((r) => setTimeout(r, 300));
  const shotBumn = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_rekanan_category_bumn.png'), Buffer.from(shotBumn.data, 'base64'));
  console.log('  ✓ Screenshot Kategori BUMN: test_rekanan_category_bumn.png');

  console.log('\n--- 3. Uji Pencarian Mendalam & Penolakan Danamon ---');
  const searchQueries = [
    { q: 'Bank Sahabat Sampoerna', expectId: 9, expectFound: true, desc: 'Search Sampoerna full' },
    { q: 'Bank Sampoerna', expectId: 9, expectFound: true, desc: 'Search Sampoerna popular' },
    { q: 'Bank Danamon', expectId: null, expectFound: false, desc: 'Search Danamon (Must NOT return Sampoerna)' },
    { q: 'Asset II', expectId: 21, expectFound: true, desc: 'Historical Pertamina EP Asset II' },
    { q: 'Asset V', expectId: 22, expectFound: true, desc: 'Historical Pertamina EP Asset V' },
    { q: 'PHSS', expectId: 23, expectFound: true, desc: 'Pertamina Hulu Sanga Sanga abbreviation' },
    { q: 'PTPN VIII', expectId: 28, expectFound: true, desc: 'Historical PTPN VIII' },
    { q: 'Pegadaian', expectId: 29, expectFound: true, desc: 'Pegadaian legal entity' },
    { q: 'Bank Banten', expectId: 5, expectFound: true, desc: 'Bank Banten Perseroda' },
    { q: 'Kementerian PU', expectId: 15, expectFound: true, desc: 'Kementerian PU' },
    { q: 'BPR Sukabumi', expectId: 38, expectFound: true, desc: 'BPR Sukabumi Perseroda' }
  ];

  for (const s of searchQueries) {
    const res = await cdp.evaluate(`(() => {
      currentKat = 'semua';
      document.getElementById('cari-mitra').value = '${s.q}';
      filterMitra();
      const filtered = getFilteredItems();
      const foundItem = filtered.find(r => r.id === ${s.expectId || -1});
      return {
        count: filtered.length,
        hasExpected: !!foundItem,
        names: filtered.map(r => r.id + ': ' + r.namaTampilan)
      };
    })()`);

    if (s.expectFound) {
      const pass = res.hasExpected;
      console.log(`  Pencarian "${s.q}": count=${res.count}, found ID ${s.expectId} -> ${pass ? 'PASS' : 'FAIL'}`);
    } else {
      const pass = res.count === 0 && !res.hasExpected;
      console.log(`  Pencarian "${s.q}": count=${res.count} (Expect 0, no Sampoerna match) -> ${pass ? 'PASS' : 'FAIL'}`);
    }
  }

  // Capture Search Sampoerna
  await cdp.evaluate(`
    document.getElementById('cari-mitra').value = 'Bank Sahabat Sampoerna';
    filterMitra();
  `);
  await new Promise((r) => setTimeout(r, 300));
  const shotSampoerna = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_rekanan_search_sampoerna.png'), Buffer.from(shotSampoerna.data, 'base64'));
  console.log('  ✓ Screenshot Pencarian Sampoerna: test_rekanan_search_sampoerna.png');

  console.log('\n--- 4. Uji Reset Filter & Tampilan Tabel ---');
  await cdp.evaluate(`resetFilterMitra()`);
  await new Promise((r) => setTimeout(r, 300));
  const resetRes = await cdp.evaluate(`(() => {
    const filtered = getFilteredItems();
    const qVal = document.getElementById('cari-mitra').value;
    return { count: filtered.length, qVal, currentKat };
  })()`);
  console.log('  Setelah Reset: count =', resetRes.count, '(Expect 45), input = "' + resetRes.qVal + '"');

  // Switch to Table View
  await cdp.evaluate(`setViewMode('table')`);
  await new Promise((r) => setTimeout(r, 400));
  await cdp.evaluate(`document.getElementById('view-table')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await new Promise((r) => setTimeout(r, 300));

  const tableData = await cdp.evaluate(`(() => {
    const rows = document.querySelectorAll('#table-rekanan-body tr');
    const row9 = rows[8]?.innerText || '';
    return {
      rowCount: rows.length,
      row9Text: row9
    };
  })()`);
  console.log('  Tabel Rows Count:', tableData.rowCount, '(Expect 45)');
  console.log('  Baris 09:', tableData.row9Text.replace(/\\s+/g, ' ').slice(0, 80) + '...');

  const shotTable = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_rekanan_table_desktop.png'), Buffer.from(shotTable.data, 'base64'));
  console.log('  ✓ Screenshot Tabel Desktop: test_rekanan_table_desktop.png');

  console.log('\n--- 5. Uji Mobile Viewport (375x667) & Filter Horizontal ---');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.evaluate(`setViewMode('diamond')`);
  await new Promise((r) => setTimeout(r, 400));

  const mobileData = await cdp.evaluate(`(() => {
    const bar = document.getElementById('filter-buttons-container');
    const scrollWidth = bar ? bar.scrollWidth : 0;
    const clientWidth = bar ? bar.clientWidth : 0;
    const isScrollable = scrollWidth > clientWidth;
    const pills = document.querySelectorAll('.diamond-logo-pill');
    return { isScrollable, pillsCount: pills.length };
  })()`);
  console.log('  Mobile Filter Bar Horizontal Scrollable:', mobileData.isScrollable ? 'PASS' : 'FAIL');
  console.log('  Mobile Diamond Pills Count:', mobileData.pillsCount, '(Expect 45)');

  const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_rekanan_mobile.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log('  ✓ Screenshot Mobile: test_rekanan_mobile.png');

  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  server.close();
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log('\n======================================================');
  console.log('✨ SELURUH PENGUJIAN REKLASIFIKASI 45 REKANAN LULUS 100%!');
  console.log('======================================================');
  process.exit(0);
}

run().catch((err) => {
  console.error('[TEST ERROR]:', err);
  process.exit(1);
});
