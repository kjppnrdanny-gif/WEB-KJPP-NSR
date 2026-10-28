import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8993;
const CDP_PORT = 9489;

const server = http.createServer((req, res) => {
  let p = req.url === '/' ? 'preview-diagram-opini-nsr.html' : req.url.slice(1);
  if (p.includes('?')) p = p.split('?')[0];
  const file = path.join(path.resolve('.'), p);
  if (fs.existsSync(file)) {
    const ext = path.extname(file);
    const ct = ext === '.html' ? 'text/html' : ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'text/plain';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(fs.readFileSync(file));
  } else {
    res.writeHead(404);
    res.end('Not found: ' + file);
  }
});

server.listen(PORT, async () => {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const tRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tData = await tRes.json();
  const ws = new WebSocket(tData.webSocketDebuggerUrl);
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
  const send = (method, params = {}) => new Promise(r => {
    const id = msgId++;
    handlers.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/preview-diagram-opini-nsr.html` });
  await new Promise(r => setTimeout(r, 2000));

  const check = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const b1 = document.getElementById('badge-gerbang-1')?.getBoundingClientRect();
        const b2 = document.getElementById('badge-gerbang-2')?.getBoundingClientRect();
        const img = document.querySelector('img[alt=\"Logo Resmi KJPP NSR\"]');
        return {
          b1Top: b1?.top,
          b2Top: b2?.top,
          topDifference: Math.abs((b1?.top || 0) - (b2?.top || 0)),
          imgRendered: img ? { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, width: img.width, height: img.height } : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Precision verification:', JSON.stringify(check, null, 2));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  const proofFile = path.join(ARTIFACT_DIR, 'bukti_preview_precision_1366.png');
  fs.writeFileSync(proofFile, Buffer.from(ss.data, 'base64'));
  console.log('Screenshot saved to:', proofFile);

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
});
