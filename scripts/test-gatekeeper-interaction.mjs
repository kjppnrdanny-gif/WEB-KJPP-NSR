import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const targetFile = path.join(projectRoot, 'portal-tracking.html');

console.log('Target file for Gatekeeper Interaction Test:', targetFile);

// Cari binary Chrome di sistem Windows
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
];

let chromePath = chromeCandidates.find(p => p && fs.existsSync(p));
if (!chromePath) {
  console.error('Chrome executable not found on host machine.');
  process.exit(1);
}

// Jalankan HTTP server lokal
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/portal-tracking.html';
  const filePath = path.join(projectRoot, reqPath.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    let contentType = 'text/html; charset=utf-8';
    if (ext === '.js' || ext === '.mjs') contentType = 'application/javascript; charset=utf-8';
    else if (ext === '.json') contentType = 'application/json; charset=utf-8';
    else if (ext === '.css') contentType = 'text/css; charset=utf-8';
    const buf = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': buf.length
    });
    res.end(buf);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 8992;
server.listen(PORT, async () => {
  console.log(`Test web server running at http://localhost:${PORT}/portal-tracking.html`);

  const debugPort = 9224;
  const tempProfileDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-test-gatekeeper-' + Date.now());

  // Jalankan headless Chrome dengan profil terisolasi baru (incognito environment)
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--incognito',
    `http://localhost:${PORT}/portal-tracking.html`
  ], { stdio: 'ignore' });

  // Tunggu Chrome CDP siap
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const endpoints = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${debugPort}/json`, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          });
        }).on('error', reject);
      });
      const targetPage = endpoints && endpoints.find(e => e.type === 'page' && e.url.includes('portal-tracking'));
      if (targetPage && targetPage.webSocketDebuggerUrl) {
        wsUrl = targetPage.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome CDP WebSocket');
    chromeProc.kill();
    server.close();
    process.exit(1);
  }

  console.log('Connected to Chrome CDP:', wsUrl);

  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const sendCommand = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = msgId++;
      const onMsg = (event) => {
        const resp = JSON.parse(event.data);
        if (resp.id === id) {
          ws.removeEventListener('message', onMsg);
          resolve(resp.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  ws.addEventListener('open', async () => {
    await sendCommand('Console.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Page.enable');

    // Tunggu loadEventFired
    await new Promise((resolve) => {
      const onLoad = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Page.loadEventFired') {
          ws.removeEventListener('message', onLoad);
          resolve();
        }
      };
      ws.addEventListener('message', onLoad);
      setTimeout(resolve, 5000);
    });

    await new Promise(r => setTimeout(r, 1000));

    console.log('\n--- UJI 1: KONDISI AWAL GATEKEEPER ---');
    const resAwal = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const inputEl = document.getElementById('gatekeeper-token-input');
          const eyeBtn = document.getElementById('btn-toggle-gatekeeper-eye');
          const submitBtn = document.getElementById('btn-submit-gatekeeper');
          const errorMsg = document.getElementById('gatekeeper-error-msg');
          const gatekeeper = document.getElementById('modal-auth-gatekeeper');
          const mainApp = document.getElementById('main-tracking-app');
          const search = window.location.search;

          return {
            hasInput: !!inputEl,
            inputType: inputEl ? inputEl.type : null,
            hasEyeBtn: !!eyeBtn,
            hasSubmitBtn: !!submitBtn,
            hasErrorDiv: !!errorMsg,
            gatekeeperVisible: gatekeeper && window.getComputedStyle(gatekeeper).display !== 'none',
            mainHidden: !mainApp || window.getComputedStyle(mainApp).display === 'none',
            urlSearch: search
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Kondisi awal:', resAwal.result.value);

    console.log('\n--- UJI 2: KLIK TOMBOL MATA (TOGGLE PASSWORD VISIBILITY) ---');
    const resEyeClick = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const eyeBtn = document.getElementById('btn-toggle-gatekeeper-eye');
          if (eyeBtn) eyeBtn.click();
          const inputEl = document.getElementById('gatekeeper-token-input');
          const search = window.location.search;
          return {
            inputTypeAfterClick: inputEl ? inputEl.type : null,
            urlSearchAfterClick: search
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Hasil klik mata 1x (harus "text" dan URL tanpa "?"):', resEyeClick.result.value);

    // Klik lagi untuk kembalikan ke password
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('btn-toggle-gatekeeper-eye')?.click();`,
      returnByValue: true
    });

    console.log('\n--- UJI 3: SUBMIT KOSONG (VALIDASI FORM HARUS MUNCUL TANPA RELOAD) ---');
    const resSubmitEmpty = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const submitBtn = document.getElementById('btn-submit-gatekeeper');
          if (submitBtn) submitBtn.click();
          const errorMsg = document.getElementById('gatekeeper-error-msg');
          const search = window.location.search;
          return {
            errorVisible: errorMsg && !errorMsg.classList.contains('hidden'),
            errorText: errorMsg ? errorMsg.textContent : '',
            urlSearchAfterSubmit: search
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Hasil submit kosong:', resSubmitEmpty.result.value);

    console.log('\n--- UJI 4: INPUT TOKEN RESMI DAN BUKA PORTAL ---');
    const testToken = ['NSR', '8899'].join('');
    const resSubmitValid = await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          const inputEl = document.getElementById('gatekeeper-token-input');
          if (inputEl) inputEl.value = '${testToken}';
          const submitBtn = document.getElementById('btn-submit-gatekeeper');
          if (submitBtn) submitBtn.click();

          // Tunggu eksekusi asinkron muatDataTaskBoard selesai
          await new Promise(r => setTimeout(r, 1200));

          const gatekeeper = document.getElementById('modal-auth-gatekeeper');
          const mainApp = document.getElementById('main-tracking-app');
          const tbody = document.getElementById('task-board-tbody');
          const search = window.location.search;
          const sessionToken = sessionStorage.getItem('nsr_auth_token');

          return {
            gatekeeperHidden: !gatekeeper || window.getComputedStyle(gatekeeper).display === 'none' || gatekeeper.classList.contains('hidden'),
            mainVisible: mainApp && window.getComputedStyle(mainApp).display !== 'none',
            tbodyRows: tbody ? tbody.children.length : 0,
            sessionToken: sessionToken,
            urlSearch: search
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Hasil submit token valid:', resSubmitValid.result.value);

    // Kriteria Kelulusan
    const val1 = resAwal.result.value;
    const val2 = resEyeClick.result.value;
    const val3 = resSubmitEmpty.result.value;
    const val4 = resSubmitValid.result.value;

    const passMarkup = val1.hasInput && val1.hasEyeBtn && val1.hasSubmitBtn && val1.hasErrorDiv && val1.gatekeeperVisible && val1.mainHidden;
    const passEyeToggle = val2.inputTypeAfterClick === 'text' && val2.urlSearchAfterClick === '';
    const passEmptySubmit = val3.errorVisible && val3.urlSearchAfterSubmit === '';
    const passTokenAuth = val4.gatekeeperHidden && val4.mainVisible && val4.sessionToken === testToken && val4.urlSearch === '';

    const allPassed = passMarkup && passEyeToggle && passEmptySubmit && passTokenAuth;

    console.log('\n======================================================');
    console.log('REKAPITULASI PENGUJIAN INTERAKSI GATEKEEPER');
    console.log('1. Struktur Markup & Kondisi Awal Terkunci:', passMarkup);
    console.log('2. Toggle Tombol Mata (Text/Password, Anti-Reload):', passEyeToggle);
    console.log('3. Validasi Form Submit Kosong (Pesan Error, Anti-Reload):', passEmptySubmit);
    console.log('4. Otentikasi Token Sukses & Pembukaan Taskboard:', passTokenAuth);
    console.log('======================================================');

    if (allPassed) {
      console.log('🎉 SEMUA PENGUJIAN INTERAKSI GATEKEEPER LULUS 100%!');
    } else {
      console.error('❌ ADA PENGUJIAN INTERAKSI YANG GAGAL.');
    }

    ws.close();
    chromeProc.kill();
    server.close();

    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch (_) {}

    process.exit(allPassed ? 0 : 1);
  });
});
