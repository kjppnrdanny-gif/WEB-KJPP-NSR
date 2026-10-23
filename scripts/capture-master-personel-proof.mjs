// scripts/capture-master-personel-proof.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function staticServer(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/portal-penugasan-jo.html';
  const filePath = path.join(ROOT_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
}

async function run() {
  const server = http.createServer(staticServer);
  const PORT = 8899;
  const DEBUG_PORT = 9225;

  await new Promise(r => server.listen(PORT, r));
  console.log(`Local server started at http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1100',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');

    console.log('Navigating to portal-penugasan-jo.html...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-penugasan-jo.html` });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to Section 05
    await send('Runtime.evaluate', {
      expression: `
        const s5 = document.getElementById('rekan_nama');
        if (s5) {
          s5.closest('.bg-slate-900').scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Section 05 UI screenshot
    console.log('Capturing bukti_master_personel_ui_section05.png...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const buf1 = Buffer.from(shot1.data, 'base64');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_master_personel_ui_section05.png'), buf1);
    console.log('Saved to artifact directory: bukti_master_personel_ui_section05.png');

    // Switch to Tab 3 (Pratinjau) and render Surat Tugas
    await send('Runtime.evaluate', {
      expression: `
        if (typeof pindahTab === 'function') pindahTab('tab-pratinjau');
        const sel = document.getElementById('pilih_tampilan_dokumen');
        if (sel) {
          sel.value = 'DOK3D';
          if (typeof onFilterDokumenChange === 'function') onFilterDokumenChange();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log('Capturing bukti_master_personel_surat_tugas.png...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const buf2 = Buffer.from(shot2.data, 'base64');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_master_personel_surat_tugas.png'), buf2);
    console.log('Saved to artifact directory: bukti_master_personel_surat_tugas.png');

    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
