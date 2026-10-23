import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const CHROME_PORT = 9568;
const TEST_HTTP_PORT = 8925;
const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

// Simple static server with MIME types
function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    // Mock /api/auth-verify
    if (req.url.startsWith('/api/auth-verify')) {
      const authHeader = req.headers['authorization'] || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        authenticated: true,
        user: {
          role: 'SUPER_ADMIN',
          roleLabel: 'SUPER ADMIN • KING',
          wilayah: 'Kantor Pusat Jakarta',
          wilayahLabel: 'Kantor Pusat Jakarta',
          isSuperAdmin: true,
          isKing: true,
          mode: 'PUSAT',
          canApprove: true,
          canSubmit: true,
          permissions: ['spm.review', 'divtek.review', 'lp.issue', 'nolap.issue', 'system.emergency_override', 'opr.view', 'opr.submit', 'admin.all']
        },
        expiresAt: Date.now() + 28800000
      }));
      return;
    }

    let filePath = path.join(ROOT_DIR, req.url.split('?')[0]);
    if (filePath.endsWith('/') || filePath.endsWith('\\')) filePath += 'portal-penugasan-jo.html';
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(TEST_HTTP_PORT, '127.0.0.1', () => resolve(server));
  });
}

async function runZeroTrustTestSuite() {
  console.log('========================================================================');
  console.log('  TEST SUITE: ZERO-TRUST SESSION INTEGRITY & TAB 3 OVERSIGHT (KING & ADMIN PUSAT)');
  console.log('========================================================================\n');

  const server = await startServer();
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-zero-trust-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1200',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const handlers = new Map();
  let dialogEvents = [];

  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.javascriptDialogOpening') {
      dialogEvents.push(m.params);
      // Automatically accept dialogs so execution doesn't block
      const dialogId = id++;
      ws.send(JSON.stringify({ id: dialogId, method: 'Page.handleJavaScriptDialog', params: { accept: true } }));
    }
    if (m.id && handlers.has(m.id)) {
      const cb = handlers.get(m.id);
      handlers.delete(m.id);
      cb(m.result !== undefined ? m.result : m);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    handlers.set(msgId, (res) => {
      if (res && res.error) reject(new Error(JSON.stringify(res.error)));
      else resolve(res);
    });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: KING SESSION — ANTI FALSE-POSITIVE ZERO-TRUST & TAB 3 ACCESS
    // -------------------------------------------------------------------------
    console.log('--- [1] PENGUJIAN SESI KING (SUPER_ADMIN) & AKSES TAB 3 ---');
    await send('Page.navigate', { url: `http://127.0.0.1:${TEST_HTTP_PORT}/portal-penugasan-jo.html` });
    
    // Tunggu sampai seluruh script halaman selesai diinisialisasi
    for (let i = 0; i < 30; i++) {
      const readyRes = await send('Runtime.evaluate', {
        expression: 'typeof window.simpanSesiSSO === "function" && typeof window.gantiTab === "function"'
      });
      if (readyRes.result?.value === true) break;
      await new Promise(r => setTimeout(r, 200));
    }

    dialogEvents = [];

    // Inject Modern Server Session for KING (tanpa tokenHash mentah)
    const setKingRes = await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          const kingSession = {
            valid: true,
            role: 'SUPER_ADMIN',
            roleLabel: 'SUPER ADMIN • KING',
            wilayah: 'Kantor Pusat Jakarta',
            wilayahLabel: 'Kantor Pusat Jakarta',
            isSuperAdmin: true,
            isKing: true,
            mode: 'PUSAT',
            canApprove: true,
            canSubmit: true,
            permissions: ['spm.review', 'divtek.review', 'lp.issue', 'nolap.issue', 'system.emergency_override', 'opr.view', 'opr.submit', 'admin.all']
          };
          window.simpanSesiSSO(kingSession);
          userSession = { ...userSession, ...kingSession };
          window.terapkanSesiUI(kingSession);
          return {
            sessionStored: Boolean(sessionStorage.getItem('NSR_USER_SESSION')),
            currentValid: Boolean(window.CURRENT_AUTH_SESSION && window.CURRENT_AUTH_SESSION.valid)
          };
        } catch (e) {
          return { error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    assert(setKingRes.result?.value?.sessionStored === true, 'Sesi KING tersimpan di sessionStorage tanpa error');

    // KING Klik Tab 3
    const clickTab3Res = await send('Runtime.evaluate', {
      expression: `(() => {
        gantiTab(3);
        const tab3 = document.getElementById('tab-3');
        const isTab3Visible = tab3 && !tab3.classList.contains('hidden');
        const lockScreen = document.getElementById('tab3-lock-screen');
        const isLockHidden = lockScreen ? (lockScreen.classList.contains('hidden') || lockScreen.style.display === 'none') : true;
        const previewArea = document.getElementById('preview-rendered-area');
        const previewHtml = previewArea ? previewArea.innerHTML : '';
        return {
          isTab3Visible,
          isLockHidden,
          hasDraftWatermark: previewHtml.includes('DRAFT — BELUM DIOTORISASI') || previewHtml.includes('watermark-draft'),
          hasOversightBanner: previewHtml.includes('DRAFT — BELUM DIOTORISASI (PRATINJAU VERIFIKASI)'),
          htmlLength: previewHtml.length
        };
      })()`,
      returnByValue: true
    });

    const val1 = clickTab3Res.result?.value || {};
    assert(dialogEvents.length === 0, 'Tidak ada alert False-Positive (Manipulasi data sesi lokal) saat KING klik Tab 3');
    assert(val1.isTab3Visible === true, 'Tab 3 terbuka secara mulus untuk peran KING');
    assert(val1.isLockHidden === true, 'Tab 3 Quality Gate lock screen tidak memblokir KING');
    assert(val1.hasOversightBanner === true, 'Banner Pengawasan & Verifikasi DRAFT tampil di Tab 3 saat berkas belum disetujui');
    assert(val1.hasDraftWatermark === true, 'Tanda Watermark "DRAFT — BELUM DIOTORISASI" terpasang pada lembar pratinjau');

    // -------------------------------------------------------------------------
    // TEST 2: ADMIN PUSAT — PRA-APPROVAL PREVIEW WAITING_APPROVAL
    // -------------------------------------------------------------------------
    console.log('\n--- [2] PENGUJIAN ADMIN PUSAT (PRA-APPROVAL PREVIEW) ---');
    dialogEvents = [];

    const setAdminPusatRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const pusatSession = {
          valid: true,
          role: 'ADMIN_PUSAT',
          roleLabel: 'ADMIN OPERASIONAL PUSAT',
          wilayah: 'Kantor Pusat Jakarta',
          wilayahLabel: 'Kantor Pusat Jakarta',
          isSuperAdmin: false,
          isAdminPusat: true,
          isKing: false,
          mode: 'PUSAT',
          canApprove: true,
          canSubmit: true
        };
        simpanSesiSSO(pusatSession);
        terapkanSesiUI(pusatSession);

        // Pilih proyek berstatus WAITING_APPROVAL
        const unapprovedProject = {
          id: 'JO-WAITING-TEST-001',
          nomor_lp: 'SPK-2026/PST/0099',
          nomor_jo: 'JO-2026/PST/0099',
          debitur_nama: 'PT BERKAH SEJAHTERA BERSAMA',
          klien_nama: 'BANK MANDIRI',
          status: 'WAITING_APPROVAL',
          status_approval: 'WAITING_APPROVAL',
          alur: 'PUSAT',
          tanggal_surat: '2026-10-24',
          objek_list: [{ jenis: 'Tanah dan Bangunan', lokasi: 'Jakarta Selatan' }]
        };
        window.DATA_PROYEK_TERPILIH = unapprovedProject;
        activeProjectData = unapprovedProject;
        perbaruiIndikatorTab3(unapprovedProject);
        gantiTab(3);

        const tab3 = document.getElementById('tab-3');
        const lockScreen = document.getElementById('tab3-lock-screen');
        const btnPrev = document.getElementById('btn-tab-preview');
        const previewArea = document.getElementById('preview-rendered-area');

        return {
          tab3Visible: tab3 && !tab3.classList.contains('hidden'),
          lockHidden: lockScreen ? (lockScreen.classList.contains('hidden') || lockScreen.style.display === 'none') : true,
          btnNotDisabled: btnPrev ? !btnPrev.classList.contains('cursor-not-allowed') : false,
          previewContainsDebitur: previewArea ? previewArea.innerHTML.includes('PT BERKAH SEJAHTERA BERSAMA') : false,
          hasOversightBanner: previewArea ? previewArea.innerHTML.includes('DRAFT — BELUM DIOTORISASI (PRATINJAU VERIFIKASI)') : false
        };
      })()`,
      returnByValue: true
    });

    const val2 = setAdminPusatRes.result?.value || {};
    assert(dialogEvents.length === 0, 'Admin Pusat membuka Tab 3 tanpa alert False-Positive');
    assert(val2.tab3Visible === true, 'Admin Pusat dapat membuka Tab 3 saat berkas WAITING_APPROVAL');
    assert(val2.lockHidden === true, 'Quality Gate TIDAK mengunci pratinjau verifikasi Admin Pusat');
    assert(val2.previewContainsDebitur === true, 'Dokumen 9 lembar pra-approval ter-render dengan rincian proyek');
    assert(val2.hasOversightBanner === true, 'Watermark/banner verifikasi aktif menjaga keabsahan dokumen sebelum persetujuan');

    // -------------------------------------------------------------------------
    // TEST 3: RBAC CABANG QUALITY GATE LOCKING
    // -------------------------------------------------------------------------
    console.log('\n--- [3] PENGUJIAN CABANG: QUALITY GATE ENFORCEMENT ---');
    dialogEvents = [];

    const setCabangRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const cabangSession = {
          valid: true,
          role: 'ADMIN_CABANG',
          roleLabel: 'Admin Cabang Padang',
          wilayah: 'Kantor Cabang Padang',
          wilayahLabel: 'Kantor Cabang Padang',
          isCabang: true,
          isSuperAdmin: false,
          isAdminPusat: false,
          isKing: false,
          mode: 'CABANG',
          canApprove: false,
          canSubmit: true
        };
        simpanSesiSSO(cabangSession);
        terapkanSesiUI(cabangSession);

        // Proyek Pengajuan Pusat yang masih WAITING_APPROVAL
        const unapprovedPusatProject = {
          id: 'JO-WAITING-CABANG-002',
          nomor_lp: 'SPK-2026/PDG/0010',
          nomor_jo: 'JO-2026/PDG/0010',
          debitur_nama: 'PT SUMBAR MAJU JAYA',
          status: 'WAITING_APPROVAL',
          status_approval: 'WAITING_APPROVAL',
          alur: 'PUSAT',
          mode_alur: 'CENTRAL_APPROVAL'
        };
        window.DATA_PROYEK_TERPILIH = unapprovedPusatProject;
        activeProjectData = unapprovedPusatProject;
        perbaruiIndikatorTab3(unapprovedPusatProject);

        // Cabang mencoba gantiTab(3)
        gantiTab(3);

        const tab3 = document.getElementById('tab-3');
        const tab2 = document.getElementById('tab-content-dashboard');
        return {
          tab3Hidden: tab3 ? tab3.classList.contains('hidden') : true,
          tab2Active: tab2 ? !tab2.classList.contains('hidden') : false
        };
      })()`,
      returnByValue: true
    });

    const val3 = setCabangRes.result?.value || {};
    assert(dialogEvents.length > 0, 'Cabang dibatasi dengan pesan Quality Gate resmi saat membuka berkas WAITING_APPROVAL');
    assert(val3.tab3Hidden === true, 'Tab 3 terkunci rapat untuk berkas Cabang yang belum diapprove');
    assert(val3.tab2Active === true, 'Navigasi Cabang dialihkan kembali ke Tab 2 (Dashboard & Antrean)');

    // -------------------------------------------------------------------------
    // TEST 4: MANDIRI CABANG APPROVED AKSES TAB 3 TERBUKA
    // -------------------------------------------------------------------------
    console.log('\n--- [4] PENGUJIAN CABANG: MANDIRI CABANG APPROVED AKSES TAB 3 ---');
    dialogEvents = [];

    const setMandiriRes = await send('Runtime.evaluate', {
      expression: `(() => {
        // Proyek Mandiri Cabang yang APPROVED_CABANG
        const mandiriProject = {
          id: 'JO-MANDIRI-CABANG-003',
          nomor_lp: 'SPK-2026/BDG/0045',
          nomor_jo: 'JO-2026/BDG/0045',
          debitur_nama: 'PT BANDUNG KREATIF MANDIRI',
          status: 'APPROVED',
          status_approval: 'APPROVED_CABANG',
          alur: 'MANDIRI',
          metode_penomoran: 'MANDIRI_CABANG',
          objek_list: [{ jenis: 'Tanah dan Bangunan', lokasi: 'Kota Bandung' }]
        };
        window.DATA_PROYEK_TERPILIH = mandiriProject;
        activeProjectData = mandiriProject;
        currentModeAlur = 'MANDIRI';
        perbaruiIndikatorTab3(mandiriProject);
        gantiTab(3);

        const tab3 = document.getElementById('tab-3');
        const lockScreen = document.getElementById('tab3-lock-screen');
        const previewArea = document.getElementById('preview-rendered-area');

        return {
          tab3Visible: tab3 && !tab3.classList.contains('hidden'),
          lockHidden: lockScreen ? (lockScreen.classList.contains('hidden') || lockScreen.style.display === 'none') : true,
          previewContainsDebitur: previewArea ? previewArea.innerHTML.includes('PT BANDUNG KREATIF MANDIRI') : false
        };
      })()`,
      returnByValue: true
    });

    const val4 = setMandiriRes.result?.value || {};
    assert(dialogEvents.length === 0, 'Mandiri Cabang Approved dapat membuka Tab 3 tanpa alert pemblokiran');
    assert(val4.tab3Visible === true, 'Tab 3 terbuka untuk Mandiri Cabang yang telah diotorisasi');
    assert(val4.previewContainsDebitur === true, 'Dokumen Mandiri Cabang ter-render dengan sempurna');

    // -------------------------------------------------------------------------
    // TEST 5: SESSION INTEGRITY CHECK (TIDAK MEMATIKAN SESI KARENA MISAL TOKEN HASH KOSONG)
    // -------------------------------------------------------------------------
    console.log('\n--- [5] PENGUJIAN ZERO-TRUST CHECK (SESI TANPA TOKEN HASH TETAP SAH) ---');
    const integrityRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const modernServerSession = {
          valid: true,
          role: 'SUPER_ADMIN',
          wilayah: 'Kantor Pusat Jakarta',
          expiresAt: Date.now() + 1000000
        };
        const checkResult = verifySessionChecksum(modernServerSession);
        const auditResult = auditSessionIntegrity();
        return {
          checkResult,
          auditResult
        };
      })()`,
      returnByValue: true
    });

    const val5 = integrityRes.result?.value || {};
    assert(val5.checkResult === true, 'verifySessionChecksum mengembalikan TRUE untuk sesi server tanpa tokenHash lokal');
    assert(val5.auditResult === true, 'auditSessionIntegrity mengembalikan TRUE tanpa mematikan paksa sesi valid');

    console.log('\n========================================================================');
    console.log(`  HASIL AKHIR: ${passed} / ${total} TESTS PASSED`);
    console.log('========================================================================\n');

  } finally {
    chrome.kill();
    server.close();
  }

  if (passed !== total) {
    process.exit(1);
  }
}

runZeroTrustTestSuite().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
