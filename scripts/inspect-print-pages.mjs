import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8099;
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/daftar-token-akses-internal.html';
  const filePath = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production' + reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    let mime = 'text/html';
    if (ext === '.css') mime = 'text/css';
    if (ext === '.js' || ext === '.mjs') mime = 'application/javascript';
    if (ext === '.png') mime = 'image/png';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, async () => {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const debuggingPort = 9232;
  const userDataDir = path.resolve('C:/Users/HP/AppData/Local/Temp/chrome-test-pages-' + Date.now());

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    let tData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const tRes = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?about:blank`, { method: 'PUT' });
        tData = await tRes.json();
        if (tData && tData.webSocketDebuggerUrl) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        const handler = (e) => {
          const res = JSON.parse(e.data);
          if (res.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await send('Emulation.setDeviceMetricsOverride', {
      width: 794, // A4 width in pixels at 96 DPI (210mm)
      height: 1123, // A4 height in pixels at 96 DPI (297mm)
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `http://localhost:${PORT}/daftar-token-akses-internal.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Get document height
    const docHeight = await send('Runtime.evaluate', {
      expression: 'document.documentElement.scrollHeight'
    });
    console.log('Emulated print scrollHeight:', docHeight.result.value);

    // Let's capture screenshots in increments of 1123px (A4 height)
    const totalHeight = docHeight.result.value;
    const a4Height = 1123;
    let pageNum = 1;
    for (let y = 0; y < totalHeight; y += a4Height) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo(0, ${y})`
      });
      await new Promise(r => setTimeout(r, 400));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const p = `C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d/print_page_${pageNum}.png`;
      fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
      console.log(`Saved print_page_${pageNum}.png at y=${y}`);
      pageNum++;
    }

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chromeProc.kill();
    server.close();
    process.exit(0);
  }
});
