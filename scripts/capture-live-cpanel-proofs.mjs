// scripts/capture-live-cpanel-proofs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const LIVE_URL = 'https://kjppnanangrahayu.com/index.html';
const TRACKING_PORTAL_URL = 'https://kjppnanangrahayu.com/portal-tracking.html';

async function captureLiveProofs() {
  const DEBUG_PORT = 9295;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting headless Chrome on port', DEBUG_PORT);
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
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    console.log('2. Navigating to LIVE cPanel index.html:', LIVE_URL);
    await send('Page.navigate', { url: `${LIVE_URL}?nocache=${Date.now()}` });
    await new Promise(r => setTimeout(r, 4500));

    // Scroll to #lacak-penugasan
    console.log('3. Scrolling to #lacak-penugasan on live server...');
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('lacak-penugasan');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    // Capture Desktop Live Hero Widget (Bersih tanpa teks contoh)
    console.log('4. Capturing Desktop Live Clean Widget...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const path1 = path.join(ARTIFACT_DIR, 'bukti_live_cpanel_hero_tracking.png');
    fs.writeFileSync(path1, Buffer.from(shot1.data, 'base64'));
    console.log('   ✓ Saved:', path1);

    // Fill in Unique Tracking Code and Click submit button
    console.log('5. Inputting unique tracking code TRK-JKT-2026-A89F & clicking [Lacak Status]...');
    await send('Runtime.evaluate', {
      expression: `
        const inpJo = document.getElementById('track-jo-input');
        const inpPhone = document.getElementById('track-pic-input');
        if (inpJo) inpJo.value = 'TRK-JKT-2026-A89F';
        if (inpPhone) inpPhone.value = '081288997766';
        const btn = document.getElementById('btn-submit-lacak');
        if (btn) btn.click();
      `
    });
    await new Promise(r => setTimeout(r, 3000));

    // Capture Live Stepper Modal with TRK badge
    console.log('6. Capturing Live Stepper Modal (TRK-JKT-2026-A89F)...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const path2 = path.join(ARTIFACT_DIR, 'bukti_live_cpanel_stepper_modal.png');
    fs.writeFileSync(path2, Buffer.from(shot2.data, 'base64'));
    console.log('   ✓ Saved:', path2);

    // Mobile Viewport
    console.log('7. Switching to Mobile Viewport (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Runtime.evaluate', {
      expression: `
        if (typeof tutupModalLacakPenugasan === 'function') tutupModalLacakPenugasan();
        const inpJo = document.getElementById('track-jo-input');
        const inpPhone = document.getElementById('track-pic-input');
        if (inpJo) inpJo.value = '';
        if (inpPhone) inpPhone.value = '';
        const el = document.getElementById('lacak-penugasan');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    console.log('8. Capturing Mobile Live Widget...');
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const path3 = path.join(ARTIFACT_DIR, 'bukti_live_cpanel_mobile_widget.png');
    fs.writeFileSync(path3, Buffer.from(shot3.data, 'base64'));
    console.log('   ✓ Saved:', path3);

    // Reset Viewport to Desktop for Portal Tracking
    console.log('9. Switching back to Desktop Viewport (1440x950) for Task Board...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('10. Navigating to LIVE cPanel portal-tracking.html:', TRACKING_PORTAL_URL);
    await send('Page.navigate', { url: `${TRACKING_PORTAL_URL}?nocache=${Date.now()}` });
    await new Promise(r => setTimeout(r, 4500));

    console.log('11. Capturing Live Task Board Portal...');
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    const path4 = path.join(ARTIFACT_DIR, 'bukti_live_cpanel_portal_tracking.png');
    fs.writeFileSync(path4, Buffer.from(shot4.data, 'base64'));
    console.log('   ✓ Saved:', path4);

    console.log('\n========================================================');
    console.log('🎉 SEMUA 4 TANGKAPAN LAYAR BUKTI LIVE CPANEL BERHASIL DIAMBIL!');
    console.log('========================================================');

    await send('Page.close');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    try { chrome.kill(); } catch (_) {}
  }
}

captureLiveProofs();
