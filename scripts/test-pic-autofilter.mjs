import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const targetFile = path.join(projectRoot, 'portal-tracking.html');

console.log('Target file for PIC Auto-Filter Test:', targetFile);

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

// Jalankan HTTP server lokal statis dengan Mock Backend API
const mockJobs = [
  {
    id: 'JO-JKT-2026-001',
    id_jo: 'JO-JKT-2026-001',
    jo_number: 'JO-JKT-2026-001',
    no_spk: 'SPK/NSR-PST/01/2026',
    spk_number: 'SPK/NSR-PST/01/2026',
    instansi: 'Bank Mandiri (Persero) Tbk',
    nama_instansi: 'Bank Mandiri (Persero) Tbk',
    debitur: 'Hendra Wijaya, S.T.',
    nama_debitur: 'Hendra Wijaya, S.T.',
    jenis_properti: 'Tanah & Bangunan Rumah Tinggal Mewah',
    jenis_objek: 'Tanah & Bangunan Rumah Tinggal Mewah',
    lokasi_aset: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
    kantor: 'Kantor Pusat Jakarta',
    cabang: 'Kantor Pusat Jakarta',
    current_milestone: 'M-03',
    milestone: 'M-03',
    status_label: 'Survei Lapangan & Inspeksi Fisik',
    surveyor: 'Fadri Nurdin',
    pic_surveyor_nik: 'NSR-2019-010',
    penilai_pelaksana: 'Fadri Nurdin',
    pic_penilai_nik: 'NSR-2019-010',
    reviewer: 'Tedi Setiadi',
    pic_reviewer_nik: 'NSR-2019-007',
    sla_hours_left: 48,
    is_sla_warning: false
  },
  {
    id: 'JO-BDG-2026-002',
    id_jo: 'JO-BDG-2026-002',
    jo_number: 'JO-BDG-2026-002',
    no_spk: 'SPK/NSR-BDG/02/2026',
    spk_number: 'SPK/NSR-BDG/02/2026',
    instansi: 'Bank BCA KCU Dago',
    nama_instansi: 'Bank BCA KCU Dago',
    debitur: 'PT Priangan Mega Properti',
    nama_debitur: 'PT Priangan Mega Properti',
    jenis_properti: 'Gedung Kantor & Commercial Space',
    jenis_objek: 'Gedung Kantor & Commercial Space',
    lokasi_aset: 'Jl. Ir. H. Djuanda No. 128, Dago, Bandung',
    kantor: 'Cabang Bandung',
    cabang: 'Cabang Bandung',
    current_milestone: 'M-04',
    milestone: 'M-04',
    status_label: 'Olah Data Pasar & Kertas Kerja DRC',
    surveyor: 'Rahmat Muhammad Hussein',
    pic_surveyor_nik: 'NSR-BDG-2020-43',
    penilai_pelaksana: 'Ardi Nurmayadi',
    pic_penilai_nik: 'NSR-BDG-2020-39',
    reviewer: 'Andri Kusmandana',
    pic_reviewer_nik: 'NSR-BDG-2020-40',
    sla_hours_left: 24,
    is_sla_warning: false
  }
];

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  if (reqPath.includes('job-tracking-handler.php')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      data: mockJobs,
      total: mockJobs.length
    }));
    return;
  }

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

const PORT = 8994;
server.listen(PORT, async () => {
  console.log(`Test web server running at http://localhost:${PORT}/portal-tracking.html`);

  const debugPort = 9226;
  const tempProfileDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-test-pic-' + Date.now());

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

    console.log('\n=============================================================');
    console.log('--- TEST 1: VERIFIKASI ZERO-TRUST & MODAL LAPIS 2 NIK ---');
    console.log('=============================================================');

    const checkInitialState = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const gatekeeper = document.getElementById('modal-auth-gatekeeper');
          const tokenInput = document.getElementById('gatekeeper-token-input');
          const nikInput = document.getElementById('gatekeeper-nik-input');
          const mainApp = document.getElementById('main-tracking-app');

          return {
            gatekeeperVisible: gatekeeper && window.getComputedStyle(gatekeeper).display !== 'none',
            tokenInputExists: !!tokenInput,
            nikInputExists: !!nikInput,
            mainAppHidden: !mainApp || window.getComputedStyle(mainApp).display === 'none'
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Status Gerbang Awal:', checkInitialState.result.value);

    if (!checkInitialState.result.value.gatekeeperVisible || !checkInitialState.result.value.nikInputExists) {
      console.error('FAIL: Modal gatekeeper atau input NIK Lapis 2 tidak terdeteksi!');
      process.exit(1);
    }

    console.log('\n=============================================================');
    console.log('--- TEST 2: LOGIN LAPIS 2 SURVEYOR (FADRI NURDIN - NSR-2019-010) ---');
    console.log('=============================================================');
    const tokenSrv = ['NSR', 'SRV', '2026'].join('-');
    const testNik = 'NSR-2019-010';

    const testLoginSurveyor = await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          const tokenInput = document.getElementById('gatekeeper-token-input');
          const nikInput = document.getElementById('gatekeeper-nik-input');
          tokenInput.value = '${tokenSrv}';
          tokenInput.dispatchEvent(new Event('input', { bubbles: true }));

          nikInput.value = '${testNik}';
          nikInput.dispatchEvent(new Event('input', { bubbles: true }));

          // Ambil preview deteksi NIK
          const detectedPreview = document.getElementById('gatekeeper-nik-detected')?.textContent?.trim();

          // Klik tombol submit
          const submitBtn = document.getElementById('btn-submit-gatekeeper');
          submitBtn.click();

          await new Promise(r => setTimeout(r, 1500));

          // Cek info profil di navbar
          const userName = document.getElementById('user-display-name')?.textContent?.trim();
          const userNik = document.getElementById('user-display-nik')?.textContent?.trim();
          const userJabatan = document.getElementById('user-display-jabatan')?.textContent?.trim();
          const userRole = document.getElementById('user-display-role')?.textContent?.trim();

          // Cek tab queue aktif
          const activeTab = window.stateApp?.activeQueueTab || (typeof currentQueueTab !== 'undefined' ? currentQueueTab : null);
          const myTaskCount = parseInt(document.getElementById('badge-my-tasks-count')?.textContent || '0', 10);
          const allTaskCount = parseInt(document.getElementById('badge-all-tasks-count')?.textContent || '0', 10);

          // Cek baris tabel yang dirender
          const renderedRows = Array.from(document.querySelectorAll('#task-board-tbody tr[id^="job-row-"]')).map(tr => tr.id);

          return {
            detectedPreview,
            userName,
            userNik,
            userJabatan,
            userRole,
            activeTab,
            myTaskCount,
            allTaskCount,
            renderedRows
          };
        })()
      `,
      returnByValue: true,
      awaitPromise: true
    });
    console.log('Hasil Login Surveyor Lapis 2:', testLoginSurveyor.result.value);

    const srvRes = testLoginSurveyor.result.value;
    if (!srvRes.userName.includes('Fadri Nurdin')) {
      console.error('FAIL: User display name bukan Fadri Nurdin!');
      process.exit(1);
    }
    if (!srvRes.userNik.includes('NSR-2019-010')) {
      console.error('FAIL: User NIK bukan NSR-2019-010!');
      process.exit(1);
    }
    if (srvRes.activeTab !== 'my_tasks') {
      console.error('FAIL: Tab default bukan "my_tasks"!');
      process.exit(1);
    }
    // Fadri Nurdin adalah PIC di JO-JKT-2026-001 (Surveyor/Pelaksana)
    if (!srvRes.renderedRows.some(id => id.includes('JO-JKT-2026-001'))) {
      console.error('FAIL: Job JO-JKT-2026-001 tidak ditemukan di antrean tugas Fadri Nurdin!');
      process.exit(1);
    }
    if (srvRes.renderedRows.some(id => id.includes('JO-BDG-2026-002'))) {
      console.error('FAIL: Job JO-BDG-2026-002 seharusnya TIDAK MUNCUL di tab Tugas Saya Fadri Nurdin!');
      process.exit(1);
    }

    console.log('SUCCESS: Auto-Filter Tugas Saya berhasil memfilter berkas spesifik PIC Fadri Nurdin.');

    console.log('\n=============================================================');
    console.log('--- TEST 3: PENGECEKAN TOMBOL MAJUKAN & PENGUNCIAN WEWENANG PIC ---');
    console.log('=============================================================');

    const testButtonPermissions = await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          // 1. Cek tombol Majukan di tab "my_tasks" untuk JO-JKT-2026-001
          const btnJkt = document.getElementById('btn-majukan-JO-JKT-2026-001');
          const isJktDisabled = Boolean(btnJkt && btnJkt.disabled);
          const jktBtnText = btnJkt?.textContent?.trim();

          // 2. Beralih ke tab "all_tasks"
          window.setQueueTab('all_tasks');
          await new Promise(r => setTimeout(r, 600));

          const renderedAllRows = Array.from(document.querySelectorAll('#task-board-tbody tr[id^="job-row-"]')).map(tr => tr.id);
          
          // Tombol di JO-BDG-2026-002 (di mana PIC adalah Hendra Wijaya / Ardi Nurmayadi, bukan Fadri Nurdin)
          const btnBdg = document.getElementById('btn-majukan-JO-BDG-2026-002');
          const isBdgDisabled = Boolean(btnBdg && btnBdg.disabled);
          const bdgBtnTitle = btnBdg?.getAttribute('title');
          const bdgBtnText = btnBdg?.textContent?.trim();

          return {
            isJktDisabled,
            jktBtnText,
            renderedAllRows,
            isBdgDisabled,
            bdgBtnTitle,
            bdgBtnText
          };
        })()
      `,
      returnByValue: true,
      awaitPromise: true
    });
    console.log('Hasil Uji Wewenang Tombol PIC:', testButtonPermissions.result.value);

    const btnRes = testButtonPermissions.result.value;
    if (btnRes.isJktDisabled) {
      console.error('FAIL: Tombol Majukan untuk JO-JKT-2026-001 harus aktif untuk PIC Fadri Nurdin!');
      process.exit(1);
    }
    if (!btnRes.isBdgDisabled) {
      console.error('FAIL: Tombol Majukan untuk JO-BDG-2026-002 HARUS TERKUNCI/DISABLED untuk non-PIC Fadri Nurdin!');
      process.exit(1);
    }
    if (!btnRes.bdgBtnTitle || !btnRes.bdgBtnTitle.includes('Terkunci')) {
      console.error('FAIL: Title tooltip tombol JO-BDG harus menginformasikan bahwa berkas terkunci PIC!');
      process.exit(1);
    }

    console.log('SUCCESS: Penguncian tombol Majukan berbasis PIC terverifikasi aman.');

    console.log('\n=============================================================');
    console.log('--- TEST 4: LOGOUT DAN LOGIN SUPER ADMIN (NSR8899 AUTO-FILL NIK) ---');
    console.log('=============================================================');

    const testAdminLogin = await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          // Logout
          window.keluarSesiTracking();
          await new Promise(r => setTimeout(r, 600));

          const masterToken = ['NSR', '8899'].join('');
          const tokenInput = document.getElementById('gatekeeper-token-input');
          const nikInput = document.getElementById('gatekeeper-nik-input');

          tokenInput.value = masterToken;
          tokenInput.dispatchEvent(new Event('input', { bubbles: true }));

          // Cek auto-fill NIK
          const autoFilledNik = nikInput.value;

          // Submit
          document.getElementById('btn-submit-gatekeeper').click();
          await new Promise(r => setTimeout(r, 1500));

          const adminName = document.getElementById('user-display-name')?.textContent?.trim();
          const adminNik = document.getElementById('user-display-nik')?.textContent?.trim();
          const activeQueueTab = window.stateApp?.activeQueueTab || (typeof currentQueueTab !== 'undefined' ? currentQueueTab : null);
          const rows = Array.from(document.querySelectorAll('#task-board-tbody tr[id^="job-row-"]')).map(tr => tr.id);

          // Cek tombol di kedua berkas: harus aktif semua untuk Super Admin
          const btn1 = document.getElementById('btn-majukan-JO-JKT-2026-001');
          const btn2 = document.getElementById('btn-majukan-JO-BDG-2026-002');

          return {
            autoFilledNik,
            adminName,
            adminNik,
            activeQueueTab,
            rowCount: rows.length,
            btn1Disabled: Boolean(btn1 && btn1.disabled),
            btn2Disabled: Boolean(btn2 && btn2.disabled)
          };
        })()
      `,
      returnByValue: true,
      awaitPromise: true
    });
    console.log('Hasil Uji Super Admin Master:', testAdminLogin.result.value);

    const adminRes = testAdminLogin.result.value;
    if (adminRes.autoFilledNik !== 'NSR-2019-001') {
      console.error('FAIL: NIK untuk Super Admin NSR8899 tidak terisi otomatis sebagai NSR-2019-001!');
      process.exit(1);
    }
    if (!adminRes.adminName.includes('Nanang Rahayu')) {
      console.error('FAIL: Nama Super Admin bukan Ir. Nanang Rahayu!');
      process.exit(1);
    }
    if (adminRes.btn1Disabled || adminRes.btn2Disabled) {
      console.error('FAIL: Super Admin harus memiliki bypass wewenang untuk memajukan semua berkas!');
      process.exit(1);
    }

    console.log('\n=============================================================');
    console.log('ALL TESTS PASSED: Layer 2 NIK Auto-Filter & PIC Enforcement BERHASIL 100%!');
    console.log('=============================================================');

    ws.close();
    chromeProc.kill();
    server.close();
    process.exit(0);
  });
});
