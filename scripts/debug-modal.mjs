import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const PORT = 8190;

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not Found'); return; }
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = { '.html': 'text/html; charset=UTF-8', '.js': 'application/javascript; charset=UTF-8', '.css': 'text/css' };
  res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise(r => server.listen(PORT, r));

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9458',
  '--no-sandbox',
  'about:blank'
]);

await new Promise(r => setTimeout(r, 2000));
const tRes = await fetch('http://127.0.0.1:9458/json/new?about:blank', { method: 'PUT' });
const t = await tRes.json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
const send = (method, params = {}) => new Promise(r => {
  const cur = id++;
  const h = e => {
    const msg = JSON.parse(e.data);
    if (msg.id === cur) { ws.removeEventListener('message', h); r(msg.result || msg); }
  };
  ws.addEventListener('message', h);
  ws.send(JSON.stringify({ id: cur, method, params }));
});

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
await new Promise(r => setTimeout(r, 3000));

const check1 = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const m = document.getElementById('modal-portal');
      return {
        exists: !!m,
        className: m ? m.className : null,
        display: m ? window.getComputedStyle(m).display : null
      };
    })()
  `,
  returnByValue: true
});
console.log('Before opening:', check1.result.value);

// Open modal
await send('Runtime.evaluate', {
  expression: `
    (() => {
      if (typeof bukaModalPortal === 'function') {
        bukaModalPortal();
      } else {
        const m = document.getElementById('modal-portal');
        m.classList.remove('hidden');
      }
    })()
  `
});

await new Promise(r => setTimeout(r, 1000));

const check2 = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const m = document.getElementById('modal-portal');
      const dialog = document.getElementById('modal-portal-dialog');
      const r = dialog ? dialog.getBoundingClientRect() : null;
      const badges = dialog ? Array.from(dialog.querySelectorAll('.space-y-2\\.5 .rounded-full')).map(b => b.textContent.trim().replace(/\\s+/g, ' ')) : [];
      return {
        className: m ? m.className : null,
        display: m ? window.getComputedStyle(m).display : null,
        dialogRect: r ? { width: r.width, height: r.height, top: r.top, left: r.left } : null,
        dialogClientWidth: dialog ? dialog.clientWidth : 0,
        dialogScrollWidth: dialog ? dialog.scrollWidth : 0,
        badges: badges
      };
    })()
  `,
  returnByValue: true
});
console.log('After opening:', check2.result.value);

ws.close();
chrome.kill();
server.close();
