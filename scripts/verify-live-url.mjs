import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const TARGET_URL = 'https://script.google.com/macros/s/AKfycby_-_pmZdNWdGCzYMeTa0-d8nPXzOaKpIfBSG9s2Bhs_9KIsNzqhQ77Hk60lKv47gyR/exec';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  console.log('1. Membuka Chrome headless untuk verifikasi live URL...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9260',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9260/json/new?about:blank', { method: 'PUT' });
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

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('2. Mengatur viewport mobile (390 x 844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('3. Navigasi ke URL live Web App:', TARGET_URL);
    await send('Page.navigate', { url: TARGET_URL });
    await new Promise(r => setTimeout(r, 6000)); // Tunggu GAS compile dan render

    // Ambil info halaman
    const pageInfo = await send('Runtime.evaluate', {
      expression: `(() => ({
        url: window.location.href,
        title: document.title,
        bodyText: document.body ? document.body.innerText.substring(0, 300) : '',
        hasAuth: Boolean(document.getElementById('auth-nik-input')),
        hasClock: Boolean(document.getElementById('live-clock'))
      }))()`,
      returnByValue: true
    });

    console.log('Hasil Render Halaman:', pageInfo.result.value);

    // Tangkap screenshot live
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotBuf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, 'live_staging_webapp_mobile.png');
    fs.writeFileSync(outPath, shotBuf);
    console.log('✓ Screenshot live staging tersimpan di:', outPath, '(' + (shotBuf.length / 1024).toFixed(1) + ' KB)');

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
