import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PHP_PORT = 8295;
const CHROME_PORT = 9585;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-qr-${Date.now()}`);

console.log('================================================================');
console.log(' PENGUJIAN BROWSER E2E: GENERATOR QR CODE SURVEYOR & MOBILE PWA ');
console.log('================================================================');

// 1. Jalankan Server PHP
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
  throw new Error('Chrome Remote Debugging WebSocket URL tidak tersedia');
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

  // TEST 1: Buka portal-tracking.html dan periksa tombol [ 📱 QR ] pada taskboard
  console.log('\n--- UJI 1: Buka portal-tracking.html & Cek Tombol [ 📱 QR ] ---');
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
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });
  await loadPromise;
  await new Promise(r => setTimeout(r, 1200));

  const checkQrBtn = await cdp('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const qrBtn = btns.find(b => b.textContent.includes('QR') && b.getAttribute('onclick')?.includes('bukaModalQrPenugasan'));
      return {
        found: !!qrBtn,
        text: qrBtn ? qrBtn.textContent.trim() : null,
        onclick: qrBtn ? qrBtn.getAttribute('onclick') : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Evaluasi Tombol QR di Taskboard:', checkQrBtn.result.value);
  assert.strictEqual(checkQrBtn.result.value.found, true, 'Tombol [ 📱 QR ] harus ada di taskboard');

  // TEST 2: Buka Modal QR Code Penugasan (#modal-qr-penugasan)
  console.log('\n--- UJI 2: Buka Modal QR Code (#modal-qr-penugasan) untuk JO-BDG-2026-0015 ---');
  await cdp('Runtime.evaluate', {
    expression: `bukaModalQrPenugasan('JO-BDG-2026-0015')`
  });
  await new Promise(r => setTimeout(r, 800));

  const checkModalQr = await cdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-qr-penugasan');
      const isVisible = modal && !modal.classList.contains('hidden');
      const joText = document.getElementById('qr-modal-jo')?.textContent.trim();
      const debiturText = document.getElementById('qr-modal-debitur')?.textContent.trim();
      const targetUrl = document.getElementById('qr-target-url-display')?.textContent.trim();
      const qrContainer = document.getElementById('canvas-qr-code');
      const hasImgOrCanvas = !!qrContainer.querySelector('img, canvas');
      return {
        isVisible,
        joText,
        debiturText,
        targetUrl,
        hasImgOrCanvas
      };
    })()`,
    returnByValue: true
  });
  console.log('Status Modal QR Code:', checkModalQr.result.value);
  assert.strictEqual(checkModalQr.result.value.isVisible, true, 'Modal QR harus terbuka');
  assert.strictEqual(checkModalQr.result.value.joText, 'JO-BDG-2026-0015', 'No. JO pada modal QR harus sesuai');
  assert(checkModalQr.result.value.targetUrl.includes('mobile-survey-pembanding.html?jo=JO-BDG-2026-0015'), 'Target URL harus memuat parameter JO');
  assert.strictEqual(checkModalQr.result.value.hasImgOrCanvas, true, 'Kontainer QR harus memuat elemen img/canvas');

  // Ambil screenshot bukti modal QR
  const screenshotData = await cdp('Page.captureScreenshot', { format: 'png' });
  const screenshotPath = path.join(artifactsDir, 'bukti_live_qr_generator_surveyor.png');
  fs.writeFileSync(screenshotPath, Buffer.from(screenshotData.data, 'base64'));
  console.log('Screenshot modal QR berhasil disimpan di:', screenshotPath);

  // TEST 3: Buka Halaman mobile-survey-pembanding.html?jo=JO-BDG-2026-0015
  console.log('\n--- UJI 3: Navigasi ke mobile-survey-pembanding.html?jo=JO-BDG-2026-0015 ---');
  const loadPromiseMobile = new Promise(resolve => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/mobile-survey-pembanding.html?jo=JO-BDG-2026-0015` });
  await loadPromiseMobile;
  await new Promise(r => setTimeout(r, 1200));

  const checkMobilePage = await cdp('Runtime.evaluate', {
    expression: `(() => {
      const selectVal = document.getElementById('select-jo-penugasan')?.value;
      const banner = document.getElementById('banner-qr-active');
      const isBannerVisible = banner && !banner.classList.contains('hidden');
      const debitur = document.getElementById('display-debitur')?.textContent.trim();
      const instansi = document.getElementById('display-instansi')?.textContent.trim();
      const metaStandalone = document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content');
      const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content');
      return {
        selectVal,
        isBannerVisible,
        debitur,
        instansi,
        metaStandalone,
        metaTitle
      };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Evaluasi Mobile PWA:', checkMobilePage.result.value);
  assert.strictEqual(checkMobilePage.result.value.selectVal, 'JO-BDG-2026-0015', 'Select JO harus otomatis terkunci ke JO-BDG-2026-0015');
  assert.strictEqual(checkMobilePage.result.value.isBannerVisible, true, 'Banner QR active harus terlihat');
  assert.strictEqual(checkMobilePage.result.value.debitur, 'PT Graha Logistik Parahyangan', 'Debitur harus otomatis terisi');
  assert.strictEqual(checkMobilePage.result.value.metaStandalone, 'yes', 'Meta standalone PWA harus terpasang');
  assert.strictEqual(checkMobilePage.result.value.metaTitle, 'Survey NSR', 'Meta app title harus Survey NSR');

  console.log('\n================================================================');
  console.log(' SELURUH PENGUJIAN E2E QR CODE & MOBILE PWA LULUS (100%)');
  console.log('================================================================');

} catch (err) {
  console.error('\n❌ PENGUJIAN GAGAL:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
  php.kill();
}
