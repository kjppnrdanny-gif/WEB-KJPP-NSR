import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9348;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,1050',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

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

    console.log('Navigating to live index...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/index.html' });
    await new Promise(r => setTimeout(r, 3500));

    console.log('Opening modal via bukaModalTrackingPublik...');
    await send('Runtime.evaluate', {
      expression: `(async () => {
        // Fetch real job from live API
        const res = await fetch('backend/job-tracking-handler.php?action=track&jo=TRK-JKT-2026-A89F');
        const json = await res.json();
        if (json.data && typeof bukaModalTrackingPublik === 'function') {
          bukaModalTrackingPublik(json.data);
        }
        window.scrollTo(0, 0);
      })()`,
      awaitPromise: true
    });

    await new Promise(r => setTimeout(r, 1200));

    // Capture screenshot of viewport
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_public_stepper_modal.png'), Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Successfully saved bukti_cpanel_live_public_stepper_modal.png');

    ws.close();
    chrome.kill();
  } catch (e) {
    console.error('Error:', e);
    chrome.kill();
  }
}

main().catch(console.error);
