import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Portal Presensi NSR - Wrapper</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0f172a;">
      <iframe id="testIframe"
              src="https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec"
              style="width:100vw;height:100vh;border:none;"
              allow="geolocation *; camera *; microphone *; clipboard-write *">
      </iframe>
    </body>
    </html>
  `);
});

server.listen(8089, async () => {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9497',
    '--no-sandbox',
    '--window-size=1280,800',
    'http://127.0.0.1:8089'
  ]);

  await new Promise(r => setTimeout(r, 8000));

  try {
    const listRes = await fetch('http://127.0.0.1:9497/json/list');
    const pages = await listRes.json();
    console.log('Pages:', pages.map(p => ({ title: p.title, url: p.url })));

    const parentPage = pages.find(p => p.url.includes('8089'));
    if (parentPage && parentPage.webSocketDebuggerUrl) {
      const ws = new WebSocket(parentPage.webSocketDebuggerUrl);
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
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\gas_iframe_preview.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved screenshot to gas_iframe_preview.png');
      ws.close();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    server.close();
  }
});
