/**
 * scripts/verify-qa-tahap1-integration.mjs
 * Pengujian Otomasi End-to-End Tahap 1:
 * Auto-Populate DB_PENUGASAN_JO_NSR + Sinkronisasi Otomatis Tracking 7 Milestone (M-05 & M-06)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = 8877;
const CHROME_PORT = 9225;
const TEMP_PROFILE = path.join(rootDir, '.temp_chrome_tahap1_verify');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/portal-qa-review.html';

  const filePath = path.join(rootDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`Server verifikasi aktif pada http://localhost:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(chromePath)) {
  console.error('Google Chrome tidak ditemukan di path default:', chromePath);
  process.exit(1);
}

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CHROME_PORT}`,
  `--user-data-dir=${TEMP_PROFILE}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1440,960'
]);

let passed = 0;
let failed = 0;
function assert(desc, condition, actual = '') {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${desc} (Aktual: ${actual})`);
    failed++;
  }
}

try {
  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      if (v.ok) { connected = true; break; }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 250));
  }
  if (!connected) throw new Error('Gagal menghubungkan ke Chrome CDP port ' + CHROME_PORT);

  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();

  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.addEventListener('message', (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.method === 'Page.javascriptDialogOpening') {
        sendCdp('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      }
    } catch (_) {}
  });

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const timer = setTimeout(() => {
        ws.removeEventListener('message', handler);
        reject(new Error(`Timeout CDP: ${method}`));
      }, 15000);
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          clearTimeout(timer);
          ws.removeEventListener('message', handler);
          if (data.error) reject(new Error(JSON.stringify(data.error)));
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalJs(expr) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.error('EVAL JS EXCEPTION:', res.exceptionDetails.text, res.exceptionDetails.exception?.description);
    }
    return res.result ? res.result.value : null;
  }

  await sendCdp('Page.enable');

  console.log('\n================================================================================');
  console.log('VERIFIKASI TAHAP 1: AUTO-POPULATE JO & LIVE TRACKING 7 MILESTONE (M-05 & M-06)');
  console.log('================================================================================\n');

  // Set login Reviewer SPM (Tedi Setiadi)
  await sendCdp('Page.navigate', { url: `http://localhost:${PORT}/portal-qa-review.html` });
  await new Promise(r => setTimeout(r, 1200));

  await evalJs(`
    sessionStorage.setItem('nsr_user_session', JSON.stringify({
      nama: 'Tedi Setiadi',
      role: 'REVIEWER_SPM',
      jabatan: 'Technical Reviewer SPM',
      nik: 'NSR-2019-007',
      avatar: 'T'
    }));
  `);
  await sendCdp('Page.navigate', { url: `http://localhost:${PORT}/portal-qa-review.html` });
  await new Promise(r => setTimeout(r, 1500));

  // UJI 1: Komponen Searchable Datalist JO & Indikator Sinkronisasi
  console.log('[UJI 1] Verifikasi UI Searchable Datalist JO & Indikator...');
  const inputListAttr = await evalJs(`document.getElementById('input-jo-number')?.getAttribute('list')`);
  const datalistExists = await evalJs(`Boolean(document.getElementById('datalist-active-jo'))`);
  const indicatorExists = await evalJs(`Boolean(document.getElementById('jo-sync-indicator'))`);
  const indicatorText = await evalJs(`document.getElementById('jo-sync-indicator')?.textContent`);

  assert('Input #input-jo-number memiliki atribut list="datalist-active-jo"', inputListAttr === 'datalist-active-jo', inputListAttr);
  assert('Elemen <datalist id="datalist-active-jo"> tersedia di DOM', datalistExists === true, datalistExists);
  assert('Indikator sinkronisasi #jo-sync-indicator tersedia di header input', indicatorExists === true, indicatorExists);
  assert('Indikator menampilkan status sinkronisasi aktif/offline', indicatorText?.includes('JO') || indicatorText?.includes('Sinkron') || indicatorText?.includes('Offline'), indicatorText);

  // UJI 2: Pemanggilan loadActiveJobOrdersDirectory & Pengisian Datalist
  console.log('\n[UJI 2] Verifikasi loadActiveJobOrdersDirectory() & Isi Datalist...');
  await evalJs(`loadActiveJobOrdersDirectory();`);
  await new Promise(r => setTimeout(r, 500));

  const mapSize = await evalJs(`DB_PENUGASAN_MAP?.size`);
  const optionCount = await evalJs(`document.getElementById('datalist-active-jo')?.children?.length`);
  const hasFifaKey = await evalJs(`DB_PENUGASAN_MAP?.has('JO-NSR-2026-8084')`);

  assert('DB_PENUGASAN_MAP terisi minimal 3 penugasan aktif (resiliensi offline)', mapSize >= 3, mapSize);
  assert('Datalist berisi elemen <option> sesuai jumlah penugasan', optionCount >= 3, optionCount);
  assert('Penugasan standar JO-NSR-2026-8084 terdaftar dalam map', hasFifaKey === true, hasFifaKey);

  // UJI 3: Auto-Populate Klien & Objek saat No. JO Dipilih (handleJobOrderSelection)
  console.log('\n[UJI 3] Verifikasi Auto-Populate saat No. JO Dipilih...');
  await evalJs(`
    const inputJo = document.getElementById('input-jo-number');
    inputJo.value = 'JO-NSR-2026-8084';
    handleJobOrderSelection('JO-NSR-2026-8084');
  `);
  await new Promise(r => setTimeout(r, 300));

  const clientVal = await evalJs(`document.getElementById('input-client-name')?.value`);
  const metaJobId = await evalJs(`document.getElementById('meta-job-id')?.textContent`);
  const savedContext = await evalJs(`JSON.parse(localStorage.getItem('NSR_JO_CONTEXT_JO-NSR-2026-8084') || '{}')`);

  assert('Kolom Pemberi Tugas / Klien otomatis terisi nama Bank BTN', clientVal?.includes('PT Bank Tabungan Negara'), clientVal);
  assert('Badge meta-job-id tersinkronisasi ke JO-NSR-2026-8084', metaJobId === 'JO-NSR-2026-8084', metaJobId);
  assert('Konteks penugasan tersimpan di localStorage (Zero Double-Entry)', Boolean(savedContext?.pemberiTugas?.includes('Bank Tabungan Negara') || savedContext?.pemberiTugas?.includes('BTN')), JSON.stringify(savedContext));

  // UJI 4: Transisi Milestone UPLOADED_DRAFT -> M-05 (Dalam Telaah SPM)
  console.log('\n[UJI 4] Uji Transisi Milestone UPLOADED_DRAFT -> M-05...');
  await evalJs(`
    pushMilestoneTransition('JO-NSR-2026-8084', 'UPLOADED_DRAFT', {
      status: 'IN_REVIEW',
      compliance_score: 75.0
    }, 'hash-draft-test-123');
  `);
  await new Promise(r => setTimeout(r, 200));

  const syncDraft = await evalJs(`JSON.parse(localStorage.getItem('NSR_MILESTONE_SYNC_JO-NSR-2026-8084') || '{}')`);
  assert('Event UPLOADED_DRAFT menghasilkan milestone M-05', syncDraft?.milestoneAktif === 'M-05', syncDraft?.milestoneAktif);
  assert('Status QA tersinkron IN_REVIEW', syncDraft?.statusQa === 'IN_REVIEW', syncDraft?.statusQa);

  // UJI 5: Transisi Milestone REVISION_RETURNED -> M-05 (Dikembalikan ke Penilai)
  console.log('\n[UJI 5] Uji Transisi Milestone REVISION_RETURNED -> M-05...');
  await evalJs(`
    pushMilestoneTransition('JO-NSR-2026-8084', 'REVISION_RETURNED', {
      status: 'REQUIRES_REVISION',
      compliance_score: 65.0
    }, 'hash-draft-test-123');
  `);
  await new Promise(r => setTimeout(r, 200));

  const syncRev = await evalJs(`JSON.parse(localStorage.getItem('NSR_MILESTONE_SYNC_JO-NSR-2026-8084') || '{}')`);
  assert('Event REVISION_RETURNED mempertahankan milestone M-05', syncRev?.milestoneAktif === 'M-05', syncRev?.milestoneAktif);
  assert('Status QA tersinkron REQUIRES_REVISION', syncRev?.statusQa === 'REQUIRES_REVISION', syncRev?.statusQa);

  // UJI 6: Transisi Milestone QA_APPROVED -> M-06 (Lolos QA - Siap Terbit NoLap)
  console.log('\n[UJI 6] Uji Transisi Milestone QA_APPROVED -> M-06...');
  await evalJs(`
    pushMilestoneTransition('JO-NSR-2026-8084', 'QA_APPROVED', {
      status: 'ACCEPTABLE',
      compliance_score: 92.5
    }, 'hash-draft-test-123');
  `);
  await new Promise(r => setTimeout(r, 200));

  const syncApprove = await evalJs(`JSON.parse(localStorage.getItem('NSR_MILESTONE_SYNC_JO-NSR-2026-8084') || '{}')`);
  assert('Event QA_APPROVED meloloskan ke milestone M-06 (Gerbang NoLap)', syncApprove?.milestoneAktif === 'M-06', syncApprove?.milestoneAktif);
  assert('Status QA tersinkron ACCEPTABLE', syncApprove?.statusQa === 'ACCEPTABLE', syncApprove?.statusQa);
  assert('Skor mutu tersimpan 92.5%', Number(syncApprove?.skorMutu) === 92.5, syncApprove?.skorMutu);

  // UJI 7: Transisi Milestone QA_OVERRIDE -> M-06 (Dispensasi Pimpinan Rekan)
  console.log('\n[UJI 7] Uji Transisi Milestone QA_OVERRIDE -> M-06...');
  await evalJs(`
    pushMilestoneTransition('JO-NSR-2026-0881', 'QA_OVERRIDE', {
      status: 'ACCEPTED_OVERRIDE',
      compliance_score: 85.0
    }, 'hash-fifa-override');
  `);
  await new Promise(r => setTimeout(r, 200));

  const syncOvr = await evalJs(`JSON.parse(localStorage.getItem('NSR_MILESTONE_SYNC_JO-NSR-2026-0881') || '{}')`);
  assert('Event QA_OVERRIDE meloloskan ke milestone M-06', syncOvr?.milestoneAktif === 'M-06', syncOvr?.milestoneAktif);
  assert('Status QA tersinkron ACCEPTED_OVERRIDE', syncOvr?.statusQa === 'ACCEPTED_OVERRIDE', syncOvr?.statusQa);

  // UJI 8: Navigasi ke portal-tracking.html & Verifikasi Pembacaan NSR_MILESTONE_SYNC_*
  console.log('\n[UJI 8] Verifikasi Refleksi Data pada portal-tracking.html (Tracking 7 Milestone)...');
  await sendCdp('Page.navigate', { url: `http://localhost:${PORT}/portal-tracking.html` });
  await new Promise(r => setTimeout(r, 1500));

  const hasApplyFn = await evalJs(`typeof applyQAMilestoneSync === 'function'`);
  assert('Fungsi applyQAMilestoneSync tersedia pada portal-tracking.html', hasApplyFn === true, hasApplyFn);

  // Evaluasi applyQAMilestoneSync pada penugasan tracking
  const trackingEval = await evalJs(`(() => {
    const testList = [
      { id_jo: 'JO-NSR-2026-8084', current_milestone: 'M-04' },
      { id_jo: 'JO-NSR-2026-0881', current_milestone: 'M-04' }
    ];
    applyQAMilestoneSync(testList);
    return {
      jo8084: testList.find(x => x.id_jo === 'JO-NSR-2026-8084'),
      jo0881: testList.find(x => x.id_jo === 'JO-NSR-2026-0881')
    };
  })()`);

  assert('Job JO-NSR-2026-8084 pada tracking terupdate ke M-06 (Lolos QA)', trackingEval?.jo8084?.current_milestone === 'M-06', trackingEval?.jo8084?.current_milestone);
  assert('Job JO-NSR-2026-0881 pada tracking terupdate ke M-06 (Override)', trackingEval?.jo0881?.current_milestone === 'M-06', trackingEval?.jo0881?.current_milestone);
  assert('Status QA tersinkron ke ACCEPTABLE', trackingEval?.jo8084?.status_qa === 'ACCEPTABLE', trackingEval?.jo8084?.status_qa);

  // UJI 9: Verifikasi Modul Backend Google Apps Script (backend/google-apps-script-qa-audit.gs)
  console.log('\n[UJI 9] Verifikasi Kode Backend Google Apps Script...');
  const gasContent = fs.readFileSync(path.join(rootDir, 'backend', 'google-apps-script-qa-audit.gs'), 'utf8');

  assert('Fungsi getActiveJobOrdersForQA terdefinisi di GAS', gasContent.includes('function getActiveJobOrdersForQA'), 'tidak ditemukan');
  assert('Fungsi updateJobOrderMilestoneFromQA terdefinisi di GAS', gasContent.includes('function updateJobOrderMilestoneFromQA'), 'tidak ditemukan');
  assert('Aksi GET_ACTIVE_JO_QA terdaftar di handleQAAuditPost', gasContent.includes('GET_ACTIVE_JO_QA'), 'tidak ditemukan');
  assert('Aksi UPDATE_JO_MILESTONE_QA terdaftar di handleQAAuditPost', gasContent.includes('UPDATE_JO_MILESTONE_QA'), 'tidak ditemukan');
  assert('Sheet DB_PENUGASAN_JO_NSR dikueri secara dinamis', gasContent.includes('DB_PENUGASAN_JO_NSR'), 'tidak ditemukan');
  assert('Proteksi LockService aktif pada update milestone', gasContent.includes('LockService.getScriptLock()'), 'tidak ditemukan');

  ws.close();
} finally {
  chrome.kill();
  server.close();
  try {
    fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
  } catch (_) {}
}

console.log('\n================================================================================');
console.log(`TOTAL PENGUJIAN TAHAP 1: ${passed + failed} | LULUS: ${passed} | GAGAL: ${failed}`);
console.log('================================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('SEMUA PENGUJIAN TAHAP 1: AUTO-POPULATE & TRACKING 7 MILESTONE LULUS 100% SEMPURNA!\n');
  process.exit(0);
}
