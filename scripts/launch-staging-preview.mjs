/**
 * SCRIPT: launch-staging-preview.mjs
 * Peluncuran Staging Preview Online Terpadu KJPP NSR (Branch dev)
 * Menjalankan PHP Server + Dual Public Tunnel (localhost.run & localtunnel)
 * Melakukan Smoke Test dan Pengambilan Screenshot Desktop & Mobile.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LOCAL_PORT = 8820;

console.log('======================================================================');
console.log('🚀 PELUNCURAN STAGING / PREVIEW ONLINE TERPADU — KJPP NSR (BRANCH DEV)');
console.log('======================================================================');

// 1. Inisialisasi Database Demo
console.log('\n[1/5] Mempersiapkan Database Demo & Akun Pengujian...');
await import('./seed-preview-database.mjs');

// 2. Jalankan Server PHP Lokal Port 8820 dengan router.php
console.log('\n[2/5] Menjalankan Server PHP Lokal Port ' + LOCAL_PORT + ' dengan router.php...');
const phpProc = spawn('php', ['-S', `127.0.0.1:${LOCAL_PORT}`, '-t', ROOT_DIR, path.join(ROOT_DIR, 'router.php')], {
  env: { ...process.env, PHP_CLI_SERVER_WORKERS: '8' },
  stdio: 'ignore'
});
await new Promise(r => setTimeout(r, 1500));

// 3. Bangun Public Secure Tunnels
console.log('\n[3/5] Membangun Public Secure HTTPS Tunnels...');

// A. SSH Tunnel (localhost.run) -> Direct Access (Tanpa password IP)
console.log('  -> Menghubungkan SSH Direct TLS Tunnel (localhost.run)...');
const sshProc = spawn('ssh', [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'ServerAliveInterval=15',
  '-o', 'ServerAliveCountMax=6',
  '-R', `80:127.0.0.1:${LOCAL_PORT}`,
  'nokey@localhost.run'
]);

let directUrl = '';
const directUrlPromise = new Promise((resolve) => {
  const timeout = setTimeout(() => resolve(''), 25000);
  sshProc.stdout.on('data', (d) => {
    const s = d.toString();
    const m = s.match(/https:\/\/[a-z0-9-]+\.lhr\.life/i);
    if (m && !directUrl) {
      clearTimeout(timeout);
      directUrl = m[0];
      resolve(directUrl);
    }
  });
  sshProc.stderr.on('data', () => {});
});

// B. Localtunnel -> Custom Branded URL
console.log('  -> Menghubungkan Branded Localtunnel (kjpp-nsr-staging.loca.lt)...');
const ltProc = spawn('cmd.exe', ['/c', `npx.cmd --yes localtunnel --port ${LOCAL_PORT} --subdomain kjpp-nsr-staging`]);

let brandedUrl = '';
const brandedUrlPromise = new Promise((resolve) => {
  const timeout = setTimeout(() => resolve(''), 25000);
  ltProc.stdout.on('data', (d) => {
    const s = d.toString();
    const m = s.match(/https:\/\/[a-z0-9-]+\.loca\.lt/i);
    if (m && !brandedUrl) {
      clearTimeout(timeout);
      brandedUrl = m[0];
      resolve(brandedUrl);
    }
  });
  ltProc.stderr.on('data', () => {});
});

await Promise.all([directUrlPromise, brandedUrlPromise]);

const primaryUrl = directUrl || brandedUrl;
console.log('\n  ✔ DIRECT HTTPS PREVIEW URL : ' + (directUrl || 'Gagal tersambung'));
console.log('  ✔ BRANDED PREVIEW URL      : ' + (brandedUrl || 'Gagal tersambung') + ' (Password IP: 103.130.18.200)');

const serverInfo = {
  active: true,
  directUrl,
  brandedUrl,
  tunnelPasswordIp: '103.130.18.200',
  localPort: LOCAL_PORT,
  startedAt: new Date().toISOString(),
  endpoints: {
    home: directUrl + '/',
    operasional: directUrl + '/portal-operasional.html',
    kwitansi: directUrl + '/portal-kwitansi.html',
    verifikasi: directUrl + '/verifikasi-dokumen.html'
  }
};
fs.writeFileSync(path.join(ROOT_DIR, 'scripts', 'active-preview-url.json'), JSON.stringify(serverInfo, null, 2), 'utf8');

// 4. Jalankan Smoke Test Menyeluruh pada URL Live
console.log('\n[4/5] Menjalankan Smoke Test pada Public URL Live (' + primaryUrl + ')...');

async function testEndpoint(name, url, options = {}) {
  try {
    const opts = { ...options, headers: { ...(options.headers || {}), 'Connection': 'close' } };
    const res = await fetch(url, opts);
    const _body = await res.text();
    const ok = res.status >= 200 && res.status < 400;
    console.log(`  ${ok ? '✔' : '❌'} [${res.status}] ${name} -> ${url}`);
    return ok;
  } catch (err) {
    console.log(`  ❌ [FAIL] ${name} -> ${err.message}`);
    return false;
  }
}

const smokeResults = [
  await testEndpoint('Halaman Utama (Beranda & Navbar)', `${primaryUrl}/index.html`),
  await testEndpoint('Portal e-Operasional', `${primaryUrl}/portal-operasional.html`),
  await testEndpoint('Portal Kwitansi Dual Mode', `${primaryUrl}/portal-kwitansi.html`),
  await testEndpoint('Verifikasi Dokumen Publik', `${primaryUrl}/verifikasi-dokumen.html`),
  await testEndpoint('API e-Operasional (getPengajuanList)', `${primaryUrl}/operasional-data-handler.php?action=getPengajuanList`, {
    headers: { 'Authorization': 'Bearer NSR8899', 'X-Requested-With': 'XMLHttpRequest' }
  }),
  await testEndpoint('API Kwitansi Data Proxy (GET)', `${primaryUrl}/api/kwitansi-data-proxy`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-NSR-Token': 'NSR8899' }
  })
];

const allSmokePass = smokeResults.every(r => r === true);
console.log(`\n  Hasil Smoke Test: ${allSmokePass ? '100% LULUS (ALL PASS)' : 'SEBAGIAN GAGAL'}`);

// 5. Tangkap Screenshot Desktop & Mobile menggunakan Chrome Headless
console.log('\n[5/5] Mengambil Screenshot Tampilan Desktop & Mobile...');
const chromeDebugPort = 9487;
const chromeProc = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${chromeDebugPort}`,
  '--no-sandbox',
  '--window-size=1280,1024',
  'about:blank'
]);
await new Promise(r => setTimeout(r, 2000));

async function cdpSend(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

try {
  const targetRes = await fetch(`http://127.0.0.1:${chromeDebugPort}/json/new?about:blank`, { method: 'PUT' });
  const targetData = await targetRes.json();
  const ws = new WebSocket(targetData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  await cdpSend(ws, 'Page.enable');
  await cdpSend(ws, 'Runtime.enable');

  // A. Desktop: Portal e-Operasional (Form Input)
  console.log('  -> Mengambil Screenshot Desktop: Portal e-Operasional Form...');
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdpSend(ws, 'Page.navigate', { url: `http://127.0.0.1:${LOCAL_PORT}/portal-operasional.html` });
  await new Promise(r => setTimeout(r, 1500));
  await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      document.getElementById('input_token_auth').value = 'NSR8899';
      handleTokenLogin(new Event('submit'));
    `
  });
  await new Promise(r => setTimeout(r, 1200));
  const shotOprDesk = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_operasional_desktop.png'), Buffer.from(shotOprDesk.data, 'base64'));

  // B. Desktop: Portal e-Operasional (Tabel Riwayat 3 Dokumen Demo)
  console.log('  -> Mengambil Screenshot Desktop: Portal e-Operasional Riwayat...');
  await cdpSend(ws, 'Runtime.evaluate', {
    expression: `gantiTabUtama('riwayat');`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shotOprRiw = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_operasional_riwayat_desktop.png'), Buffer.from(shotOprRiw.data, 'base64'));

  // C. Mobile: Portal e-Operasional (iPhone 14)
  console.log('  -> Mengambil Screenshot Mobile: Portal e-Operasional...');
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdpSend(ws, 'Page.navigate', { url: `http://127.0.0.1:${LOCAL_PORT}/portal-operasional.html` });
  await new Promise(r => setTimeout(r, 1500));
  await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      document.getElementById('input_token_auth').value = 'NSR8899';
      handleTokenLogin(new Event('submit'));
    `
  });
  await new Promise(r => setTimeout(r, 1200));
  const shotOprMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_operasional_mobile.png'), Buffer.from(shotOprMob.data, 'base64'));

  // D. Desktop: Kwitansi Mode Cabang Palembang (Kasbon Mandiri)
  console.log('  -> Mengambil Screenshot Desktop: Kwitansi Mode Cabang Palembang...');
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdpSend(ws, 'Page.navigate', { url: `http://127.0.0.1:${LOCAL_PORT}/portal-kwitansi.html` });
  await new Promise(r => setTimeout(r, 1500));
  await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      const u = document.getElementById('kwitansi-auth-username');
      if (u) {
        u.value = 'NSR-PLB-2026';
        masukSesiKwitansi();
      }
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const shotKwCab = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_kwitansi_mode_cabang_desktop.png'), Buffer.from(shotKwCab.data, 'base64'));

  // E. Desktop: Kwitansi Antrean Verifikasi Pusat (Akun Keuangan)
  console.log('  -> Mengambil Screenshot Desktop: Kwitansi Antrean Verifikasi Pusat...');
  await cdpSend(ws, 'Page.navigate', { url: `http://127.0.0.1:${LOCAL_PORT}/portal-kwitansi.html` });
  await new Promise(r => setTimeout(r, 1500));
  await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      const u = document.getElementById('kwitansi-auth-username');
      if (u) {
        u.value = 'NSR-KEU-2026';
        masukSesiKwitansi();
      }
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      const tabBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Verifikasi & Pengesahan'));
      if (tabBtn) tabBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 1200));
  const shotKwPst = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_kwitansi_antrean_pusat_desktop.png'), Buffer.from(shotKwPst.data, 'base64'));

  // F. Mobile: Kwitansi Mobile
  console.log('  -> Mengambil Screenshot Mobile: Kwitansi...');
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdpSend(ws, 'Page.navigate', { url: `http://127.0.0.1:${LOCAL_PORT}/portal-kwitansi.html` });
  await new Promise(r => setTimeout(r, 1500));
  await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      const u = document.getElementById('kwitansi-auth-username');
      if (u) {
        u.value = 'NSR-PLB-2026';
        masukSesiKwitansi();
      }
    `
  });
  await new Promise(r => setTimeout(r, 1200));
  const shotKwMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_kwitansi_mobile.png'), Buffer.from(shotKwMob.data, 'base64'));

  // G. Verifikasi Dokumen Publik (Desktop & Mobile)
  console.log('  -> Mengambil Screenshot: Verifikasi Dokumen Publik...');
  const dataPath = path.join(ROOT_DIR, 'data', 'operasional_database.json');
  const docData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))[0];
  const tier5Hash = docData.approvals[5].hmacHash;
  const verifUrl = `http://127.0.0.1:${LOCAL_PORT}/verifikasi-dokumen.html?doc=${encodeURIComponent(docData.noRegistrasi)}&tier=5&hash=${encodeURIComponent(tier5Hash)}`;

  // Desktop Verifikasi
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdpSend(ws, 'Page.navigate', { url: verifUrl });
  await new Promise(r => setTimeout(r, 1800));
  const shotVerDesk = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_verifikasi_desktop.png'), Buffer.from(shotVerDesk.data, 'base64'));

  // Mobile Verifikasi
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdpSend(ws, 'Page.navigate', { url: verifUrl });
  await new Promise(r => setTimeout(r, 1800));
  const shotVerMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_verifikasi_mobile.png'), Buffer.from(shotVerMob.data, 'base64'));

  ws.close();
  console.log('✓ Seluruh tangkapan layar preview live berhasil diperbarui!');
} catch (e) {
  console.error('Screenshot notice:', e.message);
} finally {
  chromeProc.kill();
}

console.log('\n======================================================================');
console.log('🎉 PREVIEW ONLINE SIAP & BERJALAN AKTIF DI LATAR BELAKANG!');
console.log('🔗 DIRECT PREVIEW URL    : ' + directUrl);
console.log('🔗 BRANDED PREVIEW URL   : ' + brandedUrl + ' (Password IP: 103.130.18.200)');
console.log('======================================================================\n');
console.log('Service akan tetap aktif melayani request secara berkelanjutan...');

// Keep process alive indefinitely
setInterval(() => {}, 60000);
