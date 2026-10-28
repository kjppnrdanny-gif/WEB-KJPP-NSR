import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';

async function captureAuthCorrectionProofs() {
  const SERVER_PORT = 8098;
  const DEBUG_PORT = 9287;
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
    // SHOT 1: Modal Portal Beranda (index.html) - CUKUP 1 INPUT TOKEN
    // -------------------------------------------------------------
    console.log('3. Navigating to index.html...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('4. Opening #modal-portal on index.html...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof bukaModalPortal === 'function') {
          bukaModalPortal();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('5. Capturing bukti_live_modal_token_beranda_bersih.png...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const file1 = path.join(ARTIFACT_DIR, 'bukti_live_modal_token_beranda_bersih.png');
    fs.writeFileSync(file1, Buffer.from(shot1.data, 'base64'));
    console.log('✓ Saved:', file1);

    // -------------------------------------------------------------
    // SHOT 2: Task Board - Isolasi Cabang Makassar via Token/Branch
    // -------------------------------------------------------------
    console.log('6. Navigating to portal-tracking.html?branch=MKS (Isolasi Makassar)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/portal-tracking.html?branch=MKS` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('7. Capturing bukti_live_task_board_isolasi_makassar.png...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const file2 = path.join(ARTIFACT_DIR, 'bukti_live_task_board_isolasi_makassar.png');
    fs.writeFileSync(file2, Buffer.from(shot2.data, 'base64'));
    console.log('✓ Saved:', file2);

    // -------------------------------------------------------------
    // SHOT 3: Modal Otoritas Pembaruan Milestone (NIK + PIN - OPSI B)
    // -------------------------------------------------------------
    console.log('8. Opening Modal Update Milestone on portal-tracking.html...');
    await send('Runtime.evaluate', {
      expression: `
        const firstBtn = document.querySelector("button[onclick*='bukaModalUpdateMilestone']");
        if (firstBtn) {
          firstBtn.click();
        } else if (globalJobs && globalJobs.length > 0) {
          bukaModalUpdateMilestone(globalJobs[0].id);
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('9. Capturing bukti_live_modal_update_milestone_nik_pin.png...');
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const file3 = path.join(ARTIFACT_DIR, 'bukti_live_modal_update_milestone_nik_pin.png');
    fs.writeFileSync(file3, Buffer.from(shot3.data, 'base64'));
    console.log('✓ Saved:', file3);

    // -------------------------------------------------------------
    // SHOT 4: Portal Presensi Mandiri (portal-presensi.html)
    // -------------------------------------------------------------
    console.log('10. Navigating to portal-presensi.html (Akses Mandiri NIK+PIN)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/portal-presensi.html` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('11. Capturing bukti_live_presensi_mandiri.png...');
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    const file4 = path.join(ARTIFACT_DIR, 'bukti_live_presensi_mandiri.png');
    fs.writeFileSync(file4, Buffer.from(shot4.data, 'base64'));
    console.log('✓ Saved:', file4);

    console.log('🎉 ALL LIVE PROOF SCREENSHOTS CAPTURED AND PERSISTED SUCCESSFULLY!');
  } finally {
    try { chrome.kill(); } catch (_) {}
    try { phpServer.kill(); } catch (_) {}
  }
}

captureAuthCorrectionProofs().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
