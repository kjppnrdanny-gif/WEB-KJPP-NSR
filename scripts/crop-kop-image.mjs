import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  if (req.url === '/img') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    fs.createReadStream(path.join(ROOT_DIR, 'images', 'kop-surat-nsr.png')).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!DOCTYPE html><html><body><img id="orig" src="/img"></body></html>');
  }
}).listen(8798);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, ['--remote-debugging-port=9337', '--headless=new', 'http://127.0.0.1:8798']);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9337/json/list')).json();
    const target = list.find(p => p.type === 'page') || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = async () => {
      // Enable Page
      ws.send(JSON.stringify({ id: 99, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 100, method: 'Page.navigate', params: { url: 'http://127.0.0.1:8798/' } }));
      await new Promise(r => setTimeout(r, 600));
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(async function() {
            try {
              const img = document.getElementById('orig');
              if (!img) return 'ERROR: img element not found';
              if (!img.complete) {
                await new Promise(r => img.onload = r);
              }
              const canvas = document.createElement('canvas');
              canvas.width = 1029;
              canvas.height = 162;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 27, 20, 1029, 162, 0, 0, 1029, 162);
              return canvas.toDataURL('image/png');
            } catch (err) {
              return 'ERROR: ' + err.message;
            }
          })()`,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    };
    ws.onmessage = (msg) => {
      const res = JSON.parse(msg.data);
      if (res.id === 1) {
        console.log('Result payload:', JSON.stringify(res).substring(0, 200));
        const dataUrl = res.result?.result?.value;
        if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.startsWith('ERROR:')) {
          console.error('Failed to get dataUrl:', dataUrl || res);
          process.exit(1);
        }
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const buf = Buffer.from(base64Data, 'base64');
        
        // Backup original if not already backed up
        const origPath = path.join(ROOT_DIR, 'images', 'kop-surat-nsr.png');
        const backupPath = path.join(ROOT_DIR, 'images', 'kop-surat-nsr.backup.png');
        if (!fs.existsSync(backupPath)) {
          fs.copyFileSync(origPath, backupPath);
          console.log('✓ Backup created:', backupPath);
        }

        // Save cropped version
        fs.writeFileSync(origPath, buf);
        console.log('✓ Cropped image saved to:', origPath, 'size:', buf.length, 'bytes');

        // Also update Kop Surat KJPP NSR.png and dist copies
        const copy1 = path.join(ROOT_DIR, 'images', 'Kop Surat KJPP NSR.png');
        const copy2 = path.join(ROOT_DIR, 'images', 'kop-surat-nsr-resmi.png');
        fs.writeFileSync(copy1, buf);
        fs.writeFileSync(copy2, buf);
        console.log('✓ Updated sibling copies in images/');

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
