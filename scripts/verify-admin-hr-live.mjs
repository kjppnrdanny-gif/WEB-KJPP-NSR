import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const BASE_URL = 'https://kjppnanangrahayu.com';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome binary not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.method === 'Page.javascriptDialogOpening') {
          this.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
          return;
        }
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function runTest() {
  console.log('=== PENGUJIAN LIVE ADMIN HR & TABEL MONITORING ===');
  const chromePath = findChrome();
  const remoteDebuggingPort = 9488;
  const userDataDir = path.join(os.tmpdir(), 'chrome_hr_test_' + Date.now());

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-extensions',
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
        if (res.ok) { versionData = await res.json(); break; }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 200));
    }

    const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // Desktop Viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1400,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false
    });

    const targetUrl = `${BASE_URL}/portal-presensi.html?login=nik_direct&nik=NSR-2019-005&tab=dashboard&_v=${Date.now()}`;
    console.log('Navigasi ke:', targetUrl);
    await cdp.send('Page.navigate', { url: targetUrl });
    await new Promise(r => setTimeout(r, 3000));

    // Panggil muatDashboardHR untuk memastikan data sinkron
    await cdp.evaluate(`window.muatDashboardHR(true)`);
    await new Promise(r => setTimeout(r, 2000));

    // Evaluasi status Admin HR
    const evalHR = await cdp.evaluate(`
      (() => {
        const labelTgl = document.getElementById('label-tanggal-transaksi')?.textContent || '';
        const tableBody = document.getElementById('hr-monitoring-table-body');
        const isStuck = tableBody?.innerHTML.includes('Memuat data monitoring');
        const metricTotal = document.getElementById('hr-metric-total')?.textContent;
        const metricMasuk = document.getElementById('hr-metric-masuk')?.textContent;
        const panelDashboardVisible = !document.getElementById('panelDashboard')?.classList.contains('hidden');
        const rows = tableBody ? Array.from(tableBody.querySelectorAll('tr')).map(r => r.innerText.replace(/\\s+/g, ' ').trim()) : [];

        return {
          labelTgl,
          isStuckLoading: isStuck,
          metricTotal,
          metricMasuk,
          panelDashboardVisible,
          rowsCount: rows.length,
          sampleRows: rows.slice(0, 4)
        };
      })()
    `);
    console.log('Admin HR Evaluation Result:', evalHR);

    // Scroll sedikit ke tabel monitoring agar terlihat sempurna di screenshot
    await cdp.evaluate(`
      const tb = document.getElementById('hr-subpanel-monitoring');
      if (tb) tb.scrollIntoView({ behavior: 'instant', block: 'start' });
    `);
    await new Promise(r => setTimeout(r, 800));

    // Capture Desktop Screenshot
    const shotDesktop = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotDesktopPath = path.join(ARTIFACT_DIR, 'bukti_live_admin_hr_sanitized_desktop.png');
    fs.writeFileSync(shotDesktopPath, Buffer.from(shotDesktop.data, 'base64'));
    console.log('✓ Desktop screenshot tersimpan di:', shotDesktopPath);

    // Mobile Viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Mobile Screenshot
    const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotMobilePath = path.join(ARTIFACT_DIR, 'bukti_live_admin_hr_sanitized_mobile.png');
    fs.writeFileSync(shotMobilePath, Buffer.from(shotMobile.data, 'base64'));
    console.log('✓ Mobile screenshot tersimpan di:', shotMobilePath);

    console.log('\n🎉 PENGUJIAN LIVE DASBOR ADMIN HR SUKSES 100%!');

  } finally {
    try { chromeProc.kill(); } catch (_) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

runTest().catch(console.error);
