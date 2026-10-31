import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8102;
const server = http.createServer((req, res) => {
  const filePath = path.resolve('daftar-token-akses-internal.html');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const debuggingPort = 9235;
  const userDataDir = path.resolve('C:/Users/HP/AppData/Local/Temp/chrome-test-measure3-' + Date.now());

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const tRes = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?about:blank`, { method: 'PUT' });
    const tData = await tRes.json();
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
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `http://localhost:${PORT}` });
    await new Promise(r => setTimeout(r, 2000));

    const measurements = await send('Runtime.evaluate', {
      expression: `(() => {
        const sections = Array.from(document.querySelectorAll('section'));
        const header = document.querySelector('header');
        const alert = document.querySelector('div[class*="rose-500"]');
        const res = [
          { name: 'Header', height: header ? header.offsetHeight : 0 },
          { name: 'Alert Box', height: alert ? alert.offsetHeight : 0 }
        ];
        sections.forEach((s, i) => {
          const h = s.querySelector('h2, h3');
          res.push({
            name: 'Section ' + i + ': ' + (h ? h.innerText.substring(0, 35) : 'Unknown'),
            height: s.offsetHeight
          });
        });
        return res;
      })()`,
      returnByValue: true
    });

    console.log('Measurements:', measurements.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chromeProc.kill();
    server.close();
    process.exit(0);
  }
});
