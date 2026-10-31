import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8115;
const server = http.createServer((req, res) => {
  const filePath = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/daftar-token-akses-internal.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const debuggingPort = 9248;
  const userDataDir = path.resolve('C:/Users/HP/AppData/Local/Temp/chrome-final-pdf-' + Date.now());

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
    await send('Page.navigate', { url: `http://localhost:${PORT}` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Generating PDF...');
    const pdfRes = await send('Page.printToPDF', {
      paperWidth: 8.27, // A4
      paperHeight: 11.69,
      marginTop: 0.3,
      marginBottom: 0.3,
      marginLeft: 0.35,
      marginRight: 0.35,
      printBackground: true
    });

    const pdfBuffer = Buffer.from(pdfRes.data, 'base64');
    fs.writeFileSync('test-final.pdf', pdfBuffer);
    console.log('PDF saved, size:', pdfBuffer.length);

    ws.close();
  } catch (err) {
    console.error('PDF generation error:', err);
  } finally {
    chromeProc.kill();
    server.close();
    process.exit(0);
  }
});
