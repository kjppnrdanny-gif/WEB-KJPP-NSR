import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function testClear() {
  const DEBUG_PORT = 9256;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1400,1000',
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

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');

    console.log('Navigating with clean applicant token...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html?token=NSR-ADMIN-BDG-2026' });
    await new Promise(r => setTimeout(r, 3000));

    // Evaluate user and check F01-F07 isolation
    const evalResult = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const u = (typeof currentUser !== 'undefined' && currentUser) || (typeof sesiAktif !== 'undefined' && sesiAktif);
          const panelUmum = document.getElementById('spm-audit-panel-umum');
          const isUmumHidden = !panelUmum || window.getComputedStyle(panelUmum).display === 'none';
          const bodyHasClass = document.body.classList.contains('is-spm-auditor');
          return {
            role: u?.role,
            isCabang: u?.isCabang,
            bodyHasClass,
            isUmumHidden
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Clean Applicant Eval:', JSON.stringify(evalResult.result?.value));

    // Take screenshot of Tab 2
    await send('Runtime.evaluate', {
      expression: `if (typeof gantiTabModul === 'function') gantiTabModul('spm');`
    });
    await new Promise(r => setTimeout(r, 1000));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_spm_ui_isolated.png'), Buffer.from(ss.data, 'base64'));
    console.log('✔ Updated bukti_live_spm_ui_isolated.png');

    ws.close();
    chrome.kill();
  } catch (err) {
    chrome.kill();
    console.error('Error:', err);
  }
}

testClear();
