import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8093;
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
  const debuggingPort = 9226;
  const userDataDir = path.resolve('C:/Users/HP/AppData/Local/Temp/chrome-test-twotier-slips-' + Date.now());

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
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to daftar-token-akses-internal.html...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/daftar-token-akses-internal.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to the slips section
    await send('Runtime.evaluate', {
      expression: `(() => {
        const slipHeader = document.querySelector('section.mb-8');
        if (slipHeader) slipHeader.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot of slips
    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shotRes.data, 'base64');
    const artifactPath = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d/bukti_live_slips_rekan_resmi.png';
    fs.writeFileSync(artifactPath, buffer);
    console.log('Slips screenshot saved to:', artifactPath);

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chromeProc.kill();
    server.close();
    process.exit(0);
  }
});
