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
  '.png': 'image/png'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = 'GPS.html';
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_MAP[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
}

function saveDual(filename, buffer) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(artifactPath, buffer);
  console.log('Saved:', filename, '(' + (buffer.length / 1024).toFixed(1) + ' KB)');
}

async function run() {
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(8098, '127.0.0.1', r));
  console.log('Static server ready on http://127.0.0.1:8098');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9258',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9258/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    // 1. MOBILE VIEWPORT (390 x 844) - INITIAL UNVERIFIED STATE
    console.log('\n--- 1. MOBILE CAPTURE (INITIAL UNVERIFIED) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8098/GPS.html' });
    await new Promise(r => setTimeout(r, 2500));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_absensi_otp_mobile_initial.png', Buffer.from(shot1.data, 'base64'));

    // 2. MOBILE VIEWPORT (390 x 844) - OTP REQUESTED STATE (WAITING FOR OTP)
    console.log('\n--- 2. MOBILE CAPTURE (OTP REQUESTED STATE) ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('auth-nik-input').value = 'NSR-001';
        document.getElementById('auth-box-otp-input').classList.remove('hidden');
        document.getElementById('auth-target-email').textContent = 'b***p@gmail.com';
        document.getElementById('auth-status-pill').textContent = 'Menunggu OTP';
        document.getElementById('auth-status-pill').className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-300 border border-sky-500/30 shrink-0';
        document.getElementById('auth-otp-input').value = '482910';
        document.getElementById('gps-status-badge').textContent = 'Terkunci ✅';
        document.getElementById('gps-accuracy-text').textContent = '±8m';
        document.getElementById('gps-coord-text').textContent = '-6.287972, 106.824778';
        document.getElementById('nearest-office-name').textContent = 'Pusat Jakarta';
        document.getElementById('nearest-office-dist').textContent = '0 m';
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_absensi_otp_mobile_waiting.png', Buffer.from(shot2.data, 'base64'));

    // 3. MOBILE VIEWPORT (390 x 844) - VERIFIED ACTIVE SESSION STATE
    console.log('\n--- 3. MOBILE CAPTURE (VERIFIED ACTIVE SESSION) ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionToken = 'mock-session-token-12345';
        sessionNik = 'NSR-001';
        sessionUser = {
          nama: 'Budi Santoso, S.T.',
          jabatan: 'Penilai Properti',
          divisi: 'Divisi Penilaian Properti',
          maskedEmail: 'b***p@gmail.com'
        };
        pasangStateTerverifikasi();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_absensi_otp_mobile_verified.png', Buffer.from(shot3.data, 'base64'));

    // 4. DESKTOP VIEWPORT (1280 x 800) - DESKTOP VIEW
    console.log('\n--- 4. DESKTOP CAPTURE (1280x800) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 600));

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('preview_absensi_otp_desktop_verified.png', Buffer.from(shot4.data, 'base64'));

    console.log('Semua capture selesai dengan sukses!');
    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

run().catch(console.error);
