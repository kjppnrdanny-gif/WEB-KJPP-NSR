import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome binary not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function clickAt(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1
  });
  await new Promise(r => setTimeout(r, 100));
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1
  });
}

async function typeText(cdp, text) {
  for (const char of text) {
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      text: char,
      unmodifiedText: char
    });
    await new Promise(r => setTimeout(r, 40));
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp'
    });
    await new Promise(r => setTimeout(r, 40));
  }
}

async function main() {
  const chromePath = findChrome();
  const remoteDebuggingPort = 9468;
  const userDataDir = path.join(os.tmpdir(), 'chrome_staging_wrong_otp_' + Date.now());

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
        if (res.ok) { versionData = await res.json(); break; }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 200));
    }

    const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('1. Navigasi ke Web App...');
    await cdp.send('Page.navigate', { url: WEB_APP_URL });
    await new Promise(r => setTimeout(r, 6000));

    console.log('2. Input NIK NSR-001 & Request OTP...');
    await clickAt(cdp, 160, 425);
    await new Promise(r => setTimeout(r, 300));
    await typeText(cdp, 'NSR-001');
    await new Promise(r => setTimeout(r, 300));
    await clickAt(cdp, 335, 425);
    await new Promise(r => setTimeout(r, 8000));

    console.log('3. Klik tombol Tutup Modal (x: 195, y: 635)...');
    await clickAt(cdp, 195, 635);
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot setelah modal ditutup, menampilkan kartu 6-digit OTP
    const shotCard = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_staging_otp_card_active.png'), Buffer.from(shotCard.data, 'base64'));
    console.log('✓ Screenshot kartu OTP aktif tersimpan');

    console.log('4. Mengetik Kode OTP Salah: 000000...');
    // Input OTP box berada di y ≈ 510, x ≈ 180
    await clickAt(cdp, 180, 510);
    await new Promise(r => setTimeout(r, 300));
    await typeText(cdp, '000000');
    await new Promise(r => setTimeout(r, 300));

    console.log('5. Klik tombol "Verifikasi" (x: 335, y: 510)...');
    await clickAt(cdp, 335, 510);
    await new Promise(r => setTimeout(r, 6000));

    // Capture screenshot respons penolakan OTP salah
    const shotReject = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_staging_otp_rejected.png'), Buffer.from(shotReject.data, 'base64'));
    console.log('✓ Screenshot penolakan OTP salah tersimpan: live_staging_otp_rejected.png');

  } finally {
    try { chromeProc.kill(); } catch (_) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(console.error);
