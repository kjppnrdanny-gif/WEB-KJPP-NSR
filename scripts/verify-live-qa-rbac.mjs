/**
 * scripts/verify-live-qa-rbac.mjs
 * Live Chrome CDP verification on production server: https://kjppnanangrahayu.com
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const BASE_URL = 'https://kjppnanangrahayu.com';
const CHROME_PORT = 9597;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = path.join(process.cwd(), '.tmp_qa_live_chrome');

console.log('='.repeat(80));
console.log('LIVE VERIFIKASI RBAC PORTAL QA REVIEW PADA SERVER PRODUKSI CPANEL');
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

  // 1. LIVE TEST SURVEYOR LOCKOUT
  console.log('\n[LIVE TEST 1] Akses Surveyor (Lockout): https://kjppnanangrahayu.com/portal-qa-review.html?role=SURVEYOR');
  await navigateAndWait(`${BASE_URL}/portal-qa-review.html?role=SURVEYOR&_t=${Date.now()}`);

  const surveyorRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-surveyor-locked');
      const ws = document.getElementById('main-qa-workspace');
      return {
        modalVisible: modal ? !modal.classList.contains('hidden') : false,
        workspaceHidden: ws ? (ws.style.display === 'none' || getComputedStyle(ws).display === 'none') : false
      };
    })()`,
    returnByValue: true
  });

  assert(surveyorRes.result.value.modalVisible === true, 'Modal Surveyor Lockout harus aktif di live server');
  assert(surveyorRes.result.value.workspaceHidden === true, 'Workspace teknis harus disembunyikan untuk Surveyor di live server');
  await captureProof('bukti_live_qa_rbac_surveyor_locked.png');

  // 2. LIVE TEST PENILAI (VALUER)
  console.log('\n[LIVE TEST 2] Akses Penilai (Valuer): https://kjppnanangrahayu.com/portal-qa-review.html?role=PENILAI');
  await navigateAndWait(`${BASE_URL}/portal-qa-review.html?role=PENILAI&_t=${Date.now()}`);

  const penilaiRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      const noticeValuer = document.getElementById('notice-valuer-spm');
      return {
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiHidden: btnRevisi ? (btnRevisi.style.display === 'none') : false,
        noticeValuerVisible: noticeValuer ? !noticeValuer.classList.contains('hidden') : false
      };
    })()`,
    returnByValue: true
  });

  assert(penilaiRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Penilai di live server');
  assert(penilaiRes.result.value.btnRevisiHidden === true, 'Tombol Kirim Revisi disembunyikan untuk Penilai (Anti Self-Review) di live server');
  assert(penilaiRes.result.value.noticeValuerVisible === true, 'Notice Anti Self-Review tampil untuk Penilai di live server');
  await captureProof('bukti_live_qa_rbac_penilai_workspace.png');

  // 3. LIVE TEST REVIEWER SPM
  console.log('\n[LIVE TEST 3] Akses Reviewer SPM: https://kjppnanangrahayu.com/portal-qa-review.html?role=REVIEWER_SPM');
  await navigateAndWait(`${BASE_URL}/portal-qa-review.html?role=REVIEWER_SPM&_t=${Date.now()}`);

  const spmRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      return {
        btnOverrideHidden: btnOverride ? (btnOverride.style.display === 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false
      };
    })()`,
    returnByValue: true
  });

  assert(spmRes.result.value.btnOverrideHidden === true, 'Tombol Override Gate disembunyikan untuk Reviewer SPM di live server');
  assert(spmRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Reviewer SPM di live server');
  await captureProof('bukti_live_qa_rbac_reviewer_spm.png');

  // 4. LIVE TEST REKAN (PARTNER)
  console.log('\n[LIVE TEST 4] Akses Rekan (Partner): https://kjppnanangrahayu.com/portal-qa-review.html?role=REKAN');
  await navigateAndWait(`${BASE_URL}/portal-qa-review.html?role=REKAN&_t=${Date.now()}`);

  const rekanRes = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const btnOverride = document.getElementById('btn-override-gate');
      const btnRevisi = document.getElementById('btn-send-revision');
      return {
        btnOverrideVisible: btnOverride ? (btnOverride.style.display !== 'none') : false,
        btnRevisiVisible: btnRevisi ? (btnRevisi.style.display !== 'none') : false
      };
    })()`,
    returnByValue: true
  });

  assert(rekanRes.result.value.btnOverrideVisible === true, 'Tombol Override Gate aktif untuk Pimpinan Rekan di live server');
  assert(rekanRes.result.value.btnRevisiVisible === true, 'Tombol Kirim Revisi aktif untuk Pimpinan Rekan di live server');
  await captureProof('bukti_live_qa_rbac_rekan_pimpinan.png');

  ws.close();
} catch (err) {
  console.error('[CDP_ERROR]', err);
} finally {
  chrome.kill();
  fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
}

console.log('\n' + '='.repeat(80));
console.log(`HASIL VERIFIKASI LIVE SERVER: Total ${totalAsserts} | Lulus: ${passedAsserts} | Gagal: ${failedAsserts}`);
console.log('='.repeat(80));

if (failedAsserts > 0) process.exit(1);
