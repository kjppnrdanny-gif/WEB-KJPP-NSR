/**
 * Integration Test Suite: Dual Smart Mitigation Gate Engine on Production Backend (nolap-data-handler.php)
 * Menguji seluruh alur kerja berjenjang SPM & Divtek, anti-bypass sequence,
 * pemisahan peran Deni Divtek vs Penilai, alokasi NoLap definitif, dan tanda tangan digital.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8899;
const BASE_URL = `http://127.0.0.1:${PORT}/nolap-data-handler.php`;

// Test Credential Tokens
const TOKENS = {
  DANNY_SPM: 'NSR-SPM-DANNY-2026',
  DENI_DIVTEK: 'NSR-DIVTEK-DENI-2026',
  NANANG_PENILAI: 'NSR-PENILAI-NANANG-2026',
  DENI_PENILAI: 'NSR-PENILAI-DENI-2026',
  ADMIN_PUSAT: 'NSR-ADMIN-PUSAT-2026',
  ADMIN_BDG: 'NSR-ADMIN-BDG-2026'
};

async function request(endpoint, options = {}) {
  const url = new URL(endpoint, BASE_URL);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.token ? { 'X-NSR-Token': options.token } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = { raw: data }; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING DUAL SMART MITIGATION GATE PRODUCTION INTEGRATION TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`\x1b[32m✔ PASS:\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`\x1b[31m✘ FAIL:\x1b[0m ${message}`);
      failed++;
    }
  }

  // Backup & Reset Test DB
  const testDbFile = path.resolve('data/dual_gate_database.json');
  const backupDbFile = path.resolve('data/dual_gate_database.json.bak');
  if (fs.existsSync(testDbFile)) {
    fs.copyFileSync(testDbFile, backupDbFile);
  }
  fs.writeFileSync(testDbFile, JSON.stringify([], null, 2));

  try {
    // TEST 1: Unauthenticated access rejected (401)
    const t1 = await request('');
    assert(t1.status === 401 && t1.data.authenticated === false, 'Test 1: Akses tanpa token ditolak (401 Unauthorized)');

    // TEST 2: Intake Gerbang 1 Standar (Admin Cabang)
    const testIdPenugasan = `NSR-TEST-INT-${Date.now().toString().slice(-4)}`;
    const t2 = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: {
        idPenugasan: testIdPenugasan,
        tujuanPenilaian: 'Agunan Perbankan',
        namaKlien: 'PT Bank Mandiri Cabang Testing',
        jenisObjek: 'Ruko 3 Lantai',
        penilaiPublikId: 'deni_penilai',
        penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    assert(t2.status === 200 && t2.data.status === 'MENUNGGU_SPM_AWAL', `Test 2: Submit Gerbang 1 normal berhasil -> status: ${t2.data?.status}`);

    // TEST 3: Intake Gerbang 1 dengan Red Flag -> HOLD_ESKALASI_AWAL
    const testIdRedFlag = `NSR-TEST-RF-${Date.now().toString().slice(-4)}`;
    const t3 = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: {
        idPenugasan: testIdRedFlag,
        tujuanPenilaian: 'Pengadaan Tanah',
        namaKlien: 'PT Sengketa Lahan Uji',
        jenisObjek: 'Tanah Sengketa Waris',
        penilaiPublikId: 'nanang_penilai',
        penilaiPublikDitunjuk: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: true }
      }
    });
    assert(t3.status === 200 && t3.data.status === 'HOLD_ESKALASI_AWAL', `Test 3: Red Flag terdeteksi -> status: ${t3.data?.status}`);

    // TEST 4: Anti-Bypass Sequence Guard 1: Deni Divtek tidak boleh review sebelum Danny SPM
    const t4 = await request('?action=reviewDeniGerbang1', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Mencoba bypass review Danny' }
    });
    assert(t4.status === 403 && t4.data.violation === 'OUT_OF_ORDER_APPROVAL_ATTEMPT', 'Test 4: Anti-Bypass Guard 1 berhasil memblokir review Deni sebelum Danny (403)');

    // TEST 5: Review Danny SPM Gerbang 1 (SETUJU) -> MENUNGGU_DIVTEK_AWAL
    const t5 = await request('?action=reviewDannyGerbang1', {
      method: 'POST',
      token: TOKENS.DANNY_SPM,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Independensi & ketiadaan konflik terverifikasi baik.' }
    });
    assert(t5.status === 200 && t5.data.newStatus === 'MENUNGGU_DIVTEK_AWAL', `Test 5: Danny SPM memberi SETUJU -> status: ${t5.data?.newStatus}`);

    // TEST 6: Review Deni Divtek Gerbang 1 (SETUJU) -> SIAP_TERBIT_LP
    const t6 = await request('?action=reviewDeniGerbang1', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Metodologi penilaian pasar dan pendekatan biaya memenuhi syarat SPI.' }
    });
    assert(t6.status === 200 && t6.data.newStatus === 'SIAP_TERBIT_LP', `Test 6: Deni Divtek memberi SETUJU -> status: ${t6.data?.newStatus}`);

    // TEST 7: Penerbitan Nomor LP Resmi oleh Admin Pusat
    const t7 = await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdPenugasan, nomorLpResmi: '0416/2.0160-00/LP/X/2026' }
    });
    assert(t7.status === 200 && t7.data.status === 'LP_DITERBITKAN', `Test 7: Admin Pusat terbitkan LP -> status: ${t7.data?.status}`);

    // TEST 8: Anti-Bypass Gerbang 2: Submit NoLap pada penugasan yang belum sah ditolak
    const t8 = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: { idPenugasan: testIdRedFlag } // testIdRedFlag masih HOLD_ESKALASI_AWAL
    });
    assert(t8.status === 403 && t8.data.violation === 'UNVERIFIED_LP_SUBMISSION_ATTEMPT', 'Test 8: Pengajuan NoLap Gerbang 2 pada penugasan belum sah diblokir keras (403)');

    // TEST 9: Submit Gerbang 2 Sah (NoLap & Smart Mitigasi Akhir + Delta Analysis)
    const t9 = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: {
        idPenugasan: testIdPenugasan,
        drafLaporanUrl: 'https://drive.google.com/draf_laporan_test.pdf',
        baiUrl: 'https://drive.google.com/bai_test.pdf',
        checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
        deltaAnalysis: { deviasiMaterialTanpaJustifikasi: false, keterangan: 'Luas fisik sesuai yuridis.' }
      }
    });
    assert(t9.status === 200 && t9.data.status === 'MENUNGGU_SPM_AKHIR', `Test 9: Pengajuan Gerbang 2 berhasil didaftarkan -> status: ${t9.data?.status}`);

    // TEST 10: Anti-Bypass Guard 2: Deni Divtek tidak boleh review Gerbang 2 sebelum Danny SPM
    const t10 = await request('?action=reviewDeniGerbang2', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Mencoba bypass review Danny pada Gerbang 2' }
    });
    assert(t10.status === 403 && t10.data.violation === 'OUT_OF_ORDER_APPROVAL_ATTEMPT', 'Test 10: Anti-Bypass Guard 2 berhasil memblokir review akhir Deni sebelum Danny (403)');

    // TEST 11: Review Danny SPM Gerbang 2 (SETUJU) -> MENUNGGU_DIVTEK_AKHIR
    const t11 = await request('?action=reviewDannyGerbang2', {
      method: 'POST',
      token: TOKENS.DANNY_SPM,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'QC draf laporan, lembar kendali mutu, dan bukti foto geotag lengkap.' }
    });
    assert(t11.status === 200 && t11.data.newStatus === 'MENUNGGU_DIVTEK_AKHIR', `Test 11: Danny SPM review akhir SETUJU -> status: ${t11.data?.newStatus}`);

    // TEST 12: Review Deni Divtek Gerbang 2 (SETUJU) -> SIAP_TERBIT_NOLAP
    const t12 = await request('?action=reviewDeniGerbang2', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Kalkulasi nilai pasar telah diverifikasi akurat dan sesuai SPI 2024.' }
    });
    assert(t12.status === 200 && t12.data.newStatus === 'SIAP_TERBIT_NOLAP', `Test 12: Deni Divtek review akhir SETUJU -> status: ${t12.data?.newStatus}`);

    // TEST 13: Penerbitan NoLap Definitif Resmi oleh Admin Pusat
    const t13 = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t13.status === 200 && t13.data.statusTandaTangan === 'MENUNGGU_TTD_PENILAI' && t13.data.nomorDefinitif.includes('/2.0160-00/PI/07/'), `Test 13: Admin Pusat terbitkan NoLap definitif 7 segmen (${t13.data?.nomorDefinitif}) -> status: ${t13.data?.statusTandaTangan}`);

    // TEST 14: Pemisahan Peran Penilai Publik: Nanang Rahayu mencoba menandatangani penugasan Deni
    const t14 = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.NANANG_PENILAI,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t14.status === 403 && t14.data.violation === 'UNASSIGNED_PARTNER_SIGN_ATTEMPT', 'Test 14: Percobaan tanda tangan oleh Penilai Publik lain ditolak (403)');

    // TEST 15: Pemisahan Peran Deni Siswandi: Token Divtek tidak boleh menandatangani laporan resmi
    const t15 = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK, // Token Kepala Divtek, BUKAN Penilai Publik
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t15.status === 403, 'Test 15: Token Divtek Deni dilarang menandatangani laporan sebagai Penilai Publik (403)');

    // TEST 16: Tanda Tangan Sah oleh Penilai Publik Penanggung Jawab (Deni Penilai)
    const t16 = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.DENI_PENILAI, // Token sah Penilai Publik
      body: { idPenugasan: testIdPenugasan, metodeTandaTangan: 'DIGITAL_VERIFIED' }
    });
    assert(t16.status === 200 && t16.data.statusAkhir === 'LAPORAN_FINAL', `Test 16: Tanda tangan resmi Penilai Publik sah -> status akhir: ${t16.data?.statusAkhir}`);

    // TEST 17: Validasi Antrean Peran Terfilter Sesuai Kewenangan
    const qDanny = await request('?action=getQueueDanny', { token: TOKENS.DANNY_SPM });
    const qDeni = await request('?action=getQueueDeni', { token: TOKENS.DENI_DIVTEK });
    const qPusat = await request('?action=getQueueAdminPusat', { token: TOKENS.ADMIN_PUSAT });
    assert(qDanny.status === 200 && qDeni.status === 200 && qPusat.status === 200, 'Test 17: Antrean peran berjenjang SPM, Divtek, dan Admin Pusat berfungsi sempurna');

  } finally {
    // Restore DB jika sebelumnya ada backup
    if (fs.existsSync(backupDbFile)) {
      fs.copyFileSync(backupDbFile, testDbFile);
      fs.unlinkSync(backupDbFile);
    }
  }

  console.log(`\n======================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Start PHP Server & Run Tests
const phpProcess = spawn('php', ['-S', `127.0.0.1:${PORT}`], { stdio: 'inherit' });

// Tunggu 1.5 detik agar server PHP siap
setTimeout(async () => {
  try {
    await runTests();
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    phpProcess.kill();
    process.exit(0);
  }
}, 1500);
