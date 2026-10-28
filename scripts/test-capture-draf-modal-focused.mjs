import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function testCaptureDrafModal() {
  const SERVER_PORT = 8092;
  const DEBUG_PORT = 9265;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const phpExtDir = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
  const phpServer = spawn('php', [
    '-d', `extension_dir=${phpExtDir}`,
    '-d', 'extension=curl',
    '-d', 'extension=openssl',
    '-S', `127.0.0.1:${SERVER_PORT}`
  ]);

  await new Promise(r => setTimeout(r, 1200));

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

    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/portal-surat-umum.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Login with NSR8899
    await send('Runtime.evaluate', {
      expression: `
        (async function() {
          const tokenInput = document.getElementById('input_token_auth');
          tokenInput.value = 'NSR8899';
          await handleLoginSubmit({ preventDefault: () => {} });
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    // Open Success Modal directly to capture it clearly
    console.log('Opening and capturing modal-sukses-terbit...');
    await send('Runtime.evaluate', {
      expression: `
        bukaModalSuksesTerbit({
          No_Surat: '0016/NSR/SU-MEM/X/2026',
          Klasifikasi_Perihal: 'SU-MEM : Memo Internal & Nota Dinas',
          Tujuan_Penerima: 'Seluruh Tim Penilai, Cabang, & Karyawan KJPP NSR',
          Perihal: 'Arahan Penegakan Standar Pengendalian Mutu (SPM) dan Tata Kelola Digital 2026',
          Penandatangan: 'Pemimpin Rekan'
        });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const ssSukses = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_sukses_terbit_memo_internal.png'), Buffer.from(ssSukses.data, 'base64'));
    console.log('✓ Captured modal-sukses-terbit');

    // Open Draf Modal directly via bukaModalDrafSurat
    console.log('Opening and capturing modal-draf-surat...');
    await send('Runtime.evaluate', {
      expression: `
        tutupModalSuksesTerbit();
        bukaModalDrafSurat({
          No_Surat: '0016/NSR/SU-MEM/X/2026',
          Klasifikasi_Perihal: 'SU-MEM',
          Tujuan_Penerima: 'Seluruh Tim Penilai, Cabang, & Karyawan KJPP NSR',
          Perihal: 'Arahan Penegakan Standar Pengendalian Mutu (SPM) dan Tata Kelola Digital 2026',
          Tanggal_Surat: '2026-10-27',
          Penandatangan: 'Pemimpin Rekan'
        });
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Desktop View
    const ssDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_draf_surat_kop_resmi_desktop.png'), Buffer.from(ssDesktop.data, 'base64'));
    console.log('✓ Captured desktop modal-draf-surat');

    // Capture Mobile View
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const ssMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_draf_surat_kop_resmi_mobile.png'), Buffer.from(ssMobile.data, 'base64'));
    console.log('✓ Captured mobile modal-draf-surat');

    console.log('🎉 FOCUSED SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error in focused capture:', err);
  } finally {
    try { chrome.kill(); } catch (_) {}
    try { phpServer.kill(); } catch (_) {}
  }
}

testCaptureDrafModal();
