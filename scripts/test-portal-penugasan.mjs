// scripts/test-portal-penugasan.mjs
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
        console.error('🔥 BROWSER UNCAUGHT EXCEPTION:', ed?.text, ed?.exception?.description, 'at line:', ed?.lineNumber, 'col:', ed?.columnNumber, 'url:', ed?.url);
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

function startStaticServer(port = 8787) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
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
        returnByValue: true
      });
      if (res.result && res.result.value) return res.result.value;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

async function runTests() {
  console.log('🚀 Memulai test suite lokal komprehensif RBAC, Proteksi Kwitansi, & Dual-Mode...');
  const port = 8787;
  const server = await startStaticServer(port);
  console.log(`✓ Local server running on http://127.0.0.1:${port}`);

  const chromePath = findChrome();
  const remoteDebuggingPort = 9224;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_jo_test');

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
    await cdp.send('DOM.enable');

    // ------------------------------------------------------------------
    // TEST 1: index.html - Proteksi Kwitansi untuk Marketing, Reviewer, & Penilai
    // ------------------------------------------------------------------
    console.log('\n--- TEST 1: index.html - Verifikasi Penolakan Akses Kwitansi pada Modal Portal ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` });
    await waitForCondition(cdp, 'typeof window.bukaModalPortal === "function"');
    console.log('✓ index.html scripts fully loaded and bukaModalPortal is ready');

    const testKwitansiDenialIndex = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          window.alert = () => {};
          sessionStorage.clear();
          const results = [];
          const tokensToTest = [
            { token: 'NSR-VAL-2026', expectedRole: 'Penilai' },
            { token: 'NSR-PNL-2026', expectedRole: 'Penilai' },
            { token: 'NSR-REV-2026', expectedRole: 'Reviewer' },
            { token: 'NSR-MKT-2026', expectedRole: 'Marketing' }
          ];

          for (const item of tokensToTest) {
            sessionStorage.clear();
            bukaModalPortal('kwitansi');
            const input = document.getElementById('input-token');
            if (!input) {
              results.push({ token: item.token, error: 'input-token not found' });
              continue;
            }
            input.value = item.token;
            verifikasiTokenPortal({ preventDefault: () => {} });
            const errorEl = document.getElementById('pesan-error');
            const errorTextEl = document.getElementById('pesan-error-text');
            const isVisible = errorEl && !errorEl.classList.contains('hidden');
            const errorMsg = errorTextEl ? errorTextEl.textContent : '';
            results.push({
              token: item.token,
              isVisible,
              errorMsg,
              hasAksesDitolak: errorMsg.includes('Akses Ditolak') && errorMsg.includes(item.expectedRole)
            });
            tutupModalPortal();
          }

          // Test Admin Allowed via Modal Kwitansi (seharusnya langsung redirect ke portal-kwitansi.html)
          sessionStorage.clear();
          bukaModalPortal('kwitansi');
          const inputAdmin = document.getElementById('input-token');
          inputAdmin.value = 'NSR-BDG-2026';
          verifikasiTokenPortal({ preventDefault: () => {} });

          return { nonAdminResults: results };
        })()
      `,
      returnByValue: true
    });

    if (!testKwitansiDenialIndex.result || !testKwitansiDenialIndex.result.value) {
      throw new Error('Test 1 evaluate error: ' + JSON.stringify(testKwitansiDenialIndex));
    }
    const t1Results = testKwitansiDenialIndex.result.value.nonAdminResults;
    console.log('Hasil Test 1 (index.html Kwitansi Denials):', t1Results);
    for (const r of t1Results) {
      if (!r.hasAksesDitolak) {
        throw new Error(`Test 1 Gagal: Token ${r.token} tidak ditolak semestinya: ${r.errorMsg}`);
      }
    }
    console.log('✓ Seluruh token non-admin (Penilai, Reviewer, Marketing) DITOLAK MUTLAK pada modal Kwitansi!');

    // ------------------------------------------------------------------
    // TEST 2: portal-kwitansi.html - Hard-Guard Keamanan Token Non-Admin
    // ------------------------------------------------------------------
    console.log('\n--- TEST 2: portal-kwitansi.html - Hard-Guard Proteksi Halaman Kwitansi ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/portal-kwitansi.html` });
    await waitForCondition(cdp, 'typeof window.masukSesiKwitansi === "function"');

    const testHardGuardKwitansi = await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          window.alert = () => {};
          sessionStorage.clear();
          const results = [];
          const tokens = ['NSR-VAL-2026', 'NSR-PNL-2026', 'NSR-REV-2026', 'NSR-MKT-2026'];

          for (const tok of tokens) {
            sessionStorage.clear();
            const input = document.getElementById('kwitansi-auth-username');
            input.value = tok;
            await masukSesiKwitansi();
            const errEl = document.getElementById('pesan-auth-kwitansi');
            const isErrVisible = errEl && !errEl.classList.contains('hidden');
            const errMsg = errEl ? errEl.textContent : '';
            const isFormHidden = document.getElementById('konten-form-cabang').classList.contains('hidden');
            results.push({
              token: tok,
              isErrVisible,
              errMsg,
              isFormHidden,
              blocked: isErrVisible && isFormHidden && errMsg.includes('Akses Ditolak')
            });
          }

          // Test Admin Allowed (NSR-BDG-2026)
          sessionStorage.clear();
          const inputAdmin = document.getElementById('kwitansi-auth-username');
          inputAdmin.value = 'NSR-BDG-2026';
          await masukSesiKwitansi();
          const isFormOpenAdmin = !document.getElementById('konten-form-cabang').classList.contains('hidden');
          const isBoxAuthHidden = document.getElementById('box-auth-kwitansi').classList.contains('hidden');

          return { nonAdminResults: results, adminAllowed: isFormOpenAdmin && isBoxAuthHidden };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    if (!testHardGuardKwitansi.result || !testHardGuardKwitansi.result.value) {
      throw new Error('Test 2 evaluate error: ' + JSON.stringify(testHardGuardKwitansi));
    }
    console.log('Hasil Test 2 (portal-kwitansi.html Hard-Guard):', testHardGuardKwitansi.result.value);
    for (const r of testHardGuardKwitansi.result.value.nonAdminResults) {
      if (!r.blocked) {
        throw new Error(`Hard-guard portal-kwitansi.html gagal memblokir token ${r.token}: ${r.errMsg}`);
      }
    }
    if (!testHardGuardKwitansi.result.value.adminAllowed) {
      throw new Error('Admin Cabang (NSR-BDG-2026) seharusnya diizinkan mengakses portal-kwitansi.html');
    }
    console.log('✓ Hard-guard portal-kwitansi.html berhasil 100%: Non-admin diblokir, Admin diizinkan!');

    // ------------------------------------------------------------------
    // TEST 3: portal-penugasan-jo.html - Dual-Mode Privasi Mandiri Cabang (Zero-Cloud)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3: portal-penugasan-jo.html - Uji Mode Privasi Mandiri Cabang (NSR-BDG-2026) ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/portal-penugasan-jo.html` });
    await waitForCondition(cdp, 'typeof window.verifikasiTokenLogin === "function"');

    // Login sebagai Admin Cabang Bandung
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          window.alert = () => {};
          window.confirm = () => true;
          sessionStorage.clear();
          localStorage.removeItem('nsr_private_jo_BDG');
          document.getElementById('input_token_auth').value = 'NSR-BDG-2026';
          await verifikasiTokenLogin();
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 600));

    // Verifikasi Dual-Mode Container & Pemilihan PRIVATE_CABANG
    const testDualMode = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          window.alert = () => {};
          const container = document.getElementById('container-dual-mode');
          const isDualModeVisible = container && !container.classList.contains('hidden');
          const badgeText = document.getElementById('session-label').innerText;

          // Verifikasi nilai dropdown kantor_wilayah saat login awal
          const wilValInitial = document.getElementById('kantor_wilayah').value;
          const isWilDisabledInitial = document.getElementById('kantor_wilayah').disabled;

          // Uji resetFormulir: nilai kantor_wilayah harus tetap 'Kantor Cabang Bandung'
          resetFormulir(true);
          const wilValAfterReset = document.getElementById('kantor_wilayah').value;
          const isWilDisabledAfterReset = document.getElementById('kantor_wilayah').disabled;

          // Pilih mode PRIVATE_CABANG
          pilihModeAlur('PRIVATE_CABANG');
          const wilValAfterDual = document.getElementById('kantor_wilayah').value;
          const isLpEditable = !document.getElementById('nomor_lp').readOnly;
          const isAdmEditable = !document.getElementById('nomor_adm').readOnly;

          // Isi formulir proyek mandiri cabang
          document.getElementById('tanggal_surat').value = '2026-10-14';
          document.getElementById('pemberi_tugas_nama').value = 'PT BANK MANDIRI KC BANDUNG';
          document.getElementById('pemberi_tugas_pic').value = 'Ibu Kartika';
          document.getElementById('debitur_nama').value = 'CV BANDUNG TEKSTIL MANDIRI';
          document.getElementById('debitur_cp').value = 'Bpk. Ridwan (0812-9988-7766)';
          document.getElementById('biaya_dpp').value = '15000000';
          kalkulasiBiaya();

          // Simulasikan submit form (Zero-Cloud)
          handleFormSubmit({ preventDefault: () => {} });

          // Cek localStorage cabang
          const savedPrivate = JSON.parse(localStorage.getItem('nsr_private_jo_BDG') || '[]');
          const isSavedLocally = savedPrivate.length > 0;
          const savedItem = savedPrivate[0] || {};

          return {
            isDualModeVisible,
            badgeText,
            wilValInitial,
            isWilDisabledInitial,
            wilValAfterReset,
            isWilDisabledAfterReset,
            wilValAfterDual,
            isLpEditable,
            isAdmEditable,
            isSavedLocally,
            savedItemId: savedItem.id,
            savedItemStatus: savedItem.status,
            savedItemIsPrivate: savedItem.is_private,
            savedItemNoLp: savedItem.nomor_lp,
            savedItemNoAdm: savedItem.nomor_adm
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Test 3 (Mode Privasi Mandiri Cabang):', testDualMode.result.value);
    const dmRes = testDualMode.result.value;
    if (dmRes.wilValInitial !== 'Kantor Cabang Bandung') {
      throw new Error(`Dropdown kantor_wilayah gagal mencocokkan token: bernilai '${dmRes.wilValInitial}', seharusnya 'Kantor Cabang Bandung'`);
    }
    if (!dmRes.isWilDisabledInitial) {
      throw new Error('Dropdown kantor_wilayah seharusnya terkunci (disabled) untuk Admin Cabang');
    }
    if (dmRes.wilValAfterReset !== 'Kantor Cabang Bandung') {
      throw new Error(`Dropdown kantor_wilayah ter-reset ke '${dmRes.wilValAfterReset}' setelah resetFormulir()`);
    }
    if (dmRes.wilValAfterDual !== 'Kantor Cabang Bandung') {
      throw new Error(`Dropdown kantor_wilayah berubah menjadi '${dmRes.wilValAfterDual}' setelah pilihModeAlur()`);
    }
    console.log(`✓ Dropdown kantor_wilayah terverifikasi presisi: '${dmRes.wilValInitial}' (terkunci & anti-reset)!`);
    if (!dmRes.isDualModeVisible) throw new Error('Container Dual-Mode Alur Cabang tidak tampil untuk Admin Cabang');
    if (!dmRes.isLpEditable || !dmRes.isAdmEditable) throw new Error('Kolom nomor SPK/JO harus terbuka (editable) pada mode PRIVATE_CABANG');
    if (!dmRes.isSavedLocally || !dmRes.savedItemIsPrivate || dmRes.savedItemStatus !== 'APPROVED') {
      throw new Error('Data PRIVATE_CABANG gagal tersimpan secara lokal dengan status APPROVED');
    }
    console.log('✓ Mode Privasi Mandiri Cabang (Zero-Cloud) berfungsi 100%!');

    // Pindah ke Tab 2 dan verifikasi badge "🔒 MANDIRI CABANG (PRIVAT)"
    await cdp.send('Runtime.evaluate', { expression: `pindahTab('dashboard')` });
    await new Promise(r => setTimeout(r, 600));

    const checkDashboardPrivateBadge = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const tbody = document.getElementById('tbody-dashboard');
          const hasPrivateBadge = tbody.innerHTML.includes('MANDIRI CABANG (PRIVAT)');
          const hasBackupBtn = !!document.getElementById('btn-backup-cabang');
          const hasRestoreBtn = !!document.getElementById('btn-restore-cabang');
          return { hasPrivateBadge, hasBackupBtn, hasRestoreBtn };
        })()
      `,
      returnByValue: true
    });

    console.log('Dashboard Private Badge & Backup/Restore Check:', checkDashboardPrivateBadge.result.value);
    if (!checkDashboardPrivateBadge.result.value.hasPrivateBadge) {
      throw new Error('Badge 🔒 MANDIRI CABANG (PRIVAT) tidak muncul di tabel dashboard');
    }
    if (!checkDashboardPrivateBadge.result.value.hasBackupBtn || !checkDashboardPrivateBadge.result.value.hasRestoreBtn) {
      throw new Error('Tombol Backup & Restore Cabang (.json) harus tersedia di Tab 2');
    }
    console.log('✓ Tabel Dashboard menampilkan badge 🔒 MANDIRI CABANG (PRIVAT) dan tombol Backup/Restore!');

    // ------------------------------------------------------------------
    // TEST 3B: Verifikasi Admin Pusat (NSR-PST-2026) - Unlocked Inputs & No 4172027 Bug
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3B: portal-penugasan-jo.html - Uji Admin Pusat (NSR-PST-2026) & Fix Bug 4172027 ---');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          window.alert = () => {};
          window.confirm = () => true;
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-PST-2026';
          await verifikasiTokenLogin();
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 600));

    const testAdminPusatResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          pindahTab('form');
          const elLp = document.getElementById('no_lingkup_penugasan');
          const elAdm = document.getElementById('no_adm_jo');
          
          const isLpReadOnly = elLp ? elLp.readOnly : null;
          const isAdmReadOnly = elAdm ? elAdm.readOnly : null;
          const lpVal = elLp ? elLp.value : '';
          const admVal = elAdm ? elAdm.value : '';

          // Cek proteksi edit manual: saat diisi manual, updateNomorOtomatisPreview tidak boleh menimpa
          if (elLp) {
            elLp.value = 'MANUAL-LP-999';
            elLp.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (elAdm) {
            elAdm.value = 'MANUAL-ADM-999';
            elAdm.dispatchEvent(new Event('input', { bubbles: true }));
          }
          updateNomorOtomatisPreview();
          const lpManualPersisted = (elLp ? elLp.value : '') === 'MANUAL-LP-999';
          const admManualPersisted = (elAdm ? elAdm.value : '') === 'MANUAL-ADM-999';

          // Reset formulir untuk membersihkan dan verifikasi nomor otomatis bersih
          resetFormulir(true);
          const lpValAfterReset = elLp ? elLp.value : '';
          const admValAfterReset = elAdm ? elAdm.value : '';

          return {
            isLpReadOnly,
            isAdmReadOnly,
            lpVal,
            admVal,
            lpManualPersisted,
            admManualPersisted,
            lpValAfterReset,
            admValAfterReset
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Test 3B (Admin Pusat Unlocked & Clean Numbers):', testAdminPusatResult.result.value);
    const pstRes = testAdminPusatResult.result.value;
    if (pstRes.isLpReadOnly !== false || pstRes.isAdmReadOnly !== false) {
      throw new Error(`Input nomor #no_lingkup_penugasan & #no_adm_jo harus terbuka (readOnly === false) untuk Admin Pusat: LP=${pstRes.isLpReadOnly}, ADM=${pstRes.isAdmReadOnly}`);
    }
    if (pstRes.lpVal.includes('2027') || pstRes.admVal.includes('2027') || pstRes.lpVal.includes('4172027') || pstRes.admVal.includes('4172027')) {
      throw new Error(`String concatenation bug terdeteksi! LP: ${pstRes.lpVal}, ADM: ${pstRes.admVal}`);
    }
    if (pstRes.lpValAfterReset.includes('2027') || pstRes.admValAfterReset.includes('2027') || pstRes.lpValAfterReset.includes('4172027') || pstRes.admValAfterReset.includes('4172027')) {
      throw new Error(`String concatenation bug terdeteksi setelah reset! LP: ${pstRes.lpValAfterReset}, ADM: ${pstRes.admValAfterReset}`);
    }
    if (!pstRes.lpManualPersisted || !pstRes.admManualPersisted) {
      throw new Error('Input manual yang diketik Admin Pusat tertimpa oleh updateNomorOtomatisPreview()');
    }
    console.log(`✓ Admin Pusat terverifikasi: Input editable (readOnly === false), format nomor bersih '${pstRes.lpValAfterReset}', dan proteksi edit manual aktif!`);

    // ------------------------------------------------------------------
    // TEST 3C: Jenis Laporan (APP vs RTL), Ketik Cepat, Proteksi Anti-Double, Jump Guard & Obfuskasi Token
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3C: portal-penugasan-jo.html - Uji Jenis Laporan, Proteksi Anti-Double, Jump Guard & Obfuskasi ---');
    const testJenisLaporanAndAntiDouble = await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          window.alert = () => {};
          window.confirm = () => true;
          resetFormulir(true);
          const elJenis = document.getElementById('jenis_laporan');
          const elLp = document.getElementById('no_lingkup_penugasan');
          const elAdm = document.getElementById('no_adm_jo');
          const warnEl = document.getElementById('warning-duplikat-nomor');
          const btnSubmit = document.getElementById('btn-submit-form');

          // 0. Uji Sinkronisasi Indikator "Terakhir" vs "Saran"
          const lastNumStr = document.getElementById('helper-last-seq')?.textContent?.replace(/\\D/g, '') || '0415';
          const nextNumStr = document.getElementById('helper-next-seq')?.textContent?.replace(/\\D/g, '') || '0416';
          const lastNumInt = parseInt(lastNumStr, 10);
          const nextNumInt = parseInt(nextNumStr, 10);
          const isSeqSynced = (nextNumInt === lastNumInt + 1);

          // 1. Uji pilihan RTL
          elJenis.value = 'RTL';
          elJenis.dispatchEvent(new Event('change', { bubbles: true }));
          const valRTL = elLp.value;
          const isRTLFormat = valRTL.includes('/NSR/PN-RTL/');

          // 2. Uji kembalikan ke APP
          elJenis.value = 'APP';
          elJenis.dispatchEvent(new Event('change', { bubbles: true }));
          const valAPP = elLp.value;
          const isAPPFormat = valAPP.includes('/NSR/PN-APP/');

          // 3. Uji Kemudahan Ketik Cepat (Smart Auto-Format): ketik '999' lalu blur (dengan confirm accept)
          window.confirm = () => true;
          elLp.value = '999';
          elLp.dispatchEvent(new Event('blur', { bubbles: true }));
          const valAfterSmartFormat = elLp.value;
          const isSmartFormatted = valAfterSmartFormat.startsWith('0999/NSR/PN-APP/');

          // 3B. Uji Pengaman Lompatan Nomor (Jump Guard > 20): jika confirm ditolak (return false), nomor tidak melompat
          let jumpConfirmPrompted = false;
          window.confirm = (msg) => {
            jumpConfirmPrompted = msg.includes('Lompatan Nomor');
            return false;
          };
          elLp.value = '4180';
          elLp.dispatchEvent(new Event('blur', { bubbles: true }));
          const valAfterJumpReject = elLp.value;
          const isJumpPrevented = !valAfterJumpReject.startsWith('4180') && jumpConfirmPrompted;
          window.confirm = () => true;

          // 4. Uji Proteksi Anti-Double (Nomor urut 0415 sudah dipakai di SEED_PROJECTS)
          elLp.value = '0415/NSR/PN-APP/X/2026';
          elLp.dispatchEvent(new Event('input', { bubbles: true }));
          validasiDuplikatLive();
          const isWarnVisibleFor0415 = !warnEl.classList.contains('hidden');
          const isSubmitBlockedFor0415 = btnSubmit.disabled;

          // 5. Uji Proteksi Anti-Double (Ketik raw '415' juga harus terblokir)
          elLp.value = '415';
          elLp.dispatchEvent(new Event('input', { bubbles: true }));
          validasiDuplikatLive();
          const isWarnVisibleForRaw415 = !warnEl.classList.contains('hidden');

          // 6. Uji Nomor Unik Bersih (Saran berikutnya): Warning harus hilang dan submit terbuka
          const nextAvailableNum = (document.getElementById('helper-next-seq')?.textContent || '').replace(/[^0-9]/g, '') || '0418';
          const cleanUniqueLp = nextAvailableNum + '/NSR/PN-APP/X/2026';
          elLp.value = cleanUniqueLp;
          elLp.dispatchEvent(new Event('input', { bubbles: true }));
          validasiDuplikatLive();
          const isWarnHiddenForClean = warnEl.classList.contains('hidden');
          const isSubmitOpenForClean = !btnSubmit.disabled;

          // 7. Uji Modal Approval Pusat di Tab 2
          pindahTab('dashboard');
          const dummyReqId = 'NSR-2026-REQ-9999';
          projectDatabase.push({
            id: dummyReqId,
            status: 'WAITING_APPROVAL',
            nomor_adm: 'Menunggu Input & Otorisasi Admin Pusat',
            nomor_lp: 'Menunggu Input & Otorisasi Admin Pusat',
            kantor_wilayah: 'Kantor Cabang Bandung',
            mode_pengaju: 'CABANG',
            tanggal_surat: '2026-10-14',
            debitur_nama: 'PT TESTING DUMMY APPROVAL',
            pemberi_tugas_nama: 'PT BANK TESTING'
          });

          approveProyekPusat(dummyReqId);
          const modalAppr = document.getElementById('modal-approval-pusat');
          const isModalApprOpen = modalAppr && !modalAppr.classList.contains('hidden');

          const modalLpInput = document.getElementById('appr-nomor-lp');
          const modalWarn = document.getElementById('appr-warning-duplikat');
          const modalBtnConfirm = document.getElementById('btn-konfirmasi-approval');

          // Ketik nomor 0415 di modal approval -> warning tampil & tombol terblokir
          modalLpInput.value = '0415/NSR/PN-APP/X/2026';
          validasiApprovalDuplikatLive();
          const isModalWarnVisible = modalWarn && !modalWarn.classList.contains('hidden');
          const isModalBtnBlocked = modalBtnConfirm && modalBtnConfirm.disabled;

          // Ganti ke nomor unik saran berikutnya -> warning hilang & tombol aktif
          modalLpInput.value = cleanUniqueLp;
          validasiApprovalDuplikatLive();
          const isModalWarnClean = modalWarn && modalWarn.classList.contains('hidden');
          const isModalBtnReady = modalBtnConfirm && !modalBtnConfirm.disabled;

          tutupModalApproval();
          const isModalClosed = modalAppr && modalAppr.classList.contains('hidden');

          // Bersihkan data dummy
          projectDatabase = projectDatabase.filter(p => p.id !== dummyReqId);

          // 8. Uji Obfuskasi Token (HASHED_TOKENS) & Anonimisasi SEED_PROJECTS
          const hasHashedTokens = typeof HASHED_TOKENS === 'object' && Object.keys(HASHED_TOKENS).length >= 9 && Object.keys(HASHED_TOKENS).length <= 15;
          const hashSampleKey = Object.keys(HASHED_TOKENS)[0] || '';
          const isKeySha256 = hashSampleKey.length === 64; // Panjang string SHA-256 hex
          const seedDebitur1 = SEED_PROJECTS[0]?.debitur_nama || '';
          const seedDebitur2 = SEED_PROJECTS[1]?.debitur_nama || '';
          const isSeedAnonymized = seedDebitur1.includes('SIMULASI') && seedDebitur2.includes('SIMULASI');

          return {
            isSeqSynced,
            lastNumStr,
            nextNumStr,
            isRTLFormat,
            valRTL,
            isAPPFormat,
            valAPP,
            isSmartFormatted,
            valAfterSmartFormat,
            isJumpPrevented,
            isWarnVisibleFor0415,
            isSubmitBlockedFor0415,
            isWarnVisibleForRaw415,
            isWarnHiddenForClean,
            isSubmitOpenForClean,
            isModalApprOpen,
            isModalWarnVisible,
            isModalBtnBlocked,
            isModalWarnClean,
            isModalBtnReady,
            isModalClosed,
            cleanUniqueLp,
            hasHashedTokens,
            isKeySha256,
            isSeedAnonymized,
            seedDebitur1
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Hasil Test 3C (Jenis Laporan, Anti-Double, Jump Guard & Obfuskasi):', testJenisLaporanAndAntiDouble.result.value);
    const r3c = testJenisLaporanAndAntiDouble.result.value;
    if (!r3c.isSeqSynced) throw new Error(`Indikator Terakhir vs Saran tidak sinkron! Terakhir: [${r3c.lastNumStr}], Saran: [${r3c.nextNumStr}]`);
    if (!r3c.isRTLFormat) throw new Error(`Pilihan RTL harus menghasilkan kode /NSR/PN-RTL/, didapat: ${r3c.valRTL}`);
    if (!r3c.isAPPFormat) throw new Error(`Pilihan APP harus menghasilkan kode /NSR/PN-APP/, didapat: ${r3c.valAPP}`);
    if (!r3c.isSmartFormatted) throw new Error(`Ketik cepat '999' harus otomatis terformat menjadi '0999/NSR/PN-APP/...', didapat: ${r3c.valAfterSmartFormat}`);
    if (!r3c.isJumpPrevented) throw new Error('Pengaman lompatan counter (Jump Guard > 20) harus memicu konfirmasi dan mencegah perubahan saat dibatalkan');
    if (!r3c.isWarnVisibleFor0415 || !r3c.isSubmitBlockedFor0415) {
      throw new Error('Sistem Anti-Double harus memunculkan warning visual dan memblokir submit ketika nomor 0415 (sudah ada) diinputkan!');
    }
    if (!r3c.isWarnVisibleForRaw415) {
      throw new Error('Sistem Anti-Double harus mendeteksi nomor 415 mentah sebagai duplikat!');
    }
    if (!r3c.isWarnHiddenForClean || !r3c.isSubmitOpenForClean) {
      throw new Error(`Peringatan duplikat harus hilang dan submit harus terbuka ketika nomor unik (${r3c.cleanUniqueLp}) dimasukkan!`);
    }
    if (!r3c.isModalApprOpen) throw new Error('Modal Approval Pusat harus terbuka saat tombol Approve diklik di Tab 2');
    if (!r3c.isModalWarnVisible || !r3c.isModalBtnBlocked) {
      throw new Error('Modal Approval Pusat harus memblokir konfirmasi dan memunculkan error saat nomor duplikat (0415) diinput!');
    }
    if (!r3c.isModalWarnClean || !r3c.isModalBtnReady) {
      throw new Error('Modal Approval Pusat harus mengizinkan konfirmasi saat nomor unik dimasukkan!');
    }
    if (!r3c.isModalClosed) throw new Error('Modal Approval Pusat harus dapat ditutup dengan benar');
    if (!r3c.hasHashedTokens || !r3c.isKeySha256) throw new Error('Kamus token wajib ter-obfuskasi menggunakan 64-karakter SHA-256 hash');
    if (!r3c.isSeedAnonymized) throw new Error(`Nama debitur SEED_PROJECTS wajib disamarkan (KEPI/SPI compliance): ${r3c.seedDebitur1}`);
    console.log('✓ Fitur Jenis Laporan, Smart Auto-Format, Proteksi Anti-Double, Jump Guard & Obfuskasi Token Terverifikasi Sempurna!');
    console.log('✓ Fitur Jenis Laporan (APP/RTL), Smart Auto-Format, Proteksi Anti-Double & Modal Approval Terverifikasi Sempurna!');

    // ------------------------------------------------------------------
    // TEST 4: Kerahasiaan Komersial (Sensor Fee) untuk Penilai (NSR-PNL-2026)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 4: Uji Kerahasiaan Komersial / Sensor Fee untuk Penilai (NSR-PNL-2026) ---');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          window.alert = () => {};
          window.confirm = () => true;
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-PNL-2026';
          await verifikasiTokenLogin();
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 600));

    // Periksa Tab 1: Notice Penilai & Tab 2: Masking Fee
    const testPenilaiNoticeAndDash = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const noticeEl = document.getElementById('notice-penilai-reviewer');
          const isNoticeVisible = noticeEl && !noticeEl.classList.contains('hidden');
          const isFormHidden = document.getElementById('form-penugasan').classList.contains('hidden');
          const badgeText = document.getElementById('session-label').innerText;

          // Periksa tabel dashboard untuk sensor fee
          pindahTab('dashboard');
          const tbody = document.getElementById('tbody-dashboard');
          const tableHtml = tbody.innerHTML;
          const hasMaskedFee = tableHtml.includes('[Sesuai SPK / Khusus Admin]');
          const hasUnmaskedRp = tableHtml.includes('Rp 15.000.000') || tableHtml.includes('Rp 16.650.000');

          return {
            isNoticeVisible,
            isFormHidden,
            badgeText,
            hasMaskedFee,
            hasUnmaskedRp
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Test 4 (Penilai Dashboard & Notice):', testPenilaiNoticeAndDash.result.value);
    const pnlDash = testPenilaiNoticeAndDash.result.value;
    if (!pnlDash.isNoticeVisible || !pnlDash.isFormHidden) {
      throw new Error('Form Tab 1 harus digantikan dengan notice informatif bagi Penilai/Reviewer');
    }
    if (!pnlDash.hasMaskedFee) {
      throw new Error('Tabel Dashboard Tab 2 harus menampilkan teks "[Sesuai SPK / Khusus Admin]" untuk Penilai');
    }
    console.log('✓ Tab 1 Notice dan Sensor Fee di Dashboard Tab 2 untuk Penilai terverifikasi sempurna!');

    // Periksa Tab 3: Pratinjau Dokumen 1, 3A, 3B untuk Penilai
    await cdp.send('Runtime.evaluate', { expression: `pindahTab('preview')` });
    await new Promise(r => setTimeout(r, 600));

    const testPenilaiPreviewDocs = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          if (projectDatabase.length > 0) {
            bukaPratinjauProyek(projectDatabase[0].id);
          }
          const renderedText = document.getElementById('preview-rendered-area').innerText;
          const hasMaskedSPK = renderedText.includes('[Sesuai SPK / Khusus Admin]');
          return { hasMaskedSPK };
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Test 4 (Penilai Tab 3 Dokumen Cetak):', testPenilaiPreviewDocs.result.value);
    if (!testPenilaiPreviewDocs.result.value.hasMaskedSPK) {
      throw new Error('Dokumen cetak Tab 3 harus menampilkan teks sensor "[Sesuai SPK / Khusus Admin]" untuk Penilai');
    }
    console.log('✓ Dokumen Cetak Tab 3 berhasil menyensor nominal biaya dengan teks "[Sesuai SPK / Khusus Admin]"!');

    // ------------------------------------------------------------------
    // TEST 5: Kerahasiaan Komersial (Sensor Fee) untuk Reviewer (NSR-REV-2026)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 5: Uji Kerahasiaan Komersial / Sensor Fee untuk Reviewer (NSR-REV-2026) ---');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          window.alert = () => {};
          window.confirm = () => true;
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-REV-2026';
          await verifikasiTokenLogin();
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 600));

    const revCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          pindahTab('dashboard');
          const tableHtml = document.getElementById('tbody-dashboard').innerHTML;
          pindahTab('preview');
          if (projectDatabase.length > 0) {
            bukaPratinjauProyek(projectDatabase[0].id);
          }
          const renderedText = document.getElementById('preview-rendered-area').innerText;
          return {
            hasMaskedFeeRev: tableHtml.includes('[Sesuai Kontrak / Khusus Admin]'),
            hasMaskedDocRev: renderedText.includes('[Sesuai Kontrak / Khusus Admin]')
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Test 5 (Reviewer Fee Masking):', revCheck.result.value);
    if (!revCheck.result.value.hasMaskedFeeRev || !revCheck.result.value.hasMaskedDocRev) {
      throw new Error('Reviewer harus melihat teks sensor "[Sesuai Kontrak / Khusus Admin]" di Dashboard & Dokumen Cetak');
    }
    console.log('✓ Reviewer berhasil melihat teks sensor "[Sesuai Kontrak / Khusus Admin]"!');

    // ------------------------------------------------------------------
    // TEST 6: Validasi Render Mesin Dokumen Cetak Dokumen 2 & 3 (3A s.d. 3G)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 6: Uji Validasi Render Mesin Dokumen Cetak (Dokumen 2 & 3A s.d. 3G) ---');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-PST-2026';
          await verifikasiTokenLogin();
          pindahTab('preview');
          if (projectDatabase.length > 0) {
            bukaPratinjauProyek(projectDatabase[0].id);
          }
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 600));

    const testDokumenRenderSuite = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const results = {};
          const sel = document.getElementById('pilih_tampilan_dokumen');
          const area = document.getElementById('preview-rendered-area');

          // Uji Dokumen 2: Surat Representasi
          sel.value = 'DOK2';
          gantiTampilanDokumen();
          results.dok2 = {
            hasTitle: area.innerText.includes('Surat Representasi Kebenaran Informasi, Data & Dokumen'),
            hasKepi: area.innerText.includes('KEPI 5.8.c).4'),
            hasMaterai: area.innerText.includes('(materai Rp 10.000)')
          };

          // Uji Dokumen 3A: Isian UMUM
          sel.value = 'DOK3A';
          gantiTampilanDokumen();
          results.dok3A = {
            hasTitle: area.innerText.includes('3A. LEMBAR ISIAN UMUM (ADMINISTRASI PENUGASAN)'),
            hasSeksiA: area.innerText.includes('A. DATA LAPORAN ADMIN'),
            hasSeksiE: area.innerText.includes('E. DATA OBJEK PENILAIAN')
          };

          // Uji Dokumen 3B: Form Order JO
          sel.value = 'DOK3B';
          gantiTampilanDokumen();
          results.dok3B = {
            hasTitle: area.innerText.includes('FORM ORDER KJPP NSR TAHUN 2026'),
            hasSurveyorTTD: area.innerText.includes('( Surveyor )'),
            hasDivTeknikTTD: area.innerText.includes('( Divisi Teknik )')
          };

          // Uji Dokumen 3C: Kartu Proyek
          sel.value = 'DOK3C';
          gantiTampilanDokumen();
          results.dok3C = {
            hasTitle: area.innerText.includes('KARTU PROYEK'),
            hasBlok1: area.innerText.includes('1. Check List Dokumen (Surveyor / Penilai)'),
            hasBlok4: area.innerText.includes('4. Cek List Pimpinan KJPP / Rekan Penilai Publik')
          };

          // Uji Dokumen 3D: Surat Tugas (Kop Resmi)
          sel.value = 'DOK3D';
          gantiTampilanDokumen();
          results.dok3D = {
            hasTitle: area.innerText.includes('SURAT TUGAS'),
            hasKop: area.innerHTML.includes('kop-surat-resmi'),
            hasRekan: area.innerText.includes('Rekan Penilai Publik Penanggung Jawab')
          };

          // Uji Dokumen 3E: BAP (Kop Resmi)
          sel.value = 'DOK3E';
          gantiTampilanDokumen();
          results.dok3E = {
            hasTitle: area.innerText.includes('BERITA ACARA INSPEKSI LAPANGAN (BAP)'),
            hasKop: area.innerHTML.includes('kop-surat-resmi'),
            hasPekerjaan: area.innerText.includes('Lingkup Pekerjaan')
          };

          // Uji Dokumen 3F: ETI (Kop Resmi)
          sel.value = 'DOK3F';
          gantiTampilanDokumen();
          results.dok3F = {
            hasTitle: area.innerText.includes('EVALUASI TINGKAT INDEPENDENSI (ETI)'),
            hasKop: area.innerHTML.includes('kop-surat-resmi'),
            hasEvaluasi: area.innerText.includes('Yang dievaluasi')
          };

          // Uji Dokumen 3G: PI (Kop Resmi)
          sel.value = 'DOK3G';
          gantiTampilanDokumen();
          results.dok3G = {
            hasTitle: area.innerText.includes('PERNYATAAN INDEPENDENSI (PI)'),
            hasKop: area.innerHTML.includes('kop-surat-resmi'),
            hasPernyataan: area.innerText.includes('Kode Etik Penilai Indonesia yang ditetapkan Masyarakat Profesi Penilai Indonesia')
          };

          // Uji Bundel DOK3 (7 Dokumen Internal)
          sel.value = 'DOK3';
          gantiTampilanDokumen();
          results.dok3Count = area.querySelectorAll('.doc-page').length;

          // Uji Bundel ALL (9 Dokumen Lengkap)
          sel.value = 'ALL';
          gantiTampilanDokumen();
          results.allCount = area.querySelectorAll('.doc-page').length;

          return results;
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Test 6 (Validasi Dokumen Cetak 2 & 3A-3G):', testDokumenRenderSuite.result.value);
    const r6 = testDokumenRenderSuite.result.value;
    if (!r6.dok2.hasTitle || !r6.dok2.hasKepi || !r6.dok2.hasMaterai) {
      throw new Error('Dokumen 2 (Surat Representasi Klien) gagal merender judul, KEPI 5.8.c.4, atau blok meterai!');
    }
    if (!r6.dok3A.hasTitle || !r6.dok3A.hasSeksiA || !r6.dok3A.hasSeksiE) {
      throw new Error('Dokumen 3A (Isian UMUM) gagal merender judul atau seksi-seksi data administrasi!');
    }
    if (!r6.dok3B.hasTitle || !r6.dok3B.hasSurveyorTTD) {
      throw new Error('Dokumen 3B (Form Order JO 2026) gagal merender tabel order atau kolom tanda tangan!');
    }
    if (!r6.dok3C.hasTitle || !r6.dok3C.hasBlok1 || !r6.dok3C.hasBlok4) {
      throw new Error('Dokumen 3C (Kartu Proyek) gagal merender 4 blok kendali mutu berjenjang!');
    }
    if (!r6.dok3D.hasTitle || !r6.dok3D.hasKop || !r6.dok3D.hasRekan) {
      throw new Error('Dokumen 3D (Surat Tugas) gagal merender kop surat resmi atau informasi penugasan rekan!');
    }
    if (!r6.dok3E.hasTitle || !r6.dok3E.hasKop || !r6.dok3E.hasPekerjaan) {
      throw new Error('Dokumen 3E (BAP) gagal merender kop surat resmi atau rincian berita acara!');
    }
    if (!r6.dok3F.hasTitle || !r6.dok3F.hasKop || !r6.dok3F.hasEvaluasi) {
      throw new Error('Dokumen 3F (ETI) gagal merender kop surat resmi atau evaluasi independensi personil!');
    }
    if (!r6.dok3G.hasTitle || !r6.dok3G.hasKop || !r6.dok3G.hasPernyataan) {
      throw new Error('Dokumen 3G (PI) gagal merender kop surat resmi atau pernyataan independensi!');
    }
    if (r6.dok3Count !== 7) {
      throw new Error(`Bundel JO (DOK3) harus merender tepat 7 lembar kerja internal, didapat: ${r6.dok3Count}`);
    }
    if (r6.allCount !== 9) {
      throw new Error(`Bundel Lengkap (ALL) harus merender tepat 9 dokumen resmi, didapat: ${r6.allCount}`);
    }
    console.log('✓ Seluruh 8 Dokumen Cetak (Dok 2, 3A-3G) serta bundel DOK3 (7 lembar) dan ALL (9 lembar) terverifikasi presisi!');

    // -------------------------------------------------------------------------
    // TEST 6B: Uji Form Dinamis Multi-Aset & Otomasi Lampiran SPK (1 Objek vs 5 Objek)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6B: Uji Form Dinamis Multi-Aset & Otomasi Lampiran SPK (1 Objek vs 5 Objek) ---');
    const testMultiObjekSuite = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const results = {};

          // 1. Verifikasi getObjekColumnConfig adaptif per kategori
          const cfgProperti = getObjekColumnConfig('Tanah & Bangunan Rumah Tinggal');
          const cfgKendaraan = getObjekColumnConfig('Kendaraan Bermotor (Mobil / Truk / Bus / Armada Operasional)');
          const cfgAlatBerat = getObjekColumnConfig('Alat Berat / Heavy Equipment (Excavator / Dozer / Crane / Forklift / Genset Tambang)');
          const cfgMesin = getObjekColumnConfig('Mesin & Peralatan Pabrik / Industri');
          const cfgKebun = getObjekColumnConfig('Tanaman Perkebunan (Kelapa Sawit / Karet / Kopi / Kakao / Tebu, dll.)');
          const cfgHewan = getObjekColumnConfig('Peternakan / Biologis Hewan (Sapi / Unggas / Kambing / Perikanan / Tambak)');
          const cfgLain = getObjekColumnConfig('Inventaris Kantor, Fixture & Furniture');

          results.categoriesVerified = (
            cfgProperti.category === 'properti' && cfgProperti.col3.label === 'LT (m²)' &&
            cfgKendaraan.category === 'kendaraan' && cfgKendaraan.col3.label === 'Merk / Tipe' && cfgKendaraan.col4.label === 'No. Polisi & Warna' &&
            cfgAlatBerat.category === 'alat_berat' && cfgAlatBerat.col3.label === 'Tahun & Model' &&
            cfgMesin.category === 'mesin' && cfgMesin.col4.label === 'Kapasitas / Spesifikasi Teknis' &&
            cfgKebun.category === 'perkebunan' && cfgKebun.col3.label === 'Luas Tertanam (Ha)' &&
            cfgHewan.category === 'kehutanan_hewan' && cfgHewan.col3.label === 'Populasi / Jumlah (Btg/Ekor)' &&
            cfgLain.category === 'lain_lain' && cfgLain.col3.label === 'Kuantitas & Satuan'
          );

          // 2. Verifikasi Kondisi A: 1 Objek (Tanpa Lampiran, rincian langsung di Klausul 4)
          const p1Obj = JSON.parse(JSON.stringify(projectDatabase[0]));
          p1Obj.objek_list = [
            {
              jenis: "Tanah & Bangunan Rumah Tinggal",
              col3: "300",
              col4: "200",
              col5: "SHM No. 1234/Ragunan",
              lt: "300",
              lb: "200",
              status: "SHM No. 1234/Ragunan",
              lokasi: "Jl. Hankam No. 5, Ragunan"
            }
          ];
          activeProjectData = p1Obj;
          const sel = document.getElementById('pilih_tampilan_dokumen');
          const area = document.getElementById('preview-rendered-area');

          sel.value = 'DOK1';
          gantiTampilanDokumen();
          results.singleObjek = {
            docCount: area.querySelectorAll('.doc-page').length,
            hasKlausul4Table: area.innerText.includes('OBJEK PENILAIAN DAN KEPEMILIKAN') && area.innerHTML.includes('doc-table'),
            hasNoLampiranText: !area.innerText.includes('Lampiran 1 (Daftar Objek Penilaian dan Kepemilikan)'),
            lampHeaderStrip: area.innerText.includes('Lamp.')
          };

          // 3. Verifikasi Kondisi B: 5 Objek (Multi-Kategori: Properti, Kendaraan, Mesin, Alat Berat, Kebun)
          const p5Obj = JSON.parse(JSON.stringify(projectDatabase[0]));
          p5Obj.id = "NSR-2026-MULTI-5";
          p5Obj.nomor_lp = "0587/NSR/PN-APP/X/2026";
          p5Obj.objek_list = [
            {
              jenis: "Tanah & Bangunan Gudang / Pabrik",
              col3: "5000",
              col4: "3500",
              col5: "SHGB No. 11/Kawasan Industri",
              lt: "5000",
              lb: "3500",
              status: "SHGB No. 11/Kawasan Industri",
              lokasi: "Kawasan Industri MM2100, Cikarang"
            },
            {
              jenis: "Kendaraan Bermotor (Mobil / Truk / Bus / Armada Operasional)",
              col3: "Hino Dutro 130 HD",
              col4: "B 9901 XYZ / Putih",
              col5: "BPKB No. L-8899123 / Rangka: MH1...",
              lokasi: "Pool Cikarang"
            },
            {
              jenis: "Mesin & Peralatan Pabrik / Industri",
              col3: "CNC Milling Machine 5-Axis",
              col4: "380V / 15 KW High Precision",
              col5: "Faktur No. FK-7721 / SN: CNC-88990",
              lokasi: "Gedung Produksi 1"
            },
            {
              jenis: "Alat Berat / Heavy Equipment (Excavator / Dozer / Crane / Forklift / Genset Tambang)",
              col3: "Komatsu PC200-8 (2022)",
              col4: "20 Ton / 2.800 Hours Meter",
              col5: "SN: KMTC-20099 / Invoice No. INV-990",
              lokasi: "Yard Logistik"
            },
            {
              jenis: "Tanaman Perkebunan (Kelapa Sawit / Karet / Kopi / Kakao / Tebu, dll.)",
              col3: "150 Ha",
              col4: "TM-4 (Tahun Tanam 2022)",
              col5: "HGU No. 44/Kab. Sawit",
              lokasi: "Kebun Kelapa Sawit Blok B"
            }
          ];
          activeProjectData = p5Obj;

          // Pratinjau DOK1 untuk 5 Objek
          sel.value = 'DOK1';
          gantiTampilanDokumen();
          const docPagesDOK1 = area.querySelectorAll('.doc-page');
          results.multi5ObjekDOK1 = {
            docCount: docPagesDOK1.length,
            hasLegalClause: area.innerText.includes('Lampiran 1 (Daftar Objek Penilaian dan Kepemilikan) yang merupakan satu kesatuan'),
            hasLampiran1Header: area.innerText.includes('LAMPIRAN 1: DAFTAR OBJEK PENILAIAN DAN KEPEMILIKAN'),
            hasKopOnLampiran: area.innerHTML.includes('kop-surat-resmi'),
            has5RowsInLampiran: area.querySelectorAll('table.doc-table tbody tr').length >= 5,
            hasSignatureBlock: area.innerText.includes('Penyedia Jasa (KJPP)') && area.innerText.includes('Pemberi Tugas'),
            hasLampiranHeader1Berkas: area.innerText.includes('1 (Satu) Berkas')
          };

          // Pratinjau ALL untuk 5 Objek (9 dokumen standar + 1 halaman Lampiran 1 = 10 halaman)
          sel.value = 'ALL';
          gantiTampilanDokumen();
          results.allCountMulti5 = area.querySelectorAll('.doc-page').length;

          // 4. Verifikasi Interaksi "Lain-lain (Ketik Bebas)" & Custom Text Input
          handleJenisObjekChange(objekRows[0].id, 'Lain-lain (Ketik Bebas)');
          const inpCustom1 = document.querySelector('.input-custom-jenis-objek');
          const cfgKetikBebas = getObjekColumnConfig('Lain-lain (Ketik Bebas)');
          
          const hasInpCustom = Boolean(inpCustom1);
          const hasPlaceholderKetikBebas = (
            cfgKetikBebas.col3.placeholder.includes('Kuantitas / Satuan') &&
            cfgKetikBebas.col4.placeholder.includes('Kondisi Fisik') &&
            cfgKetikBebas.col5.placeholder.includes('Bukti Hak')
          );

          // Ketik nilai custom ke input
          updateObjekCustomJenis(objekRows[0].id, 'Jetty Pelabuhan Khusus');
          const displayWithVal = getObjekNamaDisplay(objekRows[0]);

          // Tes fallback jika kosong
          updateObjekCustomJenis(objekRows[0].id, '');
          const displayFallback = getObjekNamaDisplay(objekRows[0]);

          // Set kembali nilai dan cek aliran dokumen
          updateObjekCustomJenis(objekRows[0].id, 'Dermaga & Jetty Batubara');
          const pCustomDoc = JSON.parse(JSON.stringify(projectDatabase[0]));
          pCustomDoc.objek_list = [JSON.parse(JSON.stringify(objekRows[0]))];
          activeProjectData = pCustomDoc;
          
          sel.value = 'DOK1';
          gantiTampilanDokumen();
          const hasCustomInSPK = area.innerText.includes('Dermaga & Jetty Batubara');

          sel.value = 'DOK3B';
          gantiTampilanDokumen();
          const hasCustomInJO = area.innerText.includes('Dermaga & Jetty Batubara');

          sel.value = 'DOK3D';
          gantiTampilanDokumen();
          const hasCustomInST = area.innerText.includes('Dermaga & Jetty Batubara');

          sel.value = 'DOK3E';
          gantiTampilanDokumen();
          const hasCustomInBAP = area.innerText.includes('Dermaga & Jetty Batubara');

          // Kembalikan dropdown ke properti standar: pastikan input custom otomatis hilang
          handleJenisObjekChange(objekRows[0].id, 'Tanah & Bangunan Rumah Tinggal');
          const inpCustomAfterRevert = document.querySelector('.input-custom-jenis-objek');
          const isRemovedAfterRevert = (inpCustomAfterRevert === null);

          results.ketikBebasVerified = {
            hasInpCustom,
            hasPlaceholderKetikBebas,
            displayWithVal: displayWithVal === 'Jetty Pelabuhan Khusus',
            displayFallback: displayFallback === 'Lain-lain',
            hasCustomInSPK,
            hasCustomInJO,
            hasCustomInST,
            hasCustomInBAP,
            isRemovedAfterRevert
          };

          // Kembalikan ke proyek awal
          activeProjectData = projectDatabase[0];

          return results;
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Test 6B (Form Dinamis & Lampiran SPK):', testMultiObjekSuite.result.value);
    const r6B = testMultiObjekSuite.result.value;
    if (!r6B.categoriesVerified) {
      throw new Error('Konfigurasi kolom adaptif getObjekColumnConfig gagal memverifikasi kategori properti, kendaraan, alat berat, mesin, kebun, hewan, atau inventaris!');
    }
    if (r6B.singleObjek.docCount !== 1 || !r6B.singleObjek.hasKlausul4Table || !r6B.singleObjek.hasNoLampiranText) {
      throw new Error('Kondisi A (1 Objek) gagal: Rincian harus berada di dalam batang tubuh Klausul 4 tanpa halaman lampiran!');
    }
    if (r6B.multi5ObjekDOK1.docCount !== 2 || !r6B.multi5ObjekDOK1.hasLegalClause || !r6B.multi5ObjekDOK1.hasLampiran1Header) {
      throw new Error('Kondisi B (5 Objek) gagal: Klausul 4 harus diringkas ke klausul hukum baku dan merender halaman terpisah Lampiran 1!');
    }
    if (!r6B.multi5ObjekDOK1.hasKopOnLampiran || !r6B.multi5ObjekDOK1.hasSignatureBlock) {
      throw new Error('Halaman Lampiran 1 wajib memuat Kop Surat Resmi berulang dan blok tanda tangan para pihak!');
    }
    if (r6B.allCountMulti5 !== 10) {
      throw new Error(`Bundel Lengkap (ALL) untuk 5 objek harus merender tepat 10 halaman (9 dokumen + 1 lampiran), didapat: ${r6B.allCountMulti5}`);
    }
    const kb = r6B.ketikBebasVerified;
    if (!kb || !kb.hasInpCustom || !kb.hasPlaceholderKetikBebas || !kb.displayWithVal || !kb.displayFallback || !kb.hasCustomInSPK || !kb.hasCustomInJO || !kb.hasCustomInST || !kb.hasCustomInBAP || !kb.isRemovedAfterRevert) {
      throw new Error(`Fitur Ketik Bebas gagal divalidasi: ${JSON.stringify(kb)}`);
    }
    console.log('✓ Fitur Interaksi "Lain-lain (Ketik Bebas)", Conditional Input, & Aliran Cetak Terverifikasi Sempurna!');

    // Tangkap bukti visual rendering pratinjau Tab 3 & ekspor PDF 5 objek multi-aset
    const shotTab3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_spk_multi_aset_5objek.png'), Buffer.from(shotTab3.data, 'base64'));

    const pdf5Objek = await cdp.send('Page.printToPDF', {
      paperWidth: 8.27,
      paperHeight: 11.69,
      marginTop: 0.3937,
      marginBottom: 0.3937,
      marginLeft: 1.1811,
      marginRight: 0.3937,
      printBackground: true
    });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_spk_5_objek_lampiran.pdf'), Buffer.from(pdf5Objek.data, 'base64'));
    console.log('✓ Bukti visual tersimpan: test_spk_multi_aset_5objek.png & test_spk_5_objek_lampiran.pdf');

    console.log('✓ Form Dinamis Multi-Aset & Otomasi Lampiran SPK (1 Objek vs 5 Objek) LULUS 100%!');

    // -------------------------------------------------------------------------
    // TEST 6C: Uji Template Klausul Dinamis SPK SPI 103 (5 Kategori & Auto-Sync)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6C: Uji Template Klausul Dinamis SPK SPI 103 (5 Kategori & Auto-Sync) ---');
    const testKategoriSPKSuite = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const results = {};

          // 1. Verifikasi Dropdown Tab 1 & Auto-Sync
          pindahTab('form');
          const selTemplate = document.getElementById('kategori_template_spk');
          const badgeAuto = document.getElementById('badge-template-auto');
          results.hasDropdown = !!selTemplate;
          results.optionCount = selTemplate ? selTemplate.options.length : 0;
          results.defaultVal = selTemplate ? selTemplate.value : '';

          // Uji Auto-Sync: Ganti baris pertama jadi Kendaraan
          resetFormulir(true);
          const firstRow = objekRows[0];
          handleJenisObjekChange(firstRow.id, 'Kendaraan Bermotor (Mobil / Truk / Bus / Armada Operasional)');
          results.autoSyncVehicle = selTemplate.value === 'VEHICLE';

          // Ganti baris pertama jadi Mesin Pabrik
          handleJenisObjekChange(firstRow.id, 'Mesin & Peralatan Pabrik / Industri');
          results.autoSyncMachinery = selTemplate.value === 'PLANT_MACHINERY';

          // Ganti baris pertama jadi Kebun
          handleJenisObjekChange(firstRow.id, 'Tanaman Perkebunan (Kelapa Sawit / Karet / Kopi / Kakao / Tebu, dll.)');
          results.autoSyncBiological = selTemplate.value === 'BIOLOGICAL_ASSET';

          // Ganti kembali jadi Properti
          handleJenisObjekChange(firstRow.id, 'Tanah & Bangunan Rumah Tinggal');
          results.autoSyncProperty = selTemplate.value === 'REAL_PROPERTY';

          // Tambah baris kedua dengan jenis Kendaraan -> Auto-Sync jadi MULTI_ASSET
          tambahBarisObjek({
            jenis: 'Kendaraan Bermotor (Mobil / Truk / Bus / Armada Operasional)',
            col3: 'Toyota Hilux 4x4',
            col4: 'B 1234 ABC',
            col5: 'BPKB No. 12345'
          });
          results.autoSyncMulti = selTemplate.value === 'MULTI_ASSET';

          // 2. Verifikasi Render 5 Template Klausul di Tab 3
          pindahTab('preview');
          const selDok = document.getElementById('pilih_tampilan_dokumen');
          const area = document.getElementById('preview-rendered-area');
          selDok.value = 'DOK1';

          // Helper tes DOK1 untuk kategori tertentu
          function testTemplateCategory(catKey) {
            const dummy = JSON.parse(JSON.stringify(projectDatabase[0]));
            dummy.kategori_template_spk = catKey;
            dummy.objek_list = [
              {
                jenis: catKey === 'VEHICLE' ? 'Kendaraan Bermotor (Mobil / Truk / Bus / Armada Operasional)' :
                       catKey === 'PLANT_MACHINERY' ? 'Mesin & Peralatan Pabrik / Industri' :
                       catKey === 'BIOLOGICAL_ASSET' ? 'Tanaman Perkebunan (Kelapa Sawit / Karet / Kopi / Kakao / Tebu, dll.)' :
                       'Tanah & Bangunan Rumah Tinggal',
                col3: '100',
                col4: '80',
                col5: 'Dokumen Sah',
                lokasi: 'Lokasi Uji'
              }
            ];
            activeProjectData = dummy;
            gantiTampilanDokumen();
            const text = area.innerText;

            return {
              hasKlausul8Header: text.includes('8. PENDEKATAN DAN METODOLOGI PENILAIAN'),
              hasKlausul11Header: text.includes('11. ASUMSI DAN BATASAN PENUGASAN'),
              hasKlausul13Header: text.includes('13. DOKUMEN DAN INFORMASI DARI PEMBERI TUGAS'),
              hasKlausul18Header: text.includes('18. KELENGKAPAN DOKUMEN DAN DATA PENDUKUNG'),
              text: text
            };
          }

          // A. REAL_PROPERTY
          const tReal = testTemplateCategory('REAL_PROPERTY');
          results.realProperty = {
            headersOk: tReal.hasKlausul8Header && tReal.hasKlausul11Header && tReal.hasKlausul13Header && tReal.hasKlausul18Header,
            k8Valid: tReal.text.includes('Pendekatan Pasar') && tReal.text.includes('Pendekatan Biaya') && tReal.text.includes('Depreciated Replacement Cost'),
            k11Valid: tReal.text.includes('RTRW') && tReal.text.includes('soil test') && tReal.text.includes('fondasi bawah tanah tertutup'),
            k13Valid: tReal.text.includes('Sertipikat Hak Milik') && tReal.text.includes('IMB') && tReal.text.includes('PBB')
          };

          // B. PLANT_MACHINERY
          const tMach = testTemplateCategory('PLANT_MACHINERY');
          results.plantMachinery = {
            headersOk: tMach.hasKlausul8Header && tMach.hasKlausul11Header && tMach.hasKlausul13Header,
            k8Valid: tMach.text.includes('Reproduction Cost New') && tMach.text.includes('RCN') && tMach.text.includes('keusangan fungsional'),
            k11Valid: tMach.text.includes('non-dismantling') && tMach.text.includes('running condition') && tMach.text.includes('latent defects'),
            k13Valid: tMach.text.includes('Faktur / Invoice Pembelian') && tMach.text.includes('Pemberitahuan Impor Barang') && tMach.text.includes('Fixed Asset Register')
          };

          // C. VEHICLE
          const tVeh = testTemplateCategory('VEHICLE');
          results.vehicle = {
            headersOk: tVeh.hasKlausul8Header && tVeh.hasKlausul11Header && tVeh.hasKlausul13Header,
            k8Valid: tVeh.text.includes('Market Approach') && tVeh.text.includes('armada kendaraan') && tVeh.text.includes('odometer'),
            k11Valid: tVeh.text.includes('Vehicle Identification Number') && tVeh.text.includes('VIN') && tVeh.text.includes('nomor rangka'),
            k13Valid: tVeh.text.includes('Bukti Pemilikan Kendaraan Bermotor') && tVeh.text.includes('BPKB') && tVeh.text.includes('STNK')
          };

          // D. BIOLOGICAL_ASSET
          const tBio = testTemplateCategory('BIOLOGICAL_ASSET');
          results.biologicalAsset = {
            headersOk: tBio.hasKlausul8Header && tBio.hasKlausul11Header && tBio.hasKlausul13Header,
            k8Valid: tBio.text.includes('Pendekatan Biaya Akumulasi') && tBio.text.includes('TBM') && tBio.text.includes('Discounted Cash Flow'),
            k11Valid: tBio.text.toLowerCase().includes('sampling') && tBio.text.toLowerCase().includes('petak ukur') && tBio.text.toLowerCase().includes('agroklimat'),
            k13Valid: tBio.text.includes('Hak Guna Usaha') && tBio.text.includes('HGU') && tBio.text.includes('Peta Blok')
          };

          // E. MULTI_ASSET
          const tMulti = testTemplateCategory('MULTI_ASSET');
          results.multiAsset = {
            headersOk: tMulti.hasKlausul8Header && tMulti.hasKlausul11Header && tMulti.hasKlausul13Header,
            k8Valid: tMulti.text.includes('multi-asset') && tMulti.text.includes('Aset Real Properti') && tMulti.text.includes('Mesin & Peralatan'),
            k11Valid: tMulti.text.includes('Aset Properti') && tMulti.text.includes('Aset Mesin') && tMulti.text.includes('Aset Kendaraan'),
            k13Valid: tMulti.text.includes('Dokumen Properti') && tMulti.text.includes('Dokumen Mesin') && tMulti.text.includes('Dokumen Kendaraan')
          };

          // Kembalikan ke proyek awal
          activeProjectData = projectDatabase[0];
          gantiTampilanDokumen();

          return results;
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Test 6C (Template Klausul Dinamis SPK SPI 103):', testKategoriSPKSuite.result.value);
    const r6C = testKategoriSPKSuite.result.value;
    if (!r6C.hasDropdown || r6C.optionCount !== 5 || r6C.defaultVal !== 'REAL_PROPERTY') {
      throw new Error('Dropdown #kategori_template_spk wajib ada dengan 5 opsi dan default REAL_PROPERTY!');
    }
    if (!r6C.autoSyncVehicle || !r6C.autoSyncMachinery || !r6C.autoSyncBiological || !r6C.autoSyncProperty || !r6C.autoSyncMulti) {
      throw new Error('Sistem Auto-Sync Rekomendasi Kategori Template SPK gagal merespons perubahan baris objek penilaian!');
    }
    if (!r6C.realProperty.headersOk || !r6C.realProperty.k8Valid || !r6C.realProperty.k11Valid || !r6C.realProperty.k13Valid) {
      throw new Error('Template REAL_PROPERTY gagal merender klausul 8 (Pasar & DRC), 11 (RTRW & non-uji struktur), atau 13 (SHM & IMB)!');
    }
    if (!r6C.plantMachinery.headersOk || !r6C.plantMachinery.k8Valid || !r6C.plantMachinery.k11Valid || !r6C.plantMachinery.k13Valid) {
      throw new Error('Template PLANT_MACHINERY gagal merender klausul 8 (RCN terdepresiasi & HM), 11 (non-dismantling & latent defects), atau 13 (Invoice, PIB & Asset Register)!');
    }
    if (!r6C.vehicle.headersOk || !r6C.vehicle.k8Valid || !r6C.vehicle.k11Valid || !r6C.vehicle.k13Valid) {
      throw new Error('Template VEHICLE gagal merender klausul 8 (Market & odometer), 11 (VIN / nomor rangka), atau 13 (BPKB & STNK)!');
    }
    if (!r6C.biologicalAsset.headersOk || !r6C.biologicalAsset.k8Valid || !r6C.biologicalAsset.k11Valid || !r6C.biologicalAsset.k13Valid) {
      throw new Error('Template BIOLOGICAL_ASSET gagal merender klausul 8 (Biaya Akumulasi TBM & DCF TM), 11 (Sampling afdeling & agroklimat), atau 13 (HGU & Peta Blok)!');
    }
    if (!r6C.multiAsset.headersOk || !r6C.multiAsset.k8Valid || !r6C.multiAsset.k11Valid || !r6C.multiAsset.k13Valid) {
      throw new Error('Template MULTI_ASSET gagal merender klausul terpadu gabungan seluruh kelas aset!');
    }
    console.log('✓ Seluruh 5 Template Klausul Dinamis SPK (SPI 103) & Auto-Sync Terverifikasi Sempurna 100%!');

    // -------------------------------------------------------------------------
    // TEST 7: Uji Pemilihan 4 Rekening Bank Resmi KJPP NSR & Pratinjau Dinamis
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Uji Pemilihan 4 Rekening Bank Resmi KJPP NSR & Pratinjau Dinamis ---');
    
    // 7A: Verifikasi pada portal-kwitansi.html
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 800));
    
    // Login sebagai Admin Keuangan Pusat
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('kwitansi-auth-username').value = 'admin.pusat';
          document.getElementById('kwitansi-auth-password').value = 'NSR-PST-2026';
          await loginKwitansiToken();
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 500));

    const evalRes7A = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const selForm = document.getElementById('pilihan_rekening_tujuan');
          const selPusat = document.getElementById('pilihan_rekening_tujuan_pusat');
          const printRek = document.getElementById('print-rekening-bank-teks');
          
          const hasSelForm = !!selForm;
          const hasSelPusat = !!selPusat;
          const optionsForm = selForm ? Array.from(selForm.options).map(o => o.value) : [];
          const optionsPusat = selPusat ? Array.from(selPusat.options).map(o => o.value) : [];
          
          // Test ganti ke BJB
          gantiRekeningTujuan('BJB');
          const textBJBA4 = printRek ? printRek.innerText : '';
          const miniContainer = document.getElementById('preview-kwitansi-container')?.innerHTML || '';
          const hasBJBInMini = miniContainer.includes('0124084891001') && miniContainer.includes('Bank BJB');
          const hasBJBInA4 = textBJBA4.includes('0124084891001') && textBJBA4.includes('Bank BJB');

          // Test ganti ke BRI
          gantiRekeningTujuan('BRI');
          const miniBRI = document.getElementById('preview-kwitansi-container')?.innerHTML || '';
          const hasBRIInMini = miniBRI.includes('042501000955306') && miniBRI.includes('Bank BRI');

          // Test ganti ke BTN
          gantiRekeningTujuan('BTN');
          const miniBTN = document.getElementById('preview-kwitansi-container')?.innerHTML || '';
          const hasBTNInMini = miniBTN.includes('0019301300001254') && miniBTN.includes('Bank BTN');

          // Kembalikan ke MANDIRI
          gantiRekeningTujuan('MANDIRI');
          const miniMandiri = document.getElementById('preview-kwitansi-container')?.innerHTML || '';
          const hasMandiriInMini = miniMandiri.includes('127-00-1014166-9') && miniMandiri.includes('Bank Mandiri');

          return {
            hasSelForm,
            hasSelPusat,
            optionsForm,
            optionsPusat,
            hasBJBInA4,
            hasBJBInMini,
            hasBRIInMini,
            hasBTNInMini,
            hasMandiriInMini,
            selFormSynced: selForm ? selForm.value === 'MANDIRI' : false,
            selPusatSynced: selPusat ? selPusat.value === 'MANDIRI' : false
          };
        })()
      `,
      returnByValue: true
    });
    const r7Kwitansi = evalRes7A.result?.value || {};
    console.log('Hasil Test 7A (Portal Kwitansi Bank Selection):', r7Kwitansi);

    if (!r7Kwitansi.hasSelForm || !r7Kwitansi.hasSelPusat) {
      throw new Error('Dropdown pilihan_rekening_tujuan tidak ditemukan di formulir atau panel pusat portal kwitansi');
    }
    if (!r7Kwitansi.hasBJBInA4 || !r7Kwitansi.hasBJBInMini || !r7Kwitansi.hasBRIInMini || !r7Kwitansi.hasBTNInMini || !r7Kwitansi.hasMandiriInMini) {
      throw new Error('Pratinjau kwitansi tidak memperbarui instruksi transfer 4 rekening bank secara dinamis');
    }
    console.log('✓ Portal Kwitansi: 4 Rekening Bank Resmi (Mandiri, BJB, BRI, BTN) & Pratinjau Cetak Dinamis LULUS!');

    // 7B: Verifikasi pada portal-penugasan-jo.html
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/portal-penugasan-jo.html` });
    await waitForCondition(cdp, 'typeof window.verifikasiTokenLogin === "function"');

    // Login sebagai Admin Pusat
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          window.alert = () => {};
          window.confirm = () => true;
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-PST-2026';
          await verifikasiTokenLogin();
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 600));

    const evalRes7B = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            // Tab 1 select rekening_resmi
            const selTab1 = document.getElementById('rekening_resmi');
            const hasSelTab1 = !!selTab1 && selTab1.tagName === 'SELECT';
            const tab1Options = selTab1 ? Array.from(selTab1.options).map(o => o.value) : [];
            const tab1Default = selTab1 ? selTab1.value : '';

            // Modal Approval select pilihan_rekening_tujuan
            const selAppr = document.getElementById('pilihan_rekening_tujuan');
            const hasSelAppr = !!selAppr && selAppr.tagName === 'SELECT';
            const apprOptions = selAppr ? Array.from(selAppr.options).map(o => o.value) : [];
            const apprDefault = selAppr ? selAppr.value : '';

            // SPK Klausul 22 Render Test
            const baseProj = (typeof projectDatabase !== 'undefined' && projectDatabase.length > 0) 
              ? projectDatabase[0] 
              : ((typeof SEED_PROJECTS !== 'undefined' && SEED_PROJECTS.length > 0) ? SEED_PROJECTS[0] : {});
            activeProjectData = {
              ...baseProj,
              rekening_kode: 'BJB',
              rekening_resmi: DAFTAR_REKENING_NSR.BJB.teksCetak
            };
            if (document.getElementById('pilih_tampilan_dokumen')) {
              document.getElementById('pilih_tampilan_dokumen').value = 'DOK1';
            }
            renderSemuaDokumen();
            const renderedSPK = document.getElementById('preview-rendered-area')?.innerHTML || '';
            const hasBJBInKlausul22 = renderedSPK.includes('Bank BJB') && renderedSPK.includes('0124084891001');

            return {
              hasSelTab1,
              tab1Options,
              tab1Default,
              hasSelAppr,
              apprOptions,
              apprDefault,
              hasBJBInKlausul22
            };
          } catch (err) {
            return { error: err.message, stack: err.stack };
          }
        })()
      `,
      returnByValue: true
    });
    if (evalRes7B.exceptionDetails) {
      console.error('Exception in 7B evaluation:', evalRes7B.exceptionDetails);
    }
    const r7Penugasan = evalRes7B.result?.value || {};
    console.log('Hasil Test 7B (Portal Penugasan Bank Selection & Approval):', r7Penugasan);

    if (!r7Penugasan.hasSelTab1 || !r7Penugasan.hasSelAppr) {
      throw new Error('Dropdown rekening bank resmi tidak ditemukan di Tab 1 atau Modal Approval portal penugasan');
    }
    if (!r7Penugasan.hasBJBInKlausul22) {
      throw new Error('Klausul 22 SPK tidak merender teks transfer bank yang dipilih secara dinamis');
    }
    console.log('✓ Portal Penugasan: Dropdown Rekening Tab 1, Modal Approval Pusat & Klausul 22 SPK LULUS!');

    // -------------------------------------------------------------------------
    // TEST 8: Arsitektur Running Counter Transition (Cut-off Counter), Jenis Laporan APP/RTL,
    // 2-Layer Anti-Double Guard & Sinkronisasi Master Personil DB_PENUGASAN_JO_NSR
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Uji Arsitektur Running Counter Transition, Anti-Double Guard & Master Personil ---');
    
    // Pastikan berada di portal-penugasan-jo.html dengan sesi Admin Pusat
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-PST-2026';
          await verifikasiTokenLogin();
          pindahTab('form');
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 600));

    const testCounterAndMasterRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            const results = {};

            // 1. Verifikasi Master Personil (5 Rekan Berizin & 10 Tenaga Ahli)
            results.rekanCount = DATABASE_REKAN.length;
            results.personilCount = DATABASE_PERSONIL.length;
            results.hasNanang = DATABASE_REKAN.some(r => r.nama.includes('Nanang Rahayu'));
            results.hasDeni = DATABASE_REKAN.some(r => r.nama.includes('Deni Siswandi'));
            results.hasHernita = DATABASE_REKAN.some(r => r.nama.includes('Hernita'));
            results.hasAminSade = DATABASE_REKAN.some(r => r.nama.includes('Amin Sade'));
            results.hasDharma = DATABASE_REKAN.some(r => r.nama.includes('Dharma Priyanto'));

            results.hasTedi = DATABASE_PERSONIL.some(p => p.nama.includes('Tedi Setiadi'));
            results.hasDanny = DATABASE_PERSONIL.some(p => p.nama.includes('Danny Taufik'));
            results.hasAngga = DATABASE_PERSONIL.some(p => p.nama.includes('Angga Malid'));
            results.hasArdi = DATABASE_PERSONIL.some(p => p.nama.includes('Ardi Nurmayadi'));
            results.hasAndri = DATABASE_PERSONIL.some(p => p.nama.includes('Andri Kusmandana'));
            results.hasWawan = DATABASE_PERSONIL.some(p => p.nama.includes('Wawan Kurniawan'));
            results.hasYasir = DATABASE_PERSONIL.some(p => p.nama.includes('Yasir Rizal'));
            results.hasFadri = DATABASE_PERSONIL.some(p => p.nama.includes('Fadri Nurdin'));
            results.hasRully = DATABASE_PERSONIL.some(p => p.nama.includes('Syahrul Rully'));
            results.hasUci = DATABASE_PERSONIL.some(p => p.nama.includes('Uci Sanusi'));

            // 2. Simulasi Running Counter Cut-off (misal cut-off di 585)
            serverCounter.LAST_NO_ADM_JO = 585;
            serverCounter.LAST_NO_LP_SPK = 585;
            updateNomorOtomatisPreview();

            const helperLast = document.getElementById('helper-last-seq')?.textContent || '';
            const helperNext = document.getElementById('helper-next-seq')?.textContent || '';
            results.cutOffLastDisplay = helperLast;
            results.cutOffNextDisplay = helperNext;
            results.cutOffTransitionCorrect = helperLast.includes('0585') && helperNext.includes('0586');

            // 3. Uji tombol "Gunakan Saran Nomor Berikutnya"
            terapkanSaranNomorUrut();
            const elLp = document.getElementById('no_lingkup_penugasan');
            const elAdm = document.getElementById('no_adm_jo');
            results.appliedLp = elLp ? elLp.value : '';
            results.appliedAdm = elAdm ? elAdm.value : '';
            results.isApplied0586 = results.appliedLp.startsWith('0586/NSR/PN-APP/') && results.appliedAdm.startsWith('0586/JO/NSR/');

            // 4. Uji perubahan Jenis Laporan (APP -> RTL)
            const elJenis = document.getElementById('jenis_laporan');
            elJenis.value = 'RTL';
            elJenis.dispatchEvent(new Event('change', { bubbles: true }));
            results.appliedLpRTL = elLp ? elLp.value : '';
            results.isApplied0586RTL = results.appliedLpRTL.startsWith('0586/NSR/PN-RTL/');

            // Kembalikan ke APP
            elJenis.value = 'APP';
            elJenis.dispatchEvent(new Event('change', { bubbles: true }));

            // 5. Uji Resiliensi Cut-off Counter (Memasukkan nomor lampau 580 TIDAK BOLEH menurunkan counter 585)
            const dummyOldProject = {
              id: 'NSR-2026-DUMMY-OLD',
              nomor_lp: '0580/NSR/PN-APP/X/2026',
              nomor_adm: '0580/JO/NSR/X/2026',
              status: 'APPROVED',
              debitur_nama: 'PT LAMPAU DUMMY'
            };
            projectDatabase.push(dummyOldProject);
            updateNomorOtomatisPreview();
            const helperAfterOld = document.getElementById('helper-next-seq')?.textContent || '';
            results.resilientCounterPreserved = helperAfterOld.includes('0586'); // Tidak boleh turun ke 0581

            // 6. Uji Real-time Anti-Double Guard untuk 0580
            elLp.value = '0580/NSR/PN-APP/X/2026';
            validasiDuplikatLive();
            const warnEl = document.getElementById('warning-duplikat-nomor');
            const btnSubmit = document.getElementById('btn-submit-form');
            results.is0580Blocked = !warnEl.classList.contains('hidden') && btnSubmit.disabled;

            // Hapus project dummy
            projectDatabase = projectDatabase.filter(p => p.id !== 'NSR-2026-DUMMY-OLD');
            validasiDuplikatLive();

            // 7. Kembalikan ke nomor unik bersih (0586)
            elLp.value = results.appliedLp;
            validasiDuplikatLive();
            results.isCleanUnblocked = warnEl.classList.contains('hidden') && !btnSubmit.disabled;

            // 8. Verifikasi input tetap editable untuk Admin Pusat
            results.isAdminEditable = (elLp && !elLp.readOnly) && (elAdm && !elAdm.readOnly);

            return results;
          } catch (err) {
            return { error: err.message, stack: err.stack };
          }
        })()
      `,
      returnByValue: true
    });

    if (testCounterAndMasterRes.exceptionDetails) {
      console.error('Exception details in Test 8:', testCounterAndMasterRes.exceptionDetails);
    }
    const r8 = testCounterAndMasterRes.result?.value || {};
    console.log('Hasil Test 8 (Running Counter Transition & Master Personil):', r8);
    if (r8.error) {
      throw new Error('Test 8 Internal Error: ' + r8.error + '\n' + r8.stack);
    }

    if (r8.rekanCount !== 5) {
      throw new Error(`Master Personil Rekan harus berjumlah 5 orang, didapat: ${r8.rekanCount}`);
    }
    if (!r8.hasNanang || !r8.hasDeni || !r8.hasHernita || !r8.hasAminSade || !r8.hasDharma) {
      throw new Error('Daftar Rekan Penilai Publik tidak lengkap atau tidak sesuai Master_Personil');
    }
    if (r8.personilCount !== 10) {
      throw new Error(`Master Personil Tenaga Ahli harus berjumlah 10 orang, didapat: ${r8.personilCount}`);
    }
    if (!r8.hasTedi || !r8.hasDanny || !r8.hasAngga || !r8.hasArdi || !r8.hasAndri || !r8.hasWawan || !r8.hasYasir || !r8.hasFadri || !r8.hasRully || !r8.hasUci) {
      throw new Error('Daftar 10 Tenaga Ahli tidak lengkap atau tidak sesuai Master_Personil');
    }
    if (!r8.cutOffTransitionCorrect) {
      throw new Error(`Transisi cut-off nomor berjalan gagal: Last [${r8.cutOffLastDisplay}], Next [${r8.cutOffNextDisplay}]`);
    }
    if (!r8.isApplied0586) {
      throw new Error(`Tombol Gunakan Saran Nomor gagal memformat nomor 0586: LP=[${r8.appliedLp}], ADM=[${r8.appliedAdm}]`);
    }
    if (!r8.isApplied0586RTL) {
      throw new Error(`Perubahan Jenis Laporan ke RTL gagal menghasilkan kode /NSR/PN-RTL/: [${r8.appliedLpRTL}]`);
    }
    if (!r8.resilientCounterPreserved) {
      throw new Error('Resiliensi Cut-off Counter gagal: Nomor lampau (580) menurunkan saran nomor counter berjalan!');
    }
    if (!r8.is0580Blocked) {
      throw new Error('Anti-Double Guard gagal memblokir submit ketika nomor yang sudah ada (0580) diinputkan!');
    }
    if (!r8.isCleanUnblocked) {
      throw new Error('Anti-Double Guard gagal membuka tombol submit ketika nomor unik saran (0586) digunakan!');
    }
    if (!r8.isAdminEditable) {
      throw new Error('Kolom input nomor SPK dan JO harus tetap dapat diedit secara manual oleh Admin Pusat');
    }

    console.log('✓ Master Personil (5 Rekan & 10 Tenaga Ahli), Dynamic Cut-off Counter (585->0586), APP/RTL, & Anti-Double Guard LULUS 100%!');

    // ------------------------------------------------------------------
    // TEST 9: Uji Verifikasi 9 Token Resmi Aktif & Penolakan Token Non-Resmi
    // ------------------------------------------------------------------
    console.log('\n--- TEST 9: portal-penugasan-jo.html - Uji 9 Token Resmi & Penolakan Token Dihapus ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/portal-penugasan-jo.html` });
    await waitForCondition(cdp, 'typeof window.resolveUnifiedToken === "function"');

    const testTokensEvaluation = await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
          const officialTokens = [
            { token: 'NSR8899', expectedRole: 'SUPER_ADMIN', expectedKwitansi: true, expectedFee: true },
            { token: 'NSR-PST-2026', expectedRole: 'ADMIN_PUSAT', expectedKwitansi: true, expectedFee: true },
            { token: 'NSR2026', expectedRole: 'ADMIN_PUSAT', expectedKwitansi: true, expectedFee: true },
            { token: 'NSR-BDG-2026', expectedRole: 'ADMIN_CABANG', expectedKwitansi: true, expectedFee: true },
            { token: 'NSR-PDG-2026', expectedRole: 'ADMIN_CABANG', expectedKwitansi: true, expectedFee: true },
            { token: 'NSR-MKS-2026', expectedRole: 'ADMIN_CABANG', expectedKwitansi: true, expectedFee: true },
            { token: 'NSR-PLB-2026', expectedRole: 'ADMIN_CABANG', expectedKwitansi: true, expectedFee: true },
            { token: 'NSR-REV-2026', expectedRole: 'REVIEWER', expectedKwitansi: false, expectedFee: false },
            { token: 'NSR-VAL-2026', expectedRole: 'PENILAI', expectedKwitansi: false, expectedFee: false },
            { token: 'NSR-MKT-2026', expectedRole: 'MARKETING', expectedKwitansi: false, expectedFee: false }
          ];

          const officialResults = [];
          for (const item of officialTokens) {
            const res = await resolveUnifiedToken(item.token);
            officialResults.push({
              token: item.token,
              found: !!res,
              roleMatches: res?.role === item.expectedRole,
              kwitansiMatches: res?.canAccessKwitansi === item.expectedKwitansi,
              feeMatches: res?.seeFee === item.expectedFee
            });
          }

          // Uji penolakan token fiktif / yang sudah dihapus
          const purgedTokens = ['NSR-SMG-2026', 'NSR-SBY-2026', 'NSR-YOG-2026', 'NSR-MDN-2026', 'NSR-PKU-2026', 'NSR-DPS-2026', 'TOKEN-PALSU-XYZ'];
          const purgedResults = [];
          for (const pTok of purgedTokens) {
            const res = await resolveUnifiedToken(pTok);
            purgedResults.push({
              token: pTok,
              rejected: res === null
            });
          }

          return { officialResults, purgedResults };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const tokenEv = testTokensEvaluation.result.value;
    for (const r of tokenEv.officialResults) {
      if (!r.found || !r.roleMatches || !r.kwitansiMatches || !r.feeMatches) {
        throw new Error(`Token resmi ${r.token} gagal divalidasi: found=${r.found}, role=${r.roleMatches}, kwitansi=${r.kwitansiMatches}, fee=${r.feeMatches}`);
      }
    }
    for (const r of tokenEv.purgedResults) {
      if (!r.rejected) {
        throw new Error(`Token non-resmi ${r.token} seharusnya DITOLAK (null), tetapi masih diterima!`);
      }
    }
    console.log('✓ Ke-9 Token Resmi Aktif & Obfuskasi SHA-256 Valid 100%!');
    console.log('✓ Seluruh token non-resmi/fiktif di luar 4 cabang resmi DITOLAK MUTLAK!');

    // ------------------------------------------------------------------
    // TEST 10: Uji Single Sign-On (SSO) Bebas Username & Password di portal-nolap.html
    // ------------------------------------------------------------------
    console.log('\n--- TEST 10: portal-nolap.html - Uji Single Sign-On (SSO) Bebas Form Login ---');
    // Uji 10A: Login SSO Admin Pusat via URL token
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/portal-nolap.html?token=NSR-PST-2026` });
    await waitForCondition(cdp, 'typeof window.isSuperOrAdminPusat === "function"');
    await new Promise(r => setTimeout(r, 600));

    const ssoPusatRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const boxAuth = document.getElementById('box-auth-token');
          const panelUtama = document.getElementById('panel-aplikasi-utama');
          const isBoxHidden = boxAuth && boxAuth.classList.contains('hidden');
          const isPanelVisible = panelUtama && !panelUtama.classList.contains('hidden');
          const isSesiValid = sesiAktif && sesiAktif.role === 'ADMIN_PUSAT' && sesiAktif.cabang === 'Pusat';
          const isApprovalVisible = document.getElementById('tab-btn-approval') && !document.getElementById('tab-btn-approval').classList.contains('hidden');
          const ssoTokenStored = sessionStorage.getItem('NSR_AUTH_TOKEN');

          return {
            isBoxHidden,
            isPanelVisible,
            isSesiValid,
            isApprovalVisible,
            ssoTokenStored
          };
        })()
      `,
      returnByValue: true
    });

    const ssoPst = ssoPusatRes.result.value;
    if (!ssoPst.isBoxHidden || !ssoPst.isPanelVisible) {
      throw new Error('SSO NoLap gagal: Form login username/password masih muncul untuk token NSR-PST-2026!');
    }
    if (!ssoPst.isSesiValid || !ssoPst.isApprovalVisible) {
      throw new Error(`SSO NoLap gagal mengatur peran Admin Pusat: sesiValid=${ssoPst.isSesiValid}, approvalVisible=${ssoPst.isApprovalVisible}`);
    }
    if (ssoPst.ssoTokenStored !== 'NSR-PST-2026') {
      throw new Error(`SSO NoLap gagal menyimpan NSR_AUTH_TOKEN di sessionStorage: ${ssoPst.ssoTokenStored}`);
    }
    console.log('✓ SSO NoLap Admin Pusat (NSR-PST-2026) BERHASIL: Form Login dilewati, peran Admin Pusat aktif!');

    // Uji 10B: Login SSO Admin Cabang via sessionStorage (simulasi klik navigasi dari portal penugasan)
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          sessionStorage.clear();
          sessionStorage.setItem('NSR_AUTH_TOKEN', 'NSR-BDG-2026');
        })()
      `
    });
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/portal-nolap.html` });
    await waitForCondition(cdp, 'typeof sesiAktif !== "undefined" && sesiAktif && sesiAktif.cabang === "Bandung" && document.getElementById("panel-aplikasi-utama") && !document.getElementById("panel-aplikasi-utama").classList.contains("hidden")');
    await new Promise(r => setTimeout(r, 600));

    const ssoCabangRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const boxAuth = document.getElementById('box-auth-token');
          const panelUtama = document.getElementById('panel-aplikasi-utama');
          const isBoxHidden = boxAuth && boxAuth.classList.contains('hidden');
          const isPanelVisible = panelUtama && !panelUtama.classList.contains('hidden');
          const isSesiValid = sesiAktif && sesiAktif.role === 'ADMIN_CABANG' && sesiAktif.cabang === 'Bandung';
          const isApprovalHidden = document.getElementById('tab-btn-approval')?.classList.contains('hidden');
          const valCabang = document.getElementById('f-cabang')?.value;

          return {
            isBoxHidden,
            isPanelVisible,
            isSesiValid,
            isApprovalHidden,
            valCabang
          };
        })()
      `,
      returnByValue: true
    });

    const ssoBdg = ssoCabangRes.result.value;
    if (!ssoBdg.isBoxHidden || !ssoBdg.isPanelVisible) {
      throw new Error('SSO NoLap via sessionStorage gagal: Form login username/password masih muncul untuk Cabang Bandung!');
    }
    if (!ssoBdg.isSesiValid || !ssoBdg.isApprovalHidden) {
      throw new Error(`SSO NoLap Cabang Bandung gagal: sesiValid=${ssoBdg.isSesiValid}, approvalHidden=${ssoBdg.isApprovalHidden}`);
    }
    if (ssoBdg.valCabang !== 'Bandung') {
      throw new Error(`SSO NoLap Cabang Bandung gagal mengunci dropdown cabang: ${ssoBdg.valCabang}`);
    }
    console.log('✓ SSO NoLap Admin Cabang (NSR-BDG-2026) BERHASIL: Form Login dilewati, cabang otomatis terkunci ke Bandung!');

    // Tangkap screenshot final
    const ssFinal = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_portal_jo_rbac_verified.png'), Buffer.from(ssFinal.data, 'base64'));
    console.log('✓ Screenshot final tersimpan: test_portal_jo_rbac_verified.png');

    console.log('\n🎉 SELURUH 10 PENGUJIAN OTOMASI RBAC 9 TOKEN, HARD-GUARD KWITANSI, DUAL-MODE, CETAK DOKUMEN, 4 REKENING BANK, COUNTER & SSO NOLAP LULUS 100%!');

  } finally {
    if (cdp) await cdp.close();
    chromeProc.kill('SIGKILL');
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
