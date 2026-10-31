import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

const PORT = 8111;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/pdf' });
  fs.createReadStream('test-current.pdf').pipe(res);
});

server.listen(PORT, async () => {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const debuggingPort = 9244;
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=C:/Users/HP/AppData/Local/Temp/chrome-pdf-thumb-${Date.now()}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const tRes = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?about:blank`, { method: 'PUT' });
  const tData = await tRes.json();
  const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const curId = id++;
      const handler = e => {
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://localhost:${PORT}` });
  await new Promise(r => setTimeout(r, 3500));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d/pdf_overview_thumbnails.png', Buffer.from(shot.data, 'base64'));
  console.log('PDF overview saved!');

  ws.close();
  chromeProc.kill();
  server.close();
  process.exit(0);
});
