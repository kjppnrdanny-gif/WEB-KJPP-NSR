import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9579;
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-presensi.html';
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';

async function captureLivePresensiProof() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-live-pres-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=360,800', // Mobile Android viewport
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const handlers = new Map();

  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.javascriptDialogOpening') {
      const dialogId = id++;
      ws.send(JSON.stringify({ id: dialogId, method: 'Page.handleJavaScriptDialog', params: { accept: true } }));
    }
    if (m.id && handlers.has(m.id)) {
      const cb = handlers.get(m.id);
      handlers.delete(m.id);
      cb(m.result !== undefined ? m.result : m);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    handlers.set(msgId, (res) => {
      if (res && res.error) reject(new Error(JSON.stringify(res.error)));
      else resolve(res);
    });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  console.log('Navigating to live production presensi portal (Android 360x800)...');
  await send('Page.navigate', { url: LIVE_URL });

  // Wait until modal is opened
  for (let i = 0; i < 40; i++) {
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const m = document.getElementById("modal-privasi-karyawan");
        const btn = document.getElementById("btn-setuju-privasi-presensi");
        return Boolean(m && !m.classList.contains("hidden") && btn);
      })()`
    });
    if (res.result?.value === true) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // 1. Capture modal open with sticky footer on Android 360x800
  const shotModal360 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_mobile_360_sticky.png'), Buffer.from(shotModal360.data, 'base64'));
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_modal_privasi_presensi.png'), Buffer.from(shotModal360.data, 'base64'));
  console.log('Saved bukti_live_mobile_360_sticky.png & bukti_live_modal_privasi_presensi.png');

  // 2. Test iPhone 390x844
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 300));
  const shotModal390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_mobile_390_sticky.png'), Buffer.from(shotModal390.data, 'base64'));
  console.log('Saved bukti_live_mobile_390_sticky.png');

  // 3. Dispatch touch/click on button to test live modal closure
  console.log('Simulating touch interaction on #btn-setuju-privasi-presensi...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-setuju-privasi-presensi');
      if (btn) {
        btn.click();
      }
    })()`
  });

  await new Promise(r => setTimeout(r, 1000));

  // 4. Capture closed modal state (unlocked form)
  const shotClosed = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_presensi_unlocked.png'), Buffer.from(shotClosed.data, 'base64'));
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_mobile_unlocked.png'), Buffer.from(shotClosed.data, 'base64'));
  console.log('Saved bukti_live_presensi_unlocked.png & bukti_live_mobile_unlocked.png');

  chrome.kill();
  console.log('All live captures complete!');
}

captureLivePresensiProof().catch(console.error);
