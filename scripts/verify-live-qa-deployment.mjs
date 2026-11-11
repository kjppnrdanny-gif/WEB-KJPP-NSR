/**
 * scripts/verify-live-qa-deployment.mjs
 * Live Post-Deployment Smoke Test for KJPP NSR Technical Review & QA Module.
 * Tests live endpoints on https://kjppnanangrahayu.com and captures visual proof.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://kjppnanangrahayu.com';
const CHROME_PORT = 9598;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

console.log('='.repeat(80));
console.log('LIVE HEALTH CHECK & SMOKE TEST: PORTAL TECHNICAL REVIEW & QA LAPORAN');
console.log('Target Production: ' + BASE_URL);
console.log('Commit: 3d01074 (origin main)');
console.log('='.repeat(80));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runLiveSmokeTest() {
  // -------------------------------------------------------------
  // Test 1: HTTP API Backend QA Handler (list_reviews)
  // -------------------------------------------------------------
  console.log('\n--- 1. Uji Live API: backend/qa-engine-handler.php?action=list_reviews ---');
  try {
    const res = await fetch(`${BASE_URL}/backend/qa-engine-handler.php?action=list_reviews&_t=${Date.now()}`);
    assert(res.status === 200, `HTTP Status Code harus 200 (Aktual: ${res.status})`);
    const json = await res.json();
    assert(json.status === 'success', `data.status harus 'success' (Aktual: ${json.status})`);
    assert(Array.isArray(json.data), `json.data harus berupa array reviews (Total: ${json.data?.length})`);
  } catch (err) {
    assert(false, `Gagal memanggil live qa-engine-handler.php: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 2: HTTP API Gatekeeper Interlock (check_nolap_gate)
  // -------------------------------------------------------------
  console.log('\n--- 2. Uji Live API: backend/qa-engine-handler.php?action=check_nolap_gate ---');
  try {
    const res = await fetch(`${BASE_URL}/backend/qa-engine-handler.php?action=check_nolap_gate&job_order_id=JO-NSR-2026-0881&_t=${Date.now()}`);
    assert(res.status === 200, `HTTP Status Code harus 200 (Aktual: ${res.status})`);
    const json = await res.json();
    assert(json.status === 'success', `data.status harus 'success'`);
    assert(json.allowed === false, `Gatekeeper status 'allowed' harus false untuk berkas cacat (Aktual: ${json.allowed})`);
    assert(json.gate_nolap_unlocked === false, `gate_nolap_unlocked harus false`);
    assert(json.review_status === 'NOT_ACCEPTABLE', `review_status harus NOT_ACCEPTABLE`);
    console.log(`  -> Alasan Penolakan: ${json.reason}`);
  } catch (err) {
    assert(false, `Gagal memanggil check_nolap_gate: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 3: Headless Chrome CDP Live UI Smoke Test
  // -------------------------------------------------------------
  console.log('\n--- 3. Meluncurkan Chrome CDP untuk Pengujian Visual Live Server ---');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,960'
  ]);

  await new Promise(r => setTimeout(r, 1800));

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

    // 3a. Test Live Dashboard index.html
    console.log('\n[LIVE TEST] Membuka https://kjppnanangrahayu.com/index.html ...');
    await sendCdp('Page.navigate', { url: `${BASE_URL}/index.html?v=${Date.now()}` });
    
    // Wait for card element
    let cardFound = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      const res = await sendCdp('Runtime.evaluate', {
        expression: `Boolean(document.getElementById('kartu-qa-review-wrapper'))`
      });
      if (res?.result?.value === true) {
        cardFound = true;
        break;
      }
    }
    assert(cardFound, 'Kartu #kartu-qa-review-wrapper ditemukan di dashboard live');

    const cardData = await sendCdp('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('kartu-qa-review-wrapper');
        return {
          title: el?.querySelector('h4')?.textContent,
          badge: el?.querySelector('.uppercase')?.textContent,
          href: el?.querySelector('a')?.getAttribute('href')
        };
      })()`,
      returnByValue: true
    });
    console.log('  -> Data Kartu Dashboard Live:', cardData?.result?.value);
    assert(cardData?.result?.value?.href === 'portal-qa-review.html', 'Tautan tombol kartu mengarah ke portal-qa-review.html');

    // Scroll to card and take screenshot
    await sendCdp('Runtime.evaluate', {
      expression: `document.getElementById('kartu-qa-review-wrapper')?.scrollIntoView({ behavior: 'instant', block: 'center' })`
    });
    await new Promise(r => setTimeout(r, 600));

    const snapLiveDash = await sendCdp('Page.captureScreenshot', { format: 'png' });
    if (snapLiveDash && snapLiveDash.data) {
      const snapPath = path.join(ARTIFACT_DIR, 'bukti_live_dashboard_qa_card.png');
      fs.writeFileSync(snapPath, Buffer.from(snapLiveDash.data, 'base64'));
      console.log(`  [SCREENSHOT] Bukti live dashboard disimpan: ${snapPath}`);
    }

    // 3b. Test Live portal-qa-review.html
    console.log('\n[LIVE TEST] Membuka https://kjppnanangrahayu.com/portal-qa-review.html ...');
    await sendCdp('Page.navigate', { url: `${BASE_URL}/portal-qa-review.html?v=${Date.now()}` });
    await new Promise(r => setTimeout(r, 2000));

    const liveQaFifa = await sendCdp('Runtime.evaluate', {
      expression: `({
        title: document.getElementById('verdict-title')?.textContent,
        score: document.getElementById('compliance-score-val')?.textContent,
        gate: document.getElementById('stat-gate-status')?.textContent,
        crit: document.getElementById('stat-critical-count')?.textContent,
        maj: document.getElementById('stat-major-count')?.textContent,
        findingsCount: document.getElementById('badge-total-findings')?.textContent
      })`,
      returnByValue: true
    });
    console.log('  -> State QA RS FIFA MEDIKA Live:', liveQaFifa?.result?.value);
    assert(liveQaFifa?.result?.value?.title === 'NOT ACCEPTABLE', 'Verdict draf RS FIFA MEDIKA berstatus NOT ACCEPTABLE');
    assert(liveQaFifa?.result?.value?.gate?.includes('TERKUNCI'), 'Status Gerbang NoLap terkunci 🔒');
    assert(liveQaFifa?.result?.value?.crit === '2', '2 Temuan Kritis (#REF! dan Kontradiksi Objek) terdeteksi');

    // Screenshot RS FIFA MEDIKA
    const snapLiveFifa = await sendCdp('Page.captureScreenshot', { format: 'png' });
    if (snapLiveFifa && snapLiveFifa.data) {
      const snapPath = path.join(ARTIFACT_DIR, 'bukti_live_portal_qa_review_fifa.png');
      fs.writeFileSync(snapPath, Buffer.from(snapLiveFifa.data, 'base64'));
      console.log(`  [SCREENSHOT] Bukti live QA RS FIFA MEDIKA disimpan: ${snapPath}`);
    }

    // 3c. Test Sample 2: Permata Harapan Sarimukti
    console.log('\n[LIVE TEST] Menguji Sampel 2: Permata Harapan Sarimukti ...');
    await sendCdp('Runtime.evaluate', {
      expression: `muatSampelBerkas('sarimukti')`
    });
    await new Promise(r => setTimeout(r, 1000));

    const liveQaSari = await sendCdp('Runtime.evaluate', {
      expression: `({
        title: document.getElementById('verdict-title')?.textContent,
        score: document.getElementById('compliance-score-val')?.textContent,
        gate: document.getElementById('stat-gate-status')?.textContent,
        maj: document.getElementById('stat-major-count')?.textContent,
        findingsCount: document.getElementById('badge-total-findings')?.textContent
      })`,
      returnByValue: true
    });
    console.log('  -> State QA Sarimukti Live:', liveQaSari?.result?.value);
    assert(liveQaSari?.result?.value?.title === 'REQUIRES MAJOR REVISION', 'Verdict Sarimukti berstatus REQUIRES MAJOR REVISION');
    assert(liveQaSari?.result?.value?.gate?.includes('TERKUNCI'), 'Status Gerbang NoLap terkunci 🔒');

    // Screenshot Sarimukti
    const snapLiveSari = await sendCdp('Page.captureScreenshot', { format: 'png' });
    if (snapLiveSari && snapLiveSari.data) {
      const snapPath = path.join(ARTIFACT_DIR, 'bukti_live_portal_qa_review_sarimukti.png');
      fs.writeFileSync(snapPath, Buffer.from(snapLiveSari.data, 'base64'));
      console.log(`  [SCREENSHOT] Bukti live QA Sarimukti disimpan: ${snapPath}`);
    }

    ws.close();
    chrome.kill();
  } catch (err) {
    chrome.kill();
    assert(false, `Kesalahan saat menjalankan uji Chrome live: ${err.message}`);
  }

  // Final Summary
  console.log('\n' + '='.repeat(80));
  console.log(`HASIL LIVE SMOKE TEST: ${passedTests}/${totalTests} UJI LULUS (${failedTests === 0 ? 'SEMPURNA' : 'ADA KENDALA'})`);
  console.log('='.repeat(80));

  if (failedTests > 0) {
    process.exit(1);
  }
}

runLiveSmokeTest();
