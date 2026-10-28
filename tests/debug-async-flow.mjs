import { spawn } from 'node:child_process';

const LIVE_BASE_URL = 'https://kjppnanangrahayu.com';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9465;
const TEST_TOKEN = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");

async function testAsync() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\HP\\AppData\\Local\\Temp\\chrome_async_debug'
  ]);

  let wsUrl = null;
  await new Promise((resolve) => {
    chrome.stderr.on('data', data => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        wsUrl = match[1];
        resolve();
      }
    });
  });

  const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
  const targetData = await targetRes.json();
  const ws = new WebSocket(targetData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const resp = JSON.parse(event.data);
        if (resp.id === id) {
          ws.removeEventListener('message', handler);
          resolve(resp.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  await sendCommand('Page.navigate', { url: `${LIVE_BASE_URL}/?_t=${Date.now()}` });
  await new Promise(r => setTimeout(r, 2500));

  // Open modal
  await sendCommand('Runtime.evaluate', { expression: `window.bukaModalPortal('penugasan');` });
  await new Promise(r => setTimeout(r, 800));

  // Call verifikasiTokenPortal with awaitPromise
  console.log('Logging in...');
  const loginRes = await sendCommand('Runtime.evaluate', {
    expression: `(async () => {
      document.getElementById('input-token').value = '${TEST_TOKEN}';
      await window.verifikasiTokenPortal();
      return JSON.stringify({
        internal: sessionStorage.getItem('kjpp_token_internal'),
        user: sessionStorage.getItem('NSR_USER_SESSION'),
        jo: sessionStorage.getItem('kjpp_session_jo')
      });
    })()`,
    awaitPromise: true
  });

  console.log('Login eval result:', loginRes.result.value);

  // Now call resetTokenSesi with awaitPromise
  console.log('Logging out...');
  const logoutRes = await sendCommand('Runtime.evaluate', {
    expression: `(async () => {
      await window.resetTokenSesi();
      return JSON.stringify({
        sessionKeys: Object.keys(sessionStorage),
        formHidden: document.getElementById('form-token-portal')?.classList.contains('hidden'),
        panelHidden: document.getElementById('panel-layanan')?.classList.contains('hidden')
      });
    })()`,
    awaitPromise: true
  });

  console.log('Logout eval result:', logoutRes.result.value);

  chrome.kill();
}

testAsync();
