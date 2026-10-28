import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
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

  async send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }
}

async function debugLive() {
  const chromePath = findChrome();
  const cdpPort = 9224;
  const userDataDir = path.join(os.tmpdir(), `chrome-debug-${Date.now()}`);

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions'
  ]);

  await new Promise(resolve => setTimeout(resolve, 2000));

  let versionData;
  for (let i = 0; i < 10; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (resp.ok) {
        versionData = await resp.json();
        break;
      }
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const browserCdp = new CDPClient(versionData.webSocketDebuggerUrl);
  await browserCdp.connect();

  const newTarget = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
  const pageWsUrl = `ws://127.0.0.1:${cdpPort}/devtools/page/${newTarget.targetId}`;

  const cdp = new CDPClient(pageWsUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  try {
    console.log('Navigating to https://kjppnanangrahayu.com/ ...');
    await cdp.send('Page.navigate', { url: 'https://kjppnanangrahayu.com/' });
    await new Promise(resolve => setTimeout(resolve, 4000));

    const check = await cdp.evaluate(`({
      ready: document.readyState,
      modalPortal: !!document.getElementById('modal-portal'),
      modalClasses: document.getElementById('modal-portal')?.className,
      formToken: !!document.getElementById('form-token-portal'),
      bukaType: typeof bukaModalPortal
    })`);
    console.log('DOM check before click:', check);

    console.log('Calling bukaModalPortal()...');
    const callRes = await cdp.evaluate(`(() => {
      try {
        bukaModalPortal();
        return {
          success: true,
          modalClasses: document.getElementById('modal-portal')?.className,
          formClasses: document.getElementById('form-token-portal')?.className,
          panelClasses: document.getElementById('panel-layanan')?.className
        };
      } catch (e) {
        return { error: e.message, stack: e.stack };
      }
    })()`);
    console.log('After bukaModalPortal():', callRes);
  } finally {
    try { chromeProc.kill(); } catch (e) {}
  }
}

debugLive();
