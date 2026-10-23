import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function capture() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9455',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9455/json/new?about:blank', { method: 'PUT' });
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

    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      handlers.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 1. Capture Portal NoLap Live
    console.log('Navigating to portal-nolap.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html?_t=' + Date.now() });
    await new Promise(r => setTimeout(r, 4000));

    // Scroll to Form Section
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('f-industri');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const snap1 = await send('Page.captureScreenshot', { format: 'png' });
    const path1 = path.join(ARTIFACT_DIR, 'bukti_live_p0_portal_nolap_industri.png');
    fs.writeFileSync(path1, Buffer.from(snap1.data, 'base64'));
    console.log('Saved:', path1);

    // 2. Capture Portal JO Live Tab 3
    console.log('Navigating to portal-penugasan-jo.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-penugasan-jo.html?_t=' + Date.now() });
    await new Promise(r => setTimeout(r, 4000));

    // Switch to Tab 3
    await send('Runtime.evaluate', {
      expression: `
        const btnTab3 = document.querySelector('[data-tab="preview"]') || document.getElementById('tab-btn-preview') || document.querySelector('button[onclick*="preview"]');
        if (btnTab3) btnTab3.click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const snap2 = await send('Page.captureScreenshot', { format: 'png' });
    const path2 = path.join(ARTIFACT_DIR, 'bukti_live_p0_portal_jo_clean.png');
    fs.writeFileSync(path2, Buffer.from(snap2.data, 'base64'));
    console.log('Saved:', path2);

    ws.close();
  } finally {
    chrome.kill();
  }
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
