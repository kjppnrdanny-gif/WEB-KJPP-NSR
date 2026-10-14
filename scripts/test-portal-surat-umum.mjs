// scripts/test-portal-surat-umum.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Edge binary not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const WebSocket = globalThis.WebSocket;
      if (!WebSocket) {
        import('ws').then(wsModule => {
          this.ws = new wsModule.default(this.wsUrl);
          this._bindWs(resolve, reject);
        }).catch(reject);
      } else {
        this.ws = new WebSocket(this.wsUrl);
        this._bindWs(resolve, reject);
      }
    });
  }

  _bindWs(resolve, reject) {
    this.ws.onopen = () => resolve();
    this.ws.onerror = (err) => reject(err);
    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.exceptionThrown') {
        const ed = data.params?.exceptionDetails;
        console.error('🔥 BROWSER EXCEPTION:', ed?.text, ed?.exception?.description);
      }
      if (data.method === 'Page.javascriptDialogOpening') {
        this.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      }
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    if (this.ws) this.ws.close();
  }
}

function startStaticServer(port = 8788) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/portal-surat-umum.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function waitForCondition(cdp, expr, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await cdp.send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.result && res.result.value) return res.result.value;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

async function runTests() {
  console.log('🚀 Memulai test suite lokal komprehensif Buku Agenda Surat Umum (SU)...');
  const port = 8788;
  const server = await startStaticServer(port);
  console.log(`✓ Local server running on http://127.0.0.1:${port}`);

  const chromePath = findChrome();
  const remoteDebuggingPort = 9225;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_su_test');

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,960',
    'about:blank'
  ]);

  let pages = null;
  for (let i = 0; i < 30; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
      if (listRes.ok) {
        pages = await listRes.json();
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 200));
  }
  if (!pages) throw new Error('Chrome failed to start or open port');

  let cdp = null;
  try {
    const targetPage = pages.find(p => p.type === 'page') || pages[0];
    cdp = new CDPClient(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('✓ CDP Client connected');

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.setLifecycleEventsEnabled', { enabled: true });

    // =========================================================================
    // TEST 1: Penolakan Akses (Hard-Guard) untuk Akun Non-Admin Pusat (Cabang)
    // =========================================================================
    console.log('\n--- TEST 1: portal-surat-umum.html - Hard-Guard Penolakan Akses Non-Admin ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/portal-surat-umum.html` });
    await waitForCondition(cdp, 'typeof window.periksaSesiLogin === "function"');
    console.log('✓ portal-surat-umum.html scripts fully loaded and periksaSesiLogin ready');

    // Coba login dengan token Cabang Bandung (NSR-BDG-2026)
    const test1Res = await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        localStorage.clear();
        localStorage.setItem('kjpp_token_auth', 'NSR-BDG-2026');
        await window.periksaSesiLogin();
        
        const noticeDitolak = document.getElementById('notice-akses-ditolak');
        const containerModul = document.getElementById('container-modul-aktif');
        const pesanEl = document.getElementById('pesan-detail-penolakan');

        return {
          isNoticeVisible: !noticeDitolak.classList.contains('hidden'),
          isModulHidden: containerModul.classList.contains('hidden'),
          pesanText: pesanEl ? pesanEl.innerText : '',
          hasDitolakKeyword: pesanEl ? pesanEl.innerText.includes('Admin Kantor Pusat Jakarta') : false
        };
      })()`,
      returnByValue: true,
      awaitPromise: true
    });

    console.log('Raw test1Res:', JSON.stringify(test1Res, null, 2));
    const val1 = test1Res.result?.value || test1Res.value || test1Res;
    console.log('Hasil Test 1 (Hard-Guard Penolakan Cabang):', val1);
    if (!val1.isNoticeVisible || !val1.isModulHidden || !val1.hasDitolakKeyword) {
      throw new Error('Test 1 GAGAL: Akun cabang tidak diblokir dengan benar pada modul Surat Umum!');
    }
    console.log('✓ Hard-Guard Penolakan Non-Admin Berhasil 100%!');

    // =========================================================================
    // TEST 2: Login Admin Pusat (NSR-PST-2026) & Verifikasi Tampilan & Penomoran
    // =========================================================================
    console.log('\n--- TEST 2: portal-surat-umum.html - Login Admin Pusat & Saran Nomor Otomatis ---');
    const test2Res = await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        localStorage.setItem('kjpp_token_auth', 'NSR-PST-2026');
        await window.periksaSesiLogin();

        const noticeDitolak = document.getElementById('notice-akses-ditolak');
        const containerModul = document.getElementById('container-modul-aktif');
        const labelRole = document.getElementById('label-sesi-role');
        const inputNo = document.getElementById('no_surat');
        const badgeTerakhir = document.getElementById('badge-terakhir-seq');
        const badgeSaran = document.getElementById('badge-saran-seq');

        return {
          isNoticeHidden: noticeDitolak.classList.contains('hidden'),
          isModulVisible: !containerModul.classList.contains('hidden'),
          roleText: labelRole ? labelRole.innerText : '',
          suggestedNo: inputNo ? inputNo.value : '',
          isNoReadOnly: inputNo ? inputNo.readOnly : true,
          terakhirSeq: badgeTerakhir ? badgeTerakhir.innerText : '',
          saranSeq: badgeSaran ? badgeSaran.innerText : '',
          isValidFormat: /^[0-9]{4}\\/NSR\\/SU\\/[IVXLCDM]+\\/2026$/.test(inputNo.value)
        };
      })()`,
      returnByValue: true,
      awaitPromise: true
    });

    console.log('Hasil Test 2 (Admin Pusat Login & Penomoran):', test2Res.result.value);
    if (!test2Res.result.value.isModulVisible || !test2Res.result.value.isValidFormat || test2Res.result.value.isNoReadOnly) {
      throw new Error('Test 2 GAGAL: Admin Pusat gagal membuka modul atau format nomor tidak valid / terkunci!');
    }
    console.log('✓ Admin Pusat Berhasil Login, Input Nomor Terbuka (readOnly = false), dan Format Bersih!');

    // =========================================================================
    // TEST 3: Peringatan Anti-Duplikat Real-time (Live-Check)
    // =========================================================================
    console.log('\n--- TEST 3: portal-surat-umum.html - Live Detection Duplikasi Nomor & Hard-Block ---');
    const test3Res = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const inputNo = document.getElementById('no_surat');
        const alertDuplikat = document.getElementById('alert-duplikat-nomor');
        const btnSubmit = document.getElementById('btn-submit-surat');

        // 1. Ketik nomor yang sudah ada (0015/NSR/SU/X/2026)
        inputNo.value = '0015/NSR/SU/X/2026';
        inputNo.dispatchEvent(new Event('input'));

        const isAlertVisible0015 = !alertDuplikat.classList.contains('hidden');
        const isBtnBlocked0015 = btnSubmit.disabled;
        const hasRedBorder0015 = inputNo.classList.contains('border-rose-500');

        // 2. Ketik nomor unik baru (0016/NSR/SU/X/2026)
        inputNo.value = '0016/NSR/SU/X/2026';
        inputNo.dispatchEvent(new Event('input'));

        const isAlertHidden0016 = alertDuplikat.classList.contains('hidden');
        const isBtnOpen0016 = !btnSubmit.disabled;
        const hasCleanBorder0016 = inputNo.classList.contains('border-slate-700');

        return {
          isAlertVisible0015,
          isBtnBlocked0015,
          hasRedBorder0015,
          isAlertHidden0016,
          isBtnOpen0016,
          hasCleanBorder0016
        };
      })()`,
      returnByValue: true
    });

    console.log('Hasil Test 3 (Anti-Duplikat Live Check):', test3Res.result.value);
    if (!test3Res.result.value.isAlertVisible0015 || !test3Res.result.value.isBtnBlocked0015 || !test3Res.result.value.isAlertHidden0016 || !test3Res.result.value.isBtnOpen0016) {
      throw new Error('Test 3 GAGAL: Deteksi anti-duplikat real-time tidak berfungsi dengan benar!');
    }
    console.log('✓ Proteksi Anti-Duplikat Real-time Terverifikasi Presisi!');

    // =========================================================================
    // TEST 4: Registrasi Surat Umum Baru & Tampil di Tabel
    // =========================================================================
    console.log('\n--- TEST 4: portal-surat-umum.html - Registrasi Surat Umum Baru & Rendering Tabel ---');
    const test4Res = await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        document.getElementById('tanggal_surat').value = '2026-10-14';
        document.getElementById('no_surat').value = '0016/NSR/SU/X/2026';
        document.getElementById('tujuan_penerima').value = 'Kementerian Keuangan RI - DJKN';
        document.getElementById('perihal').value = 'Penyampaian Update Database Penilai Publik Terdaftar Tahun 2026';
        document.getElementById('klasifikasi_perihal').value = 'Regulator/PPPK/OJK';
        document.getElementById('penandatangan').value = 'Pemimpin Rekan';

        // Submit form
        const form = document.getElementById('form-surat-umum');
        form.dispatchEvent(new Event('submit'));

        // Cek baris di tabel
        const tbody = document.getElementById('tabel-body-surat');
        const rowsText = tbody.innerText;
        const hasNewSurat = rowsText.includes('0016/NSR/SU/X/2026') && rowsText.includes('Kementerian Keuangan RI - DJKN');

        const badgeTerakhir = document.getElementById('badge-terakhir-seq').innerText;
        const badgeSaran = document.getElementById('badge-saran-seq').innerText;

        return {
          hasNewSurat,
          badgeTerakhir,
          badgeSaran
        };
      })()`,
      returnByValue: true,
      awaitPromise: true
    });

    console.log('Hasil Test 4 (Registrasi Surat & Tabel):', test4Res.result.value);
    if (!test4Res.result.value.hasNewSurat || test4Res.result.value.badgeTerakhir !== '#0016' || test4Res.result.value.badgeSaran !== '#0017') {
      throw new Error('Test 4 GAGAL: Surat baru tidak muncul di tabel atau sequence tidak bertambah!');
    }
    console.log('✓ Registrasi Surat Berhasil, Tabel Ter-update & Sequence Naik Otomatis!');

    // =========================================================================
    // TEST 5: Simulasi Upload File Arsip (Final PDF & Mentah Word) & Status
    // =========================================================================
    console.log('\n--- TEST 5: portal-surat-umum.html - Simulasi Upload Arsip Final & Mentah ---');
    const test5Res = await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        // 1. Simulasikan pengunggahan arsip Final (Scan PDF)
        const item = daftarSuratUmum.find(x => x.No_Surat === '0016/NSR/SU/X/2026');
        item.Link_Arsip_Final = 'https://drive.google.com/file/d/test_drive_final_0016/view';
        item.File_ID_Final = 'test_drive_final_0016';
        item.Status_Arsip = 'Hanya Scan';
        localStorage.setItem('kjpp_surat_umum_data', JSON.stringify(daftarSuratUmum));
        renderTabelSuratUmum();

        const tbody1 = document.getElementById('tabel-body-surat').innerHTML;
        const hasScanBtn = tbody1.includes('✓ Scan') && tbody1.includes('Lihat PDF');
        const hasHanyaScanStatus = tbody1.includes('Scan Saja');

        // 2. Simulasikan pengunggahan berkas Mentah (DOCX)
        item.Link_File_Mentah = 'https://drive.google.com/file/d/test_drive_draf_0016/view';
        item.File_ID_Mentah = 'test_drive_draf_0016';
        item.Status_Arsip = 'Lengkap';
        localStorage.setItem('kjpp_surat_umum_data', JSON.stringify(daftarSuratUmum));
        renderTabelSuratUmum();

        const tbody2 = document.getElementById('tabel-body-surat').innerHTML;
        const hasDrafBtn = tbody2.includes('📝 Draf') && tbody2.includes('Buka');
        const hasLengkapStatus = tbody2.includes('✓ Lengkap');

        return {
          hasScanBtn,
          hasHanyaScanStatus,
          hasDrafBtn,
          hasLengkapStatus
        };
      })()`,
      returnByValue: true,
      awaitPromise: true
    });

    console.log('Hasil Test 5 (Upload Arsip & Status):', test5Res.result.value);
    if (!test5Res.result.value.hasScanBtn || !test5Res.result.value.hasDrafBtn || !test5Res.result.value.hasLengkapStatus) {
      throw new Error('Test 5 GAGAL: Tombol arsip atau evaluasi status arsip tidak sesuai!');
    }
    console.log('✓ Slot Arsip Final, Slot Mentah, dan Evaluasi Status Lengkap Terverifikasi Sempurna!');

    // =========================================================================
    // TEST 6: Modal PDF Viewer Terisolasi
    // =========================================================================
    console.log('\n--- TEST 6: portal-surat-umum.html - Modal PDF Viewer Terisolasi ---');
    const test6Res = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        bukaModalPdfViewer('0016/NSR/SU/X/2026', 'https://drive.google.com/file/d/test_drive_final_0016/view', 'Surat DJKN');

        const modalViewer = document.getElementById('modal-pdf-viewer');
        const iframe = document.getElementById('iframe-pdf-preview');
        const isModalVisible = !modalViewer.classList.contains('hidden');
        const iframeSrc = iframe ? iframe.src : '';

        // Tutup modal
        tutupModalPdfViewer();
        const isModalClosed = modalViewer.classList.contains('hidden');

        return {
          isModalVisible,
          iframeSrc,
          isDrivePreviewEmbed: iframeSrc.includes('test_drive_final_0016/preview'),
          isModalClosed
        };
      })()`,
      returnByValue: true
    });

    console.log('Hasil Test 6 (Modal PDF Viewer):', test6Res.result.value);
    if (!test6Res.result.value.isModalVisible || !test6Res.result.value.isDrivePreviewEmbed || !test6Res.result.value.isModalClosed) {
      throw new Error('Test 6 GAGAL: Modal PDF Viewer tidak mengonversi Google Drive preview URL dengan benar!');
    }
    console.log('✓ Modal PDF Viewer Terisolasi Berfungsi Sempurna!');

    // =========================================================================
    // TEST 7: Live Search & Filtering
    // =========================================================================
    console.log('\n--- TEST 7: portal-surat-umum.html - Live Search Real-time & Filtering ---');
    const test7Res = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const searchInput = document.getElementById('search_surat');
        
        // Cari "DJKN"
        searchInput.value = 'DJKN';
        searchInput.dispatchEvent(new Event('input'));
        const rowsSearchDJKN = document.getElementById('tabel-body-surat').querySelectorAll('tr').length;

        // Kosongkan cari
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));

        // Filter status Lengkap
        const filterStatus = document.getElementById('filter_status_arsip');
        filterStatus.value = 'Lengkap';
        filterStatus.dispatchEvent(new Event('change'));
        const rowsLengkap = document.getElementById('tabel-body-surat').querySelectorAll('tr').length;

        return {
          rowsSearchDJKN,
          rowsLengkap
        };
      })()`,
      returnByValue: true
    });

    console.log('Hasil Test 7 (Live Search & Filter):', test7Res.result.value);
    if (test7Res.result.value.rowsSearchDJKN !== 1 || test7Res.result.value.rowsLengkap < 1) {
      throw new Error('Test 7 GAGAL: Live Search atau filter status arsip tidak berfungsi!');
    }
    console.log('✓ Live Search Real-time dan Filtering Kategori / Status Arsip Lulus 100%!');

    // Ambil screenshot sebagai bukti verifikasi
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.join(ARTIFACT_DIR, 'test_portal_surat_umum_verified.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`✓ Screenshot verifikasi tersimpan: test_portal_surat_umum_verified.png`);

    console.log('\n🎉 SELURUH 7 PENGUJIAN OTOMASI MODUL BUKU AGENDA SURAT UMUM LULUS 100%!\n');

  } finally {
    if (cdp) await cdp.close();
    chromeProc.kill('SIGKILL');
    server.close();
  }
}

runTests().catch(err => {
  console.error('\n❌ ERROR TEST EXECUTION:', err);
  process.exit(1);
});
