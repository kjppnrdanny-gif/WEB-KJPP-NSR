import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_PORT = 8251;
const CHROME_PORT = 9585;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-spm-toolbar-${Date.now()}`);

console.log('================================================================');
console.log('   PENGUJIAN BROWSER E2E: FLOATING ACTION TOOLBAR SPM QC (SPI 105)');
console.log('================================================================');

// 1. Jalankan PHP Built-in Server
const php = spawn('php', ['-S', `127.0.0.1:${PHP_PORT}`], { stdio: 'ignore' });
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
for (let i = 0; i < 20; i++) {
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
  throw new Error('Gagal menghubungkan ke Chrome DevTools Protocol endpoint');
}

const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let reqIdCounter = 1;
function send(method, params = {}) {
  return new Promise((res) => {
    const curId = reqIdCounter++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        res(msg);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

// Auto-dismiss standard alert dialogs agar tidak pernah memblokir CDP
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.method === 'Page.javascriptDialogOpening') {
    console.log('[BROWSER DIALOG]', msg.params.message);
    send('Page.handleJavaScriptDialog', { accept: true });
  }
});

async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return (r.result && r.result.result) ? r.result.result.value : null;
}

async function captureScreenshot(filepath) {
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  if (ss.result && ss.result.data) {
    fs.writeFileSync(filepath, Buffer.from(ss.result.data, 'base64'));
    console.log(`[SCREENSHOT DISIMPAN]: ${filepath}`);
  }
}

async function runToolbarVerification() {
  try {
    await send('Page.enable');
    await send('Runtime.enable');

    console.log(`Navigasi awal ke http://127.0.0.1:${PHP_PORT}/portal-tracking.html ...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });
    await new Promise(r => setTimeout(r, 1200));

    // Pasang sesi Super Admin
    await evalJs(`
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
        token: 'NSR8899',
        role: 'SUPER ADMIN',
        isSuperAdmin: true,
        isCabang: false,
        wilayah: 'PUSAT',
        nik: 'NSR-2019-002',
        nama: 'Deni Siswandi, S.E., M.Ec.Dev., MAPPI (Cert.)'
      }));
    `);

    // Reload untuk mengaktifkan sesi
    await send('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });
    
    // Tunggu sampai data task board termuat di globalJobs
    let jobCount = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      jobCount = await evalJs('(() => (typeof globalJobs !== "undefined" && Array.isArray(globalJobs)) ? globalJobs.length : 0)()');
      if (jobCount > 0) break;
    }
    console.log(`Jumlah penugasan terdeteksi di task board: ${jobCount}`);
    assert(jobCount > 0, 'Task board harus memuat sekurang-kurangnya 1 penugasan');

    // Uji 1: Verifikasi ketersediaan alias fungsi global & selector DOM
    console.log('\n--- UJI 1: VERIFIKASI ALIAS FUNGSI GLOBAL & DOM SELECTOR ---');
    const aliasesExist = await evalJs(`
      typeof window.cetakLembarSPM === 'function' &&
      typeof window.cetakLembarKendaliMutu === 'function' &&
      typeof window.tutupModalCetakSPM === 'function' &&
      typeof window.tutupModalSpm === 'function' &&
      document.getElementById('modal-pratinjau-spm') !== null &&
      document.getElementById('modal-cetak-spm-pdf') !== null
    `);
    console.log('Status alias fungsi dan selector DOM:', aliasesExist ? 'VALID (100% OK)' : 'GAGAL');
    assert.strictEqual(aliasesExist, true, 'Alias fungsi global dan DOM selector modal pratinjau SPM harus tersedia');

    // Ambil penugasan target untuk dicetak
    const targetJo = await evalJs(`
      (() => {
        const j = globalJobs.find(x => x.current_milestone === 'M-05' || x.kantor_code === 'BDG') || globalJobs[0];
        return j ? (j.id || j.jo_number) : null;
      })()
    `);
    console.log(`Penugasan target untuk cetak SPM: ${targetJo}`);
    assert(targetJo !== null, 'Harus ada penugasan valid untuk dicetak');

    // Uji 2: Buka Modal SPM via cetakLembarKendaliMutu(targetJo)
    console.log('\n--- UJI 2: BUKA MODAL SPM VIA ALIAS cetakLembarKendaliMutu() ---');
    await evalJs(`window.cetakLembarKendaliMutu('${targetJo}');`);
    await new Promise(r => setTimeout(r, 1000));

    const modalState = await evalJs(`
      (() => {
        const modal = document.getElementById('modal-cetak-spm-pdf');
        const isHidden = modal.classList.contains('hidden');
        const hasOpenBodyClass = document.body.classList.contains('modal-spm-open');
        const joBadge = document.getElementById('print-spm-jo-badge')?.textContent;
        return { isHidden, hasOpenBodyClass, joBadge };
      })()
    `);
    console.log('Status modal setelah pemanggilan:', modalState);
    assert.strictEqual(modalState.isHidden, false, 'Modal tidak boleh hidden');
    assert.strictEqual(modalState.hasOpenBodyClass, true, 'Body harus memiliki class modal-spm-open');
    assert.strictEqual(modalState.joBadge, targetJo, `Badge JO harus berisi ${targetJo}`);

    // Uji 3: Periksa elemen Floating Action Toolbar (Sticky & No-Print)
    console.log('\n--- UJI 3: VALIDASI STRUKTUR & KELAS FLOATING ACTION TOOLBAR ---');
    const toolbarAudit = await evalJs(`
      (() => {
        const toolbar = document.querySelector('#modal-cetak-spm-pdf .no-print');
        if (!toolbar) return { found: false };
        const text = toolbar.innerText;
        const classes = toolbar.className;
        const isSticky = classes.includes('sticky') && classes.includes('top-0');
        const hasNoPrint = classes.includes('no-print');
        const hasSpi105Badge = text.includes('SPI 105');
        const hasTitle = text.includes('Pratinjau Lembar Kendali Mutu SPM — KJPP NSR');
        const hasPrintBtn = text.includes('Cetak / Simpan PDF');
        const hasCloseBtn = text.includes('Kembali ke Menu');
        const scrollWrapper = document.getElementById('spm-printable-content-scroll');
        const hasScrollWrapper = scrollWrapper !== null && scrollWrapper.className.includes('overflow-y-auto');

        return {
          found: true,
          isSticky,
          hasNoPrint,
          hasSpi105Badge,
          hasTitle,
          hasPrintBtn,
          hasCloseBtn,
          hasScrollWrapper
        };
      })()
    `);
    console.log('Hasil audit Floating Action Toolbar:', toolbarAudit);
    assert.strictEqual(toolbarAudit.found, true, 'Toolbar harus ditemukan');
    assert.strictEqual(toolbarAudit.isSticky, true, 'Toolbar harus berkelas sticky top-0');
    assert.strictEqual(toolbarAudit.hasNoPrint, true, 'Toolbar harus berkelas no-print');
    assert.strictEqual(toolbarAudit.hasSpi105Badge, true, 'Toolbar harus memuat badge SPI 105');
    assert.strictEqual(toolbarAudit.hasTitle, true, 'Toolbar harus memuat judul resmi SPM');
    assert.strictEqual(toolbarAudit.hasPrintBtn, true, 'Toolbar harus memuat tombol Cetak / Simpan PDF');
    assert.strictEqual(toolbarAudit.hasCloseBtn, true, 'Toolbar harus memuat tombol Kembali ke Menu');
    assert.strictEqual(toolbarAudit.hasScrollWrapper, true, 'Konten cetak harus dibungkus scrollable container');

    // Uji 4: Tangkap Screenshot Visual Bukti Live Toolbar
    console.log('\n--- UJI 4: TANGKAP TANGKAPAN LAYAR BUKTI LIVE ---');
    const artifactScreenshotPath = path.join(artifactsDir, 'bukti_live_spm_print_toolbar.png');
    await captureScreenshot(artifactScreenshotPath);
    console.log('Tangkapan layar tersimpan di folder artefak.');

    // Uji 5: Uji Penutupan Modal via tutupModalSpm()
    console.log('\n--- UJI 5: UJI PENUTUPAN MODAL VIA tutupModalSpm() ---');
    await evalJs(`window.tutupModalSpm();`);
    await new Promise(r => setTimeout(r, 500));

    const closedState = await evalJs(`
      (() => {
        const modal = document.getElementById('modal-cetak-spm-pdf');
        return {
          isHidden: modal.classList.contains('hidden'),
          bodyHasClass: document.body.classList.contains('modal-spm-open')
        };
      })()
    `);
    console.log('Status modal setelah ditutup:', closedState);
    assert.strictEqual(closedState.isHidden, true, 'Modal harus berstatus hidden setelah ditutup');
    assert.strictEqual(closedState.bodyHasClass, false, 'Class modal-spm-open pada body harus dibersihkan');

    // Uji 6: Buka kembali dan uji penutupan via tombol ESC
    console.log('\n--- UJI 6: UJI PENUTUPAN MODAL VIA TOMBOL ESC ---');
    await evalJs(`window.cetakLembarKendaliMutu('${targetJo}');`);
    await new Promise(r => setTimeout(r, 400));
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await new Promise(r => setTimeout(r, 500));

    const escClosedState = await evalJs(`document.getElementById('modal-cetak-spm-pdf').classList.contains('hidden')`);
    console.log('Status modal setelah tombol ESC ditekan (harus true/tersembunyi):', escClosedState);
    assert.strictEqual(escClosedState, true, 'Modal harus tertutup saat tombol ESC ditekan');

    console.log('\n================================================================');
    console.log('   SELURUH PENGUJIAN FLOATING ACTION TOOLBAR SPM LOLOS 100%!    ');
    console.log('================================================================');

  } finally {
    try { ws.close(); } catch (e) {}
    try { chrome.kill(); } catch (e) {}
    try { php.kill(); } catch (e) {}
    try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch (e) {}
  }
}

runToolbarVerification().catch(err => {
  console.error('\n[FATAL ERROR]:', err);
  process.exit(1);
});
