import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9588',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9588/json');
    const targets = await targetRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const WS = globalThis.WebSocket;
    const ws = new WS(wsUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };
    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });

    console.log('1. Navigating to live portal-presensi.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-presensi.html?v=' + Date.now() });
    await new Promise(r => setTimeout(r, 3500));

    console.log('2. Dismissing modals & unlocking Admin HR Dashboard...');
    const initRes = await send('Runtime.evaluate', {
      expression: `
        (async function() {
          // Acknowledge Privacy
          sessionStorage.setItem('nsr_privasi_confirmed_version', 'PDP-2026-V1');
          sessionStorage.setItem('nsr_privasi_confirmed_at', new Date().toISOString());
          localStorage.setItem('nsr_presensi_privacy_ack', 'true');
          localStorage.setItem('nsr_presensi_privacy_accepted', 'true');
          
          const mPriv = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
          if (mPriv) {
            mPriv.classList.add('hidden');
            mPriv.style.display = 'none';
          }
          const mNotif = document.getElementById('modalNotif');
          if (mNotif) {
            mNotif.classList.add('hidden');
          }
          document.body.style.overflow = 'auto';

          // Authenticate as Admin HR Danny Taufik Hidayat
          sessionStorage.setItem('nsr_hr_unlocked', 'true');
          sessionStorage.setItem('nsr_presensi_active_nik', 'NSR-2019-005');
          sessionStorage.setItem('nsr_presensi_active_nama', 'Danny Taufik Hidayat, S.E., S.H.');
          sessionStorage.setItem('nsr_presensi_active_role', 'admin_pusat');
          sessionStorage.setItem('NSR_AUTH_TOKEN', 'NSR8899');
          
          if (typeof gantiMode === 'function') {
            gantiMode('dashboard');
          }
          if (typeof muatDashboardHR === 'function') {
            await muatDashboardHR(true);
          }
          await new Promise(r => setTimeout(r, 1500));

          // Hide any leftover modal backdrops
          const allModals = document.querySelectorAll('[id^="modal"]');
          allModals.forEach(m => {
            m.classList.add('hidden');
            m.style.display = 'none';
          });
          
          const tbody = document.getElementById('hr-monitoring-table-body');
          const elTgl = document.getElementById('label-tanggal-transaksi');
          const mTotal = document.getElementById('hr-metric-total');
          const mMasuk = document.getElementById('hr-metric-masuk');
          const mBelum = document.getElementById('hr-metric-belum');
          const mTerlambat = document.getElementById('hr-metric-terlambat');
          
          return {
            tanggal: elTgl ? elTgl.innerText : '',
            metricTotal: mTotal ? mTotal.innerText : '',
            metricMasuk: mMasuk ? mMasuk.innerText : '',
            metricBelum: mBelum ? mBelum.innerText : '',
            metricTerlambat: mTerlambat ? mTerlambat.innerText : '',
            tableRowsCount: tbody ? tbody.children.length : 0,
            tableText: tbody ? tbody.innerText.slice(0, 300) : ''
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Dashboard Evaluation:', JSON.stringify(initRes.result?.value, null, 2));

    await new Promise(r => setTimeout(r, 1000));

    // Scroll to dashboard panel
    await send('Runtime.evaluate', {
      expression: `
        const p = document.getElementById('panelDashboard');
        if (p) p.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Desktop Screenshot
    console.log('3. Capturing desktop screenshot...');
    const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    const desktopPath = path.join(ARTIFACT_DIR, 'bukti_live_admin_hr_table_desktop.png');
    fs.writeFileSync(desktopPath, Buffer.from(shotDesktop.data, 'base64'));
    console.log('   ✓ Saved:', desktopPath);

    // Mobile Viewport Screenshot
    console.log('4. Capturing mobile viewport screenshot (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 800));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    const mobilePath = path.join(ARTIFACT_DIR, 'bukti_live_admin_hr_table_mobile.png');
    fs.writeFileSync(mobilePath, Buffer.from(shotMobile.data, 'base64'));
    console.log('   ✓ Saved:', mobilePath);

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
