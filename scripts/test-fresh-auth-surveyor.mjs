import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const targetFile = path.join(projectRoot, 'portal-tracking.html');

console.log('Target file for Fresh Auth & Surveyor Test:', targetFile);

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

// Jalankan HTTP server lokal statis
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

const PORT = 8993;
server.listen(PORT, async () => {
  console.log(`Test web server running at http://localhost:${PORT}/portal-tracking.html`);

  const debugPort = 9225;
  const tempProfileDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-test-surveyor-' + Date.now());

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

    console.log('\n--- TAHAP 1: SIMULASI PENGOTORAN SESI GLOBAL DARI PORTAL LAIN ---');
    // Simulasikan bahwa di browser sebelumnya ada session Pak Nanang dari index.html / portal lain
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          // Injeksi data sesi global lama yang sering membajak akun
          localStorage.setItem('nsr_auth_token', 'NSR8899');
          localStorage.setItem('NSR_USER_SESSION', JSON.stringify({ nama: 'Ir. Nanang Rahayu', role: 'SUPER ADMIN' }));
          sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify({ nama: 'Ir. Nanang Rahayu', role: 'SUPER ADMIN' }));
          sessionStorage.setItem('kjpp_token_internal', JSON.stringify({ nama: 'Ir. Nanang Rahayu' }));
          
          // Pastikan nsr_tracking_auth_token KOSONG
          sessionStorage.removeItem('nsr_tracking_auth_token');
          
          // Panggil ulang initUserSession
          window.initUserSession();
        })()
      `,
      returnByValue: true
    });

    const cekKondisiTerkunci = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const gatekeeper = document.getElementById('modal-auth-gatekeeper');
          const mainApp = document.getElementById('main-tracking-app');
          const stateProfile = window.stateApp?.currentUserProfile;
          const bodyText = document.body.innerText;
          const isNanangHijacked = bodyText.includes('Ir. Nanang Rahayu');

          return {
            gatekeeperVisible: gatekeeper && window.getComputedStyle(gatekeeper).display !== 'none',
            mainHidden: !mainApp || window.getComputedStyle(mainApp).display === 'none',
            stateProfileNull: stateProfile === null,
            isNanangHijacked: isNanangHijacked
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Hasil Uji 1 (Harus Terkunci, Tidak Terbajak Akun Pak Nanang):', cekKondisiTerkunci.result.value);

    console.log('\n--- TAHAP 2: LOGIN DENGAN TOKEN SURVEYOR (NSR-SRV-2026) ---');
    const tokenSrv = ['NSR', 'SRV', '2026'].join('-');
    const resLoginSurveyor = await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          const inputEl = document.getElementById('gatekeeper-token-input');
          if (inputEl) inputEl.value = '${tokenSrv}';
          const submitBtn = document.getElementById('btn-submit-gatekeeper');
          if (submitBtn) submitBtn.click();

          await new Promise(r => setTimeout(r, 1200));

          const userDisplayName = document.getElementById('user-display-name')?.textContent?.trim();
          const userDisplayJabatan = document.getElementById('user-display-jabatan')?.textContent?.trim();
          const userDisplayCabang = document.getElementById('user-display-cabang')?.textContent?.trim();
          const sessionUser = window.stateApp?.currentUserProfile;
          const trackingToken = sessionStorage.getItem('nsr_tracking_auth_token');

          // Uji Wewenang Eskalasi Tahap 7 Milestone untuk SURVEYOR
          const dummyJob = { id_jo: 'JO-JKT-2026-001' };
          const izinM01 = window.cekIzinEskalasiTahap(dummyJob, 'M-01', sessionUser);
          const izinM02 = window.cekIzinEskalasiTahap(dummyJob, 'M-02', sessionUser);
          const izinM03 = window.cekIzinEskalasiTahap(dummyJob, 'M-03', sessionUser);
          const izinM04 = window.cekIzinEskalasiTahap(dummyJob, 'M-04', sessionUser);
          const izinM05 = window.cekIzinEskalasiTahap(dummyJob, 'M-05', sessionUser);
          const izinM06 = window.cekIzinEskalasiTahap(dummyJob, 'M-06', sessionUser);
          const izinM07 = window.cekIzinEskalasiTahap(dummyJob, 'M-07', sessionUser);

          return {
            trackingToken,
            userDisplayName,
            userDisplayJabatan,
            userDisplayCabang,
            role: sessionUser?.role,
            isNanang: userDisplayName.includes('Nanang'),
            isSurveyorName: userDisplayName === 'Tim Surveyor Lapangan',
            izinM01: izinM01.diizinkan,
            izinM02: izinM02.diizinkan,
            izinM03: izinM03.diizinkan, // WAJIB TRUE
            izinM04: izinM04.diizinkan, // WAJIB FALSE
            izinM05: izinM05.diizinkan, // WAJIB FALSE
            izinM06: izinM06.diizinkan, // WAJIB FALSE
            izinM07: izinM07.diizinkan  // WAJIB FALSE
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Hasil Uji 2 (Profil & Wewenang Khusus Surveyor):', resLoginSurveyor.result.value);

    console.log('\n--- TAHAP 3: KLIK TOMBOL KELUAR DI NAVBAR ---');
    const resLogout = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const btnLogout = document.getElementById('btn-navbar-logout');
          if (btnLogout) btnLogout.click();

          const gatekeeper = document.getElementById('modal-auth-gatekeeper');
          const mainApp = document.getElementById('main-tracking-app');
          const trackingToken = sessionStorage.getItem('nsr_tracking_auth_token');
          const stateProfile = window.stateApp?.currentUserProfile;

          return {
            tokenCleared: trackingToken === null,
            gatekeeperVisible: gatekeeper && window.getComputedStyle(gatekeeper).display !== 'none',
            mainHidden: !mainApp || window.getComputedStyle(mainApp).display === 'none',
            stateProfileNull: stateProfile === null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Hasil Uji 3 (Klik Tombol Keluar Langsung Mengunci):', resLogout.result.value);

    // Kriteria Kelulusan
    const val1 = cekKondisiTerkunci.result.value;
    const val2 = resLoginSurveyor.result.value;
    const val3 = resLogout.result.value;

    const passAntiHijack = val1.gatekeeperVisible && val1.mainHidden && val1.stateProfileNull && !val1.isNanangHijacked;
    const passSurveyorProfile = val2.isSurveyorName && !val2.isNanang && val2.role === 'SURVEYOR';
    const passSurveyorPermissions = val2.izinM03 === true &&
                                    val2.izinM01 === false &&
                                    val2.izinM02 === false &&
                                    val2.izinM04 === false &&
                                    val2.izinM05 === false &&
                                    val2.izinM06 === false &&
                                    val2.izinM07 === false;
    const passLogout = val3.tokenCleared && val3.gatekeeperVisible && val3.mainHidden && val3.stateProfileNull;

    const allPassed = passAntiHijack && passSurveyorProfile && passSurveyorPermissions && passLogout;

    console.log('\n======================================================');
    console.log('REKAPITULASI PENGUJIAN FRESH AUTH & SURVEYOR PROFILE');
    console.log('1. Anti-Pembajakan Sesi Global (Fresh Auth Wajib):', passAntiHijack);
    console.log('2. Pemetaan Tepat Token NSR-SRV-2026 (Bukan Pak Nanang):', passSurveyorProfile);
    console.log('3. Wewenang Eksklusif Tahap M-03 (M-01, M-02, M-04 s/d M-07 Ditolak):', passSurveyorPermissions);
    console.log('4. Tombol Keluar Menghapus Sesi & Mengunci Layar:', passLogout);
    console.log('======================================================');

    if (allPassed) {
      console.log('🎉 SELURUH PENGUJIAN FRESH AUTH & PROFIL SURVEYOR LULUS 100%!');
    } else {
      console.error('❌ ADA PENGUJIAN YANG GAGAL.');
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
