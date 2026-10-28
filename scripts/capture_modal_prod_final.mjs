import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function captureModalProduction() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9432',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9432/json/new?about:blank', { method: 'PUT' });
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
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });

    console.log('Navigating to https://kjppnanangrahayu.com/index.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/index.html?t=' + Date.now() });
    await new Promise(r => setTimeout(r, 4000));

    // Open modal-portal and scroll to kartu-e-operasional
    const res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-portal');
          if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
          }
          const panel = document.getElementById('panel-layanan');
          if (panel) panel.classList.remove('hidden');

          const kartuEOpr = document.getElementById('kartu-e-operasional');
          if (kartuEOpr) {
            kartuEOpr.style.display = '';
            kartuEOpr.scrollIntoView({ behavior: 'instant', block: 'center' });
          }

          return {
            modalOpen: Boolean(modal),
            kartuFound: Boolean(kartuEOpr),
            title: kartuEOpr?.querySelector('h4')?.innerText,
            desc: kartuEOpr?.querySelector('p')?.innerText,
            buttonText: kartuEOpr?.querySelector('a')?.innerText,
            badge: kartuEOpr?.querySelector('span.uppercase')?.innerText
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Production e-Operasional Card Check:', JSON.stringify(res.result?.value, null, 2));

    await new Promise(r => setTimeout(r, 1000));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_index_e_operasional_card.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to live_prod_index_e_operasional_card.png!');

    // Capture Mobile view of index.html modal
    console.log('Capturing mobile view of production modal...');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 1000));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_index_modal_mobile.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('Saved screenshot to live_prod_index_modal_mobile.png!');

    ws.close();
  } finally {
    chrome.kill();
  }
}

captureModalProduction().catch(console.error);
