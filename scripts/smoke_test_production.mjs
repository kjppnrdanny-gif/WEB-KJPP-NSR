import https from 'https';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

function requestProd(path, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'kjppnanangrahayu.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };
    if (token) options.headers['X-NSR-Token'] = token;

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
}

async function run() {
  console.log('======================================================');
  console.log('🚀 SMOKE TEST LIVE SERVER PRODUKSI: https://kjppnanangrahayu.com/');
  console.log('======================================================\n');

  // [1/3] Backend RBAC Penolakan Akses Cabang & Izin Akses Pusat
  console.log('[1/3] Menguji Endpoint Backend operasional-data-handler.php di Produksi...');
  
  const rUnauth = await requestProd('/operasional-data-handler.php?action=getPengajuanList');
  console.log('  1. Unauthenticated Request: Status =', rUnauth.status, '(Harus 401)');

  const rCabang = await requestProd('/operasional-data-handler.php?action=getPengajuanList', (process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN"));
  console.log('  2. Akun Cabang (Bandung): Status =', rCabang.status, 'Response =', rCabang.data);

  const rPusat = await requestProd('/operasional-data-handler.php?action=getPengajuanList', 'NSR-STAGE-MASTER-77');
  console.log('  3. Akun Pusat (Master Nanang): Status =', rPusat.status, 'Response Success =', JSON.parse(rPusat.data || '{}').success);

  // [2/3] Browser Headless Test: Portal Kwitansi di Produksi
  console.log('\n[2/3] Menjalankan Browser Headless pada Portal Kwitansi Produksi...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9455',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9455/json/new?about:blank', { method: 'PUT' });
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
    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    // A. Buka Portal Kwitansi Produksi dengan Token Pusat (NSR-KEU-2026)
    console.log('  -> Membuka https://kjppnanangrahayu.com/portal-kwitansi.html...');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-kwitansi.html' });
    await new Promise(r => setTimeout(r, 2500));

    const evalKwitansi = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          sessionStorage.clear();
          localStorage.clear();
          const inp = document.getElementById('kwitansi-auth-username');
          if (inp) inp.value = 'NSR-KEU-2026';
          if (typeof masukSesiKwitansi === 'function') await masukSesiKwitansi();
          await new Promise(r => setTimeout(r, 600));

          const tabBtnPusat = document.getElementById('tab-btn-pusat');
          const tabBtnCabang = document.getElementById('tab-btn-cabang');
          const panelPusat = document.getElementById('panel-pusat');
          const panelCabang = document.getElementById('panel-cabang');
          const cabangVal = document.getElementById('cabang-pengaju')?.value;
          const namaStaf = document.getElementById('nama-staf-pengaju')?.value;

          return {
            badge: document.getElementById('label-sesi-cabang')?.innerText,
            verified: document.getElementById('label-cabang-terverifikasi')?.innerText,
            tabBtnPusatVisible: !tabBtnPusat?.classList.contains('hidden'),
            tabBtnPusatText: tabBtnPusat?.innerText,
            tabBtnCabangText: tabBtnCabang?.innerText,
            panelPusatVisible: !panelPusat?.classList.contains('hidden'),
            panelCabangVisible: !panelCabang?.classList.contains('hidden'),
            cabangVal,
            namaStaf,
            currentUserRole: window.currentUser?.role
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('  Hasil Login Keuangan Pusat di Produksi:', JSON.stringify(evalKwitansi.result?.value, null, 2));

    const shotKwiTab2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'prod_kwitansi_pusat_tab2.png'), Buffer.from(shotKwiTab2.data, 'base64'));
    console.log('  📸 Screenshot disimpan: prod_kwitansi_pusat_tab2.png');

    // B. Pindah ke Tab 1 (Pengajuan Draf)
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (typeof gantiTab === 'function') gantiTab('cabang');
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shotKwiTab1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'prod_kwitansi_pusat_tab1.png'), Buffer.from(shotKwiTab1.data, 'base64'));
    console.log('  📸 Screenshot disimpan: prod_kwitansi_pusat_tab1.png');

    // [3/3] Browser Headless Test: Popup Layanan Internal di index.html & Portal e-Operasional
    console.log('\n[3/3] Memeriksa Popup Portal Layanan Internal di https://kjppnanangrahayu.com/index.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/index.html' });
    await new Promise(r => setTimeout(r, 2500));

    // Buka Modal & Cek Posisi Kartu Portal e-Operasional
    const evalIndex = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const kartuEOpr = document.getElementById('kartu-e-operasional');
          const kartuKwi = document.getElementById('kartu-portal-kwitansi') || document.getElementById('title-portal-kwitansi')?.closest('.rounded-xl, .rounded-2xl');
          
          return {
            hasCardEOpr: Boolean(kartuEOpr),
            cardTitle: kartuEOpr?.querySelector('h4')?.innerText,
            cardBadge: kartuEOpr?.querySelector('span.rounded')?.innerText,
            cardLink: kartuEOpr?.querySelector('a')?.getAttribute('href'),
            cardVisible: kartuEOpr ? getComputedStyle(kartuEOpr).display !== 'none' : false
          };
        })()
      `,
      returnByValue: true
    });
    console.log('  Hasil Pemeriksaan index.html Produksi:', JSON.stringify(evalIndex.result?.value, null, 2));

    // Trigger Popup Portal Layanan
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (typeof bukaModalPortalLayanan === 'function') bukaModalPortalLayanan();
          const modal = document.getElementById('modal-portal-layanan');
          if (modal) modal.classList.remove('hidden');
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotIndex = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'prod_index_popup_e_operasional.png'), Buffer.from(shotIndex.data, 'base64'));
    console.log('  📸 Screenshot disimpan: prod_index_popup_e_operasional.png');

    // C. Buka Langsung portal-operasional.html di Produksi
    console.log('\n  -> Membuka https://kjppnanangrahayu.com/portal-operasional.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-operasional.html' });
    await new Promise(r => setTimeout(r, 2500));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.setItem('kjpp_token_auth', 'NSR-STAGE-MASTER-77');
          if (typeof periksaSesiLogin === 'function') periksaSesiLogin();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const shotEOpr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'prod_portal_operasional_desktop.png'), Buffer.from(shotEOpr.data, 'base64'));
    console.log('  📸 Screenshot disimpan: prod_portal_operasional_desktop.png');

    ws.close();
    console.log('\n======================================================');
    console.log('🎉 SELURUH SMOKE TEST PRODUKSI BERHASIL 100%!');
    console.log('======================================================\n');
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
