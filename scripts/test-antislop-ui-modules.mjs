import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 8185;
const DEBUG_PORT = 9285;
const ROOT_DIR = process.cwd();
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

console.log('================================================================');
console.log('TEST SUITE: ANTISLOP-UI 3 MODUL BERSIH, CORPORATE & INTERAKTIF');
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
  console.log(`[SERVER] Local Test Server listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_antislop_ui_test');
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
    '--window-size=1440,900',
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
            if (!text.includes('cdn.tailwindcss.com') && !text.includes('favicon.png')) {
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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('[NAV] Navigating to http://localhost:' + PORT + '/index.html...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    
    // Polling tunggu sampai DOM parsed dan elemen target ada
    console.log('[WAIT] Menunggu dokumen siap...');
    let ready = false;
    for (let i = 0; i < 40; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `(document.readyState === 'complete' || document.readyState === 'interactive') && !!document.getElementById('alur-penugasan-sop')`,
        returnByValue: true
      });
      if (check && check.result && check.result.value === true) {
        ready = true;
        break;
      }
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`[STATUS] Dokumen siap: ${ready}`);

    // ==========================================
    // UJI 1: INTEGRITAS IDENTITAS HEADER PMK
    // ==========================================
    console.log('\n--- UJI 1: VERIFIKASI IDENTITAS RESMI PMK PADA HEADER ---');
    const headerCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          return {
            hasKJPP: text.includes('KANTOR JASA PENILAI PUBLIK') || text.includes('Kantor Jasa Penilai Publik'),
            hasKMK: text.includes('2.19.0160'),
            hasNanang: text.includes('NANANG RAHAYU') || text.includes('Nanang Rahayu'),
            hasWilayah: text.includes('Negara Kesatuan Republik Indonesia') || text.includes('Seluruh Indonesia')
          };
        })()
      `,
      returnByValue: true
    });

    const hRes = headerCheck.result.value;
    console.log(`[CHECK] Frasa Kantor Jasa Penilai Publik: ${hRes.hasKJPP}`);
    console.log(`[CHECK] Nomor Izin Usaha Kemenkeu RI 2.19.0160: ${hRes.hasKMK}`);
    console.log(`[CHECK] Nama Rekanan Pemimpin Ir. Nanang Rahayu: ${hRes.hasNanang}`);
    console.log(`[CHECK] Wilayah Kerja NKRI: ${hRes.hasWilayah}`);

    if (!hRes.hasKJPP || !hRes.hasKMK || !hRes.hasNanang || !hRes.hasWilayah) {
      throw new Error('Audit Gagal: Identitas resmi PMK pada header terganggu!');
    }
    console.log('✔ SUKSES: Identitas resmi PMK Kemenkeu RI pada header 100% terjaga utuh.');

    // ==========================================
    // UJI 2: MODUL 1 - ALUR PENUGASAN (5 TAHAP)
    // ==========================================
    console.log('\n--- UJI 2: MODUL 1 — ALUR PENUGASAN PENILAIAN RESMI (5 TAHAP) ---');
    const flowCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = document.getElementById('alur-penugasan-sop');
          if (!section) return { found: false };
          const cards = Array.from(section.querySelectorAll('.nsr-flow-card'));
          const line = section.querySelector('.nsr-flow-line');
          const stages = cards.map(c => {
            const num = c.querySelector('.nsr-flow-num')?.textContent.trim();
            const h4 = c.querySelector('h4')?.textContent.trim();
            const p = c.querySelector('p')?.textContent.trim();
            return { num, h4, p };
          });
          return {
            found: true,
            hasLine: !!line,
            cardCount: cards.length,
            stages: stages
          };
        })()
      `,
      returnByValue: true
    });

    const fRes = flowCheck.result.value;
    console.log(`[CHECK] Seksi #alur-penugasan-sop ditemukan: ${fRes.found}`);
    console.log(`[CHECK] Garis konektor linear (.nsr-flow-line): ${fRes.hasLine}`);
    console.log(`[CHECK] Jumlah kartu tahap: ${fRes.cardCount}`);
    fRes.stages.forEach(s => {
      console.log(`   * ${s.num} — ${s.h4}: ${s.p.slice(0, 60)}...`);
    });

    if (!fRes.found || fRes.cardCount !== 5 || !fRes.hasLine) {
      throw new Error('Audit Gagal: Modul 1 alur penugasan tidak sesuai spesifikasi 5 kartu!');
    }
    console.log('✔ SUKSES: Modul 1 Alur Penugasan Penilaian Resmi (5 Tahap Linear Track) terverifikasi sempurna.');

    // ==========================================
    // UJI 3: MODUL 2 - KAJIAN TEKNIS SPI (3 KOLOM) & MODAL
    // ==========================================
    console.log('\n--- UJI 3: MODUL 2 — KAJIAN TEKNIS SPI (EXECUTIVE RESEARCH CARDS) ---');
    const litbangCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = document.getElementById('litbang-metodologi');
          if (!section) return { found: false };
          const cards = Array.from(section.querySelectorAll('.nsr-spi-card'));
          const cardData = cards.map(c => {
            const badge = c.querySelector('.nsr-spi-badge')?.textContent.trim();
            const title = c.querySelector('h4')?.textContent.trim();
            return { badge, title };
          });
          return {
            found: true,
            cardCount: cards.length,
            cards: cardData
          };
        })()
      `,
      returnByValue: true
    });

    const lRes = litbangCheck.result.value;
    console.log(`[CHECK] Seksi #litbang-metodologi ditemukan: ${lRes.found}`);
    console.log(`[CHECK] Jumlah kartu kajian teknis: ${lRes.cardCount}`);
    lRes.cards.forEach((c, idx) => {
      console.log(`   [Card ${idx + 1}] ${c.badge} -> "${c.title}"`);
    });

    if (!lRes.found || lRes.cardCount !== 3) {
      throw new Error('Audit Gagal: Modul 2 harus memiliki tepat 3 kartu kajian eksekutif!');
    }

    // Uji trigger modal baca teknis
    console.log('[CHECK] Menguji trigger modal eksekutif kajian litbang untuk "kepi"...');
    await send('Runtime.evaluate', {
      expression: `window.bukaModalLitbangNSR('kepi');`
    });
    await new Promise(r => setTimeout(r, 400));

    const modalState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-kajian-litbang-nsr');
          const isVisible = modal && !modal.classList.contains('hidden');
          const title = document.getElementById('litbang-modal-judul')?.textContent.trim();
          const badge = document.getElementById('litbang-modal-badge')?.textContent.trim();
          return { isVisible, title, badge };
        })()
      `,
      returnByValue: true
    });

    console.log(`[CHECK] Modal terbuka: ${modalState.result.value.isVisible}`);
    console.log(`[CHECK] Modal Judul: "${modalState.result.value.title}"`);
    console.log(`[CHECK] Modal Badge: "${modalState.result.value.badge}"`);

    if (!modalState.result.value.isVisible || !modalState.result.value.title.includes('Benturan Kepentingan')) {
      throw new Error('Audit Gagal: Modal baca litbang tidak menampilkan konten kajian kepi secara benar!');
    }

    // Tutup modal
    await send('Runtime.evaluate', {
      expression: `window.tutupModalLitbangNSR();`
    });
    console.log('✔ SUKSES: Modul 2 Kajian Teknis SPI (3 Kolom) & Modal Telaah Teknis terintegrasi akurat.');

    // ==========================================
    // UJI 4: MODUL 3 - REGULASI RESMI TABBED MATRIX (4 PILAR)
    // ==========================================
    console.log('\n--- UJI 4: MODUL 3 — REGULASI RESMI & DASAR HUKUM (4 TABBED MATRIX) ---');
    const tabsCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = document.getElementById('dasar-hukum');
          if (!section) return { found: false };
          const buttons = Array.from(section.querySelectorAll('.nsr-reg-btn')).map(b => b.textContent.trim());
          const panels = Array.from(section.querySelectorAll('.nsr-reg-panel')).map(p => ({
            id: p.id,
            itemCount: p.querySelectorAll('.nsr-reg-item').length
          }));
          return {
            found: true,
            tabCount: buttons.length,
            tabLabels: buttons,
            panels: panels
          };
        })()
      `,
      returnByValue: true
    });

    const tRes = tabsCheck.result.value;
    console.log(`[CHECK] Seksi #dasar-hukum ditemukan: ${tRes.found}`);
    console.log(`[CHECK] Jumlah Tab: ${tRes.tabCount} -> ${tRes.tabLabels.join(' | ')}`);
    tRes.panels.forEach(p => {
      console.log(`   * Panel #${p.id}: ${p.itemCount} regulasi items`);
    });

    if (!tRes.found || tRes.tabCount !== 4 || tRes.panels.length !== 4) {
      throw new Error('Audit Gagal: Modul 3 harus memiliki 4 Tab Regulator dan 4 Panel!');
    }

    // Uji klik tab OJK dan MAPPI
    console.log('[CHECK] Menguji perpindahan interaktif ke Tab 2 (OJK)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btnOjk = document.querySelectorAll('.nsr-reg-btn')[1];
          btnOjk.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));

    const ojkActive = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panelOjk = document.getElementById('tab-ojk');
          return panelOjk && panelOjk.style.display !== 'none' && panelOjk.classList.contains('active');
        })()
      `,
      returnByValue: true
    });

    if (!ojkActive.result.value) {
      throw new Error('Audit Gagal: Tab OJK tidak aktif setelah diklik!');
    }
    console.log('   -> Tab OJK berhasil aktif dan panel ditampilkan.');

    console.log('[CHECK] Menguji perpindahan interaktif ke Tab 4 (MAPPI)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btnMappi = document.querySelectorAll('.nsr-reg-btn')[3];
          btnMappi.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));

    const mappiActive = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panelMappi = document.getElementById('tab-standar');
          return panelMappi && panelMappi.style.display !== 'none' && panelMappi.classList.contains('active');
        })()
      `,
      returnByValue: true
    });

    if (!mappiActive.result.value) {
      throw new Error('Audit Gagal: Tab MAPPI tidak aktif setelah diklik!');
    }
    console.log('   -> Tab MAPPI berhasil aktif dan panel ditampilkan.');
    console.log('✔ SUKSES: Modul 3 Regulasi Resmi (Tabbed Matrix 4 Pilar) interaktif dan berfungsi sempurna.');

    // ==========================================
    // SCREENSHOT: BUKTI LIVE ANTISLOP UI MODULES
    // ==========================================
    console.log('\n--- MENGAMBIL SCREENSHOT LIVE 3 MODUL BERSIH ---');
    // Scroll ke seksi alur penugasan
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = document.getElementById('alur-penugasan-sop');
          if (section) section.scrollIntoView({ block: 'start' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const screenshotData = await send('Page.captureScreenshot', {
      format: 'png',
      quality: 90,
      fromSurface: true
    });

    const screenshotBuffer = Buffer.from(screenshotData.data, 'base64');
    const localScreenshotPath = path.join(ROOT_DIR, 'bukti_live_antislop_ui_modules.png');
    const artifactScreenshotPath = path.join(ARTIFACT_DIR, 'bukti_live_antislop_ui_modules.png');

    fs.writeFileSync(localScreenshotPath, screenshotBuffer);
    fs.writeFileSync(artifactScreenshotPath, screenshotBuffer);
    console.log(`✔ SCREENSHOT DISIMPAN: ${localScreenshotPath}`);
    console.log(`✔ SCREENSHOT ARTIFACT: ${artifactScreenshotPath}`);

    console.log('\n================================================================');
    console.log('SEMUA UJI ANTISLOP-UI PADA 3 MODUL UTAMA LOLOS 100%!');
    console.log('================================================================');

  } finally {
    cleanup();
  }
}

runTestSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
