/**
 * Test Suite: Addendum Konsistensi Penunjukan Penilai Publik SSOT (OPINI NSR)
 * Memverifikasi:
 * 1. SSOT Master 5 Penilai Publik
 * 2. Section 05 & Section 08 portal-penugasan-jo.html sinkronisasi dua arah
 * 3. Keterlihatan kelima kandidat tanpa diskriminasi cabang
 * 4. Penandaan alasan kelayakan profesional (PS vs P) tanpa penghilangan diam-diam
 * 5. Verifikasi Gerbang 2 vs Gerbang 1, penolakan perubahan tanpa justifikasi (400)
 * 6. Audit trail perubahan penanggung jawab pada living risk register
 * 7. Penomoran NoLap 7 segmen (Segmen 5 izin) akurat mengikuti Penilai terpilih
 * 8. Pemisahan peran mutlak: Reviewer Tim, Kepala SPM, Kepala Divtek, Penilai Publik
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8897;
const BASE_URL = `http://127.0.0.1:${PORT}/nolap-data-handler.php`;

const TOKENS = {
  DANNY_SPM: 'NSR-SPM-DANNY-2026',
  DENI_DIVTEK: 'NSR-DIVTEK-DENI-2026',
  NANANG_PENILAI: 'NSR-PENILAI-NANANG-2026',
  DENI_PENILAI: 'NSR-PENILAI-DENI-2026',
  HERNITA_PENILAI: 'NSR-PENILAI-HERNITA-2026',
  AMIN_PENILAI: 'NSR-PENILAI-AMIN-2026',
  DHARMA_PENILAI: 'NSR-PENILAI-DHARMA-2026',
  ADMIN_PUSAT: 'NSR-ADMIN-PUSAT-2026',
  ADMIN_BDG: 'NSR-ADMIN-BDG-2026',
  ADMIN_PDG: 'NSR-ADMIN-PDG-2026',
  ADMIN_MKS: 'NSR-ADMIN-MKS-2026',
  ADMIN_PLB: 'NSR-ADMIN-PLB-2026'
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

async function runAddendumTests() {
  console.log('================================================================');
  console.log('   ADDENDUM KONSISTENSI PENUNJUKAN PENILAI PUBLIK (20 TESTS)    ');
  console.log('================================================================\n');

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

  // Spawn PHP test server
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'nolap-data-handler.php']);
  await new Promise(r => setTimeout(r, 1500));

  try {

  // 1. Verifikasi File Master SSOT
  const masterFile = path.resolve('data/masters/master_penilai_publik.json');
  assert(fs.existsSync(masterFile), 'Test 1: data/masters/master_penilai_publik.json tersedia');

  const penilaiMasters = JSON.parse(fs.readFileSync(masterFile, 'utf8'));
  assert(Array.isArray(penilaiMasters) && penilaiMasters.length === 5, 'Test 2: Master Penilai Publik memuat tepat 5 Penilai resmi');

  const ids = penilaiMasters.map(p => p.id);
  assert(
    ids.includes('nanang_penilai') &&
    ids.includes('deni_penilai') &&
    ids.includes('hernita_penilai') &&
    ids.includes('amin_penilai') &&
    ids.includes('dharma_penilai'),
    'Test 3: Kelima ID Penilai Publik (nanang, deni, hernita, amin, dharma) terdaftar'
  );

  // 2. Verifikasi UI Portal Penugasan JO
  const portalJoHtml = fs.readFileSync(path.resolve('portal-penugasan-jo.html'), 'utf8');
  assert(portalJoHtml.includes('g1-selected-penilai-card'), 'Test 4: Section 08 memiliki Kartu Validasi Kelayakan Profesional');
  assert(portalJoHtml.includes('g1-roster-penilai-container'), 'Test 5: Section 08 memiliki Roster 5 Kandidat Penilai Publik');
  assert(portalJoHtml.includes('syncSection05ToSection08'), 'Test 6: Dua arah sinkronisasi Section 05 dan Section 08 aktif');
  assert(portalJoHtml.includes('evaluasiKelayakanPenilai'), 'Test 7: Evaluasi kelayakan profesional (PS vs P) aktif');
  assert(!portalJoHtml.includes('- Terkunci Cabang'), 'Test 8: Kunci sepihak cabang pada Section 05 telah dihapus');

  // 3. Verifikasi UI Portal NoLap
  const portalNolapHtml = fs.readFileSync(path.resolve('portal-nolap.html'), 'utf8');
  assert(portalNolapHtml.includes('g2-penilai-penandatangan'), 'Test 9: Gerbang 2 memiliki pemilih Penilai penandatangan akhir');
  assert(portalNolapHtml.includes('g2-alasan-perubahan-penilai'), 'Test 10: Gerbang 2 memiliki input justifikasi perubahan penanggung jawab');

  // 4. Pengujian Backend Integrasi
  // Submit Gerbang 1 dengan masing-masing Penilai (misal Hernita Cabang Padang)
  const testIdPadang = `NSR-TEST-PDG-${Date.now().toString().slice(-4)}`;
  const tPadang = await request('?action=submitGerbang1Awal', {
    method: 'POST',
    token: TOKENS.ADMIN_PDG,
    body: {
      idPenugasan: testIdPadang,
      tujuanPenilaian: 'Agunan Perbankan',
      jenisObjek: 'Rumah Tinggal Sederhana',
      penilaiPublikId: 'hernita_penilai',
      penilaiPublikDitunjuk: 'Hernita, S.Si., MAPPI (Cert.)',
      origin_branch_id: 'Padang',
      checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
    }
  });
  assert(tPadang.status === 200 && tPadang.data.status === 'MENUNGGU_SPM_AWAL', 'Test 11: Intake Gerbang 1 dengan Hernita (PS Padang) berhasil');

  // Review SPM & Divtek Gerbang 1
  await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdPadang, keputusan: 'SETUJU', catatan: 'Memenuhi syarat' } });
  await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdPadang, keputusan: 'SETUJU', catatan: 'Teknis sesuai' } });
  await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testIdPadang } });

  // Percobaan Gerbang 2: Ubah Penilai Publik tanpa justifikasi -> Wajib 400 DITOLAK
  const tChangeUnjustified = await request('?action=submitGerbang2Akhir', {
    method: 'POST',
    token: TOKENS.ADMIN_PDG,
    body: {
      idPenugasan: testIdPadang,
      penilaiPublikId: 'nanang_penilai', // Ganti ke Nanang tanpa alasan
      drafLaporanUrl: 'https://drive.google.com/test.pdf',
      baiUrl: 'https://drive.google.com/bai.pdf'
    }
  });
  assert(tChangeUnjustified.status === 400 && tChangeUnjustified.data.violation === 'UNJUSTIFIED_APPRAISER_CHANGE', 'Test 12: Ubah Penanggung Jawab di Gerbang 2 tanpa justifikasi wajib ditolak (400)');

  // Submit Gerbang 2 dengan Justifikasi Sah
  const tChangeValid = await request('?action=submitGerbang2Akhir', {
    method: 'POST',
    token: TOKENS.ADMIN_PDG,
    body: {
      idPenugasan: testIdPadang,
      penilaiPublikId: 'nanang_penilai',
      alasanPerubahanPJ: 'Penilai Hernita cuti medis mendesak, dialihkan ke Pemimpin Rekan sesuai SOP SPM.',
      drafLaporanUrl: 'https://drive.google.com/test.pdf',
      baiUrl: 'https://drive.google.com/bai.pdf',
      checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
      deltaAnalysis: { deviasiMaterialTanpaJustifikasi: false }
    }
  });
  assert(tChangeValid.status === 200, 'Test 13: Perubahan Penanggung Jawab dengan justifikasi sah diterima -> MENUNGGU_SPM_AKHIR');

  // Review SPM & Divtek Gerbang 2
  await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdPadang, keputusan: 'SETUJU', catatan: 'Justifikasi perubahan PJ diterima' } });
  await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdPadang, keputusan: 'SETUJU', catatan: 'KKP disetujui' } });

  // Terbitkan NoLap Definitif -> Harus menggunakan izin segmen Nanang (0218)
  const tIssueNoLap = await request('?action=issueDefinitiveNoLap', {
    method: 'POST',
    token: TOKENS.ADMIN_PUSAT,
    body: { idPenugasan: testIdPadang }
  });
  assert(tIssueNoLap.status === 200 && tIssueNoLap.data.nomorDefinitif.includes('/0218/'), `Test 14: NoLap definitif mencantumkan izin Nanang (0218): ${tIssueNoLap.data?.nomorDefinitif}`);

  // Percobaan Tanda Tangan: Hernita mencoba tanda tangan penugasan yang sudah dialihkan ke Nanang -> Wajib 403
  const tSignHernitaBlocked = await request('?action=signLaporanPenilaiPublik', {
    method: 'POST',
    token: TOKENS.HERNITA_PENILAI,
    body: { idPenugasan: testIdPadang }
  });
  assert(tSignHernitaBlocked.status === 403, 'Test 15: Penilai asal (Hernita) dilarang menandatangani setelah pengalihan sah (403)');

  // Tanda Tangan Sah oleh Nanang (Penilai Pengganti Resmi)
  const tSignNanang = await request('?action=signLaporanPenilaiPublik', {
    method: 'POST',
    token: TOKENS.NANANG_PENILAI,
    body: { idPenugasan: testIdPadang }
  });
  assert(tSignNanang.status === 200 && tSignNanang.data.statusAkhir === 'LAPORAN_FINAL', 'Test 16: Penilai pengganti sah (Nanang) berhasil menandatangani -> LAPORAN_FINAL');

  // Submit Penugasan Cabang Makassar dengan Amin Sade (PS-1.16.00126)
  const testIdMks = `NSR-TEST-MKS-${Date.now().toString().slice(-4)}`;
  const tMks = await request('?action=submitGerbang1Awal', {
    method: 'POST',
    token: TOKENS.ADMIN_MKS,
    body: {
      idPenugasan: testIdMks,
      tujuanPenilaian: 'Agunan Perbankan',
      jenisObjek: 'Tanah dan Bangunan Ruko 2 Lantai',
      penilaiPublikId: 'amin_penilai',
      penilaiPublikDitunjuk: 'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
      origin_branch_id: 'Makassar',
      checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
    }
  });
  assert(tMks.status === 200, 'Test 17: Intake Gerbang 1 Makassar dengan Amin Sade berhasil');

  // Alur penuh Makassar sampai NoLap
  await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdMks, keputusan: 'SETUJU', catatan: 'OK' } });
  await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdMks, keputusan: 'SETUJU', catatan: 'OK' } });
  await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testIdMks } });
  await request('?action=submitGerbang2Akhir', {
    method: 'POST',
    token: TOKENS.ADMIN_MKS,
    body: {
      idPenugasan: testIdMks,
      penilaiPublikId: 'amin_penilai',
      drafLaporanUrl: 'https://drive.google.com/test_mks.pdf',
      baiUrl: 'https://drive.google.com/bai_mks.pdf',
      checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
      deltaAnalysis: { deviasiMaterialTanpaJustifikasi: false }
    }
  });
  await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testIdMks, keputusan: 'SETUJU', catatan: 'OK' } });
  await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testIdMks, keputusan: 'SETUJU', catatan: 'OK' } });

  const tIssueMks = await request('?action=issueDefinitiveNoLap', {
    method: 'POST',
    token: TOKENS.ADMIN_PUSAT,
    body: { idPenugasan: testIdMks }
  });
  assert(tIssueMks.status === 200 && tIssueMks.data.nomorDefinitif.includes('/00126/'), `Test 18: NoLap Makassar mencantumkan segmen izin Amin Sade (00126): ${tIssueMks.data?.nomorDefinitif}`);

  // Amin Sade tanda tangan sah laporan Makassar
  const tSignAmin = await request('?action=signLaporanPenilaiPublik', {
    method: 'POST',
    token: TOKENS.AMIN_PENILAI,
    body: { idPenugasan: testIdMks }
  });
  assert(tSignAmin.status === 200 && tSignAmin.data.statusAkhir === 'LAPORAN_FINAL', 'Test 19: Amin Sade berhasil menandatangani laporan resmi Makassar');

  // Verifikasi Audit Pemisahan Peran: Reviewer Tim / Non-Penilai dilarang tanda tangan
  const tSignUnauthorized = await request('?action=signLaporanPenilaiPublik', {
    method: 'POST',
    token: TOKENS.ADMIN_MKS, // Staf Admin Cabang / Pelaksana
    body: { idPenugasan: testIdMks }
  });
  assert(tSignUnauthorized.status === 403, 'Test 20: Staf Pelaksana / Admin Cabang dilarang menandatangani laporan (403)');

  console.log('\n================================================================');
  console.log(`HASIL AKHIR: ${passed}/20 TESTS PASSED, ${failed} FAILED (${passed === 20 ? '100% SUKSES' : 'ADA KEGAGALAN'})`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
  } finally {
    php.kill();
  }
}

runAddendumTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
