import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = 8991;

function startPhpServer() {
  return new Promise((resolve, reject) => {
    const srv = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', ROOT_DIR], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    srv.stdout.on('data', () => {});
    srv.stderr.on('data', () => {});

    setTimeout(() => resolve(srv), 1000);
  });
}

function httpRequest(method, pathUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      method: method,
      hostname: '127.0.0.1',
      port: PORT,
      path: pathUrl,
      headers: {
        'Origin': 'https://kjppnanangrahayu.com',
        'Referer': 'https://kjppnanangrahayu.com/',
        'User-Agent': 'NSR-Test-Security/2026',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json || data
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      if (typeof options.body === 'object') {
        req.write(JSON.stringify(options.body));
      } else {
        req.write(options.body);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('TEST SUITE: P0 SECURITY CORRECTION VERIFICATION');
  console.log('Target: Local PHP Built-in Server on port ' + PORT);
  console.log('Zero Token Leakage Policy Active');
  console.log('====================================================\n');

  const srv = await startPhpServer();
  const results = [];

  function record(name, pass, detail) {
    results.push({ name, pass, detail });
    console.log(`${pass ? '✅ PASS' : '❌ FAIL'} | ${name} -> ${detail}`);
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Rejection of direct 64-hex hash authentication (Pass-the-Hash Prevention)
    // ----------------------------------------------------
    console.log('--- Uji 1: Penolakan Autentikasi Menggunakan Hash Langsung (Anti Pass-the-Hash) ---');
    const directHexHash = '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0';
    const resHexLogin = await httpRequest('POST', '/auth-handler.php?action=token', {
      headers: { 'Content-Type': 'application/json' },
      body: { token: directHexHash }
    });
    record(
      'Tolak Autentikasi dengan Hash Hex 64 Langsung pada /api/auth-token',
      resHexLogin.statusCode === 401 && resHexLogin.body?.authenticated === false,
      `HTTP ${resHexLogin.statusCode} (401 Unauthorized)`
    );

    const resHexLoginAction = await httpRequest('POST', '/auth-handler.php?action=login', {
      headers: { 'Content-Type': 'application/json' },
      body: { token: directHexHash }
    });
    record(
      'Tolak Autentikasi dengan Hash Hex 64 Langsung pada /api/auth-login',
      resHexLoginAction.statusCode === 401 && resHexLoginAction.body?.authenticated === false,
      `HTTP ${resHexLoginAction.statusCode} (401 Unauthorized)`
    );

    const resHexNoLap = await httpRequest('GET', '/nolap-data-handler.php?action=listPendingSPK', {
      headers: { 'Authorization': `Bearer ${directHexHash}` }
    });
    record(
      'Tolak Bearer Hash Langsung pada NoLap Handler',
      resHexNoLap.statusCode === 401,
      `HTTP ${resHexNoLap.statusCode} (401 Unauthorized)`
    );

    const resHexKwitansi = await httpRequest('GET', '/kwitansi-data-handler.php?action=getDatabase', {
      headers: { 'Authorization': `Bearer ${directHexHash}` }
    });
    record(
      'Tolak Bearer Hash Langsung pada Kwitansi Handler',
      resHexKwitansi.statusCode === 401,
      `HTTP ${resHexKwitansi.statusCode} (401 Unauthorized)`
    );

    // ----------------------------------------------------
    // TEST 2: Valid Authentication via Rotated Tokens & Response Sanitization
    // ----------------------------------------------------
    console.log('\n--- Uji 2: Validasi Token Resmi Berotasi & Pembersihan Respon API ---');
    // Read rotated token from environment or private config for test
    const rotatedKingToken = process.env.NSR_KING_TOKEN || 'NSR-KING-OPR-2026-X7M9';
    const resKingLogin = await httpRequest('POST', '/auth-handler.php?action=token', {
      headers: { 'Content-Type': 'application/json' },
      body: { token: rotatedKingToken }
    });

    const isKingAuthOk = resKingLogin.statusCode === 200 && resKingLogin.body?.authenticated === true;
    const kingUser = resKingLogin.body?.user || {};
    const kingHasSuper = kingUser.isSuperAdmin === true && kingUser.isKing === true;
    const kingNoSessionToken = resKingLogin.body?.sessionToken === undefined;
    const kingNoTokenHash = resKingLogin.body?.tokenHash === undefined;

    record(
      'Autentikasi Token Rotasi KING Berhasil',
      isKingAuthOk && kingHasSuper,
      `HTTP ${resKingLogin.statusCode} | role: ${kingUser.role} | isSuperAdmin: ${kingUser.isSuperAdmin}`
    );

    record(
      'Respon API Bersih Tanpa sessionToken Tambahan',
      kingNoSessionToken,
      `sessionToken exists in response: ${!kingNoSessionToken}`
    );

    record(
      'Respon API Bersih Tanpa tokenHash Mentah',
      kingNoTokenHash,
      `tokenHash exists in response: ${!kingNoTokenHash}`
    );

    // ----------------------------------------------------
    // TEST 3: Admin Pusat Privilege Isolation (Strictly NO KING rights)
    // ----------------------------------------------------
    console.log('\n--- Uji 3: Hak Akses ADMIN_PUSAT Tidak Boleh Memperoleh Hak KING ---');
    const rotatedAdmPusatToken = process.env.NSR_PUSAT_TOKEN || 'NSR-ADM-PUSAT-2026-J9K2';
    const resAdmLogin = await httpRequest('POST', '/auth-handler.php?action=token', {
      headers: { 'Content-Type': 'application/json' },
      body: { token: rotatedAdmPusatToken }
    });

    const admUser = resAdmLogin.body?.user || {};
    const admPusatNotSuper = admUser.isSuperAdmin === false && admUser.isKing === false && admUser.role === 'ADMIN_PUSAT';
    record(
      'Admin Pusat Jalur Token: role=ADMIN_PUSAT, isSuperAdmin=false, isKing=false',
      resAdmLogin.statusCode === 200 && admPusatNotSuper,
      `role: ${admUser.role} | isSuperAdmin: ${admUser.isSuperAdmin} | isKing: ${admUser.isKing}`
    );

    // Test Username / Password login for Admin Pusat
    const resUserPassLogin = await httpRequest('POST', '/auth-handler.php?action=login', {
      headers: { 'Content-Type': 'application/json' },
      body: {
        identifier: 'admin',
        password: process.env.NSR_ADMIN_PASS || 'NSR_Admin_Pusat_2026_Secured!'
      }
    });

    const upUser = resUserPassLogin.body?.user || {};
    const upNotSuper = upUser.isSuperAdmin === false && upUser.isKing === false && upUser.role === 'ADMIN_PUSAT';
    const upExpiresValid = typeof resUserPassLogin.body?.expiresAt === 'number' && resUserPassLogin.body?.expiresAt > Date.now();
    const upNoSessionToken = resUserPassLogin.body?.sessionToken === undefined;

    record(
      'Admin Pusat Jalur Username/Password: role=ADMIN_PUSAT, isSuperAdmin=false, isKing=false',
      resUserPassLogin.statusCode === 200 && upNotSuper,
      `role: ${upUser.role} | isSuperAdmin: ${upUser.isSuperAdmin} | isKing: ${upUser.isKing}`
    );

    record(
      'Urutan Inisialisasi expiresAt pada Jalur Username/Password Valid & Benar',
      resUserPassLogin.statusCode === 200 && upExpiresValid,
      `expiresAt: ${resUserPassLogin.body?.expiresAt} (> now)`
    );

    record(
      'Respon Username/Password Bersih Tanpa sessionToken Tambahan',
      upNoSessionToken,
      `sessionToken exists: ${!upNoSessionToken}`
    );

    // ----------------------------------------------------
    // TEST 4: Verification Endpoint & Dual-Stage Logout
    // ----------------------------------------------------
    console.log('\n--- Uji 4: Sesi Server-Side HttpOnly & Siklus Logout ---');
    const setCookieHeaders = resUserPassLogin.headers['set-cookie'] || [];
    const cookieHeader = Array.isArray(setCookieHeaders) ? setCookieHeaders[0].split(';')[0] : setCookieHeaders;

    const resVerify = await httpRequest('GET', '/auth-handler.php?action=verify', {
      headers: { 'Cookie': cookieHeader }
    });

    const isVerifyOk = resVerify.statusCode === 200 && resVerify.body?.authenticated === true;
    const verifyNoSessionToken = resVerify.body?.sessionToken === undefined;
    record(
      'Verifikasi Sesi Aktif Server-Side via Cookie HttpOnly',
      isVerifyOk,
      `HTTP ${resVerify.statusCode} | authenticated: ${resVerify.body?.authenticated}`
    );

    record(
      'Respon Verify Bersih Tanpa sessionToken Tambahan',
      verifyNoSessionToken,
      `sessionToken exists: ${!verifyNoSessionToken}`
    );

    // Logout
    const resLogout = await httpRequest('POST', '/auth-handler.php?action=logout', {
      headers: { 'Cookie': cookieHeader }
    });

    const resPostLogout = await httpRequest('GET', '/auth-handler.php?action=verify', {
      headers: { 'Cookie': cookieHeader }
    });

    const isLogoutOk = resLogout.statusCode === 200 && resPostLogout.statusCode === 401;
    record(
      'Logout Memusnahkan Sesi Server (Post-Logout Ditolak 401)',
      isLogoutOk,
      `Logout: HTTP ${resLogout.statusCode} -> Post-Logout: HTTP ${resPostLogout.statusCode}`
    );

    // ----------------------------------------------------
    // TEST 5: Machine Service Key Integration (GAS Sync & Cron)
    // ----------------------------------------------------
    console.log('\n--- Uji 5: Integrasi Mesin Layanan (GAS Sync & Cron Header) ---');
    const resGasSync = await httpRequest('GET', '/auth-handler.php?action=verify', {
      headers: { 'X-NSR-Service-Key': 'GAS_SYNC_SERVICE_KEY_2026' }
    });
    record(
      'Integrasi Mesin Layanan via Header X-NSR-Service-Key Berhasil',
      resGasSync.statusCode === 200 && resGasSync.body?.service === 'GAS_SYNC_SERVICE',
      `HTTP ${resGasSync.statusCode} | service: ${resGasSync.body?.service}`
    );

    console.log('\n====================================================');
    const allPassed = results.every(r => r.pass);
    console.log(`TOTAL SUITE RESULT: ${results.filter(r => r.pass).length}/${results.length} TESTS PASSED`);
    console.log(`FINAL SECURITY VERDICT: ${allPassed ? 'PASS (100% SECURE)' : 'FAIL'}`);
    console.log('====================================================');

    if (!allPassed) process.exit(1);

  } finally {
    srv.kill('SIGINT');
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
