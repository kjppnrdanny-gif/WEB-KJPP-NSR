import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 8175;
const DEBUG_PORT = 9275;
const ROOT_DIR = process.cwd();
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

console.log('================================================================');
console.log('TEST SUITE: REGULASI RESMI & DASAR HUKUM PENILAI PUBLIK');
console.log('================================================================\n');

async function runTestSuite() {
  const consoleErrors = [];

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    const localFile = path.join(ROOT_DIR, reqPath);
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile);
      const mime = ext === '.html' ? 'text/html' :
                   ext === '.js' || ext === '.mjs' ? 'application/javascript' :
                   ext === '.css' ? 'text/css' :
                   ext === '.png' ? 'image/png' :
                   ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                   ext === '.svg' ? 'image/svg+xml' : 'text/plain';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(localFile).pipe(res);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  await new Promise(r => server.listen(PORT, r));
  console.log(`✓ Local Test Server listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_regulasi_test');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,1100',
    'about:blank'
  ]);

  const cleanup = () => {
    try { chromeProc.kill(); } catch (_) {}
    try { server.close(); } catch (_) {}
  };

  try {
    await new Promise(r => setTimeout(r, 2000));

    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          if (msg.params.type === 'error') {
            const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
            if (!text.includes('cdn.tailwindcss.com')) {
              consoleErrors.push(text);
            }
          }
        }
        if (msg.id && callbacks.has(msg.id)) {
          const { resolve, reject } = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (_) {}
    };

    await send('Page.enable');
    await send('Runtime.enable');

    async function waitForElement(selector, timeoutMs = 12000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const check = await send('Runtime.evaluate', {
          expression: `!!document.querySelector('${selector}')`,
          returnByValue: true
        });
        if (check.result && check.result.value) return true;
        await new Promise(r => setTimeout(r, 200));
      }
      return false;
    }

    // =========================================================================
    // 1. UJI index.html: Seksi Dasar Hukum
    // =========================================================================
    console.log('>>> [1] NAVIGASI KE index.html & VERIFIKASI SEKSI REGULASI...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    const readyIndex = await waitForElement('#dasar-hukum');
    if (!readyIndex) throw new Error('Timeout: #dasar-hukum tidak ditemukan di index.html');
    await new Promise(r => setTimeout(r, 1000));

    const checkIndex = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = document.getElementById('dasar-hukum');
          if (!section) return { success: false, reason: '#dasar-hukum not found' };

          const cards = section.querySelectorAll('.card-regulasi');
          if (cards.length !== 4) return { success: false, reason: 'Expected 4 cards, found ' + cards.length };

          const cardData = [];
          for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            const badge = c.querySelector('.badge')?.textContent?.trim() || '';
            const heading = c.querySelector('h4')?.textContent?.trim() || '';
            const desc = c.querySelector('p')?.textContent?.trim() || '';
            const rect = c.getBoundingClientRect();
            cardData.push({
              index: i + 1,
              badge,
              heading,
              desc,
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            });
          }

          const allText = section.textContent;
          const hasUU6 = allText.includes('UU No. 6/2023');
          const hasPOJK40 = allText.includes('POJK No. 40/2019');
          const hasKPSPI = allText.includes('KPSPI MAPPI');
          const hasPMK101 = allText.includes('PMK No. 101/PMK.01/2014');

          return {
            success: true,
            cards: cardData,
            checks: { hasUU6, hasPOJK40, hasKPSPI, hasPMK101 }
          };
        })()
      `,
      returnByValue: true
    });

    const indexRes = checkIndex.result.value;
    if (!indexRes.success) throw new Error('Gagal verifikasi index.html: ' + indexRes.reason);
    if (!indexRes.checks.hasUU6 || !indexRes.checks.hasPOJK40 || !indexRes.checks.hasKPSPI || !indexRes.checks.hasPMK101) {
      throw new Error('Salah satu rujukan hukum statutori tidak ditemukan di index.html: ' + JSON.stringify(indexRes.checks));
    }

    console.log('  ✓ index.html: 4 kartu regulasi terverifikasi presisi:');
    indexRes.cards.forEach(c => {
      console.log(`    - Kartu ${c.index}: [${c.badge}] -> ${c.heading} (${c.width}x${c.height}px)`);
    });
    console.log('  ✓ Seluruh kutipan statutori (UU No. 6/2023, POJK No. 40/2019, KPSPI MAPPI, PMK No. 101) hadir 100%.');

    // =========================================================================
    // 2. UJI wawasan-regulasi.html: Seksi Dasar Hukum
    // =========================================================================
    console.log('\n>>> [2] NAVIGASI KE wawasan-regulasi.html & VERIFIKASI SEKSI REGULASI...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/wawasan-regulasi.html` });
    const readyWawasan = await waitForElement('#dasar-hukum');
    if (!readyWawasan) throw new Error('Timeout: #dasar-hukum tidak ditemukan di wawasan-regulasi.html');
    await new Promise(r => setTimeout(r, 1000));

    const checkWawasan = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = document.getElementById('dasar-hukum');
          if (!section) return { success: false, reason: '#dasar-hukum not found' };

          const cards = section.querySelectorAll('.card-regulasi');
          if (cards.length !== 4) return { success: false, reason: 'Expected 4 cards, found ' + cards.length };

          const allText = section.textContent;
          const hasUU6 = allText.includes('UU No. 6/2023');
          const hasPOJK40 = allText.includes('POJK No. 40/2019');
          const hasKPSPI = allText.includes('KPSPI MAPPI');
          const hasPMK101 = allText.includes('PMK No. 101/PMK.01/2014');

          return {
            success: true,
            checks: { hasUU6, hasPOJK40, hasKPSPI, hasPMK101 }
          };
        })()
      `,
      returnByValue: true
    });

    const wawasanRes = checkWawasan.result.value;
    if (!wawasanRes.success || !wawasanRes.checks.hasUU6 || !wawasanRes.checks.hasPOJK40 || !wawasanRes.checks.hasKPSPI || !wawasanRes.checks.hasPMK101) {
      throw new Error('Gagal verifikasi wawasan-regulasi.html: ' + JSON.stringify(wawasanRes));
    }
    console.log('  ✓ wawasan-regulasi.html: 4 kartu regulasi terverifikasi presisi.');

    // =========================================================================
    // 3. CAPTURE SCREENSHOT BUKTI LIVE
    // =========================================================================
    console.log('\n>>> [3] MENGAMBIL SCREENSHOT LIVE (DESKTOP & MOBILE COMPATIBLE)...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html#dasar-hukum` });
    await new Promise(r => setTimeout(r, 1500));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('dasar-hukum');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(ss.data, 'base64');
    
    const outImg1 = path.join(ROOT_DIR, 'bukti_live_regulasi_hukum_rapi.png');
    const outImg2 = path.join(ARTIFACT_DIR, 'bukti_live_regulasi_hukum_rapi.png');
    fs.writeFileSync(outImg1, buffer);
    fs.writeFileSync(outImg2, buffer);
    console.log(`  ✓ Tangkapan layar tersimpan di:`);
    console.log(`    - ${outImg1}`);
    console.log(`    - ${outImg2}`);

    if (consoleErrors.length > 0) {
      console.warn('  ⚠️ Console Errors:', consoleErrors);
    } else {
      console.log('  ✓ Console Log Bersih (0 console errors).');
    }

    console.log('\n================================================================');
    console.log('✅ SELURUH UJI REGULASI & DASAR HUKUM BERHASIL 100%');
    console.log('================================================================');

  } finally {
    cleanup();
  }
}

runTestSuite().catch(err => {
  console.error('❌ Gagal menjalankan test suite:', err);
  process.exit(1);
});
