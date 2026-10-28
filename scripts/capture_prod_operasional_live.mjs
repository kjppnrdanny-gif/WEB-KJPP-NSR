import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9480',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9480/json/new?about:blank', { method: 'PUT' });
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
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-operasional.html' });
    await new Promise(r => setTimeout(r, 3000));

    // Authenticate with Pusat token
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.setItem('kjpp_token_auth', 'NSR-STAGE-MASTER-77');
          if (typeof periksaSesiLogin === 'function') periksaSesiLogin();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_portal_operasional_desktop.png'), Buffer.from(shotDesktop.data, 'base64'));
    console.log('Saved live_prod_portal_operasional_desktop.png');

    // Mobile view
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 1000));
    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_portal_operasional_mobile.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('Saved live_prod_portal_operasional_mobile.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
