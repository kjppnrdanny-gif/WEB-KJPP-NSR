import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9412;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1366,950',
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

    const cb = Date.now();

    // 1. CAPTURE TASK BOARD WITH DYNAMIC PARTNER FILTER TOOLBAR
    console.log('1. Navigating to live portal-tracking.html (Task Board with Dynamic Partner Filter)...');
    await send('Page.navigate', {
      url: `https://kjppnanangrahayu.com/portal-tracking.html?cb=${cb}`
    });
    await new Promise(r => setTimeout(r, 4000));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_hubspoke_toolbar.png'), Buffer.from(shot1.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_hubspoke_toolbar.png saved');

    // 2. CAPTURE WITH SPECIFIC PARTNER FILTER SELECTED
    console.log('2. Selecting first partner tab...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const counts = extractUniquePartners();
        const partners = Object.keys(counts).filter(k => k !== 'ALL');
        if (partners.length > 0) {
          handlePartnerSelect(partners[0]);
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_hubspoke_partner_selected.png'), Buffer.from(shot2.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_hubspoke_partner_selected.png saved');

    // 3. CAPTURE MODAL STEPPER WITH CONTEXTUAL ACTION BAR (OPINI CROSS-PORTAL ACTIONS)
    console.log('3. Opening Modal Stepper to inspect Contextual Action Bar...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        handlePartnerSelect('ALL');
        bukaModalTracking('JO-JKT-2026-0001');
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll down inside the modal body so the Contextual Action Bar is in view
    await send('Runtime.evaluate', {
      expression: `(() => {
        const modalBody = document.querySelector('#modal-tracking-stepper .overflow-y-auto');
        if (modalBody) {
          modalBody.scrollTop = modalBody.scrollHeight;
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_hubspoke_modal_actions.png'), Buffer.from(shot3.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_hubspoke_modal_actions.png saved');

    ws.close();
    chrome.kill();
    console.log('🎉 ALL LIVE HUBSPOKE PROOF SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('CDP Error:', err);
    chrome.kill();
  }
}

main().catch(console.error);
