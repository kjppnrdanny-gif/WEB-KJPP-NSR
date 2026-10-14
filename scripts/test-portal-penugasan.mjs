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
          const tokens = ['NSR-PNL-2026', 'NSR-REV-2026', 'NSR-MKT-2026'];

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
        (() => {
          window.alert = () => {};
          sessionStorage.clear();
          localStorage.removeItem('nsr_private_jo_BDG');
          document.getElementById('input_token_auth').value = 'NSR-BDG-2026';
          verifikasiTokenLogin();
        })()
      `
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
        (() => {
          window.alert = () => {};
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-PST-2026';
          verifikasiTokenLogin();
        })()
      `
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
    // TEST 4: Kerahasiaan Komersial (Sensor Fee) untuk Penilai (NSR-PNL-2026)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 4: Uji Kerahasiaan Komersial / Sensor Fee untuk Penilai (NSR-PNL-2026) ---');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          window.alert = () => {};
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-PNL-2026';
          verifikasiTokenLogin();
        })()
      `
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
        (() => {
          window.alert = () => {};
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = 'NSR-REV-2026';
          verifikasiTokenLogin();
        })()
      `
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

    // Tangkap screenshot final
    const ssFinal = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_portal_jo_rbac_verified.png'), Buffer.from(ssFinal.data, 'base64'));
    console.log('✓ Screenshot final tersimpan: test_portal_jo_rbac_verified.png');

    console.log('\n🎉 SELURUH 5 PENGUJIAN OTOMASI RBAC, KEAMANAN KWITANSI & DUAL-MODE LULUS 100%!');

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
