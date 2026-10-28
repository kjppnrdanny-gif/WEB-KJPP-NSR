import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5b357e59-98db-42c8-a216-3b795e1f1b2d';
const PORT = 8899;

async function capture() {
  console.log('🚀 Menjalankan headless Chrome untuk capture tampilan portal produksi...');
  
  // Jalankan PHP server
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`], { stdio: 'inherit' });
  await new Promise(r => setTimeout(r, 1500));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-prod-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9526',
    '--no-sandbox',
    `--user-data-dir=${tmpProfile}`,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    
    // 1. Capture Portal Penugasan Section 08
    const targetUrl1 = `http://127.0.0.1:${PORT}/portal-penugasan-jo.html`;
    const tab1Res = await fetch('http://127.0.0.1:9526/json/new?' + encodeURIComponent(targetUrl1), { method: 'PUT' });
    const tab1Data = await tab1Res.json();
    const ws1 = new WebSocket(tab1Data.webSocketDebuggerUrl);
    await new Promise(r => ws1.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws1.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };

    function send1(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws1.send(JSON.stringify({ id, method, params }));
      });
    }

    await send1('Page.enable');
    await send1('DOM.enable');
    await send1('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 2000));

    // Scroll to section 08
    await send1('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('g1-kategori-badge');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot1 = await send1('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'prod_gerbang1_section08.png'), Buffer.from(shot1.data, 'base64'));
    console.log('✓ Saved prod_gerbang1_section08.png');

    // 2. Capture Portal NoLap - Panel SPM Gerbang 2
    const targetUrl2 = `http://127.0.0.1:${PORT}/portal-nolap.html`;
    const tab2Res = await fetch('http://127.0.0.1:9526/json/new?' + encodeURIComponent(targetUrl2), { method: 'PUT' });
    const tab2Data = await tab2Res.json();
    const ws2 = new WebSocket(tab2Data.webSocketDebuggerUrl);
    await new Promise(r => ws2.onopen = r);

    const handlers2 = new Map();
    ws2.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers2.has(m.id)) {
        const cb = handlers2.get(m.id);
        handlers2.delete(m.id);
        cb(m.result || m.error);
      }
    };

    function send2(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers2.set(id, resolve);
        ws2.send(JSON.stringify({ id, method, params }));
      });
    }

    await send2('Page.enable');
    await send2('DOM.enable');
    await send2('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 2000));

    // Switch to SPM tab
    await send2('Runtime.evaluate', {
      expression: `
        if (typeof gantiTabModul === 'function') gantiTabModul('spm');
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot2 = await send2('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'prod_gerbang2_spm_panel.png'), Buffer.from(shot2.data, 'base64'));
    console.log('✓ Saved prod_gerbang2_spm_panel.png');

    ws1.close();
    ws2.close();
  } finally {
    chrome.kill();
    php.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('Capture completed successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
