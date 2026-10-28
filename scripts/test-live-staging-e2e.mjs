import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Edge binary not found');
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
  console.log('=== TEST E2E LIVE STAGING WEB APP ===');
  console.log('Target URL:', WEB_APP_URL);

  const chromePath = findChrome();
  const remoteDebuggingPort = 9456;
  const userDataDir = path.join(os.tmpdir(), 'chrome_staging_e2e_' + Date.now());

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!versionData) throw new Error('Chrome failed to start');

    const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Emulate mobile device (e.g. iPhone 14 / Pixel 7: 390x844)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigating to live Web App URL...');
    await cdp.send('Page.navigate', { url: WEB_APP_URL });

    // Tunggu sampai halaman selesai termuat (tunggu 6 detik)
    console.log('Menunggu render...');
    await new Promise((r) => setTimeout(r, 6000));

    // Ambil screenshot halaman awal mobile
    const initialScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const initialImgPath = path.join(ARTIFACT_DIR, 'live_staging_real_initial.png');
    fs.writeFileSync(initialImgPath, Buffer.from(initialScreenshot.data, 'base64'));
    console.log('✓ Screenshot awal tersimpan:', initialImgPath);

    // Cek judul dan konten frame
    const title = await cdp.evaluate('document.title');
    console.log('Document Title:', title);

    // Dapatkan daftar target untuk mencari iframe Google Apps Script jika ada
    const allTargetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
    const allTargets = await allTargetsRes.json();
    console.log('Target types available:', allTargets.map(t => ({ type: t.type, title: t.title, url: t.url.slice(0, 50) })));

    // Jika ada iframe target
    const iframeTarget = allTargets.find(t => t.url.includes('googleusercontent.com') || t.url.includes('echo'));
    let activeCdp = cdp;
    if (iframeTarget) {
      console.log('Found iframe target:', iframeTarget.url.slice(0, 80));
      const iframeCdp = new CDPClient(iframeTarget.webSocketDebuggerUrl);
      await iframeCdp.connect();
      await iframeCdp.send('Runtime.enable');
      activeCdp = iframeCdp;
    }

    // Evaluasi apakah elemen input NIK ada di activeCdp atau cdp
    const checkNik = async (client) => {
      return await client.evaluate(`
        (() => {
          const inp = document.getElementById('auth-nik-input');
          const btn = document.getElementById('btn-request-otp');
          return {
            hasInput: !!inp,
            inputValue: inp ? inp.value : null,
            hasBtn: !!btn,
            btnText: btn ? btn.innerText.trim() : null,
            bodySnippet: document.body ? document.body.innerText.slice(0, 200) : ''
          };
        })()
      `).catch(e => ({ error: e.message }));
    };

    let nikRes = await checkNik(activeCdp);
    if (!nikRes.hasInput && activeCdp !== cdp) {
      nikRes = await checkNik(cdp);
      if (nikRes.hasInput) activeCdp = cdp;
    }
    console.log('Hasil Cek Form Input NIK:', nikRes);

    if (nikRes.hasInput) {
      console.log('Menginput NIK NSR-001 ke form...');
      await activeCdp.evaluate(`
        (() => {
          const inp = document.getElementById('auth-nik-input');
          inp.value = 'NSR-001';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        })()
      `);

      console.log('Mengklik tombol "Kirim Kode OTP"...');
      await activeCdp.evaluate(`
        (() => {
          const btn = document.getElementById('btn-request-otp');
          if (btn) btn.click();
        })()
      `);

      // Tunggu 5 detik respon dari Google Apps Script server (MailApp & CacheService)
      console.log('Menunggu respons server Apps Script & pengiriman OTP...');
      await new Promise(r => setTimeout(r, 5000));

      const otpScreenScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const otpImgPath = path.join(ARTIFACT_DIR, 'live_staging_real_otp_screen.png');
      fs.writeFileSync(otpImgPath, Buffer.from(otpScreenScreenshot.data, 'base64'));
      console.log('✓ Screenshot layar OTP tersimpan:', otpImgPath);

      // Cek apakah step-otp sekarang aktif
      const otpState = await activeCdp.evaluate(`
        (() => {
          const stepOtp = document.getElementById('step-otp');
          const maskedEmail = document.getElementById('otp-masked-email');
          const countdown = document.getElementById('otp-countdown');
          const errMsg = document.getElementById('auth-error-msg');
          return {
            isOtpVisible: stepOtp ? !stepOtp.classList.contains('hidden') : false,
            maskedEmail: maskedEmail ? maskedEmail.innerText : null,
            countdown: countdown ? countdown.innerText : null,
            errMsg: errMsg ? errMsg.innerText : null
          };
        })()
      `);
      console.log('Status State OTP Card:', otpState);
    }

  } finally {
    try { chromeProc.kill(); } catch (_) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(console.error);
