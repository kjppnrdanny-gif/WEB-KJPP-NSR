import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_PORT = 8299;
const CHROME_PORT = 9583;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-drive-${Date.now()}`);

console.log('================================================================');
console.log('   PENGUJIAN BROWSER E2E: OTOMASI GOOGLE DRIVE PENUGASAN (M-01) ');
console.log('================================================================');

// 1. Jalankan PHP Built-in Server
const php = spawn('php', ['-S', `127.0.0.1:${PHP_PORT}`], { stdio: 'ignore' });
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
for (let i = 0; i < 20; i++) {
  try {
    const tRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
    tData = await tRes.json();
    if (tData && tData.webSocketDebuggerUrl) break;
  } catch (e) {
    await new Promise(r => setTimeout(r, 400));
  }
}

if (!tData || !tData.webSocketDebuggerUrl) {
  throw new Error('Chrome Remote Debugging WebSocket URL not available');
}

const ws = new WebSocket(tData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let idCounter = 1;
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = idCounter++;
    const listener = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === msgId) {
        ws.removeEventListener('message', listener);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', listener);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

async function evalJs(expr) {
  const res = await cdp('Runtime.evaluate', {
    expression: expr,
    awaitPromise: true,
    returnByValue: true
  });
  if (res.exceptionDetails) {
    throw new Error('JS Eval Exception: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result ? res.result.value : undefined;
}

try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');

  // Navigasi ke portal tracking dengan sesi Super Admin
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });
  await new Promise(r => setTimeout(r, 2000));

  // Inisialisasi sesi login Super Admin
  await evalJs(`
    sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
      token: 'NSR8899',
      role: 'SUPER ADMIN',
      isSuperAdmin: true,
      isCabang: false,
      wilayah: 'PUSAT',
      nik: 'NSR-2019-002',
      nama: 'Deni Siswandi'
    }));
    window.location.reload();
  `);
  await new Promise(r => setTimeout(r, 3000));

  const jobDebug = await evalJs(`
    ({
      jobsCount: globalJobs.length,
      firstJob: globalJobs[0] ? { jo: globalJobs[0].jo_number, drive: globalJobs[0].drive_folder_url, link: globalJobs[0].link_folder_drive } : null
    });
  `);
  console.log('DEBUG job info:', JSON.stringify(jobDebug));

  // 1. Verifikasi Tombol Drive di Task Board
  console.log('\n1. Memeriksa keberadaan tombol Drive di Task Board...');
  const driveBadgesCount = await evalJs(`
    document.querySelectorAll('a[title="Buka Folder Google Drive Penugasan"]').length;
  `);
  console.log(`[PASS] Ditemukan ${driveBadgesCount} tautan Google Drive pada tabel Task Board.`);
  assert.ok(driveBadgesCount > 0, 'Harus ada tautan Drive di Task Board');

  // 2. Buka Stepper Modal dengan penugasan yang memiliki drive_folder_url
  console.log('\n2. Membuka Stepper Modal penugasan...');
  await evalJs(`
    const targetJob = globalJobs.find(j => j.drive_folder_url || j.link_folder_drive) || globalJobs[0];
    bukaModalTracking(targetJob ? targetJob.id : null);
  `);
  await new Promise(r => setTimeout(r, 1000));

  const modalDriveInfo = await evalJs(`
    const btn = document.getElementById('btn-modal-drive');
    ({
      visible: btn && !btn.classList.contains('hidden'),
      href: btn ? btn.href : '',
      text: btn ? btn.textContent.trim() : ''
    });
  `);
  console.log(`[PASS] Tombol Drive di Modal Stepper aktif: "${modalDriveInfo.text}" -> ${modalDriveInfo.href}`);
  assert.ok(modalDriveInfo.visible, 'Tombol Drive di Modal Stepper harus terlihat');
  assert.ok(modalDriveInfo.href.includes('drive.google.com/drive/folders/'), 'Href harus mengarah ke Google Drive');

  // Screenshot Stepper Modal dengan Tombol Drive
  const ss1 = await cdp('Page.captureScreenshot', { format: 'png' });
  const shotPath1 = path.join(artifactsDir, 'bukti_live_drive_taskboard_dan_stepper.png');
  fs.writeFileSync(shotPath1, Buffer.from(ss1.data, 'base64'));
  console.log(`[PASS] Screenshot Stepper Modal tersimpan: ${shotPath1}`);

  // Tutup Modal Stepper
  await evalJs(`tutupModalTracking();`);
  await new Promise(r => setTimeout(r, 500));

  // 3. Uji Registrasi Penugasan Baru di Tab Form & Verifikasi Modal Konfirmasi
  console.log('\n3. Mengisi formulir registrasi penugasan baru (M-01)...');
  await evalJs(`
    switchTab('registrasi');
    document.getElementById('reg-kantor').value = 'Kantor Cabang Bandung';
    sesuaikanDropdownWilayah('Cabang Bandung');
    document.getElementById('reg-pemberi-tugas').value = 'PT Bank Mandiri (Persero) Tbk';
    document.getElementById('reg-pengguna-laporan').value = 'PT Bank Mandiri (Persero) Tbk - SME Bandung';
    document.getElementById('reg-spk-number').value = 'SPK/MDR-BDG/TEST-DRV/2026';
    document.getElementById('reg-spk-date').value = '2026-10-30';
    document.getElementById('reg-debitur').value = 'PT Citra Kencana Parahyangan';
    document.getElementById('reg-client-pic-name').value = 'Bambang Irawan';
    document.getElementById('reg-client-pic-phone').value = '081299887766';
    document.getElementById('reg-jenis-properti').value = 'Pabrik & Gudang Logistik';
    document.getElementById('reg-lokasi-aset').value = 'Kawasan Industri Gedebage Blok C No. 5, Bandung';
    document.getElementById('reg-surveyor').value = 'Ahmad Fauzi, S.T. (Bandung)';
    document.getElementById('reg-sla-days').value = '5 Hari Kerja';
  `);

  console.log('Mengirim formulir pendaftaran penugasan...');
  await evalJs(`
    const form = document.getElementById('form-registrasi-jo');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  `);
  await new Promise(r => setTimeout(r, 2500));

  // 4. Periksa Modal Konfirmasi Registrasi
  const confirmModalInfo = await evalJs(`
    const modal = document.getElementById('modal-konfirmasi-registrasi');
    const driveBtn = document.getElementById('confirm-drive-btn');
    const joNum = document.getElementById('confirm-jo-number');
    const trk = document.getElementById('confirm-kode-lacak');
    ({
      modalVisible: modal && !modal.classList.contains('hidden'),
      driveBtnVisible: driveBtn && !driveBtn.classList.contains('hidden'),
      driveHref: driveBtn ? driveBtn.href : '',
      joNumber: joNum ? joNum.textContent : '',
      kodeLacak: trk ? trk.textContent : ''
    });
  `);

  console.log('\n4. Verifikasi Modal Konfirmasi Registrasi:');
  console.log(`   - Modal Terbuka: ${confirmModalInfo.modalVisible}`);
  console.log(`   - Nomor JO: ${confirmModalInfo.joNumber}`);
  console.log(`   - Kode Lacak: ${confirmModalInfo.kodeLacak}`);
  console.log(`   - Tombol Buka Drive Aktif: ${confirmModalInfo.driveBtnVisible}`);
  console.log(`   - URL Folder Drive: ${confirmModalInfo.driveHref}`);

  assert.ok(confirmModalInfo.modalVisible, 'Modal konfirmasi harus terbuka');
  assert.ok(confirmModalInfo.driveBtnVisible, 'Tombol [ 📁 Buka Folder Drive Penugasan ] harus muncul');
  assert.ok(confirmModalInfo.driveHref.includes('drive.google.com/drive/folders/'), 'Tautan harus mengarah ke Google Drive folder');

  // Screenshot Modal Konfirmasi Registrasi dengan Tombol Drive
  const ss2 = await cdp('Page.captureScreenshot', { format: 'png' });
  const shotPath2 = path.join(artifactsDir, 'bukti_live_modal_konfirmasi_drive_m01.png');
  fs.writeFileSync(shotPath2, Buffer.from(ss2.data, 'base64'));
  console.log(`[PASS] Screenshot Modal Konfirmasi tersimpan: ${shotPath2}`);

  console.log('\n================================================================');
  console.log('🏆 PENGUJIAN BROWSER E2E OTOMASI DRIVE PENUGASAN LULUS 100%! 🏆');
  console.log('================================================================');
} finally {
  ws.close();
  chrome.kill();
  php.kill();
  try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch (_) {}
}
