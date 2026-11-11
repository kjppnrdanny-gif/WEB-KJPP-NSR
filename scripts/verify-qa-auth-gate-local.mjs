/**
 * scripts/verify-qa-auth-gate-local.mjs
 * Pengujian Komprehensif Gerbang Login Token/NIK & Otorisasi Peran RBAC
 * Target: dist/portal-qa-review.html
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { QAEngine } from '../lib/qa-engine.js';

const PORT = 8855;
const CHROME_PORT = 9598;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = path.join(process.cwd(), '.tmp_qa_gate_chrome');

console.log('='.repeat(80));
console.log('UJI VERIFIKASI RESMI: GERBANG LOGIN TOKEN/NIK & RBAC PORTAL QA REVIEW');
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
console.log('\n--- 1. UJI UNIT: lib/qa-engine.js ---');
const engine = new QAEngine();

const srvCheck = engine.checkRoleAccess('SURVEYOR');
assert(srvCheck.allowed === false, 'checkRoleAccess("SURVEYOR") -> allowed: false');

const srvTokenCheck = engine.checkRoleAccess('NSR-SRV-2026');
assert(srvTokenCheck.allowed === false, 'checkRoleAccess("NSR-SRV-2026") -> allowed: false');

const penilaiCheck = engine.checkRoleAccess('PENILAI');
assert(penilaiCheck.allowed === true, 'checkRoleAccess("PENILAI") -> allowed: true');

const valTokenCheck = engine.checkRoleAccess('NSR-VAL-2026');
assert(valTokenCheck.allowed === true, 'checkRoleAccess("NSR-VAL-2026") -> allowed: true');

const spmCheck = engine.checkRoleAccess('REVIEWER_SPM');
assert(spmCheck.allowed === true, 'checkRoleAccess("REVIEWER_SPM") -> allowed: true');

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
console.log(`\nServer statis aktif di http://localhost:${PORT}`);

// ---------------------------------------------------------------------
// 3. LAUNCH CHROME HEADLESS CDP
// ---------------------------------------------------------------------
console.log('\n--- 2. Meluncurkan Headless Chrome CDP ---');
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
        await new Promise(r => setTimeout(r, 300));
        return;
      }
    }
  }

  // -------------------------------------------------------------
  // TEST 1: FRESH VISIT TANPA SESI (MODAL LOGIN GATE TAMPIL)
  // -------------------------------------------------------------
  console.log('\n[UJI 1] Buka portal-qa-review.html tanpa sesi di sessionStorage...');
  await navigateAndWait(`http://localhost:${PORT}/portal-qa-review.html`);

  const gateRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const authModal = document.getElementById('modal-auth-gate');
      const ws = document.getElementById('main-qa-workspace');
      const srvModal = document.getElementById('modal-surveyor-locked');
      const inputEl = document.getElementById('auth-input-token');
      const title = authModal ? authModal.querySelector('h3')?.textContent : '';
      return {
        authModalVisible: authModal ? !authModal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none') : false,
        surveyorModalHidden: srvModal ? srvModal.classList.contains('hidden') : false,
        hasInput: Boolean(inputEl),
        title: title
      };
    })()`,
    returnByValue: true
  });

  assert(gateRes.result.value.authModalVisible === true, 'Modal Login Gate (#modal-auth-gate) HARUS muncul saat belum ada sesi');
  assert(gateRes.result.value.workspaceHidden === true, 'Workspace teknis (#main-qa-workspace) HARUS terkunci rapat (display: none)');
  assert(gateRes.result.value.surveyorModalHidden === true, 'Modal penolakan surveyor TIDAK boleh muncul secara acak');
  assert(gateRes.result.value.hasInput === true, 'Kolom input token/NIK (#auth-input-token) tersedia');
  assert(gateRes.result.value.title.includes('Otentikasi Personel QA & SPM'), `Judul modal otentikasi tepat: "${gateRes.result.value.title}"`);
  await captureProof('bukti_qa_gate_login_modal.png');

  // -------------------------------------------------------------
  // TEST 2: INPUT KREDENSIAL SALAH / TIDAK DIKENALI
  // -------------------------------------------------------------
  console.log('\n[UJI 2] Input Token Salah: "NSR-SALAH-999"...');
  const errorRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-SALAH-999';
      const success = window.eksekusiLoginQA();
      const errBox = document.getElementById('auth-error-msg');
      const errText = document.getElementById('auth-error-text')?.textContent;
      const ws = document.getElementById('main-qa-workspace');
      return {
        loginSuccess: success,
        errVisible: errBox ? !errBox.classList.contains('hidden') : false,
        errText: errText,
        workspaceHidden: ws ? (ws.style.display === 'none') : false
      };
    })()`,
    returnByValue: true
  });

  assert(errorRes.result.value.loginSuccess === false, 'eksekusiLoginQA() harus mengembalikan false untuk token tidak valid');
  assert(errorRes.result.value.errVisible === true, 'Pesan error merah (#auth-error-msg) harus ditampilkan');
  assert(errorRes.result.value.errText.includes('Token / NIK tidak terdaftar di sistem KJPP NSR'), `Teks error sesuai: "${errorRes.result.value.errText}"`);
  assert(errorRes.result.value.workspaceHidden === true, 'Workspace tetap terkunci rapat');
  await captureProof('bukti_qa_gate_login_error.png');

  // -------------------------------------------------------------
  // TEST 3: LOGIN TOKEN PENILAI PENYUSUN (NSR-VAL-2026)
  // -------------------------------------------------------------
  console.log('\n[UJI 3] Login Token Penilai: "NSR-VAL-2026"...');
  const valuerLoginRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-VAL-2026';
      const success = window.eksekusiLoginQA();
      const authModal = document.getElementById('modal-auth-gate');
      const ws = document.getElementById('main-qa-workspace');
      const srvModal = document.getElementById('modal-surveyor-locked');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const noticeValuer = document.getElementById('notice-valuer-spm');
      const bannerHint = document.getElementById('role-mode-hint')?.textContent;
      const sess = JSON.parse(sessionStorage.getItem('nsr_user_session') || '{}');

      return {
        loginSuccess: success,
        authModalHidden: authModal ? authModal.classList.contains('hidden') : false,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        srvModalHidden: srvModal ? srvModal.classList.contains('hidden') : false,
        badgeRole: badgeRole,
        sessionRole: sess.role,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiHidden: btnRevisi ? (btnRevisi.style.display === 'none') : false,
        noticeValuerVisible: noticeValuer ? !noticeValuer.classList.contains('hidden') : false,
        bannerHint: bannerHint
      };
    })()`,
    returnByValue: true
  });

  assert(valuerLoginRes.result.value.loginSuccess === true, 'Login berhasil untuk token Penilai (NSR-VAL-2026)');
  assert(valuerLoginRes.result.value.authModalHidden === true, 'Modal Login Gate tertutup setelah login');
  assert(valuerLoginRes.result.value.workspaceVisible === true, 'Workspace teknis QA langsung terbuka');
  assert(valuerLoginRes.result.value.srvModalHidden === true, 'Modal lockout surveyor tetap tersembunyi');
  assert(valuerLoginRes.result.value.badgeRole === '[Penilai Penyusun - M-04]', `Badge identitas header tepat: "${valuerLoginRes.result.value.badgeRole}"`);
  assert(valuerLoginRes.result.value.sessionRole === 'PENILAI', `Session role adalah PENILAI (Aktual: ${valuerLoginRes.result.value.sessionRole})`);
  assert(valuerLoginRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Penilai');
  assert(valuerLoginRes.result.value.btnRevisiHidden === true, 'Tombol Kirim Revisi disembunyikan untuk Penilai (Anti Self-Review)');
  assert(valuerLoginRes.result.value.noticeValuerVisible === true, 'Notice Anti Self-Review ditampilkan di panel aksi');
  assert(valuerLoginRes.result.value.bannerHint.includes('Mode Penilai Penyusun: Anda dapat meninjau hasil audit otomatis SPI'), 'Banner instruksi sesuai aturan Anti Self-Review');
  await captureProof('bukti_qa_gate_penilai_workspace.png');

  // -------------------------------------------------------------
  // TEST 4: FITUR GANTI AKUN / KELUAR DARI HEADER
  // -------------------------------------------------------------
  console.log('\n[UJI 4] Uji Tombol "🚪 Ganti Akun / Keluar" di Header...');
  const logoutRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      window.logoutQASession();
      const authModal = document.getElementById('modal-auth-gate');
      const ws = document.getElementById('main-qa-workspace');
      const srvModal = document.getElementById('modal-surveyor-locked');
      const sess = sessionStorage.getItem('nsr_user_session');
      const input = document.getElementById('auth-input-token');
      return {
        authModalVisible: authModal ? !authModal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none') : false,
        srvModalHidden: srvModal ? srvModal.classList.contains('hidden') : false,
        sessionCleared: sess === null,
        inputValueCleared: input ? input.value === '' : false
      };
    })()`,
    returnByValue: true
  });

  assert(logoutRes.result.value.sessionCleared === true, 'sessionStorage nsr_user_session berhasil dihapus total');
  assert(logoutRes.result.value.workspaceHidden === true, 'Workspace langsung tertutup kembali');
  assert(logoutRes.result.value.authModalVisible === true, 'Modal Login Gate (#modal-auth-gate) kembali tampil bersih');
  assert(logoutRes.result.value.inputValueCleared === true, 'Kolom input token/NIK dibersihkan siap menerima input baru');

  // -------------------------------------------------------------
  // TEST 5: LOGIN TOKEN SURVEYOR LAPANGAN (NSR-SRV-2026)
  // -------------------------------------------------------------
  console.log('\n[UJI 5] Login Token Surveyor: "NSR-SRV-2026"...');
  const srvLoginRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-SRV-2026';
      const success = window.eksekusiLoginQA();
      const authModal = document.getElementById('modal-auth-gate');
      const ws = document.getElementById('main-qa-workspace');
      const srvModal = document.getElementById('modal-surveyor-locked');
      const sess = JSON.parse(sessionStorage.getItem('nsr_user_session') || '{}');
      const hasLogoutBtn = Boolean(srvModal && srvModal.querySelector('button[onclick*="logoutQASession"]'));

      return {
        loginSuccess: success,
        authModalHidden: authModal ? authModal.classList.contains('hidden') : false,
        srvModalVisible: srvModal ? !srvModal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none') : false,
        sessionRole: sess.role,
        hasLogoutBtn: hasLogoutBtn
      };
    })()`,
    returnByValue: true
  });

  assert(srvLoginRes.result.value.loginSuccess === true, 'Input token Surveyor diproses');
  assert(srvLoginRes.result.value.authModalHidden === true, 'Modal Login Gate tertutup');
  assert(srvLoginRes.result.value.srvModalVisible === true, 'Modal Lockout Surveyor (#modal-surveyor-locked) HARUS muncul');
  assert(srvLoginRes.result.value.workspaceHidden === true, 'Workspace teknis QA TETAP terkunci rapat (display: none)');
  assert(srvLoginRes.result.value.sessionRole === 'SURVEYOR', `Session role adalah SURVEYOR (Aktual: ${srvLoginRes.result.value.sessionRole})`);
  assert(srvLoginRes.result.value.hasLogoutBtn === true, 'Tombol "🚪 Ganti Akun / Logout" tersedia di modal surveyor');
  await captureProof('bukti_qa_gate_surveyor_locked.png');

  // -------------------------------------------------------------
  // TEST 6: LOGOUT DARI MODAL SURVEYOR
  // -------------------------------------------------------------
  console.log('\n[UJI 6] Klik Logout dari Modal Surveyor...');
  const srvLogoutRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      window.logoutQASession();
      const authModal = document.getElementById('modal-auth-gate');
      const srvModal = document.getElementById('modal-surveyor-locked');
      return {
        srvModalHidden: srvModal ? srvModal.classList.contains('hidden') : false,
        authModalVisible: authModal ? !authModal.classList.contains('hidden') : false
      };
    })()`,
    returnByValue: true
  });

  assert(srvLogoutRes.result.value.srvModalHidden === true, 'Modal lockout surveyor tertutup');
  assert(srvLogoutRes.result.value.authModalVisible === true, 'Kembali ke Modal Login Gate resmi');

  // -------------------------------------------------------------
  // TEST 7: LOGIN REVIEWER SPM VIA NIK (NSR-2019-007)
  // -------------------------------------------------------------
  console.log('\n[UJI 7] Login NIK Reviewer SPM: "NSR-2019-007" (Tedi Setiadi)...');
  const spmLoginRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-2019-007';
      const success = window.eksekusiLoginQA();
      const ws = document.getElementById('main-qa-workspace');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const sess = JSON.parse(sessionStorage.getItem('nsr_user_session') || '{}');

      return {
        loginSuccess: success,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeRole: badgeRole,
        sessionRole: sess.role,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false
      };
    })()`,
    returnByValue: true
  });

  assert(spmLoginRes.result.value.loginSuccess === true, 'Login berhasil untuk NIK Reviewer SPM');
  assert(spmLoginRes.result.value.workspaceVisible === true, 'Workspace teknis QA terbuka');
  assert(spmLoginRes.result.value.badgeRole === '[Tim Reviewer SPM - M-05]', `Badge identitas header tepat: "${spmLoginRes.result.value.badgeRole}"`);
  assert(spmLoginRes.result.value.sessionRole === 'REVIEWER_SPM', 'Session role adalah REVIEWER_SPM');
  assert(spmLoginRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Reviewer (khusus Pimpinan)');
  assert(spmLoginRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Reviewer SPM');
  await captureProof('bukti_qa_gate_reviewer_spm.png');

  // -------------------------------------------------------------
  // TEST 8: LOGIN PIMPINAN REKAN VIA NIK (NSR-2019-005)
  // -------------------------------------------------------------
  console.log('\n[UJI 8] Login NIK Rekan / Kepala SPM: "NSR-2019-005" (Danny Taufik)...');
  const rekanLoginRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      window.logoutQASession();
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-2019-005';
      const success = window.eksekusiLoginQA();
      const ws = document.getElementById('main-qa-workspace');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const sess = JSON.parse(sessionStorage.getItem('nsr_user_session') || '{}');

      return {
        loginSuccess: success,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeRole: badgeRole,
        sessionRole: sess.role,
        btnOverrideVisible: btnOverride ? (btnOverride.style.display !== 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false
      };
    })()`,
    returnByValue: true
  });

  assert(rekanLoginRes.result.value.loginSuccess === true, 'Login berhasil untuk NIK Pimpinan Rekan');
  assert(rekanLoginRes.result.value.workspaceVisible === true, 'Workspace teknis QA terbuka');
  assert(rekanLoginRes.result.value.badgeRole === '[Pimpinan Rekan / Kepala SPM]', `Badge identitas header tepat: "${rekanLoginRes.result.value.badgeRole}"`);
  assert(rekanLoginRes.result.value.sessionRole === 'REKAN', 'Session role adalah REKAN');
  assert(rekanLoginRes.result.value.btnOverrideVisible === true, 'Tombol Override Gate aktif untuk Pimpinan Rekan');
  assert(rekanLoginRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Pimpinan Rekan');
  await captureProof('bukti_qa_gate_rekan_pimpinan.png');

} finally {
  console.log('\n--- Membersihkan Proses Headless ---');
  try { chrome.kill(); } catch (_) {}
  try { server.close(); } catch (_) {}
}

console.log('\n' + '='.repeat(80));
console.log(`TOTAL PENGUJIAN: ${totalAsserts} | LULUS: ${passedAsserts} | GAGAL: ${failedAsserts}`);
console.log('='.repeat(80));

if (failedAsserts > 0) {
  process.exit(1);
} else {
  console.log('SEMUA PENGUJIAN GERBANG LOGIN TOKEN/NIK & RBAC LULUS SEMPURNA 100%!');
  process.exit(0);
}
