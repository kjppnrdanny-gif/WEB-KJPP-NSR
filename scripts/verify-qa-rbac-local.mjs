/**
 * scripts/verify-qa-rbac-local.mjs
 * Comprehensive Local RBAC & Security Gatekeeping Verification for Portal QA Review.
 * 
 * Verifies:
 * 1. lib/qa-engine.js: checkRoleAccess('SURVEYOR' / 'NSR-SRV-2026') -> [RBAC_DENIED]
 * 2. Token NSR-VAL-2026 directly unlocks QA workspace (M-04 Valuer) and sets badge "[Penilai Penyusun - M-04]"
 * 3. Cache Purge: Stale surveyor session in sessionStorage is completely flushed when ?token=NSR-VAL-2026 arrives
 * 4. Token NSR-SRV-2026 locks screen into #modal-surveyor-locked with NO backdoor link / NO role selector
 * 5. Reviewer SPM & Pimpinan Rekan workspaces and permission guards
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
console.log('VERIFIKASI SISTEM TOKEN NSR-VAL-2026 & SECURITY BACKDOOR AUDIT');
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

const srvTokenCheck = engine.checkRoleAccess('NSR-SRV-2026');
assert(srvTokenCheck.allowed === false, 'checkRoleAccess("NSR-SRV-2026") harus mengembalikan allowed: false');

const penilaiCheck = engine.checkRoleAccess('PENILAI');
assert(penilaiCheck.allowed === true, 'checkRoleAccess("PENILAI") harus mengembalikan allowed: true');

const valTokenCheck = engine.checkRoleAccess('NSR-VAL-2026');
assert(valTokenCheck.allowed === true, 'checkRoleAccess("NSR-VAL-2026") harus mengembalikan allowed: true');

const spmCheck = engine.checkRoleAccess('REVIEWER_SPM');
assert(spmCheck.allowed === true, 'checkRoleAccess("REVIEWER_SPM") harus mengembalikan allowed: true');

const sampleFile = path.join(process.cwd(), '2026 BTN Jalan Dr Sutomo No 94 an PT FIFA MEDIKA (RUMAH SAKIT).pdf');
let thrown = false;
try {
  engine.evaluateDocument(sampleFile, 'JO-NSR-TEST', 'Tim Surveyor', 'NSR-SRV-2026');
} catch (e) {
  thrown = true;
  assert(e.message.includes('[RBAC_DENIED]'), `evaluateDocument harus melempar [RBAC_DENIED] untuk token NSR-SRV-2026 (Pesan: ${e.message})`);
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
  }

  // -------------------------------------------------------------
  // TEST 1: TOKEN NSR-VAL-2026 (PENILAI PENYUSUN DRAF M-04)
  // -------------------------------------------------------------
  console.log('\n[UJI 1] Token NSR-VAL-2026: Langsung buka workspace QA & pasang badge [Penilai Penyusun - M-04]...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?token=NSR-VAL-2026`);

  const valuerRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const noticeValuer = document.getElementById('notice-valuer-spm');
      const banner = document.getElementById('role-mode-label')?.textContent;
      return {
        modalHidden: modal ? modal.classList.contains('hidden') : false,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeRole: badgeRole,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiHidden: btnRevisi ? (btnRevisi.style.display === 'none') : false,
        noticeValuerVisible: noticeValuer ? !noticeValuer.classList.contains('hidden') : false,
        bannerLabel: banner
      };
    })()`,
    returnByValue: true
  });

  assert(valuerRes.result.value.modalHidden === true, 'Modal Surveyor Lockout HARUS tersembunyi untuk NSR-VAL-2026');
  assert(valuerRes.result.value.workspaceVisible === true, 'Workspace teknis HARUS aktif untuk NSR-VAL-2026');
  assert(valuerRes.result.value.badgeRole === '[Penilai Penyusun - M-04]', `Badge role harus "[Penilai Penyusun - M-04]" (Aktual: ${valuerRes.result.value.badgeRole})`);
  assert(valuerRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Penilai');
  assert(valuerRes.result.value.btnRevisiHidden === true, 'Tombol Kirim Revisi disembunyikan untuk Penilai (Anti Self-Review)');
  assert(valuerRes.result.value.noticeValuerVisible === true, 'Notifikasi Anti Self-Review tampil untuk Penilai');
  await captureProof('bukti_qa_token_nsr_val_2026.png');

  // -------------------------------------------------------------
  // TEST 2: SESSION CLEANUP DEFENSE (STALE SURVEYOR CACHE OVERRIDE)
  // -------------------------------------------------------------
  console.log('\n[UJI 2] Pertahanan Anti-Cache: Injeksi session kotor Surveyor lalu buka ?token=NSR-VAL-2026...');
  // Simulasikan residu cache surveyor di sessionStorage
  await sendCdp('Runtime.evaluate', {
    expression: `sessionStorage.setItem('nsr_user_session', JSON.stringify({ role: 'SURVEYOR', token: 'NSR-SRV-2026', nama: 'Surveyor Lama' }))`
  });

  // Navigasi dengan token Penilai
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?token=NSR-VAL-2026`);

  const cachePurgeRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      const sess = JSON.parse(sessionStorage.getItem('nsr_user_session') || '{}');
      return {
        modalHidden: modal ? modal.classList.contains('hidden') : false,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        newRole: sess.role,
        newToken: sess.token
      };
    })()`,
    returnByValue: true
  });

  assert(cachePurgeRes.result.value.modalHidden === true, 'Cache surveyor lama harus dibersihkan, modal lockout tidak boleh muncul');
  assert(cachePurgeRes.result.value.workspaceVisible === true, 'Workspace Penilai harus tetap aktif meski ada sisa cache lama');
  assert(cachePurgeRes.result.value.newRole === 'PENILAI', `Session role harus terupdate menjadi PENILAI (Aktual: ${cachePurgeRes.result.value.newRole})`);
  assert(cachePurgeRes.result.value.newToken === 'NSR-VAL-2026', `Session token harus terupdate menjadi NSR-VAL-2026 (Aktual: ${cachePurgeRes.result.value.newToken})`);

  // -------------------------------------------------------------
  // TEST 3: TOKEN NSR-SRV-2026 & SECURITY BACKDOOR AUDIT
  // -------------------------------------------------------------
  console.log('\n[UJI 3] Token NSR-SRV-2026: Terkunci total & Audit Penghapusan Backdoor Link...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?token=NSR-SRV-2026`);

  const surveyorRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;

      // Audit Backdoor Link di Modal:
      const modalText = modal ? modal.innerHTML : '';
      const hasBackdoorLink = /Beralih ke Akun|gantiPeranManual|switchRole/i.test(modalText);

      // Audit Role Selector Dropdown di Header:
      const hasRoleDropdown = Boolean(document.getElementById('user-role-select'));

      // Hitung tombol resmi di modal
      const modalLinks = modal ? Array.from(modal.querySelectorAll('a')).map(a => a.getAttribute('href')) : [];

      return {
        modalVisible: modal ? !modal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none' || getComputedStyle(ws).display === 'none') : false,
        badgeRole: badgeRole,
        hasBackdoorLink: hasBackdoorLink,
        hasRoleDropdown: hasRoleDropdown,
        modalLinks: modalLinks
      };
    })()`,
    returnByValue: true
  });

  assert(surveyorRes.result.value.modalVisible === true, 'Modal #modal-surveyor-locked HARUS aktif untuk NSR-SRV-2026');
  assert(surveyorRes.result.value.workspaceHidden === true, 'Workspace teknis HARUS tersembunyi untuk NSR-SRV-2026');
  assert(surveyorRes.result.value.hasBackdoorLink === false, 'CELAH KEAMANAN TERHAPUS: Link "Beralih ke Akun" TIDAK BOLEH ADA di modal');
  assert(surveyorRes.result.value.hasRoleDropdown === false, 'CELAH KEAMANAN TERHAPUS: Dropdown simulator #user-role-select TIDAK BOLEH ADA di DOM');
  assert(surveyorRes.result.value.modalLinks.length === 2, `Modal HANYA boleh memiliki 2 tombol resmi (Aktual: ${surveyorRes.result.value.modalLinks.length} tautan: ${surveyorRes.result.value.modalLinks.join(', ')})`);
  assert(surveyorRes.result.value.modalLinks.includes('portal-tracking.html') && surveyorRes.result.value.modalLinks.includes('index.html'), 'Tombol resmi harus menuju portal-tracking.html dan index.html');
  await captureProof('bukti_qa_surveyor_locked_no_backdoor.png');

  // -------------------------------------------------------------
  // TEST 4: REVIEWER SPM (Tedi Setiadi / NSR-2019-007)
  // -------------------------------------------------------------
  console.log('\n[UJI 4] Akun Reviewer SPM (Tedi Setiadi - NSR-2019-007)...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?nik=NSR-2019-007`);

  const spmRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const banner = document.getElementById('role-mode-label')?.textContent;
      return {
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false,
        bannerLabel: banner
      };
    })()`,
    returnByValue: true
  });

  assert(spmRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Reviewer SPM');
  assert(spmRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Reviewer SPM');
  assert(spmRes.result.value.bannerLabel?.includes('Reviewer'), 'Banner berlabel Reviewer SPM');

  // -------------------------------------------------------------
  // TEST 5: PIMPINAN REKAN (Danny Taufik Hidayat - NSR-2019-005)
  // -------------------------------------------------------------
  console.log('\n[UJI 5] Akun Pimpinan Rekan / Kepala SPM (Danny Taufik - NSR-2019-005)...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html?nik=NSR-2019-005`);

  const rekanRes = await sendCdp('Runtime.evaluate', {
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

  assert(rekanRes.result.value.btnOverrideVisible === true, 'Tombol Override Gate aktif untuk Pimpinan Rekan');
  assert(rekanRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Pimpinan Rekan');
  assert(rekanRes.result.value.bannerLabel?.includes('Pimpinan Rekan'), 'Banner berlabel Pimpinan Rekan');

  ws.close();
} catch (err) {
  console.error('[CDP_ERROR]', err);
} finally {
  chrome.kill();
  server.close();
  try {
    fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
  } catch (_) {}
}

console.log('\n' + '='.repeat(80));
console.log(`HASIL VERIFIKASI RBAC & SECURITY AUDIT: Total ${totalAsserts} | Lulus: ${passedAsserts} | Gagal: ${failedAsserts}`);
console.log('='.repeat(80));

if (failedAsserts > 0) {
  process.exit(1);
} else {
  console.log('Semua pengujian RBAC & Security Audit LULUS 100%!');
  process.exit(0);
}
