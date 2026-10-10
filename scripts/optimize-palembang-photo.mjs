import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (fs.existsSync(filePath)) {
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

await new Promise(r => server.listen(8098, '127.0.0.1', r));

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9247',
  '--no-sandbox',
  'about:blank'
]);

try {
  await new Promise(r => setTimeout(r, 1500));
  const targetRes = await fetch('http://127.0.0.1:9247/json/new?about:blank', { method: 'PUT' });
  const targetData = await targetRes.json();
  const ws = new WebSocket(targetData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise(res => {
      const id = msgId++;
      const handler = e => {
        const m = JSON.parse(e.data);
        if (m.id === id) { ws.removeEventListener('message', handler); res(m); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  const base64Jpg = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = 'http://127.0.0.1:8098/images/kegiatan/palembang-tim-operasional.jpg';
        });

        // Target: 1280x960 (4:3 aspect ratio matching the team photo)
        const targetW = 1280;
        const targetH = Math.round(targetW * (img.naturalHeight / img.naturalWidth));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);
        return canvas.toDataURL('image/jpeg', 0.88);
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('base64Jpg raw:', JSON.stringify(base64Jpg));
  const dataUrl = base64Jpg.result?.result?.value || base64Jpg.result?.value;
  if (!dataUrl) {
    console.error('CDP evaluation failed:', JSON.stringify(base64Jpg));
    process.exit(1);
  }
  const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
  const outPath = path.join(ROOT_DIR, 'images/kegiatan/palembang-tim-operasional.jpg');
  fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
  console.log('Optimized palembang-tim-operasional.jpg written. New size:', fs.statSync(outPath).size, 'bytes');

  ws.close();
} finally {
  chrome.kill('SIGKILL');
  server.close();
}
