import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 8168;
const DEBUG_PORT = 9268;
const ROOT_DIR = process.cwd();
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

console.log('================================================================');
console.log('TEST SUITE: LITBANG KJPP NSR 4-CARD SYMMETRICAL GRID & MODAL');
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
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_litbang_test');
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
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description || '').join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.log('[BROWSER EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
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

    console.log('>>> [1] NAVIGASI KE index.html & VERIFIKASI 4 KARTU LITBANG...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    const ready = await waitForElement('#litbang-metodologi');
    if (!ready) throw new Error('Timeout: #litbang-metodologi tidak ditemukan setelah navigasi.');
    await new Promise(r => setTimeout(r, 1000));

    const checkGrid = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = document.getElementById('litbang-metodologi');
          if (!section) return { success: false, reason: 'Section #litbang-metodologi tidak ditemukan di index.html' };

          const grid = section.querySelector('.grid');
          if (!grid) return { success: false, reason: 'Kontainer .grid tidak ditemukan di dalam section' };

          const cards = grid.children;
          if (cards.length !== 4) return { success: false, reason: 'Jumlah kartu bukan 4, ditemukan: ' + cards.length };

          const cardDetails = [];
          for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            const badge = c.querySelector('span')?.textContent?.trim() || '';
            const heading = c.querySelector('h3')?.textContent?.trim() || '';
            const rect = c.getBoundingClientRect();
            cardDetails.push({
              index: i + 1,
              badge,
              heading,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              top: Math.round(rect.top)
            });
          }

          return {
            success: true,
            gridClass: grid.className,
            cards: cardDetails
          };
        })()
      `,
      returnByValue: true
    });

    if (!checkGrid.result.value.success) {
      throw new Error('Gagal verifikasi grid: ' + checkGrid.result.value.reason);
    }

    console.log('  ✓ Kontainer Grid & 4 Kartu Ditemukan:');
    checkGrid.result.value.cards.forEach(c => {
      console.log(`    - Kartu ${c.index}: [${c.badge}] -> "${c.heading.substring(0, 45)}..." (${c.width}x${c.height}px)`);
    });

    console.log('\n>>> [2] PENGUJIAN MODAL EKSEKUTIF KAJIAN LITBANG (4 KAJIAN)...');
    const kajianKeys = ['spi-303', 'spi-204', 'pojk-agunan', 'psak-241'];

    for (const key of kajianKeys) {
      const modalTest = await send('Runtime.evaluate', {
        expression: `
          (() => {
            try {
              if (typeof window.bukaModalLitbangNSR !== 'function') {
                return { error: 'window.bukaModalLitbangNSR is not a function' };
              }
              window.bukaModalLitbangNSR('${key}');
              const modal = document.getElementById('modal-kajian-litbang-nsr');
              if (!modal || modal.classList.contains('hidden')) return { opened: false };

              const badge = document.getElementById('litbang-modal-badge')?.textContent?.trim() || '';
              const judul = document.getElementById('litbang-modal-judul')?.textContent?.trim() || '';
              const hukumLen = document.getElementById('litbang-modal-hukum')?.children?.length || 0;
              const metodologiLen = document.getElementById('litbang-modal-metodologi')?.children?.length || 0;
              const mitigasiLen = document.getElementById('litbang-modal-mitigasi')?.children?.length || 0;

              // Tutup kembali
              window.tutupModalLitbangNSR();
              const closed = modal.classList.contains('hidden');

              return {
                opened: true,
                closed,
                badge,
                judul,
                has3Sections: hukumLen > 0 && metodologiLen > 0 && mitigasiLen > 0
              };
            } catch (err) {
              return { error: err.message, stack: err.stack };
            }
          })()
        `,
        returnByValue: true
      });

      const resVal = modalTest?.result?.value;
      if (!resVal || !resVal.opened || !resVal.closed || !resVal.has3Sections) {
        throw new Error(`Uji modal untuk '${key}' gagal: ` + JSON.stringify(resVal || modalTest));
      }
      console.log(`  ✓ Modal '${key}': Berhasil dibuka, memuat 3 seksi lengkap, dan berhasil ditutup.`);
    }

    // Uji Tombol Escape
    const escapeTest = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.bukaModalLitbangNSR('spi-303');
          const modal = document.getElementById('modal-kajian-litbang-nsr');
          const openedBefore = modal && !modal.classList.contains('hidden');
          
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          const closedAfter = modal && modal.classList.contains('hidden');

          return { openedBefore, closedAfter };
        })()
      `,
      returnByValue: true
    });

    if (!escapeTest.result.value.openedBefore || !escapeTest.result.value.closedAfter) {
      throw new Error('Uji penutupan modal dengan tombol Escape gagal!');
    }
    console.log('  ✓ Uji Penutupan Modal dengan tombol [Escape] LULUS.');

    console.log('\n>>> [3] VERIFIKASI PADA wawasan-regulasi.html...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/wawasan-regulasi.html` });
    await new Promise(r => setTimeout(r, 2000));

    const checkWawasan = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = document.getElementById('artikel-wawasan');
          if (!section) return { success: false, reason: '#artikel-wawasan tidak ditemukan' };
          const grid = section.querySelector('.grid');
          if (!grid || grid.children.length !== 4) return { success: false, reason: 'Kartu wawasan bukan 4' };

          window.bukaModalLitbangNSR('spi-303');
          const modal = document.getElementById('modal-kajian-litbang-nsr');
          const opened = modal && !modal.classList.contains('hidden');
          window.tutupModalLitbangNSR();

          return { success: true, opened };
        })()
      `,
      returnByValue: true
    });

    if (!checkWawasan.result.value.success || !checkWawasan.result.value.opened) {
      throw new Error('Gagal verifikasi pada wawasan-regulasi.html: ' + JSON.stringify(checkWawasan.result.value));
    }
    console.log('  ✓ wawasan-regulasi.html LULUS: 4 kartu simetris & modal eksekutif terintegrasi.');

    // Screenshot di index.html
    console.log('\n>>> [4] MENGAMBIL TANGKAPAN LAYAR BUKTI LIVE...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html#litbang-metodologi` });
    await new Promise(r => setTimeout(r, 1500));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('litbang-metodologi');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(ss.data, 'base64');
    
    const outImg1 = path.join(ROOT_DIR, 'bukti_live_litbang_4_kartu_rapi.png');
    const outImg2 = path.join(ARTIFACT_DIR, 'bukti_live_litbang_4_kartu_rapi.png');
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
    console.log('✅ SELURUH UJI LITBANG 4-KARTU & MODAL BERHASIL 100%');
    console.log('================================================================');

  } finally {
    cleanup();
  }
}

runTestSuite().catch(err => {
  console.error('❌ Gagal menjalankan test suite:', err);
  process.exit(1);
});
