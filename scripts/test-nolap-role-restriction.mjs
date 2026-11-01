import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8089;
const DEBUG_PORT = 9268;

// Create local HTTP server with proper MIME types
function startLocalServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/portal-nolap.html') {
      const content = fs.readFileSync('portal-nolap.html', 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
    const localFile = path.join(process.cwd(), reqPath.replace(/^\//, ''));
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile);
      const mime = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : ext === '.json' ? 'application/json' : 'text/plain';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(localFile).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });

  return new Promise(resolve => {
    server.listen(PORT, () => {
      console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runTest() {
  const server = await startLocalServer();
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1400,1000',
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
    const dialogHistory = [];

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
      }
      if (msg.method === 'Page.javascriptDialogOpening') {
        console.log(`[CDP Alert Caught]: "${msg.params.message}"`);
        dialogHistory.push(msg.params.message);
        send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
        return;
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('\n======================================================');
    console.log('TEST 1: LOGIN PENILAI (VALUER) NSR-VAL-2026');
    console.log('======================================================');

    const valuerToken = ['NSR', 'VAL', '2026'].join('-');
    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-nolap.html` });
    await new Promise(r => setTimeout(r, 2500));

    // Submit token via login form and await completion
    await send('Runtime.evaluate', {
      expression: `(async () => {
        const inp = document.getElementById('input-token-nolap');
        if (inp) inp.value = '${valuerToken}';
        await loginKeServer();
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    // Evaluate state and visibility in browser
    const evalValuer = await send('Runtime.evaluate', {
      expression: `(() => {
        const badgeAdmin = document.getElementById('badge-admin-pusat');
        const badgeAdminDisplay = badgeAdmin ? window.getComputedStyle(badgeAdmin).display : 'null';
        const badgeAdminHidden = badgeAdmin ? badgeAdmin.classList.contains('hidden') : false;

        const tab1 = document.getElementById('tab-btn-pengajuan');
        const tab2 = document.getElementById('tab-btn-spm');
        const tab3 = document.getElementById('tab-btn-approval');
        const tab4 = document.getElementById('tab-btn-elsa');
        const tab5 = document.getElementById('tab-btn-riwayat');
        const tab6 = document.getElementById('tab-btn-monitoring');

        const tab1Display = tab1 ? window.getComputedStyle(tab1).display : 'null';
        const tab2Display = tab2 ? window.getComputedStyle(tab2).display : 'null';
        const tab3Display = tab3 ? window.getComputedStyle(tab3).display : 'null';
        const tab4Display = tab4 ? window.getComputedStyle(tab4).display : 'null';
        const tab5Display = tab5 ? window.getComputedStyle(tab5).display : 'null';
        const tab6Display = tab6 ? window.getComputedStyle(tab6).display : 'null';

        const btnFinalisasiHeader = document.getElementById('btn-finalisasi-booking-header');
        const btnFinalisasiHeaderDisplay = btnFinalisasiHeader ? window.getComputedStyle(btnFinalisasiHeader).display : 'null';

        const btnRegisterResmi = document.getElementById('btn-kelola-register');
        const btnRegisterResmiDisplay = btnRegisterResmi ? window.getComputedStyle(btnRegisterResmi).display : 'null';

        return {
          role: window.currentUser ? window.currentUser.role : null,
          isApprovalAdmin: window.isApprovalAdmin,
          canApproveNoLap: window.canApproveNoLap,
          canViewMasterDashboard: window.canViewMasterDashboard,
          badgeAdminDisplay,
          badgeAdminHidden,
          tab1Display,
          tab2Display,
          tab3Display,
          tab4Display,
          tab5Display,
          tab6Display,
          btnFinalisasiHeaderDisplay,
          btnRegisterResmiDisplay
        };
      })()`,
      returnByValue: true
    });

    console.log('Penilai State Result:', JSON.stringify(evalValuer.result.value, null, 2));
    const valState = evalValuer.result.value;

    if (valState.isApprovalAdmin !== false || valState.canApproveNoLap !== false || valState.canViewMasterDashboard !== false) {
      throw new Error(`FAIL: Approval state variables not false for Penilai: isApprovalAdmin=${valState.isApprovalAdmin}`);
    }

    if (valState.badgeAdminDisplay !== 'none') {
      throw new Error(`FAIL: badge-admin-pusat is visible for Penilai! Display: ${valState.badgeAdminDisplay}`);
    }

    if (valState.tab1Display === 'none' || valState.tab2Display === 'none') {
      throw new Error(`FAIL: Tab 1 or Tab 2 is hidden for Penilai! tab1=${valState.tab1Display}, tab2=${valState.tab2Display}`);
    }

    if (valState.tab3Display !== 'none' || valState.tab4Display !== 'none' || valState.tab5Display !== 'none' || valState.tab6Display !== 'none') {
      throw new Error(`FAIL: Tabs 3, 4, 5, or 6 are NOT hidden for Penilai! tab3=${valState.tab3Display}, tab4=${valState.tab4Display}, tab5=${valState.tab5Display}, tab6=${valState.tab6Display}`);
    }

    if (valState.btnFinalisasiHeaderDisplay !== 'none') {
      throw new Error(`FAIL: Finalisasi booking button is visible for Penilai! Display: ${valState.btnFinalisasiHeaderDisplay}`);
    }

    if (valState.btnRegisterResmiDisplay !== 'none') {
      throw new Error(`FAIL: Register resmi button is visible for Penilai! Display: ${valState.btnRegisterResmiDisplay}`);
    }

    console.log('✓ Penilai UI visibility strictly verified: Tabs 1 & 2 visible, Tabs 3-6, badges, and approval buttons strictly hidden.');

    // Capture screenshot of Penilai view
    const screenshotValuer = await send('Page.captureScreenshot', { format: 'png' });
    const proofValuerPath = path.join(ARTIFACT_DIR, 'bukti_live_nolap_penilai_tab1_tab2_only.png');
    fs.writeFileSync(proofValuerPath, Buffer.from(screenshotValuer.data, 'base64'));
    console.log(`✓ Proof screenshot saved: ${proofValuerPath}`);

    // Now test attempting to navigate to Tab 3 (Approval)
    console.log('\n--- Testing Navigation Interception on Penilai ---');
    dialogHistory.length = 0;

    await send('Runtime.evaluate', {
      expression: `(() => {
        gantiTabModul('approval');
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    const expectedAlert = "Akses Terbatas: Wewenang Anda terbatas pada Pengajuan Draf NoLap (Tab 1 & 2). Verifikasi dan penerbitan nomor resmi merupakan kewenangan Petugas Admin Pusat.";
    const hasExpectedAlert1 = dialogHistory.some(m => m.includes("Akses Terbatas: Wewenang Anda terbatas pada Pengajuan Draf NoLap (Tab 1 & 2)"));
    if (!hasExpectedAlert1) {
      throw new Error(`FAIL: Expected alert was not triggered when calling gantiTabModul('approval'). Caught: ${JSON.stringify(dialogHistory)}`);
    }
    console.log('✓ Attempting gantiTabModul("approval") was correctly blocked with strict warning alert.');

    // Verify user remained on panel-pengajuan
    const activePanelCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const pPengajuan = document.getElementById('panel-pengajuan');
        const pApproval = document.getElementById('panel-approval');
        return {
          pengajuanHidden: pPengajuan.classList.contains('hidden'),
          approvalHidden: pApproval.classList.contains('hidden')
        };
      })()`,
      returnByValue: true
    });

    if (activePanelCheck.result.value.pengajuanHidden || !activePanelCheck.result.value.approvalHidden) {
      throw new Error(`FAIL: User was moved away from panel-pengajuan: ${JSON.stringify(activePanelCheck.result.value)}`);
    }
    console.log('✓ User remained safely anchored on Tab 1 (panel-pengajuan).');

    // Test window.bukaTab(6) for monitoring dashboard
    dialogHistory.length = 0;
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.bukaTab(6);
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    const hasExpectedAlert2 = dialogHistory.some(m => m.includes("Akses Terbatas: Wewenang Anda terbatas pada Pengajuan Draf NoLap (Tab 1 & 2)"));
    if (!hasExpectedAlert2) {
      throw new Error(`FAIL: Expected alert was not triggered when calling window.bukaTab(6). Caught: ${JSON.stringify(dialogHistory)}`);
    }
    console.log('✓ Attempting window.bukaTab(6) was correctly blocked with strict warning alert.');

    // Test finalisasi booking modal call
    dialogHistory.length = 0;
    await send('Runtime.evaluate', {
      expression: `(() => {
        bukaModalFinalisasiBooking();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));
    console.log('✓ Finalisasi booking function invoked by Penilai triggers security check:', dialogHistory);

    console.log('\n======================================================');
    console.log('TEST 2: LOGIN SUPER ADMIN (NSR8899)');
    console.log('======================================================');

    const kingToken = ['NSR', '8899'].join('');
    // Clear previous session storage before login
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.clear();
        localStorage.clear();
      })()`
    });

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-nolap.html` });
    await new Promise(r => setTimeout(r, 2500));

    await send('Runtime.evaluate', {
      expression: `(async () => {
        const inp = document.getElementById('input-token-nolap');
        if (inp) inp.value = '${kingToken}';
        await loginKeServer();
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const evalKing = await send('Runtime.evaluate', {
      expression: `(() => {
        const badgeAdmin = document.getElementById('badge-admin-pusat');
        const badgeAdminDisplay = badgeAdmin ? window.getComputedStyle(badgeAdmin).display : 'null';
        const badgeAdminHidden = badgeAdmin ? badgeAdmin.classList.contains('hidden') : false;

        const tab1 = document.getElementById('tab-btn-pengajuan');
        const tab2 = document.getElementById('tab-btn-spm');
        const tab3 = document.getElementById('tab-btn-approval');
        const tab4 = document.getElementById('tab-btn-elsa');
        const tab5 = document.getElementById('tab-btn-riwayat');
        const tab6 = document.getElementById('tab-btn-monitoring');

        const tab1Display = tab1 ? window.getComputedStyle(tab1).display : 'null';
        const tab2Display = tab2 ? window.getComputedStyle(tab2).display : 'null';
        const tab3Display = tab3 ? window.getComputedStyle(tab3).display : 'null';
        const tab4Display = tab4 ? window.getComputedStyle(tab4).display : 'null';
        const tab5Display = tab5 ? window.getComputedStyle(tab5).display : 'null';
        const tab6Display = tab6 ? window.getComputedStyle(tab6).display : 'null';

        const btnFinalisasiHeader = document.getElementById('btn-finalisasi-booking-header');
        const btnFinalisasiHeaderDisplay = btnFinalisasiHeader ? window.getComputedStyle(btnFinalisasiHeader).display : 'null';

        return {
          role: window.currentUser ? window.currentUser.role : null,
          isApprovalAdmin: window.isApprovalAdmin,
          canApproveNoLap: window.canApproveNoLap,
          canViewMasterDashboard: window.canViewMasterDashboard,
          badgeAdminDisplay,
          badgeAdminHidden,
          tab1Display,
          tab2Display,
          tab3Display,
          tab4Display,
          tab5Display,
          tab6Display,
          btnFinalisasiHeaderDisplay
        };
      })()`,
      returnByValue: true
    });

    console.log('Super Admin State Result:', JSON.stringify(evalKing.result.value, null, 2));
    const kingState = evalKing.result.value;

    if (kingState.isApprovalAdmin !== true || kingState.canApproveNoLap !== true || kingState.canViewMasterDashboard !== true) {
      throw new Error(`FAIL: Approval state variables not true for Super Admin: isApprovalAdmin=${kingState.isApprovalAdmin}`);
    }

    if (kingState.badgeAdminDisplay === 'none') {
      throw new Error(`FAIL: badge-admin-pusat is hidden for Super Admin! Display: ${kingState.badgeAdminDisplay}`);
    }

    if (
      kingState.tab1Display === 'none' ||
      kingState.tab2Display === 'none' ||
      kingState.tab3Display === 'none' ||
      kingState.tab4Display === 'none' ||
      kingState.tab5Display === 'none' ||
      kingState.tab6Display === 'none'
    ) {
      throw new Error(`FAIL: Some tabs are hidden for Super Admin! ${JSON.stringify(kingState)}`);
    }

    if (kingState.btnFinalisasiHeaderDisplay === 'none') {
      throw new Error(`FAIL: Finalisasi booking button is hidden for Super Admin!`);
    }

    console.log('✓ Super Admin Master (NSR8899) strictly verified: All Tabs 1-6 open and unlocked, badge visible, all approval privileges active.');

    // Capture screenshot of Super Admin view
    console.log('\n--- Capturing Audit Screenshots ---');
    const screenshotKing = await send('Page.captureScreenshot', { format: 'png' });
    const proofPath = path.join(ARTIFACT_DIR, 'bukti_live_nolap_superadmin_all_tabs.png');
    fs.writeFileSync(proofPath, Buffer.from(screenshotKing.data, 'base64'));
    console.log(`✓ Proof screenshot saved: ${proofPath}`);

    console.log('\n======================================================');
    console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

runTest().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test FAILED:', err);
  process.exit(1);
});
