import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CDP_PORT = 9499;
const LIVE_URL = 'https://kjppnanangrahayu.com/?_cb=' + Date.now();

async function waitForChrome(port, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return true;
    } catch (_) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  throw new Error(`Chrome failed to open debug port ${port}`);
}

async function captureProduction() {
  console.log('Meluncurkan Chrome headless untuk capture live production...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await waitForChrome(CDP_PORT);
    const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
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

    const viewports = [
      { name: 'laptop_1366', label: 'Laptop Standar (1366x768)', width: 1366, height: 768, mobile: false, filename: 'bukti_live_laptop_1366_precision.png' },
      { name: 'desktop_1920', label: 'Desktop PC (1920x1080)', width: 1920, height: 1080, mobile: false, filename: 'bukti_live_desktop_1920_precision.png' },
      { name: 'mobile_390', label: 'Mobile Smartphone (390x844)', width: 390, height: 844, mobile: true, filename: 'bukti_live_mobile_390_precision.png' }
    ];

    for (const vp of viewports) {
      console.log(`\nNavigasi & Capture Live Production: ${vp.label}...`);
      await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile });
      await send('Page.navigate', { url: LIVE_URL });
      await new Promise(r => setTimeout(r, 4000));

      // Scroll to diagram section
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            const el = document.querySelector('#sop') || document.querySelector('.lg\\:col-span-7');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1500));

      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const targetFile = path.join(ARTIFACT_DIR, vp.filename);
      fs.writeFileSync(targetFile, Buffer.from(ss.data, 'base64'));
      console.log(`  ✔ Disimpan: ${targetFile}`);
    }

    ws.close();
    chrome.kill();
    console.log('\n🎉 Seluruh tangkapan layar live server produksi berhasil diambil!');
    process.exit(0);

  } catch (err) {
    console.error('Error saat capture live production:', err);
    chrome.kill();
    process.exit(1);
  }
}

captureProduction();
