import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8111;
const DEBUG_PORT = 9329;

function startLocalServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/portal-kwitansi.html' || reqPath === '/index.html') {
      const content = fs.readFileSync('portal-kwitansi.html', 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
    const localFile = path.join(process.cwd(), reqPath.replace(/^\//, ''));
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile);
      const mime = ext === '.js' || ext === '.mjs' ? 'application/javascript' : ext === '.css' ? 'text/css' : ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'text/plain';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(localFile).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });

  return new Promise(resolve => {
    server.listen(PORT, () => {
      console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runTest() {
  const server = await startLocalServer();
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_kwitansi_clean_test');

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--window-size=1440,1100',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  let ws = null;

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description).join(' ');
        if (!text.includes('cdn.tailwindcss.com')) {
          console.log('[BROWSER CONSOLE]', text);
        }
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('DOM.enable');

    console.log(`\n================================================================`);
    console.log(`TEST ELIMINASI TOP SPK BRIDGE & INTEGRATED DUAL-MODE SPK`);
    console.log(`================================================================`);

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 2500));

    // Buka otorisasi gatekeeper
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.classList.add('nsr-kwitansi-authorized');
        const modal = document.getElementById('modal-auth-gatekeeper-kwitansi');
        if (modal) {
          modal.classList.add('hidden');
          modal.style.display = 'none';
        }
        document.getElementById('panel-cabang')?.classList.remove('hidden');
        document.getElementById('konten-form-cabang')?.classList.remove('hidden');
        document.getElementById('box-auth-kwitansi')?.classList.add('hidden');
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // UJI 1: Verifikasi Auto-Populate Bridge 100% Hilang dari DOM
    console.log(`\n--- UJI 1: Verifikasi Komponen Bridge Atas Dieliminasi Total ---`);
    const evalElimination = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText;
          const hasBridgeText = bodyText.includes('Auto-Populate Bridge');
          const hasTarikDataAtas = bodyText.includes('Tarik Data Otomatis dari No. SPK');
          const elInputBridge = document.getElementById('cari-spk-kwitansi-bridge');
          const elBtnTarik = document.getElementById('btn-tarik-spk-kwitansi');
          const elStatusTarik = document.getElementById('status-tarik-kwitansi');

          // Verifikasi elemen form pertama setelah form dibuka
          const form = document.getElementById('form-pengajuan-kwitansi');
          const firstVisibleChild = form ? Array.from(form.children).find(c => c.tagName === 'DIV' && !c.classList.contains('hidden')) : null;
          const firstSectionText = firstVisibleChild ? firstVisibleChild.innerText : '';
          const startsWithModePenerbitan = firstSectionText.toUpperCase().includes('PILIH MODE PENERBITAN');

          return {
            hasBridgeText,
            hasTarikDataAtas,
            hasInputBridge: !!elInputBridge,
            hasBtnTarik: !!elBtnTarik,
            hasStatusTarik: !!elStatusTarik,
            firstSectionSample: firstSectionText.slice(0, 50),
            startsWithModePenerbitan
          };
        })()
      `,
      returnByValue: true
    });

    const valElim = evalElimination.result?.value || evalElimination.value;
    console.log("Hasil Uji 1 (Eliminasi Bridge):", JSON.stringify(valElim, null, 2));

    if (valElim.hasBridgeText) throw new Error("Gagal: Teks 'Auto-Populate Bridge' masih ditemukan di halaman!");
    if (valElim.hasTarikDataAtas) throw new Error("Gagal: Teks 'Tarik Data Otomatis dari No. SPK' masih ditemukan di halaman!");
    if (valElim.hasInputBridge) throw new Error("Gagal: Elemen #cari-spk-kwitansi-bridge masih ada di DOM!");
    if (valElim.hasBtnTarik) throw new Error("Gagal: Elemen #btn-tarik-spk-kwitansi masih ada di DOM!");
    if (!valElim.startsWithModePenerbitan) throw new Error("Gagal: Form harus langsung diawali kartu 'Pilih Mode Penerbitan Kuitansi'!");

    console.log("✓ Uji 1 LULUS: Komponen Auto-Populate Bridge atas telah 100% dieliminasi bersih dari DOM!");

    // UJI 2: Verifikasi Dual-Mode SPK In-Form Berfungsi Penuh
    console.log(`\n--- UJI 2: Verifikasi Dual-Mode SPK In-Form Tetap Berfungsi Normal ---`);
    const evalDualMode = await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            // 1. Pastikan mode database aktif
            pilihModeInputSPK('database');
            const selSpk = document.getElementById('pilih_spk_database');
            const optCount = selSpk ? selSpk.options.length : 0;

            // Pilih opsi ke-2
            if (selSpk && selSpk.options.length > 1) {
              selSpk.selectedIndex = 1;
              saatSpkDatabaseDipilih(selSpk.value);
            }

            const noSpk = document.getElementById('no-spk')?.value || '';
            const klien = document.getElementById('identitas-klien')?.value || '';
            const ket = document.getElementById('keterangan-penugasan')?.value || '';
            const dpp = document.getElementById('harga-dasar')?.value || '';
            const pagu = document.getElementById('nilai-kontrak-spk')?.value || '';

            // 2. Switch ke mode manual
            pilihModeInputSPK('manual');
            const inpManual = document.getElementById('nomor_spk_manual');
            if (inpManual) {
              inpManual.value = 'SPK/KONTRAK-VALID-TEST/2026';
              sinkronkanNomorSpkManual(inpManual.value);
            }
            const masterSpk = document.getElementById('no-spk')?.value || '';

            return {
              optCount,
              noSpkDb: noSpk,
              hasKlien: klien.length > 5,
              klienVal: klien,
              hasKet: ket.length > 5,
              dppVal: Number(dpp),
              paguVal: Number(pagu),
              manualSynced: masterSpk === 'SPK/KONTRAK-VALID-TEST/2026'
            };
          } catch(e) {
            return { error: e.message };
          }
        })()
      `,
      returnByValue: true
    });

    const valDual = evalDualMode.result?.value || evalDualMode.value;
    console.log("Hasil Uji 2 (Dual-Mode SPK In-Form):", JSON.stringify(valDual, null, 2));

    if (valDual.error) throw new Error("Error pada eval Dual-Mode: " + valDual.error);
    if (valDual.optCount <= 1) throw new Error("Gagal: Dropdown penugasan SPK database kosong!");
    if (!valDual.hasKlien) throw new Error("Gagal: Auto-fill Klien dari database SPK tidak berjalan!");
    if (valDual.dppVal <= 0) throw new Error("Gagal: Auto-fill Nilai DPP tidak terisi!");
    if (!valDual.manualSynced) throw new Error("Gagal: Switch input manual SPK tidak tersinkronkan ke master input!");

    console.log("✓ Uji 2 LULUS: Kontrol Dual-Mode SPK internal form berfungsi 100% normal dan akurat!");

    // Ambil screenshot bukti live layout yang bersih
    console.log(`\n--- Mengambil Tangkapan Layar Bukti Live Layout Bersih ---`);
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Kembalikan ke mode default DB dan scroll ke atas formulir
          pilihModeInputSPK('database');
          window.scrollTo(0, 180);
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshot.data, 'base64');
    const proofPath = path.join(ARTIFACT_DIR, 'bukti_live_kwitansi_clean_layout.png');
    fs.writeFileSync(proofPath, buffer);
    console.log(`✓ Proof screenshot saved: ${proofPath}`);

    console.log(`\n================================================================`);
    console.log(`SELURUH PENGUJIAN CLEAN LAYOUT & DUAL-MODE SPK LULUS 100%!`);
    console.log(`================================================================\n`);

  } finally {
    if (ws) ws.close();
    chrome.kill();
    server.close();
  }
}

runTest().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
