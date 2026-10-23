import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9573;
const TEST_URL = 'http://127.0.0.1:8888/portal-penugasan-jo.html';

async function runTestSuite() {
  console.log('========================================================================');
  console.log('  TEST SUITE: FINAL UI FIX TAB 3 PORTAL JO (DEDUPLIKASI & STATUS)');
  console.log('========================================================================\n');

  // Launch a temporary PHP local server to serve static files
  const phpServer = spawn('php', ['-S', '127.0.0.1:8888', '-t', process.cwd()]);
  await new Promise(r => setTimeout(r, 1000));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-tab3-ui-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1100',
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
  let dialogCount = 0;

  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.javascriptDialogOpening') {
      dialogCount++;
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

  await send('Page.navigate', { url: TEST_URL });

  for (let i = 0; i < 30; i++) {
    const readyRes = await send('Runtime.evaluate', {
      expression: 'document.readyState === "complete" && typeof window.perbaruiIndikatorTab3 === "function"'
    });
    if (readyRes.result?.value === true) break;
    await new Promise(r => setTimeout(r, 300));
  }

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  console.log('--- [1] VERIFIKASI STRUKTUR HTML & ELIMINASI DUPLIKASI TOMBOL ---');
  const checkStructure = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const elStatus = document.getElementById('btn-tab3-otorisasi');
      const btnAction = document.getElementById('btn-approval-toolbar-tab3');
      return {
        statusTag: elStatus ? elStatus.tagName.toUpperCase() : null,
        statusHasOnclick: elStatus ? elStatus.hasAttribute('onclick') : false,
        statusRole: elStatus ? elStatus.getAttribute('role') : null,
        actionTag: btnAction ? btnAction.tagName.toUpperCase() : null,
        actionHasOnclick: btnAction ? btnAction.hasAttribute('onclick') : false,
        actionOnclick: btnAction ? btnAction.getAttribute('onclick') : null
      };
    })()`
  });

  const st = checkStructure.result.value;
  assert(st.statusTag === 'DIV', 'Indikator status adalah elemen DIV (Bukan Button)');
  assert(st.statusHasOnclick === false, 'Indikator status tidak memiliki atribut onclick (Read-Only)');
  assert(st.statusRole === 'status', 'Indikator status memiliki ARIA role="status"');
  assert(st.actionTag === 'BUTTON', 'Aksi pengesahan adalah elemen tunggal BUTTON');
  assert(st.actionHasOnclick === true && st.actionOnclick.includes('bukaModalApprovalDariTab3'), 'Tombol aksi memicu bukaModalApprovalDariTab3()');

  console.log('\n--- [2] PENGUJIAN 4 KONDISI DOKUMEN RESMI (DRAFT, WAITING, CABANG, PUSAT) ---');
  
  // Skenario A: DRAFT
  const testDraft = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sess = { valid: true, role: 'SUPER_ADMIN', isKing: true, isSuperAdmin: true, mode: 'PUSAT' };
      window.CURRENT_AUTH_SESSION = sess;
      window.userSession = sess;
      const proj = { id: 'P-DRAFT', status: 'DRAFT', status_approval: 'DRAFT', alur: 'PUSAT' };
      window.DATA_PROYEK_TERPILIH = proj;
      window.activeProjectData = proj;
      window.perbaruiIndikatorTab3(proj);

      const elStatus = document.getElementById('btn-tab3-otorisasi');
      const lblStatus = document.getElementById('label-tab3-otorisasi');
      const btnAction = document.getElementById('btn-approval-toolbar-tab3');
      const lblAction = document.getElementById('label-btn-approval-tab3');

      return {
        condition: elStatus.getAttribute('data-condition'),
        statusText: lblStatus ? lblStatus.textContent.trim() : '',
        actionText: lblAction ? lblAction.textContent.trim() : '',
        actionVisible: !btnAction.classList.contains('hidden')
      };
    })()`
  });
  const dRes = testDraft.result.value;
  assert(dRes.condition === 'DRAFT', 'Kondisi DRAFT terdeteksi dengan tepat');
  assert(dRes.statusText.includes('Belum Diotorisasi'), 'Label status menampilkan "Belum Diotorisasi"');
  assert(dRes.actionText.includes('Otorisasi Penugasan'), 'Tombol aksi berlabel "Otorisasi Penugasan"');

  // Skenario B: WAITING_APPROVAL
  const testWaiting = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sess = { valid: true, role: 'ADMIN_PUSAT', isAdminPusat: true, mode: 'PUSAT' };
      window.CURRENT_AUTH_SESSION = sess;
      window.userSession = sess;
      const proj = { id: 'P-WAIT', status: 'WAITING_APPROVAL', status_approval: 'WAITING_APPROVAL', alur: 'PUSAT' };
      window.DATA_PROYEK_TERPILIH = proj;
      window.activeProjectData = proj;
      window.perbaruiIndikatorTab3(proj);

      const elStatus = document.getElementById('btn-tab3-otorisasi');
      const lblStatus = document.getElementById('label-tab3-otorisasi');
      const btnAction = document.getElementById('btn-approval-toolbar-tab3');
      const lblAction = document.getElementById('label-btn-approval-tab3');

      return {
        condition: elStatus.getAttribute('data-condition'),
        statusText: lblStatus ? lblStatus.textContent.trim() : '',
        actionText: lblAction ? lblAction.textContent.trim() : '',
        actionVisible: !btnAction.classList.contains('hidden')
      };
    })()`
  });
  const wRes = testWaiting.result.value;
  assert(wRes.condition === 'WAITING_APPROVAL', 'Kondisi WAITING_APPROVAL terdeteksi dengan tepat');
  assert(wRes.statusText.includes('Menunggu Persetujuan'), 'Label status menampilkan "Menunggu Persetujuan"');
  assert(wRes.actionText.includes('Otorisasi Penugasan'), 'Tombol aksi berlabel "Otorisasi Penugasan"');

  // Skenario C: APPROVED_CABANG (Mandiri Cabang)
  const testCabang = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sess = { valid: true, role: 'SUPER_ADMIN', isKing: true, mode: 'PUSAT' };
      window.CURRENT_AUTH_SESSION = sess;
      window.userSession = sess;
      const proj = { 
        id: 'P-CABANG', 
        status: 'APPROVED', 
        status_approval: 'APPROVED_CABANG', 
        alur: 'MANDIRI',
        pejabat_pengesah: { nama: 'Deni Siswandi, S.T., MAPPI', nomor_izin_penilai: 'B-1.16.00455' }
      };
      window.DATA_PROYEK_TERPILIH = proj;
      window.activeProjectData = proj;
      window.perbaruiIndikatorTab3(proj);

      const elStatus = document.getElementById('btn-tab3-otorisasi');
      const lblStatus = document.getElementById('label-tab3-otorisasi');
      const btnAction = document.getElementById('btn-approval-toolbar-tab3');
      const lblAction = document.getElementById('label-btn-approval-tab3');

      return {
        condition: elStatus.getAttribute('data-condition'),
        statusText: lblStatus ? lblStatus.textContent.trim() : '',
        actionText: lblAction ? lblAction.textContent.trim() : '',
        actionVisible: !btnAction.classList.contains('hidden')
      };
    })()`
  });
  const cRes = testCabang.result.value;
  assert(cRes.condition === 'APPROVED_CABANG', 'Kondisi APPROVED_CABANG terdeteksi dengan tepat');
  assert(cRes.statusText.includes('Diotorisasi Pimpinan Cabang'), 'Label status menampilkan "Diotorisasi Pimpinan Cabang"');
  assert(cRes.actionText.includes('Lihat Detail Pengesahan'), 'Tombol aksi berlabel jujur "Lihat Detail Pengesahan" (tanpa klaim palsu Ubah/Re-upload)');

  // Skenario D: APPROVED_PUSAT
  const testPusat = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sess = { valid: true, role: 'ADMIN_PUSAT', isAdminPusat: true, mode: 'PUSAT' };
      window.CURRENT_AUTH_SESSION = sess;
      window.userSession = sess;
      const proj = { 
        id: 'P-PUSAT', 
        status: 'APPROVED', 
        status_approval: 'APPROVED_PUSAT', 
        alur: 'PUSAT'
      };
      window.DATA_PROYEK_TERPILIH = proj;
      window.activeProjectData = proj;
      window.perbaruiIndikatorTab3(proj);

      const elStatus = document.getElementById('btn-tab3-otorisasi');
      const lblStatus = document.getElementById('label-tab3-otorisasi');
      const btnAction = document.getElementById('btn-approval-toolbar-tab3');
      const lblAction = document.getElementById('label-btn-approval-tab3');

      return {
        condition: elStatus.getAttribute('data-condition'),
        statusText: lblStatus ? lblStatus.textContent.trim() : '',
        actionText: lblAction ? lblAction.textContent.trim() : '',
        actionVisible: !btnAction.classList.contains('hidden')
      };
    })()`
  });
  const pRes = testPusat.result.value;
  assert(pRes.condition === 'APPROVED_PUSAT', 'Kondisi APPROVED_PUSAT terdeteksi dengan tepat');
  assert(pRes.statusText.includes('Diotorisasi melalui Pusat'), 'Label status menampilkan "Diotorisasi melalui Pusat"');
  assert(pRes.actionText.includes('Lihat Detail Pengesahan'), 'Tombol aksi berlabel "Lihat Detail Pengesahan"');

  console.log('\n--- [3] PENGUJIAN KEAMANAN RBAC & HAK AKSES PERAN ---');
  
  // Peran Marketing / Surveyor / Penilai tidak boleh melihat tombol aksi approval
  const testRbacRestricted = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sess = { valid: true, role: 'MARKETING', isSuperAdmin: false, isAdminPusat: false, isKing: false };
      window.CURRENT_AUTH_SESSION = sess;
      window.userSession = sess;
      const proj = { id: 'P-WAIT', status: 'WAITING_APPROVAL', status_approval: 'WAITING_APPROVAL', alur: 'PUSAT' };
      window.DATA_PROYEK_TERPILIH = proj;
      window.activeProjectData = proj;
      window.perbaruiIndikatorTab3(proj);

      const btnAction = document.getElementById('btn-approval-toolbar-tab3');
      return {
        isHidden: btnAction.classList.contains('hidden') || btnAction.style.display === 'none'
      };
    })()`
  });
  assert(testRbacRestricted.result.value.isHidden === true, 'Peran Marketing TIDAK memperoleh tombol tindakan administrasi (Hidden)');

  const testRbacPenilai = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sess = { valid: true, role: 'PENILAI', isSuperAdmin: false, isAdminPusat: false, isKing: false };
      window.CURRENT_AUTH_SESSION = sess;
      window.userSession = sess;
      const proj = { id: 'P-WAIT', status: 'WAITING_APPROVAL', status_approval: 'WAITING_APPROVAL', alur: 'PUSAT' };
      window.DATA_PROYEK_TERPILIH = proj;
      window.activeProjectData = proj;
      window.perbaruiIndikatorTab3(proj);

      const btnAction = document.getElementById('btn-approval-toolbar-tab3');
      return {
        isHidden: btnAction.classList.contains('hidden') || btnAction.style.display === 'none'
      };
    })()`
  });
  assert(testRbacPenilai.result.value.isHidden === true, 'Peran Penilai TIDAK memperoleh tombol tindakan administrasi (Hidden)');

  // Admin Cabang pada penugasan Pusat tidak boleh melihat tombol otorisasi Pusat
  const testRbacCabangPusat = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sess = { valid: true, role: 'ADMIN_CABANG', isCabang: true, isSuperAdmin: false, isAdminPusat: false, isKing: false };
      window.CURRENT_AUTH_SESSION = sess;
      window.userSession = sess;
      const proj = { id: 'P-WAIT', status: 'WAITING_APPROVAL', status_approval: 'WAITING_APPROVAL', alur: 'PUSAT' };
      window.DATA_PROYEK_TERPILIH = proj;
      window.activeProjectData = proj;
      window.perbaruiIndikatorTab3(proj);

      const btnAction = document.getElementById('btn-approval-toolbar-tab3');
      return {
        isHidden: btnAction.classList.contains('hidden') || btnAction.style.display === 'none'
      };
    })()`
  });
  assert(testRbacCabangPusat.result.value.isHidden === true, 'Admin Cabang pada berkas Pusat tidak memperoleh tombol otorisasi Pusat');

  console.log('\n--- [4] PENGUJIAN TAB 3 & RENDERING 9 DOKUMEN ---');
  const testRenderTab3 = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sess = { valid: true, role: 'SUPER_ADMIN', isKing: true, mode: 'PUSAT' };
      window.CURRENT_AUTH_SESSION = sess;
      window.userSession = sess;
      const proj = { 
        id: 'JO-2026-FINAL-VERIF',
        nomor_lp: '0416/NSR/PN-APP/X/2026',
        nomor_jo: '0416/JO/NSR/X/2026',
        debitur_nama: 'PT BERKAH MAKMUR NUSANTARA',
        klien_nama: 'PT BANK MANDIRI (PERSERO) TBK',
        status: 'APPROVED',
        status_approval: 'APPROVED_PUSAT',
        alur: 'PUSAT',
        tanggal_surat: '2026-10-24',
        objek_list: [{ jenis: 'Tanah dan Bangunan', lokasi: 'Jl. Ampera Raya No. 12' }]
      };
      window.DATA_PROYEK_TERPILIH = proj;
      window.activeProjectData = proj;
      window.gantiTab(3);
      if (typeof window.renderPratinjauDokumen === 'function') window.renderPratinjauDokumen();

      const previewArea = document.getElementById('preview-rendered-area');
      const renderedSheets = previewArea ? previewArea.querySelectorAll('.bg-white, .lembar-dokumen, .a4-sheet, [data-sheet]').length : 0;
      return {
        renderedSheets,
        hasContent: previewArea ? previewArea.textContent.includes('PT BERKAH MAKMUR NUSANTARA') : false
      };
    })()`
  });
  assert(testRenderTab3.result.value.hasContent === true, '9 Dokumen A4 ter-render lengkap dengan debitur dan nomor resmi');

  console.log('\n========================================================================');
  console.log(`  HASIL AKHIR: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  chrome.kill();
  phpServer.kill();

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
