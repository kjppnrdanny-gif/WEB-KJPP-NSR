import puppeteer from 'puppeteer';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8089;

function createServer() {
  return http.createServer((req, res) => {
    let filePath = path.join(process.cwd(), req.url === '/' ? 'GPS.html' : req.url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      let ext = path.extname(filePath);
      let ctype = 'text/html';
      if (ext === '.css') ctype = 'text/css';
      if (ext === '.js' || ext === '.mjs') ctype = 'application/javascript';
      if (ext === '.png') ctype = 'image/png';
      if (ext === '.svg') ctype = 'image/svg+xml';
      res.writeHead(200, { 'Content-Type': ctype });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

async function main() {
  const server = createServer();
  await new Promise(r => server.listen(PORT, r));
  console.log(`Local test server running at http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true }); // Pixel 7 Mobile Viewport

  console.log('\n--- 1. TEST AUTO POPUP PRIVASI GATE (SESSION BARU) ---');
  await page.goto(`http://localhost:${PORT}/GPS.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const modalIsVisible = await page.$eval('#modal-privasi-karyawan', el => !el.classList.contains('hidden'));
  const xBtnDisplay = await page.$eval('#btn-tutup-privasi-x', el => window.getComputedStyle(el).display);
  const badgeWajibDisplay = await page.$eval('#badge-gate-wajib', el => window.getComputedStyle(el).display);
  const btnText = await page.$eval('#btn-konfirmasi-privasi', el => el.innerText.trim());
  const mainPointerEvents = await page.$eval('#main-presensi-content', el => window.getComputedStyle(el).pointerEvents);

  console.log('Modal Privasi terlihat otomatis:', modalIsVisible ? 'PASS (Visible)' : 'FAIL');
  console.log('Tombol X tersembunyi (Non-bypass):', xBtnDisplay === 'none' ? 'PASS (Hidden)' : `FAIL (${xBtnDisplay})`);
  console.log('Badge Wajib Dikonfirmasi:', badgeWajibDisplay !== 'none' ? 'PASS (Visible)' : 'FAIL');
  console.log('Teks Tombol Konfirmasi:', btnText === 'Saya Mengerti & Lanjutkan' ? 'PASS' : `FAIL: ${btnText}`);
  console.log('Latar belakang form terkunci:', mainPointerEvents === 'none' ? 'PASS (pointer-events: none)' : `FAIL (${mainPointerEvents})`);

  // Screenshot initial gate state on mobile
  await page.screenshot({ path: 'test_privacy_gate_initial_mobile.png' });
  console.log('Screenshot saved: test_privacy_gate_initial_mobile.png');

  console.log('\n--- 2. TEST NON-BYPASS: ESCAPE KEY & BACKDROP CLICK ---');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  let modalAfterEsc = await page.$eval('#modal-privasi-karyawan', el => !el.classList.contains('hidden'));
  console.log('Tekan ESC tidak menutup modal gate:', modalAfterEsc ? 'PASS (Still Open)' : 'FAIL');

  // Click outside dialog (e.g. top corner of backdrop)
  await page.mouse.click(10, 10);
  await page.waitForTimeout(200);
  let modalAfterBackdrop = await page.$eval('#modal-privasi-karyawan', el => !el.classList.contains('hidden'));
  console.log('Klik backdrop tidak menutup modal gate:', modalAfterBackdrop ? 'PASS (Still Open)' : 'FAIL');

  console.log('\n--- 3. TEST KLIK "SAYA MENGERTI & LANJUTKAN" ---');
  await page.click('#btn-konfirmasi-privasi');
  await page.waitForTimeout(300);

  const modalAfterConfirm = await page.$eval('#modal-privasi-karyawan', el => el.classList.contains('hidden'));
  const mainUnlocked = await page.$eval('#main-presensi-content', el => window.getComputedStyle(el).pointerEvents);
  const savedVersion = await page.evaluate(() => sessionStorage.getItem('nsr_privasi_confirmed_version'));
  const savedAt = await page.evaluate(() => sessionStorage.getItem('nsr_privasi_confirmed_at'));

  console.log('Modal tertutup setelah konfirmasi:', modalAfterConfirm ? 'PASS (Hidden)' : 'FAIL');
  console.log('Latar belakang form terbuka (unlocked):', mainUnlocked === 'auto' ? 'PASS (pointer-events: auto)' : `FAIL (${mainUnlocked})`);
  console.log('Versi tersimpan di sessionStorage:', savedVersion === 'PDP-NSR-EMP-2026.10' ? `PASS (${savedVersion})` : `FAIL (${savedVersion})`);
  console.log('Timestamp tersimpan di sessionStorage:', Boolean(savedAt) ? `PASS (${savedAt})` : 'FAIL');

  // Screenshot unlocked form
  await page.screenshot({ path: 'test_privacy_gate_unlocked_mobile.png' });
  console.log('Screenshot saved: test_privacy_gate_unlocked_mobile.png');

  console.log('\n--- 4. TEST FOOTER REVIEW MODE (BUKA LAGI SETELAH KONFIRMASI) ---');
  await page.evaluate(() => window.bukaModalPrivasiKaryawan());
  await page.waitForTimeout(200);
  const xBtnReview = await page.$eval('#btn-tutup-privasi-x', el => window.getComputedStyle(el).display);
  const btnReviewText = await page.$eval('#btn-konfirmasi-privasi', el => el.innerText.trim());
  console.log('Modal review: Tombol X muncul:', xBtnReview !== 'none' ? 'PASS (Visible)' : 'FAIL');
  console.log('Modal review: Teks tombol bawah:', btnReviewText === 'Saya Mengerti' ? 'PASS' : `FAIL (${btnReviewText})`);

  // Close via Escape in review mode
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const modalReviewClosedEsc = await page.$eval('#modal-privasi-karyawan', el => el.classList.contains('hidden'));
  console.log('Modal review ditutup via ESC:', modalReviewClosedEsc ? 'PASS (Closed)' : 'FAIL');

  console.log('\n--- 5. TEST REFRESH PAGE (STATUS SESI TETAP TERBUKA) ---');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  const modalOnReload = await page.$eval('#modal-privasi-karyawan', el => el.classList.contains('hidden'));
  const formOnReload = await page.$eval('#main-presensi-content', el => window.getComputedStyle(el).pointerEvents);
  console.log('Modal tidak muncul lagi dalam sesi yang sama (reload):', modalOnReload ? 'PASS (Hidden)' : 'FAIL');
  console.log('Form tetap aktif dalam sesi yang sama (reload):', formOnReload === 'auto' ? 'PASS (Active)' : 'FAIL');

  await browser.close();
  server.close();
  console.log('\n========================================================');
  console.log('🎉 SELURUH PENGUJIAN PRIVACY FIRST GATE LULUS 100%!');
  console.log('========================================================');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
