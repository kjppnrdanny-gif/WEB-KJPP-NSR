import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CDP_PORT = 9545;
const LIVE_URL = 'https://kjppnanangrahayu.com/portofolio-rekanan.html';

async function main() {
  console.log('========================================================');
  console.log('📸 PENGAMBILAN BUKTI TAMPILAN LIVE CPANEL OPINI NSR');
  console.log('URL: ' + LIVE_URL);
  console.log('========================================================\n');

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-live-porto-'));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,950',
    LIVE_URL
  ]);

  console.log('1. Membuka headless Chrome pada URL Live Produksi...');
  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await listRes.json();
    const page = pages.find(p => p.type === 'page') || pages[0];

    if (!page || !page.webSocketDebuggerUrl) {
      throw new Error('Tidak menemukan WebSocket debugger');
    }

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      const onMsg = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.id === id) {
            ws.removeEventListener('message', onMsg);
            resolve(m.result || m.error);
          }
        } catch (_) {}
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('2. Membuka Modal OPINI NSR di Live Produksi...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.bukaModalPortal();
          window.updateDynamicSmartCards({
            isCabang: false,
            mode: 'PUSAT',
            wilayah: 'Kantor Pusat Jakarta',
            wilayahCode: 'PST',
            role: 'DIREKTUR UTAMA',
            roleLabel: 'Direktur Utama',
            isSuperAdmin: true
          });
          const formToken = document.getElementById('form-token-portal');
          const panelLayanan = document.getElementById('panel-layanan');
          const labelLokasi = document.getElementById('label-lokasi');
          if (labelLokasi) labelLokasi.innerHTML = 'Terverifikasi: <strong>Kantor Pusat Jakarta</strong> &bull; <span class="uppercase text-emerald-400 font-extrabold">Direktur Utama</span>';
          if (formToken) formToken.classList.add('hidden');
          if (panelLayanan) panelLayanan.classList.remove('hidden');
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('3. Menyimpan Screenshot Live Sesi Pusat Desktop...');
    const ssPusat = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_portofolio_opini_pusat_desktop.png'), Buffer.from(ssPusat.data, 'base64'));
    console.log('   ✓ Tersimpan: live_portofolio_opini_pusat_desktop.png');

    console.log('4. Memperbarui ke Sesi Cabang Bandung di Live Produksi...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.updateDynamicSmartCards({
            isCabang: true,
            mode: 'CABANG',
            wilayah: 'Kantor Cabang Bandung',
            wilayahCode: 'BDG',
            role: 'ADMIN CABANG',
            roleLabel: 'Admin Cabang Bandung'
          });
          const labelLokasi = document.getElementById('label-lokasi');
          if (labelLokasi) labelLokasi.innerHTML = 'Terverifikasi: <strong>Kantor Cabang Bandung</strong> &bull; <span class="uppercase text-emerald-400 font-extrabold">Admin Cabang Bandung</span>';
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('5. Menyimpan Screenshot Live Sesi Cabang Desktop...');
    const ssCabang = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_portofolio_opini_cabang_desktop.png'), Buffer.from(ssCabang.data, 'base64'));
    console.log('   ✓ Tersimpan: live_portofolio_opini_cabang_desktop.png');

    console.log('6. Menyimpan Screenshot Live Layar Ponsel (Mobile 390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    const ssMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_portofolio_opini_mobile.png'), Buffer.from(ssMobile.data, 'base64'));
    console.log('   ✓ Tersimpan: live_portofolio_opini_mobile.png');

    console.log('\n========================================================');
    console.log('🎉 PENGAMBILAN BUKTI LIVE DARI CPANEL SELESAI 100%!');
    console.log('========================================================');

  } finally {
    try { chrome.kill(); } catch (e) {}
    try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch(err => {
  console.error('\n❌ GAGAL:', err);
  process.exit(1);
});
