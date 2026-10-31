import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8104;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  fs.createReadStream('daftar-token-akses-internal.html').pipe(res);
});

server.listen(PORT, async () => {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const debuggingPort = 9237;
  const userDataDir = path.resolve('C:/Users/HP/AppData/Local/Temp/chrome-test-tr2-' + Date.now());

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

    const trHeights = await send('Runtime.evaluate', {
      expression: `(() => {
        const trs = Array.from(document.querySelectorAll('table.table-master tr'));
        return trs.map((tr, i) => {
          const firstTd = tr.querySelector('td, th');
          return {
            row: i,
            offsetHeight: tr.offsetHeight,
            tdPadding: firstTd ? window.getComputedStyle(firstTd).padding : 'none',
            tdFontSize: firstTd ? window.getComputedStyle(firstTd).fontSize : 'none',
            tdLineHeight: firstTd ? window.getComputedStyle(firstTd).lineHeight : 'none'
          };
        });
      })()`,
      returnByValue: true
    });

    console.log('TR Heights in Table Master:', trHeights.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chromeProc.kill();
    server.close();
    process.exit(0);
  }
});
