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
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = 'portal-nolap.html';
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
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
}

async function run() {
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(8099, '127.0.0.1', r));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9259',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9259/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8099/portal-nolap.html' });
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `(() => {
        window.alert = function(){};
        window.confirm = function(){ return true; };
        sesiAktif = { sub: 'admin_pusat', role: 'ADMIN_PUSAT', cabang: 'Pusat', nama: 'Deni Siswandi', jabatan: 'Rekan', label: 'Deni Siswandi' };
        aktifkanPanelUtama();
        gantiTabModul('spm');
        pilihSubSpm('tanah');
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // Scroll to Section B (Red Flags)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const secB = document.getElementById('sec-tanah-b');
        if (secB) secB.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 500));
    const ssSecB = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smart_spm_sec_b_redflags.png'), Buffer.from(ssSecB.data, 'base64'));
    console.log('Saved smart_spm_sec_b_redflags.png');

    // Scroll to Section F & G (Client Acceptance & Verification)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const secF = document.getElementById('sec-tanah-f');
        if (secF) secF.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 500));
    const ssSecFG = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smart_spm_sec_fg_approval.png'), Buffer.from(ssSecFG.data, 'base64'));
    console.log('Saved smart_spm_sec_fg_approval.png');

    ws.close();
  } catch (err) {
    console.error('Error during section screenshots:', err);
  } finally {
    try { chrome.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
  }
}

run();
