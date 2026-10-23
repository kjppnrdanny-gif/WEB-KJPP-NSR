import https from 'node:https';

const LIVE_HOST = 'kjppnanangrahayu.com';
console.log('====================================================');
console.log('LIVE VERIFICATION: EMERGENCY SECURITY CLOSURE P0');
console.log(`Target: https://${LIVE_HOST}/`);
console.log('Zero Token Leakage Policy Active: All secrets masked');
console.log('====================================================\n');

function httpsRequest(method, pathUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      method: method,
      hostname: LIVE_HOST,
      port: 443,
      path: pathUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NSR-Security-Auditor/2026',
        'Accept': 'application/json, text/html',
        'Cache-Control': 'no-cache',
        ...(options.headers || {})
      }
    };

    const req = https.request(reqOptions, (res) => {
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function pollAndVerify() {
  console.log('1. Memantau aktivasi commit live cPanel via FTPS...');
  let liveReady = false;

  for (let attempt = 1; attempt <= 36; attempt++) {
    try {
      // Probe: sending ?token= to nolap-data-handler.php must return 400 Bad Request
      const probeRes = await httpsRequest('GET', `/nolap-data-handler.php?token=PROBE_${Date.now()}`);
      if (probeRes.statusCode === 400) {
        console.log(`\n🎉 COMMIT P0 DETECTED ACTIVE ON CPANEL LIVE! (Polling #${attempt})`);
        liveReady = true;
        break;
      } else {
        process.stdout.write(`... [${attempt}/36] Menunggu cPanel FTPS deployment (${attempt * 5}s - status: ${probeRes.statusCode})\r`);
      }
    } catch (e) {
      process.stdout.write(`... [${attempt}/36] Error polling: ${e.message}\r`);
    }
    await sleep(5000);
  }

  if (!liveReady) {
    console.log('\n⚠️ Deployment cPanel belum selesai setelah 180s. Melakukan verifikasi endpoint saat ini...');
  }

  const liveResults = [];
  function recordLive(testName, passed, detail) {
    liveResults.push({ name: testName, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} | ${testName} -> ${detail}`);
  }

  console.log('\n--- Uji 1: Penolakan Kredensial Staging / Demo di Lingkungan Live ---');
  const resStageMaster = await httpsRequest('POST', '/api/auth.php?action=token', {
    headers: { 'Content-Type': 'application/json' },
    body: { token: 'NSR-STAGE-MASTER-77' }
  });
  recordLive(
    'Penolakan Staging Master Token (Live)',
    resStageMaster.statusCode === 401 && resStageMaster.body?.authenticated === false,
    `HTTP ${resStageMaster.statusCode} (401 Unauthorized)`
  );

  const resStageKeu = await httpsRequest('POST', '/api/auth.php?action=token', {
    headers: { 'Content-Type': 'application/json' },
    body: { token: 'NSR-STAGE-KEU-44' }
  });
  recordLive(
    'Penolakan Staging Keuangan Token (Live)',
    resStageKeu.statusCode === 401 && resStageKeu.body?.authenticated === false,
    `HTTP ${resStageKeu.statusCode} (401 Unauthorized)`
  );

  console.log('\n--- Uji 2: Penolakan Otorisasi via Query Parameter URL di Lingkungan Live ---');
  const resQueryNolap = await httpsRequest('GET', '/nolap-data-handler.php?token=PROBE_TEST');
  recordLive(
    'Larangan URL Query Token pada NoLap Handler (Live)',
    resQueryNolap.statusCode === 400,
    `HTTP ${resQueryNolap.statusCode} (400 Bad Request)`
  );

  const resQueryAuth = await httpsRequest('GET', '/api/auth.php?token=PROBE_TEST');
  recordLive(
    'Larangan URL Query Token pada Auth Gateway (Live)',
    resQueryAuth.statusCode === 400,
    `HTTP ${resQueryAuth.statusCode} (400 Bad Request)`
  );

  const resQueryKwitansi = await httpsRequest('GET', '/kwitansi-data-handler.php?token=PROBE_TEST');
  recordLive(
    'Larangan URL Query Token pada Kwitansi Handler (Live)',
    resQueryKwitansi.statusCode === 400,
    `HTTP ${resQueryKwitansi.statusCode} (400 Bad Request)`
  );

  console.log('\n--- Uji 3: Pencabutan Sesi Kompromi (Blacklist) di Lingkungan Live ---');
  const blacklistedId = '66c3e90cae0df094bda66fa99602fb18';
  const resRevoked = await httpsRequest('GET', '/api/auth.php?action=verify', {
    headers: { 'Cookie': `NSR_SESSION=${blacklistedId}` }
  });
  const isRevoked = resRevoked.statusCode === 401 && resRevoked.body?.authenticated === false;
  recordLive(
    'Pencabutan Sesi Blacklist [REDACTED_ID] (Live)',
    isRevoked,
    `HTTP ${resRevoked.statusCode} (401 Unauthorized, Sesi Ditolak & Tidak Sah)`
  );

  console.log('\n--- Uji 4: Autentikasi Resmi & Sesi HttpOnly Server-Side di Lingkungan Live ---');
  const resOfficialLogin = await httpsRequest('POST', '/api/auth.php?action=token', {
    headers: { 'Content-Type': 'application/json' },
    body: { token: 'NSR8899' }
  });
  const liveCookies = resOfficialLogin.headers['set-cookie'] || [];
  const liveCookieHeader = Array.isArray(liveCookies) ? liveCookies[0].split(';')[0] : liveCookies;
  const loginOk = resOfficialLogin.statusCode === 200 && resOfficialLogin.body?.authenticated === true;
  recordLive(
    'Autentikasi Kredensial Resmi Berhasil (Live)',
    loginOk,
    `HTTP ${resOfficialLogin.statusCode} (Authenticated: true)`
  );

  // Verifikasi Sesi Aktif
  const resVerifyLive = await httpsRequest('GET', '/api/auth.php?action=verify', {
    headers: { 'Cookie': liveCookieHeader }
  });
  const verifyOk = resVerifyLive.statusCode === 200 && resVerifyLive.body?.authenticated === true;
  recordLive(
    'Validasi Sesi Aktif Server-Side via Cookie HttpOnly (Live)',
    verifyOk,
    `HTTP ${resVerifyLive.statusCode} (Session Valid)`
  );

  // Logout Resmi
  const resLogoutLive = await httpsRequest('POST', '/api/auth.php?action=logout', {
    headers: { 'Cookie': liveCookieHeader }
  });
  const resPostLogout = await httpsRequest('GET', '/api/auth.php?action=verify', {
    headers: { 'Cookie': liveCookieHeader }
  });
  const logoutOk = resLogoutLive.statusCode === 200 && resPostLogout.statusCode === 401;
  recordLive(
    'Dual-Stage Logout Memusnahkan Sesi Server (Live)',
    logoutOk,
    `Logout 200 -> Post-Logout Rejected 401 Unauthorized`
  );

  console.log('\n====================================================');
  const allPassed = liveResults.every(r => r.passed);
  const total = liveResults.length;
  const passedCount = liveResults.filter(r => r.passed).length;
  console.log(`TOTAL LIVE RESULT: ${passedCount}/${total} TESTS PASSED`);
  console.log(`FINAL LIVE VERDICT: ${allPassed ? 'PASS (100% PRODUCTION SECURE)' : 'FAIL'}`);
  console.log('====================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

pollAndVerify().catch((err) => {
  console.error('Live Verification Exception:', err);
  process.exit(1);
});
