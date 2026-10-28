import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9585;
const PORT = 8935;
const URL = `http://127.0.0.1:${PORT}/portal-nolap.html`;

async function testPageLoad() {
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'router.php'], { stdio: 'pipe' });
  php.stderr.on('data', d => console.log('PHP:', d.toString()));
  await new Promise(r => setTimeout(r, 1000));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-pl-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1100',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', handler);
          if (m.error) reject(new Error(JSON.stringify(m.error)));
          else resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');
  
  let loadFired = false;
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') loadFired = true;
  });

  console.log('Navigating to', URL);
  await send('Page.navigate', { url: URL });

  for (let i = 0; i < 40; i++) {
    if (loadFired) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1000));

  const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      href: window.location.href,
      title: document.title,
      bodyChildren: document.body ? document.body.children.length : 0,
      typeofLogin: typeof loginKeServer,
      typeofResolve: typeof resolveUnifiedTokenNoLap,
      typeofBukaManual: typeof bukaModalTerbitkanManual
    })`,
    returnByValue: true
  });

  console.log('Page info:', res.result?.value);

  chrome.kill();
  php.kill();
}

testPageLoad().catch(console.error);
