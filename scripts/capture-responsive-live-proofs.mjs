import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const port = 9560;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-resp-${Date.now()}`);

async function main() {
  console.log('Launching headless Chrome on port', port);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpUserData}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,950',
    'about:blank'
  ]);

  let tData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const tRes = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      tData = await tRes.json();
      if (tData && tData.webSocketDebuggerUrl) break;
    } catch (e) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  if (!tData || !tData.webSocketDebuggerUrl) {
    throw new Error('Failed to connect to Chrome debugging endpoint');
  }

  const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((res) => {
      const reqId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === reqId) {
          ws.removeEventListener('message', handler);
          res(msg);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Navigating to live site https://kjppnanangrahayu.com ...');
  await send('Page.navigate', { url: `https://kjppnanangrahayu.com/?cb=${Date.now()}` });
  await new Promise(r => setTimeout(r, 4000));

  // Otentikasi dan buka modal
  console.log('Authenticating session...');
  await send('Runtime.evaluate', {
    expression: `(async () => {
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
        token: 'NSR8899',
        wilayah: 'PUSAT',
        role: 'SUPER ADMIN',
        roleLabel: 'SUPER ADMIN',
        branch: 'KANTOR PUSAT',
        expiresAt: Date.now() + 86400000
      }));
      if (typeof bukaModalPortal === 'function') {
        bukaModalPortal('all');
      }
    })()`,
    awaitPromise: true
  });

  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture Mobile View (390 x 844 - iPhone / Android)
  console.log('Capturing Mobile View (390px)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 800));

  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  const pathMobile = `${artifactsDir}/bukti_cpanel_live_mobile_390px.png`;
  fs.writeFileSync(pathMobile, Buffer.from(shotMobile.result.data, 'base64'));
  console.log('✓ Saved:', pathMobile);

  // 2. Capture Tablet View (768 x 1024 - iPad / Android Tablet)
  console.log('Capturing Tablet View (768px)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 800));

  const shotTablet = await send('Page.captureScreenshot', { format: 'png' });
  const pathTablet = `${artifactsDir}/bukti_cpanel_live_tablet_768px.png`;
  fs.writeFileSync(pathTablet, Buffer.from(shotTablet.result.data, 'base64'));
  console.log('✓ Saved:', pathTablet);

  // 3. Capture Desktop View (1280 x 900)
  console.log('Capturing Desktop View (1280px)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 800));

  const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
  const pathDesktop = `${artifactsDir}/bukti_cpanel_live_desktop_1280px.png`;
  fs.writeFileSync(pathDesktop, Buffer.from(shotDesktop.result.data, 'base64'));
  console.log('✓ Saved:', pathDesktop);

  ws.close();
  chrome.kill();
  try {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  } catch (e) {}
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
