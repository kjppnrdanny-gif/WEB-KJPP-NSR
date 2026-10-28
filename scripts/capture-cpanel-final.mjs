import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9322;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,900',
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

    // 1. Live Index Hero Lacak Widget
    console.log('2. Navigating to live index.html...');
    await send('Page.navigate', { url: `https://kjppnanangrahayu.com/index.html?cb=${cacheBuster}` });
    await new Promise(r => setTimeout(r, 3500));

    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('lacak-penugasan');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_hero_tracking.png'), Buffer.from(shot1.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_hero_tracking.png saved');

    // 2. Live OPINI Token Modal
    console.log('3. Opening live OPINI token modal...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof bukaModalPortal === 'function') bukaModalPortal();
        else document.getElementById('modal-portal-token')?.classList.remove('hidden');
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_opini_token.png'), Buffer.from(shot2.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_opini_token.png saved');

    // 3. Live Portal Tracking Board
    console.log('4. Navigating to live portal-tracking.html...');
    await send('Page.navigate', { url: `https://kjppnanangrahayu.com/portal-tracking.html?cb=${cacheBuster}` });
    await new Promise(r => setTimeout(r, 3500));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_portal_tracking.png'), Buffer.from(shot3.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_portal_tracking.png saved');

    ws.close();
    chrome.kill();
    console.log('All live cPanel screenshots captured successfully!');
  } catch (err) {
    console.error('Capture error:', err);
    chrome.kill();
  }
}

main();
