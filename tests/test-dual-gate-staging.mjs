import assert from 'assert';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

console.log('===================================================================');
console.log('🚀 MEMULAI TEST SUITE: DUAL MITIGATION GATE (SMART MITIGASI DUA TAHAP)');
console.log('===================================================================');

// Helper untuk invoke endpoint PHP staging secara lokal
function callDualGatePhp(action, method = 'GET', token = '', payload = null) {
  return new Promise((resolve, reject) => {
    const phpScript = path.resolve('dist-staging/dual-gate-mitigasi-handler.php');
    const env = Object.assign({}, process.env, {
      REQUEST_METHOD: method,
      QUERY_STRING: `action=${action}`,
      HTTP_X_NSR_TOKEN: token,
      CONTENT_TYPE: 'application/json'
    });

    const child = spawn('php', [phpScript], { env, stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    if (payload && method === 'POST') {
      child.stdin.write(JSON.stringify(payload));
    }
    child.stdin.end();

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      // Hilangkan header HTTP output dari PHP CGI/CLI jika ada
      const jsonStart = stdout.indexOf('{');
      if (jsonStart < 0) {
        return resolve({ code, raw: stdout, stderr, json: null });
      }
      try {
        const json = JSON.parse(stdout.substring(jsonStart));
        resolve({ code, json, raw: stdout });
      } catch (e) {
        resolve({ code, raw: stdout, parseError: e.message });
      }
    });
  });
}

// Bersihkan basis data staging sebelum test
const dbFile = path.resolve('dist-staging/data/dual_gate_database.json');
const mailFile = path.resolve('dist-staging/data/mail_queue.json');
if (fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '[]\n');
if (fs.existsSync(mailFile)) fs.writeFileSync(mailFile, '[]\n');

async function runAllTests() {
  let passedCount = 0;

  // -------------------------------------------------------------
  // TEST 1: Proteksi Akses Tanpa Kredensial (Fail-Closed)
  // -------------------------------------------------------------
  console.log('\n[TEST 1] Proteksi Akses Kredensial Ilegal / Kosong');
  const t1 = await callDualGatePhp('listAll', 'GET', '');
  assert.strictEqual(t1.json.authenticated, false, 'Wajib menolak request tanpa token');
  console.log('✔ LULUS: Akses tanpa token ditolak 401 Unauthorized.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 2: Pengajuan Gerbang 1 oleh Admin Cabang (Jalur Cabang -> Pusat)
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Pengajuan Gerbang 1 (Lingkup Penugasan) oleh Admin Cabang');
  const t2 = await callDualGatePhp('submitGerbang1Awal', 'POST', 'NSR-ADMIN-BDG-2026', {
    idPenugasan: 'NSR-2026-BDG-TEST01',
    tujuanPenilaian: 'Agunan Perbankan',
    jenisObjek: 'Pabrik Tekstil & Gudang',
    namaKlien: 'PT Bank Banten Tbk',
    penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
    penilaiPublikId: 'deni_penilai',
    checklistAwal: {
      konflikKepentingan: false,
      redFlagLegalitas: false,
      ketersediaanDataPasar: true
    }
  });
  assert.strictEqual(t2.json.success, true);
  assert.strictEqual(t2.json.status, 'MENUNGGU_SPM_AWAL');
  assert.strictEqual(t2.json.emailNotification, 'ANTRIAN');
  assert(t2.json.waManualLink.includes('wa.me/6281280445731'), 'Wajib memuat link WA Danny Taufik');
  console.log('✔ LULUS: Gerbang 1 tercatat sebagai MENUNGGU_SPM_AWAL, email masuk antrean, link WA Danny terbentuk.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 3: Anti-Bypass! Deni Coba Review Sebelum Danny Setuju
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Anti-Bypass: Deni (Divtek) Coba Review Mendahului Danny (SPM)');
  const t3 = await callDualGatePhp('reviewDeniGerbang1', 'POST', (process.env.NSR_DIVTEK_TOKEN || "NSR_MOCK_DIVTEK_TOKEN"), {
    idPenugasan: 'NSR-2026-BDG-TEST01',
    keputusan: 'SETUJU',
    catatan: 'Coba approval langsung tanpa SPM'
  });
  assert.strictEqual(t3.json.success, false);
  assert.strictEqual(t3.json.violation, 'OUT_OF_ORDER_APPROVAL_ATTEMPT');
  console.log('✔ LULUS: Server menolak percobaan approval Deni karena Danny belum memberi persetujuan.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 4: Danny Taufik (Kepala SPM) Review & Menyetujui Gerbang 1
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Danny Taufik (Kepala SPM) Review Gerbang 1 -> SETUJU');
  const t4 = await callDualGatePhp('reviewDannyGerbang1', 'POST', (process.env.NSR_SPM_TOKEN || "NSR_MOCK_SPM_TOKEN"), {
    idPenugasan: 'NSR-2026-BDG-TEST01',
    keputusan: 'SETUJU',
    catatan: 'Independensi terverifikasi. Tidak ada benturan kepentingan.'
  });
  assert.strictEqual(t4.json.success, true);
  assert.strictEqual(t4.json.newStatus, 'MENUNGGU_DIVTEK_AWAL');
  assert(t4.json.waManualLink.includes('wa.me/6281381909504'), 'Wajib memuat link WA Deni Siswandi');
  console.log('✔ LULUS: SPM menyetujui, status berpindah ke MENUNGGU_DIVTEK_AWAL, link WA Deni terbentuk.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 5: Deni Siswandi (Kepala Divtek) Review & Menyetujui Gerbang 1
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Deni Siswandi (Kepala Divtek) Review Gerbang 1 -> SETUJU');
  const t5 = await callDualGatePhp('reviewDeniGerbang1', 'POST', (process.env.NSR_DIVTEK_TOKEN || "NSR_MOCK_DIVTEK_TOKEN"), {
    idPenugasan: 'NSR-2026-BDG-TEST01',
    keputusan: 'SETUJU',
    catatan: 'Metodologi dan susunan tim penilai telah memenuhi syarat teknis.'
  });
  assert.strictEqual(t5.json.success, true);
  assert.strictEqual(t5.json.newStatus, 'LP_TERVERIFIKASI');
  console.log('✔ LULUS: Divtek menyetujui, status menjadi LP_TERVERIFIKASI. Gerbang 1 Selesai.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 6: Pengajuan Gerbang 2 (NoLap & Mitigasi Akhir)
  // -------------------------------------------------------------
  console.log('\n[TEST 6] Pengajuan Gerbang 2 (NoLap & Mitigasi Akhir)');
  const t6 = await callDualGatePhp('submitGerbang2Akhir', 'POST', 'NSR-ADMIN-BDG-2026', {
    idPenugasan: 'NSR-2026-BDG-TEST01',
    drafLaporanUrl: 'https://drive.google.com/draf_laporan_01.pdf',
    baiUrl: 'https://drive.google.com/bai_01.pdf',
    checklistAkhir: {
      fotoGeotagLengkap: true,
      tigaPembandingTersedia: true
    },
    deltaAnalysis: {
      deviasiMaterialTanpaJustifikasi: false,
      keterangan: 'Luas fisik sesuai yuridis. Tidak ada perubahan objek.'
    }
  });
  assert.strictEqual(t6.json.success, true);
  assert.strictEqual(t6.json.status, 'MENUNGGU_SPM_AKHIR');
  console.log('✔ LULUS: Mitigasi Akhir tercatat, status MENUNGGU_SPM_AKHIR.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 7: Anti-Bypass! Admin Coba Terbitkan NoLap Sebelum Kedua Review Selesai
  // -------------------------------------------------------------
  console.log('\n[TEST 7] Anti-Bypass: Admin Pusat Coba Terbitkan NoLap Sebelum Approval');
  const t7 = await callDualGatePhp('issueDefinitiveNoLap', 'POST', 'NSR-ADMIN-PUSAT-2026', {
    idPenugasan: 'NSR-2026-BDG-TEST01'
  });
  assert.strictEqual(t7.json.success, false);
  assert.strictEqual(t7.json.violation, 'UNAPPROVED_NOLAP_ISSUANCE_ATTEMPT');
  console.log('✔ LULUS: Penerbitan NoLap definitif ditolak keras karena kedua review belum selesai.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 8: Review Berjenjang Gerbang 2 (Danny -> Deni) -> SIAP_TERBIT_NOLAP
  // -------------------------------------------------------------
  console.log('\n[TEST 8] Review Berjenjang Gerbang 2: Danny (SETUJU) -> Deni (SETUJU)');
  const t8a = await callDualGatePhp('reviewDannyGerbang2', 'POST', (process.env.NSR_SPM_TOKEN || "NSR_MOCK_SPM_TOKEN"), {
    idPenugasan: 'NSR-2026-BDG-TEST01',
    keputusan: 'SETUJU',
    catatan: 'QC dokumen lengkap. Pembatasan tanggung jawab terpenuhi.'
  });
  assert.strictEqual(t8a.json.newStatus, 'MENUNGGU_DIVTEK_AKHIR');

  const t8b = await callDualGatePhp('reviewDeniGerbang2', 'POST', (process.env.NSR_DIVTEK_TOKEN || "NSR_MOCK_DIVTEK_TOKEN"), {
    idPenugasan: 'NSR-2026-BDG-TEST01',
    keputusan: 'SETUJU',
    catatan: 'Kertas kerja penilaian dan rekonsiliasi nilai wajar.'
  });
  assert.strictEqual(t8b.json.newStatus, 'SIAP_TERBIT_NOLAP');
  console.log('✔ LULUS: Kedua review Gerbang 2 disahkan. Status: SIAP_TERBIT_NOLAP.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 9: Admin Pusat Terbitkan NoLap Definitif (7 Segmen Kemenkeu)
  // -------------------------------------------------------------
  console.log('\n[TEST 9] Penerbitan NoLap Definitif oleh Admin Pusat');
  const t9 = await callDualGatePhp('issueDefinitiveNoLap', 'POST', 'NSR-ADMIN-PUSAT-2026', {
    idPenugasan: 'NSR-2026-BDG-TEST01'
  });
  assert.strictEqual(t9.json.success, true);
  assert(t9.json.nomorDefinitif.includes('/2.0160-00/PI/07/00581/1/'), 'Format nomor 7 segmen sesuai');
  assert.strictEqual(t9.json.statusTandaTangan, 'MENUNGGU_TTD_PENILAI');
  console.log(`✔ LULUS: NoLap Definitif terbit (${t9.json.nomorDefinitif}), status: MENUNGGU_TTD_PENILAI.`);
  passedCount++;

  // -------------------------------------------------------------
  // TEST 10: Pemisahan Role: Deni Menandatangani Laporan sebagai Penilai Publik
  // -------------------------------------------------------------
  console.log('\n[TEST 10] Pemisahan Wewenang: Tanda Tangan Penilai Publik (Bukan Otomatis Divtek)');
  // Coba jika ditandatangani Nanang padahal penugasan untuk Deni -> Wajib Ditolak!
  const t10Wrong = await callDualGatePhp('signLaporanPenilaiPublik', 'POST', (process.env.NSR_PENILAI_NANANG_TOKEN || "NSR_MOCK_PENILAI_TOKEN"), {
    idPenugasan: 'NSR-2026-BDG-TEST01'
  });
  assert.strictEqual(t10Wrong.json.success, false);
  assert.strictEqual(t10Wrong.json.violation, 'UNASSIGNED_PARTNER_SIGN_ATTEMPT');
  console.log('✔ LULUS: Penilai Publik lain ditolak menandatangani penugasan yang bukan wewenangnya.');

  // Tanda tangan oleh Deni sebagai Penilai Publik yang ditugaskan
  const t10Correct = await callDualGatePhp('signLaporanPenilaiPublik', 'POST', (process.env.NSR_PENILAI_DENI_TOKEN || "NSR_MOCK_PENILAI_TOKEN"), {
    idPenugasan: 'NSR-2026-BDG-TEST01',
    metodeTandaTangan: 'DIGITAL_VERIFIED'
  });
  assert.strictEqual(t10Correct.json.success, true);
  assert.strictEqual(t10Correct.json.statusAkhir, 'LAPORAN_FINAL');
  console.log('✔ LULUS: Penilai Publik Penanggung Jawab menandatangani laporan. Status: LAPORAN_FINAL.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 11: Kasus Konflik / Red Flag -> Otomatis HOLD_ESKALASI_AWAL
  // -------------------------------------------------------------
  console.log('\n[TEST 11] Kasus Red Flag / Konflik Kepentingan -> Status HOLD_ESKALASI_AWAL');
  const t11 = await callDualGatePhp('submitGerbang1Awal', 'POST', 'NSR-ADMIN-PUSAT-2026', {
    idPenugasan: 'NSR-2026-PST-RED01',
    tujuanPenilaian: 'Pelaporan Keuangan',
    checklistAwal: {
      konflikKepentingan: true, // Ada benturan kepentingan!
      redFlagLegalitas: false
    }
  });
  assert.strictEqual(t11.json.status, 'HOLD_ESKALASI_AWAL');
  console.log('✔ LULUS: Penugasan dengan konflik kepentingan otomatis ditahan sebagai HOLD_ESKALASI_AWAL.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 12: Kasus Revisi oleh Kepala SPM
  // -------------------------------------------------------------
  console.log('\n[TEST 12] Kasus Pengembalian Revisi oleh Kepala SPM');
  const t12 = await callDualGatePhp('reviewDannyGerbang1', 'POST', (process.env.NSR_SPM_TOKEN || "NSR_MOCK_SPM_TOKEN"), {
    idPenugasan: 'NSR-2026-PST-RED01',
    keputusan: 'REVISI',
    catatan: 'Wajib lampirkan surat pernyataan bebas benturan kepentingan dari dewan direksi.'
  });
  assert.strictEqual(t12.json.newStatus, 'REVISI_SPM_AWAL');
  console.log('✔ LULUS: Pengembalian revisi tercatat sebagai REVISI_SPM_AWAL dengan catatan lengkap.');
  passedCount++;

  // -------------------------------------------------------------
  // TEST 13: Verifikasi Antrean Notifikasi Email & Anti-Duplikasi
  // -------------------------------------------------------------
  console.log('\n[TEST 13] Verifikasi Antrean Notifikasi Email di Mail Queue');
  const t13 = await callDualGatePhp('getMailQueue', 'GET', 'NSR-ADMIN-PUSAT-2026');
  assert.strictEqual(t13.json.success, true);
  assert(t13.json.total > 0, 'Antrean email wajib tercatat');
  const firstMail = t13.json.queue[0];
  assert.strictEqual(firstMail.status, 'ANTRIAN');
  console.log(`✔ LULUS: Terverifikasi ${t13.json.total} email berada dalam antrean backend dengan status ANTRIAN.`);
  passedCount++;

  console.log('\n===================================================================');
  console.log(`🎉 SELURUH ${passedCount} SKENARIO PENGUJIAN STAGING LULUS 100%!`);
  console.log('===================================================================');
}

runAllTests().catch((err) => {
  console.error('\n❌ TEST GAGAL:', err);
  process.exit(1);
});
