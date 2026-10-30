import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_PORT = 8256;
const CHROME_PORT = 9588;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-nolap-king-${Date.now()}`);

console.log('================================================================');
console.log('   PENGUJIAN BROWSER E2E: TAB 6 DASBOR PENGAWASAN KING TOKEN    ');
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

let dialogOpened = false;
let dialogMessage = '';
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
  }
  if (msg.method === 'Page.javascriptDialogOpening') {
    dialogOpened = true;
    dialogMessage = msg.params.message;
    console.log('[BROWSER DIALOG DETECTED]:', dialogMessage);
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

async function runTest() {
  try {
    await send('Page.enable');
    await send('Runtime.enable');

    console.log(`Navigasi ke http://127.0.0.1:${PHP_PORT}/portal-nolap.html ...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-nolap.html` });
    
    // Tunggu sampai parser selesai dan fungsi loginKeServer siap
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 400));
      ready = await evalJs('typeof loginKeServer === "function"');
      if (ready) break;
    }
    console.log('Parser HTML & Script selesai, loginKeServer ready:', ready);
    assert.strictEqual(ready, true, 'loginKeServer harus siap');

    // Uji 1: Autentikasi dengan King Token NSR8899 melalui form login
    console.log('\n--- UJI 1: AUTENTIKASI DENGAN KING TOKEN NSR8899 ---');
    await evalJs(`
      (async () => {
        const input = document.getElementById('input-token-nolap');
        if (input) {
          input.value = 'NSR8899';
          await loginKeServer();
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));

    const authState = await evalJs(`
      (() => {
        const box = document.getElementById('box-auth-token');
        const main = document.getElementById('panel-aplikasi-utama');
        const labelSesi = document.getElementById('label-sesi')?.innerText || '';
        const user = window.currentUser || window.sesiAktif || null;
        return {
          boxHidden: box ? box.classList.contains('hidden') || box.style.display === 'none' : false,
          mainVisible: main ? !main.classList.contains('hidden') : false,
          labelSesi,
          role: user?.role,
          isSuperAdmin: user?.isSuperAdmin,
          isKing: user?.isKing
        };
      })()
    `);
    console.log('Status sesi setelah autentikasi King Token:', authState);
    assert.strictEqual(authState.boxHidden, true, 'Modal login token harus tertutup');
    assert.strictEqual(authState.mainVisible, true, 'Panel aplikasi utama harus terbuka');
    assert.strictEqual(authState.isSuperAdmin, true, 'Status Super Admin harus true');

    // Uji 2: Validasi Status Tombol Tab 6 (Harus Terbuka & Tidak Disabled)
    console.log('\n--- UJI 2: VALIDASI STATUS TOMBOL TAB 6 ---');
    const tab6State = await evalJs(`
      (() => {
        const btn = document.getElementById('tab-btn-monitoring');
        if (!btn) return { exists: false };
        const isHidden = btn.classList.contains('hidden') || btn.style.display === 'none';
        const isDisabled = btn.hasAttribute('disabled');
        const hasPointerEventsNone = btn.classList.contains('pointer-events-none');
        const hasCursorNotAllowed = btn.classList.contains('cursor-not-allowed');
        const hasCursorPointer = btn.classList.contains('cursor-pointer');
        const innerText = btn.innerText;
        const badgeText = document.getElementById('badge-tab-monitoring')?.innerText || '';
        return {
          exists: true,
          isHidden,
          isDisabled,
          hasPointerEventsNone,
          hasCursorNotAllowed,
          hasCursorPointer,
          innerText,
          badgeText
        };
      })()
    `);
    console.log('Audit tombol Tab 6:', tab6State);
    assert.strictEqual(tab6State.exists, true, 'Tombol Tab 6 harus ada di DOM');
    assert.strictEqual(tab6State.isHidden, false, 'Tombol Tab 6 tidak boleh tersembunyi');
    assert.strictEqual(tab6State.isDisabled, false, 'Tombol Tab 6 tidak boleh disabled');
    assert.strictEqual(tab6State.hasPointerEventsNone, false, 'Tombol Tab 6 tidak boleh memiliki class pointer-events-none');
    assert.strictEqual(tab6State.hasCursorNotAllowed, false, 'Tombol Tab 6 tidak boleh memiliki class cursor-not-allowed');
    assert(tab6State.badgeText.includes('Akses Terbuka'), 'Badge Tab 6 harus menampilkan Akses Terbuka');

    // Uji 3: Klik Tombol Tab 6 dan Pastikan Panel 6 Terbuka Tanpa Dialog Pemblokiran
    console.log('\n--- UJI 3: BUKA TAB 6 DASBOR PENGAWASAN ---');
    dialogOpened = false;
    await evalJs(`document.getElementById('tab-btn-monitoring').click();`);
    await new Promise(r => setTimeout(r, 800));

    assert.strictEqual(dialogOpened, false, `Tidak boleh ada dialog penolakan akses terbuka: ${dialogMessage}`);

    const panel6State = await evalJs(`
      (() => {
        const p6 = document.getElementById('panel-monitoring');
        const p1 = document.getElementById('panel-pengajuan');
        const isP6Visible = p6 ? !p6.classList.contains('hidden') : false;
        const isP1Hidden = p1 ? p1.classList.contains('hidden') : true;
        const tableBody = document.getElementById('tabel-body-monitoring');
        return {
          isP6Visible,
          isP1Hidden,
          tableBodyExists: !!tableBody
        };
      })()
    `);
    console.log('Status Panel Tab 6 setelah diklik:', panel6State);
    assert.strictEqual(panel6State.isP6Visible, true, 'Panel Tab 6 harus terlihat aktif');
    assert.strictEqual(panel6State.isP1Hidden, true, 'Panel Tab 1 harus tersembunyi');
    assert.strictEqual(panel6State.tableBodyExists, true, 'Tabel matriks monitoring harus tersedia');

    // Uji 4: Tangkap Screenshot Visual Dasbor Pengawasan Terbuka
    console.log('\n--- UJI 4: TANGKAP TANGKAPAN LAYAR BUKTI LIVE ---');
    const screenshotPath = path.join(artifactsDir, 'bukti_live_tab6_dasbor_pengawasan_king.png');
    await captureScreenshot(screenshotPath);

    // Uji 5: Verifikasi fungsi alias perpindahan tab window.bukaTab(6) dan window.switchTab('dasbor')
    console.log('\n--- UJI 5: VERIFIKASI ALIAS window.bukaTab & window.switchTab ---');
    await evalJs(`window.bukaTab(1);`);
    await new Promise(r => setTimeout(r, 400));
    const isP1Back = await evalJs(`!document.getElementById('panel-pengajuan').classList.contains('hidden')`);
    assert.strictEqual(isP1Back, true, 'window.bukaTab(1) harus membuka Tab 1');

    await evalJs(`window.bukaTab(6);`);
    await new Promise(r => setTimeout(r, 400));
    const isP6Back = await evalJs(`!document.getElementById('panel-monitoring').classList.contains('hidden')`);
    assert.strictEqual(isP6Back, true, 'window.bukaTab(6) harus membuka Tab 6');

    await evalJs(`window.switchTab('pengajuan');`);
    await new Promise(r => setTimeout(r, 400));
    await evalJs(`window.switchTab('dasbor');`);
    await new Promise(r => setTimeout(r, 400));
    const isP6ViaSwitch = await evalJs(`!document.getElementById('panel-monitoring').classList.contains('hidden')`);
    assert.strictEqual(isP6ViaSwitch, true, "window.switchTab('dasbor') harus membuka Tab 6");

    console.log('\n================================================================');
    console.log('   SELURUH PENGUJIAN TAB 6 KING TOKEN BERHASIL 100%!           ');
    console.log('================================================================');

  } finally {
    try { ws.close(); } catch (e) {}
    try { chrome.kill(); } catch (e) {}
    try { php.kill(); } catch (e) {}
    try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch (e) {}
  }
}

runTest().catch(err => {
  console.error('\n[FATAL ERROR]:', err);
  process.exit(1);
});
