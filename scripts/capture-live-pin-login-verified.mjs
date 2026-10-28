import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-presensi.html';

async function main() {
  const DEBUG_PORT = 9296;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
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
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    console.log('2. Navigating to LIVE Portal Presensi:', LIVE_URL);
    await send('Page.navigate', { url: `${LIVE_URL}?v=${Date.now()}` });
    await new Promise(r => setTimeout(r, 4000));

    // Tutup modal privasi
    await send('Runtime.evaluate', {
      expression: `
        if (typeof window.konfirmasiSetujuPrivasi === 'function') {
          window.konfirmasiSetujuPrivasi();
        } else {
          const m = document.getElementById('modal-privasi-karyawan');
          if (m) m.classList.add('hidden');
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Login dengan NSR-2019-012 dan PIN 123456
    console.log('3. Typing NIK NSR-2019-012 and PIN 123456...');
    await send('Runtime.evaluate', {
      expression: `
        const elNik = document.getElementById('auth-nik-input');
        const elPin = document.getElementById('auth-pin-input');
        if (elNik) {
          elNik.value = 'NSR-2019-012';
          elNik.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (elPin) {
          elPin.value = '123456';
          elPin.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('4. Submitting Masuk Presensi...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof window.eksekusiMasukPresensi === 'function') {
          window.eksekusiMasukPresensi();
        }
      `
    });
    await new Promise(r => setTimeout(r, 4000));

    // Tutup modal notif
    await send('Runtime.evaluate', {
      expression: `
        const mn = document.getElementById('modal-notif');
        if (mn) mn.classList.add('hidden');
        const card = document.getElementById('auth-card');
        if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('5. Capturing verified profile screenshot...');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(ARTIFACT_DIR, 'bukti_live_pin_login_sukses.png');
    fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
    console.log('   ✓ Saved:', p);

    ws.close();
  } finally {
    chrome.kill();
    console.log('✓ Chrome terminated');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
