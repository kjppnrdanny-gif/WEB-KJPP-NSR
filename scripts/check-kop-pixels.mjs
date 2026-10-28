import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = http.createServer((req, res) => {
  if (req.url === '/img') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    fs.createReadStream('images/kop-surat-nsr.png').pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!DOCTYPE html><html><body><img id="testimg" src="/img"></body></html>');
  }
}).listen(8799);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, ['--remote-debugging-port=9336', '--headless=new', 'http://127.0.0.1:8799']);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9336/json/list')).json();
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(async function() {
            const img = document.getElementById('testimg');
            if (!img.complete) {
              await new Promise(resolve => { img.onload = resolve; });
            }
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
            for (let y = 0; y < canvas.height; y++) {
              for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
                // Non-white and non-transparent
                const isNonWhite = a > 20 && !(r > 250 && g > 250 && b > 250);
                if (isNonWhite) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }
            return {
              naturalWidth: canvas.width,
              naturalHeight: canvas.height,
              minX, maxX, minY, maxY,
              leftPadding: minX,
              rightPadding: canvas.width - 1 - maxX,
              contentWidth: maxX - minX + 1,
              contentHeight: maxY - minY + 1
            };
          })()`,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    };
    ws.onmessage = (msg) => {
      const res = JSON.parse(msg.data);
      if (res.id === 1) {
        console.log('Image pixel analysis:', res.result?.result?.value);
        ws.close();
        proc.kill();
        server.close();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    proc.kill();
    server.close();
    process.exit(1);
  }
}, 1200);
