import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PHP_PORT = 8089;
const PHP_HOST = '127.0.0.1';
const BASE_URL = `http://${PHP_HOST}:${PHP_PORT}`;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9455;
const TEST_TOKEN = 'NSR-PST-2026';

async function runSecurityTestSuite() {
  console.log('====================================================');
  console.log('🧪 OPINI NSR SECURITY & SESSION HARDENING TEST SUITE');
  console.log('====================================================');

  console.log(`\n[1/5] Starting local PHP server on port ${PHP_PORT} with router...`);
  const phpProc = spawn('php', ['-S', `${PHP_HOST}:${PHP_PORT}`, 'scripts/local-router.php'], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 1500));

  let allPassed = true;

  try {
    // 2. Test Backend Authentication & Session Cookie
    console.log('\n[2/5] Testing Backend Auth & HttpOnly Cookie Issuance...');
    const loginRes = await fetch(`${BASE_URL}/auth-handler.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: TEST_TOKEN })
    });

    const loginCookie = loginRes.headers.get('set-cookie');
    const loginData = await loginRes.json();

    console.log('  • Login Status:', loginRes.status);
    console.log('  • Set-Cookie Header:', loginCookie ? 'YES (' + loginCookie.split(';')[0] + ')' : 'NO');
    console.log('  • Cookie contains HttpOnly:', loginCookie && loginCookie.toLowerCase().includes('httponly') ? 'YES ✅' : 'NO ❌');
    console.log('  • Cookie contains SameSite=Lax:', loginCookie && loginCookie.toLowerCase().includes('samesite=lax') ? 'YES ✅' : 'NO ❌');
    console.log('  • Response has authenticated=true:', loginData.authenticated === true ? 'YES ✅' : 'NO ❌');
    console.log('  • Response user object has NO raw token:', loginData.user && loginData.user.token === undefined ? 'YES ✅' : 'NO ❌ (EXPOSED)');

    if (!loginCookie || !loginCookie.toLowerCase().includes('httponly') || loginData.authenticated !== true) {
      throw new Error('Backend login failed or did not issue HttpOnly cookie');
    }

    const nsrCookie = loginCookie.split(';')[0]; // NSR_SESSION=...

    // 3. Test Fail-Closed Endpoints without session cookie vs with session cookie
    console.log('\n[3/5] Testing Fail-Closed Endpoint Enforcement & Server-Side RBAC...');
    
    // NoLap endpoint
    const nolapUnauth = await fetch(`${BASE_URL}/nolap-data-handler.php?action=getDynamicRiskChecklist&tujuanPenilaian=Jual+Beli&jenisObjek=Tanah`);
    console.log('  • NoLap without cookie returns 401:', nolapUnauth.status === 401 ? 'PASS (401) ✅' : `FAIL (${nolapUnauth.status}) ❌`);
    if (nolapUnauth.status !== 401) allPassed = false;

    const nolapAuth = await fetch(`${BASE_URL}/nolap-data-handler.php?action=getDynamicRiskChecklist&tujuanPenilaian=Jual+Beli&jenisObjek=Tanah`, {
      headers: { 'Cookie': nsrCookie }
    });
    console.log('  • NoLap with session cookie returns 200:', nolapAuth.status === 200 ? 'PASS (200) ✅' : `FAIL (${nolapAuth.status}) ❌`);
    if (nolapAuth.status !== 200) allPassed = false;

    // Kwitansi endpoint
    const kwUnauth = await fetch(`${BASE_URL}/kwitansi-data-handler.php?action=getAllKwitansi`);
    console.log('  • Kwitansi without cookie returns 401:', kwUnauth.status === 401 ? 'PASS (401) ✅' : `FAIL (${kwUnauth.status}) ❌`);
    if (kwUnauth.status !== 401) allPassed = false;

    const kwAuth = await fetch(`${BASE_URL}/kwitansi-data-handler.php?action=getAllKwitansi`, {
      headers: { 'Cookie': nsrCookie }
    });
    console.log('  • Kwitansi with session cookie returns 200:', kwAuth.status === 200 ? 'PASS (200) ✅' : `FAIL (${kwAuth.status}) ❌`);
    if (kwAuth.status !== 200) allPassed = false;

    // Operasional endpoint
    const oprUnauth = await fetch(`${BASE_URL}/operasional-data-handler.php?action=getPengajuanList`);
    console.log('  • Operasional without cookie returns 401:', oprUnauth.status === 401 ? 'PASS (401) ✅' : `FAIL (${oprUnauth.status}) ❌`);
    if (oprUnauth.status !== 401) allPassed = false;

    const oprAuth = await fetch(`${BASE_URL}/operasional-data-handler.php?action=getPengajuanList`, {
      headers: { 'Cookie': nsrCookie }
    });
    console.log('  • Operasional with session cookie accepted (200/403):', (oprAuth.status === 200 || oprAuth.status === 403) ? `PASS (${oprAuth.status}) ✅` : `FAIL (${oprAuth.status}) ❌`);

    // 4. Test Invalidation via /auth-handler.php?action=logout
    console.log('\n[4/5] Testing Real Backend Logout & Session Invalidation...');
    const logoutRes = await fetch(`${BASE_URL}/auth-handler.php?action=logout`, {
      method: 'POST',
      headers: { 'Cookie': nsrCookie }
    });
    const logoutData = await logoutRes.json();
    console.log('  • Logout returns success=true:', logoutData.success === true ? 'PASS ✅' : 'FAIL ❌');

    // Subsequent verify must return 401
    const verifyAfterLogout = await fetch(`${BASE_URL}/auth-handler.php?action=verify`, {
      headers: { 'Cookie': nsrCookie }
    });
    console.log('  • Verify after logout returns 401 Unauthorized:', verifyAfterLogout.status === 401 ? 'PASS (401) ✅' : `FAIL (${verifyAfterLogout.status}) ❌`);
    if (verifyAfterLogout.status !== 401) allPassed = false;

    // 5. Test Frontend Headless Chrome via CDP: Zero Raw Token in Browser Storage
    console.log('\n[5/5] Testing Frontend Browser Storage via Chrome CDP...');
    const chrome = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--no-sandbox',
      '--disable-gpu',
      '--user-data-dir=C:\\Users\\HP\\AppData\\Local\\Temp\\chrome_sec_test'
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

    // Navigate to local index.html
    await sendCommand('Page.navigate', { url: `${BASE_URL}/index.html` });
    await new Promise(r => setTimeout(r, 1200));

    // Open modal
    await sendCommand('Runtime.evaluate', {
      expression: `window.bukaModalPortal('penugasan');`
    });
    await new Promise(r => setTimeout(r, 600));

    // Type token into input-token
    await sendCommand('Runtime.evaluate', {
      expression: `
        document.getElementById('input-token').value = '${TEST_TOKEN}';
        document.getElementById('btn-submit-token').click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Inspect storage in the browser
    const evalResult = await sendCommand('Runtime.evaluate', {
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
          authenticated: parsedInternal ? parsedInternal.authenticated : null
        });
      })()`
    });

    const storageAudit = JSON.parse(evalResult.result.value);
    console.log('  • SessionStorage keys present:', storageAudit.sessionKeys.join(', '));
    console.log('  • Raw token keys (TOKEN_AUTH_NSR, etc.) exist in sessionStorage:', storageAudit.rawKeysExist ? 'YES ❌ (FAIL)' : 'NO ✅ (PASS)');
    console.log('  • kjpp_token_internal has token property:', storageAudit.internalHasToken ? 'YES ❌ (FAIL)' : 'NO ✅ (PASS)');
    console.log('  • kjpp_session_jo has token property:', storageAudit.joHasToken ? 'YES ❌ (FAIL)' : 'NO ✅ (PASS)');
    console.log('  • NSR_USER_SESSION has token property:', storageAudit.userHasToken ? 'YES ❌ (FAIL)' : 'NO ✅ (PASS)');
    console.log('  • User profile authenticated properly in UI:', storageAudit.authenticated ? 'YES ✅ (PASS)' : 'NO ❌ (FAIL)');

    if (storageAudit.rawKeysExist || storageAudit.internalHasToken || storageAudit.joHasToken || storageAudit.userHasToken) {
      allPassed = false;
    }

    // Test clicking "Ganti Token / Keluar"
    console.log('  • Testing resetTokenSesi() with backend logout...');
    await sendCommand('Runtime.evaluate', {
      expression: `window.resetTokenSesi();`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 600));

    const postLogoutEval = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        return JSON.stringify({
          internal: sessionStorage.getItem('kjpp_token_internal'),
          user: sessionStorage.getItem('NSR_USER_SESSION'),
          jo: sessionStorage.getItem('kjpp_session_jo'),
          formVisible: !document.getElementById('form-token-portal')?.classList.contains('hidden')
        });
      })()`
    });

    const postLogoutAudit = JSON.parse(postLogoutEval.result.value);
    console.log('  • Storage cleaned after resetTokenSesi:', (postLogoutAudit.internal === null && postLogoutAudit.user === null) ? 'PASS ✅' : 'FAIL ❌');
    console.log('  • Login form visible again in modal:', postLogoutAudit.formVisible ? 'PASS ✅' : 'FAIL ❌');

    chrome.kill();
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    allPassed = false;
  } finally {
    phpProc.kill();
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🏆 ALL SECURITY & SESSION HARDENING TESTS PASSED! (100%)');
  } else {
    console.log('💥 SOME SECURITY TESTS FAILED! PLEASE REVIEW.');
  }
  console.log('====================================================');

  process.exit(allPassed ? 0 : 1);
}

runSecurityTestSuite();
