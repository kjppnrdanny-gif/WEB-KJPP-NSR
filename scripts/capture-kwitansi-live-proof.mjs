import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9224;

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
  console.log('Menangkap screenshot cPanel staging live portal kwitansi...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1280,950'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    await cdpSend(ws, 'Page.enable');
    await cdpSend(ws, 'Network.enable');

    // 1. Buka portal kwitansi di staging
    console.log('Membuka https://kjppnanangrahayu.com/staging/portal-kwitansi.html ...');
    await cdpSend(ws, 'Page.navigate', { url: 'https://kjppnanangrahayu.com/staging/portal-kwitansi.html' });
    await new Promise(r => setTimeout(r, 2500));

    // 2. Login dengan token Keuangan Pusat NSR-KEU-2026
    console.log('Login dengan token NSR-KEU-2026...');
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        sessionStorage.clear();
        const input = document.getElementById('kwitansi-auth-username');
        if (input) input.value = 'NSR-KEU-2026';
        masukSesiKwitansi();
      `
    });
    await new Promise(r => setTimeout(r, 2500));

    // Tangkap screenshot Tab 2 Meja Verifikasi Keuangan Pusat
    console.log('Menangkap screenshot Meja Verifikasi Keuangan Pusat...');
    const shotPusat = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_kwitansi_pusat_approval.png'), Buffer.from(shotPusat.data, 'base64'));
    console.log('✓ cpanel_staging_kwitansi_pusat_approval.png tersimpan!');

    // 3. Login dengan token Cabang Bandung NSR-BDG-2026
    console.log('Login dengan token NSR-BDG-2026...');
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        sessionStorage.clear();
        keluarSesiKwitansi();
      `
    });
    await new Promise(r => setTimeout(r, 1000));
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const input = document.getElementById('kwitansi-auth-username');
        if (input) input.value = 'NSR-BDG-2026';
        masukSesiKwitansi();
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    // Tangkap screenshot Mode Cabang Pengajuan ke Pusat
    console.log('Menangkap screenshot Mode Cabang Pengajuan ke Pusat...');
    const shotCabang = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'cpanel_staging_kwitansi_cabang_pengajuan.png'), Buffer.from(shotCabang.data, 'base64'));
    console.log('✓ cpanel_staging_kwitansi_cabang_pengajuan.png tersimpan!');

    ws.close();
  } catch (err) {
    console.error('Error saat capture:', err);
  } finally {
    try { chromeProc.kill(); } catch (e) {}
  }
}

main();
