import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9298;
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

    const fileUrl = 'file://' + path.join(ROOT_DIR, 'portal-tracking.html').replace(/\\/g, '/');
    console.log('2. Navigating to:', fileUrl);
    await send('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 2000));

    // A. Screenshot 1: Task Board Pusat (Nationwide Full Access)
    console.log('3. Capturing Task Board Pusat...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_taskboard_pusat.png'), Buffer.from(shot1.result.data, 'base64'));
    console.log('✓ bukti_tracking_taskboard_pusat.png saved');

    // B. Switch to Cabang Bandung (Ardi Nurmayadi)
    console.log('4. Switching to Cabang Bandung preset...');
    await send('Runtime.evaluate', {
      expression: `
        loginPreset('NSR-BDG-2020-39', '123456');
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Screenshot 2: Branch Isolation Active (Bandung Locked)
    console.log('5. Capturing Branch Isolation (Bandung)...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_branch_isolation_bandung.png'), Buffer.from(shot2.result.data, 'base64'));
    console.log('✓ bukti_tracking_branch_isolation_bandung.png saved');

    // C. Open Milestone Update Modal with NIK + PIN Verification
    console.log('6. Opening Milestone Update Modal...');
    await send('Runtime.evaluate', {
      expression: `
        bukaModalUpdateMilestone('JO-BDG-2026-0015');
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 3: Interactive Milestone Update Modal
    console.log('7. Capturing Update Milestone Modal with NIK + PIN...');
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_modal_update_milestone.png'), Buffer.from(shot3.result.data, 'base64'));
    console.log('✓ bukti_tracking_modal_update_milestone.png saved');

    // Close Update Modal
    await send('Runtime.evaluate', { expression: `tutupModalUpdateMilestone();` });
    await new Promise(r => setTimeout(r, 500));

    // D. Switch to Register Tab and open Tarik Data JO Modal
    console.log('8. Opening Form Registrasi & Modal Tarik Data JO...');
    await send('Runtime.evaluate', {
      expression: `
        switchTab('register');
        bukaModalPilihJO();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 4: Tarik Data JO Modal
    console.log('9. Capturing Tarik Data JO Modal...');
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_modal_tarik_data_jo.png'), Buffer.from(shot4.result.data, 'base64'));
    console.log('✓ bukti_tracking_modal_tarik_data_jo.png saved');

    // E. Populate Form from JO
    console.log('10. Populating Form from JO and inspecting dropdowns...');
    await send('Runtime.evaluate', {
      expression: `
        isiFormulirDariJO(0);
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 5: Form Registrasi with Editable Fields, Branch Reviewer & 5 Penilai Publik
    console.log('11. Capturing Auto-Populated Form Registrasi...');
    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_form_autopopulated.png'), Buffer.from(shot5.result.data, 'base64'));
    console.log('✓ bukti_tracking_form_autopopulated.png saved');

    // F. Open 7 Milestone Stepper Modal
    console.log('12. Opening 7 Milestone Stepper Modal...');
    await send('Runtime.evaluate', {
      expression: `
        switchTab('board');
        bukaModalTracking('JO-BDG-2026-0015');
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 6: 7 Milestone Stepper
    console.log('13. Capturing 7 Milestone Stepper Modal...');
    const shot6 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_tracking_stepper_modal_bandung.png'), Buffer.from(shot6.result.data, 'base64'));
    console.log('✓ bukti_tracking_stepper_modal_bandung.png saved');

    ws.close();
  } finally {
    chrome.kill();
    console.log('Chrome process terminated.');
  }

  console.log('\nAll 6 verification screenshots captured and stored in artifact directory!');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
