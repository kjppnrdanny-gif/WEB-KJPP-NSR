import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function captureJobTrackingPreviews() {
  const SERVER_PORT = 8098;
  const DEBUG_PORT = 9279;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting local PHP web server on port', SERVER_PORT);
  const phpExtDir = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
  const phpServer = spawn('php', [
    '-d', `extension_dir=${phpExtDir}`,
    '-d', 'extension=curl',
    '-d', 'extension=openssl',
    '-S', `127.0.0.1:${SERVER_PORT}`
  ]);

  await new Promise(r => setTimeout(r, 1200));

  console.log('2. Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,1100',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

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

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    // -------------------------------------------------------------
    // SHOT 1: preview_tracking_hero_widget.png
    // -------------------------------------------------------------
    console.log('3. Navigating to index.html for Hero Search Widget preview...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Dismiss any privacy/cookie banners
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('cookie-banner')?.remove();
        document.getElementById('privacy-consent-modal')?.remove();
        document.getElementById('pdp-banner-container')?.remove();
        const widget = document.getElementById('lacak-penugasan');
        if (widget) {
          widget.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('4. Capturing preview_tracking_hero_widget.png...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const file1 = path.join(ARTIFACT_DIR, 'preview_tracking_hero_widget.png');
    fs.writeFileSync(file1, Buffer.from(shot1.data, 'base64'));
    console.log('✓ Saved:', file1);

    // -------------------------------------------------------------
    // SHOT 2: preview_tracking_stepper_modal.png
    // -------------------------------------------------------------
    console.log('5. Triggering search for Bank BTN (JO-JKT-2026-0001) to open Stepper Modal...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof eksekusiLacakPenugasanPublik === 'function') {
          eksekusiLacakPenugasanPublik();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('6. Capturing preview_tracking_stepper_modal.png...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const file2 = path.join(ARTIFACT_DIR, 'preview_tracking_stepper_modal.png');
    fs.writeFileSync(file2, Buffer.from(shot2.data, 'base64'));
    console.log('✓ Saved:', file2);

    // -------------------------------------------------------------
    // SHOT 3: preview_portal_tracking_internal.png
    // -------------------------------------------------------------
    console.log('7. Navigating to portal-tracking.html for Internal Task Board & Registration...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/portal-tracking.html` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('8. Capturing preview_portal_tracking_internal.png...');
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const file3 = path.join(ARTIFACT_DIR, 'preview_portal_tracking_internal.png');
    fs.writeFileSync(file3, Buffer.from(shot3.data, 'base64'));
    console.log('✓ Saved:', file3);

    console.log('🎉 ALL 3 JOB TRACKING PREVIEW SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    try { chrome.kill(); } catch (_) {}
    try { phpServer.kill(); } catch (_) {}
  }
}

captureJobTrackingPreviews().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
