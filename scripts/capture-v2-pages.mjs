import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8108;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  fs.createReadStream('daftar-token-akses-internal.html').pipe(res);
});

server.listen(PORT, async () => {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const debuggingPort = 9241;
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=C:/Users/HP/AppData/Local/Temp/chrome-pages7-${Date.now()}`,
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
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 794,
    height: 1123,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: `http://localhost:${PORT}` });
  await new Promise(r => setTimeout(r, 2000));

  for (let p = 0; p < 7; p++) {
    const y = p * 1123;
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` });
    await new Promise(r => setTimeout(r, 300));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = `C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d/a4_page_v2_${p+1}.png`;
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved a4_page_v2_${p+1}.png at y=${y}`);
  }

  ws.close();
  chromeProc.kill();
  server.close();
  process.exit(0);
});
