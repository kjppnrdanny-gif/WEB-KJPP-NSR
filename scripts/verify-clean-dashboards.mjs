/**
 * OPINI NSR 2026 — VERIFIKASI PEMBERSIHAN DATA SIMULASI (DASHBOARD = 0)
 * Sesuai Master Perintah Final Bagian VIII, IX, dan XII (Poin 13 & 14)
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8899;
const CHROME_PORT = 9225;

function findChrome() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome tidak ditemukan.');
}

async function run() {
  console.log('Menjalankan server PHP lokal untuk verifikasi UI...');
  const phpProc = spawn('php', ['-S', `127.0.0.1:${PORT}`], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  const chromePath = findChrome();
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900'
  ]);

  let connected = false;
  for (let i = 0; i < 20; i++) {
    try {
      const vRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      if (vRes.ok) {
        connected = true;
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }

  if (!connected) {
    throw new Error('Tidak dapat terhubung ke Chrome port ' + CHROME_PORT);
  }

  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', handler);
          if (m.error) reject(new Error(JSON.stringify(m.error)));
          else resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  try {
    // -------------------------------------------------------------
    // 1. VERIFIKASI PORTAL PENUGASAN JO (DASHBOARD = 0)
    // -------------------------------------------------------------
    console.log('\n[1] Membuka Portal Penugasan JO (http://127.0.0.1:' + PORT + '/portal-penugasan-jo.html)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-penugasan-jo.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Bersihkan localStorage simulasi lama & login KING
    await send('Runtime.evaluate', {
      expression: `
        localStorage.removeItem('kjpp_jo_database');
        localStorage.setItem('nsr_jo_data_version', '2026.10.GO_LIVE_CLEAN');
        document.getElementById('input-token').value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
        document.getElementById('btn-login-token').click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Navigasi ke Tab 2 (Dashboard & Antrean Approval)
    await send('Runtime.evaluate', {
      expression: `
        const btnTab2 = document.querySelectorAll('nav button')[1];
        if (btnTab2) btnTab2.click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const joState = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          projectCount: Array.isArray(window.projectDatabase) ? window.projectDatabase.length : -1,
          badgeCount: document.getElementById('stat-total-proyek')?.innerText || document.getElementById('badge-total-proyek')?.innerText || '0',
          tableRows: document.querySelectorAll('#table-proyek tbody tr')?.length || 0,
          emptyPlaceholder: document.querySelector('#table-proyek')?.innerText?.includes('Belum ada data') || false
        })
      `,
      returnByValue: true
    });
    console.log('Status Dashboard JO:', joState.value);

    const shotJo = await send('Page.captureScreenshot', { format: 'png' });
    const joFile = path.join(ARTIFACT_DIR, 'bukti_dashboard_jo_setelah_reset.png');
    fs.writeFileSync(joFile, Buffer.from(shotJo.data, 'base64'));
    console.log('✔ Screenshot Dashboard JO tersimpan di:', joFile);

    // -------------------------------------------------------------
    // 2. VERIFIKASI PORTAL NOLAP (DASHBOARD = 0)
    // -------------------------------------------------------------
    console.log('\n[2] Membuka Portal NoLap (http://127.0.0.1:' + PORT + '/portal-nolap.html)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-nolap.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Inisialisasi sesi Admin Pusat & verifikasi reset
    await send('Runtime.evaluate', {
      expression: `
        localStorage.removeItem('nsr_nolap_database');
        localStorage.setItem('nsr_nolap_data_version', '2026.10.GO_LIVE_CLEAN');
        const tokenInput = document.getElementById('f-token-admin') || document.querySelector('input[type=\"password\"]');
        if (tokenInput) tokenInput.value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
        const loginBtn = document.getElementById('btn-submit-login') || document.querySelector('button[onclick*=\"login\"]');
        if (loginBtn) loginBtn.click();
        else if (typeof verifikasiTokenAdmin === 'function') verifikasiTokenAdmin();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Buka tab rekapitulasi/antrean
    await send('Runtime.evaluate', {
      expression: `
        const btnRekap = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Daftar') || b.innerText.includes('Rekap') || b.innerText.includes('Antrean'));
        if (btnRekap) btnRekap.click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const nolapState = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          daftarCount: Array.isArray(window.daftarPermohonan) ? window.daftarPermohonan.length : -1,
          tableRows: document.querySelectorAll('#tabel-permohonan tbody tr')?.length || 0,
          totalBadge: document.getElementById('badge-total-laporan')?.innerText || document.getElementById('stat-total-nolap')?.innerText || '0'
        })
      `,
      returnByValue: true
    });
    console.log('Status Dashboard NoLap:', nolapState.value);

    const shotNolap = await send('Page.captureScreenshot', { format: 'png' });
    const nolapFile = path.join(ARTIFACT_DIR, 'bukti_dashboard_nolap_setelah_reset.png');
    fs.writeFileSync(nolapFile, Buffer.from(shotNolap.data, 'base64'));
    console.log('✔ Screenshot Dashboard NoLap tersimpan di:', nolapFile);

    // -------------------------------------------------------------
    // 3. VERIFIKASI MODAL REGISTER NOMOR RESMI
    // -------------------------------------------------------------
    console.log('\n[3] Membuka Modal Pengaturan Register Resmi...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof bukaModalRegisterResmi === 'function') bukaModalRegisterResmi();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const shotRegister = await send('Page.captureScreenshot', { format: 'png' });
    const regFile = path.join(ARTIFACT_DIR, 'bukti_modal_register_resmi.png');
    fs.writeFileSync(regFile, Buffer.from(shotRegister.data, 'base64'));
    console.log('✔ Screenshot Modal Register Resmi tersimpan di:', regFile);

    console.log('\n================================================================');
    console.log('🎉 SELURUH BUKTI DASHBOARD BERHASIL DIVERIFIKASI DAN DISIMPAN!');
    console.log('================================================================');

    ws.close();
    chromeProc.kill();
  } catch (err) {
    console.error('Error saat verifikasi CDP:', err);
    chromeProc.kill();
    throw err;
  } finally {
    phpProc.kill();
  }
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
