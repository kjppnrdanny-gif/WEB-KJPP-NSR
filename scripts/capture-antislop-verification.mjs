import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9305;
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

  await new Promise(r => setTimeout(r, 1600));

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

    // 1. Capture Modal Autentikasi Token OPINI on index.html
    const indexUrl = 'file://' + path.join(ROOT_DIR, 'index.html').replace(/\\/g, '/');
    console.log('2. Navigating to:', indexUrl);
    await send('Page.navigate', { url: indexUrl });
    await new Promise(r => setTimeout(r, 2000));

    // Open OPINI modal
    await send('Runtime.evaluate', {
      expression: `
        if (typeof bukaModalPortal === 'function') {
          bukaModalPortal();
        } else {
          document.getElementById('modal-portal-token').classList.remove('hidden');
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('3. Capturing Modal Autentikasi Token OPINI (Clean antislop)...');
    const shotOpini = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_antislop_modal_opini_token.png'), Buffer.from(shotOpini.result.data, 'base64'));
    console.log('✓ bukti_antislop_modal_opini_token.png saved');

    // 2. Capture portal-tracking.html (Task Board & Header)
    const trackingUrl = 'file://' + path.join(ROOT_DIR, 'portal-tracking.html').replace(/\\/g, '/');
    console.log('4. Navigating to:', trackingUrl);
    await send('Page.navigate', { url: trackingUrl });
    await new Promise(r => setTimeout(r, 2000));

    console.log('5. Capturing portal-tracking.html Task Board...');
    const shotBoard = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_antislop_portal_tracking_board.png'), Buffer.from(shotBoard.result.data, 'base64'));
    console.log('✓ bukti_antislop_portal_tracking_board.png saved');

    // 3. Open Modal Ganti Profil / Login Staf (clean without leaked presets)
    console.log('6. Opening Modal Login Staf...');
    await send('Runtime.evaluate', {
      expression: `
        bukaModalGantiPengguna();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('7. Capturing Modal Login Staf (Presets deleted)...');
    const shotLoginStaf = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_antislop_modal_login_staf.png'), Buffer.from(shotLoginStaf.result.data, 'base64'));
    console.log('✓ bukti_antislop_modal_login_staf.png saved');

    // Close Modal Login Staf & Open Update Milestone Modal
    await send('Runtime.evaluate', {
      expression: `
        tutupModalGantiPengguna();
        bukaModalUpdateMilestone('JO-JKT-2026-0001');
      `
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('8. Capturing Modal Update Milestone (Clean placeholder)...');
    const shotUpdateM = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_antislop_modal_update_milestone.png'), Buffer.from(shotUpdateM.result.data, 'base64'));
    console.log('✓ bukti_antislop_modal_update_milestone.png saved');

    ws.close();
    chrome.kill();
    console.log('All verification screenshots captured successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
    chrome.kill();
    process.exit(1);
  }
}

main();
