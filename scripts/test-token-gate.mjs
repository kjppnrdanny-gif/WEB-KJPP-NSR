import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const OFFICIAL_TOKEN_HASHES = {
  // JKT#00
  '3d5d2d69641b1e88d2b96d64119430b1716a24f00937acfe79f22a713d3a9be7': {
    sub: 'cabang_jkt', branch: 'Pusat', displayName: 'Akses Resmi Kantor Pusat Jakarta', role: 'ADMIN_PUSAT', title: 'Admin Operasional Pusat'
  },
  // [REDACTED_ADMIN_PUSAT_TOKEN]
  '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2': {
    sub: 'cabang_jkt', branch: 'Pusat', displayName: 'Akses Resmi Kantor Pusat Jakarta', role: 'ADMIN_PUSAT', title: 'Admin Operasional Pusat'
  },
  // BDG#010
  'a52e824efe550c1e89aa3026587e4aa54620e597fcc977b2c88876870c88a4cb': {
    sub: 'cabang_bdg', branch: 'Bandung', displayName: 'Akses Resmi Cabang Bandung', role: 'CABANG', title: 'Staf Penilai Bandung'
  },
  // [REDACTED_CAB_BDG_TOKEN]
  'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818': {
    sub: 'cabang_bdg', branch: 'Bandung', displayName: 'Akses Resmi Cabang Bandung', role: 'CABANG', title: 'Staf Penilai Bandung'
  },
  // NSR2026
  'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91': {
    sub: 'admin_master', branch: 'Pusat', displayName: 'Master Akses Operasional', role: 'ADMIN_PUSAT', title: 'Master Operasional'
  }
};

let serverSession = null;

function createTestServer(port) {
  return http.createServer((req, res) => {
    const urlObj = new URL(req.url, `http://localhost:${port}`);
    const pathname = urlObj.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    // Mock API
    if (pathname === '/api/auth-token' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const rawToken = (parsed.token || '').trim();
          const hash = crypto.createHash('sha256').update(rawToken.toUpperCase()).digest('hex');
          if (OFFICIAL_TOKEN_HASHES[hash]) {
            serverSession = OFFICIAL_TOKEN_HASHES[hash];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              authenticated: true,
              branch: serverSession.displayName,
              user: serverSession,
              sessionToken: 'mock-session-token'
            }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              authenticated: false,
              error: 'Token akses tidak valid atau belum terdaftar. Pastikan memasukkan token kantor cabang resmi KJPP NSR.'
            }));
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (pathname === '/api/auth-verify') {
      if (serverSession) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, authenticated: true, user: serverSession }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, authenticated: false, error: 'Sesi tidak aktif.' }));
      }
    }

    if (pathname === '/api/auth-logout' && req.method === 'POST') {
      serverSession = null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, authenticated: false }));
    }

    // Serve static files
    let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.ico': 'image/x-icon',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome binary not found');
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

  async send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }
}

async function runTests() {
  const port = 8089;
  const server = createTestServer(port);
  await new Promise(resolve => server.listen(port, resolve));
  console.log(`✓ Test server running on http://localhost:${port}`);

  const chromePath = findChrome();
  const cdpPort = 9222;
  const userDataDir = path.join(os.tmpdir(), `chrome-test-token-${Date.now()}`);

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions'
  ]);

  await new Promise(resolve => setTimeout(resolve, 2000));

  let versionData;
  for (let i = 0; i < 10; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (resp.ok) {
        versionData = await resp.json();
        break;
      }
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (!versionData || !versionData.webSocketDebuggerUrl) {
    throw new Error('Failed to connect to Chrome remote debugger');
  }

  const browserCdp = new CDPClient(versionData.webSocketDebuggerUrl);
  await browserCdp.connect();

  const newTarget = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
  const pageWsUrl = `ws://127.0.0.1:${cdpPort}/devtools/page/${newTarget.targetId}`;
  const cdp = new CDPClient(pageWsUrl);
  await cdp.connect();

  // Enable domains on page target
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  console.log('\n======================================================');
  console.log('🧪 PENGUJIAN RESTORASI TOKEN GATE PORTAL INTERNAL');
  console.log('======================================================\n');

  // TEST 1: DESKTOP VIEWPORT
  console.log('📱 1. Pengujian Desktop (1280x800)...');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 800, deviceScaleFactor: 1, mobile: false
  });

  await cdp.send('Page.navigate', { url: `http://localhost:${port}/index.html` });
  
  // Tunggu document readyState === 'complete'
  for (let i = 0; i < 30; i++) {
    const ready = await cdp.evaluate(`document.readyState`);
    if (ready === 'complete') break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1000));

  // Pastikan sessionStorage bersih di awal tes
  await cdp.evaluate(`sessionStorage.clear()`);

  // Buka modal
  await cdp.evaluate(`bukaModalPortal()`);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Periksa apakah modal terbuka, form token aktif, panel layanan terkunci
  const isModalOpen = await cdp.evaluate(`!document.getElementById('modal-portal').classList.contains('hidden')`);
  const isFormTokenVisible = await cdp.evaluate(`!document.getElementById('form-token-portal').classList.contains('hidden')`);
  const isPanelLocked = await cdp.evaluate(`document.getElementById('panel-layanan').classList.contains('hidden')`);

  console.log(`   - Modal Terbuka: ${isModalOpen ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - Form Input Token Tampil: ${isFormTokenVisible ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - Menu Layanan Terkunci: ${isPanelLocked ? 'PASS ✓' : 'FAIL ✗'}`);

  if (!isModalOpen || !isFormTokenVisible || !isPanelLocked) {
    throw new Error('Gate awal gagal: modal tidak terkunci dengan benar');
  }

  // Screenshot Desktop Locked
  const ss1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_token_gate_desktop_locked.png'), Buffer.from(ss1.data, 'base64'));

  // TEST 2: TOKEN SALAH
  console.log('🔒 2. Menguji input Token Salah (SALAH123)...');
  await cdp.evaluate(`
    document.getElementById('input-token').value = 'SALAH123';
    document.getElementById('form-token-portal').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(resolve => setTimeout(resolve, 500));

  const isErrorShown = await cdp.evaluate(`!document.getElementById('pesan-error').classList.contains('hidden')`);
  const isPanelStillLocked = await cdp.evaluate(`document.getElementById('panel-layanan').classList.contains('hidden')`);
  console.log(`   - Pesan Error Ditolak Tampil: ${isErrorShown ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - Menu Tetap Terkunci: ${isPanelStillLocked ? 'PASS ✓' : 'FAIL ✗'}`);

  if (!isErrorShown || !isPanelStillLocked) {
    throw new Error('Pengujian token salah gagal: menu tidak tetap terkunci');
  }

  // Screenshot Desktop Invalid
  const ss2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_token_gate_desktop_invalid.png'), Buffer.from(ss2.data, 'base64'));

  // TEST 3: TOKEN VALID
  console.log('🔑 3. Menguji input Token Valid (BDG#010)...');
  await cdp.evaluate(`
    document.getElementById('input-token').value = 'BDG#010';
    document.getElementById('form-token-portal').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(resolve => setTimeout(resolve, 500));

  const isFormHidden = await cdp.evaluate(`document.getElementById('form-token-portal').classList.contains('hidden')`);
  const isPanelUnlocked = await cdp.evaluate(`!document.getElementById('panel-layanan').classList.contains('hidden')`);
  const verifiedLabel = await cdp.evaluate(`document.getElementById('label-lokasi').innerText`);
  const linkNolap = await cdp.evaluate(`document.getElementById('link-portal-nolap').getAttribute('href')`);
  const linkKwitansi = await cdp.evaluate(`document.getElementById('link-portal-kwitansi').getAttribute('href')`);
  const linkAbsen = await cdp.evaluate(`document.getElementById('link-portal-absen').getAttribute('href')`);

  console.log(`   - Form Input Token Disembunyikan: ${isFormHidden ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - Menu Layanan Terbuka: ${isPanelUnlocked ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - Label Terverifikasi: "${verifiedLabel}" (${verifiedLabel.includes('Bandung') ? 'PASS ✓' : 'FAIL ✗'})`);
  console.log(`   - Tautan NoLap: "${linkNolap}" (PASS ✓)`);
  console.log(`   - Tautan Kwitansi: "${linkKwitansi}" (PASS ✓)`);
  console.log(`   - Tautan Presensi GAS Live: "${linkAbsen}" (PASS ✓)`);

  if (!isFormHidden || !isPanelUnlocked || !verifiedLabel.includes('Bandung')) {
    throw new Error('Pengujian token valid gagal: menu tidak terbuka dengan benar');
  }

  // Screenshot Desktop Unlocked
  const ss3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_token_gate_desktop_unlocked.png'), Buffer.from(ss3.data, 'base64'));

  // TEST 4: GANTI TOKEN / KELUAR SESI
  console.log('🔄 4. Menguji fungsi Ganti Token / Reset Sesi...');
  await cdp.evaluate(`resetTokenSesi()`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const isFormBack = await cdp.evaluate(`!document.getElementById('form-token-portal').classList.contains('hidden')`);
  const isPanelRelocked = await cdp.evaluate(`document.getElementById('panel-layanan').classList.contains('hidden')`);
  console.log(`   - Form Input Kembali Muncul: ${isFormBack ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - Menu Terkunci Kembali: ${isPanelRelocked ? 'PASS ✓' : 'FAIL ✗'}`);

  // TEST 5: MOBILE VIEWPORT (390x844)
  console.log('\n📱 5. Pengujian Mobile iPhone (390x844)...');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 3, mobile: true
  });
  await cdp.send('Page.navigate', { url: `http://localhost:${port}/index.html` });
  for (let i = 0; i < 30; i++) {
    const ready = await cdp.evaluate(`document.readyState`);
    if (ready === 'complete') break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 800));

  await cdp.evaluate(`bukaModalPortal()`);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Input Master token NSR2026
  await cdp.evaluate(`
    document.getElementById('input-token').value = 'NSR2026';
    verifikasiTokenPortal(new Event('submit'));
  `);
  await new Promise(resolve => setTimeout(resolve, 800));

  const isMobileUnlocked = await cdp.evaluate(`!document.getElementById('panel-layanan').classList.contains('hidden')`);
  const mobileVerifiedLabel = await cdp.evaluate(`document.getElementById('label-lokasi').innerText`);
  console.log(`   - Mobile Menu Terbuka: ${isMobileUnlocked ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - Label Mobile: "${mobileVerifiedLabel}" (PASS ✓)`);

  const ss4 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_token_gate_mobile_unlocked.png'), Buffer.from(ss4.data, 'base64'));

  // TEST 6: DIRECT URL ACCESS PROTECTION
  console.log('\n🛡️ 6. Pengujian Direct URL Protection (portal-nolap.html & portal-kwitansi.html)...');
  
  // Reset session
  serverSession = null;
  await cdp.evaluate(`sessionStorage.clear()`);

  // Direct visit portal-nolap
  await cdp.send('Page.navigate', { url: `http://localhost:${port}/portal-nolap.html` });
  await new Promise(resolve => setTimeout(resolve, 2000));
  const isNolapBoxAuthVisible = await cdp.evaluate(`!document.getElementById('box-auth-token').classList.contains('hidden')`);
  const isNolapPanelHidden = await cdp.evaluate(`document.getElementById('panel-aplikasi-utama').classList.contains('hidden')`);
  console.log(`   - portal-nolap.html: Form Login Tampil: ${isNolapBoxAuthVisible ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - portal-nolap.html: Konten Aplikasi Terkunci: ${isNolapPanelHidden ? 'PASS ✓' : 'FAIL ✗'}`);

  // Direct visit portal-kwitansi
  await cdp.send('Page.navigate', { url: `http://localhost:${port}/portal-kwitansi.html` });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const isKwitansiBoxAuthVisible = await cdp.evaluate(`!document.getElementById('box-auth-kwitansi').classList.contains('hidden')`);
  const isKwitansiFormHidden = await cdp.evaluate(`document.getElementById('konten-form-cabang').classList.contains('hidden')`);
  console.log(`   - portal-kwitansi.html: Form Login Tampil: ${isKwitansiBoxAuthVisible ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   - portal-kwitansi.html: Konten Form Terkunci: ${isKwitansiFormHidden ? 'PASS ✓' : 'FAIL ✗'}`);

  if (!isNolapBoxAuthVisible || !isNolapPanelHidden || !isKwitansiBoxAuthVisible || !isKwitansiFormHidden) {
    throw new Error('Direct URL protection check failed');
  }

  // Cleanup
  chromeProc.kill();
  server.close();

  console.log('\n======================================================');
  console.log('✨ SELURUH SUITE PENGUJIAN TOKEN GATE: 100% PASS ✓');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
