/**
 * scripts/verify-qa-auth-gate-local.mjs
 * Pengujian Komprehensif Gerbang Login Token/NIK & Otorisasi Peran RBAC
 * Target: dist/portal-qa-review.html
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { QAEngine } from '../lib/qa-engine.js';

const PORT = 8855;
const CHROME_PORT = 9598;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-qa-auth-'));

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

try {
  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      if (v.ok) { connected = true; break; }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 250));
  }
  if (!connected) throw new Error('Gagal menghubungkan ke Chrome CDP pada port ' + CHROME_PORT);

  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();

  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
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

  // Tangani otomatis dialog JavaScript dan cetak log browser
  ws.addEventListener('message', (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const txt = data.params.args.map(a => a.value || a.description).join(' ');
        console.log('BROWSER CONSOLE:', txt);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        console.error('BROWSER EXCEPTION:', data.params.exceptionDetails?.text, data.params.exceptionDetails?.exception?.description);
      }
      if (data.method === 'Page.javascriptDialogOpening') {
        sendCdp('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      }
    } catch (_) {}
  });

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
      const labelEl = authModal ? authModal.querySelector('label[for="auth-input-token"]')?.textContent?.trim() : '';
      const descEl = authModal ? authModal.querySelector('p')?.textContent?.trim() : '';
      const title = authModal ? authModal.querySelector('h3')?.textContent : '';
      const placeholder = inputEl ? inputEl.getAttribute('placeholder') : '';
      const hasLeakedSample = /NSR|VAL|SRV|2019|CONTOH/i.test(placeholder);
      const headerBadge = Array.from(document.querySelectorAll('header span')).find(s => (s.className || '').includes('bg-cyan-950'));
      const userBadgeName = document.getElementById('user-badge-name')?.textContent;
      const userBadgeRole = document.getElementById('user-badge-role')?.textContent;
      const userBadgeAvatar = document.getElementById('user-badge-avatar')?.textContent?.trim();

      return {
        authModalVisible: authModal ? !authModal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none') : false,
        surveyorModalHidden: srvModal ? srvModal.classList.contains('hidden') : false,
        hasInput: Boolean(inputEl),
        title: title,
        label: labelEl,
        desc: descEl,
        placeholder: placeholder,
        hasLeakedSample: hasLeakedSample,
        headerBadgeText: headerBadge ? headerBadge.textContent.trim() : '',
        headerBadgeTitle: headerBadge ? headerBadge.getAttribute('title') : '',
        userBadgeName: userBadgeName,
        userBadgeRole: userBadgeRole,
        userBadgeAvatar: userBadgeAvatar
      };
    })()`,
    returnByValue: true
  });


  assert(gateRes.result.value.authModalVisible === true, 'Modal Login Gate (#modal-auth-gate) HARUS muncul saat belum ada sesi');
  assert(gateRes.result.value.workspaceHidden === true, 'Workspace teknis (#main-qa-workspace) HARUS terkunci rapat (display: none)');
  assert(gateRes.result.value.surveyorModalHidden === true, 'Modal penolakan surveyor TIDAK boleh muncul secara acak');
  assert(gateRes.result.value.hasInput === true, 'Kolom input token/NIK (#auth-input-token) tersedia');
  assert(gateRes.result.value.label === 'Token NIK', `Label form harus "Token NIK" (Aktual: "${gateRes.result.value.label}")`);
  assert(gateRes.result.value.desc.includes('Silakan masukkan Token NIK resmi Anda untuk verifikasi hak akses'), 'Deskripsi modal formal dan tersanitasi');
  assert(gateRes.result.value.placeholder === 'Masukkan Token NIK Anda', `Placeholder netral: "${gateRes.result.value.placeholder}"`);
  assert(gateRes.result.value.hasLeakedSample === false, 'KEAMANAN TERTINGGI: Placeholder BEBAS 100% dari contoh token/NIK yang bocor');
  assert(gateRes.result.value.title.includes('Otentikasi Personel QA & SPM'), `Judul modal otentikasi tepat: "${gateRes.result.value.title}"`);
  assert(gateRes.result.value.headerBadgeText === 'KEPI & SPI', `Badge resmi standar profesi: "${gateRes.result.value.headerBadgeText}"`);
  assert(gateRes.result.value.headerBadgeTitle.includes('Standar Penilaian Indonesia & Kode Etik Penilai Indonesia'), 'Tooltip header badge memuat KEPI & SPI lengkap');
  assert(gateRes.result.value.userBadgeName === 'Personel QA & SPM', `Header user badge awal netral: "${gateRes.result.value.userBadgeName}"`);
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
  assert(errorRes.result.value.errText.includes('Token NIK tidak valid. Hubungi administrator internal.'), `Teks error tersanitasi: "${errorRes.result.value.errText}"`);
  assert(errorRes.result.value.workspaceHidden === true, 'Workspace tetap terkunci rapat');
  await captureProof('bukti_qa_gate_login_error.png');

  // -------------------------------------------------------------
  // TEST 3: PENEGAKAN ZERO-ANONYMOUS LOGIN POLICY (NSR-VAL-2026 + NIK)
  // -------------------------------------------------------------
  console.log('\n[UJI 3] Penegakan Kebijakan Zero-Anonymous: Token Bersama Divisi "NSR-VAL-2026"...');
  const zeroAnonRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-VAL-2026';
      // Step 1: Submit token bersama tanpa mengisi NIK pelaksana
      const holdRes = window.eksekusiLoginQA();
      const stepNik = document.getElementById('auth-step-nik');
      const inputNik = document.getElementById('auth-input-nik');
      const ws = document.getElementById('main-qa-workspace');
      const authModal = document.getElementById('modal-auth-gate');
      const errText = document.getElementById('auth-error-text')?.textContent;

      const step1Result = {
        holdSuccess: (holdRes === false),
        stepNikVisible: stepNik ? !stepNik.classList.contains('hidden') : false,
        workspaceStillLocked: ws ? (ws.style.display === 'none') : false,
        authModalStillOpen: authModal ? !authModal.classList.contains('hidden') : false,
        errText: errText
      };

      // Step 2: Masukkan NIK resmi personel pelaksana (Yoga Anfiar Pradipta - NSR-2025-023)
      inputNik.value = 'NSR-2025-023';
      const loginSuccess = window.eksekusiLoginQA();
      const badgeName = document.getElementById('user-badge-name')?.textContent;
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const badgeAvatar = document.getElementById('user-badge-avatar')?.textContent?.trim();
      const metaUploader = document.getElementById('meta-uploader')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const noticeValuer = document.getElementById('notice-valuer-spm');
      const sess = JSON.parse(sessionStorage.getItem('nsr_user_session') || '{}');

      return {
        step1: step1Result,
        loginSuccess: loginSuccess,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        authModalHidden: authModal ? authModal.classList.contains('hidden') : false,
        badgeName: badgeName,
        badgeRole: badgeRole,
        badgeAvatar: badgeAvatar,
        metaUploader: metaUploader,
        sessionRole: sess.role,
        sessionNik: sess.nik,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiHidden: btnRevisi ? (btnRevisi.style.display === 'none') : false,
        noticeValuerVisible: noticeValuer ? !noticeValuer.classList.contains('hidden') : false
      };
    })()`,
    returnByValue: true
  });


  assert(zeroAnonRes.result.value.step1.holdSuccess === true, 'Akses DITAHAN saat token bersama dimasukkan tanpa NIK (Zero-Anonymous Policy)');
  assert(zeroAnonRes.result.value.step1.stepNikVisible === true, 'Input NIK Pelaksana (#auth-step-nik) otomatis dimunculkan');
  assert(zeroAnonRes.result.value.step1.workspaceStillLocked === true, 'Workspace tetap terkunci rapat saat NIK belum diisi');
  assert(zeroAnonRes.result.value.loginSuccess === true, 'Login berhasil setelah NIK resmi (NSR-2025-023) dimasukkan');
  assert(zeroAnonRes.result.value.workspaceVisible === true, 'Workspace teknis QA terbuka setelah verifikasi NIK');
  assert(zeroAnonRes.result.value.badgeName === 'Yoga Anfiar Pradipta', `Header name adalah Yoga Anfiar Pradipta (Aktual: "${zeroAnonRes.result.value.badgeName}")`);
  assert(zeroAnonRes.result.value.badgeRole === 'Penilai Properti / Analis KKP • NIK: NSR-2025-023', `Header role berformat [Jabatan] • NIK: [NIK] (Aktual: "${zeroAnonRes.result.value.badgeRole}")`);
  assert(zeroAnonRes.result.value.badgeAvatar === 'Y', `Inisial avatar dinamis huruf awal nama Yoga: "${zeroAnonRes.result.value.badgeAvatar}"`);
  assert(zeroAnonRes.result.value.metaUploader.includes('Yoga Anfiar Pradipta (NSR-2025-023)'), `Metadata uploader berformat [Nama] ([NIK]) (Aktual: "${zeroAnonRes.result.value.metaUploader}")`);
  assert(zeroAnonRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Penilai');
  assert(zeroAnonRes.result.value.btnRevisiHidden === true, 'Tombol Kirim Revisi disembunyikan untuk Penilai (Anti Self-Review)');
  assert(zeroAnonRes.result.value.noticeValuerVisible === true, 'Notice Anti Self-Review aktif');
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
      const inputNik = document.getElementById('auth-input-nik');
      const stepNik = document.getElementById('auth-step-nik');

      return {
        authModalVisible: authModal ? !authModal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none') : false,
        srvModalHidden: srvModal ? srvModal.classList.contains('hidden') : false,
        sessionCleared: sess === null,
        inputValueCleared: input ? input.value === '' : false,
        nikValueCleared: inputNik ? inputNik.value === '' : false,
        stepNikHidden: stepNik ? stepNik.classList.contains('hidden') : false
      };
    })()`,
    returnByValue: true
  });


  assert(logoutRes.result.value.sessionCleared === true, 'sessionStorage nsr_user_session berhasil dihapus total');
  assert(logoutRes.result.value.workspaceHidden === true, 'Workspace langsung tertutup kembali');
  assert(logoutRes.result.value.authModalVisible === true, 'Modal Login Gate (#modal-auth-gate) kembali tampil bersih');
  assert(logoutRes.result.value.inputValueCleared === true, 'Kolom input token/NIK dibersihkan siap menerima input baru');
  assert(logoutRes.result.value.stepNikHidden === true, 'Step input NIK kembali disembunyikan');

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
  // TEST 7: LOGIN REVIEWER SPM VIA NIK LANGSUNG (NSR-2019-007)
  // -------------------------------------------------------------
  console.log('\n[UJI 7] Login NIK Reviewer SPM: "NSR-2019-007" (Tedi Setiadi)...');
  const spmLoginRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-2019-007';
      const success = window.eksekusiLoginQA();
      const ws = document.getElementById('main-qa-workspace');
      const badgeName = document.getElementById('user-badge-name')?.textContent;
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const badgeAvatar = document.getElementById('user-badge-avatar')?.textContent?.trim();
      const metaUploader = document.getElementById('meta-uploader')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const sess = JSON.parse(sessionStorage.getItem('nsr_user_session') || '{}');

      return {
        loginSuccess: success,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeName: badgeName,
        badgeRole: badgeRole,
        badgeAvatar: badgeAvatar,
        metaUploader: metaUploader,
        sessionRole: sess.role,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false
      };
    })()`,
    returnByValue: true
  });


  assert(spmLoginRes.result.value.loginSuccess === true, 'Login berhasil untuk NIK Reviewer SPM');
  assert(spmLoginRes.result.value.workspaceVisible === true, 'Workspace teknis QA terbuka');
  assert(spmLoginRes.result.value.badgeName === 'Tedi Setiadi', `Header name Reviewer SPM: "${spmLoginRes.result.value.badgeName}"`);
  assert(spmLoginRes.result.value.badgeRole === 'Technical Reviewer SPM • NIK: NSR-2019-007', `Header role Reviewer SPM: "${spmLoginRes.result.value.badgeRole}"`);
  assert(spmLoginRes.result.value.badgeAvatar === 'T', `Inisial avatar Tedi Setiadi adalah T: "${spmLoginRes.result.value.badgeAvatar}"`);
  assert(spmLoginRes.result.value.sessionRole === 'REVIEWER_SPM', 'Session role adalah REVIEWER_SPM');
  assert(spmLoginRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Reviewer (khusus Pimpinan)');
  assert(spmLoginRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Reviewer SPM');
  await captureProof('bukti_qa_gate_reviewer_spm.png');

  // -------------------------------------------------------------
  // TEST 8: LOGIN PIMPINAN REKAN VIA NIK (NSR-2019-005)
  // -------------------------------------------------------------
  console.log('\n[UJI 8] Login NIK Rekan / Kepala SPM: "NSR-2019-005" (Danny Taufik Hidayat, S.H.)...');
  const rekanLoginRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      window.logoutQASession();
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-2019-005';
      const success = window.eksekusiLoginQA();
      const ws = document.getElementById('main-qa-workspace');
      const badgeName = document.getElementById('user-badge-name')?.textContent;
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const badgeAvatar = document.getElementById('user-badge-avatar')?.textContent?.trim();
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const sess = JSON.parse(sessionStorage.getItem('nsr_user_session') || '{}');

      return {
        loginSuccess: success,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeName: badgeName,
        badgeRole: badgeRole,
        badgeAvatar: badgeAvatar,
        sessionRole: sess.role,
        btnOverrideVisible: btnOverride ? (btnOverride.style.display !== 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false
      };
    })()`,
    returnByValue: true
  });


  assert(rekanLoginRes.result.value.loginSuccess === true, 'Login berhasil untuk NIK Danny Taufik Hidayat');
  assert(rekanLoginRes.result.value.workspaceVisible === true, 'Workspace teknis QA terbuka');
  assert(rekanLoginRes.result.value.badgeName === 'Danny Taufik Hidayat, S.H.', `Header name Danny Taufik: "${rekanLoginRes.result.value.badgeName}"`);
  assert(rekanLoginRes.result.value.badgeRole === 'Manager Administrasi & Umum / Pengendali Mutu SPM • NIK: NSR-2019-005', `Header role Danny Taufik: "${rekanLoginRes.result.value.badgeRole}"`);
  assert(rekanLoginRes.result.value.badgeAvatar === 'D', `Inisial avatar Danny Taufik adalah D: "${rekanLoginRes.result.value.badgeAvatar}"`);
  assert(rekanLoginRes.result.value.sessionRole === 'REKAN', 'Session role adalah REKAN');
  assert(rekanLoginRes.result.value.btnOverrideVisible === true, 'Tombol Override Gate aktif untuk Kepala SPM');
  assert(rekanLoginRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Kepala SPM');
  await captureProof('bukti_qa_gate_rekan_pimpinan.png');

  // -------------------------------------------------------------
  // TEST 9: LOGIN REKAN / KEPALA CABANG BANDUNG (NSR-2019-002 - DENI SISWANDI)
  // -------------------------------------------------------------
  console.log('\n[UJI 9] Login NIK Rekan Bandung: "NSR-2019-002" (Deni Siswandi, S.T., MAPPI (Cert.))...');
  const deniLoginRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      window.logoutQASession();
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-2019-002';
      const success = window.eksekusiLoginQA();
      const ws = document.getElementById('main-qa-workspace');
      const badgeName = document.getElementById('user-badge-name')?.textContent;
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const badgeAvatar = document.getElementById('user-badge-avatar')?.textContent?.trim();
      const bodyText = document.body.innerText;
      const hasRomansyah = bodyText.includes('Romansyah');

      return {
        loginSuccess: success,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeName: badgeName,
        badgeRole: badgeRole,
        badgeAvatar: badgeAvatar,
        hasRomansyah: hasRomansyah
      };
    })()`,
    returnByValue: true
  });


  assert(deniLoginRes.result.value.loginSuccess === true, 'Login berhasil untuk NIK Deni Siswandi');
  assert(deniLoginRes.result.value.badgeName === 'Deni Siswandi, S.T., MAPPI (Cert.)', `Header name Deni Siswandi tepat: "${deniLoginRes.result.value.badgeName}"`);
  assert(deniLoginRes.result.value.badgeRole === 'Rekan / Kepala Cabang Bandung • NIK: NSR-2019-002', `Header role Deni Siswandi: "${deniLoginRes.result.value.badgeRole}"`);
  assert(deniLoginRes.result.value.badgeAvatar === 'D', `Inisial avatar Deni Siswandi adalah D: "${deniLoginRes.result.value.badgeAvatar}"`);
  assert(deniLoginRes.result.value.hasRomansyah === false, 'KEAMANAN DATA: Nama fiktif "Romansyah" 100% TIDAK ADA di halaman');

  // -------------------------------------------------------------
  // TEST 10: LOGIN STAF KENDALI MUTU (NSR-2025-021 - DHEA SAFITRI NINGRUM)
  // -------------------------------------------------------------
  console.log('\n[UJI 10] Login NIK Staf Mutu: "NSR-2025-021" (Dhea Safitri Ningrum)...');
  const dheaLoginRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      window.logoutQASession();
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-2025-021';
      const success = window.eksekusiLoginQA();
      const ws = document.getElementById('main-qa-workspace');
      const badgeName = document.getElementById('user-badge-name')?.textContent;
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const badgeAvatar = document.getElementById('user-badge-avatar')?.textContent?.trim();

      return {
        loginSuccess: success,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeName: badgeName,
        badgeRole: badgeRole,
        badgeAvatar: badgeAvatar
      };
    })()`,
    returnByValue: true
  });


  assert(dheaLoginRes.result.value.loginSuccess === true, 'Login berhasil untuk NIK Dhea Safitri Ningrum');
  assert(dheaLoginRes.result.value.badgeName === 'Dhea Safitri Ningrum', `Header name Dhea Safitri tepat: "${dheaLoginRes.result.value.badgeName}"`);
  assert(dheaLoginRes.result.value.badgeRole === 'Staf Administrasi & Kendali Mutu • NIK: NSR-2025-021', `Header role Dhea Safitri: "${dheaLoginRes.result.value.badgeRole}"`);
  assert(dheaLoginRes.result.value.badgeAvatar === 'D', `Inisial avatar Dhea Safitri adalah D: "${dheaLoginRes.result.value.badgeAvatar}"`);

} finally {
  console.log('\n--- Membersihkan Proses Headless ---');
  try { chrome.kill(); } catch (_) {}
  try { server.close(); } catch (_) {}
  try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch (_) {}
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
