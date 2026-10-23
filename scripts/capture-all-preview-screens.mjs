/**
 * SCRIPT: capture-all-preview-screens.mjs
 * Mengambil tangkapan layar komprehensif dari Staging Preview Online:
 * 1. e-Operasional Form & Riwayat Approval (Desktop & Mobile)
 * 2. Kwitansi Dual Mode: Mode Cabang Palembang & Mode Pusat Antrean (Desktop & Mobile)
 * 3. Halaman Publik Verifikasi Dokumen QR (Desktop & Mobile)
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

const serverInfo = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'scripts', 'active-preview-url.json'), 'utf8'));
const publicUrl = serverInfo.publicUrl;
console.log('Target Public Preview URL:', publicUrl);

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

async function run() {
  const chromePort = 9489;
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    '--no-sandbox',
    '--window-size=1280,1024',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${chromePort}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    await cdpSend(ws, 'Page.enable');
    await cdpSend(ws, 'Runtime.enable');

    // 1. e-Operasional Form Desktop
    console.log('1. Mengambil e-Operasional Form Desktop...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdpSend(ws, 'Page.navigate', { url: `${publicUrl}/portal-operasional.html` });
    await new Promise(r => setTimeout(r, 2000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        document.getElementById('input_token_auth').value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
        handleTokenLogin(new Event('submit'));
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shotOprForm = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_operasional_desktop.png'), Buffer.from(shotOprForm.data, 'base64'));

    // 2. e-Operasional Riwayat Desktop
    console.log('2. Mengambil e-Operasional Riwayat Desktop...');
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        gantiTabUtama('riwayat');
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shotOprRiw = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_operasional_riwayat_desktop.png'), Buffer.from(shotOprRiw.data, 'base64'));

    // 3. e-Operasional Mobile View (iPhone 14)
    console.log('3. Mengambil e-Operasional Mobile...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdpSend(ws, 'Page.navigate', { url: `${publicUrl}/portal-operasional.html` });
    await new Promise(r => setTimeout(r, 2000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        document.getElementById('input_token_auth').value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
        handleTokenLogin(new Event('submit'));
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shotOprMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_operasional_mobile.png'), Buffer.from(shotOprMob.data, 'base64'));

    // 4. Kwitansi Mode Cabang Palembang Desktop
    console.log('4. Mengambil Kwitansi Mode Cabang Palembang Desktop...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdpSend(ws, 'Page.navigate', { url: `${publicUrl}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 2000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const u = document.getElementById('kwitansi-auth-username');
        if (u) {
          u.value = 'NSR-PLB-2026';
          masukSesiKwitansi();
        }
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    const shotKwCab = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_kwitansi_mode_cabang_desktop.png'), Buffer.from(shotKwCab.data, 'base64'));

    // 5. Kwitansi Antrean Verifikasi Pusat Desktop
    console.log('5. Mengambil Kwitansi Antrean Verifikasi Pusat Desktop...');
    await cdpSend(ws, 'Page.navigate', { url: `${publicUrl}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 2000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const u = document.getElementById('kwitansi-auth-username');
        if (u) {
          u.value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
          masukSesiKwitansi();
        }
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const tabBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Verifikasi & Pengesahan'));
        if (tabBtn) tabBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shotKwPst = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_kwitansi_antrean_pusat_desktop.png'), Buffer.from(shotKwPst.data, 'base64'));

    // 6. Kwitansi Mobile
    console.log('6. Mengambil Kwitansi Mobile...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdpSend(ws, 'Page.navigate', { url: `${publicUrl}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 2000));
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
    const shotKwMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_kwitansi_mobile.png'), Buffer.from(shotKwMob.data, 'base64'));

    // 7. Verifikasi Dokumen Publik (Desktop & Mobile)
    console.log('7. Mengambil Verifikasi Dokumen Publik (Desktop & Mobile)...');
    const dbPath = path.join(ROOT_DIR, 'data', 'operasional_database.json');
    const docData = JSON.parse(fs.readFileSync(dbPath, 'utf8'))[0];
    const tier5Hash = docData.approvals[5].hmacHash;
    const verifUrl = `${publicUrl}/verifikasi-dokumen.html?doc=${encodeURIComponent(docData.noRegistrasi)}&tier=5&hash=${encodeURIComponent(tier5Hash)}`;

    // Desktop
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdpSend(ws, 'Page.navigate', { url: verifUrl });
    await new Promise(r => setTimeout(r, 2200));
    const shotVerifDesk = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_verifikasi_desktop.png'), Buffer.from(shotVerifDesk.data, 'base64'));

    // Mobile
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdpSend(ws, 'Page.navigate', { url: verifUrl });
    await new Promise(r => setTimeout(r, 2200));
    const shotVerifMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_live_verifikasi_mobile.png'), Buffer.from(shotVerifMob.data, 'base64'));

    ws.close();
    console.log('✓ Semua tangkapan layar preview live berhasil diperbarui!');
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
