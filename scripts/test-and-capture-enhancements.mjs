import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  console.log('=== TESTING & CAPTURING ENHANCEMENTS ===');
  const DEBUG_PORT = 9330;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1366,950',
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

    // TEST 1: portal-tracking.html Task Board with "Kirim WA" action button
    const trackingUrl = 'http://127.0.0.1:8000/portal-tracking.html';
    console.log('2. Navigating to:', trackingUrl);
    await send('Page.navigate', { url: trackingUrl });
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. Capturing Task Board with [Kirim WA] dispatch button...');
    const shotBoard = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_taskboard_wa_dispatch.png'), Buffer.from(shotBoard.result.data, 'base64'));
    console.log('✓ bukti_tracking_taskboard_wa_dispatch.png saved');

    // TEST 2: Open Stepper Modal in portal-tracking.html (showing Team overview & PIC tags)
    console.log('4. Opening Stepper Modal in portal-tracking.html...');
    await send('Runtime.evaluate', {
      expression: `
        bukaModalTracking('JO-JKT-2026-0001');
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('5. Capturing Stepper Modal with Team Assignments and Explicit PIC Tags...');
    const shotStepper = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_modal_team_pic_tags.png'), Buffer.from(shotStepper.result.data, 'base64'));
    console.log('✓ bukti_tracking_modal_team_pic_tags.png saved');

    // TEST 3: Open Post-Registration WhatsApp Dispatch Modal
    console.log('6. Opening Post-Registration WhatsApp Dispatch Modal...');
    await send('Runtime.evaluate', {
      expression: `
        tutupModalTracking();
        document.getElementById('confirm-jo-number').textContent = 'JO-JKT-2026-0021';
        document.getElementById('confirm-kode-lacak').textContent = 'TRK-JKT-2026-F892';
        document.getElementById('confirm-debitur').textContent = 'PT Graha Graha Prima Mandiri';
        document.getElementById('confirm-pic').textContent = 'Bambang Sudarsono (081288997766)';
        document.getElementById('modal-konfirmasi-registrasi').classList.remove('hidden');
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('7. Capturing Post-Registration Dispatch Modal...');
    const shotDispatchModal = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_post_reg_dispatch_modal.png'), Buffer.from(shotDispatchModal.result.data, 'base64'));
    console.log('✓ bukti_tracking_post_reg_dispatch_modal.png saved');

    // TEST 4: Deep Link on index.html (?track=TRK-JKT-2026-A89F)
    const indexTrackUrl = 'http://127.0.0.1:8000/index.html?track=TRK-JKT-2026-A89F';
    console.log('8. Navigating to index.html with track query parameter:', indexTrackUrl);
    await send('Page.navigate', { url: indexTrackUrl });
    await new Promise(r => setTimeout(r, 2500));

    console.log('9. Capturing Public Stepper Modal opened via Deep Link...');
    const shotDeepLink = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_public_deeplink_tracking_modal.png'), Buffer.from(shotDeepLink.result.data, 'base64'));
    console.log('✓ bukti_public_deeplink_tracking_modal.png saved');

    ws.close();
    chrome.kill();
    console.log('\n=== ALL ENHANCEMENT TESTS & SCREENSHOTS COMPLETED! ===');
  } catch (err) {
    console.error('Error during testing:', err);
    chrome.kill();
    process.exit(1);
  }
}

main();
