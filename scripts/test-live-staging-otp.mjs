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
    this.contexts = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.method === 'Runtime.executionContextCreated') {
          this.contexts.push(msg.params.context);
        }
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

  async evaluateInContext(contextId, expression) {
    const res = await this.send('Runtime.evaluate', {
      contextId,
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function main() {
  const chromePath = findChrome();
  const remoteDebuggingPort = 9458;
  const userDataDir = path.join(os.tmpdir(), 'chrome_staging_otp_' + Date.now());

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
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigasi ke:', WEB_APP_URL);
    await cdp.send('Page.navigate', { url: WEB_APP_URL });
    await new Promise(r => setTimeout(r, 6000));

    console.log('ExecutionContexts total:', cdp.contexts.length);
    for (const ctx of cdp.contexts) {
      console.log(`Context ID ${ctx.id}: name="${ctx.name}", origin="${ctx.origin}"`);
    }

    // Cari context yang memiliki elemen auth-nik-input
    let appCtxId = null;
    for (const ctx of cdp.contexts) {
      try {
        const hasInput = await cdp.evaluateInContext(ctx.id, `!!document.getElementById('auth-nik-input')`);
        if (hasInput) {
          appCtxId = ctx.id;
          console.log(`✓ Ditemukan aplikasi di Context ID ${ctx.id}!`);
          break;
        }
      } catch (_) {}
    }

    if (!appCtxId) {
      throw new Error('Konteks aplikasi tidak ditemukan di antara frame');
    }

    // 1. Cek karyawan NSR-001 secara langsung via fungsi client
    console.log('\n--- UJI 1: REQUEST OTP UNTUK NSR-001 ---');
    await cdp.evaluateInContext(appCtxId, `
      (() => {
        const inp = document.getElementById('auth-nik-input');
        inp.value = 'NSR-001';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        const btn = document.getElementById('btn-request-otp');
        btn.click();
      })()
    `);

    console.log('Menunggu pengiriman OTP dari Apps Script (tunggu 7 detik)...');
    await new Promise(r => setTimeout(r, 7000));

    // Ambil screenshot hasil request OTP
    const shotOtp = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotOtpPath = path.join(ARTIFACT_DIR, 'live_staging_otp_requested.png');
    fs.writeFileSync(shotOtpPath, Buffer.from(shotOtp.data, 'base64'));
    console.log('✓ Screenshot OTP card tersimpan:', shotOtpPath);

    // Baca state di DOM
    const state = await cdp.evaluateInContext(appCtxId, `
      (() => {
        const stepNik = document.getElementById('step-nik');
        const stepOtp = document.getElementById('step-otp');
        const maskedEmail = document.getElementById('otp-masked-email');
        const countdown = document.getElementById('otp-countdown');
        const errMsg = document.getElementById('auth-error-msg');
        return {
          stepNikHidden: stepNik ? stepNik.classList.contains('hidden') : null,
          stepOtpVisible: stepOtp ? !stepOtp.classList.contains('hidden') : null,
          maskedEmail: maskedEmail ? maskedEmail.innerText : null,
          countdown: countdown ? countdown.innerText : null,
          errMsg: errMsg ? errMsg.innerText : null
        };
      })()
    `);
    console.log('State Form setelah Minta OTP:', state);

  } finally {
    try { chromeProc.kill(); } catch (_) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(console.error);
