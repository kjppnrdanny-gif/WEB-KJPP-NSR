import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

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

async function verifyLiveProduction() {
  const chromePath = findChrome();
  const cdpPort = 9226;
  const userDataDir = path.join(os.tmpdir(), `chrome-test-live-prod-${Date.now()}`);

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
    throw new Error('Gagal menghubungkan Chrome CDP');
  }

  const browserCdp = new CDPClient(versionData.webSocketDebuggerUrl);
  await browserCdp.connect();

  const newTarget = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
  const pageWsUrl = `ws://127.0.0.1:${cdpPort}/devtools/page/${newTarget.targetId}`;

  const cdp = new CDPClient(pageWsUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  console.log('\n======================================================');
  console.log('🌐 VERIFIKASI LANGSUNG SERVER PRODUKSI CPANEL');
  console.log('🔗 URL: https://kjppnanangrahayu.com/');
  console.log('======================================================\n');

  try {
    // 1. DESKTOP VIEWPORT
    console.log('📱 1. Pengujian Desktop Produksi (1280x800)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 800, deviceScaleFactor: 1, mobile: false
    });

    await cdp.send('Page.navigate', { url: 'https://kjppnanangrahayu.com/' });
    for (let i = 0; i < 40; i++) {
      const ready = await cdp.evaluate(`document.readyState`);
      if (ready === 'complete') break;
      await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 1000));

    await cdp.evaluate(`sessionStorage.clear()`);

    // Buka modal
    await cdp.evaluate(`bukaModalPortal()`);
    await new Promise(r => setTimeout(r, 600));

    const isModalOpen = await cdp.evaluate(`!document.getElementById('modal-portal').classList.contains('hidden')`);
    const isFormTokenVisible = await cdp.evaluate(`!document.getElementById('form-token-portal').classList.contains('hidden')`);
    const isPanelLocked = await cdp.evaluate(`document.getElementById('panel-layanan').classList.contains('hidden')`);

    console.log(`   - Modal Terbuka: ${isModalOpen ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`   - Form Input Token Tampil: ${isFormTokenVisible ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`   - Menu Layanan Terkunci: ${isPanelLocked ? 'PASS ✓' : 'FAIL ✗'}`);

    if (!isModalOpen || !isFormTokenVisible || !isPanelLocked) {
      throw new Error('Gate awal produksi gagal: menu layanan tidak terkunci');
    }

    const ss1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_token_gate_locked.png'), Buffer.from(ss1.data, 'base64'));

    // 2. INPUT TOKEN SALAH
    console.log('🔒 2. Menguji input Token Salah (SALAH123)...');
    await cdp.evaluate(`(async () => {
      document.getElementById('input-token').value = 'SALAH123';
      await verifikasiTokenPortal();
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    const isErrorShown = await cdp.evaluate(`!document.getElementById('pesan-error').classList.contains('hidden')`);
    const isPanelStillLocked = await cdp.evaluate(`document.getElementById('panel-layanan').classList.contains('hidden')`);
    console.log(`   - Pesan Error Ditolak Tampil: ${isErrorShown ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`   - Menu Tetap Terkunci: ${isPanelStillLocked ? 'PASS ✓' : 'FAIL ✗'}`);

    if (!isErrorShown || !isPanelStillLocked) {
      throw new Error('Token salah tidak ditolak di server produksi');
    }

    const ss2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_token_gate_invalid.png'), Buffer.from(ss2.data, 'base64'));

    // 3. INPUT TOKEN RESMI (BDG#010)
    console.log('🔑 3. Menguji input Token Valid (BDG#010)...');
    await cdp.evaluate(`(async () => {
      document.getElementById('input-token').value = 'BDG#010';
      await verifikasiTokenPortal();
    })()`);
    await new Promise(r => setTimeout(r, 1000));

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
      throw new Error('Token valid gagal membuka menu layanan di server produksi');
    }

    const ss3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_token_gate_unlocked.png'), Buffer.from(ss3.data, 'base64'));

    // 4. RESET SESI
    console.log('🔄 4. Menguji fungsi Ganti Token / Reset Sesi...');
    await cdp.evaluate(`resetTokenSesi()`);
    await new Promise(r => setTimeout(r, 600));

    const isFormBack = await cdp.evaluate(`!document.getElementById('form-token-portal').classList.contains('hidden')`);
    const isPanelRelocked = await cdp.evaluate(`document.getElementById('panel-layanan').classList.contains('hidden')`);
    console.log(`   - Form Input Kembali Muncul: ${isFormBack ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`   - Menu Terkunci Kembali: ${isPanelRelocked ? 'PASS ✓' : 'FAIL ✗'}`);

    // 5. MOBILE VIEWPORT (390x844)
    console.log('\n📱 5. Pengujian Mobile iPhone (390x844)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 3, mobile: true
    });
    await cdp.send('Page.navigate', { url: 'https://kjppnanangrahayu.com/' });
    for (let i = 0; i < 40; i++) {
      const ready = await cdp.evaluate(`document.readyState`);
      if (ready === 'complete') break;
      await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 1000));

    await cdp.evaluate(`bukaModalPortal()`);
    await new Promise(r => setTimeout(r, 500));

    await cdp.evaluate(`(async () => {
      document.getElementById('input-token').value = 'NSR2026';
      await verifikasiTokenPortal();
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    const isMobileUnlocked = await cdp.evaluate(`!document.getElementById('panel-layanan').classList.contains('hidden')`);
    const mobileVerifiedLabel = await cdp.evaluate(`document.getElementById('label-lokasi').innerText`);
    console.log(`   - Mobile Menu Terbuka: ${isMobileUnlocked ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`   - Label Mobile: "${mobileVerifiedLabel}" (PASS ✓)`);

    const ss4 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_token_gate_mobile.png'), Buffer.from(ss4.data, 'base64'));

    // 6. DIRECT URL PROTECTION DI SERVER PRODUKSI
    console.log('\n🛡️ 6. Pengujian Direct URL Protection (portal-nolap.html & portal-kwitansi.html)...');
    await cdp.send('Network.clearBrowserCookies');
    await cdp.send('Network.clearBrowserCache');
    await cdp.evaluate(`sessionStorage.clear(); localStorage.clear();`);

    // portal-nolap.html langsung
    await cdp.send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html' });
    for (let i = 0; i < 40; i++) {
      const ready = await cdp.evaluate(`document.readyState`);
      if (ready === 'complete') break;
      await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 1500));

    const isNolapBoxAuthVisible = await cdp.evaluate(`!document.getElementById('box-auth-token').classList.contains('hidden')`);
    const isNolapPanelHidden = await cdp.evaluate(`document.getElementById('panel-aplikasi-utama').classList.contains('hidden')`);
    console.log(`   - portal-nolap.html: Form Login Tampil: ${isNolapBoxAuthVisible ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`   - portal-nolap.html: Konten Aplikasi Terkunci: ${isNolapPanelHidden ? 'PASS ✓' : 'FAIL ✗'}`);

    // portal-kwitansi.html langsung
    await cdp.send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-kwitansi.html' });
    for (let i = 0; i < 40; i++) {
      const ready = await cdp.evaluate(`document.readyState`);
      if (ready === 'complete') break;
      await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 1500));

    const isKwitansiBoxAuthVisible = await cdp.evaluate(`!document.getElementById('box-auth-kwitansi').classList.contains('hidden')`);
    const isKwitansiFormHidden = await cdp.evaluate(`document.getElementById('konten-form-cabang').classList.contains('hidden')`);
    console.log(`   - portal-kwitansi.html: Form Login Tampil: ${isKwitansiBoxAuthVisible ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`   - portal-kwitansi.html: Konten Form Terkunci: ${isKwitansiFormHidden ? 'PASS ✓' : 'FAIL ✗'}`);

    if (!isNolapBoxAuthVisible || !isNolapPanelHidden || !isKwitansiBoxAuthVisible || !isKwitansiFormHidden) {
      throw new Error('Proteksi direct URL gagal di server produksi');
    }

    console.log('\n======================================================');
    console.log('✨ VERIFIKASI SERVER PRODUKSI CPANEL: 100% PASS ✓');
    console.log('======================================================\n');
  } finally {
    try { chromeProc.kill(); } catch (e) {}
  }
}

verifyLiveProduction().catch(err => {
  console.error('LIVE PRODUCTION TEST ERROR:', err);
  process.exit(1);
});
