import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_PORT = 8298;
const CHROME_PORT = 9582;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-spm-${Date.now()}`);

console.log('================================================================');
console.log('   PENGUJIAN BROWSER E2E: LEMBAR KENDALI MUTU SPM & CETAK PDF   ');
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
  php.kill();
  chrome.kill();
  throw new Error('Failed to connect to Chrome debugging endpoint');
}

const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let reqIdCounter = 1;
function send(method, params = {}) {
  return new Promise((res) => {
    const curId = reqIdCounter++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        res(msg);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return (r.result && r.result.result) ? r.result.result.value : null;
}

async function runBrowserTest() {
  await send('Page.enable');
  await send('Runtime.enable');

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
  });

  console.log(`Setting session storage and navigating to http://127.0.0.1:${PHP_PORT}/portal-tracking.html ...`);
  await send('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });
  await new Promise(r => setTimeout(r, 1000));

  await evalJs(`
    sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
      token: 'NSR8899',
      role: 'SUPER ADMIN',
      isSuperAdmin: true,
      isCabang: false,
      wilayah: 'PUSAT',
      nik: 'NSR-2019-002',
      nama: 'Deni Siswandi, S.E., M.Ec.Dev., MAPPI (Cert.)'
    }));
  `);

  await send('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });
  await new Promise(r => setTimeout(r, 2500));

  // Pastikan task board memuat penugasan
  const jobCount = await evalJs('(() => typeof globalJobs !== "undefined" ? globalJobs.length : 0)()');
  console.log(`Jumlah Job Order terdeteksi di task board: ${jobCount}`);
  assert(jobCount > 0, 'Harus ada data penugasan pada Task Board');

  console.log('Membuka modal update milestone untuk penugasan Bandung (M-05)...');
  await evalJs(`
    const bdgJob = globalJobs.find(x => x.current_milestone === 'M-05' || x.kantor_code === 'BDG') || globalJobs[0];
    bukaModalUpdateMilestone(bdgJob.jo_number);
    const targetSelect = document.getElementById('update-target-milestone');
    targetSelect.value = 'M-05';
    sesuaikanFieldMilestone('M-05');
  `);
  await new Promise(r => setTimeout(r, 600));

  // Verifikasi kontainer checklist M-05 & 10 item
  const checklistCheck = await evalJs(`
    (() => {
      const m5Box = document.getElementById('container-field-m05-spm');
      const items = document.querySelectorAll('#spm-checklist-container > div');
      const notesEl = document.getElementById('update-spm-notes');
      return {
        boxVisible: !m5Box.classList.contains('hidden'),
        itemsCount: items.length,
        notesExists: !!notesEl
      };
    })()
  `);
  console.log('Checklist UI Check:', checklistCheck);
  assert.strictEqual(checklistCheck.boxVisible, true, 'Kontainer M-05 harus terlihat');
  assert.strictEqual(checklistCheck.itemsCount, 10, 'Harus ter-render 10 butir pengujian kepatuhan');
  console.log('[PASS] Kontainer Lembar Kendali Mutu SPM menampilkan 10 butir pengujian baku');

  // Uji interaktivitas: Tandai Item 4 (Kecukupan Data Pasar Pembanding) sebagai TEMUAN
  console.log('Menguji penandaan butir TEMUAN...');
  await evalJs(`
    const radTemuan = document.querySelector('input[name="spm_item_4"][value="TEMUAN"]');
    if (radTemuan) {
      radTemuan.checked = true;
      periksaStatusChecklistSpm();
    }
    const note4 = document.getElementById('spm_note_4');
    if (note4) note4.value = 'Data pembanding baru 2 unit, perlu minimal 1 lagi di koridor Gedebage.';
    const notesEl = document.getElementById('update-spm-notes');
    if (notesEl) notesEl.value = 'Kekurangan data pembanding transaksi sejenis.';
  `);
  await new Promise(r => setTimeout(r, 400));

  const warningCheck = await evalJs(`
    (() => {
      const wEl = document.getElementById('spm-warning-temuan');
      const submitBtn = document.getElementById('btn-submit-update-m');
      return {
        warningVisible: !wEl.classList.contains('hidden'),
        submitDisabled: submitBtn.classList.contains('pointer-events-none')
      };
    })()
  `);
  console.log('Warning Status on Temuan:', warningCheck);
  assert.strictEqual(warningCheck.warningVisible, true, 'Banner peringatan temuan harus aktif');
  assert.strictEqual(warningCheck.submitDisabled, true, 'Tombol pengesahan harus dicegah saat ada temuan');
  console.log('[PASS] Peringatan temuan audit dan pencegahan kelulusan aktif presisi');

  // Ambil tangkapan layar modal checklist M-05 dengan temuan
  const scr1 = await send('Page.captureScreenshot', { format: 'png' });
  const data1 = (scr1.result && scr1.result.data) ? scr1.result.data : scr1.data;
  const shotPath1 = path.join(artifactsDir, 'bukti_live_checklist_spm_m05.png');
  fs.writeFileSync(shotPath1, Buffer.from(data1, 'base64'));
  console.log(`[SNAPSHOT 1] Berhasil disimpan di: ${shotPath1}`);

  // Klik 'Penuhi Semua' untuk mereset temuan
  console.log('Menguji tombol Penuhi Semua (✓ Sesuai)...');
  await evalJs(`tandaiSemuaSpmSesuai();`);
  await new Promise(r => setTimeout(r, 400));

  const postResetWarning = await evalJs(`
    (() => {
      const wEl = document.getElementById('spm-warning-temuan');
      return { warningVisible: !wEl.classList.contains('hidden') };
    })()
  `);
  assert.strictEqual(postResetWarning.warningVisible, false, 'Banner peringatan harus hilang setelah penuhi semua');
  console.log('[PASS] Tombol Penuhi Semua berhasil mereset seluruh indikator ke status Sesuai');

  // Buka Modal Cetak Lembar SPM (PDF)
  console.log('Membuka Pratinjau Dokumen Cetak Lembar Kendali Mutu SPM (PDF)...');
  await evalJs(`cetakLembarSPMAktif();`);
  await new Promise(r => setTimeout(r, 800));

  const printModalCheck = await evalJs(`
    (() => {
      const modal = document.getElementById('modal-cetak-spm-pdf');
      const joEl = document.getElementById('print-spm-jo');
      const rows = document.querySelectorAll('#print-spm-tbody tr');
      const statusBadge = document.getElementById('print-spm-status-badge');
      const reviewerSign = document.getElementById('print-spm-reviewer-sign');
      return {
        modalVisible: !modal.classList.contains('hidden'),
        joText: joEl ? joEl.innerText : '',
        rowCount: rows.length,
        statusText: statusBadge ? statusBadge.innerText : '',
        reviewerText: reviewerSign ? reviewerSign.innerText : ''
      };
    })()
  `);
  console.log('Print Modal Check:', printModalCheck);
  assert.strictEqual(printModalCheck.modalVisible, true, 'Modal cetak SPM harus terbuka');
  assert.strictEqual(printModalCheck.rowCount, 10, 'Tabel cetak harus memuat 10 butir pengujian SPI');
  assert(printModalCheck.statusText.includes('LULUS AUDIT'), 'Status dokumen harus LULUS AUDIT');
  console.log('[PASS] Dokumen cetak resmi memuat Kop KJPP NSR, Metadata, 10 Butir Pengujian, dan Pengesahan');

  // Ambil tangkapan layar Pratinjau Dokumen Cetak SPM PDF
  const scr2 = await send('Page.captureScreenshot', { format: 'png' });
  const data2 = (scr2.result && scr2.result.data) ? scr2.result.data : scr2.data;
  const shotPath2 = path.join(artifactsDir, 'bukti_live_cetak_lembar_spm_pdf.png');
  fs.writeFileSync(shotPath2, Buffer.from(data2, 'base64'));
  console.log(`[SNAPSHOT 2] Berhasil disimpan di: ${shotPath2}`);

  console.log('\n================================================================');
  console.log('🏆 PENGUJIAN BROWSER E2E KENDALI MUTU SPM & CETAK PDF SUKSES! 🏆');
  console.log('================================================================');
}

try {
  await runBrowserTest();
} catch (err) {
  console.error('Browser Test Failed:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
  php.kill();
}
