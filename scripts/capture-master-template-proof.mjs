// scripts/capture-master-template-proof.mjs
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9588;
const LOCAL_PATH = path.resolve('portal-penugasan-jo.html');
const FILE_URL = 'file:///' + LOCAL_PATH.replace(/\\/g, '/');
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const OUTPUT_PNG = path.join(ARTIFACT_DIR, 'bukti_master_template_aligned.png');

async function captureProof() {
  console.log('Target URL:', FILE_URL);
  console.log('Output:', OUTPUT_PNG);

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-proof-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1400,1800',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
    const tabData = await tabRes.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);

    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const resp = JSON.parse(evt.data);
          if (resp.id === id) {
            ws.removeEventListener('message', handler);
            if (resp.error) reject(resp.error);
            else resolve(resp.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Page.navigate', { url: FILE_URL });
    await new Promise(r => setTimeout(r, 3000));

    // Simulate login and load Tab 3
    await sendCommand('Runtime.evaluate', {
      expression: `
        (function() {
          window.sessionStorage.setItem('opini_auth_session', JSON.stringify({
            authenticated: true,
            role: 'SUPER_ADMIN',
            username: 'KING',
            nama: 'Ir. Nanang Rahayu, M.Ec.Dev.',
            isKing: true,
            isAdminPusat: true
          }));
          window.CURRENT_AUTH_SESSION = {
            authenticated: true,
            role: 'SUPER_ADMIN',
            username: 'KING',
            isKing: true,
            isAdminPusat: true
          };
          if (typeof beralihTab === 'function') {
            beralihTab('tab-pratinjau');
          }
          if (typeof renderSemuaDokumen === 'function') {
            renderSemuaDokumen();
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot
    const screenshot = await sendCommand('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1400, height: 1800, scale: 1 }
    });

    fs.writeFileSync(OUTPUT_PNG, Buffer.from(screenshot.data, 'base64'));
    console.log('✓ Screenshot saved to:', OUTPUT_PNG);

    ws.close();
  } finally {
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
  }
}

captureProof().catch(console.error);
