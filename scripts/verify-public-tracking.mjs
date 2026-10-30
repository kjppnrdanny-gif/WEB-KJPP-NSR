import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PHP_PORT = 8298;
const CHROME_PORT = 9588;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-tracking-${Date.now()}`);

console.log('================================================================');
console.log(' PENGUJIAN BROWSER E2E: LACAK STATUS PENUGASAN PENILAIAN PUBLIK');
console.log('================================================================');

// 1. Jalankan PHP Built-in Server
const php = spawn(PHP_BIN, [
  '-d', `extension_dir=${PHP_EXT_DIR}`,
  '-d', 'extension=curl',
  '-d', 'extension=openssl',
  '-S', `127.0.0.1:${PHP_PORT}`,
  '-t', path.resolve('.')
], { stdio: 'ignore' });
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
for (let i = 0; i < 25; i++) {
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
  throw new Error('Chrome Remote Debugging WebSocket URL not available');
}

const ws = new WebSocket(tData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let idCounter = 1;
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = idCounter++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');

  console.log('\n--- Buka index.html ---');
  const loadPromise = new Promise(resolve => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/index.html` });
  await loadPromise;
  await new Promise(r => setTimeout(r, 1000));

  // TEST CASE 1: Anti-Silent Fail - Nomor WhatsApp Salah (PHONE_MISMATCH)
  console.log('\n--- UJI 1: Anti-Silent Fail - Input Nomor WhatsApp Tidak Cocok ---');
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        document.getElementById('track-jo-input').value = 'JO-BDG-2026-0015';
        document.getElementById('track-pic-input').value = '081299998888';
      })()
    `
  });
  await cdp('Runtime.evaluate', {
    expression: `eksekusiLacakPenugasanPublik()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 500));

  const checkMismatch = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const modal = document.getElementById('modal-lacak-warning');
        const isModalVisible = modal && !modal.classList.contains('hidden');
        const modalMsg = document.getElementById('modal-lacak-warning-msg')?.textContent || '';
        const feedback = document.getElementById('feedback-lacak-publik');
        const isFeedbackVisible = feedback && !feedback.classList.contains('hidden');
        const feedbackMsg = feedback ? feedback.textContent : '';

        return {
          isModalVisible,
          modalMsg,
          isFeedbackVisible,
          feedbackMsg
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Hasil Uji 1 (Mismatch):', checkMismatch.result.value);
  assert.ok(
    checkMismatch.result.value.modalMsg.includes('Nomor WhatsApp PIC tidak cocok') ||
    checkMismatch.result.value.feedbackMsg.includes('Nomor WhatsApp PIC tidak cocok'),
    'Peringatan ketidakcocokan nomor WhatsApp harus muncul jelas'
  );
  console.log('✅ UJI 1 LULUS: Peringatan PHONE_MISMATCH tampil tanpa silent-fail.');

  // Tutup modal warning
  await cdp('Runtime.evaluate', { expression: `tutupModalLacakWarning()` });
  await new Promise(r => setTimeout(r, 500));

  // TEST CASE 2: Anti-Silent Fail - Nomor JO Tidak Ditemukan (JO_NOT_FOUND)
  console.log('\n--- UJI 2: Anti-Silent Fail - Input Nomor JO Fiktif (JO_NOT_FOUND) ---');
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        document.getElementById('track-jo-input').value = 'JO-FIKTIF-9999';
        document.getElementById('track-pic-input').value = '081322445566';
      })()
    `
  });
  await cdp('Runtime.evaluate', {
    expression: `eksekusiLacakPenugasanPublik()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 500));

  const checkNotFound = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const modal = document.getElementById('modal-lacak-warning');
        const isModalVisible = modal && !modal.classList.contains('hidden');
        const modalMsg = document.getElementById('modal-lacak-warning-msg')?.textContent || '';
        const feedback = document.getElementById('feedback-lacak-publik');
        const isFeedbackVisible = feedback && !feedback.classList.contains('hidden');
        const feedbackMsg = feedback ? feedback.textContent : '';

        return {
          isModalVisible,
          modalMsg,
          isFeedbackVisible,
          feedbackMsg
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Hasil Uji 2 (Not Found):', checkNotFound.result.value);
  assert.ok(
    checkNotFound.result.value.modalMsg.includes('tidak ditemukan dalam sistem') ||
    checkNotFound.result.value.feedbackMsg.includes('tidak ditemukan dalam sistem'),
    'Peringatan Nomor JO tidak ditemukan harus muncul jelas'
  );
  console.log('✅ UJI 2 LULUS: Peringatan JO_NOT_FOUND tampil tanpa silent-fail.');

  // Tutup modal warning
  await cdp('Runtime.evaluate', { expression: `tutupModalLacakWarning()` });
  await new Promise(r => setTimeout(r, 500));

  // TEST CASE 3: Lacak Sukses dengan Normalisasi Nomor WA (JO-BDG-2026-0015 & 081322445566)
  console.log('\n--- UJI 3: Lacak Status Sukses (JO-BDG-2026-0015 & 081322445566) ---');
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        document.getElementById('track-jo-input').value = 'JO-BDG-2026-0015';
        document.getElementById('track-pic-input').value = '081322445566';
      })()
    `
  });
  await cdp('Runtime.evaluate', {
    expression: `eksekusiLacakPenugasanPublik()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 800));

  const checkSuccess = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const modal = document.getElementById('modal-tracking-stepper-publik');
        const isVisible = modal && !modal.classList.contains('hidden');
        const joDisplay = document.getElementById('pub-modal-jo-number')?.textContent || '';
        const spkDisplay = document.getElementById('pub-modal-spk-number')?.textContent || '';
        const pemberiTugas = document.getElementById('pub-modal-pemberi-tugas')?.textContent || '';
        const debitur = document.getElementById('pub-modal-debitur')?.textContent || '';
        const objek = document.getElementById('pub-modal-objek')?.textContent || '';
        const badgeSla = document.getElementById('pub-modal-badge-sla')?.textContent || '';
        const progressPct = document.getElementById('pub-modal-progress-percent')?.textContent || '';
        const stepperItems = document.getElementById('pub-stepper-items-container')?.children.length || 0;

        return {
          isVisible,
          joDisplay,
          spkDisplay,
          pemberiTugas,
          debitur,
          objek,
          badgeSla,
          progressPct,
          stepperItems
        };
      })()
    `,
    returnByValue: true
  });

  const res = checkSuccess.result.value;
  console.log('Hasil Uji 3 (Sukses):', res);

  assert.ok(res.isVisible, 'Modal tracking publik harus terbuka');
  assert.strictEqual(res.joDisplay, 'JO-BDG-2026-0015', 'Nomor JO harus JO-BDG-2026-0015');
  assert.ok(res.pemberiTugas.includes('Bank Tabungan Negara') || res.pemberiTugas.includes('BTN') || res.pemberiTugas.includes('Bank'), 'Pemberi tugas harus terdaftar');
  assert.ok(res.debitur.includes('PT Graha Logistik Parahyangan'), 'Debitur harus PT Graha Logistik Parahyangan');
  assert.ok(res.stepperItems >= 7, 'Minimal 7 milestone stepper harus ter-render');
  console.log('✅ UJI 3 LULUS: Modal 7-Milestone terbuka sempurna dengan data terproteksi KEPI.');

  // STEP 4: Ambil Screenshot Bukti Live
  console.log('\n--- UJI 4: Pengambilan Screenshot Bukti Live ---');
  const screenshotData = await cdp('Page.captureScreenshot', { format: 'png' });
  const ssBuffer = Buffer.from(screenshotData.data, 'base64');
  const ssPath = path.join(artifactsDir, 'bukti_live_public_tracking_m02_bdg.png');
  fs.writeFileSync(ssPath, ssBuffer);
  console.log(`✅ Tangkapan layar bukti live tersimpan di: ${ssPath}`);

} finally {
  ws.close();
  chrome.kill();
  php.kill();
  try {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  } catch (e) {}
}

console.log('\n================================================================');
console.log('🎉 SELURUH PENGUJIAN BILAH LACAK STATUS PENUGASAN LULUS 100%!');
console.log('================================================================');
