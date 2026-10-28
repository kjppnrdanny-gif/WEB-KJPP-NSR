import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const PORT = 8195;
const DEBUG_PORT = 9445;

function createServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/test-modal-preview.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.html': 'text/html; charset=UTF-8',
      '.js': 'application/javascript; charset=UTF-8',
      '.css': 'text/css; charset=UTF-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const breakpoints = [
  { name: 'desktop', width: 1280, height: 800, mobile: false, label: 'Desktop 1280x800' },
  { name: 'tablet', width: 768, height: 1024, mobile: true, label: 'Tablet iPad 768x1024' },
  { name: 'mobile-standard', width: 390, height: 844, mobile: true, label: 'Mobile iPhone 14 390x844' },
  { name: 'mobile-small-320', width: 320, height: 568, mobile: true, label: 'Mobile iPhone SE 320x568' }
];

async function runTest() {
  const server = createServer();
  await new Promise(r => server.listen(PORT, r));
  console.log(`Server listening at http://127.0.0.1:${PORT}`);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    'about:blank'
  ]);

  let wsUrl = '';
  await new Promise((resolve, reject) => {
    chrome.stderr.on('data', data => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        wsUrl = match[1];
        resolve();
      }
    });
    setTimeout(() => {
      if (!wsUrl) reject(new Error('Timeout waiting for Chrome DevTools'));
    }, 5000);
  });

  console.log('Connected to Chrome DevTools');

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
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
        cb(m.result !== undefined ? m.result : m);
      }
    };

    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');

    for (const bp of breakpoints) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: bp.width,
        height: bp.height,
        deviceScaleFactor: 2,
        mobile: bp.mobile
      });

      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/test-modal-preview.html` });
      await new Promise(r => setTimeout(r, 600));

      // Test metrics
      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const modal = document.getElementById('modal-portal');
            const dialog = document.getElementById('modal-portal-dialog');
            const form = document.getElementById('form-token-portal');
            const input = document.getElementById('input-token');
            const btn = document.getElementById('btn-submit-token');

            const docWidth = document.documentElement.clientWidth;
            const docScroll = document.documentElement.scrollWidth;
            const dialogRect = dialog ? dialog.getBoundingClientRect() : {};

            return {
              viewport: { width: window.innerWidth, height: window.innerHeight },
              docWidth,
              docScroll,
              hasDocOverflow: docScroll > docWidth,
              dialogRect: {
                width: Math.round(dialogRect.width),
                height: Math.round(dialogRect.height),
                top: Math.round(dialogRect.top),
                left: Math.round(dialogRect.left)
              },
              inputHeight: input ? input.offsetHeight : 0,
              btnHeight: btn ? btn.offsetHeight : 0
            };
          })()
        `,
        returnByValue: true
      });

      const data = evalRes.result.value;
      console.log(`[${bp.name}] Metrics:`, JSON.stringify(data));

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgBuffer = Buffer.from(shot.data, 'base64');
      const outPath = path.join(ARTIFACTS_DIR, `preview-redesign-login-${bp.name}.png`);
      fs.writeFileSync(outPath, imgBuffer);
      console.log(`Saved screenshot to: ${outPath}`);
    }

    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

runTest().catch(console.error);
