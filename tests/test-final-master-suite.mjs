/**
 * OPINI NSR 2026 — MASTER AUTOMATED TEST SUITE (38 CRITICAL CRITERIA)
 * Menguji seluruh aspek autentikasi token, strict separation of duties RBAC,
 * workflow dual gate, otoritas SUPER ADMIN (KING), emergency override,
 * concurrency locking, dan pencegahan JavaScript mentah pada portal.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8895;
const BASE_URL = `http://127.0.0.1:${PORT}/nolap-data-handler.php`;

const TOKENS = {
  KING: 'NSR8899',
  SPM: 'NSR-SPM-DANNY-2026',
  DIVTEK: 'NSR-DIVTEK-2026',
  DIVTEK_ALIAS: 'NSR-DIVTEK-DENI-2026',
  ADMIN_PUSAT: 'NSR-ADM-2026',
  ADMIN_PUSAT_ALIAS: 'NSR-ADMIN-PUSAT-2026',
  NARA_PENILAI: 'NSR-NARA-2026',
  NARA_ALIAS: 'NSR-PENILAI-NANANG-2026',
  DUS_PENILAI: 'NSR-DUS-2026',
  DUS_ALIAS: 'NSR-PENILAI-DENI-2026',
  ADMIN_BDG: 'NSR-ADMIN-BDG-2026',
  INVALID: 'NSR-FAKE-TOKEN-9999'
};

async function request(endpoint, options = {}) {
  const url = new URL(endpoint, BASE_URL);
  return new Promise((resolve, reject) => {
    const postData = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.token ? { 'X-NSR-Token': options.token } : {}),
        ...(options.overrideKey ? { 'X-NSR-Override-Key': options.overrideKey } : {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
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
    if (postData) req.write(postData);
    req.end();
  });
}

async function runMasterTestSuite() {
  console.log('================================================================');
  console.log('   OPINI NSR 2026 — MASTER COMPREHENSIVE TEST SUITE (38 TESTS)   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testNum, desc, debugInfo = null) {
    if (condition) {
      console.log(`\x1b[32m✔ PASS [TEST ${testNum.toString().padStart(2, '0')}]:\x1b[0m ${desc}`);
      passed++;
    } else {
      console.error(`\x1b[31m✘ FAIL [TEST ${testNum.toString().padStart(2, '0')}]:\x1b[0m ${desc}`);
      if (debugInfo) {
        console.error('   -> Debug:', JSON.stringify(debugInfo));
      }
      failed++;
    }
  }

  // Backup & reset test database
  const dbFile = path.resolve('data/dual_gate_database.json');
  const backupDb = path.resolve('data/dual_gate_database.json.bak_test');
  if (fs.existsSync(dbFile)) {
    fs.copyFileSync(dbFile, backupDb);
  }
  fs.writeFileSync(dbFile, JSON.stringify([], null, 2));

  // Spawn PHP server
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'nolap-data-handler.php']);
  await new Promise(r => setTimeout(r, 1200));

  try {
    // -------------------------------------------------------------------------
    // CATEGORY A: AUTHENTICATION
    // -------------------------------------------------------------------------
    // 1. Token tanpa izin ditolak (401)
    const t1 = await request('');
    assert(t1.status === 401 && t1.data.authenticated === false, 1, 'Token tanpa izin ditolak (401 Unauthorized)');

    // 2. Token Divtek resmi (NSR-DIVTEK-2026) memperoleh role benar
    const t2 = await request('?action=getQueueDeni', { token: TOKENS.DIVTEK });
    assert(t2.status === 200 && t2.data.role === 'KEPALA_DIVTEK', 2, 'Token Divtek resmi memperoleh role KEPALA_DIVTEK');

    // 3. Token lama yang dinonaktifkan / token invalid ditolak (401)
    const t3 = await request('?action=getQueueDeni', { token: TOKENS.INVALID });
    assert(t3.status === 401, 3, 'Token lama yang tidak sah/invalid ditolak (401)');

    // 4. Token SPM tidak memperoleh role Admin Pusat (Tidak bisa query queue pusat tanpa role)
    // Coba call publishOfficialLP dengan token SPM -> Wajib 403
    const t4 = await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.SPM,
      body: { idPenugasan: 'DUMMY-01', nomorLpResmi: '0416/LP/2026' }
    });
    assert(t4.status === 403, 4, 'Token SPM tidak memperoleh role Admin Pusat (Ditolak terbitkan LP)');

    // 5. Token Divtek tidak memperoleh role Admin Pusat
    const t5 = await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.DIVTEK,
      body: { idPenugasan: 'DUMMY-01', nomorLpResmi: '0416/LP/2026' }
    });
    assert(t5.status === 403, 5, 'Token Divtek tidak memperoleh role Admin Pusat (Ditolak terbitkan LP)');

    // 6. Token Penilai Publik tidak mendapat hak penerbitan nomor
    const t6 = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.DUS_PENILAI,
      body: { idPenugasan: 'DUMMY-01' }
    });
    assert(t6.status === 403, 6, 'Token Penilai Publik tidak mendapat hak penerbitan nomor (403)');

    // 7. Token Admin Cabang lama tetap berjalan
    const testIdPenugasan = `NSR-TEST-2026-${Date.now().toString().slice(-4)}`;
    const t7 = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: {
        idPenugasan: testIdPenugasan,
        tujuanPenilaian: 'Agunan Perbankan',
        namaKlien: 'PT Bank Central Asia',
        jenisObjek: 'Ruko Komersial 3 Lantai',
        penilaiPublikId: 'deni_penilai',
        penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    assert(t7.status === 200 && t7.data.status === 'MENUNGGU_SPM_AWAL', 7, 'Token Admin Cabang lama tetap berjalan (Sukses Submit)');

    // 8. SUPER ADMIN mendapatkan permission sesuai matriks (Dapat akses queue super admin)
    const t8 = await request('?action=getQueueSuperAdmin', { token: TOKENS.KING });
    assert(t8.status === 200 && t8.data.role === 'SUPER_ADMIN', 8, 'SUPER ADMIN mendapatkan role & permission penuh SUPER_ADMIN');

    // -------------------------------------------------------------------------
    // CATEGORY B: STRICT RBAC SEPARATION OF DUTIES
    // -------------------------------------------------------------------------
    // 9. SPM menerbitkan LP langsung → 403
    const t9 = await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.SPM,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t9.status === 403, 9, 'SPM menerbitkan LP langsung ditolak keras (403)');

    // 10. Divtek menerbitkan LP langsung → 403
    const t10 = await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.DIVTEK,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t10.status === 403, 10, 'Divtek menerbitkan LP langsung ditolak keras (403)');

    // 11. SPM menerbitkan NoLap langsung → 403
    const t11 = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.SPM,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t11.status === 403, 11, 'SPM menerbitkan NoLap langsung ditolak keras (403)');

    // 12. Divtek menerbitkan NoLap langsung → 403
    const t12 = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.DIVTEK,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t12.status === 403, 12, 'Divtek menerbitkan NoLap langsung ditolak keras (403)');

    // 13. Admin Pusat melakukan review SPM → 403
    const t13 = await request('?action=reviewDannyGerbang1', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Admin Pusat coba review SPM' }
    });
    assert(t13.status === 403, 13, 'Admin Pusat dilarang melakukan review SPM (403)');

    // 14. Admin Pusat melakukan review Divtek → 403
    const t14 = await request('?action=reviewDeniGerbang1', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Admin Pusat coba review Divtek' }
    });
    assert(t14.status === 403, 14, 'Admin Pusat dilarang melakukan review Divtek (403)');

    // 15. Queue Super Admin diakses oleh bukan KING → 403
    const t15 = await request('?action=getQueueSuperAdmin', { token: TOKENS.ADMIN_BDG });
    assert(t15.status === 403, 15, 'Akses Queue Super Admin oleh non-KING ditolak (403)');

    // 16. Divtek menandatangani sebagai Penilai Publik menggunakan token Divtek → 403
    const t16 = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.DIVTEK,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t16.status === 403, 16, 'Token Divtek dilarang menandatangani laporan sebagai Penilai Publik (403)');

    // -------------------------------------------------------------------------
    // CATEGORY C: WORKFLOW & ANTI-BYPASS GATES
    // -------------------------------------------------------------------------
    // 17. Divtek mencoba review sebelum SPM → ditolak (403 OUT_OF_ORDER_APPROVAL_ATTEMPT)
    const t17 = await request('?action=reviewDeniGerbang1', {
      method: 'POST',
      token: TOKENS.DIVTEK,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Coba bypass Danny' }
    });
    assert(t17.status === 403 && t17.data.violation === 'OUT_OF_ORDER_APPROVAL_ATTEMPT', 17, 'Divtek review mendahului SPM ditolak (Anti-Bypass Guard 1)');

    // 18. Pengajuan dengan red flag masuk status HOLD_ESKALASI_AWAL
    const redFlagId = `NSR-RF-${Date.now().toString().slice(-4)}`;
    const t18 = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: {
        idPenugasan: redFlagId,
        tujuanPenilaian: 'Pengadaan Tanah',
        namaKlien: 'PT Sengketa Tanah Uji',
        jenisObjek: 'Tanah Sengketa',
        penilaiPublikId: 'nanang_penilai',
        penilaiPublikDitunjuk: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: true }
      }
    });
    assert(t18.status === 200 && t18.data.status === 'HOLD_ESKALASI_AWAL', 18, 'Pengajuan dengan Red Flag otomatis masuk status HOLD_ESKALASI_AWAL');

    // 19. NoLap prematur ditolak (Gerbang 2 submit pada penugasan yang masih HOLD)
    const t19 = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: { idPenugasan: redFlagId }
    });
    assert(t19.status === 403, 19, 'Pengajuan NoLap prematur pada penugasan HOLD diblokir (403)');

    // 20. Approval berurutan menghasilkan status benar (Danny -> Deni)
    const t20_a = await request('?action=reviewDannyGerbang1', {
      method: 'POST',
      token: TOKENS.SPM,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Mitigasi awal lengkap dan independen.' }
    });
    const t20_b = await request('?action=reviewDeniGerbang1', {
      method: 'POST',
      token: TOKENS.DIVTEK,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Metodologi penilaian pasar sesuai standar SPI.' }
    });
    assert(t20_a.data.newStatus === 'MENUNGGU_DIVTEK_AWAL' && t20_b.data.newStatus === 'SIAP_TERBIT_LP', 20, 'Approval berurutan menghasilkan status benar (SIAP_TERBIT_LP)');

    // 21. Penerbitan nomor LP oleh Admin Pusat yang sah berhasil
    const t21 = await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdPenugasan, nomorLpResmi: '0416/2.0160-00/LP/X/2026' }
    });
    assert(t21.status === 200 && t21.data.status === 'LP_DITERBITKAN', 21, 'Penerbitan LP resmi oleh Admin Pusat sah berhasil');

    // Submit Gerbang 2 untuk penugasan sah
    await request('?action=submitGerbang2Akhir', {
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

    // Review SPM & Divtek pada Gerbang 2
    await request('?action=reviewDannyGerbang2', {
      method: 'POST',
      token: TOKENS.SPM,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'QC draf laporan final disetujui.' }
    });
    await request('?action=reviewDeniGerbang2', {
      method: 'POST',
      token: TOKENS.DIVTEK,
      body: { idPenugasan: testIdPenugasan, keputusan: 'SETUJU', catatan: 'Verifikasi teknis akhir nilai pasar sah.' }
    });
    const tIssueNoLap = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: testIdPenugasan }
    });

    // 22. Penilai Publik yang tidak ditugaskan tidak dapat menandatangani (Nanang mencoba ttd penugasan Deni)
    const t22 = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.NARA_PENILAI,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t22.status === 403 && t22.data.violation === 'UNASSIGNED_PARTNER_SIGN_ATTEMPT', 22, 'Penilai Publik yang tidak ditugaskan ditolak keras menandatangani laporan');

    // -------------------------------------------------------------------------
    // CATEGORY D: SUPER ADMIN (KING) & EMERGENCY OVERRIDE
    // -------------------------------------------------------------------------
    // Buat penugasan baru untuk simulasi alur normal KING
    const kingTestId = `NSR-KING-RUN-${Date.now().toString().slice(-4)}`;
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: {
        idPenugasan: kingTestId,
        tujuanPenilaian: 'Jual Beli',
        namaKlien: 'PT King Operasional Uji',
        jenisObjek: 'Gedung Perkantoran',
        penilaiPublikId: 'deni_penilai',
        penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });

    // 23. KING dapat melakukan review SPM dalam alur normal (aktor dicatat SUPER_ADMIN)
    const t23 = await request('?action=reviewDannyGerbang1', {
      method: 'POST',
      token: TOKENS.KING,
      body: { idPenugasan: kingTestId, keputusan: 'SETUJU', catatan: 'Approval SPM oleh SUPER ADMIN (KING)' }
    });
    assert(t23.status === 200 && t23.data.newStatus === 'MENUNGGU_DIVTEK_AWAL', 23, 'KING dapat mengeksekusi review SPM dalam alur normal', t23);

    // 24. KING dapat melakukan review Divtek setelah tahapan disyaratkan
    const t24 = await request('?action=reviewDeniGerbang1', {
      method: 'POST',
      token: TOKENS.KING,
      body: { idPenugasan: kingTestId, keputusan: 'SETUJU', catatan: 'Approval Divtek oleh SUPER ADMIN (KING)' }
    });
    assert(t24.status === 200 && t24.data.newStatus === 'SIAP_TERBIT_LP', 24, 'KING dapat mengeksekusi review Divtek setelah tahapan disyaratkan', t24);

    // 25. KING dapat menerbitkan LP yang sudah memenuhi persyaratan
    const t25 = await request('?action=publishOfficialLP', {
      method: 'POST',
      token: TOKENS.KING,
      body: { idPenugasan: kingTestId, nomorLpResmi: '0417/2.0160-00/LP/X/2026' }
    });
    assert(t25.status === 200 && t25.data.status === 'LP_DITERBITKAN', 25, 'KING dapat menerbitkan LP resmi yang memenuhi persyaratan', t25);

    // 26. KING dapat mengakses fungsi override darurat yang sah (Buka HOLD pada redFlagId)
    const t26 = await request('?action=emergencyOverrideGate', {
      method: 'POST',
      token: TOKENS.KING,
      overrideKey: 'NSR8899',
      body: {
        idPenugasan: redFlagId,
        targetStatus: 'MENUNGGU_DIVTEK_AWAL',
        alasanOverride: 'Dokumen legalitas kepemilikan telah diverifikasi oleh Notaris rekanan resmi.',
        reauthKey: 'NSR8899'
      }
    });
    assert(t26.status === 200 && t26.data.statusSesudah === 'MENUNGGU_DIVTEK_AWAL', 26, 'KING sukses mengeksekusi Emergency Override darurat yang sah', t26);

    // 27. Override tanpa alasan wajib ditolak (min 15 chars)
    const t27 = await request('?action=emergencyOverrideGate', {
      method: 'POST',
      token: TOKENS.KING,
      overrideKey: 'NSR8899',
      body: {
        idPenugasan: redFlagId,
        targetStatus: 'SIAP_TERBIT_LP',
        alasanOverride: 'Pendek',
        reauthKey: 'NSR8899'
      }
    });
    assert(t27.status === 400, 27, 'Override tanpa alasan substantif wajib ditolak (400)', t27);

    // 28. Override tanpa autentikasi tambahan yang diwajibkan ditolak (401)
    const t28 = await request('?action=emergencyOverrideGate', {
      method: 'POST',
      token: TOKENS.KING,
      body: {
        idPenugasan: redFlagId,
        targetStatus: 'SIAP_TERBIT_LP',
        alasanOverride: 'Alasan lengkap tapi tanpa reauth key yang sah'
      }
    });
    assert(t28.status === 401, 28, 'Override tanpa kunci re-autentikasi (MFA) ditolak (401)');

    // 29. Override oleh selain SUPER ADMIN ditolak (403)
    const t29 = await request('?action=emergencyOverrideGate', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      overrideKey: 'NSR8899',
      body: {
        idPenugasan: redFlagId,
        targetStatus: 'SIAP_TERBIT_LP',
        alasanOverride: 'Admin Pusat mencoba override darurat ilegal.',
        reauthKey: 'NSR8899'
      }
    });
    assert(t29.status === 403, 29, 'Override oleh selain SUPER ADMIN ditolak keras (403)');

    // 30. Override menyimpan audit trail identitas asli secara utuh
    const auditLogsFile = path.resolve('data/emergency_override_logs.json');
    let auditLogsContent = [];
    if (fs.existsSync(auditLogsFile)) {
      try { auditLogsContent = JSON.parse(fs.readFileSync(auditLogsFile, 'utf8')); } catch(e){}
    }
    const hasLog = auditLogsContent.some(l => l.idPenugasan === redFlagId && l.flag === 'EMERGENCY_OVERRIDE_BY_KING');
    assert(hasLog, 30, 'Override mencatat audit trail identitas asli secara utuh ke emergency_override_logs.json');

    // 31. Override tidak memberikan kemampuan memalsukan tanda tangan profesional
    // Coba KING menandatangani penugasan Deni tanpa izin
    const t31 = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.KING,
      body: { idPenugasan: testIdPenugasan }
    });
    assert(t31.status === 403, 31, 'KING dilarang memalsukan/menandatangani atas nama Penilai Publik (403)');

    // -------------------------------------------------------------------------
    // CATEGORY E: INTEGRITAS DATA & FRONTEND SAFEGUARDS
    // -------------------------------------------------------------------------
    // 32. Dua permintaan nomor bersamaan tidak menghasilkan duplikasi (Concurrency Test)
    const concTestId = `NSR-CONC-${Date.now().toString().slice(-4)}`;
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: {
        idPenugasan: concTestId,
        tujuanPenilaian: 'Laporan Keuangan',
        namaKlien: 'PT Concurrency Test Indonesia',
        jenisObjek: 'Pabrik & Mesin',
        penilaiPublikId: 'deni_penilai',
        penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    // Fast-track ke SIAP_TERBIT_NOLAP
    await request('?action=emergencyOverrideGate', {
      method: 'POST',
      token: TOKENS.KING,
      overrideKey: 'NSR8899',
      body: { idPenugasan: concTestId, targetStatus: 'SIAP_TERBIT_NOLAP', alasanOverride: 'Intervensi pengujian konkurensi alokasi nomor resmi.', reauthKey: 'NSR8899' }
    });

    // Kirim 2 permintaan penerbitan NoLap secara serentak
    const [p1, p2] = await Promise.all([
      request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: concTestId } }),
      request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: concTestId } })
    ]);
    const no1 = p1.data.nomorDefinitif;
    const no2 = p2.data.nomorDefinitif;
    assert(p1.status === 200 && p2.status === 200 && no1 === no2, 32, `Permintaan nomor bersamaan tidak menduplikasi dokumen (Nomor identik: ${no1})`, { p1, p2 });

    // 33. Double-submit tidak menyebabkan dua dokumen (Idempotency)
    const p3 = await request('?action=issueDefinitiveNoLap', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: { idPenugasan: concTestId }
    });
    assert(p3.status === 200 && p3.data.alreadyIssued === true && p3.data.nomorDefinitif === no1, 33, 'Double-submit NoLap mengembalikan dokumen yang sudah ada (Idempotent)', p3);

    // 34. JavaScript mentah tidak muncul pada halaman portal-nolap.html
    const nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');
    // Verifikasi bahwa tidak ada teks raw JS di luar tag script, dan dokumen ditutup dengan benar
    const htmlClean = nolapHtml.trim();
    const endsWithHtml = htmlClean.endsWith('</html>');
    const hasOrphanJsAfterScript = htmlClean.split('</script>').pop().includes('cetakSuratTugas');
    const hasRawJsTail = !endsWithHtml || hasOrphanJsAfterScript;
    assert(!hasRawJsTail, 34, 'Tidak ada potongan JavaScript mentah yang bocor setelah footer pada portal-nolap.html', { hasRawJsTail, snippet: nolapHtml.substring(nolapHtml.length - 200) });

    // 35. Fungsi pencetakan dokumen tersedia dan terpelihara
    const hasPrintFunctions = nolapHtml.includes('function cetakSuratTugas') &&
                              nolapHtml.includes('function cetakLembarKendaliMutu') &&
                              nolapHtml.includes('function cetakTandaTerima') &&
                              nolapHtml.includes('function tampilkanPratinjauCetak');
    assert(hasPrintFunctions, 35, 'Seluruh fungsi pencetakan dokumen resmi terpelihara utuh');

    // 36. Formulir dan dashboard tetap bekerja (Struktur modal lengkap)
    const hasAllModals = nolapHtml.includes('id="modal-submit-gerbang2"') &&
                         nolapHtml.includes('id="modal-review-gerbang2"') &&
                         nolapHtml.includes('id="modal-emergency-override"');
    assert(hasAllModals, 36, 'Seluruh modal alur kerja (Submit, Review, Emergency Override) terpasang sempurna');

    // 37. Pengujian sintaks dan struktur script tag lulus
    const scriptMatches = nolapHtml.match(/<\/?script/g) || [];
    const openTags = scriptMatches.filter(s => s === '<script').length;
    const closeTags = scriptMatches.filter(s => s === '</script').length;
    assert(openTags === closeTags, 37, `Tag script seimbang dan valid (${openTags} open / ${closeTags} close)`);

    // 38. Tanda Tangan Sah Penilai Publik berfungsi pada akhir alur
    const t38 = await request('?action=signLaporanPenilaiPublik', {
      method: 'POST',
      token: TOKENS.DUS_PENILAI,
      body: { idPenugasan: testIdPenugasan, metodeTandaTangan: 'DIGITAL_VERIFIED' }
    });
    assert(t38.status === 200 && t38.data.statusAkhir === 'LAPORAN_FINAL', 38, 'Penilai Publik penanggung jawab sah sukses menandatangani laporan (LAPORAN_FINAL)');

  } finally {
    // Restore original DB
    if (fs.existsSync(backupDb)) {
      fs.copyFileSync(backupDb, dbFile);
      fs.unlinkSync(backupDb);
    }
    php.kill();
  }

  console.log(`\n================================================================`);
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log(`================================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runMasterTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
