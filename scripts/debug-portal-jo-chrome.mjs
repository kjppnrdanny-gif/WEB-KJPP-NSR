import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

async function run() {
  const php = spawn('php', ['-S', '127.0.0.1:8899', 'router.php'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1000));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-debug-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9531',
    '--no-sandbox',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const tabRes = await fetch('http://127.0.0.1:9531/json/new?about:blank', { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.consoleAPICalled') {
      console.log('[CONSOLE]', m.params.type, m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      console.log('[EXCEPTION]', JSON.stringify(m.params.exceptionDetails));
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:8899/portal-penugasan-jo.html' });
  await new Promise(r => setTimeout(r, 3000));

  const res1 = await send('Runtime.evaluate', { expression: 'typeof window.verifikasiTokenLogin' });
  const res2 = await send('Runtime.evaluate', { expression: 'typeof verifikasiTokenLogin' });
  const res3 = await send('Runtime.evaluate', { expression: 'typeof gantiTab' });
  console.log('typeof window.verifikasiTokenLogin:', res1.result?.value);
  console.log('typeof verifikasiTokenLogin:', res2.result?.value);
  console.log('typeof gantiTab:', res3.result?.value);

  chrome.kill();
  php.kill();
  process.exit(0);
}
run();
