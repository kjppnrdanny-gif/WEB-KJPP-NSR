import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const DEBUG_PORT = 9478;
const LOCAL_PORTAL_URL = 'http://127.0.0.1:8088/portal-penugasan-jo.html';

async function runBrowserTest() {
  console.log('====================================================');
  console.log('UI TEST PORTAL PENUGASAN (DUAL WORKFLOW)');
  console.log('====================================================\n');

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
      if (!wsUrl) reject(new Error('Timeout connecting to Chrome DevTools'));
    }, 6000);
  });

  console.log('[INFO] Chrome DevTools Connected');

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();

    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.method === 'Page.javascriptDialogOpening') {
        console.log(`[DIALOG] Auto-handling dialog: ${m.params?.message?.substring(0, 80)}...`);
        send('Page.handleJavaScriptDialog', { accept: true });
        return;
      }
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m);
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result?.result?.value;
    }

    async function screenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res.result?.data) {
        const buf = Buffer.from(res.result.data, 'base64');
        const outPath = path.join(ARTIFACTS_DIR, filename);
        fs.writeFileSync(outPath, buf);
        console.log(`[SCREENSHOT] Saved: ${outPath}`);
      }
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log(`[NAVIGATE] Loading ${LOCAL_PORTAL_URL}`);
    await send('Page.navigate', { url: LOCAL_PORTAL_URL });
    await new Promise(r => setTimeout(r, 2000));

    // Inisialisasi sesi simulasi Cabang Padang
    await evaluate(`
      window.CURRENT_AUTH_SESSION = {
        sub: 'cabang_pdg',
        nama: 'Admin Cabang Padang',
        role: 'ADMIN_CABANG',
        roleLabel: 'Admin Cabang Padang',
        wilayah: 'Padang',
        wilayahLabel: 'Kantor Cabang Padang',
        wilayahCode: 'PDG',
        isCabang: true
      };
      if (typeof inisialisasiModeAksesDariUrl === 'function') inisialisasiModeAksesDariUrl();
    `);
    await new Promise(r => setTimeout(r, 800));

    // Test 1: Kontainer dual mode terlihat
    const dualModeVisible = await evaluate(`
      (() => {
        const el = document.getElementById('container-dual-mode');
        return Boolean(el && !el.classList.contains('hidden') && el.style.display !== 'none');
      })()
    `);
    console.log(`[TEST 1] Container Dual Mode terlihat untuk Cabang: ${dualModeVisible ? 'PASS ✅' : 'FAIL ❌'}`);

    // Test 2: Warning kompetensi muncul jika Padang memilih PROPERTY komprehensif
    await evaluate(`
      document.getElementById('klasifikasi_jasa_penilaian').value = 'PROPERTY';
      evaluasiKewenanganWorkflowCabang();
    `);
    await new Promise(r => setTimeout(r, 600));

    const warningVisible = await evaluate(`
      (() => {
        const w = document.getElementById('warning-kompetensi-cabang');
        return Boolean(w && !w.classList.contains('hidden'));
      })()
    `);
    console.log(`[TEST 2] Warning Kompetensi PS Padang muncul pada objek Komprehensif: ${warningVisible ? 'PASS ✅' : 'FAIL ❌'}`);

    const radioMandiriDisabled = await evaluate(`
      (() => {
        const r = document.getElementById('alur_kerja_mandiri');
        return Boolean(r && r.disabled);
      })()
    `);
    console.log(`[TEST 3] Radio Mandiri dinonaktifkan otomatis saat melanggar kompetensi: ${radioMandiriDisabled ? 'PASS ✅' : 'FAIL ❌'}`);

    // Capture screenshot state komprehensif (warning banner aktif)
    await screenshot('bukti_live_mandiri_warning_kompetensi.png');

    // Test 4: Warning kompetensi hilang saat memilih PROPERTY_SIMPLE & objek Rumah Tinggal Sederhana
    await evaluate(`
      document.getElementById('klasifikasi_jasa_penilaian').value = 'PROPERTY_SIMPLE';
      evaluasiKewenanganWorkflowCabang();
      pilihModeAlur('PRIVATE_CABANG');
    `);
    await new Promise(r => setTimeout(r, 800));

    const warningHidden = await evaluate(`
      (() => {
        const w = document.getElementById('warning-kompetensi-cabang');
        return Boolean(w && w.classList.contains('hidden'));
      })()
    `);
    console.log(`[TEST 4] Warning Kompetensi tersembunyi pada objek Sederhana: ${warningHidden ? 'PASS ✅' : 'FAIL ❌'}`);

    const mandiriActive = await evaluate(`
      (() => {
        const r = document.getElementById('alur_kerja_mandiri');
        return Boolean(r && !r.disabled && r.checked);
      })()
    `);
    console.log(`[TEST 5] Jalur A (Mandiri Cabang) aktif untuk objek Sederhana: ${mandiriActive ? 'PASS ✅' : 'FAIL ❌'}`);

    // Capture screenshot state Mandiri Cabang aktif
    await screenshot('bukti_live_mandiri_cabang_aktif.png');

    // Test 6: Beralih ke Tab 2 (Dashboard Monitoring) & Cek filter jalur
    await evaluate(`gantiTab(2)`);
    await new Promise(r => setTimeout(r, 800));

    const filterJalurExists = await evaluate(`
      (() => {
        const sel = document.getElementById('filter_jalur');
        return Boolean(sel !== null && sel.options.length >= 3);
      })()
    `);
    console.log(`[TEST 6] Filter Jalur Penerbitan (#filter_jalur) tersedia di Tab 2: ${filterJalurExists ? 'PASS ✅' : 'FAIL ❌'}`);

    // Capture screenshot Tab 2 Dashboard Monitoring dengan filter jalur
    await screenshot('bukti_live_tab2_monitoring_filter_jalur.png');

    ws.close();
  } finally {
    chrome.kill();
  }

  console.log('\n[SELESAI] Browser UI verification selesai.');
}

runBrowserTest().catch(console.error);
