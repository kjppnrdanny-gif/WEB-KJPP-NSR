import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_PORT = 8299;
const CHROME_PORT = 9580;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-nolap-${Date.now()}`);

console.log('================================================================');
console.log('   PENGUJIAN BROWSER E2E: OTOMASI GENERATE NOLAP M-06 NSR       ');
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
  throw new Error('Failed to connect to Chrome debugging endpoint');
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

async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return (r.result && r.result.result) ? r.result.result.value : null;
}

async function runBrowserTest() {
  await send('Page.enable');
  await send('Runtime.enable');

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
  });

  console.log(`Navigating to http://127.0.0.1:${PHP_PORT}/portal-tracking.html?nik=NSR-2019-002 ...`);
  await send('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html?nik=NSR-2019-002` });
  await new Promise(r => setTimeout(r, 3000));

  // Handle alert dialogs automatically
  send('Page.javascriptDialogOpening').catch(() => {});
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Page.javascriptDialogOpening') {
      send('Page.handleJavaScriptDialog', { accept: true });
    }
  });

  // Pastikan task board memuat penugasan
  const jobCount = await evalJs('(() => { try { return globalJobs ? globalJobs.length : 0; } catch(e) { return e.message; } })()');
  console.log(`Jumlah Job Order terdeteksi di task board: ${jobCount}`);
  assert(jobCount > 0, 'Harus ada data penugasan pada Task Board');

  console.log('Membuka modal update milestone penugasan Bandung...');
  await evalJs(`
    const bdgJob = globalJobs.find(x => (x.kantor_code === 'BDG' || x.kantor.includes('Bandung')) && !x.nomor_laporan_resmi) || globalJobs[0];
    bukaModalUpdateMilestone(bdgJob.jo_number);
    const targetSelect = document.getElementById('update-target-milestone');
    targetSelect.value = 'M-06';
    sesuaikanFieldMilestone('M-06');
  `);
  await new Promise(r => setTimeout(r, 500));

  // Verifikasi elemen UI tombol dan input NoLap
  const uiCheck = await evalJs(`
    (() => {
      const m6Box = document.getElementById('container-field-m06');
      const inputNoLap = document.getElementById('update-nomor-laporan-resmi');
      const btnGen = document.getElementById('btn-generate-nolap');
      const badge = document.getElementById('badge-nolap-status');
      return {
        m6Visible: !m6Box.classList.contains('hidden'),
        inputExists: !!inputNoLap,
        btnExists: !!btnGen,
        btnText: btnGen ? btnGen.innerText : ''
      };
    })()
  `);
  console.log('UI Check:', uiCheck);
  assert.strictEqual(uiCheck.m6Visible, true, 'Container M-06 harus terlihat');
  assert.strictEqual(uiCheck.btnExists, true, 'Tombol generate NoLap harus ada');
  console.log('[PASS] Antarmuka tombol ⚡ Ambil No. Laporan Otomatis terpasang presisi');

  // Isi NIK Penilai Publik Berizin (Deni Siswandi: NSR-2019-002) & PIN
  console.log('Menginput NIK Penilai Publik Berizin (Deni Siswandi, NSR-2019-002) dan PIN...');
  await evalJs(`
    document.getElementById('update-auth-nik').value = 'NSR-2019-002';
    document.getElementById('update-auth-pin').value = '123456';
  `);

  console.log('Mengeksekusi tombol Ambil No. Laporan Otomatis...');
  await evalJs(`generateNoLapOtomatisM06();`);
  await new Promise(r => setTimeout(r, 1500));

  // Verifikasi hasil input yang terisi dan terkunci
  const postGenCheck = await evalJs(`
    (() => {
      const inputNoLap = document.getElementById('update-nomor-laporan-resmi');
      const badge = document.getElementById('badge-nolap-status');
      const btnGen = document.getElementById('btn-generate-nolap');
      return {
        value: inputNoLap ? inputNoLap.value : '',
        readOnly: inputNoLap ? inputNoLap.readOnly : false,
        badgeVisible: badge ? !badge.classList.contains('hidden') : false,
        btnDisabled: btnGen ? btnGen.classList.contains('cursor-not-allowed') : false
      };
    })()
  `);
  console.log('Post Generation Check:', postGenCheck);
  assert(postGenCheck.value.includes('/PI/'), 'NoLap harus terisi dan memiliki kode bidang PI');
  assert.strictEqual(postGenCheck.readOnly, true, 'Kolom NoLap harus terkunci readOnly');
  assert.strictEqual(postGenCheck.badgeVisible, true, 'Badge Terkunci Resmi di SSOT NoLap harus muncul');
  console.log(`[PASS] NoLap berhasil diterbitkan: ${postGenCheck.value}`);
  console.log('[PASS] Status terkunci resmi di SSOT NoLap terverifikasi');

  // Ambil tangkapan layar modal M-06 terverifikasi
  const scr = await send('Page.captureScreenshot', { format: 'png' });
  const data = (scr.result && scr.result.data) ? scr.result.data : scr.data;
  const shotPath = path.join(artifactsDir, 'bukti_live_otomasi_nolap_m06.png');
  fs.writeFileSync(shotPath, Buffer.from(data, 'base64'));
  console.log(`[SNAPSHOT] Berhasil disimpan di: ${shotPath}`);

  console.log('\n================================================================');
  console.log('🏆 PENGUJIAN BROWSER E2E OTOMASI NOLAP M-06 SUKSES 100%! 🏆');
  console.log('================================================================');
}

try {
  await runBrowserTest();
} catch (err) {
  console.error('Browser Test Failed:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
  php.kill();
}
