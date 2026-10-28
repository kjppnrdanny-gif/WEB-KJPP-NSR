import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function capture() {
  const DEBUG_PORT = 9260;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Launching Chrome CDP...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1100',
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
      if (msg.method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: true });
        return;
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const msgId = id++;
        callbacks.set(msgId, { res, rej });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    // 1. Capture Sanitized Modal (no token)
    console.log('Navigating to portal-nolap without token...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html?v=' + Date.now() });
    await new Promise(r => setTimeout(r, 3500));

    // Clear any local storage that might have saved token
    await send('Runtime.evaluate', {
      expression: `
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3500));

    console.log('Capturing sanitized modal screenshot...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_sanitized_modal.png'), Buffer.from(shot1.data, 'base64'));
    console.log('✓ Saved bukti_live_sanitized_modal.png');

    // 2. Login King and capture header + step 1 grid
    console.log('Entering King token and capturing Step 1 form grid...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('input-token-nolap').value = 'NSR8899';
        document.getElementById('btn-buka-nolap').click();
      `
    });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll to form 3 link documents & catatan
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('f-catatan-pemohon');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_header_dan_grid_penugasan.png'), Buffer.from(shot2.data, 'base64'));
    console.log('✓ Saved bukti_live_header_dan_grid_penugasan.png');

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
    console.log('Finished CDP captures.');
  }
}

capture();
