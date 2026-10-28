import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LIVE_BASE_URL = 'https://kjppnanangrahayu.com';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9470;
const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5b357e59-98db-42c8-a216-3b795e1f1b2d';
const TEST_TOKEN = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");

async function verifyGeneralModalFlow() {
  console.log('Testing general modal without redirect...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\HP\\AppData\\Local\\Temp\\chrome_modal_general'
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
  await sendCommand('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await sendCommand('Page.navigate', { url: `${LIVE_BASE_URL}/?_t=${Date.now()}` });
  await new Promise(r => setTimeout(r, 2000));

  // Open modal without specific target portal (general portal access)
  await sendCommand('Runtime.evaluate', { expression: `window.bukaModalPortal();` });
  await new Promise(r => setTimeout(r, 600));

  // Login
  console.log('Logging in with general modal...');
  const resLogin = await sendCommand('Runtime.evaluate', {
    expression: `(async () => {
      document.getElementById('input-token').value = '${TEST_TOKEN}';
      await window.verifikasiTokenPortal();
      return JSON.stringify({
        formHidden: document.getElementById('form-token-portal')?.classList.contains('hidden'),
        panelVisible: !document.getElementById('panel-layanan')?.classList.contains('hidden'),
        labelLokasi: document.getElementById('label-lokasi')?.innerText,
        sessionKeys: Object.keys(sessionStorage)
      });
    })()`,
    awaitPromise: true
  });

  const loginState = JSON.parse(resLogin.result.value);
  console.log('Login State:', loginState);

  // Capture authenticated service panel screenshot
  const ssAuth = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'bukti_live_modal_authenticated_panel.png'), Buffer.from(ssAuth.data, 'base64'));
  console.log('📸 Captured bukti_live_modal_authenticated_panel.png');

  // Now click resetTokenSesi
  console.log('Clicking Ganti Token / Keluar...');
  const resLogout = await sendCommand('Runtime.evaluate', {
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

  const logoutState = JSON.parse(resLogout.result.value);
  console.log('Logout State:', logoutState);

  // Capture post-logout screenshot
  const ssLogout = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'bukti_live_modal_post_logout.png'), Buffer.from(ssLogout.data, 'base64'));
  console.log('📸 Captured bukti_live_modal_post_logout.png');

  chrome.kill();
  console.log('✅ General modal test finished successfully!');
}

verifyGeneralModalFlow();
