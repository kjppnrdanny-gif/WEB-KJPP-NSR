/**
 * scripts/verify-live-qa-rbac.mjs
 * Live Chrome CDP verification on production server: https://kjppnanangrahayu.com
 * Verifies token NSR-VAL-2026, surveyor lockout, and backdoor link removal.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const BASE_URL = 'https://kjppnanangrahayu.com';
const CHROME_PORT = 9597;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = path.join(process.cwd(), '.tmp_qa_live_chrome');

console.log('='.repeat(80));
console.log('LIVE VERIFIKASI TOKEN NSR-VAL-2026 & SECURITY BACKDOOR DI SERVER CPANEL');
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
      await new Promise(r => setTimeout(r, 250));
      const res = await sendCdp('Runtime.evaluate', {
        expression: 'Boolean(window.__qa_initialized)'
      });
      if (res?.result?.value === true) {
        await new Promise(r => setTimeout(r, 500));
        return;
      }
    }
  }

  // 1. LIVE TEST TOKEN NSR-VAL-2026 (PENILAI PENYUSUN M-04)
  console.log('\n[LIVE TEST 1] Token NSR-VAL-2026: https://kjppnanangrahayu.com/portal-qa-review.html?token=NSR-VAL-2026');
  await navigateAndWait(`${BASE_URL}/portal-qa-review.html?token=NSR-VAL-2026&_t=${Date.now()}`);

  const valuerRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      const badgeRole = document.getElementById('user-badge-role')?.textContent;
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const noticeValuer = document.getElementById('notice-valuer-spm');
      return {
        modalHidden: modal ? modal.classList.contains('hidden') : false,
        workspaceVisible: ws ? (ws.style.display !== 'none') : false,
        badgeRole: badgeRole,
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiHidden: btnRevisi ? (btnRevisi.style.display === 'none') : false,
        noticeValuerVisible: noticeValuer ? !noticeValuer.classList.contains('hidden') : false
      };
    })()`,
    returnByValue: true
  });

  assert(valuerRes.result.value.modalHidden === true, 'Modal Lockout HARUS tersembunyi untuk NSR-VAL-2026 di live server');
  assert(valuerRes.result.value.workspaceVisible === true, 'Workspace teknis QA HARUS terbuka untuk NSR-VAL-2026 di live server');
  assert(valuerRes.result.value.badgeRole === '[Penilai Penyusun - M-04]', `Badge role harus "[Penilai Penyusun - M-04]" di live server (Aktual: ${valuerRes.result.value.badgeRole})`);
  assert(valuerRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Penilai');
  assert(valuerRes.result.value.btnRevisiHidden === true, 'Tombol Kirim Revisi disembunyikan untuk Penilai (Anti Self-Review)');
  assert(valuerRes.result.value.noticeValuerVisible === true, 'Kotak notifikasi Anti Self-Review tampil');
  await captureProof('bukti_live_qa_token_nsr_val_2026.png');

  // 2. LIVE TEST TOKEN NSR-SRV-2026 & BACKDOOR AUDIT
  console.log('\n[LIVE TEST 2] Token NSR-SRV-2026: https://kjppnanangrahayu.com/portal-qa-review.html?token=NSR-SRV-2026');
  await navigateAndWait(`${BASE_URL}/portal-qa-review.html?token=NSR-SRV-2026&_t=${Date.now()}`);

  const surveyorRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      const modalHtml = modal ? modal.innerHTML : '';
      const hasBackdoorLink = /Beralih ke Akun|gantiPeranManual|switchRole/i.test(modalHtml);
      const hasRoleDropdown = Boolean(document.getElementById('user-role-select'));
      const links = modal ? Array.from(modal.querySelectorAll('a')).map(a => a.getAttribute('href')) : [];

      return {
        modalVisible: modal ? !modal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none' || getComputedStyle(ws).display === 'none') : false,
        hasBackdoorLink: hasBackdoorLink,
        hasRoleDropdown: hasRoleDropdown,
        linksCount: links.length,
        links: links
      };
    })()`,
    returnByValue: true
  });

  assert(surveyorRes.result.value.modalVisible === true, 'Modal Lockout HARUS aktif untuk Surveyor di live server');
  assert(surveyorRes.result.value.workspaceHidden === true, 'Workspace teknis HARUS disembunyikan untuk Surveyor di live server');
  assert(surveyorRes.result.value.hasBackdoorLink === false, 'CELAH KEAMANAN TERHAPUS: Link switch role "Beralih ke Akun" TIDAK ADA di modal live');
  assert(surveyorRes.result.value.hasRoleDropdown === false, 'CELAH KEAMANAN TERHAPUS: Dropdown selector #user-role-select TIDAK ADA di DOM live');
  assert(surveyorRes.result.value.linksCount === 2, `Modal HANYA memiliki 2 tombol resmi di live server (Aktual: ${surveyorRes.result.value.links.join(', ')})`);
  await captureProof('bukti_live_qa_surveyor_locked_no_backdoor.png');

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
console.log(`HASIL LIVE RBAC & BACKDOOR AUDIT: Total ${totalAsserts} | Lulus: ${passedAsserts} | Gagal: ${failedAsserts}`);
console.log('='.repeat(80));

if (failedAsserts > 0) process.exit(1);
