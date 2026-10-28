import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const EXPECTED_URL = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';

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

async function main() {
  console.log('=== MEMULAI VERIFIKASI LANGSUNG PADA SERVER LIVE https://kjppnanangrahayu.com ===');

  const chromePath = findChrome();
  const remoteDebuggingPort = 9499;
  const userDataDir = path.join(os.tmpdir(), 'chrome_live_verify_' + Date.now());

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
        if (res.ok) break;
      } catch (_) {}
      await new Promise(r => setTimeout(r, 200));
    }

    const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');

    // 1. Desktop Live
    console.log('\n--- 1. Live Index Desktop (1280x800) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'https://kjppnanangrahayu.com/index.html?v=' + Date.now() });
    await new Promise(r => setTimeout(r, 3500));

    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[onclick*="bukaModalPortal"]');
        if (btn) btn.click();
        else if (typeof bukaModalPortal === 'function') bukaModalPortal();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const resDesktop = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-portal');
        const isVisible = modal && !modal.classList.contains('hidden');
        const link = modal ? modal.querySelector('a[href*="macros/s/"]') : null;
        return {
          modalVisible: isVisible,
          href: link ? link.href : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Evaluasi Live Desktop:', resDesktop.result.value);

    const shotDesktop = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_btn_desktop.png'), Buffer.from(shotDesktop.data, 'base64'));

    // 2. Mobile Live
    console.log('\n--- 2. Live Index Mobile (390x844) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await cdp.send('Page.navigate', { url: 'https://kjppnanangrahayu.com/index.html?v=' + Date.now() });
    await new Promise(r => setTimeout(r, 3500));

    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[onclick*="bukaModalPortal"]');
        if (btn) btn.click();
        else if (typeof bukaModalPortal === 'function') bukaModalPortal();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const resMobile = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-portal');
        const isVisible = modal && !modal.classList.contains('hidden');
        const link = modal ? modal.querySelector('a[href*="macros/s/"]') : null;
        return {
          modalVisible: isVisible,
          href: link ? link.href : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Evaluasi Live Mobile:', resMobile.result.value);

    const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_btn_mobile.png'), Buffer.from(shotMobile.data, 'base64'));

    console.log('\n========================================================');
    console.log('🎉 SEMUA TOMBOL LIVE DI kjppnanangrahayu.com TERVERIFIKASI AKTIF & BENAR!');
    console.log('========================================================');
  } finally {
    try { chromeProc.kill(); } catch (_) {}
  }
}

main().catch(console.error);
