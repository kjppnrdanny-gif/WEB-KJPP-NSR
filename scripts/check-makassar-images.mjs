import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/portofolio-rekanan.html';
  const f = path.join(ROOT_DIR, p);
  if (fs.existsSync(f) && !fs.statSync(f).isDirectory()) {
    res.writeHead(200);
    fs.createReadStream(f).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise(r => server.listen(8205, '127.0.0.1', r));

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9457',
  '--no-sandbox',
  'about:blank'
]);
await new Promise(r => setTimeout(r, 1500));

const targetRes = await fetch('http://127.0.0.1:9457/json/new?about:blank', { method: 'PUT' });
const targetData = await targetRes.json();
const ws = new WebSocket(targetData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
const send = (method, params = {}) => new Promise(res => {
  const curId = id++;
  const handler = (e) => {
    const data = JSON.parse(e.data);
    if (data.id === curId) {
      ws.removeEventListener('message', handler);
      res(data.result);
    }
  };
  ws.addEventListener('message', handler);
  ws.send(JSON.stringify({ id: curId, method, params }));
});

await send('Page.enable');
await send('Network.enable');

// Log network requests and errors
ws.addEventListener('message', (e) => {
  const d = JSON.parse(e.data);
  if (d.method === 'Network.requestWillBeSent') {
    if (d.params.request.url.includes('makassar')) {
      console.log('REQ:', d.params.request.url);
    }
  }
  if (d.method === 'Network.responseReceived') {
    if (d.params.response.url.includes('makassar')) {
      console.log('RESP:', d.params.response.url, d.params.response.status);
    }
  }
  if (d.method === 'Network.loadingFailed') {
    console.log('FAIL:', d.params);
  }
});

await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false
});

await send('Page.navigate', { url: 'http://127.0.0.1:8205/portofolio-rekanan.html#galeri-kegiatan' });
await new Promise(r => setTimeout(r, 2000));

await send('Runtime.evaluate', {
  expression: `document.getElementById('galeri-kegiatan').scrollIntoView();`
});
await new Promise(r => setTimeout(r, 1500));

const res = await send('Runtime.evaluate', {
  expression: `(() => {
    return Array.from(document.querySelectorAll('#galeri-kegiatan img')).map((img, i) => ({
      i,
      src: img.getAttribute('src'),
      loading: img.getAttribute('loading'),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
  })()`,
  returnByValue: true
});

console.log('Result:', JSON.stringify(res.result.value, null, 2));

chrome.kill();
server.close();
process.exit(0);
