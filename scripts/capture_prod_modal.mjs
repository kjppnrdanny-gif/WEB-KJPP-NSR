import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function captureModalPortal() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9435',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9435/json/new?about:blank', { method: 'PUT' });
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });

    console.log('Navigating to https://kjppnanangrahayu.com/index.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/index.html' });
    await new Promise(r => setTimeout(r, 5000)); // Wait for full parse

    // Check elements
    const checkRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const kartuEOpr = document.getElementById('kartu-e-operasional');
          const modal = document.getElementById('modal-portal');
          
          // Open modal
          if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
          }

          // Unhide panel if hidden
          const panel = document.getElementById('panel-layanan');
          if (panel) panel.classList.remove('hidden');

          // Ensure kartuEOpr is displayed
          if (kartuEOpr) {
            kartuEOpr.style.display = '';
            kartuEOpr.scrollIntoView({ behavior: 'instant', block: 'center' });
          }

          return {
            hasModal: Boolean(modal),
            hasKartuEOpr: Boolean(kartuEOpr),
            title: kartuEOpr?.querySelector('h4')?.innerText,
            desc: kartuEOpr?.querySelector('p')?.innerText,
            badge: kartuEOpr?.querySelector('span.uppercase')?.innerText,
            buttonText: kartuEOpr?.querySelector('a')?.innerText
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Production e-Operasional Card Check:', JSON.stringify(checkRes.result?.value, null, 2));

    await new Promise(r => setTimeout(r, 1000));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_index_e_operasional_card.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to live_prod_index_e_operasional_card.png!');

    ws.close();
  } finally {
    chrome.kill();
  }
}

captureModalPortal().catch(console.error);
