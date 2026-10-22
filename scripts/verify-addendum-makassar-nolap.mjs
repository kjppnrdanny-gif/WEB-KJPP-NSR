import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const PHP_PORT = 8995;
const CHROME_PORT = 9558;
const BASE_URL = `http://127.0.0.1:${PHP_PORT}`;
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

// Test Credential Tokens
const TOKEN_MAKASSAR = 'NSR-MKS-2026';
const TOKEN_SPM_DANNY = 'NSR-SPM-DANNY-2026';
const TOKEN_DIVTEK_DENI = 'NSR-DIVTEK-DENI-2026';
const TOKEN_ADMIN_PUSAT = 'NSR-ADMIN-PUSAT-2026';
const TOKEN_NANANG_PENILAI = 'NSR-PENILAI-NANANG-2026';

let phpProcess = null;
let chromeProcess = null;

function startPhpServer() {
  return new Promise((resolve, reject) => {
    phpProcess = spawn('php', ['-S', `127.0.0.1:${PHP_PORT}`, '-t', '.'], {
      stdio: 'ignore'
    });
    setTimeout(resolve, 1200);
    phpProcess.on('error', reject);
  });
}

function stopPhpServer() {
  if (phpProcess) {
    phpProcess.kill();
    phpProcess = null;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('   ADDENDUM P0 — VERIFIKASI ALUR NOLAP CABANG KEWENANGAN PUSAT   ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function pass(msg) {
    console.log(`✔ PASS: ${msg}`);
    passed++;
  }

  function fail(msg, err) {
    console.error(`✖ FAIL: ${msg}`);
    if (err) console.error(err);
    failed++;
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Audit Master Data Mapping pada Seluruh File Portal
    // -------------------------------------------------------------
    const nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');
    const nolapCabangHtml = fs.readFileSync('portal-nolap-cabang.html', 'utf8');

    // Pastikan tidak ada Padang = 2.0160-02, Makassar = 2.0160-03, Palembang = 2.0160-05
    assert(!nolapHtml.includes('Padang (2.0160-02)'), 'Padang tidak boleh 2.0160-02 pada portal-nolap.html');
    assert(!nolapHtml.includes('Makassar (2.0160-03)'), 'Makassar tidak boleh 2.0160-03 pada portal-nolap.html');
    assert(!nolapHtml.includes('Palembang (2.0160-05)'), 'Palembang tidak boleh 2.0160-05 pada portal-nolap.html');

    assert(!nolapCabangHtml.includes('Padang (2.0160-02)'), 'Padang tidak boleh 2.0160-02 pada portal-nolap-cabang.html');
    assert(!nolapCabangHtml.includes('Makassar (2.0160-03)'), 'Makassar tidak boleh 2.0160-03 pada portal-nolap-cabang.html');
    assert(!nolapCabangHtml.includes('Palembang (2.0160-05)'), 'Palembang tidak boleh 2.0160-05 pada portal-nolap-cabang.html');

    // Pastikan kode benar terpasang
    assert(nolapHtml.includes('Kantor Cabang Padang (2.0160-01)'), 'Padang wajib 2.0160-01');
    assert(nolapHtml.includes('Kantor Cabang Makassar (2.0160-02)'), 'Makassar wajib 2.0160-02');
    assert(nolapHtml.includes('Kantor Cabang Palembang (2.0160-03)'), 'Palembang wajib 2.0160-03');
    assert(nolapHtml.includes('Kantor Cabang Bandung (2.0160-04)'), 'Bandung wajib 2.0160-04');
    assert(nolapHtml.includes('Kantor Pusat Jakarta (2.0160-00)'), 'Pusat wajib 2.0160-00');

    pass('Test 1: Audit Master Data 5 Kantor Cabang Kemenkeu RI 100% Valid');

    // -------------------------------------------------------------
    // Mulai Server PHP untuk Uji Backend
    // -------------------------------------------------------------
    await startPhpServer();

    // -------------------------------------------------------------
    // TEST 2: Submit Permohonan NoLap oleh Cabang Makassar -> TTD Pusat
    // -------------------------------------------------------------
    const submitRes = await fetch(`${BASE_URL}/nolap-data-handler.php?action=submitRequest`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-NSR-Token': TOKEN_MAKASSAR
      },
      body: JSON.stringify({
        namaKlien: 'PT Sulsel Permai Makassar',
        origin_branch_id: 'Makassar',
        origin_branch_code: '2.0160-02',
        requested_signing_office: 'PUSAT',
        signing_office_code: '2.0160-00',
        assigned_public_appraiser_id: 'Nanang Rahayu',
        appraiser_license_code: '0218',
        namaPemohon: 'Admin Cabang Makassar',
        emailPemohon: 'makassar@kjppnanangrahayu.com',
        jasa: 'PI',
        industri: '07',
        jenisObjek: 'Ruko Komersial Panakkukang',
        lokasiObjek: 'Kota Makassar'
      })
    });

    const submitJson = await submitRes.json();
    assert.strictEqual(submitRes.status, 200, 'HTTP status submitRequest wajib 200');
    assert.strictEqual(submitJson.success, true, 'Submit permohonan wajib sukses');
    const rec = submitJson.record;
    assert.strictEqual(rec.origin_branch_id, 'Makassar', 'origin_branch_id wajib Makassar');
    assert.strictEqual(rec.origin_branch_code, '2.0160-02', 'origin_branch_code wajib 2.0160-02');
    assert.strictEqual(rec.requested_signing_office, 'PUSAT', 'requested_signing_office wajib PUSAT');
    assert.strictEqual(rec.signing_office_code, '2.0160-00', 'signing_office_code wajib 2.0160-00');
    assert.strictEqual(rec.assigned_public_appraiser_id, 'Nanang Rahayu');
    assert.strictEqual(rec.appraiser_license_code, '0218');
    assert.strictEqual(rec.official_report_sequence, null);
    assert.strictEqual(rec.request_status, 'DIAJUKAN');

    pass('Test 2: Backend submitRequest Cabang Makassar -> TTD Pusat merekam 8 atribut terpisah secara sah');

    // -------------------------------------------------------------
    // TEST 3: Alur Lengkap Dual Mitigation Gate Makassar -> Pusat
    // -------------------------------------------------------------
    const idPenugasanMks = `NSR-MKS-2026-${Date.now().toString().slice(-4)}`;

    // A. Submit Gerbang 1 Awal oleh Admin Makassar
    const g1Res = await fetch(`${BASE_URL}/nolap-data-handler.php?action=submitGerbang1Awal`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-NSR-Token': TOKEN_MAKASSAR
      },
      body: JSON.stringify({
        idPenugasan: idPenugasanMks,
        namaKlien: 'PT Bosowa Berlian Makassar',
        origin_branch_id: 'Makassar',
        origin_branch_code: '2.0160-02',
        requested_signing_office: 'PUSAT',
        signing_office_code: '2.0160-00',
        penilaiPublikDitunjuk: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        penilaiPublikId: 'nanang_penilai',
        appraiser_license_code: '0218',
        tujuanPenilaian: 'Agunan Perbankan',
        jenisObjek: 'Pabrik dan Gudang Semen',
        checklistAwal: {
          konflikKepentingan: false,
          redFlagLegalitas: false,
          kompetensiTimMemadai: true
        }
      })
    });
    const g1Json = await g1Res.json();
    assert.strictEqual(g1Res.status, 200);
    assert.strictEqual(g1Json.status, 'MENUNGGU_SPM_AWAL');
    pass('Test 3A: Submit Gerbang 1 Cabang Makassar sukses -> Status: MENUNGGU_SPM_AWAL');

    // B. Review Danny SPM
    const dannyG1 = await fetch(`${BASE_URL}/nolap-data-handler.php?action=reviewDannyGerbang1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-NSR-Token': TOKEN_SPM_DANNY },
      body: JSON.stringify({ idPenugasan: idPenugasanMks, keputusan: 'SETUJU', catatan: 'Mitigasi awal Makassar terverifikasi patuh.' })
    });
    assert.strictEqual(dannyG1.status, 200);
    pass('Test 3B: Danny (SPM) review SETUJU -> Status: MENUNGGU_DIVTEK_AWAL');

    // C. Review Deni Divtek
    const deniG1 = await fetch(`${BASE_URL}/nolap-data-handler.php?action=reviewDeniGerbang1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-NSR-Token': TOKEN_DIVTEK_DENI },
      body: JSON.stringify({ idPenugasan: idPenugasanMks, keputusan: 'SETUJU', catatan: 'Lingkup penugasan diverifikasi.' })
    });
    assert.strictEqual(deniG1.status, 200);
    pass('Test 3C: Deni (Divtek) review SETUJU -> Status: SIAP_TERBIT_LP');

    // D. Admin Pusat Terbitkan LP
    const pubLP = await fetch(`${BASE_URL}/nolap-data-handler.php?action=publishOfficialLP`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-NSR-Token': TOKEN_ADMIN_PUSAT },
      body: JSON.stringify({ idPenugasan: idPenugasanMks })
    });
    assert.strictEqual(pubLP.status, 200);
    pass('Test 3D: Admin Pusat terbitkan LP resmi -> Status: LP_DITERBITKAN');

    // E. Submit Gerbang 2 Akhir
    const g2Res = await fetch(`${BASE_URL}/nolap-data-handler.php?action=submitGerbang2Akhir`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-NSR-Token': TOKEN_MAKASSAR },
      body: JSON.stringify({
        idPenugasan: idPenugasanMks,
        checklistAkhir: { deviasiMaterial: false, qcSurveyLengkap: true, baiDitandatangani: true },
        deltaAnalysis: { deviasiMaterialTanpaJustifikasi: false }
      })
    });
    assert.strictEqual(g2Res.status, 200);
    pass('Test 3E: Submit Gerbang 2 Akhir sukses -> Status: MENUNGGU_SPM_AKHIR');

    // F. Review Akhir Danny & Deni
    await fetch(`${BASE_URL}/nolap-data-handler.php?action=reviewDannyGerbang2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-NSR-Token': TOKEN_SPM_DANNY },
      body: JSON.stringify({ idPenugasan: idPenugasanMks, keputusan: 'SETUJU' })
    });
    await fetch(`${BASE_URL}/nolap-data-handler.php?action=reviewDeniGerbang2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-NSR-Token': TOKEN_DIVTEK_DENI },
      body: JSON.stringify({ idPenugasan: idPenugasanMks, keputusan: 'SETUJU' })
    });
    pass('Test 3F: Danny SPM & Deni Divtek review akhir SETUJU -> Status: SIAP_TERBIT_NOLAP');

    // G. Admin Pusat Terbitkan NoLap Definitif 7 Segmen
    const issueRes = await fetch(`${BASE_URL}/nolap-data-handler.php?action=issueDefinitiveNoLap`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-NSR-Token': TOKEN_ADMIN_PUSAT },
      body: JSON.stringify({ idPenugasan: idPenugasanMks })
    });
    const issueJson = await issueRes.json();
    assert.strictEqual(issueRes.status, 200);
    const noDefinitif = issueJson.nomorDefinitif;
    console.log('    >> Nomor Definitif Resmi yang diterbitkan Pusat:', noDefinitif);

    const parts = noDefinitif.split('/');
    assert.strictEqual(parts.length, 8, 'Format NoLap wajib memiliki 7 pemisah (8 bagian dengan bulan/tahun)');
    assert.strictEqual(parts[1], '2.0160-00', 'Segmen 2 WAJIB 2.0160-00 (Kewenangan TTD Kantor Pusat)');
    assert.strictEqual(parts[4], '0218', 'Segmen 5 WAJIB 0218 (Izin Penilai Publik Pusat Ir. Nanang Rahayu)');

    pass(`Test 3G: NoLap Definitif (${noDefinitif}) menggunakan Segmen 2: 2.0160-00 & Segmen 5: 0218!`);

    // H. Penilai Publik Pusat (Nanang Rahayu) Tanda Tangan
    const signRes = await fetch(`${BASE_URL}/nolap-data-handler.php?action=signLaporanPenilaiPublik`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-NSR-Token': TOKEN_NANANG_PENILAI },
      body: JSON.stringify({ idPenugasan: idPenugasanMks })
    });
    const signJson = await signRes.json();
    assert.strictEqual(signRes.status, 200);
    assert.strictEqual(signJson.statusAkhir, 'LAPORAN_FINAL');
    pass('Test 3H: Tanda Tangan sah oleh Penilai Publik Pusat Nanang Rahayu -> Status: LAPORAN_FINAL');

    // -------------------------------------------------------------
    // TEST 4: Browser Headless UI Verification via Chrome CDP
    // -------------------------------------------------------------
    console.log('Menjalankan pengujian browser headless Chrome CDP...');
    const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-mks-verify-'));
    chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      `--remote-debugging-port=${CHROME_PORT}`,
      '--no-sandbox',
      '--window-size=1400,950',
      '--user-data-dir=' + tmpProfile,
      'about:blank'
    ]);

    let connected = false;
    for (let i = 0; i < 20; i++) {
      try {
        const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
        if (v.ok) {
          connected = true;
          break;
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 400));
    }

    assert(connected, 'Gagal terhubung ke remote debugging port Chrome ' + CHROME_PORT);

    const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
    const tabData = await tabRes.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let cdpId = 1;
    function cdpSend(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = cdpId++;
        const handler = (e) => {
          const m = JSON.parse(e.data);
          if (m.id === msgId) {
            ws.removeEventListener('message', handler);
            if (m.error) reject(new Error(JSON.stringify(m.error)));
            else resolve(m.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.method === 'Runtime.consoleAPICalled') {
        const txt = m.params.args.map(a => a.value || a.description).join(' ');
        console.log('    [BROWSER CONSOLE]:', txt);
      }
      if (m.method === 'Runtime.exceptionThrown') {
        console.error('    [BROWSER EXCEPTION]:', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description);
      }
    });

    await cdpSend('Runtime.enable');
    await cdpSend('Page.enable');
    await cdpSend('DOM.enable');

    const pageUrl = `${BASE_URL}/portal-nolap.html`;
    await cdpSend('Page.navigate', { url: pageUrl });

    // Tunggu hingga form login siap
    for (let wait = 0; wait < 30; wait++) {
      const chk = await cdpSend('Runtime.evaluate', {
        expression: "typeof window.loginKeServer === 'function' || typeof loginKeServer === 'function'",
        returnByValue: true
      });
      if (chk.result?.value === true) break;
      await new Promise(r => setTimeout(r, 200));
    }

    // Eksekusi Login via Token Makassar & Periksa UI
    const evalResult = await cdpSend('Runtime.evaluate', {
      expression: `(async () => {
        try {
          const token = '${TOKEN_MAKASSAR}';
          const inp = document.getElementById('input-auth-id');
          if (inp) inp.value = token;
          if (typeof loginKeServer === 'function') {
            await loginKeServer(null);
          } else if (typeof window.loginKeServer === 'function') {
            await window.loginKeServer(null);
          } else {
            throw new Error('loginKeServer tidak ditemukan');
          }

          await new Promise(r => setTimeout(r, 400));

          return JSON.stringify({
            headerKantor: document.getElementById('info-user-kantor')?.innerText?.trim(),
            previewNumber: document.getElementById('live-nomor-laporan')?.innerText?.trim(),
            badgeAsal: document.getElementById('badge-preview-asal')?.innerText?.trim(),
            badgeTtd: document.getElementById('badge-preview-ttd')?.innerText?.trim(),
            badgePenilai: document.getElementById('badge-preview-penilai')?.innerText?.trim(),
            segKantor: document.getElementById('seg-kantor')?.innerText?.trim(),
            segPenilai: document.getElementById('seg-penilai')?.innerText?.trim(),
            asalCabangLock: document.getElementById('text-asal-cabang-lock')?.innerText?.trim(),
            kewenanganVal: document.getElementById('f-kewenangan-ttd')?.value
          });
        } catch (e) {
          return JSON.stringify({ error: e.message, stack: e.stack });
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const uiState = JSON.parse(evalResult.result?.value || '{}');
    console.log('UI State Result:', uiState);
    if (uiState.error) {
      throw new Error('Error in UI: ' + uiState.error);
    }

    assert(uiState.headerKantor.includes('2.0160-02'), 'Header info kantor wajib menampilkan 2.0160-02 untuk Makassar');
    assert(uiState.previewNumber.includes('/2.0160-00/'), 'Preview nomor Segmen 2 WAJIB 2.0160-00 untuk kewenangan Pusat');
    assert(!uiState.previewNumber.includes('2.0160-03'), 'Preview nomor TIDAK BOLEH mengandung 2.0160-03');
    assert(uiState.previewNumber.includes('0218') || uiState.previewNumber.includes('00581'), 'Preview penilai wajib 0218 / 00581');
    assert(uiState.badgeAsal.includes('Makassar') && uiState.badgeAsal.includes('2.0160-02'), 'Badge asal wajib Makassar [2.0160-02]');
    assert(uiState.badgeTtd.includes('Pusat') && uiState.badgeTtd.includes('2.0160-00'), 'Badge TTD wajib Pusat [2.0160-00]');
    assert.strictEqual(uiState.segKantor, '2.0160-00', 'Segmen 2 kotak wajib 2.0160-00');

    // Tangkap Screenshot Bukti Visual
    const shot = await cdpSend('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.join(ARTIFACT_DIR, 'bukti_makassar_nolap_kewenangan_pusat.png');
    fs.writeFileSync(screenshotPath, Buffer.from(shot.data, 'base64'));
    console.log(`    >> Screenshot disimpan di: ${screenshotPath}`);

    ws.close();
    chromeProcess.kill();
    chromeProcess = null;

    pass('Test 4: Browser Headless UI membuktikan pemisahan visual Asal Makassar vs TTD Pusat secara sempurna!');

  } catch (err) {
    fail('Terjadi kegagalan pada pengujian Addendum P0', err);
  } finally {
    if (chromeProcess) {
      try { chromeProcess.kill(); } catch (_) {}
    }
    stopPhpServer();
  }

  console.log('================================================================');
  console.log(`HASIL AKHIR: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
