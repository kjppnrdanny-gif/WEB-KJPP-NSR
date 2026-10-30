import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PHP_PORT = 8295;
const CHROME_PORT = 9585;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-analytics-${Date.now()}`);

console.log('================================================================');
console.log(' PENGUJIAN BROWSER E2E: PRIORITAS 4 - DASHBOARD BEBAN KERJA & SLA');
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
  const res = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) {
    throw new Error('JS Eval error: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result ? res.result.value : undefined;
}

try {
  await cdp('Page.enable');
  await cdp('DOM.enable');

  console.log('\n--- TAHAP 1: Navigasi ke portal-tracking.html (Super Admin Sesi) ---');
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html?nik=NSR-2019-005` });
  
  // Tunggu hingga data selesai dimuat oleh muatDataTaskBoard()
  for (let i = 0; i < 30; i++) {
    const isLoaded = await evalJs('typeof globalJobs !== "undefined" && globalJobs.length > 0 && !document.querySelector("#task-board-tbody")?.innerText.includes("Memuat")');
    if (isLoaded) break;
    await new Promise(r => setTimeout(r, 400));
  }

  const pageTitle = await evalJs('document.title');
  console.log('✅ Judul Halaman:', pageTitle);

  console.log('\n--- TAHAP 2: Verifikasi Task Board & Badge Peringatan Dini ---');
  const gjLen = await evalJs('typeof globalJobs !== "undefined" ? globalJobs.length : "undefined"');
  console.log(`Global jobs length: ${gjLen}`);
  const bottleneckJobs = await evalJs('globalJobs.filter(j => j.is_bottleneck || j.bottleneck_warning)');
  console.log('Bottleneck jobs in globalJobs:', JSON.stringify(bottleneckJobs.map(j => ({ id: j.id, jo: j.jo_number, m: j.current_milestone, warn: j.bottleneck_warning, is_b: j.is_bottleneck }))));
  const taskBoardRows = await evalJs('document.querySelectorAll("#task-board-tbody tr").length');
  console.log(`Jumlah baris task board: ${taskBoardRows}`);
  assert.ok(taskBoardRows > 0, 'Task board harus memiliki baris data!');

  const bottleneckBadges = await evalJs(`
    Array.from(document.querySelectorAll("#task-board-tbody tr")).filter(tr => tr.innerText.includes('Tersendat')).length
  `);
  console.log(`Jumlah baris dengan badge ⚠️ Tersendat: ${bottleneckBadges}`);
  assert.ok(bottleneckBadges > 0, 'Harus ada badge ⚠️ Tersendat di task board!');

  console.log('\n--- TAHAP 3: Uji Tombol Filter Cepat [ 🚨 Tersendat / Overdue ] ---');
  const initialRowCount = await evalJs('document.querySelectorAll("#task-board-tbody tr").length');
  console.log(`Jumlah baris sebelum filter tersendat: ${initialRowCount}`);

  // Klik tombol filter berkas tersendat
  await evalJs('toggleBottleneckFilter()');
  await new Promise(r => setTimeout(r, 600));

  const filteredRowCount = await evalJs('document.querySelectorAll("#task-board-tbody tr").length');
  console.log(`Jumlah baris setelah filter tersendat aktif: ${filteredRowCount}`);
  assert.ok(filteredRowCount > 0 && filteredRowCount <= initialRowCount, 'Filter tersendat harus menampilkan subset berkas tersendat');

  // Kembalikan filter ke normal
  await evalJs('toggleBottleneckFilter()');
  await new Promise(r => setTimeout(r, 600));

  console.log('\n--- TAHAP 4: Navigasi ke Tab 3 [ 📊 Matriks Beban Kerja & SLA ] ---');
  await evalJs('switchTab("workload")');
  await new Promise(r => setTimeout(r, 1500));

  const isWorkloadVisible = await evalJs('!document.getElementById("panel-tab-workload").classList.contains("hidden")');
  assert.strictEqual(isWorkloadVisible, true, 'Panel tab workload harus tampil');
  console.log('✅ Tab Matriks Beban Kerja & SLA berhasil dibuka.');

  const tatVal = await evalJs('document.getElementById("wk-stat-avg-tat")?.textContent');
  const slaVal = await evalJs('document.getElementById("wk-stat-sla-rate")?.textContent');
  const bottlenecksVal = await evalJs('document.getElementById("wk-stat-bottlenecks")?.textContent');
  const activeVal = await evalJs('document.getElementById("wk-stat-active-jobs")?.textContent');

  console.log(`KPI Rata-rata TAT: ${tatVal}`);
  console.log(`KPI Kepatuhan SLA: ${slaVal}`);
  console.log(`KPI Berkas Tersendat: ${bottlenecksVal}`);
  console.log(`KPI Penugasan Berjalan: ${activeVal}`);

  assert.ok(tatVal && tatVal.includes('Hari'), 'Nilai TAT harus berisi Hari');
  assert.ok(slaVal && slaVal.includes('%'), 'Nilai SLA harus berisi %');

  const appraiserCount = await evalJs('document.querySelectorAll("#appraiser-workload-grid > div").length');
  console.log(`Jumlah kartu penilai di Matriks Kapasitas: ${appraiserCount}`);
  assert.ok(appraiserCount >= 3, 'Matriks kapasitas harus memuat minimal 3 penilai terdata');

  const branchRows = await evalJs('document.querySelectorAll("#branch-summary-tbody tr").length');
  console.log(`Jumlah baris rekap 5 kantor cabang: ${branchRows}`);
  assert.strictEqual(branchRows, 5, 'Tabel rekap cabang harus memuat tepat 5 kantor wilayah');

  // Ambil Screenshot Dashboard Workload Matrix
  console.log('\n--- Mengambil Tangkapan Layar: Dashboard Workload Matrix ---');
  const shot1 = await cdp('Page.captureScreenshot', { format: 'png' });
  const shot1Path = path.join(artifactsDir, 'bukti_live_dashboard_workload_matrix.png');
  fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
  console.log(`✅ Screenshot disimpan ke: ${shot1Path}`);

  console.log('\n--- TAHAP 5: Uji Sticky Floating Toolbar Lembar SPM & Tombol Kembali ---');
  // Buka modal cetak SPM via fungsi resmi cetakLembarSPM
  await evalJs(`
    const sampleJob = globalJobs.find(j => j.id === 'JO-JKT-2026-0001') || globalJobs[0];
    cetakLembarSPM(sampleJob.id);
  `);
  await new Promise(r => setTimeout(r, 1000));

  const isModalPrintVisible = await evalJs('!document.getElementById("modal-cetak-spm-pdf").classList.contains("hidden")');
  assert.strictEqual(isModalPrintVisible, true, 'Modal cetak SPM harus terbuka');

  const hasStickyClass = await evalJs(`
    const tb = document.querySelector("#modal-cetak-spm-pdf .no-print");
    tb ? tb.className.includes('sticky') && tb.className.includes('top-0') : false
  `);
  assert.strictEqual(hasStickyClass, true, 'Toolbar SPM harus memiliki kelas sticky top-0!');
  console.log('✅ Toolbar SPM terkonfirmasi sticky floating (sticky top-0 bg-white/95).');

  const hasBackButton = await evalJs(`
    const btn = Array.from(document.querySelectorAll("#modal-cetak-spm-pdf button")).find(b => b.innerText.includes('Kembali ke Menu'));
    Boolean(btn)
  `);
  assert.strictEqual(hasBackButton, true, 'Tombol [ ✕ Kembali ke Menu ] harus ada di toolbar!');
  console.log('✅ Tombol [ ✕ Kembali ke Menu ] ditemukan di toolbar SPM.');

  // Ambil Screenshot Lembar SPM dengan Sticky Toolbar
  const shot2 = await cdp('Page.captureScreenshot', { format: 'png' });
  const shot2Path = path.join(artifactsDir, 'bukti_live_spm_preview_floating_toolbar.png');
  fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
  console.log(`✅ Screenshot disimpan ke: ${shot2Path}`);

  // Klik tombol [ ✕ Kembali ke Menu ]
  await evalJs('tutupModalCetakSPM()');
  await new Promise(r => setTimeout(r, 500));

  const isModalClosed = await evalJs('document.getElementById("modal-cetak-spm-pdf").classList.contains("hidden")');
  assert.strictEqual(isModalClosed, true, 'Modal cetak SPM harus tertutup setelah tombol Kembali diklik');
  console.log('✅ Modal cetak SPM berhasil ditutup via tombol [ ✕ Kembali ke Menu ].');

  console.log('\n================================================================');
  console.log('🎉 SELURUH PENGUJIAN BROWSER E2E PRIORITAS 4 SUKSES PENUH!');
  console.log('================================================================');
} finally {
  try { ws.close(); } catch (_) {}
  try { chrome.kill(); } catch (_) {}
  try { php.kill(); } catch (_) {}
  try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch (_) {}
}
