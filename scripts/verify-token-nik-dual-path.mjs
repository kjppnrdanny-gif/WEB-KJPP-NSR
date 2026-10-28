import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const PORT = 8230;
const DEBUG_PORT = 9480;

function createServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    // Mock API handler untuk absensi jika diakses di pengujian lokal
    if (req.url.includes('absensi-data-handler.php')) {
      const urlObj = new URL(req.url, 'http://127.0.0.1');
      const nik = urlObj.searchParams.get('nik');
      const MASTER_48_NIKS = [
        "NSR-2019-001", "NSR-2019-002", "NSR-2019-003", "NSR-2019-004", "NSR-2019-005",
        "NSR-2019-006", "NSR-2019-007", "NSR-2019-008", "NSR-2019-009", "NSR-2019-010",
        "NSR-2019-011", "NSR-2019-012", "NSR-2019-013", "NSR-2019-014", "NSR-2019-015",
        "NSR-2019-016", "NSR-2019-017", "NSR-2019-018", "NSR-2019-019", "NSR-2019-020",
        "NSR-2025-021", "NSR-2026-022", "NSR-PDG-2019-23", "NSR-PDG-2019-24", "NSR-PDG-2019-25",
        "NSR-PDG-2019-26", "NSR-PDG-2019-27", "NSR-PDG-2019-28", "NSR-PDG-2019-29", "NSR-MKS-2019-30",
        "NSR-MKS-2019-31", "NSR-MKS-2019-32", "NSR-MKS-2020-33", "NSR-MKS-2021-34", "NSR-MKS-2020-35",
        "NSR-MKS-2019-36", "NSR-MKS-2019-37", "NSR-BDG-2020-38", "NSR-BDG-2020-39", "NSR-BDG-2020-40",
        "NSR-BDG-2020-41", "NSR-BDG-2020-42", "NSR-BDG-2020-43", "NSR-PLB-2022-44", "NSR-PLB-2022-45",
        "NSR-PLB-2022-46", "NSR-PLB-2022-47", "NSR-PLB-2022-48"
      ];
      if (MASTER_48_NIKS.includes(nik)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: { nik, nama: 'Danny Taufik Hidayat, S.H.', kantor: 'Kantor Pusat Jakarta', jabatan: 'Manajer Operasional' } }));
        return;
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'NIK tidak ditemukan' }));
        return;
      }
    }

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

async function runTestSuite() {
  const server = createServer();
  await new Promise(r => server.listen(PORT, r));
  console.log(`[INFO] Server running on http://127.0.0.1:${PORT}`);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1280,900',
    `http://127.0.0.1:${PORT}/index.html`
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
      if (!wsUrl) reject(new Error('Timeout connecting to Chrome DevTools'));
    }, 6000);
  });

  console.log('[INFO] Chrome DevTools Connected');

  try {
    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const listData = await listRes.json();
    const pageTarget = listData.find(p => p.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();

    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result !== undefined ? m.result : m);
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
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const takeScreenshot = async (filename) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(ARTIFACTS_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`[SNAPSHOT] Saved: ${filename}`);
    };

    const resetModalState = async () => {
      await send('Runtime.evaluate', {
        expression: `
          sessionStorage.clear();
          localStorage.clear();
          try { tutupModalPortal(); } catch (_) {}
          const inp = document.getElementById('input-token');
          if (inp) inp.value = '';
          const err = document.getElementById('pesan-error');
          if (err) err.classList.add('hidden');
          const panel = document.getElementById('panel-layanan');
          if (panel) panel.classList.add('hidden');
          const form = document.getElementById('form-token-portal');
          if (form) form.classList.remove('hidden');
        `
      });
      await sleep(250);
    };

    await sleep(2000);
    console.log('[INFO] index.html loaded.');

    // ==============================================================
    // UJI 1: Token Cabang Makassar (NSR-MKS-2026)
    // ==============================================================
    console.log('\n--- UJI 1: Token Cabang Makassar (NSR-MKS-2026) ---');
    await resetModalState();
    await send('Runtime.evaluate', { expression: `bukaModalPortal();` });
    await sleep(300);
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('input-token').value = 'NSR-MKS-2026';
          await verifikasiTokenPortal();
        })()
      `,
      awaitPromise: true
    });
    await sleep(400);
    const res1 = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          panelLayananHidden: document.getElementById('panel-layanan').classList.contains('hidden'),
          labelLokasi: document.getElementById('label-lokasi').innerText,
          errorHidden: document.getElementById('pesan-error').classList.contains('hidden'),
          errorText: document.getElementById('pesan-error-text').innerText,
          session: JSON.parse(sessionStorage.getItem('NSR_USER_SESSION') || '{}')
        })
      `,
      returnByValue: true
    });
    const parsed1 = JSON.parse(res1.result.value);
    console.log('Hasil Uji 1:', parsed1);
    if (!parsed1.panelLayananHidden && parsed1.session.wilayahCode === 'MKS') {
      console.log('✅ UJI 1 BERHASIL: Token Cabang Makassar valid!');
      await takeScreenshot('bukti_live_token_cabang_makassar_sukses.png');
    } else {
      throw new Error('UJI 1 GAGAL!');
    }

    // ==============================================================
    // UJI 2: Token Alias Frasa (TOKEN CABANG MAKASSAR)
    // ==============================================================
    console.log('\n--- UJI 2: Token Alias Frasa (TOKEN CABANG MAKASSAR) ---');
    await resetModalState();
    await send('Runtime.evaluate', { expression: `bukaModalPortal();` });
    await sleep(300);
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('input-token').value = 'TOKEN CABANG MAKASSAR';
          await verifikasiTokenPortal();
        })()
      `,
      awaitPromise: true
    });
    await sleep(400);
    const res2 = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          panelLayananHidden: document.getElementById('panel-layanan').classList.contains('hidden'),
          labelLokasi: document.getElementById('label-lokasi').innerText,
          errorHidden: document.getElementById('pesan-error').classList.contains('hidden'),
          errorText: document.getElementById('pesan-error-text').innerText,
          session: JSON.parse(sessionStorage.getItem('NSR_USER_SESSION') || '{}')
        })
      `,
      returnByValue: true
    });
    const parsed2 = JSON.parse(res2.result.value);
    console.log('Hasil Uji 2:', parsed2);
    if (!parsed2.panelLayananHidden && parsed2.session.wilayahCode === 'MKS') {
      console.log('✅ UJI 2 BERHASIL: Token frasa TOKEN CABANG MAKASSAR valid!');
      await takeScreenshot('bukti_live_token_alias_makassar_sukses.png');
    } else {
      throw new Error('UJI 2 GAGAL!');
    }

    // ==============================================================
    // UJI 3: Token Pusat / Manajemen (NSR-PST-2026)
    // ==============================================================
    console.log('\n--- UJI 3: Token Pusat / Manajemen (NSR-PST-2026) ---');
    await resetModalState();
    await send('Runtime.evaluate', { expression: `bukaModalPortal();` });
    await sleep(300);
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('input-token').value = 'NSR-PST-2026';
          await verifikasiTokenPortal();
        })()
      `,
      awaitPromise: true
    });
    await sleep(400);
    const res3 = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          panelLayananHidden: document.getElementById('panel-layanan').classList.contains('hidden'),
          labelLokasi: document.getElementById('label-lokasi').innerText,
          errorHidden: document.getElementById('pesan-error').classList.contains('hidden'),
          errorText: document.getElementById('pesan-error-text').innerText,
          session: JSON.parse(sessionStorage.getItem('NSR_USER_SESSION') || '{}')
        })
      `,
      returnByValue: true
    });
    const parsed3 = JSON.parse(res3.result.value);
    console.log('Hasil Uji 3:', parsed3);
    if (!parsed3.panelLayananHidden && parsed3.session.isSuperAdmin) {
      console.log('✅ UJI 3 BERHASIL: Token Pusat valid & membuka akses Super Admin!');
      await takeScreenshot('bukti_live_token_pusat_sukses.png');
    } else {
      throw new Error('UJI 3 GAGAL!');
    }

    // ==============================================================
    // UJI 4: Token Khusus Rekan (NSR8899)
    // ==============================================================
    console.log('\n--- UJI 4: Token Khusus Rekan (NSR8899) ---');
    await resetModalState();
    await send('Runtime.evaluate', { expression: `bukaModalPortal();` });
    await sleep(300);
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('input-token').value = 'NSR8899';
          await verifikasiTokenPortal();
        })()
      `,
      awaitPromise: true
    });
    await sleep(400);
    const res4 = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          panelLayananHidden: document.getElementById('panel-layanan').classList.contains('hidden'),
          labelLokasi: document.getElementById('label-lokasi').innerText,
          errorHidden: document.getElementById('pesan-error').classList.contains('hidden'),
          errorText: document.getElementById('pesan-error-text').innerText,
          session: JSON.parse(sessionStorage.getItem('NSR_USER_SESSION') || '{}')
        })
      `,
      returnByValue: true
    });
    const parsed4 = JSON.parse(res4.result.value);
    console.log('Hasil Uji 4:', parsed4);
    if (!parsed4.panelLayananHidden && parsed4.session.isSuperAdmin) {
      console.log('✅ UJI 4 BERHASIL: Token Rekan NSR8899 valid!');
      await takeScreenshot('bukti_live_token_rekan_sukses.png');
    } else {
      throw new Error('UJI 4 GAGAL!');
    }

    // ==============================================================
    // UJI 5: NIK Tidak Terdaftar (NSR-9999-999) -> Error Spesifik NIK
    // ==============================================================
    console.log('\n--- UJI 5: NIK Tidak Terdaftar (NSR-9999-999) ---');
    await resetModalState();
    await send('Runtime.evaluate', { expression: `bukaModalPortal();` });
    await sleep(300);
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('input-token').value = 'NSR-9999-999';
          await verifikasiTokenPortal();
        })()
      `,
      awaitPromise: true
    });
    await sleep(400);
    const res5 = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          errorHidden: document.getElementById('pesan-error').classList.contains('hidden'),
          errorText: document.getElementById('pesan-error-text').innerText
        })
      `,
      returnByValue: true
    });
    const parsed5 = JSON.parse(res5.result.value);
    console.log('Hasil Uji 5:', parsed5);
    if (!parsed5.errorHidden && parsed5.errorText.includes('NIK Karyawan tidak terdaftar')) {
      console.log('✅ UJI 5 BERHASIL: Pesan galat spesifik NIK tidak terdaftar tampil!');
      await takeScreenshot('bukti_live_error_nik_tidak_terdaftar.png');
    } else {
      throw new Error('UJI 5 GAGAL!');
    }

    // ==============================================================
    // UJI 6: Token Salah (TOKEN_SALAH_99) -> Error Spesifik Token
    // ==============================================================
    console.log('\n--- UJI 6: Token Salah (TOKEN_SALAH_99) ---');
    await resetModalState();
    await send('Runtime.evaluate', { expression: `bukaModalPortal();` });
    await sleep(300);
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('input-token').value = 'TOKEN_SALAH_99';
          await verifikasiTokenPortal();
        })()
      `,
      awaitPromise: true
    });
    await sleep(400);
    const res6 = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          errorHidden: document.getElementById('pesan-error').classList.contains('hidden'),
          errorText: document.getElementById('pesan-error-text').innerText
        })
      `,
      returnByValue: true
    });
    const parsed6 = JSON.parse(res6.result.value);
    console.log('Hasil Uji 6:', parsed6);
    if (!parsed6.errorHidden && parsed6.errorText.includes('Token tidak valid')) {
      console.log('✅ UJI 6 BERHASIL: Pesan galat spesifik Token tidak valid tampil!');
      await takeScreenshot('bukti_live_error_token_tidak_valid.png');
    } else {
      throw new Error('UJI 6 GAGAL!');
    }

    // ==============================================================
    // UJI 7: NIK Karyawan Resmi (NSR-2019-005) -> Auto-Redirect Presensi (Terakhir)
    // ==============================================================
    console.log('\n--- UJI 7: NIK Karyawan Resmi (NSR-2019-005) ---');
    await resetModalState();
    await send('Runtime.evaluate', { expression: `bukaModalPortal();` });
    await sleep(300);

    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('input-token').value = 'NSR-2019-005';
          await verifikasiTokenPortal();
        })()
      `,
      awaitPromise: true
    });

    // Polling hingga halaman berpindah ke portal-presensi.html dan mengunci NIK
    let checks = 0;
    let parsed7 = null;
    while (checks < 20) {
      await sleep(300);
      const eval7 = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const inp = document.getElementById('auth-nik-input');
            return JSON.stringify({
              currentUrl: window.location.href,
              authNik: sessionStorage.getItem('auth_nik'),
              nikInputValue: inp ? inp.value : null,
              nikInputReadonly: inp ? inp.readOnly : null
            });
          })()
        `,
        returnByValue: true
      });
      if (eval7 && eval7.result && eval7.result.value) {
        parsed7 = JSON.parse(eval7.result.value);
        if (parsed7.currentUrl.includes('portal-presensi.html') && parsed7.nikInputValue === 'NSR-2019-005' && parsed7.nikInputReadonly) {
          break;
        }
      }
      checks++;
    }

    console.log('Hasil Uji 7 (setelah polling ' + checks + ' kali):', parsed7);
    if (parsed7 && parsed7.currentUrl.includes('portal-presensi.html') && parsed7.authNik === 'NSR-2019-005' && parsed7.nikInputReadonly) {
      console.log('✅ UJI 7 BERHASIL: Auto-redirect presensi aktif, NIK terkunci readonly!');
      await takeScreenshot('bukti_live_smart_nik_presensi_sukses.png');
    } else {
      throw new Error('UJI 7 GAGAL!');
    }

    console.log('\n============================================================');
    console.log('🏆 SELURUH 7 SKENARIO PENGUJIAN OTOMATIS SUKSES 100%! 🏆');
    console.log('============================================================\n');

    ws.close();
  } catch (err) {
    console.error('Error during test execution:', err);
    process.exitCode = 1;
  } finally {
    chrome.kill();
    server.close();
  }
}

runTestSuite();
