import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = 'd:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/dist';
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(8091, async () => {
  console.log('Test server running at http://127.0.0.1:8091');

  // Launch headless chrome
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9494',
    '--no-sandbox',
    '--window-size=1280,850',
    'http://127.0.0.1:8091/index.html'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9494/json/list');
    const pages = await listRes.json();
    const indexPage = pages.find(p => p.url.includes('8091/index.html'));

    if (indexPage && indexPage.webSocketDebuggerUrl) {
      const ws = new WebSocket(indexPage.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);

      let msgId = 1;
      const send = (method, params = {}) => new Promise((resolve) => {
        const id = msgId++;
        const onMsg = (e) => {
          const m = JSON.parse(e.data);
          if (m.id === id) {
            ws.removeEventListener('message', onMsg);
            resolve(m.result || m.error);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });

      await send('Page.enable');
      await send('Runtime.enable');

      // Test 1: Verify link-portal-absen in index.html
      const linkCheck = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = document.getElementById('link-portal-absen');
            return {
              href: btn ? btn.getAttribute('href') : null,
              text: btn ? btn.innerText.trim() : null,
              visible: btn ? (btn.offsetWidth > 0 && btn.offsetHeight > 0) : false
            };
          })()
        `,
        returnByValue: true
      });
      console.log('1. Check link-portal-absen in index.html:', linkCheck.result?.value);

      // Test 2: Navigate to portal-presensi.html on Desktop
      await send('Page.navigate', { url: 'http://127.0.0.1:8091/portal-presensi.html' });
      await new Promise(r => setTimeout(r, 3000));

      const presensiCheck = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const ifr = document.getElementById('presensi-frame');
            return {
              title: document.title,
              iframeSrc: ifr ? ifr.src : null,
              allowAttr: ifr ? ifr.getAttribute('allow') : null,
              clockText: document.getElementById('live-clock')?.innerText
            };
          })()
        `,
        returnByValue: true
      });
      console.log('2. Check portal-presensi.html DOM:', presensiCheck.result?.value);

      // Capture desktop screenshot
      const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'presensi_desktop_preview.png'), Buffer.from(shotDesktop.data, 'base64'));
      console.log('✓ Saved presensi_desktop_preview.png');

      // Test 3: Mobile Viewport (iPhone 14 / 390x844)
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 1000));

      const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'presensi_mobile_preview.png'), Buffer.from(shotMobile.data, 'base64'));
      console.log('✓ Saved presensi_mobile_preview.png');

      ws.close();
    }
  } catch (err) {
    console.error('Error during local test:', err);
  } finally {
    chrome.kill();
    server.close();
  }
});
