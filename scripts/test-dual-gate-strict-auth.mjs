import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import assert from 'assert';

const PORT = 8116;
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/portal-tracking.html';
  const filePath = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production' + reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    let mime = 'text/html';
    if (ext === '.css') mime = 'text/css';
    if (ext === '.js' || ext === '.mjs') mime = 'application/javascript';
    if (ext === '.png') mime = 'image/png';
    if (ext === '.json') mime = 'application/json';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  } else if (reqPath.includes('backend/job-tracking-handler.php') || reqPath.includes('backend/auth-nik-presensi.php')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', data: [] }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const debuggingPort = 9256;
  const userDataDir = path.resolve('C:/Users/HP/AppData/Local/Temp/chrome-test-dual-gate-' + Date.now());

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    let tData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const tRes = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?about:blank`, { method: 'PUT' });
        tData = await tRes.json();
        if (tData && tData.webSocketDebuggerUrl) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        const handler = (e) => {
          const res = JSON.parse(e.data);
          if (res.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    
    ws.addEventListener('message', (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER UNCAUGHT]', JSON.stringify(msg.params.exceptionDetails));
        }
      } catch (_) {}
    });
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('\n======================================================');
    console.log('TEST SUITE: DUAL-GATE STRICT VERIFICATION & KING OVERRIDE');
    console.log('======================================================');

    // -----------------------------------------------------------------
    // TEST 1: Token Bandung + NIK Sembarangan -> HARUS GAGAL (Ditolak)
    // -----------------------------------------------------------------
    console.log('\n[TEST 1] Token Bandung + NIK Sembarangan -> HARUS GAGAL');
    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-tracking.html` });
    
    // Wait until gatekeeper-token-input exists in DOM
    for (let i = 0; i < 30; i++) {
      const chk = await send('Runtime.evaluate', {
        expression: '!!document.getElementById("gatekeeper-token-input")'
      });
      if (chk.result?.value === true) break;
      await new Promise(r => setTimeout(r, 300));
    }

    // Clear any previous session and submit Bandung token with dummy NIK
    const resTest1 = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        sessionStorage.clear();
        localStorage.clear();
        
        const tokenInput = document.getElementById('gatekeeper-token-input');
        const nikInput = document.getElementById('gatekeeper-nik-input');
        const btnSubmit = document.getElementById('btn-submit-gatekeeper');
        
        tokenInput.value = 'NSR-BDG-2026';
        nikInput.value = 'NSR-999-SEMBARANGAN';
        
        // Execute submitAuth
        const ok = await window.submitAuth();
        
        const errEl = document.getElementById('gatekeeper-error-msg');
        const modal = document.getElementById('modal-auth-gatekeeper');
        const mainApp = document.getElementById('main-tracking-app');
        
        return {
          submitResult: ok,
          errText: errEl ? errEl.textContent.trim() : '',
          errVisible: errEl ? !errEl.classList.contains('hidden') : false,
          modalVisible: modal ? !modal.classList.contains('hidden') : false,
          mainAppHidden: mainApp ? (mainApp.style.display === 'none' || mainApp.style.display === '') : true,
          savedToken: sessionStorage.getItem('nsr_tracking_auth_token')
        };
      })()`
    });

    const val1 = resTest1.result?.value || resTest1.value || {};
    if (resTest1.exceptionDetails) {
      console.error('  Evaluate Exception Test 1:', JSON.stringify(resTest1.exceptionDetails));
    }
    console.log('  resTest1:', JSON.stringify(resTest1));
    console.log('  Result 1:', val1);
    assert.strictEqual(val1.submitResult, false, 'submitAuth harus mengembalikan false');
    assert.strictEqual(val1.errVisible, true, 'Pesan error merah harus terlihat');
    assert(val1.errText.includes('Akses Ditolak'), 'Pesan error harus memuat "Akses Ditolak"');
    assert.strictEqual(val1.modalVisible, true, 'Modal gatekeeper harus tetap terkunci');
    assert.strictEqual(val1.savedToken, null, 'Tidak boleh ada sesi yang tersimpan');

    // Screenshot Bukti Test 1
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d/test1_bandung_sembarangan_rejected.png', Buffer.from(shot1.data, 'base64'));
    console.log('  ✔ PASS Test 1: NIK Sembarangan ditolak tegas tanpa dummy profile.');

    // -----------------------------------------------------------------
    // TEST 2: Token Bandung + NIK Terdaftar Bandung -> HARUS BERHASIL
    // -----------------------------------------------------------------
    console.log('\n[TEST 2] Token Bandung + NIK Terdaftar Bandung -> HARUS BERHASIL');
    const resTest2 = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        const tokenInput = document.getElementById('gatekeeper-token-input');
        const nikInput = document.getElementById('gatekeeper-nik-input');
        
        tokenInput.value = 'NSR-BDG-2026';
        nikInput.value = 'NSR-BDG-2020-39'; // Ardi Nurmayadi (Cabang Bandung)
        
        const ok = await window.submitAuth();
        await new Promise(r => setTimeout(r, 600));
        
        const modal = document.getElementById('modal-auth-gatekeeper');
        const mainApp = document.getElementById('main-tracking-app');
        const filterKantor = document.getElementById('filter-kantor');
        const badge = document.getElementById('user-access-badge');
        const nameEl = document.getElementById('user-display-name');
        
        return {
          submitResult: ok,
          modalHidden: modal ? modal.classList.contains('hidden') : false,
          mainAppVisible: mainApp ? (mainApp.style.display === 'block') : false,
          userName: nameEl ? nameEl.textContent.trim() : '',
          filterKantorValue: filterKantor ? filterKantor.value : '',
          filterKantorDisabled: filterKantor ? filterKantor.disabled : false,
          badgeText: badge ? badge.textContent.trim() : '',
          savedRole: sessionStorage.getItem('nsr_active_user_role'),
          savedToken: sessionStorage.getItem('nsr_tracking_auth_token')
        };
      })()`
    });

    const val2 = resTest2.result?.value || resTest2.value;
    console.log('  Result 2:', val2);
    assert.strictEqual(val2.submitResult, true, 'submitAuth harus berhasil (true)');
    assert.strictEqual(val2.modalHidden, true, 'Modal gatekeeper harus tertutup');
    assert.strictEqual(val2.mainAppVisible, true, 'Dashboard utama harus ditampilkan');
    assert(val2.userName.includes('Ardi Nurmayadi'), 'Nama terverifikasi Ardi Nurmayadi');
    assert.strictEqual(val2.filterKantorValue, 'BDG', 'Filter kantor harus terkunci ke BDG');
    assert.strictEqual(val2.filterKantorDisabled, true, 'Filter kantor cabang harus disabled');
    assert(val2.badgeText.includes('Cabang Bandung'), 'Badge isolasi harus menunjukkan Cabang Bandung');

    // Screenshot Bukti Test 2
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d/test2_bandung_registered_success.png', Buffer.from(shot2.data, 'base64'));
    console.log('  ✔ PASS Test 2: Otorisasi Cabang Bandung berhasil dan terisolasi paten.');

    // -----------------------------------------------------------------
    // TEST 3: Token KING (NSR8899) dengan/tanpa NIK -> HARUS BERHASIL (Override Nasional)
    // -----------------------------------------------------------------
    console.log('\n[TEST 3] Token KING (NSR8899) tanpa NIK -> HARUS BERHASIL (Master Override)');
    const resTest3 = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        window.keluarSesiTracking();
        await new Promise(r => setTimeout(r, 400));
        
        const tokenInput = document.getElementById('gatekeeper-token-input');
        const nikInput = document.getElementById('gatekeeper-nik-input');
        
        tokenInput.value = 'NSR8899';
        nikInput.value = ''; // Tanpa NIK
        
        const ok = await window.submitAuth();
        await new Promise(r => setTimeout(r, 600));
        
        const modal = document.getElementById('modal-auth-gatekeeper');
        const mainApp = document.getElementById('main-tracking-app');
        const filterKantor = document.getElementById('filter-kantor');
        const badge = document.getElementById('user-access-badge');
        const nameEl = document.getElementById('user-display-name');
        const jabEl = document.getElementById('user-display-jabatan');
        
        return {
          submitResult: ok,
          modalHidden: modal ? modal.classList.contains('hidden') : false,
          mainAppVisible: mainApp ? (mainApp.style.display === 'block') : false,
          userName: nameEl ? nameEl.textContent.trim() : '',
          userJabatan: jabEl ? jabEl.textContent.trim() : '',
          filterKantorDisabled: filterKantor ? filterKantor.disabled : true,
          badgeText: badge ? badge.textContent.trim() : '',
          savedRole: sessionStorage.getItem('nsr_active_user_role'),
          savedName: sessionStorage.getItem('nsr_active_user_name')
        };
      })()`
    });

    const val3 = resTest3.result?.value || resTest3.value;
    console.log('  Result 3:', val3);
    assert.strictEqual(val3.submitResult, true, 'submitAuth harus berhasil untuk KING');
    assert.strictEqual(val3.modalHidden, true, 'Modal gatekeeper harus tertutup');
    assert.strictEqual(val3.mainAppVisible, true, 'Dashboard utama harus ditampilkan');
    assert(val3.userName.includes('Danny Taufik Hidayat, S.H.'), 'Nama eksekutor adalah Danny Taufik Hidayat, S.H.');
    assert(val3.userJabatan.includes('Otoritas Pengawas Tertinggi & SPM'), 'Jabatan adalah Otoritas Pengawas Tertinggi & SPM');
    assert.strictEqual(val3.filterKantorDisabled, false, 'Filter kantor untuk KING TIDAK boleh dikunci');
    assert(val3.badgeText.includes('Superuser / Otoritas Pengawas Nasional (5 Wilayah Terbuka)'), 'Badge header wajib: Superuser / Otoritas Pengawas Nasional (5 Wilayah Terbuka)');

    // Screenshot Bukti Test 3
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d/test3_king_override_success.png', Buffer.from(shot3.data, 'base64'));
    console.log('  ✔ PASS Test 3: Master Override Token KING berhasil membuka 5 wilayah nasional.');

    console.log('\n======================================================');
    console.log('ALL 3 DUAL-GATE STRICT TESTS PASSED 100%!');
    console.log('======================================================\n');

    ws.close();
  } catch (err) {
    console.error('Test execution failure:', err);
    process.exit(1);
  } finally {
    chromeProc.kill();
    server.close();
    process.exit(0);
  }
});
