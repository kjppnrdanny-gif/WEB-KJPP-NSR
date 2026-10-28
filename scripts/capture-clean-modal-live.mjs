import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function captureModal() {
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
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });

    console.log('Navigating to live https://kjppnanangrahayu.com/index.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/index.html?t=' + Date.now() });
    await new Promise(r => setTimeout(r, 4000));

    // Open modal-portal with panel-auth active
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-portal');
          if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
          }
          const panelAuth = document.getElementById('panel-auth');
          if (panelAuth) panelAuth.classList.remove('hidden');
          const panelLayanan = document.getElementById('panel-layanan');
          if (panelLayanan) panelLayanan.classList.add('hidden');
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1500));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, 'bukti_live_modal_login_clean_sha256.png');
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log('✅ Berhasil menyimpan screenshot live ke:', outPath);

    ws.close();
  } finally {
    chrome.kill();
  }
}

captureModal().catch(console.error);
