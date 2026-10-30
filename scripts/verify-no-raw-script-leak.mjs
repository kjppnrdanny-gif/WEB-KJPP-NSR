import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const PORT = 8240;
const DEBUG_PORT = 9490;

function createServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.html': 'text/html; charset=UTF-8',
      '.js': 'application/javascript; charset=UTF-8',
      '.css': 'text/css; charset=UTF-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function runAudit() {
  console.log('================================================================');
  console.log('🔍 AUDIT ANTI-KEBOCORAN KODE JAVASCRIPT & VALIDASI SINTAKS BROWSER');
  console.log('================================================================');

  const server = createServer();
  await new Promise(r => server.listen(PORT, r));
  console.log(`[INFO] Server HTTP aktif di http://127.0.0.1:${PORT}`);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
  ]);

  let wsUrl = '';
  await new Promise((resolve, reject) => {
    chrome.stderr.on('data', data => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        wsUrl = match[1];
        resolve();
      }
    });
    setTimeout(() => {
      if (!wsUrl) reject(new Error('Timeout saat menghubungkan ke Chrome DevTools'));
    }, 6000);
  });

  console.log('[INFO] Chrome DevTools Connected.');

  try {
    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const listData = await listRes.json();
    const pageTarget = listData.find(p => p.type === 'page') || listData[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    const consoleErrors = [];

    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result !== undefined ? m.result : m);
      }
      if (m.method === 'Runtime.exceptionThrown') {
        consoleErrors.push({
          text: m.params.exceptionDetails.text,
          description: m.params.exceptionDetails.exception?.description || '',
          url: m.params.exceptionDetails.url,
          line: m.params.exceptionDetails.lineNumber
        });
      }
    };

    const send = (method, params = {}) =>
      new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const forbiddenSubstrings = [
      'function cetakSuratTugas',
      'DUAL SMART MITIGATION',
      'function bukaModalNotifikasiApprovalJo',
      'win.document.close()',
      'document.getElementById',
      'Backend email dispatch fallback:',
      'n\\<\\/html\\>',
      '\\<\\/script\\>'
    ];

    const pagesToTest = [
      {
        url: `http://127.0.0.1:${PORT}/portal-nolap.html`,
        name: 'portal-nolap.html',
        screenshot: 'bukti_live_portal_nolap_bersih.png'
      },
      {
        url: `http://127.0.0.1:${PORT}/portal-penugasan-jo.html`,
        name: 'portal-penugasan-jo.html',
        screenshot: 'bukti_live_portal_penugasan_jo_bersih.png'
      },
      {
        url: `http://127.0.0.1:${PORT}/portal-spk.html`,
        name: 'portal-spk.html',
        screenshot: 'bukti_live_portal_spk_bersih.png'
      }
    ];

    let allTestsPassed = true;

    for (const page of pagesToTest) {
      console.log(`\n------------------------------------------------------------`);
      console.log(`🧪 Menguji Halaman: ${page.name}`);
      console.log(`------------------------------------------------------------`);

      consoleErrors.length = 0; // reset errors
      await send('Page.navigate', { url: page.url });
      await sleep(2500);

      // 1. Periksa Uncaught Exceptions
      const syntaxErrors = consoleErrors.filter(e =>
        e.description.includes('SyntaxError') || e.text.includes('Uncaught')
      );
      if (syntaxErrors.length > 0) {
        console.error(`❌ [GAGAL] Terdeteksi Uncaught Error di console pada ${page.name}:`, syntaxErrors);
        allTestsPassed = false;
      } else {
        console.log(`✅ [LULUS] Console bebas dari SyntaxError & Uncaught Error.`);
      }

      // 2. Ambil innerText dari document.body (Hanya teks yang tampil di layar, tag <script> tidak termasuk)
      const bodyTextEval = await send('Runtime.evaluate', {
        expression: 'document.body ? document.body.innerText : ""',
        returnByValue: true
      });
      const bodyText = bodyTextEval.result?.value || '';

      // 3. Pindai substring terlarang pada teks yang tampil
      let leakedSubstrings = [];
      for (const forbidden of forbiddenSubstrings) {
        if (bodyText.includes(forbidden)) {
          leakedSubstrings.push(forbidden);
        }
      }

      if (leakedSubstrings.length > 0) {
        console.error(`❌ [GAGAL] Kebocoran teks kode JavaScript terdeteksi pada ${page.name}!`);
        console.error(`   Substring bocor yang ditemukan di layar:`, leakedSubstrings);
        allTestsPassed = false;
      } else {
        console.log(`✅ [LULUS] document.body.innerText 100% STERIL dari kebocoran kode skrip!`);
      }

      // 4. Tangkap screenshot bukti visual
      const ssRes = await send('Page.captureScreenshot', { format: 'png' });
      const ssPath = path.join(ARTIFACTS_DIR, page.screenshot);
      fs.writeFileSync(ssPath, Buffer.from(ssRes.data, 'base64'));
      console.log(`📸 [SNAPSHOT] Bukti visual tersimpan di: ${page.screenshot}`);
    }

    console.log('\n============================================================');
    if (allTestsPassed) {
      console.log('🏆 SEMUA PENGUJIAN LULUS 100%! TIDAK ADA KEBOCORAN KODE!');
      console.log('============================================================\n');
    } else {
      console.error('💥 PENGUJIAN GAGAL! Periksa log kesalahan di atas.');
      console.error('============================================================\n');
      process.exitCode = 1;
    }

    ws.close();
  } catch (err) {
    console.error('Fatal error during audit:', err);
    process.exitCode = 1;
  } finally {
    chrome.kill();
    server.close();
  }
}

runAudit();
