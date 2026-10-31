import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const targetFile = path.join(projectRoot, 'portal-tracking.html');

console.log('Target file for incognito test:', targetFile);

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

console.log('Using Chrome binary:', chromePath);

// Jalankan HTTP server lokal statis sederhana untuk melayani direktori proyek
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

const PORT = 8991;
server.listen(PORT, async () => {
  console.log(`Test web server running at http://localhost:${PORT}/portal-tracking.html`);

  const debugPort = 9223;
  const tempProfileDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-test-incognito-' + Date.now());

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

    // Tunggu hingga event loadEventFired selesai
    await new Promise((resolve) => {
      const onLoad = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Page.loadEventFired') {
          ws.removeEventListener('message', onLoad);
          resolve();
        }
      };
      ws.addEventListener('message', onLoad);
      // Timeout maksimal 10 detik jika load event sudah lewat
      setTimeout(resolve, 5000);
    });

    // Beri jeda 1 detik untuk inisialisasi JS DOMContentLoaded
    await new Promise(r => setTimeout(r, 1000));

    // Evaluasi 4 Kriteria Keamanan Fail-Closed di Lingkungan Bersih (Incognito)
    const evalScript = `
      (() => {
        const pageTitle = document.title;
        const pageHref = window.location.href;
        const mainApp = document.getElementById('main-tracking-app');
        const mainComputedDisplay = mainApp ? window.getComputedStyle(mainApp).display : 'none';
        
        const tbody = document.getElementById('task-board-tbody');
        const tbodyChildCount = tbody ? tbody.children.length : 0;
        const tbodyText = tbody ? tbody.innerText.trim() : '';

        const gatekeepers = document.querySelectorAll('#modal-auth-gatekeeper');
        const gatekeeper = document.getElementById('modal-auth-gatekeeper');
        const gatekeeperComputedDisplay = gatekeeper ? window.getComputedStyle(gatekeeper).display : 'none';
        const gatekeeperVisible = gatekeeperComputedDisplay !== 'none' && !gatekeeper.classList.contains('hidden');

        const bodyText = document.body.innerText;
        const containsDummyFallback = bodyText.includes('Sesi Internal Staf') || bodyText.includes('Kantor Pusat / Cabang');
        
        // Cek data debitur / bank penugasan
        const containsBankData = bodyText.includes('BANK MANDIRI') || bodyText.includes('PT GRAHA') || bodyText.includes('PT MAJU');

        const stateProfile = window.stateApp ? window.stateApp.currentUserProfile : null;

        const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
        const last10Ids = allIds.slice(-10);

        return {
          allIdsCount: allIds.length,
          last10Ids,
          hasGatekeeperId: allIds.includes('modal-auth-gatekeeper'),
          pageTitle,
          pageHref,
          gatekeeperCount: gatekeepers.length,
          gatekeeperTag: gatekeeper ? gatekeeper.tagName : null,
          gatekeeperOuter: gatekeeper ? gatekeeper.outerHTML.substring(0, 150) : null,
          mainComputedDisplay,
          mainHidden: mainComputedDisplay === 'none',
          tbodyChildCount,
          tbodyEmpty: tbodyChildCount === 0 || tbodyText === '',
          gatekeeperComputedDisplay,
          gatekeeperClasses: gatekeeper ? gatekeeper.className : '',
          gatekeeperVisible,
          containsDummyFallback,
          containsBankData,
          stateProfile
        };
      })()
    `;

    const res = await sendCommand('Runtime.evaluate', {
      expression: evalScript,
      returnByValue: true
    });

    const result = res && res.result ? res.result.value : (res ? res.value : null);
    if (!result) {
      console.error('Failed to get evaluation result:', res);
      ws.close();
      chromeProc.kill();
      server.close();
      process.exit(1);
    }
    console.log('\n======================================================');
    console.log('HASIL PENGUJIAN INCOGNITO FAIL-CLOSED (ZERO-TRUST)');
    console.log('Page Title:', result.pageTitle);
    console.log('Page URL:', result.pageHref);
    console.log('Total IDs found:', result.allIdsCount, 'Has Gatekeeper ID:', result.hasGatekeeperId);
    console.log('Last 10 IDs in DOM:', result.last10Ids);
    console.log('======================================================');
    console.log('1. Computed style #main-tracking-app display: none ->', result.mainHidden, `(Actual: ${result.mainComputedDisplay})`);
    console.log('2. #task-board-tbody kosong (children.length === 0) ->', result.tbodyEmpty, `(Count: ${result.tbodyChildCount})`);
    console.log('Gatekeeper count:', result.gatekeeperCount, 'Tag:', result.gatekeeperTag, 'Outer:', result.gatekeeperOuter);
    console.log('3. Modal Gatekeeper terlihat di layar ->', result.gatekeeperVisible, `(Display: ${result.gatekeeperComputedDisplay}, Classes: "${result.gatekeeperClasses}")`);
    console.log('4. String "Sesi Internal Staf" TIDAK muncul di body ->', !result.containsDummyFallback);
    console.log('5. Data penugasan / bank perbankan TIDAK bocor ->', !result.containsBankData);
    console.log('6. window.stateApp.currentUserProfile bernilai null ->', result.stateProfile === null);

    const allPassed = result.mainHidden &&
                      result.tbodyEmpty &&
                      result.gatekeeperVisible &&
                      !result.containsDummyFallback &&
                      !result.containsBankData &&
                      result.stateProfile === null;

    console.log('======================================================');
    if (allPassed) {
      console.log('🎉 SEMUA PENGUJIAN ZERO-TRUST FAIL-CLOSED LULUS 100%!');
    } else {
      console.error('❌ PENGUJIAN GAGAL: Ada kriteria keamanan yang belum terpenuhi.');
    }
    console.log('======================================================\n');

    ws.close();
    chromeProc.kill();
    server.close();

    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch (_) {}

    process.exit(allPassed ? 0 : 1);
  });
});
