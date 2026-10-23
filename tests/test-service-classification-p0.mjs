/**
 * OPINI NSR 2026 — SERVICE CLASSIFICATION & NOLAP CODE P0 TEST SUITE
 * Menguji kepatuhan SE-6/PPPK/2018:
 * 1. Penilaian Properti menghasilkan kode nomor 'PI'
 * 2. Penilaian Properti Sederhana menghasilkan kode nomor 'PI' (DILARANG MENGGUNAKAN 'PS')
 * 3. Penilaian Bisnis menghasilkan kode nomor 'BS'
 * 4. Penilaian Personal Properti menghasilkan kode nomor 'PP'
 * 5. Pembedaan identitas internal service_classification_id ('PROPERTY' vs 'PROPERTY_SIMPLE')
 * 6. Validasi lisensi Penilai Publik (PS hanya untuk sederhana; ditolak untuk properti komprehensif)
 * 7. Tidak ada nomor baru yang mengandung segmen '/PS/'
 * 8. Konsistensi payload JO, NoLap, GAS Sheet, dan merge tags
 * 9. Konsistensi service classification dari Gerbang 1 ke Gerbang 2
 * 10. Audit sanitasi nomor manual jika terdapat input 'PS' otomatis dikonversi ke 'PI'
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
  console.log('  OPINI NSR 2026 — SERVICE CLASSIFICATION & NOLAP P0 (15 TESTS) ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function testPass(msg) {
    console.log(`✔ PASS: ${msg}`);
    passed++;
  }
  function testFail(msg, err) {
    console.error(`✘ FAIL: ${msg}`);
    if (err) console.error(err);
    failed++;
  }

  // 1. Verifikasi Master Service Classifications API
  try {
    const res = await request('?action=getServiceClassifications', { token: TOKENS.SUPER_ADMIN });
    assert(res.status === 200 && res.data.success, 'getServiceClassifications status 200');
    assert(res.data.total === 4, 'Master memuat tepat 4 klasifikasi jasa');
    const items = res.data.serviceClassifications;
    const propSimple = items.find(i => i.service_classification_id === 'PROPERTY_SIMPLE');
    assert(propSimple, 'PROPERTY_SIMPLE wajib ada');
    assert(propSimple.report_service_code === 'PI', 'PROPERTY_SIMPLE wajib memiliki report_service_code PI');
    assert(propSimple.service_classification_code === 'PS', 'Identitas kode klasifikasi internal PS dipertahankan');
    testPass('Test 1: Master Katalog 4 Klasifikasi Jasa memetakan PROPERTY_SIMPLE ke NoLap PI');
  } catch (e) { testFail('Test 1: Master Service Classifications', e); }

  // 2. Verifikasi Penilaian Properti Penuh -> report_service_code 'PI'
  try {
    const res = await request('?action=getServiceClassifications', { token: TOKENS.ADMIN_PUSAT });
    const prop = res.data.serviceClassifications.find(i => i.service_classification_id === 'PROPERTY');
    assert(prop && prop.report_service_code === 'PI');
    testPass('Test 2: Penilaian Properti (PROPERTY) memetakan kode NoLap PI');
  } catch (e) { testFail('Test 2: Property Classification Code', e); }

  // 3. Verifikasi Penilaian Bisnis -> report_service_code 'BS'
  try {
    const res = await request('?action=getServiceClassifications', { token: TOKENS.ADMIN_PUSAT });
    const biz = res.data.serviceClassifications.find(i => i.service_classification_id === 'BUSINESS');
    assert(biz && biz.report_service_code === 'BS');
    testPass('Test 3: Penilaian Bisnis (BUSINESS) memetakan kode NoLap BS');
  } catch (e) { testFail('Test 3: Business Classification Code', e); }

  // 4. Verifikasi Penilaian Personal Properti -> report_service_code 'PP'
  try {
    const res = await request('?action=getServiceClassifications', { token: TOKENS.ADMIN_PUSAT });
    const pp = res.data.serviceClassifications.find(i => i.service_classification_id === 'PERSONAL_PROPERTY');
    assert(pp && pp.report_service_code === 'PP');
    testPass('Test 4: Penilaian Personal Properti (PERSONAL_PROPERTY) memetakan kode NoLap PP');
  } catch (e) { testFail('Test 4: Personal Property Classification Code', e); }

  // 5. Validasi Izin Penilai Publik: Penilai PS DITOLAK untuk PROPERTY Komprehensif
  const testIdIllegalPS = 'NSR-TEST-PS-ILLEGAL-' + Date.now();
  try {
    const res = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        idPenugasan: testIdIllegalPS,
        service_classification_id: 'PROPERTY', // Properti Non-Sederhana
        tujuanPenilaian: 'Agunan Bank',
        jenisObjek: 'Gedung Mall Komersial 5 Lantai',
        penilaiPublikDitunjuk: 'Hernita, S.Si., MAPPI (Cert.)',
        penilaiPublikId: 'hernita_penilai', // Izin PS
        appraiser_license_code: '00046'
      }
    });
    assert(res.status === 400, 'Wajib ditolak 400 Bad Request');
    assert(res.data.violation === 'INVALID_APPRAISER_CLASSIFICATION', 'Pelanggaran klasifikasi izin');
    testPass('Test 5: Penilai izin PS ditolak tegas untuk klasifikasi PROPERTY Komprehensif (400)');
  } catch (e) { testFail('Test 5: Appraiser PS Restriction for Complex Property', e); }

  // 6. Validasi Izin Penilai Publik: Penilai PS DITERIMA untuk PROPERTY_SIMPLE
  const testIdSimplePS = 'NSR-TEST-PS-SIMPLE-' + Date.now();
  try {
    const res = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.MAKASSAR_CABANG,
      body: {
        idPenugasan: testIdSimplePS,
        service_classification_id: 'PROPERTY_SIMPLE', // Properti Sederhana
        tujuanPenilaian: 'Agunan Perbankan',
        jenisObjek: 'Rumah Tinggal Sederhana Tipe 45',
        penilaiPublikDitunjuk: 'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
        penilaiPublikId: 'amin_penilai', // Izin PS
        appraiser_license_code: '00126',
        origin_branch_id: 'Makassar',
        requested_signing_office: 'PUSAT',
        nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    assert(res.status === 200 && res.data.success, 'Penilai PS wajib diterima untuk PROPERTY_SIMPLE');
    testPass('Test 6: Penilai izin PS sah diterima untuk klasifikasi PROPERTY_SIMPLE');
  } catch (e) { testFail('Test 6: Appraiser PS Allowed for Simple Property', e); }

  // 7. Verifikasi Alur End-to-End PROPERTY_SIMPLE menghasilkan NoLap bersegmen /PI/ (BUKAN /PS/)
  try {
    // Review Danny SPM
    await request('?action=reviewDannyGerbang1', {
      method: 'POST',
      token: TOKENS.DANNY_SPM,
      body: { idPenugasan: testIdSimplePS, keputusan: 'SETUJU', catatan: 'Verifikasi kepatuhan objek sederhana sesuai izin PS.' }
    });

    // Review Deni Divtek
    await request('?action=reviewDeniGerbang1', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdSimplePS, keputusan: 'SETUJU', catatan: 'Metodologi penilaian sederhana disetujui.' }
    });

    // Terbitkan LP Resmi
    await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdSimplePS, nomorLpResmi: 'LP/099/SIMPLE/2026' }
    });

    // Submit Gerbang 2
    const resG2 = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.MAKASSAR_CABANG,
      body: {
        idPenugasan: testIdSimplePS,
        checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
        deltaAnalysis: { luasYuridis: 120, luasFisik: 120, deviasiMaterialTanpaJustifikasi: false }
      }
    });
    assert(resG2.status === 200);

    // Review Akhir SPM & Divtek
    await request('?action=reviewDannyGerbang2', {
      method: 'POST',
      token: TOKENS.DANNY_SPM,
      body: { idPenugasan: testIdSimplePS, keputusan: 'SETUJU', catatan: 'Draf laporan objek sederhana diverifikasi.' }
    });
    await request('?action=reviewDeniGerbang2', {
      method: 'POST',
      token: TOKENS.DENI_DIVTEK,
      body: { idPenugasan: testIdSimplePS, keputusan: 'SETUJU', catatan: 'Pemeriksaan final disetujui.' }
    });

    // Terbitkan NoLap Definitif
    const resIssue = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdSimplePS }
    });
    assert(resIssue.status === 200 && resIssue.data.success);
    const noLapSimple = resIssue.data.nomorDefinitif;
    console.log('   -> Nomor Laporan Terbit untuk PROPERTY_SIMPLE:', noLapSimple);
    
    // VERIFIKASI UTAMA P0:
    const segs = noLapSimple.split('/');
    assert(segs[2] === 'PI', `Segmen 3 WAJIB 'PI', aktual: '${segs[2]}'`);
    assert(segs[2] !== 'PS', "DILARANG KERAS MENGGUNAKAN 'PS' SEBAGAI KODE SEGMEN 3 NOLAP!");
    testPass('Test 7: NoLap untuk PROPERTY_SIMPLE resmi menghasilkan segmen 3 /PI/ (Bukan /PS/)');
  } catch (e) { testFail('Test 7: Definitive NoLap for Simple Property', e); }

  // 8. Verifikasi Data Internal Tetap Membedakan PROPERTY_SIMPLE dari PROPERTY
  try {
    const resReg = await request(`?action=getLivingRiskRegister&idPenugasan=${testIdSimplePS}`, { token: TOKENS.SUPER_ADMIN });
    assert(resReg.status === 200);
    const detail = await request(`?action=getDualGateDetail&idPenugasan=${testIdSimplePS}`, { token: TOKENS.SUPER_ADMIN });
    assert(detail.status === 200);
    const rec = detail.data.record;
    assert(rec.penugasan.service_classification_id === 'PROPERTY_SIMPLE', 'Identitas internal PROPERTY_SIMPLE tetap utuh');
    assert(rec.penugasan.report_service_code === 'PI', 'report_service_code tercatat PI');
    testPass('Test 8: Identitas klasifikasi internal PROPERTY_SIMPLE terpelihara utuh tanpa kehilangan kategori');
  } catch (e) { testFail('Test 8: Internal Classification Identity Integrity', e); }

  // 9. Verifikasi Alur End-to-End Penilaian Bisnis menghasilkan NoLap bersegmen /BS/
  const testIdBisnis = 'NSR-TEST-BIZ-' + Date.now();
  try {
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        idPenugasan: testIdBisnis,
        service_classification_id: 'BUSINESS',
        tujuanPenilaian: 'Studi Kelayakan Bisnis & Transaksi Saham',
        jenisObjek: '100% Saham PT Digital Solusi Nusantara',
        penilaiPublikDitunjuk: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        penilaiPublikId: 'nanang_penilai',
        appraiser_license_code: '0218',
        nama_pengaju: 'Petugas Pengaju Resmi',
        email_pengaju: 'petugas.resmi@kjppnanangrahayu.com',
        wa_pengaju: '081299998888',
        checklistAwal: {}
      }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdBisnis, keputusan: 'SETUJU', catatan: 'Telaah penilaian bisnis disetujui.' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdBisnis, keputusan: 'SETUJU', catatan: 'Metodologi DCF disetujui.' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testIdBisnis, nomorLpResmi: 'LP/088/BIZ/2026' } });
    await request('?action=submitGerbang2Akhir', { method: 'POST', token: TOKENS.SUPER_ADMIN, body: { idPenugasan: testIdBisnis, deltaAnalysis: {} } });
    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdBisnis, keputusan: 'SETUJU', catatan: 'QC draf bisnis selesai.' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdBisnis, keputusan: 'SETUJU', catatan: 'Kertas kerja bisnis terverifikasi.' } });
    
    const resIssueBiz = await request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testIdBisnis } });
    if (resIssueBiz.status !== 200) console.log('DEBUG resIssueBiz:', resIssueBiz);
    assert(resIssueBiz.status === 200);
    const noLapBiz = resIssueBiz.data.nomorDefinitif;
    console.log('   -> Nomor Laporan Terbit untuk BUSINESS:', noLapBiz);
    const segs = noLapBiz.split('/');
    assert(segs[2] === 'BS', `Segmen 3 WAJIB 'BS', aktual: '${segs[2]}'`);
    testPass('Test 9: Penilaian Bisnis resmi menghasilkan segmen 3 /BS/');
  } catch (e) { testFail('Test 9: Business Report Numbering BS', e); }

  // 10. Verifikasi Alur End-to-End Personal Properti menghasilkan NoLap bersegmen /PP/
  const testIdPP = 'NSR-TEST-PP-' + Date.now();
  try {
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        idPenugasan: testIdPP,
        service_classification_id: 'PERSONAL_PROPERTY',
        tujuanPenilaian: 'Agunan Bank',
        jenisObjek: 'Mesin Turbine Generator & Alat Berat Komatsu',
        penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
        penilaiPublikId: 'deni_penilai',
        appraiser_license_code: '00581',
        nama_pengaju: 'Petugas Pengaju Resmi',
        email_pengaju: 'petugas.resmi@kjppnanangrahayu.com',
        wa_pengaju: '081299998888',
        checklistAwal: {}
      }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdPP, keputusan: 'SETUJU', catatan: 'Telaah SPI 301 disetujui.' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdPP, keputusan: 'SETUJU', catatan: 'Metodologi biaya devaluasi teknis disetujui.' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testIdPP, nomorLpResmi: 'LP/077/PP/2026' } });
    await request('?action=submitGerbang2Akhir', { method: 'POST', token: TOKENS.SUPER_ADMIN, body: { idPenugasan: testIdPP, deltaAnalysis: {} } });
    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdPP, keputusan: 'SETUJU', catatan: 'Draf personal properti selesai.' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdPP, keputusan: 'SETUJU', catatan: 'Kertas kerja personal properti terverifikasi.' } });

    const resIssuePP = await request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testIdPP } });
    assert(resIssuePP.status === 200);
    const noLapPP = resIssuePP.data.nomorDefinitif;
    console.log('   -> Nomor Laporan Terbit untuk PERSONAL_PROPERTY:', noLapPP);
    const segs = noLapPP.split('/');
    assert(segs[2] === 'PP', `Segmen 3 WAJIB 'PP', aktual: '${segs[2]}'`);
    testPass('Test 10: Penilaian Personal Properti resmi menghasilkan segmen 3 /PP/');
  } catch (e) { testFail('Test 10: Personal Property Numbering PP', e); }

  // 11. Proteksi Anti-Bypass Manual: Input Manual dengan /PS/ Otomatis Dikonversi ke /PI/
  const testIdManualSanitize = 'NSR-TEST-MANUAL-' + Date.now();
  try {
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: { idPenugasan: testIdManualSanitize, nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: {} }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdManualSanitize, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdManualSanitize, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testIdManualSanitize, nomorLpResmi: 'LP/MAN/2026' } });
    await request('?action=submitGerbang2Akhir', { method: 'POST', token: TOKENS.SUPER_ADMIN, body: { idPenugasan: testIdManualSanitize, deltaAnalysis: {} } });
    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdManualSanitize, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdManualSanitize, keputusan: 'SETUJU', catatan: 'OK' } });

    // Coba masukkan manual nomor mengandung /PS/ (Misal human error operator)
    const testManualSeq = String(42800 + Math.floor(Math.random() * 1000)).padStart(5, '0');
    const resManual = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: testIdManualSanitize,
        nomorLaporan: `${testManualSeq}/2.0160-00/PS/07/00581/1/X/2026` // Mengandung PS!
      }
    });
    assert(resManual.status === 200);
    const sanitizedNo = resManual.data.nomorDefinitif;
    assert(sanitizedNo.includes('/PI/'), `Nomor wajib disanitasi ke /PI/, aktual: ${sanitizedNo}`);
    assert(!sanitizedNo.includes('/PS/'), `Nomor DILARANG mengandung /PS/!`);
    testPass('Test 11: Sanitasi nomor manual otomatis menolak/mengonversi /PS/ menjadi /PI/');
  } catch (e) { testFail('Test 11: Manual Number Sanitization Guard', e); }

  // 12. Verifikasi Frontend Portal JO Memuat Dropdown Klasifikasi Jasa Penilaian
  try {
    const htmlJo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
    assert(htmlJo.includes('id="klasifikasi_jasa_penilaian"'), 'Dropdown klasifikasi_jasa_penilaian ada di Portal JO');
    assert(htmlJo.includes('value="PROPERTY"'), 'Opsi PROPERTY tersedia');
    assert(htmlJo.includes('value="PROPERTY_SIMPLE"'), 'Opsi PROPERTY_SIMPLE tersedia');
    assert(htmlJo.includes('data-report-code="PI"'), 'Opsi properti sederhana memiliki data-report-code PI');
    testPass('Test 12: Portal JO terintegrasi dengan Dropdown Klasifikasi Jasa Penilaian');
  } catch (e) { testFail('Test 12: Portal JO Dropdown HTML Integration', e); }

  // 13. Verifikasi Frontend Portal NoLap Memuat Opsi Bersih Tanpa PS Sebagai Nilai Laporan
  try {
    const htmlNoLap = fs.readFileSync('portal-nolap.html', 'utf8');
    assert(htmlNoLap.includes('value="PROPERTY_SIMPLE" data-report-code="PI"'), 'Portal NoLap memiliki opsi PROPERTY_SIMPLE ber-kode PI');
    assert(!htmlNoLap.includes('<option value="PS">PS — Penilaian Properti Sederhana</option>'), 'Opsi lama <option value="PS"> telah dihapus');
    testPass('Test 13: Portal NoLap Pusat telah dimutakhirkan ke model data ganda');
  } catch (e) { testFail('Test 13: Portal NoLap Options Update', e); }

  // 14. Verifikasi Frontend Portal NoLap Cabang Memuat Opsi Bersih
  try {
    const htmlCabang = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
    assert(htmlCabang.includes('value="PROPERTY_SIMPLE" data-report-code="PI"'), 'Portal Cabang memiliki opsi PROPERTY_SIMPLE');
    assert(!htmlCabang.includes('<option value="PS">PS - Penilaian Properti Sederhana'), 'Opsi lama cabang <option value="PS"> telah dihapus');
    testPass('Test 14: Portal NoLap Cabang telah dimutakhirkan ke model data ganda');
  } catch (e) { testFail('Test 14: Portal NoLap Cabang Options Update', e); }

  // 15. Verifikasi Google Apps Script Backend (gas-nolap-Code.gs) & Merge Tags Engine
  try {
    const gasCode = fs.readFileSync('gas-nolap-Code.gs', 'utf8');
    assert(gasCode.includes('P0 GUARD & SE-6/PPPK/2018: Segmen 3 HANYA PI'), 'GAS memuat proteksi P0 segmen 3');
    const mergeCode = fs.readFileSync('merge-tags-engine.php', 'utf8');
    assert(mergeCode.includes('{{kode_jasa_laporan}}'), 'Merge tags engine memuat tag kode_jasa_laporan');
    testPass('Test 15: Google Apps Script Backend & Merge Tags Engine tersinkronisasi 100%');
  } catch (e) { testFail('Test 15: GAS and Merge Tags Synchronization', e); }

  console.log('================================================================');
  console.log(`HASIL AKHIR: ${passed}/15 TESTS PASSED, ${failed} FAILED (${passed === 15 ? '100% SUKSES' : 'ADA KEGAGALAN'})`);
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
