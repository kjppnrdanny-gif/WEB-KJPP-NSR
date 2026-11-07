import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8881;
const DEBUG_PORT = 9559;
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
  if (req.url.includes('job-tracking-handler.php')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ status: 'success', data: [] }));
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
  console.log('   TEST SUITE: TECHNICAL STAFF RBAC RESTRICTIONS (CDP)');
  console.log('=================================================================\n');

  await new Promise(r => server.listen(PORT, r));
  console.log(`1. Server uji aktif pada http://127.0.0.1:${PORT}`);

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
      if (msg.method === 'Console.messageAdded') {
        const m = msg.params.message;
        if (m.level === 'error') {
          console.error('🚨 CONSOLE ERROR:', m.text);
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

    async function evaluate(expression, awaitPromise = false) {
      const res = await send('Runtime.evaluate', {
        expression,
        awaitPromise,
        returnByValue: true
      });
      if (res.result?.exceptionDetails) {
        console.error('EVAL EXCEPTION:', JSON.stringify(res.result.exceptionDetails));
      }
      return res.result?.result?.value !== undefined ? res.result.result.value : res.result?.value;
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Console.enable');

    console.log(`2. Navigasi ke http://127.0.0.1:${PORT}/portal-tracking.html ...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-tracking.html` });
    await new Promise(r => {
      const timer = setTimeout(r, 5000);
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
    await new Promise(r => setTimeout(r, 1000));

    // TEST 1: LOGIN AS TEDI SETIADI (NSR-2019-007 / Reviewer / Analis Teknis)
    console.log('\n3. Menguji Sesi Karyawan Teknis: TEDI SETIADI (NSR-2019-007)...');
    const tediRes = await evaluate(`(async () => {
      sessionStorage.setItem('nsr_tracking_auth_token', 'NSR-REV-2026');
      sessionStorage.setItem('nsr_active_user_nik', 'NSR-2019-007');
      sessionStorage.setItem('nsr_active_user_name', 'Tedi Setiadi');
      sessionStorage.setItem('nsr_active_user_role', 'REVIEWER_SPM');
      sessionStorage.setItem('nsr_active_user_jabatan', 'Reviewer Teknis');

      window.initUserSession();

      const btnWorkload = document.getElementById('tab-btn-workload');
      const btnAllTasks = document.getElementById('tab-queue-all-tasks');
      const btnMyTasks = document.getElementById('tab-queue-my-tasks');
      const badgeAccess = document.getElementById('user-access-badge');
      const filterKantor = document.getElementById('filter-kantor');

      // Test unauthorized switchTab to workload
      window.switchTab('workload');
      const panelWorkload = document.getElementById('panel-tab-workload');

      // Test unauthorized setQueueTab to all_tasks
      window.setQueueTab('all_tasks');

      return {
        workloadBtnHidden: btnWorkload ? (btnWorkload.style.display === 'none' || btnWorkload.classList.contains('hidden')) : true,
        allTasksBtnHidden: btnAllTasks ? (btnAllTasks.style.display === 'none' || btnAllTasks.classList.contains('hidden') || btnAllTasks.disabled) : true,
        activeQueueTab: (typeof currentQueueTab !== 'undefined') ? currentQueueTab : '',
        badgeText: badgeAccess ? badgeAccess.textContent.trim() : '',
        filterKantorDisabled: filterKantor ? filterKantor.disabled : false,
        workloadPanelHidden: panelWorkload ? panelWorkload.classList.contains('hidden') : true
      };
    })()`, true);

    console.log('Hasil Pengujian Tedi Setiadi:', tediRes);

    if (!tediRes.workloadBtnHidden) {
      throw new Error('Tab Control Tower & SPM Hub masih terlihat untuk Tedi Setiadi!');
    }
    console.log('  ✅ PASS: Tab "Control Tower & SPM Hub" tersembunyi (display: none).');

    if (!tediRes.allTasksBtnHidden) {
      throw new Error('Tab Semua Penugasan Cabang/Nasional masih terlihat/aktif untuk Tedi Setiadi!');
    }
    console.log('  ✅ PASS: Tab "Semua Penugasan Cabang/Nasional" tersembunyi dan nonaktif.');

    if (tediRes.activeQueueTab !== 'my_tasks') {
      throw new Error(`Tab antrean tidak terkunci ke my_tasks (aktual: ${tediRes.activeQueueTab})!`);
    }
    console.log('  ✅ PASS: Tab antrean terkunci secara mutlak ke "my_tasks" (Tugas Saya).');

    if (!tediRes.badgeText.includes('Penugasan PIC: Kantor Pusat Jakarta')) {
      throw new Error(`Badge wilayah bukan "Penugasan PIC: Kantor Pusat Jakarta" (aktual: ${tediRes.badgeText})!`);
    }
    console.log('  ✅ PASS: Badge cakupan wilayah sesuai: "' + tediRes.badgeText + '".');

    if (!tediRes.filterKantorDisabled) {
      throw new Error('Dropdown filter kantor cabang tidak terkunci (disabled) untuk staf teknis!');
    }
    console.log('  ✅ PASS: Dropdown wilayah terkunci (disabled = true).');

    if (!tediRes.workloadPanelHidden) {
      throw new Error('Panel workload berhasil dibuka meskipun akses dilarang!');
    }
    console.log('  ✅ PASS: Eksekusi switchTab("workload") ditolak & panel tetap terkunci.');

    // Screenshot Tedi Setiadi
    const shotTedi = await send('Page.captureScreenshot', { format: 'png' });
    const shotTediPath = path.join(ARTIFACT_DIR, 'bukti_rbac_tedi_setiadi_restricted.png');
    fs.writeFileSync(shotTediPath, Buffer.from(shotTedi.result.data, 'base64'));
    console.log(`  📸 Screenshot Tedi Setiadi disimpan: ${shotTediPath}`);

    // TEST 2: LOGIN AS PIMPINAN (Akses Lengkap)
    console.log('\n4. Menguji Sesi PIMPINAN (Danny Taufik Hidayat)...');
    const pimRes = await evaluate(`(async () => {
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

    console.log('Hasil Pengujian Pimpinan:', pimRes);
    if (!pimRes.workloadBtnVisible) {
      throw new Error('Tab Control Tower tidak terlihat untuk Pimpinan!');
    }
    console.log('  ✅ PASS: Tab "Control Tower & SPM Hub" aktif dan terlihat untuk Pimpinan.');

    if (!pimRes.allTasksBtnVisible) {
      throw new Error('Tab Semua Penugasan tidak terlihat untuk Pimpinan!');
    }
    console.log('  ✅ PASS: Tab "Semua Penugasan Cabang/Nasional" aktif dan dapat diakses Pimpinan.');

    if (pageErrors.length > 0) {
      console.error('Galat halaman ditemukan:', pageErrors);
      process.exit(1);
    }

    console.log('\n=================================================================');
    console.log('🎉 SELURUH PENGUJIAN PENGETATAN RBAC STAF TEKNIS LULUS 100%!');
    console.log('=================================================================');

    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

main().catch(err => {
  console.error('Test gagal:', err);
  process.exit(1);
});
