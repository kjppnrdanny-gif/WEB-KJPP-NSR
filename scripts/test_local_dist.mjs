import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function testLocalDist() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9425',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9425/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };
    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    const localUrl = 'file:///' + path.join(ROOT_DIR, 'dist', 'index.html').replace(/\\/g, '/');
    console.log('Navigating to', localUrl);
    await send('Page.navigate', { url: localUrl });
    await new Promise(r => setTimeout(r, 2000));

    const check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-portal');
          const kartu = document.getElementById('kartu-e-operasional');
          return {
            hasModal: Boolean(modal),
            hasKartu: Boolean(kartu)
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Local dist check:', JSON.stringify(check.result?.value, null, 2));
    ws.close();
  } finally {
    chrome.kill();
  }
}

testLocalDist().catch(console.error);
