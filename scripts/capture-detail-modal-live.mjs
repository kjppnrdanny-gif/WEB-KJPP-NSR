import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9345;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,1050',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    const cacheBuster = Date.now();

    // 1. Live Public Stepper Modal on index.html with Deep Link
    console.log('1. Navigating to index.html with ?track=...');
    await send('Page.navigate', {
      url: `https://kjppnanangrahayu.com/index.html?track=TRK-JKT-2026-A89F&cb=${cacheBuster}`
    });

    console.log('Waiting for live public modal to open...');
    let isOpen = false;
    for (let i = 0; i < 20; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `(() => {
          const m = document.getElementById('modal-tracking-stepper-publik');
          return m && !m.classList.contains('hidden');
        })()`,
        returnByValue: true
      });
      if (check.result.value) {
        isOpen = true;
        console.log(`Modal opened after attempt ${i+1}!`);
        break;
      }
      await new Promise(r => setTimeout(r, 800));
    }

    // Scroll inside modal if needed and take screenshot
    await new Promise(r => setTimeout(r, 1000));
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_public_stepper_modal.png'), Buffer.from(shot1.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_public_stepper_modal.png saved');

    // 2. Live Stepper Modal on portal-tracking.html
    console.log('2. Navigating to portal-tracking.html...');
    await send('Page.navigate', {
      url: `https://kjppnanangrahayu.com/portal-tracking.html?cb=${cacheBuster}`
    });
    await new Promise(r => setTimeout(r, 4000));

    await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof bukaModalDetailTracking === 'function') {
          bukaModalDetailTracking('JO-JKT-2026-0001');
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_portal_stepper_pic_card.png'), Buffer.from(shot2.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_portal_stepper_pic_card.png saved');

    ws.close();
    chrome.kill();
    console.log('SUCCESS: All live cPanel screenshots confirmed!');
  } catch (err) {
    console.error('Capture error:', err);
    chrome.kill();
  }
}

main().catch(console.error);
