import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';

async function testAndCaptureSmartInput() {
  const SERVER_PORT = 8097;
  const DEBUG_PORT = 9286;
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
    // TEST 1: TAMPILAN MODAL BERANDA DENGAN LABEL & PLACEHOLDER BARU
    // -------------------------------------------------------------
    console.log('3. Navigating to index.html...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('4. Opening #modal-portal on index.html...');
    await send('Runtime.evaluate', {
      expression: `
        sessionStorage.clear();
        localStorage.clear();
        if (typeof bukaModalPortal === 'function') {
          bukaModalPortal();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('5. Capturing bukti_live_smart_input_modal.png...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const file1 = path.join(ARTIFACT_DIR, 'bukti_live_smart_input_modal.png');
    fs.writeFileSync(file1, Buffer.from(shot1.data, 'base64'));
    console.log('✓ Saved:', file1);

    // -------------------------------------------------------------
    // TEST 2: PENOLAKAN NIK TIDAK TERDAFTAR (NSR-9999-999)
    // -------------------------------------------------------------
    console.log('6. Testing invalid NIK rejection (NSR-9999-999)...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('input-token').value = 'NSR-9999-999';
        verifikasiTokenPortal();
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    console.log('7. Capturing bukti_live_smart_input_nik_error.png...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const file2 = path.join(ARTIFACT_DIR, 'bukti_live_smart_input_nik_error.png');
    fs.writeFileSync(file2, Buffer.from(shot2.data, 'base64'));
    console.log('✓ Saved:', file2);

    // -------------------------------------------------------------
    // TEST 3: NIK VALID (NSR-2019-005) -> AUTO-REDIRECT KE PRESENSI
    // -------------------------------------------------------------
    console.log('8. Testing valid NIK (NSR-2019-005) auto-redirect...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('input-token').value = 'NSR-2019-005';
        verifikasiTokenPortal();
      `
    });
    // Tunggu redirect ke portal-presensi.html
    await new Promise(r => setTimeout(r, 3000));

    console.log('9. Checking presence portal URL and locked status...');
    const evalPresensi = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          url: window.location.href,
          authNik: sessionStorage.getItem('auth_nik'),
          inputVal: document.getElementById('auth-nik-input')?.value,
          isReadonly: document.getElementById('auth-nik-input')?.hasAttribute('readonly'),
          activeElementId: document.activeElement ? document.activeElement.id : null
        })
      `
    });
    console.log('Presensi Portal State:', evalPresensi.result.value);

    console.log('10. Capturing bukti_live_smart_input_nik_redirect.png...');
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const file3 = path.join(ARTIFACT_DIR, 'bukti_live_smart_input_nik_redirect.png');
    fs.writeFileSync(file3, Buffer.from(shot3.data, 'base64'));
    console.log('✓ Saved:', file3);

    console.log('🎉 ALL SMART SINGLE INPUT TESTS AND SCREENSHOTS COMPLETED SUCCESSFULLY!');
  } finally {
    try { chrome.kill(); } catch (_) {}
    try { phpServer.kill(); } catch (_) {}
  }
}

testAndCaptureSmartInput().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
