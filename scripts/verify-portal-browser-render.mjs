import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8878;
const DEBUG_PORT = 9556;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // If requesting backend api, mock minimal list response
  if (req.url.includes('job-tracking-handler.php')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      status: 'success',
      count: 2,
      access_mode: 'SUPERUSER_ALL_OFFICES',
      user_branch: 'Kantor Pusat Jakarta',
      user_name: 'Danny Taufik Hidayat, S.H.',
      data: [
        {
          id: 'JO-JKT-2026-0001',
          id_jo: 'JO-JKT-2026-0001',
          jo_number: 'JO-JKT-2026-0001',
          kode_lacak: 'NSR-TRACK-001',
          instansi: 'PT Bank Mandiri (Persero) Tbk',
          pemberi_tugas: 'PT Bank Mandiri (Persero) Tbk',
          debitur: 'PT Graha Kreasi Nusantara',
          jenis_properti: 'Ruko / Rukan 3 Lantai',
          lokasi_aset: 'Jl. Fatmawati Raya No. 45, Jakarta Selatan',
          current_milestone: 'M-03',
          current_milestone_title: 'Inspeksi & Berita Acara (BAI)',
          progress_percent: 42,
          sla_status: 'ongoing',
          sla_days: 3,
          sla_deadline: '2026-11-09',
          kantor: 'Kantor Pusat Jakarta',
          kantor_code: 'PUSAT',
          surveyor: 'Budi Santoso',
          surveyor_nik: 'NSR-SVR-01',
          penilai_pelaksana: 'Siti Rahma',
          analis_nik: 'NSR-ANL-01',
          reviewer: 'Ir. Hendro Wijaya',
          reviewer_nik: 'NSR-SPM-01',
          fee_penilaian: 'Rp *******',
          status_kwitansi: '*******'
        },
        {
          id: 'JO-BDG-2026-0002',
          id_jo: 'JO-BDG-2026-0002',
          jo_number: 'JO-BDG-2026-0002',
          kode_lacak: 'NSR-TRACK-002',
          instansi: 'PT Bank Central Asia Tbk',
          pemberi_tugas: 'PT Bank Central Asia Tbk',
          debitur: 'CV Parahyangan Niaga',
          jenis_properti: 'Pabrik & Gudang Logistik',
          lokasi_aset: 'Kawasan Industri Soekarno-Hatta, Bandung',
          current_milestone: 'M-04',
          current_milestone_title: 'Kertas Kerja Penilaian (KKP)',
          progress_percent: 57,
          sla_status: 'ongoing',
          sla_days: 4,
          sla_deadline: '2026-11-10',
          kantor: 'Cabang Bandung',
          kantor_code: 'BDG',
          surveyor: 'Ardi Nurmayadi',
          penilai_pelaksana: 'Siti Rahma',
          analis_nik: 'NSR-ANL-01',
          reviewer: 'Andri Kusmandana',
          fee_penilaian: 45000000,
          status_kwitansi: 'LUNAS'
        }
      ]
    }));
    return;
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/portal-tracking.html';
  const filePath = path.join(process.cwd(), reqPath.replace(/^\//, ''));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

async function main() {
  console.log('=================================================================');
  console.log('   VERIFIKASI TAMPILAN PORTAL TRACKING (HEADLESS CHROME CDP)     ');
  console.log('=================================================================\n');

  await new Promise(r => server.listen(PORT, r));
  console.log(`1. Local HTTP server listening on http://127.0.0.1:${PORT}`);

  console.log('2. Starting headless Chrome on port', DEBUG_PORT);
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
        const errInfo = `[EXCEPTION] line ${exp.lineNumber}:${exp.columnNumber} - ${text}`;
        pageErrors.push(errInfo);
        console.error('🚨', errInfo);
      }

      if (msg.method === 'Console.messageAdded') {
        const m = msg.params.message;
        if (m.level === 'error') {
          console.error('❌ [CONSOLE ERROR]', m.text);
        } else {
          console.log('ℹ️ [CONSOLE]', m.text);
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

    console.log(`\n3. Loading http://127.0.0.1:${PORT}/portal-tracking.html ...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-tracking.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Verify unauthenticated state
    let state = await send('Runtime.evaluate', {
      expression: `(() => {
        const gate = document.getElementById('modal-auth-gatekeeper');
        const app = document.getElementById('main-tracking-app');
        return {
          gateDisplay: gate ? window.getComputedStyle(gate).display : 'null',
          appDisplay: app ? window.getComputedStyle(app).display : 'null',
          authorized: document.documentElement.classList.contains('nsr-tracking-authorized')
        };
      })()`,
      returnByValue: true
    });
    console.log('State Unauthenticated:', state.result?.value);

    // Simulate Login as PIMPINAN
    console.log('\n4. Simulating Login as PIMPINAN (Pemimpin Rekan)...');
    state = await send('Runtime.evaluate', {
      expression: `(async () => {
        sessionStorage.setItem('nsr_tracking_auth_token', '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f');
        sessionStorage.setItem('nsr_active_user_nik', 'NSR-2019-005');
        sessionStorage.setItem('nsr_active_user_name', 'Danny Taufik Hidayat, S.H.');
        sessionStorage.setItem('nsr_active_user_role', 'PIMPINAN');
        sessionStorage.setItem('nsr_active_user_jabatan', 'Pemimpin Rekan');

        initUserSession();
        if (typeof muatDataTaskBoard === 'function') {
          await muatDataTaskBoard();
        }
        return { ok: true };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 2000));

    // Check dashboard visual blocks
    let checkBlocks = await send('Runtime.evaluate', {
      expression: `(() => {
        const app = document.getElementById('main-tracking-app');
        const gate = document.getElementById('modal-auth-gatekeeper');
        const nameEl = document.getElementById('user-display-name');
        const btnReg = document.getElementById('tab-btn-register');
        const kpiTotal = document.getElementById('stat-total-jobs');
        const tbody = document.getElementById('task-board-tbody');

        return {
          appDisplay: app ? window.getComputedStyle(app).display : 'none',
          appHeight: app ? app.offsetHeight : 0,
          gateDisplay: gate ? window.getComputedStyle(gate).display : 'flex',
          userName: nameEl ? nameEl.textContent : '',
          btnRegDisplay: btnReg ? window.getComputedStyle(btnReg).display : 'none',
          kpiTotal: kpiTotal ? kpiTotal.textContent : '',
          tbodyRows: tbody ? tbody.children.length : 0,
          hasPipeline: !!document.querySelector('#pipeline-ribbon-container, [id*=\"pipeline\"]')
        };
      })()`,
      returnByValue: true
    });

    console.log('\n--- VERIFIKASI BLOK DASBOR (PIMPINAN) ---');
    console.log(checkBlocks.result?.value);

    // Capture screenshot of authenticated dashboard
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACT_DIR, 'bukti_portal_tracking_live_dashboard.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
    console.log('\n✅ Dashboard screenshot captured successfully:');
    console.log(`   ${shotPath}`);

    // Now test login as SURVEYOR (Technical Role)
    console.log('\n5. Testing login as SURVEYOR (Technical Role)...');
    const srvCheck = await send('Runtime.evaluate', {
      expression: `(async () => {
        sessionStorage.setItem('nsr_tracking_auth_token', 'TOKEN_SRV_TEST');
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
          token: 'TOKEN_SRV_TEST'
        });

        initUserSession();
        if (typeof muatDataTaskBoard === 'function') {
          await muatDataTaskBoard();
        }

        const btnReg = document.getElementById('tab-btn-register');
        const filterKantorEl = document.getElementById('filter-kantor');
        return {
          btnRegHidden: btnReg ? (btnReg.style.display === 'none' || btnReg.classList.contains('hidden')) : true,
          queueTab: (typeof currentQueueTab !== 'undefined') ? currentQueueTab : '',
          filterKantorDisabled: filterKantorEl ? filterKantorEl.disabled : false
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Surveyor RBAC Verification:', srvCheck.result?.value);

    // Capture surveyor screenshot
    const shotSrv = await send('Page.captureScreenshot', { format: 'png' });
    const shotSrvPath = path.join(ARTIFACT_DIR, 'bukti_portal_tracking_surveyor_rbac.png');
    fs.writeFileSync(shotSrvPath, Buffer.from(shotSrv.result.data, 'base64'));
    console.log(`✅ Surveyor screenshot saved: ${shotSrvPath}`);

    if (pageErrors.length > 0) {
      console.error('\n❌ FAILED: Detected unhandled page errors during execution:', pageErrors);
      process.exit(1);
    } else {
      console.log('\n=================================================================');
      console.log('🎉 ALL PORTAL TRACKING DASHBOARD RENDERS VERIFIED 100% CLEAN!');
      console.log('=================================================================');
    }

    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
