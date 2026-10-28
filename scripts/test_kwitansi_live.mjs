import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9470',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9470/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-kwitansi.html' });
    await new Promise(r => setTimeout(r, 3000));

    // Test token resolving and login
    const loginRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const auth = resolveUnifiedToken('NSR-KEU-2026');
          const inp = document.getElementById('kwitansi-auth-username');
          if (inp) inp.value = 'NSR-KEU-2026';
          await masukSesiKwitansi();
          await new Promise(r => setTimeout(r, 800));

          const tabBtnPusat = document.getElementById('tab-btn-pusat');
          const tabBtnCabang = document.getElementById('tab-btn-cabang');
          const panelPusat = document.getElementById('panel-pusat');
          const panelCabang = document.getElementById('panel-cabang');
          const cabangVal = document.getElementById('cabang-pengaju')?.value;
          const namaStaf = document.getElementById('nama-staf-pengaju')?.value;

          return {
            auth,
            badge: document.getElementById('label-sesi-cabang')?.innerText,
            verified: document.getElementById('label-cabang-terverifikasi')?.innerText,
            tabBtnPusatVisible: !tabBtnPusat?.classList.contains('hidden'),
            tabBtnPusatText: tabBtnPusat?.innerText?.trim(),
            tabBtnCabangText: tabBtnCabang?.innerText?.trim(),
            panelPusatVisible: !panelPusat?.classList.contains('hidden'),
            panelCabangVisible: !panelCabang?.classList.contains('hidden'),
            cabangVal,
            namaStaf,
            currentUserRole: window.currentUser?.role,
            currentUserIsPusat: window.currentUser?.isPusat
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Login Result:', JSON.stringify(loginRes.result?.value, null, 2));

    // Capture screenshot of Tab 2 (Default active)
    const shotTab2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_kwitansi_pusat_tab2.png'), Buffer.from(shotTab2.data, 'base64'));
    console.log('Saved live_prod_kwitansi_pusat_tab2.png');

    // Switch to Tab 1
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          gantiTab('cabang');
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shotTab1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_kwitansi_pusat_tab1.png'), Buffer.from(shotTab1.data, 'base64'));
    console.log('Saved live_prod_kwitansi_pusat_tab1.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
