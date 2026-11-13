/**
 * scripts/verify-qa-7bab-features.mjs
 * Pengujian Khusus Fitur 7-Bab Master Prompt, 4 Tab Navigasi (flex-col), Cold Start & Interlock NoLap
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = 8866;
const CHROME_PORT = 9599;
const TEMP_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-qa-7bab-'));

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(rootDir, parsedUrl.pathname.replace(/^\//, ''));
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
    filePath = path.join(rootDir, 'portal-qa-review.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png'
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

await new Promise(r => server.listen(PORT, r));
console.log(`Server verifikasi 7-Bab aktif pada http://localhost:${PORT}`);

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${CHROME_PORT}`,
  `--user-data-dir=${TEMP_PROFILE}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1440,960'
]);

let passed = 0;
let failed = 0;
function assert(desc, condition, actual = '') {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${desc} (Aktual: ${actual})`);
    failed++;
  }
}

try {
  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      if (v.ok) { connected = true; break; }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 250));
  }
  if (!connected) throw new Error('Gagal menghubungkan ke Chrome CDP port ' + CHROME_PORT);

  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();

  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.addEventListener('message', (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const txt = data.params.args.map(a => a.value || a.description).join(' ');
        // console.log('BROWSER CONSOLE:', txt);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        console.error('BROWSER EXCEPTION:', data.params.exceptionDetails?.text, data.params.exceptionDetails?.exception?.description);
      }
      if (data.method === 'Page.javascriptDialogOpening') {
        sendCdp('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      }
    } catch (_) {}
  });

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const timer = setTimeout(() => {
        ws.removeEventListener('message', handler);
        reject(new Error(`Timeout CDP: ${method}`));
      }, 15000);
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          clearTimeout(timer);
          ws.removeEventListener('message', handler);
          if (data.error) reject(new Error(JSON.stringify(data.error)));
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalJs(expr) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.error('EVAL JS EXCEPTION:', res.exceptionDetails.text, res.exceptionDetails.exception?.description);
    }
    return res.result ? res.result.value : null;
  }

  async function captureProof(filename) {
    const { data } = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(path.join(rootDir, filename), buffer);
    console.log(`  -> Bukti tersimpan: ${filename}`);
  }

  await sendCdp('Page.enable');
  await sendCdp('Page.navigate', { url: `http://localhost:${PORT}/portal-qa-review.html` });
  await new Promise(r => setTimeout(r, 1200));

  console.log('\n================================================================================');
  console.log('VERIFIKASI FITUR 7-BAB MASTER PROMPT, 4 TAB (FLEX-COL) & COLD START');
  console.log('================================================================================\n');

  // 1. Login sebagai Reviewer SPM (Tedi Setiadi - NSR-2019-007)
  await evalJs(`
    sessionStorage.setItem('nsr_user_session', JSON.stringify({
      token: 'NSR-2019-007',
      nama: 'Tedi Setiadi',
      role: 'REVIEWER_SPM',
      jabatan: 'Technical Reviewer SPM',
      nik: 'NSR-2019-007',
      avatar: 'T'
    }));
  `);
  await sendCdp('Page.navigate', { url: `http://localhost:${PORT}/portal-qa-review.html` });
  await new Promise(r => setTimeout(r, 1500));

  // Uji 0: Verifikasi State Cold Start (Mode Kerja Nyata - Live Bersih)
  console.log('[UJI 0] Verifikasi Cold Start: Default pada Mode Kerja Nyata (Live) Bersih...');
  const coldPresetVal = await evalJs(`document.getElementById('preset-demo-selector')?.value`);
  const coldGateText = await evalJs(`document.getElementById('stat-gate-status')?.textContent?.trim()`);
  const coldDocText = await evalJs(`document.getElementById('meta-doc-name')?.textContent?.trim()`);
  const coldDocTitle = await evalJs(`document.getElementById('meta-doc-name')?.getAttribute('title')`);
  const coldActiveReview = await evalJs(`window.activeReview`);

  assert('Preset demo selector bernilai kosong (Mode Kerja Nyata Live)', coldPresetVal === '', coldPresetVal);
  assert('Indikator Gerbang NoLap dalam status STANDBY', coldGateText?.includes('STANDBY'), coldGateText);
  assert('Nama dokumen belum ada berkas dimuat', coldDocText === 'Belum ada berkas dimuat', coldDocText);
  assert('Atribut title pada meta-doc-name diset "Belum ada berkas dimuat"', coldDocTitle === 'Belum ada berkas dimuat', coldDocTitle);
  assert('activeReview bernilai null (FIFA Medika TIDAK auto-load)', coldActiveReview === null, coldActiveReview);

  // Uji 1: Verifikasi Tata Letak 4 Tombol Tab 7-Bab (flex-col) & Badge JO whitespace-nowrap
  console.log('\n[UJI 1] Verifikasi Tata Letak 4 Tombol Tab (flex-col) & Badge JO...');
  const btn1Class = await evalJs(`document.getElementById('tab-btn-1')?.className`);
  const btn2Class = await evalJs(`document.getElementById('tab-btn-2')?.className`);
  const btn3Class = await evalJs(`document.getElementById('tab-btn-3')?.className`);
  const btn4Class = await evalJs(`document.getElementById('tab-btn-4')?.className`);

  assert('Tombol Tab 1 menggunakan class flex-col', btn1Class?.includes('flex-col'), btn1Class);
  assert('Tombol Tab 2 menggunakan class flex-col', btn2Class?.includes('flex-col'), btn2Class);
  assert('Tombol Tab 3 menggunakan class flex-col', btn3Class?.includes('flex-col'), btn3Class);
  assert('Tombol Tab 4 menggunakan class flex-col', btn4Class?.includes('flex-col'), btn4Class);

  const sublabelsCount = await evalJs(`document.querySelectorAll('.tab-sublabel')?.length`);
  assert('Ditemukan 4 elemen .tab-sublabel di bawah judul tab', sublabelsCount === 4, sublabelsCount);

  const joBadgeClass = await evalJs(`document.getElementById('summary-job-badge')?.className`);
  assert('Badge nomor JO Bab I memiliki class whitespace-nowrap', joBadgeClass?.includes('whitespace-nowrap'), joBadgeClass);
  assert('Badge nomor JO Bab I memiliki class shrink-0', joBadgeClass?.includes('shrink-0'), joBadgeClass);

  // Uji 2: Muat Simulasi RS FIFA Medika Lewat Dropdown (#preset-demo-selector)
  console.log('\n[UJI 2] Muat Simulasi RS FIFA Medika Lewat Dropdown...');
  await evalJs(`(() => {
    const sel = document.getElementById('preset-demo-selector');
    if (sel) sel.value = 'fifa';
    handleDemoPresetSelect('fifa');
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const fifaStatus = await evalJs(`activeReview?.status`);
  const fifaScore = await evalJs(`activeReview?.compliance_score`);
  const fifaGate = await evalJs(`activeReview?.gate_nolap_unlocked`);
  const fifaGateText = await evalJs(`document.getElementById('stat-gate-status')?.textContent?.trim()`);
  const fifaDocTitle = await evalJs(`document.getElementById('meta-doc-name')?.getAttribute('title')`);

  assert('Status FIFA Medika adalah NOT_ACCEPTABLE', fifaStatus === 'NOT_ACCEPTABLE', fifaStatus);
  assert('Skor kepatuhan FIFA Medika 30.0%', Number(fifaScore) === 30, fifaScore);
  assert('Gerbang NoLap FIFA Medika bernilai false (terkunci)', fifaGate === false, fifaGate);
  assert('Indikator Gerbang NoLap UI menampilkan TERKUNCI', fifaGateText?.includes('TERKUNCI'), fifaGateText);
  assert('Atribut title pada meta-doc-name memuat nama file PDF lengkap', fifaDocTitle?.includes('PT FIFA MEDIKA'), fifaDocTitle);

  // Periksa isi Bab I (Tab 1)
  const objekNama = await evalJs(`document.getElementById('summary-objek-nama')?.textContent`);
  const objekTitle = await evalJs(`document.getElementById('summary-objek-nama')?.getAttribute('title')`);
  const pemberiTugas = await evalJs(`document.getElementById('summary-pemberi-tugas')?.textContent`);
  assert('Bab I: Nama Objek RS PT FIFA Medika', objekNama?.includes('PT FIFA MEDIKA'), objekNama);
  assert('Bab I: summary-objek-nama memiliki atribut title', Boolean(objekTitle), objekTitle);
  assert('Bab I: Pemberi Tugas BTN Cabang Padang', pemberiTugas?.includes('Bank Tabungan Negara'), pemberiTugas);

  // Periksa Bab V: Matriks Risiko (6 Kategori)
  const riskCount = await evalJs(`document.getElementById('risk-matrix-container')?.children?.length`);
  assert('Bab V: Menampilkan 6 dimensi matriks risiko', riskCount === 6, riskCount);

  await captureProof('bukti_qa_7bab_tab1_summary.png');

  // Uji 3: Pindah ke Tab 2 (Kepatuhan 8 Aspek Bab II)
  console.log('\n[UJI 3] Pindah ke Tab 2 (Kepatuhan 8 Aspek)...');
  await evalJs(`switchReviewTab(2)`);
  await new Promise(r => setTimeout(r, 300));

  const tab2Visible = await evalJs(`!document.getElementById('tab-pane-2')?.classList.contains('hidden')`);
  const tab1Hidden = await evalJs(`document.getElementById('tab-pane-1')?.classList.contains('hidden')`);
  const aspectsCount = await evalJs(`document.getElementById('compliance-matrix-container')?.children?.length`);
  const btn2ActiveAfterSwitch = await evalJs(`document.getElementById('tab-btn-2')?.className`);

  assert('Tab 2 aktif terlihat', tab2Visible === true, tab2Visible);
  assert('Tab 1 tersembunyi', tab1Hidden === true, tab1Hidden);
  assert('Bab II: Memuat 8 aspek kepatuhan lengkap (A s/d H)', aspectsCount === 8, aspectsCount);
  assert('Tombol Tab 2 tetap flex-col setelah switchReviewTab', btn2ActiveAfterSwitch?.includes('flex-col'), btn2ActiveAfterSwitch);

  await captureProof('bukti_qa_7bab_tab2_kepatuhan.png');

  // Uji 4: Pindah ke Tab 3 (Temuan & Ulang Hitung Bab III & IV)
  console.log('\n[UJI 4] Pindah ke Tab 3 (Temuan & Ulang Hitung)...');
  await evalJs(`switchReviewTab(3)`);
  await new Promise(r => setTimeout(r, 300));

  const tab3Visible = await evalJs(`!document.getElementById('tab-pane-3')?.classList.contains('hidden')`);
  const findingsInContainer = await evalJs(`document.getElementById('findings-list-container')?.children?.length`);
  const recalcRows = await evalJs(`document.querySelectorAll('#recalc-table-container tbody tr')?.length`);

  assert('Tab 3 aktif terlihat', tab3Visible === true, tab3Visible);
  assert('Bab III: Container daftar temuan terisi kartu temuan', findingsInContainer > 0, findingsInContainer);
  assert('Bab IV: Tabel pengujian ulang perhitungan terisi baris kalkulasi', recalcRows > 0, recalcRows);

  // Uji Filter Temuan (CRITICAL)
  await evalJs(`filterTemuan('CRITICAL')`);
  await new Promise(r => setTimeout(r, 300));
  const critCards = await evalJs(`document.getElementById('findings-list-container')?.children?.length`);
  assert('Filter CRITICAL menampilkan kartu temuan kritis', critCards >= 1, critCards);

  await captureProof('bukti_qa_7bab_tab3_temuan_recalc.png');

  // Uji 5: Pindah ke Tab 4 (Rencana Tindakan Bab VII)
  console.log('\n[UJI 5] Pindah ke Tab 4 (Rencana Tindakan Bab VII)...');
  await evalJs(`switchReviewTab(4)`);
  await new Promise(r => setTimeout(r, 300));

  const tab4Visible = await evalJs(`!document.getElementById('tab-pane-4')?.classList.contains('hidden')`);
  const actionCards = await evalJs(`document.getElementById('action-plan-container')?.children?.length`);

  assert('Tab 4 aktif terlihat', tab4Visible === true, tab4Visible);
  assert('Bab VII: Memuat daftar kartu rencana tindakan perbaikan', actionCards >= 3, actionCards);

  await captureProof('bukti_qa_7bab_tab4_rencana_aksi.png');

  // Uji 6: Modal AI Deep Review & Master Prompt
  console.log('\n[UJI 6] Buka Modal AI Deep Review & Master Prompt 7-Bab...');
  await evalJs(`bukaModalAIPrompt()`);
  await new Promise(r => setTimeout(r, 300));

  const modalAiVisible = await evalJs(`!document.getElementById('modal-ai-review')?.classList.contains('hidden')`);
  assert('Modal AI Review (#modal-ai-review) terbuka', modalAiVisible === true, modalAiVisible);

  const hasPromptConst = await evalJs(`typeof MASTER_PROMPT_TECHNICAL_REVIEW_NSR === 'string' && MASTER_PROMPT_TECHNICAL_REVIEW_NSR.length > 500`);
  assert('Konstanta MASTER_PROMPT_TECHNICAL_REVIEW_NSR tersedia & lengkap', hasPromptConst === true, hasPromptConst);

  await captureProof('bukti_qa_7bab_modal_ai_prompt.png');

  await evalJs(`tutupModalAIPrompt()`);
  await new Promise(r => setTimeout(r, 200));
  const modalAiClosed = await evalJs(`document.getElementById('modal-ai-review')?.classList.contains('hidden')`);
  assert('Modal AI Review berhasil ditutup', modalAiClosed === true, modalAiClosed);

  // Uji 7: Muat Sampel Sarimukti (Permata Harapan) Lewat Dropdown
  console.log('\n[UJI 7] Muat Sampel Sarimukti Lewat Dropdown & Periksa Title Dokumen...');
  await evalJs(`(() => {
    const sel = document.getElementById('preset-demo-selector');
    if (sel) sel.value = 'permata';
    handleDemoPresetSelect('permata');
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const sariStatus = await evalJs(`activeReview?.status`);
  const sariScore = await evalJs(`activeReview?.compliance_score`);
  const sariGate = await evalJs(`activeReview?.gate_nolap_unlocked`);
  const sariDocTitle = await evalJs(`document.getElementById('meta-doc-name')?.getAttribute('title')`);

  assert('Status Sarimukti adalah REQUIRES_MAJOR_REVISION', sariStatus === 'REQUIRES_MAJOR_REVISION', sariStatus);
  assert('Skor kepatuhan Sarimukti 68.0%', Number(sariScore) === 68, sariScore);
  assert('Gerbang NoLap Sarimukti bernilai false (terkunci)', sariGate === false, sariGate);
  assert('Atribut title pada meta-doc-name memuat nama berkas Sarimukti lengkap', (sariDocTitle?.includes('Permata Harapan Sarimukti') || sariDocTitle?.includes('Permata_Harapan_Sarimukti')), sariDocTitle);

  // Uji 8: Kembalikan Dropdown ke Mode Kerja Nyata (Live) & Pastikan Bersih
  console.log('\n[UJI 8] Kembalikan Dropdown ke Mode Kerja Nyata (Live) & Pastikan Bersih...');
  await evalJs(`(() => {
    const sel = document.getElementById('preset-demo-selector');
    if (sel) sel.value = '';
    handleDemoPresetSelect('');
  })()`);
  await new Promise(r => setTimeout(r, 400));

  const postResetActiveReview = await evalJs(`window.activeReview`);
  const postResetGate = await evalJs(`document.getElementById('stat-gate-status')?.textContent?.trim()`);
  const postResetDoc = await evalJs(`document.getElementById('meta-doc-name')?.textContent?.trim()`);

  assert('Kembali ke Mode Kerja Nyata: activeReview bersih (null)', postResetActiveReview === null, postResetActiveReview);
  assert('Kembali ke Mode Kerja Nyata: Gerbang NoLap STANDBY', postResetGate?.includes('STANDBY'), postResetGate);
  assert('Kembali ke Mode Kerja Nyata: meta-doc-name kembali bersih', postResetDoc === 'Belum ada berkas dimuat', postResetDoc);

  ws.close();
} finally {
  chrome.kill();
  server.close();
  try {
    fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
  } catch (_) {}
}

console.log('\n================================================================================');
console.log(`TOTAL PENGUJIAN 7-BAB: ${passed + failed} | LULUS: ${passed} | GAGAL: ${failed}`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('SEMUA 3 PENYEMPURNAAN UI/UX & FITUR 7-BAB LULUS 100% SEMPURNA!\n');
}
