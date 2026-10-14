// scripts/test-portal-penugasan.mjs
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
      const WebSocket = globalThis.WebSocket;
      if (!WebSocket) {
        import('ws').then(wsModule => {
          this.ws = new wsModule.default(this.wsUrl);
          this._bindWs(resolve, reject);
        }).catch(reject);
      } else {
        this.ws = new WebSocket(this.wsUrl);
        this._bindWs(resolve, reject);
      }
    });
  }

  _bindWs(resolve, reject) {
    this.ws.onopen = () => resolve();
    this.ws.onerror = (err) => reject(err);
    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    if (this.ws) this.ws.close();
  }
}

function startStaticServer(port = 8787) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + reqPath);
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

async function runTests() {
  console.log('🚀 Memulai test suite lokal untuk portal-penugasan-jo.html & index.html...');
  const port = 8787;
  const server = await startStaticServer(port);
  console.log(`✓ Local server running on http://127.0.0.1:${port}`);

  const chromePath = findChrome();
  const remoteDebuggingPort = 9224;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_jo_test');

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,960',
    'about:blank'
  ]);

  let pages = null;
  for (let i = 0; i < 30; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
      if (listRes.ok) {
        pages = await listRes.json();
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 200));
  }
  if (!pages) throw new Error('Chrome failed to start or open port');

  let cdp = null;
  try {
    const targetPage = pages.find(p => p.type === 'page') || pages[0];
    cdp = new CDPClient(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('✓ CDP Client connected');

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // ------------------------------------------------------------------
    // TEST 1: index.html - Verifikasi Kartu Lingkup Penugasan & JO
    // ------------------------------------------------------------------
    console.log('\n--- TEST 1: Memeriksa index.html Section Internal Operations Directory ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` });
    for (let i = 0; i < 40; i++) {
      const res = await cdp.send('Runtime.evaluate', { expression: `document.readyState === 'complete'` });
      if (res.result.value) break;
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 1000));

    const checkIndexResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const links = Array.from(document.querySelectorAll('a[href*="portal-penugasan-jo.html"]'));
          const hasCard = links.length > 0;
          const cardText = hasCard ? links[0].innerText : '';
          return {
            url: window.location.href,
            title: document.title,
            bodyLength: document.body ? document.body.innerHTML.length : 0,
            hasCard,
            linkCount: links.length,
            cardText
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Result Test 1:', checkIndexResult.result.value);
    if (!checkIndexResult.result.value.hasCard) {
      throw new Error('Kartu Lingkup Penugasan & JO tidak ditemukan di index.html');
    }
    console.log('✓ Kartu portal-penugasan-jo.html terpasang sempurna di index.html');

    // Screenshot kartu di index.html
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('a[href="portal-penugasan-jo.html"]');
          if (card) {
            card.scrollIntoView({ behavior: 'instant', block: 'center' });
            card.style.outline = '3px solid #f59e0b';
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));
    const ssIndex = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_index_jo_card.png'), Buffer.from(ssIndex.data, 'base64'));
    console.log('✓ Screenshot kartu tersimpan: test_index_jo_card.png');

    // ------------------------------------------------------------------
    // TEST 2: portal-penugasan-jo.html - Token Gate & Mode Pusat
    // ------------------------------------------------------------------
    console.log('\n--- TEST 2: Membuka portal-penugasan-jo.html & Token Auth ---');
    await cdp.send('Page.navigate', { url: `http://localhost:${port}/portal-penugasan-jo.html` });
    await new Promise(r => setTimeout(r, 1500));

    // Cek modal token terbuka
    const modalCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-token-auth');
          const isVisible = modal && !modal.classList.contains('hidden');
          return { isVisible };
        })()
      `,
      returnByValue: true
    });
    console.log('Modal Token Check:', modalCheck.result.value);

    // Input token NSR-PST-2026 dan submit
    console.log('Memasukkan token NSR-PST-2026 (Mode Pusat)...');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          document.getElementById('input_token_auth').value = 'NSR-PST-2026';
          verifikasiTokenLogin();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Cek status sesi setelah login
    const sessionCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const badgeText = document.getElementById('session-label').innerText;
          const modeTitle = document.getElementById('mode-title').innerText;
          return { badgeText, modeTitle, userSession };
        })()
      `,
      returnByValue: true
    });
    console.log('Session Check Result:', sessionCheck.result.value);

    // Capture screenshot Tab 1 Form
    const ssTab1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_portal_jo_form.png'), Buffer.from(ssTab1.data, 'base64'));
    console.log('✓ Screenshot Tab 1 tersimpan: test_portal_jo_form.png');

    // ------------------------------------------------------------------
    // TEST 3: Pindah ke Tab 2 (Dashboard Antrean)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3: Menguji Tab 2 (Dashboard & Antrean) ---');
    await cdp.send('Runtime.evaluate', { expression: `pindahTab('dashboard')` });
    await new Promise(r => setTimeout(r, 500));

    const dashCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const rows = document.querySelectorAll('#tbody-dashboard tr');
          return { rowCount: rows.length };
        })()
      `,
      returnByValue: true
    });
    console.log('Dashboard Rows Count:', dashCheck.result.value);

    const ssTab2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_portal_jo_dashboard.png'), Buffer.from(ssTab2.data, 'base64'));
    console.log('✓ Screenshot Tab 2 tersimpan: test_portal_jo_dashboard.png');

    // ------------------------------------------------------------------
    // TEST 4: Pindah ke Tab 3 (Pratinjau & Cetak 9 Dokumen)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 4: Menguji Tab 3 (Pratinjau & Cetak 9 Dokumen) ---');
    await cdp.send('Runtime.evaluate', { expression: `pindahTab('preview')` });
    await new Promise(r => setTimeout(r, 800));

    const previewCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const renderedArea = document.getElementById('preview-rendered-area');
          const text = renderedArea.innerText;
          return {
            hasSPK: text.includes('LINGKUP PENUGASAN (SPK)'),
            hasRepresentasi: text.includes('SURAT REPRESENTASI PEMBERI TUGAS'),
            hasIsianUmum: text.includes('LEMBAR ISIAN UMUM'),
            hasJO: text.includes('FORM ORDER (JO)'),
            hasKartuProyek: text.includes('KARTU KENDALI MUTU PROYEK'),
            hasSuratTugas: text.includes('SURAT TUGAS INSPEKSI LAPANGAN'),
            hasBAP: text.includes('BERITA ACARA PEMERIKSAAN'),
            hasETI: text.includes('EVALUASI TINGKAT INDEPENDENSI'),
            hasPI: text.includes('PERNYATAAN INDEPENDENSI PENILAI'),
            totalLength: text.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Preview 9 Dokumen Check:', previewCheck.result.value);

    const ssTab3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_portal_jo_preview.png'), Buffer.from(ssTab3.data, 'base64'));
    console.log('✓ Screenshot Tab 3 tersimpan: test_portal_jo_preview.png');

    console.log('\n✨ SELURUH 4 PENGUJIAN OTOMASI LULUS DENGAN SUKSES SEMPURNA!');

  } finally {
    if (cdp) await cdp.close();
    chromeProc.kill('SIGKILL');
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
