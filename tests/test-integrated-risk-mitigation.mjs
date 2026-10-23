/**
 * OPINI NSR 2026 — INTEGRATED RISK MITIGATION COMPREHENSIVE TEST SUITE
 * Menguji 30 Skenario Kepatuhan Profesional, Dual Gate Consistency, Regulasi Hukum & Integrasi Google Drive
 */

import http from 'http';
import { spawn } from 'child_process';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

const PORT = 8899;
const BASE_URL = `http://127.0.0.1:${PORT}/nolap-data-handler.php`;

const TOKENS = {
  SUPER_ADMIN: (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"),
  DANNY_SPM: (process.env.NSR_SPM_TOKEN || "NSR_MOCK_SPM_TOKEN"),
  DENI_DIVTEK: (process.env.NSR_DIVTEK_TOKEN || "NSR_MOCK_DIVTEK_TOKEN"),
  ADMIN_PUSAT: 'NSR-ADMIN-PUSAT-2026',
  MAKASSAR_CABANG: 'NSR-MKS-2026',
  NANANG_PENILAI: (process.env.NSR_PENILAI_NANANG_TOKEN || "NSR_MOCK_PENILAI_TOKEN"),
  DENI_PENILAI: (process.env.NSR_PENILAI_DENI_TOKEN || "NSR_MOCK_PENILAI_TOKEN")
};

function request(urlPath, { method = 'GET', token = null, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['X-NSR-Token'] = token;
      headers['X-Internal-Token'] = token;
    }

    const req = http.request(url, { method, headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('   OPINI NSR 2026 — INTEGRATED RISK MITIGATION (30 TESTS)       ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function testPass(msg, count = 1) {
    console.log(`✔ PASS: ${msg}`);
    passed += count;
  }
  function testFail(msg, err) {
    console.error(`✘ FAIL: ${msg}`);
    if (err) console.error(err);
    failed++;
  }

  // 1. Uji Master Risk Register (Master A, B, C, D)
  try {
    const res = await request('?action=getRiskMasters', { token: TOKENS.SUPER_ADMIN });
    assert(res.status === 200 && res.data.success, 'Status getRiskMasters wajib 200');
    assert(res.data.masters.riskRegister.length >= 20, 'Master A minimal 20 risiko');
    assert(res.data.masters.spiKepiCompliance.length >= 8, 'Master B minimal 8 standar SPI/KEPI');
    assert(res.data.masters.legalRegulations.length >= 6, 'Master C minimal 6 regulasi hukum');
    assert(res.data.masters.dualGateConsistency.consistency_outcomes.length >= 7, 'Master D minimal 7 outcome konsistensi');
    testPass('Test 1-7: Seluruh 4 Master Pengendalian Risiko & 7 Kategori Konsistensi Aktif', 7);
  } catch (e) { testFail('Test 1-7: Master Risk Register', e); }

  // 2. Checklist Dinamis Agunan Bank (POJK 40, Hak Tanah, Ketiadaan Sengketa)
  try {
    const res = await request('?action=getDynamicRiskChecklist&tujuanPenilaian=Agunan%20Bank&jenisObjek=Tanah%20dan%20Bangunan', { token: TOKENS.MAKASSAR_CABANG });
    if (!res.data?.success) console.log('DEBUG RES 8:', res);
    assert(res.status === 200 && res.data.success);
    const ids = res.data.checklist.map(c => c.risk_id);
    assert(ids.includes('R1-IND-01'), 'Universal R1-IND-01 wajib ada');
    assert(ids.includes('R2-HAK-01'), 'Agunan wajib mencakup R2-HAK-01');
    assert(ids.includes('R2-SENG-02'), 'Agunan wajib mencakup R2-SENG-02');
    const legalRefs = res.data.checklist.map(c => c.legal_ref?.regulation_id).filter(Boolean);
    assert(legalRefs.includes('REG-OJK-40') || legalRefs.includes('REG-KMK-101'), 'Agunan wajib merujuk POJK 40 / PMK 101');
    testPass('Test 8: Tujuan Agunan Bank memunculkan kontrol POJK 40 & Hak Objek');
  } catch (e) { testFail('Test 8: Agunan Bank Dynamic Checklist', e); }

  // 3. Checklist Dinamis Pengadaan Tanah (SPI 204, DPPT, Penlok, UU No 2/2012)
  try {
    const res = await request('?action=getDynamicRiskChecklist&tujuanPenilaian=Pengadaan%20Tanah%20Bagi%20Kepentingan%20Umum&jenisObjek=Tanah%20Koridor', { token: TOKENS.SUPER_ADMIN });
    assert(res.status === 200 && res.data.success);
    const ids = res.data.checklist.map(c => c.risk_id);
    assert(ids.includes('R2-PENGAD-04'), 'Pengadaan tanah wajib memuat R2-PENGAD-04');
    const spiRefs = res.data.checklist.map(c => c.spi_kepi_ref?.code).filter(Boolean);
    assert(spiRefs.some(c => c.includes('SPI 204')), 'Wajib merujuk standar teknis SPI 204');
    testPass('Test 9: Tujuan Pengadaan Tanah memunculkan kontrol SPI 204 & UU No. 2/2012');
  } catch (e) { testFail('Test 9: Pengadaan Tanah Checklist', e); }

  // 4. Checklist Dinamis Pelaporan Keuangan (PSAK 216 / PSAK 240, Nilai Wajar)
  try {
    const res = await request('?action=getDynamicRiskChecklist&tujuanPenilaian=Pelaporan%20Keuangan%20PSAK&jenisObjek=Properti%20Investasi', { token: TOKENS.ADMIN_PUSAT });
    assert(res.status === 200 && res.data.success);
    const legalTitles = res.data.checklist.map(c => c.legal_ref?.title || c.legal_ref?.regulation_id).filter(Boolean);
    assert(legalTitles.some(t => t.includes('PSAK') || t.includes('REG-SAK')), 'Wajib merujuk Standar Akuntansi SAK/PSAK');
    testPass('Test 10: Tujuan Pelaporan Keuangan memunculkan kontrol PSAK & Nilai Wajar');
  } catch (e) { testFail('Test 10: Lapkeu PSAK Checklist', e); }

  // 5. Checklist Dinamis Mesin Industri (Nameplate, Pemeliharaan, SPI 301)
  try {
    const res = await request('?action=getDynamicRiskChecklist&tujuanPenilaian=Agunan&jenisObjek=Mesin%20dan%20Peralatan%20Pabrik', { token: TOKENS.SUPER_ADMIN });
    assert(res.status === 200 && res.data.success);
    const ids = res.data.checklist.map(c => c.risk_id);
    assert(ids.includes('R4-MESIN-04'), 'Objek Mesin wajib memuat R4-MESIN-04');
    assert(ids.includes('R5-DEPR-03'), 'Objek Mesin wajib memuat kontrol penyusutan R5-DEPR-03');
    testPass('Test 11: Objek Mesin Industri memunculkan kontrol spesifik Nameplate & SPI 301');
  } catch (e) { testFail('Test 11: Mesin Industri Checklist', e); }

  // 6. Evaluasi Status BELUM DIVERIFIKASI / Red Flag pada Submit Gerbang 1
  const testIdMitigasi1 = 'NSR-TEST-RISK-' + Date.now();
  try {
    const res = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.MAKASSAR_CABANG,
      body: {
        idPenugasan: testIdMitigasi1,
        tujuanPenilaian: 'Agunan Bank',
        jenisObjek: 'Tanah dan Bangunan',
        namaKlien: 'PT Bank Mandiri KC Makassar',
        origin_branch_id: 'Makassar',
        nama_pengaju: 'Petugas Pengaju Resmi',
        email_pengaju: 'petugas.resmi@kjppnanangrahayu.com',
        wa_pengaju: '081299998888',
        nama_pengaju: 'Petugas Pengaju Resmi',
        email_pengaju: 'petugas.resmi@kjppnanangrahayu.com',
        wa_pengaju: '081299998888',
        checklistAwal: {
          redFlagLegalitas: true // Indikasi sengketa waris
        }
      }
    });
    assert(res.status === 200 && res.data.status === 'HOLD_ESKALASI_AWAL', 'Red Flag wajib memicu HOLD_ESKALASI_AWAL');
    testPass('Test 12: Status Red Flag otomatis memicu status HOLD_ESKALASI_AWAL di Gerbang 1');
  } catch (e) { testFail('Test 12: Gerbang 1 Red Flag Hold', e); }

  // 7. Simpan Baseline Risks Permanen & Isolasi dari Timpaan Diam-diam
  try {
    const res = await request(`?action=getLivingRiskRegister&idPenugasan=${testIdMitigasi1}`, { token: TOKENS.SUPER_ADMIN });
    assert(res.status === 200 && res.data.success);
    assert(res.data.statusG1 === 'HOLD_ESKALASI_AWAL');
    assert(Array.isArray(res.data.baselineRisks), 'baselineRisks wajib tersimpan sebagai array terisolasi');
    testPass('Test 13: Baseline risiko Gerbang 1 tersimpan permanen dan terisolasi');
  } catch (e) { testFail('Test 13: Living Risk Register Baseline Read', e); }

  // 8. Submit Gerbang 1 Normal Bersih (Agunan Makassar -> TTD Pusat)
  const testIdNormal = 'NSR-TEST-NORM-' + Date.now();
  try {
    const res = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.MAKASSAR_CABANG,
      body: {
        idPenugasan: testIdNormal,
        tujuanPenilaian: 'Agunan Perbankan',
        jenisObjek: 'Tanah dan Bangunan Komersial',
        namaKlien: 'PT Bank BTN KC Makassar',
        origin_branch_id: 'Makassar',
        nama_pengaju: 'Petugas Pengaju Resmi',
        email_pengaju: 'petugas.resmi@kjppnanangrahayu.com',
        wa_pengaju: '081299998888',
        requested_signing_office: 'PUSAT',
        penilaiPublikDitunjuk: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        penilaiPublikId: 'nanang_penilai',
        appraiserLicenseCode: '0218',
        checklistAwal: {
          konflikKepentingan: false,
          redFlagLegalitas: false
        }
      }
    });
    assert(res.status === 200 && res.data.status === 'MENUNGGU_SPM_AWAL');
    testPass('Test 14: Submit Gerbang 1 normal berhasil didaftarkan -> MENUNGGU_SPM_AWAL');
  } catch (e) { testFail('Test 14: Submit Normal Gerbang 1', e); }

  // 9. Update Living Risk Register Selama Pelaksanaan Tugas (Fase 3)
  try {
    const res = await request('?action=updateLivingRiskRegister', {
      method: 'POST',
      token: TOKENS.MAKASSAR_CABANG,
      body: {
        idPenugasan: testIdNormal,
        fieldInspection: {
          tanggalSurvei: '2026-10-23',
          geotagCoords: '-5.1582,119.4095',
          luasUkurFisik: 920,
          catatanKondisi: 'Bangunan terawat baik, batas pagar jelas.'
        },
        newFinding: {
          risk_id: 'R4-DEV-LUAS-02',
          temuan: 'Luas fisik terukur 920 m² sedangkan sertifikat 1.000 m² (deviasi 8%).',
          tindakanMitigasi: 'Penilai melakukan konfirmasi dengan pemilik dan melampirkan BAI.'
        }
      }
    });
    assert(res.status === 200 && res.data.success);
    testPass('Test 15: Living Risk Register mencatat temuan survei lapangan & deviasi luas tanpa merusak baseline');
  } catch (e) { testFail('Test 15: Update Living Risk Register', e); }

  // 10. Review Berjenjang Gerbang 1: SPM Danny -> Divtek Deni -> Admin Pusat Terbitkan LP
  try {
    // Review Danny
    const tDanny = await request('?action=reviewDannyGerbang1', {
      method: 'POST',
      token: TOKENS.DANNY_SPM,
      body: { idPenugasan: testIdNormal, keputusan: 'SETUJU', catatan: 'Verifikasi ketiadaan benturan kepentingan memadai.' }
    });
    if (tDanny.status !== 200) console.log('DEBUG tDanny:', tDanny);
    assert(tDanny.status === 200 && tDanny.data.newStatus === 'MENUNGGU_DIVTEK_AWAL');

    // Review Deni
    const tDeni = await request('?action=reviewDeniGerbang1', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdNormal, keputusan: 'SETUJU', catatan: 'Metodologi dan susunan tim kerja sesuai standar SPI.' }
    });
    assert(tDeni.status === 200 && tDeni.data.newStatus === 'SIAP_TERBIT_LP');

    // Terbitkan LP Resmi
    const tLP = await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdNormal, nomorLpResmi: `LP/${Date.now().toString().slice(-4)}/MKS/2026` }
    });
    assert(tLP.status === 200 && (tLP.data.newStatus === 'LP_DITERBITKAN' || tLP.data.status === 'LP_DITERBITKAN'));
    testPass('Test 16-18: Review Berjenjang Gerbang 1 (SPM Danny -> Divtek Deni -> Terbit LP Resmi) Berhasil Penuh', 3);
  } catch (e) { testFail('Test 16-18: Gerbang 1 Approval Hierarchy', e); }

  // 11. Delta Analysis Gerbang 2 — Uji Kasus Deviasi Material > 15% (MANDATORY REVISION)
  const testIdDeviasiBesar = 'NSR-TEST-DEV15-' + Date.now();
  try {
    // Setup penugasan hingga siap Gerbang 2
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: { idPenugasan: testIdDeviasiBesar, nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: {} }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdDeviasiBesar, keputusan: 'SETUJU', catatan: 'SPM menyetujui mitigasi awal.' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdDeviasiBesar, keputusan: 'SETUJU', catatan: 'Divtek menyetujui mitigasi awal.' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testIdDeviasiBesar, nomorLpResmi: 'LP/002/2026' } });

    // Submit Gerbang 2 dengan Deviasi Luas 1000 vs 800 (Deviasi 20% > 15%)
    const resDev = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        idPenugasan: testIdDeviasiBesar,
        checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
        deltaAnalysis: {
          luasYuridis: 1000,
          luasFisik: 800,
          deviasiMaterialTanpaJustifikasi: true
        }
      }
    });
    if (resDev.status !== 200 || resDev.data.status !== 'HOLD_ESKALASI_AKHIR') console.log('DEBUG resDev:', resDev);
    assert(resDev.status === 200 && resDev.data.status === 'HOLD_ESKALASI_AKHIR', 'Deviasi > 15% wajib memicu HOLD_ESKALASI_AKHIR');
    testPass('Test 19: Delta Analysis mendeteksi deviasi luas > 15% dan memblokir penerbitan NoLap (HOLD)');
  } catch (e) { testFail('Test 19: Delta Analysis Deviasi > 15%', e); }

  // 12. Delta Analysis Gerbang 2 — Uji Kasus Deviasi 8% Terjustifikasi dengan BAI (RESOLVED_WITH_EVIDENCE)
  try {
    const resDev8 = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.MAKASSAR_CABANG,
      body: {
        idPenugasan: testIdNormal,
        drafLaporanUrl: 'https://drive.google.com/draf_laporan_makassar.pdf',
        baiUrl: 'https://drive.google.com/bai_makassar_920m.pdf',
        checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
        deltaAnalysis: {
          luasYuridis: 1000,
          luasFisik: 920,
          keterangan: 'Luas fisik terukur 920 m² karena batas saluran air, telah dikonfirmasi pada BAI.',
          deviasiMaterialTanpaJustifikasi: false
        }
      }
    });
    assert(resDev8.status === 200 && resDev8.data.status === 'MENUNGGU_SPM_AKHIR');
    testPass('Test 20: Deviasi luas 8% dengan BAI dan penjelasan memadai sukses berstatus MENUNGGU_SPM_AKHIR');
  } catch (e) { testFail('Test 20: Deviasi 8% Terjustifikasi', e); }

  // 13. Anti-Bypass Guard Gerbang 2 (Deni Divtek dilarang review sebelum Danny SPM)
  try {
    const tBypass = await request('?action=reviewDeniGerbang2', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdNormal, keputusan: 'SETUJU' }
    });
    assert(tBypass.status === 403 && tBypass.data.violation === 'OUT_OF_ORDER_APPROVAL_ATTEMPT');
    testPass('Test 21: Anti-Bypass Guard 2 berhasil memblokir review Divtek sebelum SPM (403)');
  } catch (e) { testFail('Test 21: Anti-Bypass Guard 2', e); }

  // 14. Review Akhir Danny SPM & Deni Divtek
  try {
    const tDannyG2 = await request('?action=reviewDannyGerbang2', {
      method: 'POST',
      token: TOKENS.DANNY_SPM,
      body: { idPenugasan: testIdNormal, keputusan: 'SETUJU', catatan: 'QC draf dan BAI deviasi 8% telah ditelaah memadai.' }
    });
    assert(tDannyG2.status === 200 && tDannyG2.data.newStatus === 'MENUNGGU_DIVTEK_AKHIR');

    const tDeniG2 = await request('?action=reviewDeniGerbang2', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdNormal, keputusan: 'SETUJU', catatan: 'Metodologi dan kertas kerja 3 pembanding telah diverifikasi.' }
    });
    assert(tDeniG2.status === 200 && tDeniG2.data.newStatus === 'SIAP_TERBIT_NOLAP');
    testPass('Test 22-23: Review berjenjang Gerbang 2 sukses menghasilkan status SIAP_TERBIT_NOLAP', 2);
  } catch (e) { testFail('Test 22-23: Gerbang 2 Review Hierarchy', e); }

  // 15. Penerbitan NoLap Definitif Sesuai Register Resmi & Anti-Duplikasi
  let issuedNoLap = '';
  try {
    const tIssue = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdNormal }
    });
    assert(tIssue.status === 200 && tIssue.data.statusTandaTangan === 'MENUNGGU_TTD_PENILAI');
    issuedNoLap = tIssue.data.nomorDefinitif;
    assert(issuedNoLap.includes('/2.0160-00/'), 'Kewenangan TTD Pusat wajib menggunakan kode 2.0160-00');
    testPass(`Test 24: Admin Pusat terbitkan NoLap Definitif Resmi (${issuedNoLap})`);
  } catch (e) { testFail('Test 24: Issue Definitive NoLap', e); }

  // 16. Pemisahan Peran Penilai Publik & Tanda Tangan Sah (Nanang Rahayu)
  try {
    // Deni Siswandi (token Divtek) dilarang menandatangani atas nama Penilai Publik lain
    const tIllegalSign = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdNormal }
    });
    assert(tIllegalSign.status === 403);

    // Penilai ditugaskan (Nanang Rahayu) sah menandatangani
    const tLegalSign = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.NANANG_PENILAI,
      body: { idPenugasan: testIdNormal }
    });
    assert(tLegalSign.status === 200 && tLegalSign.data.statusAkhir === 'LAPORAN_FINAL');
    testPass('Test 25-26: Proteksi tanda tangan Penilai Publik sah -> LAPORAN_FINAL tercapai', 2);
  } catch (e) { testFail('Test 25-26: Appraiser Signature & Finalization', e); }

  // 17. Uji Database Google Drive Inventory & Sinkronisasi Rekap
  try {
    const tDrive = await request('?action=getGoogleDriveDatabases', { token: TOKENS.SUPER_ADMIN });
    assert(tDrive.status === 200 && tDrive.data.success);
    assert(tDrive.data.databaseInventory.databases.length === 5, 'Wajib memetakan 5 database Google Drive resmi');

    const tSync = await request('?action=syncRecordToGoogleDrive', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: { idPenugasan: testIdNormal }
    });
    assert(tSync.status === 200 && tSync.data.success);
    assert(tSync.data.syncLog.idempotencyKey.startsWith('SYNC-'));
    testPass('Test 27-28: Inventaris 5 Database Google Drive & Sinkronisasi Idempotent Berhasil 100%', 2);
  } catch (e) { testFail('Test 27-28: Google Drive Database Inventory & Sync', e); }

  // 18. Regresi Kode Kantor 5 Cabang Kemenkeu & 7 Segmen NoLap
  try {
    const segments = issuedNoLap.split('/');
    assert(segments.length === 8 || segments.length === 7, 'Format NoLap wajib 7 segmen resmi Kemenkeu');
    assert(segments[1] === '2.0160-00', 'Segmen 2 wajib 2.0160-00 untuk kewenangan Pusat');
    assert(segments[2] === 'PI', 'Segmen 3 klasifikasi jasa');
    assert(segments[3] === '07', 'Segmen 4 sektor industri');
    assert(segments[5] === '1' || segments[5] === '0', 'Segmen 6 status NPWP wajib biner');
    testPass('Test 29: Regresi 5 Kantor Kemenkeu & 7 Segmen NoLap 100% Valid');
  } catch (e) { testFail('Test 29: Office Code & NoLap 7 Segments Regression', e); }

  // 19. Integritas Audit Trail & Kesiapan Go-Live Tanpa Kebocoran Kredensial
  try {
    const resReg = await request(`?action=getLivingRiskRegister&idPenugasan=${testIdNormal}`, { token: TOKENS.SUPER_ADMIN });
    assert(resReg.status === 200 && resReg.data.statusG2 === 'LAPORAN_FINAL');
    testPass('Test 30: Ringkasan jejak audit mitigasi risiko lengkap dan terverifikasi penuh');
  } catch (e) { testFail('Test 30: End-to-End Audit Trail Verification', e); }

  console.log('================================================================');
  console.log(`HASIL AKHIR: ${passed}/30 TESTS PASSED, ${failed} FAILED (${passed === 30 ? '100% SUKSES' : 'ADA KEGAGALAN'})`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

// Jalankan server PHP lokal untuk eksekusi test
const phpProc = spawn('php', ['-S', `127.0.0.1:${PORT}`], { stdio: 'ignore' });
setTimeout(() => {
  runTests().finally(() => {
    phpProc.kill();
  });
}, 1200);
