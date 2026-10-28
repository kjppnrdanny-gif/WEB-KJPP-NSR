import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';

async function captureTrackingV2() {
  const SERVER_PORT = 8099;
  const DEBUG_PORT = 9288;
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
    // SHOT 1: Task Board - Akses Penuh Nasional (Danny Taufik Hidayat)
    // -------------------------------------------------------------
    console.log('3. Navigating to portal-tracking.html (Akses Penuh Nasional)...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/portal-tracking.html` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('4. Capturing bukti_live_task_board_akses_nasional.png...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const file1 = path.join(ARTIFACT_DIR, 'bukti_live_task_board_akses_nasional.png');
    fs.writeFileSync(file1, Buffer.from(shot1.data, 'base64'));
    console.log('✓ Saved:', file1);

    // -------------------------------------------------------------
    // SHOT 2: Task Board - Isolasi Cabang Bandung (Ardi Nurmayadi)
    // -------------------------------------------------------------
    console.log('5. Switching to Bandung staff profile (Ardi Nurmayadi)...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof quickSwitchUser === 'function') {
          quickSwitchUser('NSR-BDG-2020-39', '123456');
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log('6. Capturing bukti_live_task_board_isolasi_bandung.png...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const file2 = path.join(ARTIFACT_DIR, 'bukti_live_task_board_isolasi_bandung.png');
    fs.writeFileSync(file2, Buffer.from(shot2.data, 'base64'));
    console.log('✓ Saved:', file2);

    // -------------------------------------------------------------
    // SHOT 3: Modal Update Milestone (NIK + PIN - Opsi B)
    // -------------------------------------------------------------
    console.log('7. Opening Modal Update Milestone (NIK + PIN)...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof bukaModalUpdateMilestone === 'function') {
          bukaModalUpdateMilestone('JO-BDG-2026-0015');
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('8. Capturing bukti_live_modal_update_milestone_nik_pin.png...');
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const file3 = path.join(ARTIFACT_DIR, 'bukti_live_modal_update_milestone_nik_pin.png');
    fs.writeFileSync(file3, Buffer.from(shot3.data, 'base64'));
    console.log('✓ Saved:', file3);

    // Close update modal
    await send('Runtime.evaluate', {
      expression: `if (typeof tutupModalUpdateMilestone === 'function') tutupModalUpdateMilestone();`
    });
    await new Promise(r => setTimeout(r, 500));

    // -------------------------------------------------------------
    // SHOT 4: Tab Registrasi JO - Tarik Data Otomatis & Kolom Bebas
    // -------------------------------------------------------------
    console.log('9. Switching to Tab Registrasi JO with Tarik Data...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof switchTab === 'function') {
          switchTab('register');
          setTimeout(() => {
            const selectEl = document.getElementById('select-tarik-jo');
            if (selectEl && selectEl.options.length > 1) {
              selectEl.selectedIndex = 1;
              terapkanTarikDataJO(selectEl.value);
            }
          }, 300);
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log('10. Capturing bukti_live_tarik_data_registrasi_jo.png...');
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    const file4 = path.join(ARTIFACT_DIR, 'bukti_live_tarik_data_registrasi_jo.png');
    fs.writeFileSync(file4, Buffer.from(shot4.data, 'base64'));
    console.log('✓ Saved:', file4);

    // -------------------------------------------------------------
    // SHOT 5: Modal Stepper 7 Milestone + Audit Trail LOG_PROGRESS
    // -------------------------------------------------------------
    console.log('11. Opening 7-Milestone Stepper Modal with LOG_PROGRESS audit trail...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof switchTab === 'function') switchTab('board');
        setTimeout(() => {
          if (typeof bukaModalTracking === 'function') {
            bukaModalTracking('JO-BDG-2026-0015');
          }
        }, 300);
      `
    });
    await new Promise(r => setTimeout(r, 1800));

    console.log('12. Capturing bukti_live_modal_stepper_dan_log_progress.png...');
    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    const file5 = path.join(ARTIFACT_DIR, 'bukti_live_modal_stepper_dan_log_progress.png');
    fs.writeFileSync(file5, Buffer.from(shot5.data, 'base64'));
    console.log('✓ Saved:', file5);

    console.log('🎉 ALL 5 LIVE PROOF SCREENSHOTS CAPTURED AND PERSISTED SUCCESSFULLY!');
  } finally {
    try { chrome.kill(); } catch (_) {}
    try { phpServer.kill(); } catch (_) {}
  }
}

captureTrackingV2().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
