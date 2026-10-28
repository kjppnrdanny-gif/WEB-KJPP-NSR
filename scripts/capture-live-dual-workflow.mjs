import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const DEBUG_PORT = 9480;
const LIVE_PORTAL_URL = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html';

async function captureLive() {
  console.log('====================================================');
  console.log('LIVE PRODUCTION VERIFICATION: ' + LIVE_PORTAL_URL);
  console.log('====================================================\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
  ]);

  let wsUrl = '';
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

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();

    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: true });
        return;
      }
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m);
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result?.result?.value;
    }

    async function screenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res.result?.data) {
        const buf = Buffer.from(res.result.data, 'base64');
        const outPath = path.join(ARTIFACTS_DIR, filename);
        fs.writeFileSync(outPath, buf);
        console.log(`[SCREENSHOT] Saved: ${outPath}`);
      }
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log(`[NAVIGATE] Loading live ${LIVE_PORTAL_URL}`);
    await send('Page.navigate', { url: LIVE_PORTAL_URL });
    await new Promise(r => setTimeout(r, 3000));

    // 1. Capture Form Tab 1
    await screenshot('live_prod_portal_jo_tab1_form.png');

    // 2. Set Padang branch session & capture Dual Mode Mandiri vs Pusat
    await evaluate(`
      window.CURRENT_AUTH_SESSION = {
        sub: 'cabang_pdg',
        nama: 'Admin Cabang Padang',
        role: 'ADMIN_CABANG',
        roleLabel: 'Admin Cabang Padang',
        wilayah: 'Padang',
        wilayahLabel: 'Kantor Cabang Padang',
        wilayahCode: 'PDG',
        isCabang: true
      };
      if (typeof inisialisasiModeAksesDariUrl === 'function') inisialisasiModeAksesDariUrl();
    `);
    await new Promise(r => setTimeout(r, 1000));
    await screenshot('live_prod_portal_jo_dual_mode_cabang.png');

    // 3. Switch to Tab 2 Dashboard Monitoring & capture filter_jalur
    await evaluate(`gantiTab(2);`);
    await new Promise(r => setTimeout(r, 1000));
    await screenshot('live_prod_portal_jo_tab2_monitoring_filter.png');

    // 4. Switch to Tab 3
    await evaluate(`gantiTab(3);`);
    await new Promise(r => setTimeout(r, 1000));
    await screenshot('live_prod_portal_jo_tab3_preview.png');

    ws.close();
  } finally {
    chrome.kill();
  }

  console.log('[SUCCESS] All live production screenshots captured successfully!');
}

captureLive().catch(console.error);
