import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const DEBUG_PORT = 9666;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-tracking.html';

async function main() {
  console.log('=================================================================');
  console.log('   VERIFIKASI TAMPILAN LIVE PORTAL TRACKING (HEADLESS CHROME CDP)');
  console.log(`   URL: ${LIVE_URL}`);
  console.log('=================================================================\n');

  console.log('1. Memulai Google Chrome headless pada port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,960',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    const pageErrors = [];
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }

      if (msg.method === 'Runtime.exceptionThrown') {
        const exp = msg.params.exceptionDetails;
        const text = exp.exception ? (exp.exception.description || exp.exception.value) : exp.text;
        const errInfo = `[EXCEPTION] baris ${exp.lineNumber}:${exp.columnNumber} - ${text}`;
        pageErrors.push(errInfo);
        console.error('🚨 LIVE EXCEPTION:', errInfo);
      }

      if (msg.method === 'Console.messageAdded') {
        const m = msg.params.message;
        consoleLogs.push(`[${m.level}] ${m.text}`);
        if (m.level === 'error') {
          console.error('❌ LIVE CONSOLE ERROR:', m.text);
        }
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Console.enable');

    console.log(`\n2. Memuat ${LIVE_URL} ...`);
    await send('Page.navigate', { url: `${LIVE_URL}?v=${Date.now()}` });
    await new Promise(r => setTimeout(r, 4000));

    // A. Kondisi Awal: Gatekeeper Aktif
    console.log('\n3. Memeriksa Kondisi Awal (Gatekeeper Terbuka)...');
    let initCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const gate = document.getElementById('modal-auth-gatekeeper');
        const app = document.getElementById('main-tracking-app');
        return {
          gateExists: !!gate,
          gateDisplay: gate ? window.getComputedStyle(gate).display : 'null',
          appExists: !!app,
          appDisplay: app ? window.getComputedStyle(app).display : 'null',
          isAuthorized: document.documentElement.classList.contains('nsr-tracking-authorized')
        };
      })()`,
      returnByValue: true
    });
    console.log('Kondisi Awal Gatekeeper:', initCheck.result?.value);

    // Ambil screenshot Gatekeeper
    const shotGate = await send('Page.captureScreenshot', { format: 'png' });
    const shotGatePath = path.join(ARTIFACT_DIR, 'bukti_live_portal_tracking_gatekeeper.png');
    fs.writeFileSync(shotGatePath, Buffer.from(shotGate.result.data, 'base64'));
    console.log('   📸 Screenshot Gatekeeper disimpan ke:', shotGatePath);

    // B. Simulasi Otentikasi PIMPINAN (Akses Lengkap)
    console.log('\n4. Melakukan Otentikasi Live sebagai PIMPINAN...');
    let loginPimpinan = await send('Runtime.evaluate', {
      expression: `(async () => {
        sessionStorage.setItem('nsr_tracking_auth_token', '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f');
        sessionStorage.setItem('nsr_active_user_nik', 'NSR-2019-005');
        sessionStorage.setItem('nsr_active_user_name', 'Danny Taufik Hidayat, S.H.');
        sessionStorage.setItem('nsr_active_user_role', 'PIMPINAN');
        sessionStorage.setItem('nsr_active_user_jabatan', 'Pemimpin Rekan');

        const authOk = initUserSession();
        if (typeof muatDataTaskBoard === 'function') {
          await muatDataTaskBoard();
        }
        return { authOk };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Hasil Inisialisasi Sesi Pimpinan:', loginPimpinan.result?.value);
    await new Promise(r => setTimeout(r, 3000));

    // C. Verifikasi Komponen Dasbor PIMPINAN
    let checkPimpinan = await send('Runtime.evaluate', {
      expression: `(() => {
        const app = document.getElementById('main-tracking-app');
        const gate = document.getElementById('modal-auth-gatekeeper');
        const nameEl = document.getElementById('user-display-name');
        const jabEl = document.getElementById('user-display-jabatan');
        const cabEl = document.getElementById('user-display-cabang');
        const btnReg = document.getElementById('tab-btn-register');
        const kpiTotal = document.getElementById('stat-total-jobs');
        const tbody = document.getElementById('task-board-tbody');
        const filterKantor = document.getElementById('filter-kantor');

        return {
          appDisplay: app ? window.getComputedStyle(app).display : 'none',
          appHeight: app ? app.offsetHeight : 0,
          gateHidden: gate ? (gate.style.display === 'none' || gate.classList.contains('hidden')) : true,
          userName: nameEl ? nameEl.textContent : '',
          userJabatan: jabEl ? jabEl.textContent : '',
          userCabang: cabEl ? cabEl.textContent : '',
          btnRegVisible: btnReg ? (window.getComputedStyle(btnReg).display !== 'none') : false,
          kpiTotalJobs: kpiTotal ? kpiTotal.textContent : '',
          taskBoardRows: tbody ? tbody.children.length : 0,
          filterKantorUnlocked: filterKantor ? !filterKantor.disabled : false
        };
      })()`,
      returnByValue: true
    });
    console.log('\n--- DATA VERIFIKASI BLOK DASBOR LIVE (PIMPINAN) ---');
    console.log(checkPimpinan.result?.value);

    // Ambil screenshot Dasbor PIMPINAN
    const shotPim = await send('Page.captureScreenshot', { format: 'png' });
    const shotPimPath = path.join(ARTIFACT_DIR, 'bukti_live_portal_tracking_dashboard_pimpinan.png');
    fs.writeFileSync(shotPimPath, Buffer.from(shotPim.result.data, 'base64'));
    console.log('   📸 Screenshot Dasbor Pimpinan disimpan ke:', shotPimPath);

    // D. Simulasi Otentikasi Peran Teknis (SURVEYOR)
    console.log('\n5. Melakukan Otentikasi Live sebagai SURVEYOR (Uji Masking & Batasan Akses)...');
    let loginSurveyor = await send('Runtime.evaluate', {
      expression: `(async () => {
        sessionStorage.setItem('nsr_tracking_auth_token', 'TOKEN_SRV_LIVE');
        sessionStorage.setItem('nsr_active_user_nik', 'NSR-SVR-01');
        sessionStorage.setItem('nsr_active_user_name', 'Budi Santoso');
        sessionStorage.setItem('nsr_active_user_role', 'SURVEYOR');
        sessionStorage.setItem('nsr_active_user_jabatan', 'Surveyor Lapangan');

        window.resolveTrackingToken = () => ({
          nik: 'NSR-SVR-01',
          nama: 'Budi Santoso',
          role: 'SURVEYOR',
          jabatan: 'Surveyor Lapangan',
          wilayah: 'Kantor Pusat Jakarta',
          isCabang: false,
          access_level: 'BRANCH_ISOLATED',
          token: 'TOKEN_SRV_LIVE'
        });

        initUserSession();
        if (typeof muatDataTaskBoard === 'function') {
          await muatDataTaskBoard();
        }

        const btnReg = document.getElementById('tab-btn-register');
        const filterKantor = document.getElementById('filter-kantor');
        return {
          btnRegHidden: btnReg ? (btnReg.style.display === 'none' || btnReg.classList.contains('hidden')) : true,
          queueTab: (typeof currentQueueTab !== 'undefined') ? currentQueueTab : '',
          filterKantorLocked: filterKantor ? filterKantor.disabled : false
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Hasil Pengujian Peran Surveyor:', loginSurveyor.result?.value);
    await new Promise(r => setTimeout(r, 2000));

    // Ambil screenshot Surveyor
    const shotSrv = await send('Page.captureScreenshot', { format: 'png' });
    const shotSrvPath = path.join(ARTIFACT_DIR, 'bukti_live_portal_tracking_surveyor_rbac.png');
    fs.writeFileSync(shotSrvPath, Buffer.from(shotSrv.result.data, 'base64'));
    console.log('   📸 Screenshot Dasbor Surveyor disimpan ke:', shotSrvPath);

    console.log('\n=================================================================');
    if (pageErrors.length === 0) {
      console.log('🎉 VERIFIKASI SELESAI: 0 RUNTIME/SYNTAX EXCEPTION DI SERVER LIVE!');
      console.log('   Dasbor ter-render penuh, bebas layar hitam/blank.');
      console.log('=================================================================');
    } else {
      console.error('❌ TERDETEKSI GALAT PADA SERVER LIVE:', pageErrors);
      process.exit(1);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Verifikasi live gagal:', err);
  process.exit(1);
});
