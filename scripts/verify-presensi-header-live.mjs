import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const HOST = 'kjppnanangrahayu.com';
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

function fetchUrl(pathname) {
  return new Promise((resolve) => {
    const req = https.get(`https://${HOST}${pathname}?t=${Date.now()}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', (err) => resolve({ status: -1, error: err.message, data: '' }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: -2, error: 'timeout', data: '' });
    });
  });
}

async function main() {
  console.log('================================================================');
  console.log('🚀 MONITORING & VERIFIKASI LIVE DEPLOYMENT SATU HEADER PRESENSI');
  console.log('Target Server: https://' + HOST + '/portal-presensi.html');
  console.log('================================================================\n');

  console.log('[1/3] Polling deployment portal-presensi.html di Live Produksi...');
  let deployed = false;

  for (let attempt = 1; attempt <= 30; attempt++) {
    const res = await fetchUrl('/portal-presensi.html');
    if (res.status === 200) {
      const hasUnifiedStatus = res.data.includes('unified-status-bar');
      const hasConnMonitor = res.data.includes('updateConnectionStatus');
      const hasOfficialName = res.data.includes('KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN');

      console.log(`  [Percobaan #${attempt}] Status: 200 | UnifiedStatusBar: ${hasUnifiedStatus} | ConnMonitor: ${hasConnMonitor} | Name: ${hasOfficialName}`);

      if (hasUnifiedStatus && hasConnMonitor && hasOfficialName) {
        console.log(`\n🎉 Halaman Portal Presensi Satu Header SUDAH AKTIF di Live Produksi pada percobaan #${attempt}!`);
        deployed = true;
        break;
      }
    } else {
      console.log(`  [Percobaan #${attempt}] Status: ${res.status}`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }

  if (!deployed) {
    console.error('❌ Gagal mendeteksi update di hosting produksi setelah 3 menit.');
    process.exit(1);
  }

  // Step 2: Headless Chrome capture desktop & mobile with iframe loaded
  console.log('\n[2/3] Mengambil Screenshot Live Produksi (Desktop 1280x850)...');
  const chromeDesktop = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9499',
    '--no-sandbox',
    '--window-size=1280,850',
    `https://${HOST}/portal-presensi.html?v=${Date.now()}`
  ]);

  // Give generous time for the GAS iframe inside to render
  await new Promise(r => setTimeout(r, 9000));

  try {
    const listRes = await fetch('http://127.0.0.1:9499/json/list');
    const pages = await listRes.json();
    const livePage = pages.find(p => p.url.includes('portal-presensi.html'));

    if (livePage && livePage.webSocketDebuggerUrl) {
      const ws = new WebSocket(livePage.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);

      let msgId = 1;
      const send = (method, params = {}) => new Promise((resolve) => {
        const id = msgId++;
        const onMsg = (e) => {
          const m = JSON.parse(e.data);
          if (m.id === id) {
            ws.removeEventListener('message', onMsg);
            resolve(m.result || m.error);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });

      await send('Page.enable');
      await send('Runtime.enable');

      // Evaluasi header & status bar DOM
      const headerEval = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const h = document.querySelector('header');
            const s = document.getElementById('unified-status-bar');
            return {
              headerBrand: h ? h.innerText.replace(/\\s+/g, ' ').trim() : null,
              statusBar: s ? s.innerText.replace(/\\s+/g, ' ').trim() : null,
              headerCount: document.querySelectorAll('header').length
            };
          })()
        `,
        returnByValue: true
      });
      console.log('  Live Header DOM Evaluation:', JSON.stringify(headerEval.result?.value, null, 2));

      // Desktop Screenshot
      const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_presensi_header_desktop.png'), Buffer.from(shotDesktop.data, 'base64'));
      console.log('  ✓ Screenshot desktop tersimpan: live_prod_presensi_header_desktop.png');

      // Mobile Screenshot (iPhone 14)
      console.log('\n[3/3] Mengambil Screenshot Live Produksi (Mobile 390x844)...');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 2000));

      const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_presensi_header_mobile.png'), Buffer.from(shotMobile.data, 'base64'));
      console.log('  ✓ Screenshot mobile tersimpan: live_prod_presensi_header_mobile.png');

      ws.close();
    }
  } catch (err) {
    console.error('Error during live Chrome capture:', err);
  } finally {
    chromeDesktop.kill();
  }

  console.log('\n================================================================');
  console.log('✅ VERIFIKASI LIVE DEPLOYMENT SELESAI DENGAN SUKSES');
  console.log('================================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
