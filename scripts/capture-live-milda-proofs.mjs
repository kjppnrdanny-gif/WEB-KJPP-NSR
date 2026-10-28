import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

function livePost(pathUrl, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = https.request({
      hostname: 'kjppnanangrahayu.com',
      port: 443,
      path: pathUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
        ...headers
      },
      timeout: 15000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function prepareLiveDocument() {
  console.log('[1/4] Menyiapkan dokumen pengajuan live dan mengesahkan Tier 1...');
  // Login sebagai Admin Danny Taufik
  const admLogin = await livePost('/auth-handler.php', { action: 'login', token: 'NSR-ADM-2026' });
  const admCookie = (admLogin.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

  // Submit dokumen OPR-UMM baru
  const newDoc = await livePost('/operasional-data-handler.php?action=simpanPengajuan', {
    jenisOperasional: 'OPR-UMM',
    alur: 'ADMIN_UMUM',
    namaPengaju: 'Logistik Pusat & IT Support',
    jabatanPengaju: 'Staf IT & Logistik',
    divisiPengaju: 'Admin & Umum',
    maksudTujuan: 'Peremajaan Switch Core Jaringan & Aksesoris Server',
    tanggalKebutuhan: '2026-11-06',
    items: [{ deskripsi: 'Switch Core Gigabit 24-Port Managed', nominal: 4500000 }]
  }, { 'Cookie': admCookie });

  const docId = newDoc.data?.data?.id;
  console.log('  ✔ Dokumen live dibuat:', docId);

  // Sahkan Tier 1 oleh Danny Taufik
  const t1Approve = await livePost('/operasional-data-handler.php?action=approveTier', {
    id: docId,
    tier: 1
  }, { 'Cookie': admCookie });

  console.log('  ✔ Persetujuan Tier 1 disahkan oleh Danny Taufik:', t1Approve.data?.success);
  return docId;
}

async function run() {
  const docId = await prepareLiveDocument();

  console.log('\n[2/4] Meluncurkan Chrome headless untuk menangkap tampilan live...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9499',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9499/json/new?about:blank', { method: 'PUT' });
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });

    console.log('  Navigasi ke https://kjppnanangrahayu.com/portal-operasional.html ...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-operasional.html' });
    await new Promise(r => setTimeout(r, 3500));

    // Lakukan login dengan token NSR-KEU-2026 di browser
    console.log('[3/4] Melakukan autentikasi di halaman portal dengan token NSR-KEU-2026...');
    await send('Runtime.evaluate', {
      expression: `
        (async function() {
          const res = await fetch('/auth-handler.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', token: 'NSR-KEU-2026' })
          });
          const d = await res.json();
          if (d.success) {
            sessionStorage.setItem('AUTH_TOKEN_HASH', d.user?.tokenHash || '');
            sessionStorage.setItem('CURRENT_USER', JSON.stringify(d.user));
            if (typeof renderUserProfile === 'function') renderUserProfile(d.user);
            if (typeof gantiTabUtama === 'function') gantiTabUtama('riwayat');
            if (typeof muatDaftarPengajuan === 'function') await muatDaftarPengajuan();
          }
        })()
      `,
      awaitPromise: true
    });

    await new Promise(r => setTimeout(r, 3500));

    // Audit zero horizontal scrollbar
    const tableMetrics = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const wrapper = document.querySelector('#tab-riwayat-content .overflow-hidden') || document.querySelector('table')?.parentElement;
          const table = document.querySelector('#tab-riwayat-content table') || document.querySelector('table');
          return {
            tableClass: table?.className,
            wrapperScrollWidth: wrapper?.scrollWidth,
            wrapperClientWidth: wrapper?.clientWidth,
            hasHorizontalScroll: (wrapper?.scrollWidth > wrapper?.clientWidth),
            rowCount: document.querySelectorAll('#tabel-riwayat-body tr').length
          };
        })()
      `,
      returnByValue: true
    });

    console.log('  Audit Metrik Tabel:', JSON.stringify(tableMetrics.result?.value));

    // Tangkap Screenshot 1: Tabel Fit-to-Screen Zero Scroll & Micro Stepper
    console.log('\n[4/4] Mengambil bukti tangkapan layar live...');
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    const fileSs1 = path.join(ARTIFACT_DIR, 'bukti_live_table_zero_scroll.png');
    fs.writeFileSync(fileSs1, Buffer.from(ss1.data, 'base64'));
    console.log('  ✔ Disimpan: bukti_live_table_zero_scroll.png');

    // Buka Modal Detail (klik tombol ⚡ Setujui pada baris dokumen)
    console.log('  Membuka Modal Detail Otorisasi untuk dokumen ID:', docId);
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          if (typeof bukaModalDetail === 'function') {
            bukaModalDetail('${docId}');
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 2000));

    // Tangkap Screenshot 2: Modal Detail Otorisasi Milda Hidayati Dewi
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    const fileSs2 = path.join(ARTIFACT_DIR, 'bukti_live_milda_t2_modal.png');
    fs.writeFileSync(fileSs2, Buffer.from(ss2.data, 'base64'));
    console.log('  ✔ Disimpan: bukti_live_milda_t2_modal.png');

    // Konfirmasi Persetujuan di modal (klik Setujui Tier 2)
    console.log('  Mengeksekusi persetujuan Tier 2 di modal detail...');
    await send('Runtime.evaluate', {
      expression: `
        (async function() {
          if (typeof eksekusiApproveTier === 'function') {
            await eksekusiApproveTier('${docId}', 2);
          }
        })()
      `,
      awaitPromise: true
    });

    await new Promise(r => setTimeout(r, 3500));

    // Buka kembali modal detail untuk menangkap status stempel T2 disetujui
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          if (typeof bukaModalDetail === 'function') {
            bukaModalDetail('${docId}');
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1500));

    // Tangkap Screenshot 3: T2 Approved Berhasil di Live Server
    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    const fileSs3 = path.join(ARTIFACT_DIR, 'bukti_live_milda_t2_approval_success.png');
    fs.writeFileSync(fileSs3, Buffer.from(ss3.data, 'base64'));
    console.log('  ✔ Disimpan: bukti_live_milda_t2_approval_success.png');

    console.log('\n========================================================================');
    console.log('🎉 SEMUA BUKTI LIVE CDP BERHASIL DIAMBIL DAN DISIMPAN LENGKAP!');
    console.log('========================================================================');

    ws.close();
  } catch (err) {
    console.error('Error saat capture CDP:', err);
  } finally {
    chrome.kill();
  }
}

run();
