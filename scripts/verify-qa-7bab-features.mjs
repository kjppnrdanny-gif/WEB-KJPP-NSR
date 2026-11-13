/**
 * scripts/verify-qa-7bab-features.mjs
 * Pengujian Khusus Fitur 7-Bab Master Prompt, 4 Tab Navigasi, Modal AI & Interlock NoLap
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
        console.log('BROWSER CONSOLE:', txt);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        console.error('BROWSER EXCEPTION:', data.params.exceptionDetails?.text, data.params.exceptionDetails?.exception?.description);
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
  console.log('VERIFIKASI FITUR 7-BAB MASTER PROMPT & TAB NAVIGASI PORTAL QA');
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
    window.location.reload();
  `);
  await new Promise(r => setTimeout(r, 1500));

  // Uji 1: Muat Sampel FIFA Medika (NOT_ACCEPTABLE)
  console.log('[UJI 1] Muat Sampel FIFA Medika & Periksa Bab I, V, VI (Tab 1)...');
  await evalJs(`muatSampelBerkas('fifa');`);
  await new Promise(r => setTimeout(r, 600));

  const fifaStatus = await evalJs(`activeReview?.status`);
  const fifaScore = await evalJs(`activeReview?.compliance_score`);
  const fifaGate = await evalJs(`activeReview?.gate_nolap_unlocked`);
  const fifaGateText = await evalJs(`document.getElementById('stat-gate-status')?.textContent?.trim()`);

  assert('Status FIFA Medika adalah NOT_ACCEPTABLE', fifaStatus === 'NOT_ACCEPTABLE', fifaStatus);
  assert('Skor kepatuhan FIFA Medika 30.0%', Number(fifaScore) === 30, fifaScore);
  assert('Gerbang NoLap FIFA Medika bernilai false (terkunci)', fifaGate === false, fifaGate);
  assert('Indikator Gerbang NoLap UI menampilkan TERKUNCI', fifaGateText?.includes('TERKUNCI'), fifaGateText);

  // Periksa isi Bab I (Tab 1)
  const objekNama = await evalJs(`document.getElementById('summary-objek-nama')?.textContent`);
  const pemberiTugas = await evalJs(`document.getElementById('summary-pemberi-tugas')?.textContent`);
  assert('Bab I: Nama Objek RS PT FIFA Medika', objekNama?.includes('PT FIFA MEDIKA'), objekNama);
  assert('Bab I: Pemberi Tugas BTN Cabang Padang', pemberiTugas?.includes('Bank Tabungan Negara'), pemberiTugas);

  // Periksa Bab V: Matriks Risiko (6 Kategori)
  const riskCount = await evalJs(`document.getElementById('risk-matrix-container')?.children?.length`);
  assert('Bab V: Menampilkan 6 dimensi matriks risiko', riskCount === 6, riskCount);

  await captureProof('bukti_qa_7bab_tab1_summary.png');

  // Uji 2: Pindah ke Tab 2 (Kepatuhan 8 Aspek Bab II)
  console.log('\n[UJI 2] Pindah ke Tab 2 (Kepatuhan 8 Aspek)...');
  await evalJs(`switchReviewTab(2)`);
  await new Promise(r => setTimeout(r, 300));

  const tab2Visible = await evalJs(`!document.getElementById('tab-pane-2')?.classList.contains('hidden')`);
  const tab1Hidden = await evalJs(`document.getElementById('tab-pane-1')?.classList.contains('hidden')`);
  const aspectsCount = await evalJs(`document.getElementById('compliance-matrix-container')?.children?.length`);

  assert('Tab 2 aktif terlihat', tab2Visible === true, tab2Visible);
  assert('Tab 1 tersembunyi', tab1Hidden === true, tab1Hidden);
  assert('Bab II: Memuat 8 aspek kepatuhan lengkap (A s/d H)', aspectsCount === 8, aspectsCount);

  await captureProof('bukti_qa_7bab_tab2_kepatuhan.png');

  // Uji 3: Pindah ke Tab 3 (Temuan & Ulang Hitung Bab III & IV)
  console.log('\n[UJI 3] Pindah ke Tab 3 (Temuan & Ulang Hitung)...');
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

  // Uji 4: Pindah ke Tab 4 (Rencana Tindakan Bab VII)
  console.log('\n[UJI 4] Pindah ke Tab 4 (Rencana Tindakan Bab VII)...');
  await evalJs(`switchReviewTab(4)`);
  await new Promise(r => setTimeout(r, 300));

  const tab4Visible = await evalJs(`!document.getElementById('tab-pane-4')?.classList.contains('hidden')`);
  const actionCards = await evalJs(`document.getElementById('action-plan-container')?.children?.length`);

  assert('Tab 4 aktif terlihat', tab4Visible === true, tab4Visible);
  assert('Bab VII: Memuat daftar kartu rencana tindakan perbaikan', actionCards >= 3, actionCards);

  await captureProof('bukti_qa_7bab_tab4_rencana_aksi.png');

  // Uji 5: Modal AI Deep Review & Master Prompt
  console.log('\n[UJI 5] Buka Modal AI Deep Review & Master Prompt 7-Bab...');
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

  // Uji 6: Muat Sampel Sarimukti (REQUIRES_MAJOR_REVISION)
  console.log('\n[UJI 6] Muat Sampel Sarimukti & Periksa Status Interlock NoLap...');
  await evalJs(`muatSampelBerkas('sarimukti')`);
  await new Promise(r => setTimeout(r, 600));

  const sariStatus = await evalJs(`activeReview?.status`);
  const sariScore = await evalJs(`activeReview?.compliance_score`);
  const sariGate = await evalJs(`activeReview?.gate_nolap_unlocked`);

  assert('Status Sarimukti adalah REQUIRES_MAJOR_REVISION', sariStatus === 'REQUIRES_MAJOR_REVISION', sariStatus);
  assert('Skor kepatuhan Sarimukti 68.0%', Number(sariScore) === 68, sariScore);
  assert('Gerbang NoLap Sarimukti bernilai false (terkunci)', sariGate === false, sariGate);

  // Uji 7: Uji Generator Deterministik 7-Bab (generate7ChapterReview)
  console.log('\n[UJI 7] Uji generate7ChapterReview()...');
  const genResult = await evalJs(`
    const sampleFindings = [
      { severity: 'CRITICAL', title: 'Error Sel', corrective_action: 'Perbaiki' }
    ];
    generate7ChapterReview(sampleFindings, 'Teks draf laporan rumah sakit padang', [{ pageNumber: 1, text: 'abc' }], [], {
      jobId: 'JO-NSR-TEST',
      fileName: 'Laporan_Test.pdf'
    });
  `);

  assert('Generator menghasilkan bab1_executive_summary', Boolean(genResult?.bab1_executive_summary));
  assert('Generator menghasilkan bab2_matriks_kepatuhan', Array.isArray(genResult?.bab2_matriks_kepatuhan) && genResult.bab2_matriks_kepatuhan.length === 8);
  assert('Generator menghasilkan bab4_pengujian_perhitungan', Array.isArray(genResult?.bab4_pengujian_perhitungan));
  assert('Generator menghasilkan bab5_analisis_risiko', Array.isArray(genResult?.bab5_analisis_risiko) && genResult.bab5_analisis_risiko.length === 6);
  assert('Generator mengunci NoLap bila ada temuan CRITICAL', genResult?.gate_nolap_unlocked === false);

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
  console.log('SEMUA FITUR 7-BAB MASTER PROMPT, 4 TAB & INTERLOCK NOLAP LULUS 100%!\n');
}
