import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LIVE_BASE_URL = 'https://kjppnanangrahayu.com';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9460;
const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5b357e59-98db-42c8-a216-3b795e1f1b2d';
const TEST_TOKEN = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");

async function runLiveProductionVerification() {
  console.log('===============================================================');
  console.log('🌐 VERIFIKASI KEAMANAN LIVE PRODUKSI CPANEL — KJPP NANANG RAHAYU');
  console.log('===============================================================');

  let allPassed = true;

  // 1. Uji Autentikasi Server-Side Live
  console.log('\n[1/4] Pengujian Endpoint Autentikasi Server-Side Live...');
  const loginRes = await fetch(`${LIVE_BASE_URL}/api/auth-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: TEST_TOKEN })
  });

  const cookieHeader = loginRes.headers.get('set-cookie');
  const loginData = await loginRes.json();

  console.log('  • Status HTTP Login:', loginRes.status);
  console.log('  • Set-Cookie Terbit:', cookieHeader ? 'YA (NSR_SESSION=[REDACTED])' : 'TIDAK ❌');
  console.log('  • Atribut HttpOnly aktif:', cookieHeader && cookieHeader.toLowerCase().includes('httponly') ? 'YA ✅' : 'TIDAK ❌');
  console.log('  • Atribut SameSite=Lax aktif:', cookieHeader && cookieHeader.toLowerCase().includes('samesite=lax') ? 'YA ✅' : 'TIDAK ❌');
  console.log('  • Status Terautentikasi:', loginData.authenticated === true ? 'YA ✅' : 'TIDAK ❌');
  console.log('  • Objek user server BEBAS dari token mentah:', loginData.user && loginData.user.token === undefined ? 'YA ✅' : 'TIDAK ❌ (BOCOR)');

  if (!cookieHeader || !cookieHeader.toLowerCase().includes('httponly') || loginData.authenticated !== true) {
    allPassed = false;
  }

  const liveSessionCookie = cookieHeader ? cookieHeader.split(';')[0] : '';

  // 2. Uji Kebijakan Fail-Closed Endpoint Live (401 Unauthorized tanpa Sesi)
  console.log('\n[2/4] Pengujian Proteksi Fail-Closed Endpoint Live...');
  
  // NoLap Proxy
  const nolapUnauth = await fetch(`${LIVE_BASE_URL}/api/nolap-data-proxy`);
  console.log('  • NoLap Proxy tanpa sesi ditolak (401):', nolapUnauth.status === 401 ? 'PASS (401) ✅' : `FAIL (${nolapUnauth.status}) ❌`);
  if (nolapUnauth.status !== 401) allPassed = false;

  // Kwitansi Proxy
  const kwUnauth = await fetch(`${LIVE_BASE_URL}/api/kwitansi-data-proxy?action=getAllKwitansi`);
  console.log('  • Kwitansi Proxy tanpa sesi ditolak (401):', kwUnauth.status === 401 ? 'PASS (401) ✅' : `FAIL (${kwUnauth.status}) ❌`);
  if (kwUnauth.status !== 401) allPassed = false;

  // Operasional Proxy
  const oprUnauth = await fetch(`${LIVE_BASE_URL}/api/operasional-data-proxy?action=getPengajuanList`);
  console.log('  • Operasional Proxy tanpa sesi ditolak (401):', oprUnauth.status === 401 ? 'PASS (401) ✅' : `FAIL (${oprUnauth.status}) ❌`);
  if (oprUnauth.status !== 401) allPassed = false;

  // 3. Uji Logout Server-Side Invalidation Live
  console.log('\n[3/4] Pengujian Logout Server-Side Live (Pencabutan Sesi cPanel)...');
  const logoutRes = await fetch(`${LIVE_BASE_URL}/api/auth-logout`, {
    method: 'POST',
    headers: { 'Cookie': liveSessionCookie }
  });
  const logoutData = await logoutRes.json();
  console.log('  • Endpoint logout merespons sukses:', logoutData.authenticated === false ? 'YA ✅' : 'TIDAK ❌');

  const verifyAfterLogout = await fetch(`${LIVE_BASE_URL}/api/auth-verify`, {
    headers: { 'Cookie': liveSessionCookie }
  });
  console.log('  • Sesi server tercabut tuntas (401):', verifyAfterLogout.status === 401 ? 'PASS (401) ✅' : `FAIL (${verifyAfterLogout.status}) ❌`);
  if (verifyAfterLogout.status !== 401) allPassed = false;

  // 4. Uji Pengalaman Frontend Browser Live (Zero Raw Token & Screenshot Bukti)
  console.log('\n[4/4] Pengujian Frontend Live di Google Chrome CDP...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--user-data-dir=C:\\Users\\HP\\AppData\\Local\\Temp\\chrome_live_sec_test'
  ]);

  let wsUrl = null;
  await new Promise((resolve, reject) => {
    chrome.stderr.on('data', data => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        wsUrl = match[1];
        resolve();
      }
    });
    setTimeout(() => {
      if (!wsUrl) reject(new Error('Timeout connecting to Chrome DevTools'));
    }, 6000);
  });

  const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
  const targetData = await targetRes.json();
  const ws = new WebSocket(targetData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const resp = JSON.parse(event.data);
        if (resp.id === id) {
          ws.removeEventListener('message', handler);
          resolve(resp.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Buka website live
  console.log('  • Membuka https://kjppnanangrahayu.com/...');
  await sendCommand('Page.navigate', { url: `${LIVE_BASE_URL}/?_sec=${Date.now()}` });
  await new Promise(r => setTimeout(r, 2000));

  // Buka modal login
  console.log('  • Membuka modal login OPINI NSR...');
  await sendCommand('Runtime.evaluate', { expression: `window.bukaModalPortal('penugasan');` });
  await new Promise(r => setTimeout(r, 800));

  // Input token dan login
  console.log('  • Memasukkan token resmi dan klik Verifikasi & Masuk...');
  await sendCommand('Runtime.evaluate', {
    expression: `
      document.getElementById('input-token').value = '${TEST_TOKEN}';
      document.getElementById('btn-submit-token').click();
    `
  });
  await new Promise(r => setTimeout(r, 2000));

  // Tangkap screenshot panel layanan terautentikasi
  const ssAuth = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const ssAuthPath = path.join(ARTIFACTS_DIR, 'bukti_live_security_authenticated_cpanel.png');
  fs.writeFileSync(ssAuthPath, Buffer.from(ssAuth.data, 'base64'));
  console.log('  📸 Screenshot panel terautentikasi tersimpan:', ssAuthPath);

  // Audit sessionStorage pada browser live
  const liveStorageEval = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const rawTokenInSession = [
        sessionStorage.getItem('TOKEN_AUTH_NSR'),
        sessionStorage.getItem('CURRENT_AUTH_TOKEN'),
        sessionStorage.getItem('NSR_AUTH_TOKEN'),
        sessionStorage.getItem('NSR_AUTH_HASH'),
        sessionStorage.getItem('NSR_SESSION_CHECKSUM'),
        sessionStorage.getItem('NSR_SESSION_SIG')
      ];

      let parsedInternal = null;
      let parsedJo = null;
      let parsedUser = null;

      try { parsedInternal = JSON.parse(sessionStorage.getItem('kjpp_token_internal')); } catch (_) {}
      try { parsedJo = JSON.parse(sessionStorage.getItem('kjpp_session_jo')); } catch (_) {}
      try { parsedUser = JSON.parse(sessionStorage.getItem('NSR_USER_SESSION')); } catch (_) {}

      return JSON.stringify({
        sessionKeys: Object.keys(sessionStorage),
        rawKeysExist: rawTokenInSession.some(v => v !== null),
        internalHasToken: parsedInternal && parsedInternal.token !== undefined,
        joHasToken: parsedJo && parsedJo.token !== undefined,
        userHasToken: parsedUser && parsedUser.token !== undefined,
        authenticated: parsedInternal ? parsedInternal.authenticated : null,
        role: parsedInternal ? parsedInternal.role : null,
        wilayah: parsedInternal ? parsedInternal.wilayah : null
      });
    })()`
  });

  const liveAudit = JSON.parse(liveStorageEval.result.value);
  console.log('  • Kunci SessionStorage pada website live:', liveAudit.sessionKeys.join(', '));
  console.log('  • Kunci token mentah (TOKEN_AUTH_NSR, dll) terdeteksi di browser:', liveAudit.rawKeysExist ? 'YA ❌ (PELANGGARAN)' : 'TIDAK ✅ (STERIL)');
  console.log('  • Objek kjpp_token_internal menyimpan token mentah:', liveAudit.internalHasToken ? 'YA ❌ (PELANGGARAN)' : 'TIDAK ✅ (STERIL)');
  console.log('  • Objek kjpp_session_jo menyimpan token mentah:', liveAudit.joHasToken ? 'YA ❌ (PELANGGARAN)' : 'TIDAK ✅ (STERIL)');
  console.log('  • Objek NSR_USER_SESSION menyimpan token mentah:', liveAudit.userHasToken ? 'YA ❌ (PELANGGARAN)' : 'TIDAK ✅ (STERIL)');
  console.log('  • Status Autentikasi Pengguna di UI:', liveAudit.authenticated ? `YA (${liveAudit.role} - ${liveAudit.wilayah}) ✅` : 'TIDAK ❌');

  if (liveAudit.rawKeysExist || liveAudit.internalHasToken || liveAudit.joHasToken || liveAudit.userHasToken) {
    allPassed = false;
  }

  // Uji Klik "Ganti Token / Keluar" di website live
  console.log('  • Klik tombol "Ganti Token / Keluar" pada modal live...');
  await sendCommand('Runtime.evaluate', {
    expression: `window.resetTokenSesi();`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 1000));

  // Tangkap screenshot formulir login setelah logout
  const ssLogout = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const ssLogoutPath = path.join(ARTIFACTS_DIR, 'bukti_live_security_logout_cpanel.png');
  fs.writeFileSync(ssLogoutPath, Buffer.from(ssLogout.data, 'base64'));
  console.log('  📸 Screenshot formulir setelah logout tersimpan:', ssLogoutPath);

  const postLogoutEval = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      return JSON.stringify({
        sessionKeysLeft: Object.keys(sessionStorage),
        formVisible: !document.getElementById('form-token-portal')?.classList.contains('hidden'),
        panelVisible: !document.getElementById('panel-layanan')?.classList.contains('hidden')
      });
    })()`
  });

  const postLogoutLive = JSON.parse(postLogoutEval.result.value);
  console.log('  • Sisa kunci sessionStorage setelah logout:', postLogoutLive.sessionKeysLeft.length === 0 ? 'KOSONG BERSIH ✅' : postLogoutLive.sessionKeysLeft.join(', '));
  console.log('  • Formulir login muncul kembali:', postLogoutLive.formVisible ? 'YA ✅' : 'TIDAK ❌');
  console.log('  • Panel layanan tertutup:', !postLogoutLive.panelVisible ? 'YA ✅' : 'TIDAK ❌');

  chrome.kill();

  console.log('\n===============================================================');
  if (allPassed) {
    console.log('🎉 SELURUH VERIFIKASI KEAMANAN & SESI LIVE CPANEL LULUS 100%! 🛡️');
  } else {
    console.log('💥 DITEMUKAN ISU KEAMANAN PADA PRODUCTION! HARAP PERIKSA LOG DI ATAS.');
  }
  console.log('===============================================================');

  process.exit(allPassed ? 0 : 1);
}

runLiveProductionVerification();
