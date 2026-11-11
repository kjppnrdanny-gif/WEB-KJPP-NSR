/**
 * scripts/verify-live-qa-rbac.mjs
 * Live Chrome CDP verification on production server: https://kjppnanangrahayu.com
 * Verifies official Authentication Gate Modal, token/NIK dispatching, switch account, and strict RBAC.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const BASE_URL = 'https://kjppnanangrahayu.com';
const CHROME_PORT = 9597;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = path.join(process.cwd(), '.tmp_qa_live_chrome');

console.log('='.repeat(80));
console.log('LIVE VERIFIKASI: GERBANG LOGIN TOKEN/NIK & RBAC PORTAL QA REVIEW CPANEL');
console.log('Domain Target: ' + BASE_URL);
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
      await new Promise(r => setTimeout(r, 300));
      const res = await sendCdp('Runtime.evaluate', {
        expression: 'Boolean(window.__qa_initialized)'
      });
      if (res?.result?.value === true) {
        await new Promise(r => setTimeout(r, 500));
        return;
      }
    }
  }

  // 1. LIVE TEST FRESH VISIT TANPA SESI (MODAL AUTH GATE TAMPIL)
  console.log('\n[LIVE TEST 1] Kunjungan Perdana tanpa sesi login: ' + BASE_URL + '/portal-qa-review.html');
  await navigateAndWait(`${BASE_URL}/portal-qa-review.html?_t=${Date.now()}`);

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

      return {
        authModalVisible: authModal ? !authModal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none') : false,
        srvModalHidden: srvModal ? srvModal.classList.contains('hidden') : false,
        hasInput: Boolean(inputEl),
        title: title,
        label: labelEl,
        desc: descEl,
        placeholder: placeholder,
        hasLeakedSample: hasLeakedSample
      };
    })()`,
    returnByValue: true
  });

  assert(gateRes.result.value.authModalVisible === true, 'Modal Otentikasi Resmi (#modal-auth-gate) HARUS aktif di live server');
  assert(gateRes.result.value.workspaceHidden === true, 'Workspace teknis QA HARUS terkunci rapat (display: none)');
  assert(gateRes.result.value.srvModalHidden === true, 'Modal surveyor lockout tidak boleh muncul secara acak');
  assert(gateRes.result.value.hasInput === true, 'Kolom input token/NIK resmi tersedia di live server');
  assert(gateRes.result.value.label === 'Token NIK', `Label form live harus "Token NIK" (Aktual: "${gateRes.result.value.label}")`);
  assert(gateRes.result.value.desc.includes('Silakan masukkan Token NIK resmi Anda untuk verifikasi hak akses'), 'Deskripsi modal live tersanitasi');
  assert(gateRes.result.value.placeholder === 'Masukkan Token NIK Anda', `Placeholder live netral: "${gateRes.result.value.placeholder}"`);
  assert(gateRes.result.value.hasLeakedSample === false, 'KEAMANAN TERTINGGI: Placeholder live BEBAS 100% dari contoh token/NIK bocor');
  assert(gateRes.result.value.title.includes('Otentikasi Personel QA & SPM'), `Judul modal otentikasi live sesuai: "${gateRes.result.value.title}"`);
  await captureProof('bukti_live_qa_auth_gate_modal.png');

  // 2. LIVE TEST TOKEN SALAH (NSR-SALAH-999)
  console.log('\n[LIVE TEST 2] Uji Validasi Token Salah di live server...');
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

  assert(errorRes.result.value.loginSuccess === false, 'eksekusiLoginQA() menolak token palsu di live server');
  assert(errorRes.result.value.errVisible === true, 'Pesan error merah (#auth-error-msg) muncul');
  assert(errorRes.result.value.errText.includes('Token NIK tidak valid. Hubungi administrator internal.'), `Pesan error tersanitasi: "${errorRes.result.value.errText}"`);
  assert(errorRes.result.value.workspaceHidden === true, 'Workspace teknis tetap terkunci');

  // 3. LIVE TEST LOGIN TOKEN PENILAI (NSR-VAL-2026)
  console.log('\n[LIVE TEST 3] Login Token Penilai Penyusun (NSR-VAL-2026)...');
  const valuerRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-VAL-2026';
      const success = window.eksekusiLoginQA();
      const authModal = document.getElementById('modal-auth-gate');
      const ws = document.getElementById('main-qa-workspace');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const noticeValuer = document.getElementById('notice-valuer-spm');
      const bannerHint = document.getElementById('role-mode-hint')?.textContent;
      return {
        loginSuccess: success,
        authModalHidden: authModal ? authModal.classList.contains('hidden') : false,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeRole: badgeRole,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiHidden: btnRevisi ? (btnRevisi.style.display === 'none') : false,
        noticeValuerVisible: noticeValuer ? !noticeValuer.classList.contains('hidden') : false,
        bannerHint: bannerHint
      };
    })()`,
    returnByValue: true
  });

  assert(valuerRes.result.value.loginSuccess === true, 'Login Penilai (NSR-VAL-2026) berhasil di live server');
  assert(valuerRes.result.value.authModalHidden === true, 'Modal Login Gate tertutup otomatis');
  assert(valuerRes.result.value.workspaceVisible === true, 'Workspace teknis QA terbuka');
  assert(valuerRes.result.value.badgeRole === '[Penilai Penyusun - M-04]', `Badge role live: "${valuerRes.result.value.badgeRole}"`);
  assert(valuerRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Penilai');
  assert(valuerRes.result.value.btnRevisiHidden === true, 'Tombol Kirim Revisi disembunyikan untuk Penilai (Anti Self-Review)');
  assert(valuerRes.result.value.noticeValuerVisible === true, 'Kotak notifikasi Anti Self-Review tampil');
  assert(valuerRes.result.value.bannerHint.includes('Mode Penilai Penyusun: Anda dapat meninjau hasil audit otomatis SPI'), 'Instruksi banner live sesuai aturan Anti Self-Review');
  await captureProof('bukti_live_qa_token_nsr_val_2026.png');

  // 4. LIVE TEST GANTI AKUN / KELUAR
  console.log('\n[LIVE TEST 4] Uji Tombol "🚪 Ganti Akun / Keluar" di Header live server...');
  const logoutRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      window.logoutQASession();
      const authModal = document.getElementById('modal-auth-gate');
      const ws = document.getElementById('main-qa-workspace');
      const sess = sessionStorage.getItem('nsr_user_session');
      return {
        authModalVisible: authModal ? !authModal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none') : false,
        sessionCleared: sess === null
      };
    })()`,
    returnByValue: true
  });

  assert(logoutRes.result.value.sessionCleared === true, 'sessionStorage nsr_user_session live terhapus total');
  assert(logoutRes.result.value.workspaceHidden === true, 'Workspace teknis QA tertutup');
  assert(logoutRes.result.value.authModalVisible === true, 'Modal Otentikasi resmi kembali muncul');

  // 5. LIVE TEST LOGIN TOKEN SURVEYOR (NSR-SRV-2026) & BACKDOOR AUDIT
  console.log('\n[LIVE TEST 5] Login Token Surveyor (NSR-SRV-2026) & Audit Backdoor...');
  const surveyorRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-SRV-2026';
      const success = window.eksekusiLoginQA();
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      const modalHtml = modal ? modal.innerHTML : '';
      const hasBackdoorLink = /Beralih ke Akun|gantiPeranManual|switchRole/i.test(modalHtml);
      const hasRoleDropdown = Boolean(document.getElementById('user-role-select'));
      const links = modal ? Array.from(modal.querySelectorAll('a')).map(a => a.getAttribute('href')) : [];
      const hasLogoutBtn = Boolean(modal && modal.querySelector('button[onclick*="logoutQASession"]'));

      return {
        loginSuccess: success,
        modalVisible: modal ? !modal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none' || getComputedStyle(ws).display === 'none') : false,
        hasBackdoorLink: hasBackdoorLink,
        hasRoleDropdown: hasRoleDropdown,
        linksCount: links.length,
        links: links,
        hasLogoutBtn: hasLogoutBtn
      };
    })()`,
    returnByValue: true
  });

  assert(surveyorRes.result.value.loginSuccess === true, 'Token surveyor diproses di live server');
  assert(surveyorRes.result.value.modalVisible === true, 'Modal Lockout Surveyor HARUS aktif');
  assert(surveyorRes.result.value.workspaceHidden === true, 'Workspace teknis QA HARUS terkunci rapat');
  assert(surveyorRes.result.value.hasBackdoorLink === false, 'CELAH KEAMANAN TERHAPUS: Link switch role "Beralih ke Akun" TIDAK ADA di modal live');
  assert(surveyorRes.result.value.hasRoleDropdown === false, 'CELAH KEAMANAN TERHAPUS: Dropdown selector #user-role-select TIDAK ADA di DOM live');
  assert(surveyorRes.result.value.hasLogoutBtn === true, 'Tombol "🚪 Ganti Akun / Logout" tersedia di modal surveyor live');
  await captureProof('bukti_live_qa_surveyor_locked_no_backdoor.png');

  // 6. LIVE TEST LOGOUT DARI MODAL SURVEYOR
  console.log('\n[LIVE TEST 6] Klik Logout dari Modal Surveyor...');
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

  assert(srvLogoutRes.result.value.srvModalHidden === true, 'Modal surveyor lockout tertutup');
  assert(srvLogoutRes.result.value.authModalVisible === true, 'Modal login gate aktif kembali');

  // 7. LIVE TEST LOGIN NIK REVIEWER SPM (NSR-2019-007)
  console.log('\n[LIVE TEST 7] Login NIK Reviewer SPM: NSR-2019-007 (Tedi Setiadi)...');
  const spmRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-2019-007';
      const success = window.eksekusiLoginQA();
      const ws = document.getElementById('main-qa-workspace');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      return {
        loginSuccess: success,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeRole: badgeRole,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false
      };
    })()`,
    returnByValue: true
  });

  assert(spmRes.result.value.loginSuccess === true, 'Login Reviewer SPM sukses di live server');
  assert(spmRes.result.value.workspaceVisible === true, 'Workspace teknis QA terbuka');
  assert(spmRes.result.value.badgeRole === '[Tim Reviewer SPM - M-05]', `Badge role live: "${spmRes.result.value.badgeRole}"`);
  assert(spmRes.result.value.btnOverrideHidden === true, 'Override Gate disembunyikan untuk Reviewer');
  assert(spmRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Reviewer');

  // 8. LIVE TEST LOGIN NIK PIMPINAN REKAN (NSR-2019-005)
  console.log('\n[LIVE TEST 8] Login NIK Pimpinan Rekan: NSR-2019-005 (Danny Taufik)...');
  const rekanRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      window.logoutQASession();
      const input = document.getElementById('auth-input-token');
      input.value = 'NSR-2019-005';
      const success = window.eksekusiLoginQA();
      const ws = document.getElementById('main-qa-workspace');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      return {
        loginSuccess: success,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeRole: badgeRole,
        btnOverrideVisible: btnOverride ? (btnOverride.style.display !== 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false
      };
    })()`,
    returnByValue: true
  });

  assert(rekanRes.result.value.loginSuccess === true, 'Login Pimpinan Rekan sukses di live server');
  assert(rekanRes.result.value.workspaceVisible === true, 'Workspace teknis QA terbuka');
  assert(rekanRes.result.value.badgeRole === '[Pimpinan Rekan / Kepala SPM]', `Badge role live: "${rekanRes.result.value.badgeRole}"`);
  assert(rekanRes.result.value.btnOverrideVisible === true, 'Override Gate aktif untuk Pimpinan Rekan');
  assert(rekanRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Pimpinan Rekan');

  ws.close();
} catch (err) {
  console.error('[CDP_ERROR]', err);
} finally {
  chrome.kill();
  try {
    fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
  } catch (_) {}
}

console.log('\n' + '='.repeat(80));
console.log(`HASIL LIVE RBAC & AUTH GATE AUDIT: Total ${totalAsserts} | Lulus: ${passedAsserts} | Gagal: ${failedAsserts}`);
console.log('='.repeat(80));

if (failedAsserts > 0) process.exit(1);
