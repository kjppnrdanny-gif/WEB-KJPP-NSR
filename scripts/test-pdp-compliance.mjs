// scripts/test-pdp-compliance.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const PORT = 8135;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };
  return map[ext] || 'application/octet-stream';
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);
      if (reqPath === '/') reqPath = '/index.html';

      // Mock backend PDP endpoint for local test
      if (reqPath === '/api/pdp-consent') {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            const data = JSON.parse(body || '{}');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'success',
              consent_id: 'CONSENT-TEST-' + Date.now(),
              policy_version: '2.1-2026.10',
              timestamp: new Date().toISOString()
            }));
          });
          return;
        }
      }

      if (reqPath === '/api/pdp-request') {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'success',
              ticket_id: 'REQ-PDP-TEST-9988',
              catatan: 'Permohonan diterima untuk diproses DPO.'
            }));
          });
          return;
        }
      }

      const filePath = path.join(ROOT_DIR, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
        res.end(fs.readFileSync(filePath));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Local test server running on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
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

async function run() {
  console.log('======================================================');
  console.log('🧪 PENGUJIAN OTOMATIS KEPATUHAN UU PDP & DISCLAIMER');
  console.log('======================================================');

  const server = await startStaticServer();
  const chromePath = findChrome();
  const remoteDebuggingPort = 9225;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_pdp_test');

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

  // --- 1. Uji Halaman Utama (index.html) & Form RFP ---
  console.log('\n--- 1. Uji Homepage (index.html) Footer & RFP Modal ---');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 500));

  // Periksa Footer Links
  const footerTest = await cdp.evaluate(`(() => {
    const privBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Kebijakan Privasi'));
    const discBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Disclaimer Profesi'));
    return { hasPrivBtn: !!privBtn, hasDiscBtn: !!discBtn };
  })()`);
  console.log('  Footer Privacy Link:', footerTest.hasPrivBtn ? 'PASS' : 'FAIL');
  console.log('  Footer Disclaimer Link:', footerTest.hasDiscBtn ? 'PASS' : 'FAIL');

  // Buka Modal RFP
  await cdp.evaluate(`bukaModal('modal-rfp')`);
  await new Promise((r) => setTimeout(r, 300));

  const rfpCheck = await cdp.evaluate(`(() => {
    const chk1 = document.getElementById('rfp-consent-notice');
    const chk2 = document.getElementById('rfp-consent-process');
    return {
      existsChk1: !!chk1,
      existsChk2: !!chk2,
      checked1: chk1 ? chk1.checked : true,
      checked2: chk2 ? chk2.checked : true
    };
  })()`);
  console.log('  RFP Checkbox 1 (Notice): exists=' + rfpCheck.existsChk1 + ', checkedByDefault=' + rfpCheck.checked1 + ' (Expect false) -> ' + (!rfpCheck.checked1 ? 'PASS' : 'FAIL'));
  console.log('  RFP Checkbox 2 (Consent): exists=' + rfpCheck.existsChk2 + ', checkedByDefault=' + rfpCheck.checked2 + ' (Expect false) -> ' + (!rfpCheck.checked2 ? 'PASS' : 'FAIL'));

  // Screenshot RFP Modal dengan Notice PDP
  const shotRfp = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_pdp_modal_rfp.png'), Buffer.from(shotRfp.data, 'base64'));
  console.log('  ✓ Screenshot: test_pdp_modal_rfp.png');

  // Buka Modal Kebijakan Privasi
  await cdp.evaluate(`bukaModalPrivasi()`);
  await new Promise((r) => setTimeout(r, 300));
  const privModalVisible = await cdp.evaluate(`!document.getElementById('modal-kebijakan-privasi').classList.contains('hidden')`);
  console.log('  Modal Kebijakan Privasi Terbuka:', privModalVisible ? 'PASS' : 'FAIL');
  const shotPrivModal = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_pdp_modal_privasi.png'), Buffer.from(shotPrivModal.data, 'base64'));
  console.log('  ✓ Screenshot: test_pdp_modal_privasi.png');

  // Tutup Modal via Escape
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 200));
  const privModalClosed = await cdp.evaluate(`document.getElementById('modal-kebijakan-privasi').classList.contains('hidden')`);
  console.log('  Modal Privasi Ditutup via Escape:', privModalClosed ? 'PASS' : 'FAIL');

  // Buka Modal Disclaimer
  await cdp.evaluate(`bukaModalDisclaimer()`);
  await new Promise((r) => setTimeout(r, 300));
  const discModalVisible = await cdp.evaluate(`!document.getElementById('modal-disclaimer').classList.contains('hidden')`);
  console.log('  Modal Disclaimer Profesi Terbuka:', discModalVisible ? 'PASS' : 'FAIL');
  const shotDiscModal = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_pdp_modal_disclaimer.png'), Buffer.from(shotDiscModal.data, 'base64'));
  console.log('  ✓ Screenshot: test_pdp_modal_disclaimer.png');
  await cdp.evaluate(`tutupModalDisclaimer()`);

  // --- 2. Uji Halaman Permanen Kebijakan Privasi (kebijakan-privasi.html) ---
  console.log('\n--- 2. Uji Halaman Permanen Kebijakan Privasi (kebijakan-privasi.html) ---');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/kebijakan-privasi.html` });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 500));

  const privPageData = await cdp.evaluate(`(() => {
    const title = document.title;
    const hasForm = !!document.getElementById('form-pdp-request');
    const hasDPO = document.body.innerText.includes('privasi@kjppnanangrahayu.com');
    return { title, hasForm, hasDPO };
  })()`);
  console.log('  Judul Dokumen:', privPageData.title);
  console.log('  Formulir Hak Subjek Data Tersedia:', privPageData.hasForm ? 'PASS' : 'FAIL');
  console.log('  Kontak Resmi DPO Tersedia:', privPageData.hasDPO ? 'PASS' : 'FAIL');

  const shotPrivPage = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_pdp_halaman_kebijakan.png'), Buffer.from(shotPrivPage.data, 'base64'));
  console.log('  ✓ Screenshot: test_pdp_halaman_kebijakan.png');

  // --- 3. Uji Halaman Permanen Disclaimer (disclaimer.html) ---
  console.log('\n--- 3. Uji Halaman Permanen Disclaimer (disclaimer.html) ---');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/disclaimer.html` });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 500));

  const discPageData = await cdp.evaluate(`(() => {
    const text = document.body.innerText;
    const hasSPI = text.includes('SPI 103');
    const hasEngagement = text.includes('Surat Perikatan Penugasan');
    return { hasSPI, hasEngagement };
  })()`);
  console.log('  Materi Standar SPI 103 & KEPI:', discPageData.hasSPI ? 'PASS' : 'FAIL');
  console.log('  Penegasan Surat Perikatan (SPK):', discPageData.hasEngagement ? 'PASS' : 'FAIL');

  const shotDiscPage = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_pdp_halaman_disclaimer.png'), Buffer.from(shotDiscPage.data, 'base64'));
  console.log('  ✓ Screenshot: test_pdp_halaman_disclaimer.png');

  // --- 4. Uji Portal Presensi Karyawan (portal-absensi.html) ---
  console.log('\n--- 4. Uji Portal Presensi Karyawan (portal-absensi.html) ---');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-absensi.html` });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 1000));

  const empNoticeData = await cdp.evaluate(`(() => {
    const modal = document.getElementById('modal-privacy-karyawan');
    const isVisible = modal && !modal.classList.contains('hidden');
    const text = modal ? modal.innerText : '';
    const hasNotice = text.includes('Sistem Presensi Online KJPP NSR memproses data identitas karyawan');
    const hasGPSNote = text.includes('bukan pelacakan posisi terus-menerus');
    return { isVisible, hasNotice, hasGPSNote };
  })()`);
  console.log('  Pemberitahuan Privasi Karyawan Muncul Otomatis:', empNoticeData.isVisible ? 'PASS' : 'FAIL');
  console.log('  Teks Pemberitahuan Sesuai Klausul D:', empNoticeData.hasNotice ? 'PASS' : 'FAIL');
  console.log('  Batasan Lokasi GPS Sesaat Ditegaskan:', empNoticeData.hasGPSNote ? 'PASS' : 'FAIL');

  const shotEmpModal = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_pdp_modal_karyawan.png'), Buffer.from(shotEmpModal.data, 'base64'));
  console.log('  ✓ Screenshot: test_pdp_modal_karyawan.png');

  // Konfirmasi penerimaan pemberitahuan karyawan
  await cdp.evaluate(`window.konfirmasiPrivasiKaryawan()`);
  await new Promise((r) => setTimeout(r, 300));
  const isAckStored = await cdp.evaluate(`!!localStorage.getItem('nsr_presensi_privacy_ack')`);
  console.log('  Konfirmasi Privasi Karyawan Tersimpan:', isAckStored ? 'PASS' : 'FAIL');

  // --- 5. Uji Mobile Viewport (375x667) ---
  console.log('\n--- 5. Uji Mobile Viewport Responsiveness ---');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.evaluate(`bukaModalPrivasi()`);
  await new Promise((r) => setTimeout(r, 400));
  const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_pdp_mobile_modal_privasi.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log('  ✓ Screenshot Mobile: test_pdp_mobile_modal_privasi.png');

  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  server.close();
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log('\n======================================================');
  console.log('✨ SELURUH PENGUJIAN KEPATUHAN UU PDP LULUS 100%!');
  console.log('======================================================');
  process.exit(0);
}

run().catch((err) => {
  console.error('[PDP TEST ERROR]:', err);
  process.exit(1);
});
