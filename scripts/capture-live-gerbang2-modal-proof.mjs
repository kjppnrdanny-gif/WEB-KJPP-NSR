import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function capture() {
  const DEBUG_PORT = 9265;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Launching Chrome CDP for Modal Gerbang 2...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1500,1150',
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
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const msgId = id++;
        callbacks.set(msgId, { res, rej });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('Navigating to portal-nolap...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html?v=' + Date.now() });
    await new Promise(r => setTimeout(r, 3500));

    // Clear session & login King
    await send('Runtime.evaluate', {
      expression: `
        localStorage.clear();
        sessionStorage.clear();
      `
    });
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html?v=' + Date.now() });
    await new Promise(r => setTimeout(r, 3500));

    console.log('Logging in with King token...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('input-token-nolap').value = 'NSR8899';
        document.getElementById('btn-buka-nolap').click();
      `
    });
    await new Promise(r => setTimeout(r, 3500));

    // Fill some demo data in Step 1 to test auto-populate into Modal Gerbang 2
    console.log('Populating demo links in Step 1...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('input_link_laporan').value = 'https://drive.google.com/file/d/1A2B3C4D_Laporan_Final/view';
        document.getElementById('input_link_pembanding').value = 'https://drive.google.com/file/d/2E3F4G5H_Data_Pasar/view';
        document.getElementById('input_link_bai').value = 'https://drive.google.com/file/d/3I4J5K6L_BAI_Foto/view';
        document.getElementById('f-luas-tanah').value = '1250';
        document.getElementById('f-luas-bangunan').value = '450';
      `
    });

    console.log('Triggering bukaModalSubmitGerbang2()...');
    await send('Runtime.evaluate', {
      expression: `
        bukaModalSubmitGerbang2('NSR-2026-BDG-0012');
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Capturing screenshot of wide & balanced Gerbang 2 modal...');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, 'bukti_live_modal_gerbang2_revisi.png');
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log('✓ Successfully saved:', outPath);

    ws.close();
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    chrome.kill();
    console.log('Finished CDP capture.');
  }
}

capture();
