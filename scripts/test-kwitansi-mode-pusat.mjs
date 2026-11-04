import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8109;
const DEBUG_PORT = 9327;

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
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_kwitansi_pusat_test');

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
    console.log(`TEST DUAL-MODE SPK & DIFERENSIASI PUSAT VS CABANG (PORTAL-KWITANSI)`);
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

    // UJI 1: MODE CABANG
    console.log(`\n--- UJI 1: Login Akun Cabang (Bandung) ---`);
    const evalCabang = await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            const simUser = {
              role: 'CABANG',
              roleLabel: 'Admin Cabang Bandung',
              branch: 'Cabang Bandung',
              wilayahCode: 'BDG',
              displayName: 'Admin Cabang Bandung',
              isCabang: true,
              isSuperAdmin: false,
              canAccessKwitansi: true,
              canApprove: false
            };
            terapkanSesiPengguna(simUser);
            gantiTab('cabang');

            const barisStaf = document.getElementById('baris-identitas-staf-pengaju');
            const inpNama = document.getElementById('nama-staf-pengaju');
            const inpWa = document.getElementById('wa-staf-pengaju');
            const cCabang = document.getElementById('container-aksi-cabang');
            const cPusat = document.getElementById('container-aksi-pusat');
            const btnSubmitCabang = document.getElementById('btn-submit-cabang');

            return {
              barisStafVisible: barisStaf && !barisStaf.classList.contains('hidden') && barisStaf.style.display !== 'none',
              inpNamaVisible: inpNama && inpNama.offsetParent !== null,
              inpWaVisible: inpWa && inpWa.offsetParent !== null,
              containerCabangVisible: cCabang && !cCabang.classList.contains('hidden') && cCabang.style.display !== 'none',
              containerPusatHidden: cPusat && (cPusat.classList.contains('hidden') || cPusat.style.display === 'none'),
              btnSubmitCabangText: btnSubmitCabang ? btnSubmitCabang.innerText.trim() : ''
            };
          } catch (e) {
            return { error: e.message, stack: e.stack };
          }
        })()
      `,
      returnByValue: true
    });

    console.log("Raw evalCabang:", JSON.stringify(evalCabang, null, 2));
    const valCabang = evalCabang.result?.value || evalCabang.value;
    console.log("Hasil Uji 1 (Cabang):", JSON.stringify(valCabang, null, 2));
    if (valCabang.error) throw new Error("Error in browser eval 1: " + valCabang.error);
    if (!valCabang.barisStafVisible) throw new Error("Gagal: Baris staf pengaju harus muncul pada Mode Cabang!");
    if (!valCabang.containerCabangVisible) throw new Error("Gagal: Container aksi cabang harus muncul pada Mode Cabang!");
    if (!valCabang.containerPusatHidden) throw new Error("Gagal: Container aksi pusat harus tersembunyi pada Mode Cabang!");
    if (!valCabang.btnSubmitCabangText.includes('Pra-Penagihan Cabang')) throw new Error("Gagal: Tombol harus bertuliskan Pra-Penagihan Cabang!");
    console.log("✓ Uji 1 LULUS: Kolom staf & tombol pra-penagihan cabang terverifikasi!");

    // UJI 2: MODE KEUANGAN PUSAT
    console.log(`\n--- UJI 2: Login Keuangan Pusat (NSR8899 / NSR-PST-JKT) ---`);
    const evalPusat = await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            const simUser = {
              role: 'KEUANGAN_PUSAT',
              roleLabel: 'Keuangan Pusat (Milda H)',
              branch: 'Kantor Pusat Jakarta',
              wilayahCode: 'PST',
              displayName: 'Keuangan Kantor Pusat (Milda H)',
              isCabang: false,
              isSuperAdmin: true,
              canAccessKwitansi: true,
              canApprove: true,
              token: 'NSR8899'
            };
            terapkanSesiPengguna(simUser);
            // Pindah ke tab formulir untuk menguji tampilan formulir Pusat
            gantiTab('cabang');

            const barisStaf = document.getElementById('baris-identitas-staf-pengaju');
            const cCabang = document.getElementById('container-aksi-cabang');
            const cPusat = document.getElementById('container-aksi-pusat');
            const btnTerbitkanPusat = document.getElementById('btn-terbitkan-pusat');

            return {
              barisStafHidden: barisStaf && (barisStaf.classList.contains('hidden') || barisStaf.style.display === 'none'),
              containerCabangHidden: cCabang && (cCabang.classList.contains('hidden') || cCabang.style.display === 'none'),
              containerPusatVisible: cPusat && !cPusat.classList.contains('hidden') && cPusat.style.display !== 'none',
              btnTerbitkanText: btnTerbitkanPusat ? btnTerbitkanPusat.innerText.trim() : ''
            };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `,
      returnByValue: true
    });

    const valPusat = evalPusat.result?.value || evalPusat.value;
    console.log("Hasil Uji 2 (Pusat):", JSON.stringify(valPusat, null, 2));
    if (valPusat.error) throw new Error("Error in browser eval 2: " + valPusat.error);
    if (!valPusat.barisStafHidden) throw new Error("Gagal: Baris staf pengaju harus tersembunyi total pada Mode Pusat!");
    if (!valPusat.containerCabangHidden) throw new Error("Gagal: Container aksi cabang harus tersembunyi pada Mode Pusat!");
    if (!valPusat.containerPusatVisible) throw new Error("Gagal: Container aksi pusat harus muncul pada Mode Pusat!");
    if (!valPusat.btnTerbitkanText.includes('Terbitkan & Sahkan Kwitansi Resmi Langsung (Definitif)')) {
      throw new Error("Gagal: Tombol utama pusat harus berupa Penerbitan Definitif Langsung!");
    }
    console.log("✓ Uji 2 LULUS: Kolom staf tersembunyi bersih, tombol aksi definitif Pusat aktif!");

    // UJI 3: DUAL-MODE NOMOR SPK (DATABASE vs MANUAL)
    console.log(`\n--- UJI 3: Dual-Mode Nomor SPK (Tarik Database & Input Manual) ---`);
    const evalSpkDb = await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            // 1. Uji Mode Database Default
            pilihModeInputSPK('database');
            const containerDb = document.getElementById('container-spk-database');
            const containerManual = document.getElementById('container-spk-manual');
            const selSpk = document.getElementById('pilih_spk_database');

            const isDbVisible = containerDb && !containerDb.classList.contains('hidden');
            const isManualHidden = containerManual && containerManual.classList.contains('hidden');
            const optionCount = selSpk ? selSpk.options.length : 0;

            // Pilih SPK pertama yang tersedia di dropdown
            let selectedValue = '';
            if (selSpk && selSpk.options.length > 1) {
              selSpk.selectedIndex = 1;
              selectedValue = selSpk.value;
              saatSpkDatabaseDipilih(selectedValue);
            }

            const noSpkVal = document.getElementById('no-spk')?.value || '';
            const klienVal = document.getElementById('identitas-klien')?.value || '';
            const ketVal = document.getElementById('keterangan-penugasan')?.value || '';
            const paguVal = document.getElementById('nilai-kontrak-spk')?.value || '';
            const dppVal = document.getElementById('harga-dasar')?.value || '';

            return {
              isDbVisible,
              isManualHidden,
              optionCount,
              selectedValue,
              noSpkVal,
              hasKlien: klienVal.length > 5,
              klienVal,
              hasKet: ketVal.length > 5,
              paguVal: Number(paguVal),
              dppVal: Number(dppVal)
            };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `,
      returnByValue: true
    });

    const valSpkDb = evalSpkDb.result?.value || evalSpkDb.value;
    console.log("Hasil Uji 3.a (Tarik Database):", JSON.stringify(valSpkDb, null, 2));
    if (valSpkDb.error) throw new Error("Error in browser eval 3.a: " + valSpkDb.error);
    if (!valSpkDb.isDbVisible) throw new Error("Gagal: Container database SPK harus terlihat!");
    if (valSpkDb.optionCount <= 1) throw new Error("Gagal: Dropdown SPK database harus memuat opsi penugasan!");
    if (!valSpkDb.noSpkVal) throw new Error("Gagal: Auto-fill No SPK tidak terisi!");
    if (!valSpkDb.hasKlien) throw new Error("Gagal: Auto-fill Identitas Klien tidak terisi!");
    if (valSpkDb.paguVal <= 0) throw new Error("Gagal: Auto-fill Nilai Kontrak Pagu tidak terkalkulasi!");
    console.log("✓ Uji 3.a LULUS: Auto-fill Tarik Database SPK berjalan sempurna!");

    // Uji Switch ke Mode Manual
    const evalSpkManual = await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            pilihModeInputSPK('manual');
            const containerDb = document.getElementById('container-spk-database');
            const containerManual = document.getElementById('container-spk-manual');
            const inpManual = document.getElementById('nomor_spk_manual');

            const isDbHidden = containerDb && containerDb.classList.contains('hidden');
            const isManualVisible = containerManual && !containerManual.classList.contains('hidden');

            // Ketik nomor SPK kustom manual
            if (inpManual) {
              inpManual.value = 'SPK/KONTRAK-MANUAL/NSR/XI/2026';
              sinkronkanNomorSpkManual(inpManual.value);
            }

            const masterSpkVal = document.getElementById('no-spk')?.value || '';

            return {
              isDbHidden,
              isManualVisible,
              manualVal: inpManual?.value,
              masterSpkVal,
              isSynced: masterSpkVal === 'SPK/KONTRAK-MANUAL/NSR/XI/2026'
            };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `,
      returnByValue: true
    });

    const valSpkManual = evalSpkManual.result?.value || evalSpkManual.value;
    console.log("Hasil Uji 3.b (Input Manual):", JSON.stringify(valSpkManual, null, 2));
    if (valSpkManual.error) throw new Error("Error in browser eval 3.b: " + valSpkManual.error);
    if (!valSpkManual.isManualVisible) throw new Error("Gagal: Input manual SPK harus muncul saat mode manual dipilih!");
    if (!valSpkManual.isSynced) throw new Error("Gagal: Nilai nomor SPK manual harus tersinkronkan ke master input no-spk!");
    console.log("✓ Uji 3.b LULUS: Mode input manual SPK fleksibel dan tersinkronkan!");

    // UJI 4: Eksekusi Tombol Penerbitan Definitif Pusat
    console.log(`\n--- UJI 4: Eksekusi Penerbitan Definitif Langsung Pusat ---`);
    const evalDefinitif = await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            // Bypass dialog window.alert agar test tidak blocking
            window.alert = function(msg) { console.log('[MODAL ALERT]', msg); };

            // Jalankan handleTerbitkanKwitansiPusatDefinitif
            handleTerbitkanKwitansiPusatDefinitif();

            return {
              status: dataKwitansiAktif.status,
              isApproved: dataKwitansiAktif.isApproved,
              noKwitansiResmi: dataKwitansiAktif.noKwitansiResmi,
              watermarkHidden: document.getElementById('print-watermark-draft')?.classList.contains('hidden')
            };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `,
      returnByValue: true
    });

    const valDefinitif = evalDefinitif.result?.value || evalDefinitif.value;
    console.log("Hasil Uji 4 (Penerbitan Definitif):", JSON.stringify(valDefinitif, null, 2));
    if (valDefinitif.error) throw new Error("Error in browser eval 4: " + valDefinitif.error);
    if (valDefinitif.status !== 'DISETUJUI_PUSAT') {
      throw new Error("Gagal: Status kwitansi definitif pusat harus DISETUJUI_PUSAT!");
    }
    if (!valDefinitif.noKwitansiResmi.includes('/KW-NSR/')) {
      throw new Error("Gagal: Nomor kwitansi resmi definitif harus berformat standar Pusat (KW-NSR)!");
    }
    if (!valDefinitif.watermarkHidden) {
      throw new Error("Gagal: Watermark DRAFT harus otomatis disembunyikan saat disahkan definitif!");
    }
    console.log("✓ Uji 4 LULUS: Penerbitan definitif langsung Pusat sukses 100%!");

    // Ambil screenshot bukti live
    console.log(`\n--- Mengambil Tangkapan Layar Bukti Live Mode Pusat ---`);
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          gantiTab('cabang');
          window.scrollTo(0, 300);
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshot.data, 'base64');
    const proofPath = path.join(ARTIFACT_DIR, 'bukti_live_kwitansi_mode_pusat.png');
    fs.writeFileSync(proofPath, buffer);
    console.log(`✓ Proof screenshot saved: ${proofPath}`);

    console.log(`\n================================================================`);
    console.log(`SELURUH PENGUJIAN DUAL-MODE SPK & MODE PUSAT LULUS 100%!`);
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
