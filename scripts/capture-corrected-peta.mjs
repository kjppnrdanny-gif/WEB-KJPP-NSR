import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = 'index.html';
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_MAP[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(filePath).pipe(res);
}

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

async function capture() {
  const server = http.createServer(staticServer);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  console.log(`Server listening on port ${port}`);

  const chromePath = findChrome();
  const remoteDebuggingPort = 9448;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_snap_peta');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const proc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp;

  try {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
        if (res.ok) break;
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 200));
    }

    const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 1. Capture index.html Tab 4: 5 Kantor & Peta (Spotlight Jakarta)
    console.log('Navigating to index.html...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` });
    for (let i = 0; i < 50; i++) {
      const ready = await cdp.evaluate(`typeof pilihTabUtama === 'function' && typeof pilihKantorPeta === 'function' && document.readyState === 'complete'`);
      if (ready) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    await new Promise((r) => setTimeout(r, 600));

    // Switch to Tab 4 (kantor) and select 'pusat'
    await cdp.evaluate(`
      if (typeof pilihTabUtama === 'function') {
        pilihTabUtama('kantor');
      }
      if (typeof pilihKantorPeta === 'function') {
        pilihKantorPeta('pusat');
      }
    `);
    await new Promise((r) => setTimeout(r, 800));

    // Scroll directly to container-spotlight-kantor
    await cdp.evaluate(`(() => {
      const el = document.getElementById('container-spotlight-kantor');
      if (el) {
        const rect = el.getBoundingClientRect();
        window.scrollTo(0, window.pageYOffset + rect.top - 80);
      }
    })()`);

    // Give iframe time to load Google map tiles
    console.log('Waiting for map tiles in index.html...');
    await new Promise((r) => setTimeout(r, 4000));

    const ssIndex = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'peta_kantor_pusat_jakarta_terkoreksi.png'), Buffer.from(ssIndex.data, 'base64'));
    console.log('✓ Successfully saved peta_kantor_pusat_jakarta_terkoreksi.png');

    // 2. Capture tim-cabang.html
    console.log('Navigating to tim-cabang.html...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/tim-cabang.html` });
    for (let i = 0; i < 50; i++) {
      const ready = await cdp.evaluate(`typeof pilihKantor === 'function' && document.readyState === 'complete'`);
      if (ready) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    await new Promise((r) => setTimeout(r, 600));

    await cdp.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('.btn-kantor')).find(b => b.innerText.toLowerCase().includes('pusat'));
      if (typeof pilihKantor === 'function') {
        pilihKantor('pusat', btn);
      }
      const sec = document.getElementById('kantor-cabang');
      if (sec) {
        const b = sec.getBoundingClientRect();
        window.scrollTo(0, window.pageYOffset + b.top - 40);
      }
    })()`);

    console.log('Waiting for map tiles in tim-cabang.html...');
    await new Promise((r) => setTimeout(r, 4000));

    const ssTim = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'tim_cabang_jakarta_peta_terkoreksi.png'), Buffer.from(ssTim.data, 'base64'));
    console.log('✓ Successfully saved tim_cabang_jakarta_peta_terkoreksi.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close'); } catch (_) {}
    }
    try { proc.kill(); } catch (_) {}
    server.close();
    console.log('Server and browser cleanly closed.');
  }
}

capture().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
