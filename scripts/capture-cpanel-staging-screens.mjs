/**
 * SCRIPT: capture-cpanel-staging-screens.mjs
 * Menangkap tangkapan layar langsung dari hosting staging cPanel live:
 * https://kjppnanangrahayu.com/staging/
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9223;
const BASE_URL = 'https://kjppnanangrahayu.com/staging';

async function getWsUrl(port) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 600));
  }
  throw new Error('CDP not reachable');
}

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

async function main() {
  console.log('Mengambil screenshot staging cPanel live...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1280,900'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    await cdpSend(ws, 'Page.enable');
    await cdpSend(ws, 'Network.enable');

    // 1. Desktop: Portal e-Operasional Form
    console.log('1. Desktop e-Operasional...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdpSend(ws, 'Page.navigate', { url: `${BASE_URL}/portal-operasional.html` });
    await new Promise(r => setTimeout(r, 2000));
    // Login otomatis
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const tok = document.getElementById('input_token_auth');
        if (tok) {
          tok.value = 'NSR-STAGE-MASTER-77';
          handleTokenLogin(new Event('submit'));
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shotOprDesk = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_operasional_desktop.png'), Buffer.from(shotOprDesk.data, 'base64'));

    // 2. Desktop: Portal e-Operasional Riwayat
    console.log('2. Desktop e-Operasional Riwayat...');
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const tabs = Array.from(document.querySelectorAll('button'));
        const riwTab = tabs.find(b => b.innerText.includes('Riwayat Pengajuan'));
        if (riwTab) riwTab.click();
      `
    });
    await new Promise(r => setTimeout(r, 1200));
    const shotOprRiw = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_operasional_riwayat_desktop.png'), Buffer.from(shotOprRiw.data, 'base64'));

    // 3. Mobile: Portal e-Operasional
    console.log('3. Mobile e-Operasional...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdpSend(ws, 'Page.navigate', { url: `${BASE_URL}/portal-operasional.html` });
    await new Promise(r => setTimeout(r, 2000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const tok = document.getElementById('input_token_auth');
        if (tok) {
          tok.value = 'NSR-STAGE-MASTER-77';
          handleTokenLogin(new Event('submit'));
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shotOprMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_operasional_mobile.png'), Buffer.from(shotOprMob.data, 'base64'));

    // 4. Desktop: Portal Kwitansi Mode Cabang (Palembang)
    console.log('4. Desktop Kwitansi...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdpSend(ws, 'Page.navigate', { url: `${BASE_URL}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 2000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const u = document.getElementById('kwitansi-auth-username');
        if (u) {
          u.value = 'NSR-STAGE-PLB-03';
          masukSesiKwitansi();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shotKwDesk = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_kwitansi_desktop.png'), Buffer.from(shotKwDesk.data, 'base64'));

    // 5. Mobile: Portal Kwitansi
    console.log('5. Mobile Kwitansi...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdpSend(ws, 'Page.navigate', { url: `${BASE_URL}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 2000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const u = document.getElementById('kwitansi-auth-username');
        if (u) {
          u.value = 'NSR-STAGE-PLB-03';
          masukSesiKwitansi();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shotKwMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_kwitansi_mobile.png'), Buffer.from(shotKwMob.data, 'base64'));

    // 6. Verifikasi Dokumen Publik (Valid Tier 5 QR)
    console.log('6. Verifikasi Dokumen Publik QR Valid...');
    const verifUrl = `${BASE_URL}/verifikasi-dokumen.html?doc=OPR-MTG%2F2.19.0160-03%2FX%2F2026%2F0002&tier=5&hash=e3f889e3f2bde8abf56f29dd55179e2266c56fc4e26bf3905662f3f7243222d2`;
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdpSend(ws, 'Page.navigate', { url: verifUrl });
    await new Promise(r => setTimeout(r, 2000));
    const shotVerDesk = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_verifikasi_desktop.png'), Buffer.from(shotVerDesk.data, 'base64'));

    // 7. Mobile Verifikasi Dokumen Publik
    console.log('7. Mobile Verifikasi Dokumen Publik...');
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdpSend(ws, 'Page.navigate', { url: verifUrl });
    await new Promise(r => setTimeout(r, 2000));
    const shotVerMob = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_verifikasi_mobile.png'), Buffer.from(shotVerMob.data, 'base64'));

    ws.close();
    console.log('✓ Seluruh tangkapan layar live cPanel staging berhasil disimpan!');
  } finally {
    chromeProc.kill();
  }
}

main().catch(console.error);
