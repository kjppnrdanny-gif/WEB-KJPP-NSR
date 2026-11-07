import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const DEBUG_PORT = 9888;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-tracking.html';

async function main() {
  console.log('=================================================================');
  console.log('   LIVE TEST: TECHNICAL STAFF RBAC RESTRICTIONS ON PRODUCTION');
  console.log(`   Target URL: ${LIVE_URL}`);
  console.log('=================================================================\n');

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
        callbacks.get(msg.id)(msg);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const exp = msg.params.exceptionDetails;
        const text = exp.exception ? (exp.exception.description || exp.exception.value) : exp.text;
        const errInfo = `[EXCEPTION] line ${exp.lineNumber}:${exp.columnNumber} - ${text}`;
        pageErrors.push(errInfo);
        console.error('🚨', errInfo);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    async function evaluate(expression, awaitPromise = false) {
      const res = await send('Runtime.evaluate', {
        expression,
        awaitPromise,
        returnByValue: true
      });
      return res.result?.result?.value !== undefined ? res.result.result.value : res.result?.value;
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log(`1. Navigasi ke ${LIVE_URL} ...`);
    await send('Page.navigate', { url: `${LIVE_URL}?v=${Date.now()}` });
    await new Promise(r => {
      const timer = setTimeout(r, 6000);
      const prevHandler = ws.onmessage;
      ws.onmessage = (event) => {
        prevHandler(event);
        const m = JSON.parse(event.data);
        if (m.method === 'Page.loadEventFired') {
          clearTimeout(timer);
          r();
        }
      };
    });
    await new Promise(r => setTimeout(r, 2000));

    // TEST 1: LIVE TEDI SETIADI (NSR-2019-007)
    console.log('2. Menguji Sesi Staf Teknis Live: TEDI SETIADI (NSR-2019-007)...');
    const tediLive = await evaluate(`(async () => {
      sessionStorage.setItem('nsr_tracking_auth_token', 'NSR-REV-2026');
      sessionStorage.setItem('nsr_active_user_nik', 'NSR-2019-007');
      sessionStorage.setItem('nsr_active_user_name', 'Tedi Setiadi');
      sessionStorage.setItem('nsr_active_user_role', 'REVIEWER_SPM');
      sessionStorage.setItem('nsr_active_user_jabatan', 'Reviewer Teknis');

      window.initUserSession();

      const btnWorkload = document.getElementById('tab-btn-workload');
      const btnAllTasks = document.getElementById('tab-queue-all-tasks');
      const badgeAccess = document.getElementById('user-access-badge');
      const filterKantor = document.getElementById('filter-kantor');

      window.switchTab('workload');
      const panelWorkload = document.getElementById('panel-tab-workload');

      return {
        workloadBtnHidden: btnWorkload ? (btnWorkload.style.display === 'none' || btnWorkload.classList.contains('hidden')) : true,
        allTasksBtnHidden: btnAllTasks ? (btnAllTasks.style.display === 'none' || btnAllTasks.classList.contains('hidden') || btnAllTasks.disabled) : true,
        activeQueueTab: (typeof currentQueueTab !== 'undefined') ? currentQueueTab : '',
        badgeText: badgeAccess ? badgeAccess.textContent.trim() : '',
        filterKantorDisabled: filterKantor ? filterKantor.disabled : false,
        workloadPanelHidden: panelWorkload ? panelWorkload.classList.contains('hidden') : true
      };
    })()`, true);

    console.log('Hasil Pengujian Live Tedi Setiadi:', tediLive);

    if (!tediLive.workloadBtnHidden) {
      throw new Error('Tab Control Tower masih terlihat di server live untuk Tedi Setiadi!');
    }
    console.log('  ✅ PASS: Tab "Control Tower & SPM Hub" tersembunyi di live server.');

    if (!tediLive.allTasksBtnHidden) {
      throw new Error('Tab Semua Penugasan masih terlihat di server live untuk Tedi Setiadi!');
    }
    console.log('  ✅ PASS: Tab "Semua Penugasan Cabang/Nasional" tersembunyi di live server.');

    if (tediLive.activeQueueTab !== 'my_tasks') {
      throw new Error(`Tab antrean tidak terkunci ke my_tasks di live (aktual: ${tediLive.activeQueueTab})!`);
    }
    console.log('  ✅ PASS: Tab antrean terkunci ke "my_tasks" (Tugas Saya).');

    if (!tediLive.badgeText.includes('Penugasan PIC: Kantor Pusat Jakarta')) {
      throw new Error(`Badge wilayah live bukan Penugasan PIC: Kantor Pusat Jakarta (aktual: ${tediLive.badgeText})!`);
    }
    console.log('  ✅ PASS: Badge cakupan wilayah live: "' + tediLive.badgeText + '".');

    if (!tediLive.filterKantorDisabled) {
      throw new Error('Dropdown kantor cabang live tidak terkunci!');
    }
    console.log('  ✅ PASS: Dropdown wilayah live terkunci (disabled = true).');

    // Screenshot Tedi Setiadi Live
    const shotTedi = await send('Page.captureScreenshot', { format: 'png' });
    const shotTediPath = path.join(ARTIFACT_DIR, 'bukti_live_tedi_setiadi_restricted.png');
    fs.writeFileSync(shotTediPath, Buffer.from(shotTedi.result.data, 'base64'));
    console.log(`  📸 Screenshot Tedi Setiadi live disimpan: ${shotTediPath}`);

    // TEST 2: LIVE PIMPINAN (Akses Penuh)
    console.log('\n3. Menguji Sesi PIMPINAN Live (Danny Taufik Hidayat)...');
    const pimLive = await evaluate(`(async () => {
      sessionStorage.setItem('nsr_tracking_auth_token', '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f');
      sessionStorage.setItem('nsr_active_user_nik', 'NSR-2019-005');
      sessionStorage.setItem('nsr_active_user_name', 'Danny Taufik Hidayat, S.H.');
      sessionStorage.setItem('nsr_active_user_role', 'PIMPINAN');
      sessionStorage.setItem('nsr_active_user_jabatan', 'Pemimpin Rekan');

      window.initUserSession();

      const btnWorkload = document.getElementById('tab-btn-workload');
      const btnAllTasks = document.getElementById('tab-queue-all-tasks');
      const badgeAccess = document.getElementById('user-access-badge');
      const filterKantor = document.getElementById('filter-kantor');

      return {
        workloadBtnVisible: btnWorkload ? (btnWorkload.style.display !== 'none' && !btnWorkload.classList.contains('hidden')) : false,
        allTasksBtnVisible: btnAllTasks ? (btnAllTasks.style.display !== 'none' && !btnAllTasks.classList.contains('hidden') && !btnAllTasks.disabled) : false,
        badgeText: badgeAccess ? badgeAccess.textContent.trim() : '',
        filterKantorUnlocked: filterKantor ? !filterKantor.disabled : false
      };
    })()`, true);

    console.log('Hasil Pengujian Live Pimpinan:', pimLive);
    if (!pimLive.workloadBtnVisible) {
      throw new Error('Tab Control Tower tidak terlihat untuk Pimpinan di live server!');
    }
    console.log('  ✅ PASS: Tab "Control Tower & SPM Hub" aktif dan terlihat untuk Pimpinan di live server.');

    if (!pimLive.allTasksBtnVisible) {
      throw new Error('Tab Semua Penugasan tidak terlihat untuk Pimpinan di live server!');
    }
    console.log('  ✅ PASS: Tab "Semua Penugasan Cabang/Nasional" aktif dan dapat diakses Pimpinan di live server.');

    console.log('\n=================================================================');
    console.log('🎉 VERIFIKASI SERVER LIVE PRODUCTION LULUS 100%!');
    console.log('=================================================================');
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Pengujian live gagal:', err);
  process.exit(1);
});
