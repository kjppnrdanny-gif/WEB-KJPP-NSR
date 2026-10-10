import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.normalize(path.join(ROOT_DIR, pathname));
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    console.log('404:', pathname);
    res.writeHead(404);
    res.end();
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(staticServer);
await new Promise(r => server.listen(8097, '127.0.0.1', r));

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9246',
  '--no-sandbox',
  'about:blank'
]);

try {
  await new Promise(r => setTimeout(r, 1500));
  const targetRes = await fetch('http://127.0.0.1:9246/json/new?about:blank', { method: 'PUT' });
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

  await send('Page.navigate', { url: 'http://127.0.0.1:8097/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  const testLoad = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const photos = [
          'images/kegiatan/inspeksi/IMG_20240827_095920.jpg',
          'images/kegiatan/inspeksi/IMG_20230525_114736.jpg',
          'images/kegiatan/inspeksi/84871D33-97F0-40E8-8793-BABAF09428C7.jpg',
          'images/kegiatan/inspeksi/IMG_20200205_160435.jpg',
          'images/kegiatan/inspeksi/IMG_20221119_153708.jpg',
          'images/kegiatan/diklat/IMG_20200314_093637.jpg',
          'images/kegiatan/diklat/PKP SPI 204.jpg',
          'images/kegiatan/kemitraan/IMG_20231206_120928.jpg',
          'images/kegiatan/gathering.jpg',
          'images/kegiatan/gathering (2).jpg',
          'images/kegiatan/raker/20141122_161954.jpg',
          'images/kegiatan/kantor cabang padang.jpg',
          'images/kegiatan/palembang-tim-operasional.jpg'
        ];

        const results = await Promise.all(photos.map(src => {
          return new Promise(res => {
            const img = new Image();
            const start = performance.now();
            img.onload = () => res({ src, ok: true, w: img.naturalWidth, h: img.naturalHeight, ms: Math.round(performance.now() - start) });
            img.onerror = (e) => res({ src, ok: false, error: 'failed' });
            img.src = src;
          });
        }));
        return results;
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Image load results in browser:');
  console.table(testLoad.result.result.value);

  ws.close();
} finally {
  chrome.kill('SIGKILL');
  server.close();
}
