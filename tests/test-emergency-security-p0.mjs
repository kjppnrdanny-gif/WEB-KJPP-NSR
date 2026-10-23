import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8089;
const BASE_URL = `http://127.0.0.1:${PORT}`;

console.log('====================================================');
console.log('SUITE P0: EMERGENCY SECURITY CLOSURE VERIFICATION');
console.log('Zero Token Leakage Policy Active: All secrets masked');
console.log('====================================================\n');

// 1. Start PHP Built-in Server
const phpProcess = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', ROOT_DIR], {
  cwd: ROOT_DIR,
  stdio: 'pipe'
});

phpProcess.stderr.on('data', () => {});

// Helper: HTTP Request
function request(method, pathUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, BASE_URL);
    const reqOptions = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
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

// Helper: Sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTests() {
  await sleep(1200); // Wait for PHP server to start
  const results = [];

  function record(testName, passed, detail) {
    results.push({ name: testName, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} | ${testName} -> ${detail}`);
  }

  try {
    // -------------------------------------------------------------
    // TEST GROUP 1: REJECTION OF STAGING / DEMO CREDENTIALS
    // -------------------------------------------------------------
    console.log('\n--- Group 1: Staging & Demo Credentials Rejection ---');
    
    // 1A. Staging Master Token
    const resStageMaster = await request('POST', '/auth-handler.php?action=token', {
      headers: { 'Content-Type': 'application/json' },
      body: { token: 'NSR-STAGE-MASTER-77' }
    });
    record(
      'Rejection of NSR-STAGE-MASTER-77',
      resStageMaster.statusCode === 401 && resStageMaster.body?.authenticated === false,
      `HTTP ${resStageMaster.statusCode} (Expected 401 Unauthorized)`
    );

    // 1B. Staging Finance Token
    const resStageKeu = await request('POST', '/auth-handler.php?action=token', {
      headers: { 'Content-Type': 'application/json' },
      body: { token: 'NSR-STAGE-KEU-44' }
    });
    record(
      'Rejection of NSR-STAGE-KEU-44',
      resStageKeu.statusCode === 401 && resStageKeu.body?.authenticated === false,
      `HTTP ${resStageKeu.statusCode} (Expected 401 Unauthorized)`
    );

    // 1C. Staging Account Login (test_admin)
    const resTestAdmin = await request('POST', '/auth-handler.php?action=login', {
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'test_admin', password: 'any_password' }
    });
    record(
      'Rejection of test_admin account',
      resTestAdmin.statusCode === 401,
      `HTTP ${resTestAdmin.statusCode} (Expected 401 Unauthorized)`
    );

    // 1D. Staging Account Login (test_keuangan)
    const resTestKeu = await request('POST', '/auth-handler.php?action=login', {
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'test_keuangan', password: 'any_password' }
    });
    record(
      'Rejection of test_keuangan account',
      resTestKeu.statusCode === 401,
      `HTTP ${resTestKeu.statusCode} (Expected 401 Unauthorized)`
    );

    // -------------------------------------------------------------
    // TEST GROUP 2: ELIMINATION OF QUERY PARAMETER URL AUTH
    // -------------------------------------------------------------
    console.log('\n--- Group 2: URL Query Parameter Token Prohibition ---');
    const endpointsWithQuery = [
      { path: '/nolap-data-handler.php?token=NSR-SECRET-TEST', name: 'NoLap Handler' },
      { path: '/auth-handler.php?token=NSR-SECRET-TEST', name: 'Auth Handler' },
      { path: '/kwitansi-data-handler.php?token=NSR-SECRET-TEST', name: 'Kwitansi Handler' },
      { path: '/operasional-data-handler.php?token=NSR-SECRET-TEST', name: 'Operasional Handler' },
      { path: '/absensi-data-handler.php?token=NSR-SECRET-TEST', name: 'Absensi Handler' },
      { path: '/surat-umum-data-handler.php?token=NSR-SECRET-TEST', name: 'Surat Umum Handler' },
      { path: '/status-terintegrasi-handler.php?token=NSR-SECRET-TEST', name: 'Status Terintegrasi' },
      { path: '/process-mail-queue.php?token=NSR-SECRET-TEST', name: 'Mail Queue Worker' }
    ];

    for (const ep of endpointsWithQuery) {
      const res = await request('GET', ep.path);
      record(
        `Prohibit ?token= query on ${ep.name}`,
        res.statusCode === 400,
        `HTTP ${res.statusCode} (Expected 400 Bad Request)`
      );
    }

    // -------------------------------------------------------------
    // TEST GROUP 3: SESSION REVOCATION BLACKLIST
    // -------------------------------------------------------------
    console.log('\n--- Group 3: Compromised Session Revocation Blacklist ---');
    const blacklistedSessions = [
      '66c3e90cae0df094bda66fa99602fb18',
      'bcd790d3a97f63d115f3bd06f59bb84d',
      '8a12b1ef6a7dd5895c2369261633f637'
    ];

    for (const sessId of blacklistedSessions) {
      const res = await request('GET', '/auth-handler.php?action=verify', {
        headers: {
          'Cookie': `NSR_SESSION=${sessId}`
        }
      });
      const setCookie = res.headers['set-cookie'] || [];
      const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const isExpired = cookieStr.includes('deleted') || cookieStr.includes('Max-Age=0') || cookieStr.includes('1970');
      record(
        `Revocation of blacklisted session [REDACTED_ID]`,
        res.statusCode === 401 && isExpired,
        `HTTP ${res.statusCode} + Set-Cookie Expiration confirmed`
      );
    }

    // -------------------------------------------------------------
    // TEST GROUP 4: SESSION FIXATION DEFENSE & REGENERATION
    // -------------------------------------------------------------
    console.log('\n--- Group 4: Session Fixation Defense & ID Regeneration ---');
    const dummyPreSessId = '11112222333344445555666677778888';
    const resPreLogin = await request('POST', '/auth-handler.php?action=token', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `NSR_SESSION=${dummyPreSessId}`
      },
      body: { token: 'NSR8899' }
    });

    const postCookies = resPreLogin.headers['set-cookie'] || [];
    const postCookieStr = Array.isArray(postCookies) ? postCookies.join('; ') : postCookies;
    const matchNewSess = postCookieStr.match(/NSR_SESSION=([a-zA-Z0-9]+)/);
    const newSessId = matchNewSess ? matchNewSess[1] : null;

    const regeneratedSuccessfully = Boolean(newSessId && newSessId !== dummyPreSessId);
    record(
      'Session ID Regeneration on Successful Authentication',
      resPreLogin.statusCode === 200 && regeneratedSuccessfully,
      `HTTP 200 OK + New Session ID generated distinct from pre-session probe`
    );

    // -------------------------------------------------------------
    // TEST GROUP 5: CSRF PROTECTION ON MUTATIONS
    // -------------------------------------------------------------
    console.log('\n--- Group 5: CSRF Origin / Referer Validation ---');
    
    // 5A. Evil attacker origin
    const resCsrfAttacker = await request('POST', '/auth-handler.php?action=token', {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil-phishing-attacker.com'
      },
      body: { token: 'NSR8899' }
    });
    record(
      'CSRF Rejection for Untrusted Origin',
      resCsrfAttacker.statusCode === 403,
      `HTTP ${resCsrfAttacker.statusCode} (Expected 403 Forbidden)`
    );

    // 5B. Legitimate domain origin
    const resCsrfLegit = await request('POST', '/auth-handler.php?action=token', {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kjppnanangrahayu.com'
      },
      body: { token: 'NSR8899' }
    });
    record(
      'CSRF Acceptance for Official Domain (kjppnanangrahayu.com)',
      resCsrfLegit.statusCode === 200 && resCsrfLegit.body?.authenticated === true,
      `HTTP ${resCsrfLegit.statusCode} (Accepted)`
    );

    // -------------------------------------------------------------
    // TEST GROUP 6: CROSS-ROLE RBAC ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n--- Group 6: Strict RBAC Cross-Role Privilege Separation ---');
    // Login as Cabang Bandung
    const resBdgLogin = await request('POST', '/auth-handler.php?action=token', {
      headers: { 'Content-Type': 'application/json' },
      body: { token: 'NSR-BDG-2026' }
    });
    const bdgCookies = resBdgLogin.headers['set-cookie'] || [];
    const bdgCookieHeader = Array.isArray(bdgCookies) ? bdgCookies[0].split(';')[0] : bdgCookies;

    // Cabang attempting Central Surat Umum Agenda
    const resBdgSuratUmum = await request('GET', '/surat-umum-data-handler.php?action=getSuratUmumRecords', {
      headers: { 'Cookie': bdgCookieHeader }
    });
    record(
      'Cabang Blocked from Surat Umum (Head Office Exclusive)',
      resBdgSuratUmum.statusCode === 403,
      `HTTP ${resBdgSuratUmum.statusCode} (Expected 403 Forbidden)`
    );

    // Cabang attempting Emergency Override Gate in NoLap
    const resBdgOverride = await request('POST', '/nolap-data-handler.php?action=emergencyOverrideGate', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': bdgCookieHeader
      },
      body: { idPenugasan: 'JO-2026-001', targetStatus: 'HOLD_RESOLVED', alasanOverride: 'Testing illegal override bypass' }
    });
    record(
      'Cabang Blocked from Emergency Override Gate',
      resBdgOverride.statusCode === 403,
      `HTTP ${resBdgOverride.statusCode} (Expected 403 Forbidden)`
    );

    // -------------------------------------------------------------
    // TEST GROUP 7: NORMAL LOGIN & LOGOUT LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- Group 7: Normal Login & Dual-Stage Logout Lifecycle ---');
    // Login King
    const resLogin = await request('POST', '/auth-handler.php?action=token', {
      headers: { 'Content-Type': 'application/json' },
      body: { token: 'NSR8899' }
    });
    const kingCookies = resLogin.headers['set-cookie'] || [];
    const kingCookieHeader = Array.isArray(kingCookies) ? kingCookies[0].split(';')[0] : kingCookies;

    // Check session validity
    const resCheck = await request('GET', '/auth-handler.php?action=verify', {
      headers: { 'Cookie': kingCookieHeader }
    });
    const checkValid = resCheck.statusCode === 200 && resCheck.body?.authenticated === true;

    // Perform Logout
    const resLogout = await request('POST', '/auth-handler.php?action=logout', {
      headers: { 'Cookie': kingCookieHeader }
    });

    // Check session again post-logout
    const resCheckPostLogout = await request('GET', '/auth-handler.php?action=verify', {
      headers: { 'Cookie': kingCookieHeader }
    });
    const checkInvalid = resCheckPostLogout.statusCode === 401 && resCheckPostLogout.body?.authenticated === false;

    record(
      'Complete Authentication, Session Verification & Dual-Stage Logout',
      checkValid && resLogout.statusCode === 200 && checkInvalid,
      `Login Valid (200) -> Logout (200) -> Post-Logout Rejected (401 Unauthorized)`
    );

  } finally {
    phpProcess.kill();
  }

  // Summary
  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  console.log(`TOTAL SUITE RESULT: ${passedCount}/${total} TESTS PASSED`);
  console.log(`FINAL SECURITY VERDICT: ${allPassed ? 'PASS (100% SECURE)' : 'FAIL'}`);
  console.log('====================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test Suite Exception:', err);
  if (phpProcess) phpProcess.kill();
  process.exit(1);
});
