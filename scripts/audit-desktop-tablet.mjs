import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const PORT = 8189;

function createServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
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
  { name: 'desktop', width: 1440, height: 900, mobile: false, label: 'Desktop (1440x900)' },
  { name: 'tablet', width: 768, height: 1024, mobile: true, label: 'Tablet iPad (768x1024)' }
];

async function runAudit() {
  const server = createServer();
  await new Promise(r => server.listen(PORT, r));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9456',
    '--no-sandbox',
    '--disable-gpu',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9456/json/new?about:blank', { method: 'PUT' });
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

      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
      // Wait for page load event
      await new Promise(r => setTimeout(r, 3000));

      // Open modal
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const m = document.getElementById('modal-portal');
            if (m) {
              m.classList.remove('hidden');
              m.style.display = 'flex';
            }
          })()
        `
      });

      await new Promise(r => setTimeout(r, 1000));

      const evalResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const modal = document.getElementById('modal-portal');
            const dialog = document.getElementById('modal-portal-dialog');
            const docWidth = document.documentElement.clientWidth;
            const docScroll = document.documentElement.scrollWidth;
            
            const modalWidth = modal ? modal.clientWidth : 0;
            const modalScroll = modal ? modal.scrollWidth : 0;

            const dialogRect = dialog ? dialog.getBoundingClientRect() : { width: 0, height: 0 };
            const dialogWidth = dialog ? dialog.clientWidth : 0;
            const dialogScroll = dialog ? dialog.scrollWidth : 0;

            const hasHorizontalDocOverflow = docScroll > docWidth;
            const hasModalOverflow = modalScroll > modalWidth;
            const hasDialogOverflow = dialogScroll > dialogWidth;

            const badges = dialog ? Array.from(dialog.querySelectorAll('[class*="space-y"] .rounded-full')) : [];
            const badgeInfos = badges.map(b => {
              const r = b.getBoundingClientRect();
              return {
                text: b.textContent.trim().replace(/\\s+/g, ' ').substring(0, 45) + '...',
                width: Math.round(r.width),
                height: Math.round(r.height),
                top: Math.round(r.top),
                left: Math.round(r.left)
              };
            });

            return {
              viewport: { width: window.innerWidth, height: window.innerHeight },
              doc: { clientWidth: docWidth, scrollWidth: docScroll, overflow: hasHorizontalDocOverflow },
              modal: { clientWidth: modalWidth, scrollWidth: modalScroll, overflow: hasModalOverflow },
              dialog: {
                rectWidth: Math.round(dialogRect.width),
                rectHeight: Math.round(dialogRect.height),
                clientWidth: dialogWidth,
                scrollWidth: dialogScroll,
                overflow: hasDialogOverflow
              },
              hasAnyOverflow: hasHorizontalDocOverflow || hasModalOverflow || hasDialogOverflow,
              badges: badgeInfos
            };
          })()
        `,
        returnByValue: true
      });

      const data = (evalResult && evalResult.result) ? evalResult.result.value : (evalResult ? evalResult.value : null);
      const status = !data.hasAnyOverflow ? 'PASS' : 'FAIL';
      console.log(`[${status}] ${bp.label}:`);
      console.log(`   Viewport: ${data.viewport.width}x${data.viewport.height}`);
      console.log(`   Doc Scroll: ${data.doc.scrollWidth} / Client: ${data.doc.clientWidth} (Doc Overflow: ${data.doc.overflow})`);
      console.log(`   Modal Scroll: ${data.modal.scrollWidth} / Client: ${data.modal.clientWidth} (Modal Overflow: ${data.modal.overflow})`);
      console.log(`   Dialog: ${data.dialog.rectWidth}x${data.dialog.rectHeight}px, Scroll: ${data.dialog.scrollWidth} / Client: ${data.dialog.clientWidth} (Dialog Overflow: ${data.dialog.overflow})`);
      console.log(`   Badges:`);
      data.badges.forEach((b, idx) => {
        console.log(`      ${idx + 1}. [${b.width}x${b.height}px at (${b.left},${b.top})] "${b.text}"`);
      });

      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      if (screenshot && screenshot.data) {
        const imgPath = path.join(ROOT_DIR, 'scripts', `audit-opini-modal-${bp.name}.png`);
        fs.writeFileSync(imgPath, Buffer.from(screenshot.data, 'base64'));
        console.log(`   Screenshot saved: ${imgPath}\n`);
      }
    }

    ws.close();
    chrome.kill();
    server.close();
    console.log('Desktop & Tablet Verification Completed.');
  } catch (err) {
    console.error('Audit execution error:', err);
    chrome.kill();
    server.close();
  }
}

runAudit();
