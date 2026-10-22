import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';

// 1. Static Local Server
function createStaticServer(port = 8765) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[Local Server] Running on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// 2. Main Test Runner with Chrome DevTools Protocol
async function runBrowserTest() {
  console.log('===============================================================');
  console.log('🧪 PENGUJIAN BROWSER RESMI: PEMULIHAN NATIVE FRONTEND PRESENSI');
  console.log('===============================================================\n');

  const PORT = 8765;
  const DEBUG_PORT = 9560;
  const server = await createStaticServer(PORT);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    console.error('❌ Chrome application not found at', chromePath);
    server.close();
    process.exit(1);
  }

  console.log('[1/5] Meluncurkan Chrome Headless pada remote debugging port', DEBUG_PORT);
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,900',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const pages = await listRes.json();
    let targetPage = pages.find(p => p.type === 'page' && p.webSocketDebuggerUrl);

    if (!targetPage) {
      // Create new page if not found
      const newPageRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
      targetPage = await newPageRes.json();
    }

    if (!targetPage || !targetPage.webSocketDebuggerUrl) {
      throw new Error('Halaman target Chrome tidak ditemukan.');
    }

    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      const onMsg = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', onMsg);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });

    const navigateAndWait = async (url) => {
      await send('Page.navigate', { url });
      // Poll until DOM is interactive
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
          const state = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
          if (state.result.value === 'interactive' || state.result.value === 'complete') {
            break;
          }
        } catch {}
      }
      await new Promise(r => setTimeout(r, 500));
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('\n[2/5] Menguji Navigasi Presensi pada Beranda (index.html)...');
    await navigateAndWait(`http://127.0.0.1:${PORT}/index.html`);

    const indexNavCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const link = document.getElementById('link-portal-absen') || document.querySelector('a[href*="portal-presensi.html"]');
        const cardTitle = document.querySelector('#kartu-presensi-wrapper h4');
        return {
          currentUrl: window.location.href,
          title: document.title,
          bodyLen: document.body ? document.body.innerHTML.length : 0,
          href: link ? link.getAttribute('href') : null,
          titleText: cardTitle ? cardTitle.innerText : null
        };
      })()`,
      returnByValue: true
    });

    const indexInfo = indexNavCheck.result.value;
    console.log('  -> Current URL in Chrome:', indexInfo.currentUrl);
    console.log('  -> Document title:', indexInfo.title);
    console.log('  -> Body length:', indexInfo.bodyLen);
    console.log('  -> Link tujuan di index.html:', indexInfo.href);
    console.log('  -> Judul kartu di index.html:', indexInfo.titleText);

    if (indexInfo.href !== 'portal-presensi.html') {
      throw new Error(`Link presensi tidak mengarah ke portal-presensi.html: ${indexInfo.href}`);
    }
    console.log('  ✔ PASS: Menu Presensi di Beranda membuka portal-presensi.html resmi!');

    console.log('\n[3/5] Membuka Portal Presensi Native (portal-presensi.html)...');
    await navigateAndWait(`http://127.0.0.1:${PORT}/portal-presensi.html`);

    // Audit struktur DOM pada portal-presensi.html
    const domAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const hasIframeGAS = document.querySelector('iframe[src*="script.google.com"]') !== null;
        const brand = document.querySelector('header span[title*="KJPP NANANG RAHAYU"]')?.innerText;
        const kmk = Array.from(document.querySelectorAll('header span')).find(s => s.innerText.includes('KMK'))?.innerText;
        const clock = document.getElementById('live-clock')?.innerText;
        const gpsDot = document.getElementById('gps-indicator-dot') !== null;
        const connPill = document.getElementById('conn-status-pill')?.innerText?.trim();
        const radarBox = document.getElementById('gps-radar-box') !== null;
        const authCard = document.getElementById('auth-card') !== null;
        const nikInput = document.getElementById('auth-nik-input') !== null;
        const btnMintaOtp = document.getElementById('btn-minta-otp') !== null;
        const tabs = [
          document.getElementById('tab-btn-absen') !== null,
          document.getElementById('tab-btn-wfh') !== null,
          document.getElementById('tab-btn-cuti') !== null,
          document.getElementById('tab-btn-riwayat') !== null
        ];
        const panels = [
          document.getElementById('panelAbsensi') !== null,
          document.getElementById('panelWFH') !== null,
          document.getElementById('panelCuti') !== null,
          document.getElementById('panelRiwayat') !== null
        ];
        const btnAbsen = document.getElementById('btnAbsen')?.innerText?.trim();

        return {
          hasIframeGAS,
          brand,
          kmk,
          clock,
          gpsDot,
          connPill,
          radarBox,
          authCard,
          nikInput,
          btnMintaOtp,
          allTabsPresent: tabs.every(Boolean),
          allPanelsPresent: panels.every(Boolean),
          btnAbsenText: btnAbsen
        };
      })()`,
      returnByValue: true
    });

    const portalState = domAudit.result.value;
    console.log('  -> Iframe raw GAS terdeteksi?:', portalState.hasIframeGAS ? 'YA (SALAH)' : 'TIDAK (BENAR - NATIVE)');
    console.log('  -> Brand Header:', portalState.brand);
    console.log('  -> Live Clock:', portalState.clock);
    console.log('  -> Status Koneksi:', portalState.connPill);
    console.log('  -> Seluruh 4 Tab Lengkap?:', portalState.allTabsPresent);
    console.log('  -> Seluruh 4 Panel Lengkap?:', portalState.allPanelsPresent);
    console.log('  -> Tombol Eksekusi:', portalState.btnAbsenText);

    if (portalState.hasIframeGAS) {
      throw new Error('GAGAL: portal-presensi.html masih memuat iframe raw GAS alih-alih UI native!');
    }
    if (!portalState.allTabsPresent || !portalState.allPanelsPresent) {
      throw new Error('GAGAL: 4 Tab & Panel native presensi tidak lengkap!');
    }
    console.log('  ✔ PASS: Frontend native berjalan 100% pada portal resmi tanpa iframe Google Script!');

    console.log('\n[4/5] Menguji Transaksi Langsung ke Google Apps Script & Google Sheets...');
    const gasVerification = await send('Runtime.evaluate', {
      expression: `(async () => {
        try {
          const res = await callBackend('cekKaryawan', { nik: 'NSR-2019-005' });
          return { success: true, res };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const gasResult = gasVerification.result.value;
    console.log('  -> Hasil verifikasi backend Google Sheets:', gasResult);
    if (!gasResult.success || (!gasResult.res.data && !gasResult.res.nama)) {
      throw new Error('Koneksi ke backend Google Apps Script / Google Sheets gagal: ' + JSON.stringify(gasResult));
    }
    const empData = gasResult.res.data || gasResult.res;
    console.log(`  -> Karyawan Terverifikasi di Google Sheets: ${empData.nama} (${empData.nikResmi || 'NSR-2019-005'})`);
    console.log('  ✔ PASS: Seluruh transaksi terhubung langsung ke Google Sheets database resmi!');

    console.log('\n[5/5] Mengambil Screenshot Bukti Visual Resolusi Desktop & Mobile...');
    
    // Screenshot Desktop
    const desktopScreenshot = await send('Page.captureScreenshot', { format: 'png' });
    const desktopPath = path.join(ARTIFACT_DIR, 'bukti-native-presensi-desktop.png');
    fs.writeFileSync(desktopPath, Buffer.from(desktopScreenshot.data, 'base64'));
    console.log('  -> Tangkapan layar desktop disimpan:', desktopPath);

    // Screenshot Mobile (390 x 844 iPhone 14)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));
    const mobileScreenshot = await send('Page.captureScreenshot', { format: 'png' });
    const mobilePath = path.join(ARTIFACT_DIR, 'bukti-native-presensi-mobile.png');
    fs.writeFileSync(mobilePath, Buffer.from(mobileScreenshot.data, 'base64'));
    console.log('  -> Tangkapan layar mobile disimpan:', mobilePath);

    ws.close();
    chromeProcess.kill();
    server.close();

    console.log('\n===============================================================');
    console.log('🎉 SEMUA PENGUJIAN BROWSER SELESAI DENGAN STATUS: 100% PASS!');
    console.log('===============================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ KESALAHAN PENGUJIAN BROWSER:', err.message);
    try { chromeProcess.kill(); } catch {}
    try { server.close(); } catch {}
    process.exit(1);
  }
}

runBrowserTest();
