/**
 * scripts/verify-qa-rbac-local.mjs
 * Comprehensive Local RBAC & Security Gatekeeping Verification for Portal QA Review.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { QAEngine } from '../lib/qa-engine.js';

const PORT = 8844;
const CHROME_PORT = 9599;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = path.join(process.cwd(), '.tmp_qa_rbac_chrome');

console.log('='.repeat(80));
console.log('VERIFIKASI RBAC & SECURITY GATEKEEPER PORTAL QA REVIEW');
console.log('='.repeat(80));

let totalAsserts = 0;
let passedAsserts = 0;
let failedAsserts = 0;

function assert(condition, message) {
  totalAsserts++;
  if (condition) {
    passedAsserts++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedAsserts++;
    console.error(`  [FAIL] ${message}`);
  }
}

// ---------------------------------------------------------------------
// 1. UNIT TEST: lib/qa-engine.js RBAC Guard
// ---------------------------------------------------------------------
console.log('\n--- 1. UJI UNIT: lib/qa-engine.js checkRoleAccess & evaluateDocument ---');
const engine = new QAEngine();

const srvCheck = engine.checkRoleAccess('SURVEYOR');
assert(srvCheck.allowed === false, 'checkRoleAccess("SURVEYOR") harus mengembalikan allowed: false');

const penilaiCheck = engine.checkRoleAccess('PENILAI');
assert(penilaiCheck.allowed === true, 'checkRoleAccess("PENILAI") harus mengembalikan allowed: true');

const spmCheck = engine.checkRoleAccess('REVIEWER_SPM');
assert(spmCheck.allowed === true, 'checkRoleAccess("REVIEWER_SPM") harus mengembalikan allowed: true');

const sampleFile = path.join(process.cwd(), '2026 BTN Jalan Dr Sutomo No 94 an PT FIFA MEDIKA (RUMAH SAKIT).pdf');
let thrown = false;
try {
  engine.evaluateDocument(sampleFile, 'JO-NSR-TEST', 'Tim Surveyor', 'SURVEYOR');
} catch (e) {
  thrown = true;
  assert(e.message.includes('[RBAC_DENIED]'), `evaluateDocument harus melempar [RBAC_DENIED] untuk SURVEYOR (Pesan: ${e.message})`);
}
assert(thrown === true, 'Surveyor dilarang keras menjalankan evaluasi teknis draf laporan');

// ---------------------------------------------------------------------
// 2. LOCAL HTTP SERVER FOR STATIC DIST ASSETS
// ---------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(process.cwd(), 'dist', parsedUrl.pathname.replace(/^\//, ''));
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
    filePath = path.join(process.cwd(), 'dist', 'portal-qa-review.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

await new Promise(r => server.listen(PORT, r));
console.log(`\nServer lokal aktif di http://localhost:${PORT}`);

// ---------------------------------------------------------------------
// 3. LAUNCH CHROME HEADLESS CDP
// ---------------------------------------------------------------------
console.log('\n--- 2. Meluncurkan Chrome CDP Headless ---');
if (!fs.existsSync(TEMP_PROFILE)) fs.mkdirSync(TEMP_PROFILE, { recursive: true });

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${CHROME_PORT}`,
  `--user-data-dir=${TEMP_PROFILE}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1440,960'
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const wsRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
  const pages = await wsRes.json();
  const targetPage = pages.find(p => p.type === 'page') || pages[0];

  const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');

  async function captureProof(filename) {
    const shot = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    console.log(`  -> Bukti tangkapan layar tersimpan: ${filename}`);
  }

  async function navigateAndWait(url) {
    await sendCdp('Page.navigate', { url });
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 250));
      const res = await sendCdp('Runtime.evaluate', {
        expression: 'Boolean(window.__qa_initialized)'
      });
      if (res?.result?.value === true) {
        await new Promise(r => setTimeout(r, 400));
        return;
      }
    }
    console.warn(`[WARN] Timeout waiting for window.__qa_initialized on ${url}`);
  }

  // -------------------------------------------------------------
  // TEST A: SURVEYOR LAPANGAN (STRICT LOCKOUT)
  // -------------------------------------------------------------
  console.log('\n[UJI A] Role SURVEYOR: Kunci total workspace & tampilkan modal pembatasan...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?role=SURVEYOR`);

  const surveyorState = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      const banner = document.getElementById('role-mode-banner');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      return {
        modalVisible: modal ? !modal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none' || getComputedStyle(ws).display === 'none') : false,
        bannerHidden: banner ? banner.classList.contains('hidden') : false,
        badgeRole: badgeRole
      };
    })()`,
    returnByValue: true
  });

  assert(surveyorState.result.value.modalVisible === true, 'Modal #modal-surveyor-locked harus ditampilkan');
  assert(surveyorState.result.value.workspaceHidden === true, 'Kontainer #main-qa-workspace harus disembunyikan (display: none)');
  assert(surveyorState.result.value.bannerHidden === true, 'Banner #role-mode-banner harus disembunyikan');
  assert(surveyorState.result.value.badgeRole?.includes('Surveyor'), `Badge role harus menampilkan Surveyor (Aktual: ${surveyorState.result.value.badgeRole})`);
  await captureProof('bukti_qa_rbac_surveyor_locked.png');

  // -------------------------------------------------------------
  // TEST B: PENILAI PENYUSUN / VALUER (M-04)
  // -------------------------------------------------------------
  console.log('\n[UJI B] Role PENILAI: Unggah berkas, Anti Self-Review, Override dilarang...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?role=PENILAI`);

  const valuerState = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const noticeValuer = document.getElementById('notice-valuer-spm');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      return {
        modalHidden: modal ? modal.classList.contains('hidden') : false,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiHidden: btnRevisi ? (btnRevisi.style.display === 'none') : false,
        noticeValuerVisible: noticeValuer ? !noticeValuer.classList.contains('hidden') : false,
        badgeRole: badgeRole
      };
    })()`,
    returnByValue: true
  });

  assert(valuerState.result.value.modalHidden === true, 'Modal Surveyor terkunci harus tersembunyi');
  assert(valuerState.result.value.workspaceVisible === true, 'Workspace teknis harus tampil');
  assert(valuerState.result.value.btnOverrideHidden === true, 'Tombol Override Gate HARUS disembunyikan untuk Penilai');
  assert(valuerState.result.value.btnRevisiHidden === true, 'Tombol Kirim Revisi HARUS disembunyikan untuk Penilai (Anti Self-Review)');
  assert(valuerState.result.value.noticeValuerVisible === true, 'Kotak notifikasi Anti Self-Review harus tampil untuk Penilai');
  await captureProof('bukti_qa_rbac_penilai_workspace.png');

  // -------------------------------------------------------------
  // TEST C: REVIEWER KENDALI MUTU SPM (M-05)
  // -------------------------------------------------------------
  console.log('\n[UJI C] Role REVIEWER_SPM: Kirim revisi aktif, Override tetap dilarang...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?role=REVIEWER_SPM`);

  const spmState = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const noticeValuer = document.getElementById('notice-valuer-spm');
      const banner = document.getElementById('role-mode-label')?.textContent;
      return {
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false,
        noticeValuerHidden: noticeValuer ? noticeValuer.classList.contains('hidden') : false,
        bannerLabel: banner
      };
    })()`,
    returnByValue: true
  });

  assert(spmState.result.value.btnOverrideHidden === true, 'Tombol Override Gate HARUS disembunyikan untuk Reviewer SPM (Hanya Rekan)');
  assert(spmState.result.value.btnRevisiVisible === true, 'Tombol Kirim Catatan Revisi HARUS aktif untuk Reviewer SPM');
  assert(spmState.result.value.noticeValuerHidden === true, 'Kotak notifikasi Penilai harus disembunyikan');
  assert(spmState.result.value.bannerLabel?.includes('Reviewer'), `Banner harus berlabel Reviewer SPM (Aktual: ${spmState.result.value.bannerLabel})`);
  await captureProof('bukti_qa_rbac_reviewer_spm.png');

  // -------------------------------------------------------------
  // TEST D: PIMPINAN REKAN / KEPALA SPM (FULL AUTHORITY)
  // -------------------------------------------------------------
  console.log('\n[UJI D] Role REKAN: Otoritas penuh, Override Gate & Kirim Revisi aktif...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?role=REKAN`);

  const rekanState = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const banner = document.getElementById('role-mode-label')?.textContent;
      return {
        btnOverrideVisible: btnOverride ? (btnOverride.style.display !== 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false,
        bannerLabel: banner
      };
    })()`,
    returnByValue: true
  });

  assert(rekanState.result.value.btnOverrideVisible === true, 'Tombol Override Gate HARUS aktif untuk Pimpinan Rekan');
  assert(rekanState.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi HARUS aktif untuk Pimpinan Rekan');
  assert(rekanState.result.value.bannerLabel?.includes('Pimpinan Rekan'), `Banner harus berlabel Pimpinan Rekan (Aktual: ${rekanState.result.value.bannerLabel})`);
  await captureProof('bukti_qa_rbac_rekan_pimpinan.png');

  ws.close();
} catch (err) {
  console.error('[CDP_ERROR]', err);
} finally {
  chrome.kill();
  server.close();
}

console.log('\n' + '='.repeat(80));
console.log(`HASIL VERIFIKASI RBAC: Total ${totalAsserts} | Lulus: ${passedAsserts} | Gagal: ${failedAsserts}`);
console.log('='.repeat(80));

if (failedAsserts > 0) {
  process.exit(1);
} else {
  console.log('Semua pengujian RBAC LULUS dengan sempurna!');
  process.exit(0);
}
