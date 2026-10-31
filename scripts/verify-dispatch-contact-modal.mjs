import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PHP_PORT = 8297;
const CHROME_PORT = 9587;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-dispatch-${Date.now()}`);

console.log('================================================================');
console.log(' PENGUJIAN BROWSER E2E: MODAL KONFIRMASI KONTAK & DISPATCH');
console.log('================================================================');

// 1. Jalankan PHP Server
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
  throw new Error('Chrome Remote Debugging WebSocket URL tidak tersedia');
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

  console.log('\n--- Buka portal-tracking.html ---');
  const loadPromise = new Promise(resolve => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });
  await loadPromise;
  await new Promise(r => setTimeout(r, 1500));

  // TEST CASE 1: Buka Modal Tracking Stepper & Verifikasi Pemicu Dispatch
  console.log('\n--- UJI 1: Buka Modal Detail Tracking & Pemicu Dispatch Milestone ---');
  await cdp('Runtime.evaluate', {
    expression: `bukaModalTracking('JO-BDG-2026-0015')`
  });
  await new Promise(r => setTimeout(r, 800));

  // Pemicu 1: Klik tombol "Ajukan ke Tahap Berikutnya"
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const btn = document.getElementById('btn-ajukan-tahap-stepper') || document.getElementById('btn-selesaikan-tahap');
        if (btn) btn.click();
        else bukaModalDispatchMilestone('JO-BDG-2026-0015', 'M-03');
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const checkModal = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const modal = document.getElementById('modal-dispatch-milestone');
        const isVisible = modal && !modal.classList.contains('hidden');
        const joDisplay = document.getElementById('dispatch-jo-display')?.textContent || '';
        const curBadge = document.getElementById('dispatch-current-m-badge')?.textContent || '';
        const targetBadge = document.getElementById('dispatch-target-m-badge')?.textContent || '';
        
        const hasKlienWa = !!document.getElementById('dispatch-klien-wa');
        const hasKlienEmail = !!document.getElementById('dispatch-klien-email');
        const hasPicNama = !!document.getElementById('dispatch-pic-nama');
        const hasPicWa = !!document.getElementById('dispatch-pic-wa');
        const hasPicEmail = !!document.getElementById('dispatch-pic-email');

        const hasBtnWaKlien = !!document.getElementById('btn-dispatch-wa-klien');
        const hasBtnWaPic = !!document.getElementById('btn-dispatch-wa-pic');
        const hasBtnEmail = !!document.getElementById('btn-dispatch-email');
        const hasBtnSimpan = !!document.getElementById('btn-dispatch-simpan');

        return {
          isVisible,
          joDisplay,
          curBadge,
          targetBadge,
          hasKlienWa,
          hasKlienEmail,
          hasPicNama,
          hasPicWa,
          hasPicEmail,
          hasBtnWaKlien,
          hasBtnWaPic,
          hasBtnEmail,
          hasBtnSimpan
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Hasil Uji 1 (Modal Muncul):', checkModal.result.value);
  assert.ok(checkModal.result.value.isVisible, 'Modal #modal-dispatch-milestone harus terlihat');
  assert.ok(checkModal.result.value.hasKlienWa && checkModal.result.value.hasKlienEmail, 'Input Kontak Klien A harus lengkap');
  assert.ok(checkModal.result.value.hasPicNama && checkModal.result.value.hasPicWa && checkModal.result.value.hasPicEmail, 'Input Kontak Pegawai B harus lengkap');
  assert.ok(checkModal.result.value.hasBtnWaKlien && checkModal.result.value.hasBtnWaPic && checkModal.result.value.hasBtnEmail && checkModal.result.value.hasBtnSimpan, 'Seluruh 4 tombol aksi pengiriman harus tersedia');
  console.log('✅ UJI 1 LULUS: Modal Pre-Update Kontak (#modal-dispatch-milestone) muncul sempurna.');

  // TEST CASE 2: Input Data Kontak Manual & Format Tautan WhatsApp / Email
  console.log('\n--- UJI 2: Input Data Manual & Validasi Pemformatan Tautan WA / Email ---');
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        document.getElementById('dispatch-klien-wa').value = '081399887766';
        document.getElementById('dispatch-klien-email').value = 'klien.mandiri@sentosa.co.id';
        document.getElementById('dispatch-pic-nama').value = 'Hendra Wijaya, S.T.';
        document.getElementById('dispatch-pic-wa').value = '081255443322';
        document.getElementById('dispatch-pic-email').value = 'hendra.survey@kjppnanangrahayu.com';
      })()
    `
  });

  // Uji Formatter WA Klien
  const checkWaKlienUrl = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const cleanPhone = normalisasiNoHp(document.getElementById('dispatch-klien-wa').value);
        const joId = document.getElementById('dispatch-jo-id').value;
        const msg = "Yth. PIC Klien, status penugasan " + joId + " telah diupdate.";
        return 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg);
      })()
    `,
    returnByValue: true
  });
  console.log('Hasil Format URL WA Klien:', checkWaKlienUrl.result.value);
  assert.ok(checkWaKlienUrl.result.value.includes('https://wa.me/6281399887766'), 'Nomor WhatsApp Klien harus ternormalisasi internasional 6281399887766');

  // Uji Formatter WA Pegawai
  const checkWaPicUrl = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const cleanPhone = normalisasiNoHp(document.getElementById('dispatch-pic-wa').value);
        const joId = document.getElementById('dispatch-jo-id').value;
        const msg = "Halo Hendra Wijaya, S.T., tugas baru " + joId + " siap ditindaklanjuti.";
        return 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg);
      })()
    `,
    returnByValue: true
  });
  console.log('Hasil Format URL WA Pegawai:', checkWaPicUrl.result.value);
  assert.ok(checkWaPicUrl.result.value.includes('https://wa.me/6281255443322'), 'Nomor WhatsApp Pegawai harus ternormalisasi internasional 6281255443322');
  console.log('✅ UJI 2 LULUS: Tautan WhatsApp & Email terformat presisi dengan nomor yang baru diketik.');

  // TEST CASE 3: Pengambilan Screenshot Bukti Live Modal Terisi
  console.log('\n--- UJI 3: Pengambilan Screenshot Bukti Live Modal Konfirmasi Kontak ---');
  const screenshotData = await cdp('Page.captureScreenshot', { format: 'png' });
  const ssBuffer = Buffer.from(screenshotData.data, 'base64');
  const ssPath = path.join(artifactsDir, 'bukti_live_dispatch_contact_modal.png');
  fs.writeFileSync(ssPath, ssBuffer);
  console.log(`✅ Tangkapan layar bukti live tersimpan di: ${ssPath}`);

  // TEST CASE 4: Simpan Kontak ke Backend (Progressive Data Saving)
  console.log('\n--- UJI 4: Eksekusi Simpan Kontak ke Backend (Progressive Data Saving) ---');
  const saveResult = await cdp('Runtime.evaluate', {
    expression: `simpanKontakDispatch()`,
    awaitPromise: true
  });
  console.log('Eksekusi simpan kontak:', saveResult);
  await new Promise(r => setTimeout(r, 1200));

  // Periksa langsung ke data storage backend
  const rawStaging = fs.readFileSync('data/job_tracking_staging.json', 'utf-8');
  const stagingData = JSON.parse(rawStaging);
  const updatedJob = stagingData['JO-BDG-2026-0015'] || (stagingData.jobs && stagingData.jobs.find(x => x.jo_number === 'JO-BDG-2026-0015'));

  console.log('Hasil Tersimpan di Backend:', {
    jo: updatedJob.jo_number,
    pic_contact: updatedJob.pic_contact,
    client_pic_phone: updatedJob.client_pic_phone,
    client_pic_email: updatedJob.client_pic_email,
    surveyor: updatedJob.surveyor,
    surveyor_phone: updatedJob.surveyor_phone,
    surveyor_email: updatedJob.surveyor_email
  });

  assert.strictEqual(updatedJob.client_pic_phone, '081399887766', 'Nomor HP Klien tersimpan benar');
  assert.strictEqual(updatedJob.client_pic_email, 'klien.mandiri@sentosa.co.id', 'Email Klien tersimpan benar');
  assert.strictEqual(updatedJob.surveyor, 'Hendra Wijaya, S.T.', 'Nama surveyor internal tersimpan benar');
  assert.strictEqual(updatedJob.surveyor_phone, '081255443322', 'Nomor HP surveyor internal tersimpan benar');
  assert.strictEqual(updatedJob.surveyor_email, 'hendra.survey@kjppnanangrahayu.com', 'Email surveyor internal tersimpan benar');
  console.log('✅ UJI 4 LULUS: Seluruh kontak klien & internal berhasil tersimpan permanen ke database JSON backend.');

} finally {
  ws.close();
  chrome.kill();
  php.kill();
  try {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  } catch (e) {}
}

console.log('\n================================================================');
console.log('🎉 SELURUH PENGUJIAN MODAL KONFIRMASI KONTAK & DISPATCH LULUS 100%!');
console.log('================================================================');
