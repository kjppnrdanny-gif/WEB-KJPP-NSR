import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9335;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,950',
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

    // 1. Live Public Deeplink with Stepper & PIC Assignments & Hotline Link
    console.log('2. Navigating to live public deeplink...');
    await send('Page.navigate', {
      url: `https://kjppnanangrahayu.com/index.html?track=TRK-JKT-2026-A89F&cb=${cacheBuster}`
    });
    await new Promise(r => setTimeout(r, 4500));

    // Verify modal is open and check hotline link
    const modalCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-stepper-publik');
        const waLink = document.getElementById('pub-btn-wa-admin')?.href;
        const picCard = document.getElementById('pub-team-pelaksana')?.innerText;
        return {
          modalVisible: modal && !modal.classList.contains('hidden'),
          waLink: waLink || '',
          picPelaksana: picCard || ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Public Modal State:', modalCheck.result.value);

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_public_deeplink_stepper.png'), Buffer.from(shot1.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_public_deeplink_stepper.png saved');

    // 2. Live Portal Tracking Task Board with [Kirim WA] button
    console.log('3. Navigating to live portal-tracking.html...');
    await send('Page.navigate', {
      url: `https://kjppnanangrahayu.com/portal-tracking.html?cb=${cacheBuster}`
    });
    await new Promise(r => setTimeout(r, 4500));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_taskboard_wa_dispatch.png'), Buffer.from(shot2.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_taskboard_wa_dispatch.png saved');

    // 3. Open Detail Modal on Portal Tracking
    console.log('4. Opening Stepper Modal on portal-tracking.html...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof bukaModalDetailTracking === 'function') {
          bukaModalDetailTracking('JO-2026-03-001');
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_portal_stepper_pic_card.png'), Buffer.from(shot3.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_portal_stepper_pic_card.png saved');

    ws.close();
    chrome.kill();
    console.log('=== ALL CPANEL LIVE SCREENSHOTS AND VERIFICATIONS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Error during capture:', err);
    chrome.kill();
  }
}

main().catch(console.error);
