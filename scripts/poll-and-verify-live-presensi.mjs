import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const HOST = 'kjppnanangrahayu.com';
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

function fetchUrl(path) {
  return new Promise((resolve) => {
    https.get(`https://${HOST}${path}?v=${Date.now()}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', (err) => resolve({ status: -1, error: err.message, data: '' }));
  });
}

async function run() {
  console.log('================================================================');
  console.log('🚀 MONITORING & VERIFIKASI LIVE DEPLOYMENT PORTAL PRESENSI');
  console.log('Target Server:', HOST);
  console.log('================================================================\n');

  // Step 1: Polling deployment portal-presensi.html
  console.log('[1/4] Menunggu Deployment portal-presensi.html di Live Produksi...');
  let deployed = false;
  for (let attempt = 1; attempt <= 25; attempt++) {
    const res = await fetchUrl('/portal-presensi.html');
    if (res.status === 200 && res.data.includes('Portal Presensi Kehadiran Online') && res.data.includes('presensi-frame')) {
      console.log(`  ✓ portal-presensi.html BERHASIL AKTIF di Live Produksi pada percobaan #${attempt}! (Bytes: ${res.data.length})`);
      deployed = true;
      break;
    }
    console.log(`  ... percobaan #${attempt} status: ${res.status} (sinkronisasi FTPS hosting sedang berlangsung)`);
    await new Promise(r => setTimeout(r, 4000));
  }

  if (!deployed) {
    console.error('❌ Gagal mendeteksi portal-presensi.html di hosting produksi setelah batas waktu.');
    process.exit(1);
  }

  // Step 2: Verifikasi index.html
  console.log('\n[2/4] Verifikasi index.html di Live Produksi...');
  const resIndex = await fetchUrl('/');
  const hasLinkPresensi = resIndex.data.includes('href="portal-presensi.html"') || resIndex.data.includes("window.location.href = 'portal-presensi.html'");
  console.log('  - Kartu Presensi terhubung ke portal-presensi.html:', hasLinkPresensi);

  // Step 3: Headless Chrome Live Desktop Capture
  console.log('\n[3/4] Menjalankan Headless Chrome untuk Uji Tampilan Desktop...');
  const chromeDesktop = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9493',
    '--no-sandbox',
    '--window-size=1280,850',
    `https://${HOST}/portal-presensi.html`
  ]);

  await new Promise(r => setTimeout(r, 8000));

  try {
    const listRes = await fetch('http://127.0.0.1:9493/json/list');
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
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_presensi_desktop.png'), Buffer.from(shot.data, 'base64'));
      console.log('  ✓ Bukti Visual Desktop tersimpan: live_prod_presensi_desktop.png');
      ws.close();
    }
  } catch (err) {
    console.error('Error desktop capture:', err);
  } finally {
    chromeDesktop.kill();
  }

  // Step 4: Headless Chrome Live Mobile Capture (iPhone 14 / 390x844)
  console.log('\n[4/4] Menjalankan Headless Chrome untuk Uji Tampilan Mobile HP...');
  const chromeMobile = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9492',
    '--no-sandbox',
    '--window-size=390,844',
    `https://${HOST}/portal-presensi.html`
  ]);

  await new Promise(r => setTimeout(r, 8000));

  try {
    const listRes = await fetch('http://127.0.0.1:9492/json/list');
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
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_presensi_mobile.png'), Buffer.from(shot.data, 'base64'));
      console.log('  ✓ Bukti Visual Mobile tersimpan: live_prod_presensi_mobile.png');
      ws.close();
    }
  } catch (err) {
    console.error('Error mobile capture:', err);
  } finally {
    chromeMobile.kill();
  }

  console.log('\n================================================================');
  console.log('✨ VERIFIKASI SELESAI: PORTAL PRESENSI 100% LIVE DI PRODUKSI!');
  console.log(`URL Resmi: https://${HOST}/portal-presensi.html`);
  console.log('================================================================');
}

run();
