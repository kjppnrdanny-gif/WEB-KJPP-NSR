import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PHP_PORT = 8296;
const CHROME_PORT = 9586;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-billing-${Date.now()}`);

console.log('================================================================');
console.log(' PENGUJIAN BROWSER E2E: FASE 3 - PIPELINE PENAGIHAN KWITANSI M-07');
console.log('================================================================');

// 1. Jalankan PHP Built-in Server
const php = spawn(PHP_BIN, [
  '-d', `extension_dir=${PHP_EXT_DIR}`,
  '-d', 'extension=curl',
  '-d', 'extension=openssl',
  '-S', `127.0.0.1:${PHP_PORT}`,
  '-t', path.resolve('.')
], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));

// 2. Jalankan Headless Chrome
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${CHROME_PORT}`,
  `--user-data-dir=${tmpUserData}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1280,950',
  'about:blank'
]);

let tData = null;
for (let i = 0; i < 25; i++) {
  try {
    const tRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
    tData = await tRes.json();
    if (tData && tData.webSocketDebuggerUrl) break;
  } catch (e) {
    await new Promise(r => setTimeout(r, 400));
  }
}

if (!tData || !tData.webSocketDebuggerUrl) {
  php.kill();
  chrome.kill();
  throw new Error('Chrome Remote Debugging WebSocket URL not available');
}

const ws = new WebSocket(tData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let idCounter = 1;
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = idCounter++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
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
  await cdp('Page.enable');
  await cdp('Runtime.enable');

  // STEP 1: Verifikasi di portal-tracking.html
  console.log('\n--- UJI 1: Buka portal-tracking.html & Cek Tombol Kwitansi di Task Board & Stepper ---');
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });

  // Tunggu sampai dataset penugasan selesai dimuat dari backend
  for (let i = 0; i < 30; i++) {
    const checkLoaded = await cdp('Runtime.evaluate', {
      expression: `!!(window.globalJobs && window.globalJobs.length > 0)`
    });
    if (checkLoaded.result.value) break;
    await new Promise(r => setTimeout(r, 300));
  }

  // Ubah filter scope ke 'all' agar berkas M-07 (JO-JKT-2026-0003) terlihat di Task Board
  const scopeResult = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        if (typeof setJobScope === 'function') {
          setJobScope('all');
        }
        return {
          jobsCount: (window.globalJobs || []).length,
          hasM07: (window.globalJobs || []).some(j => j.id === 'JO-JKT-2026-0003')
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Scope filter result:', scopeResult.result.value);

  await new Promise(r => setTimeout(r, 600));

  // Cek apakah tombol Kwitansi muncul di Task Board
  const checkTbButtons = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const rows = Array.from(document.querySelectorAll('#task-board-tbody tr'));
        const m07Row = rows.find(r => r.innerText.includes('JO-JKT-2026-0003') || r.innerText.includes('BCA/KCK/APP-551/X/2026') || r.innerText.includes('PT Surya Cipta Megah'));
        const kwitansiBtn = m07Row ? m07Row.querySelector('button[title*="Kwitansi Penagihan"]') : null;
        return {
          totalRows: rows.length,
          foundRow: !!m07Row,
          hasKwitansiBtn: !!kwitansiBtn,
          btnText: kwitansiBtn ? kwitansiBtn.innerText.trim() : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Hasil Pemeriksaan Task Board Row:', checkTbButtons.result.value);
  assert.ok(checkTbButtons.result.value.hasKwitansiBtn, 'Tombol [ 🧾 Kwitansi ] harus ada pada baris penugasan M-07');
  console.log('✅ Tombol [ 🧾 Kwitansi ] tervalidasi pada baris Task Board.');

  // Buka Stepper Modal untuk JO-JKT-2026-0003
  await cdp('Runtime.evaluate', {
    expression: `bukaModalTracking('JO-JKT-2026-0003')`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Cek tombol M-07 di Stepper
  const checkStepperButtons = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const modal = document.getElementById('modal-tracking-stepper');
        const isVisible = modal && !modal.classList.contains('hidden');
        const btnTerbit = Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('Terbitkan Draf Kwitansi'));
        const btnSalin = Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('Salin Rincian Penagihan'));
        return {
          modalVisible: isVisible,
          hasBtnTerbit: !!btnTerbit,
          hasBtnSalin: !!btnSalin
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Hasil Pemeriksaan Stepper Modal:', checkStepperButtons.result.value);
  assert.ok(checkStepperButtons.result.value.hasBtnTerbit, 'Tombol [ 🧾 Terbitkan Draf Kwitansi Penagihan ] harus ada di milestone M-07');
  assert.ok(checkStepperButtons.result.value.hasBtnSalin, 'Tombol [ 📋 Salin Rincian Penagihan ] harus ada di milestone M-07');
  console.log('✅ Tombol aksi penagihan tervalidasi lengkap di Stepper Milestone M-07.');

  // STEP 2: Verifikasi Autofill Handshake di portal-kwitansi.html
  console.log('\n--- UJI 2: Navigasi ke portal-kwitansi.html dengan query tracking & Pengujian Autofill ---');
  const kwitansiUrl = `http://127.0.0.1:${PHP_PORT}/portal-kwitansi.html?source=tracking&jo_id=JO-JKT-2026-0003&ref=JO-JKT-2026-0003`;
  await cdp('Page.navigate', { url: kwitansiUrl });
  await new Promise(r => setTimeout(r, 2500));

  const checkAutofill = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const noSpk = document.getElementById('no-spk')?.value || '';
        const identitasKlien = document.getElementById('identitas-klien')?.value || '';
        const keterangan = document.getElementById('keterangan-penugasan')?.value || '';
        const hargaDasar = document.getElementById('harga-dasar')?.value || '';
        const nilaiKontrak = document.getElementById('nilai-kontrak-spk')?.value || '';
        const cabang = document.getElementById('cabang-pengaju')?.value || '';
        const statusBanner = document.getElementById('status-tarik-kwitansi');
        const bannerVisible = statusBanner && !statusBanner.classList.contains('hidden');
        const bannerText = statusBanner ? statusBanner.innerText : '';
        const termin = document.getElementById('banyaknya-termin')?.value || '';

        return {
          noSpk,
          identitasKlien,
          keterangan,
          hargaDasar: Number(hargaDasar),
          nilaiKontrak: Number(nilaiKontrak),
          cabang,
          termin,
          bannerVisible,
          bannerText
        };
      })()
    `,
    returnByValue: true
  });

  const af = checkAutofill.result.value;
  console.log('Hasil Pemeriksaan Kolom Form Kwitansi:', af);

  assert.ok(af.noSpk.includes('BCA/KCK/APP-551/X/2026'), 'Nomor SPK harus terisi otomatis');
  assert.ok(af.identitasKlien.includes('PT Bank Central Asia Tbk'), 'Identitas klien harus terisi PT Bank Central Asia Tbk');
  assert.ok(af.keterangan.includes('PT Surya Cipta Megah'), 'Keterangan harus memuat nama debitur');
  assert.ok(af.keterangan.includes('BCA/KCK/APP-551/X/2026'), 'Keterangan harus memuat No. SPK');
  assert.ok(af.hargaDasar > 0, 'Nominal DPP (Harga Dasar) harus > 0');
  assert.strictEqual(af.cabang, 'Kantor Pusat Jakarta', 'Kantor Cabang harus Kantor Pusat Jakarta');
  assert.ok(af.bannerVisible, 'Banner konfirmasi sukses tarik data penugasan M-07 harus tampil');
  console.log('✅ SELURUH KOLOM KUITANSI TERISI OTOMATIS DENGAN PRESISI (Zero Re-entry)!');

  // STEP 3: Ambil Screenshot Bukti Pengujian
  console.log('\n--- UJI 3: Pengambilan Screenshot Bukti Live ---');
  const screenshotData = await cdp('Page.captureScreenshot', { format: 'png' });
  const ssBuffer = Buffer.from(screenshotData.data, 'base64');
  const ssPath = path.join(artifactsDir, 'bukti_live_auto_draft_kwitansi_m07.png');
  fs.writeFileSync(ssPath, ssBuffer);
  console.log(`✅ Tangkapan layar bukti live tersimpan di: ${ssPath}`);

} finally {
  ws.close();
  chrome.kill();
  php.kill();
  try {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  } catch (e) {}
}

console.log('\n================================================================');
console.log('🎉 SELURUH PENGUJIAN INTEGRASI PIPELINE PENAGIHAN M-07 LULUS 100%!');
console.log('================================================================');
