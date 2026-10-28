import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function captureMobileViews() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-mobile-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9522',
    '--no-sandbox',
    `--user-data-dir=${tmpProfile}`,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 1: index.html at 375px (iPhone standard)
    const targetUrlIndex = 'file:///d:/WEB%20KJPP%20NSR_Compro%20new%20ver/kjpp-nsr-netlify-production/index.html';
    const targetRes = await fetch('http://127.0.0.1:9522/json/new?' + encodeURIComponent(targetUrlIndex), { method: 'PUT' });
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
    await send('DOM.enable');

    // 375x812 (iPhone standard)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 2000));

    // Evaluate button text
    const btnCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[onclick="bukaModalPortal()"]');
          return {
            text: btn?.innerText?.trim(),
            rect: btn?.getBoundingClientRect(),
            parentRect: btn?.parentElement?.getBoundingClientRect()
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Mobile index button check:', btnCheck?.result?.value);

    // Capture screenshot of mobile header
    const shotIndex = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 375, height: 350, scale: 2 }
    });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_navbar_index_opini_nsr.png'), Buffer.from(shotIndex.data, 'base64'));
    console.log('Saved mobile_navbar_index_opini_nsr.png');

    // Test 2: portofolio-rekanan.html at 375px
    const targetUrlPorto = 'file:///d:/WEB%20KJPP%20NSR_Compro%20new%20ver/kjpp-nsr-netlify-production/portofolio-rekanan.html';
    await send('Page.navigate', { url: targetUrlPorto });
    await new Promise(r => setTimeout(r, 2000));

    const shotPorto = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 375, height: 350, scale: 2 }
    });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_navbar_portofolio_opini_nsr.png'), Buffer.from(shotPorto.data, 'base64'));
    console.log('Saved mobile_navbar_portofolio_opini_nsr.png');

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch (e) {}
  }
}

captureMobileViews();
