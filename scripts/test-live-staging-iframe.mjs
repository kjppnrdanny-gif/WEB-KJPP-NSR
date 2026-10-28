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

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
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
  const remoteDebuggingPort = 9460;
  const userDataDir = path.join(os.tmpdir(), 'chrome_staging_iframe_' + Date.now());

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

    const pageCdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageCdp.connect();
    await pageCdp.send('Page.enable');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigasi ke:', WEB_APP_URL);
    await pageCdp.send('Page.navigate', { url: WEB_APP_URL });
    await new Promise(r => setTimeout(r, 6000));

    // Poll for the OOPIF target
    let iframeTarget = null;
    for (let i = 0; i < 20; i++) {
      const listRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
      const list = await listRes.json();
      iframeTarget = list.find(t => t.type === 'iframe' && (t.url.includes('googleusercontent.com') || t.title.includes('userCodeAppPanel')));
      if (iframeTarget) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (!iframeTarget) {
      throw new Error('Target iframe OOPIF tidak ditemukan');
    }

    console.log('Target iframe OOPIF ditemukan:', iframeTarget.title);
    const iframeCdp = new CDPClient(iframeTarget.webSocketDebuggerUrl);
    await iframeCdp.connect();
    await iframeCdp.send('Runtime.enable');

    const domInfo = await iframeCdp.evaluate(`
      (() => {
        const nikInp = document.getElementById('auth-nik-input');
        const btnOtp = document.getElementById('btn-request-otp');
        return {
          hasNikInput: !!nikInp,
          nikValue: nikInp ? nikInp.value : null,
          hasBtnOtp: !!btnOtp,
          googleScriptRunDefined: typeof google !== 'undefined' && !!google.script && !!google.script.run
        };
      })()
    `);
    console.log('Status DOM di dalam Iframe OOPIF:', domInfo);

    if (domInfo.hasNikInput) {
      console.log('\n--- MELAKUKAN SIMULASI REQUEST OTP UNTUK NSR-001 ---');
      await iframeCdp.evaluate(`
        (() => {
          const nikInp = document.getElementById('auth-nik-input');
          nikInp.value = 'NSR-001';
          nikInp.dispatchEvent(new Event('input', { bubbles: true }));
          document.getElementById('btn-request-otp').click();
        })()
      `);

      console.log('Menunggu respons server Google Apps Script (MailApp & Session Cache)...');
      await new Promise(r => setTimeout(r, 6000));

      const afterOtpState = await iframeCdp.evaluate(`
        (() => {
          const stepNik = document.getElementById('step-nik');
          const stepOtp = document.getElementById('step-otp');
          const maskedEmail = document.getElementById('otp-masked-email');
          const countdown = document.getElementById('otp-countdown');
          const errMsg = document.getElementById('auth-error-msg');
          const statusBadge = document.getElementById('auth-status-badge');
          return {
            stepNikVisible: stepNik ? !stepNik.classList.contains('hidden') : null,
            stepOtpVisible: stepOtp ? !stepOtp.classList.contains('hidden') : null,
            maskedEmail: maskedEmail ? maskedEmail.innerText : null,
            countdown: countdown ? countdown.innerText : null,
            errMsg: errMsg ? errMsg.innerText : null,
            statusBadge: statusBadge ? statusBadge.innerText : null
          };
        })()
      `);
      console.log('Status State setelah Kirim OTP:', afterOtpState);

      // Screenshot hasil
      const shotOtp = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      const shotOtpPath = path.join(ARTIFACT_DIR, 'live_staging_otp_sent_card.png');
      fs.writeFileSync(shotOtpPath, Buffer.from(shotOtp.data, 'base64'));
      console.log('✓ Screenshot kartu OTP tersimpan:', shotOtpPath);
    }

  } finally {
    try { chromeProc.kill(); } catch (_) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(console.error);
