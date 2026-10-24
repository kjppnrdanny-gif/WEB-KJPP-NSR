/**
 * Focused Verification Suite: SPM & DIVTEK Authentication, RBAC Isolation, and Workflow
 * Tests:
 * 1. SPM Login (POST /api/auth-login)
 * 2. DIVTEK Login (POST /api/auth-login)
 * 3. SPM Review (reviewDannyGerbang1 & reviewDannyGerbang2)
 * 4. DIVTEK Approval (reviewDeniGerbang1 & reviewDeniGerbang2)
 * 5. RBAC Isolation (SPM rejected from publishing LP/NoLap, DIVTEK rejected from signing report)
 * 6. Logout & Session Revocation
 */

import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = 8898;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const DANNY_TOKEN = 'NSR-SPM-DANNY-2026';
const DENI_TOKEN = 'NSR-DIVTEK-DENI-2026';
const ADMIN_PUSAT_TOKEN = 'NSR-ADMIN-PUSAT-2026';
const ADMIN_BDG_TOKEN = 'NSR-ADMIN-BDG-2026';
const DENI_PENILAI_TOKEN = 'NSR-PENILAI-DENI-2026';
const BRANCH_SURVEYOR_TOKEN = 'NSR-SURVEYOR-BDG-2026';
const PUSAT_SURVEYOR_TOKEN = 'NSR-SRV-2026';

function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = { raw: data }; }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runFocusedSuite() {
  console.log('================================================================');
  console.log('STARTING SPM & DIVTEK FAST TRACK RESTORATION & RBAC TEST SUITE');
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

  // 1. SPM LOGIN TEST
  console.log('[1/6] Menguji Autentikasi Login Kepala SPM...');
  const spmRes = await request('/auth-handler.php?action=login', {
    method: 'POST',
    body: { token: DANNY_TOKEN }
  });
  const spmCookie = spmRes.headers['set-cookie'] ? spmRes.headers['set-cookie'][0].split(';')[0] : '';
  const spmUser = spmRes.data?.user;
  const spmSessionToken = spmRes.data?.user?.sessionToken || spmRes.headers['set-cookie'];

  assert(spmRes.status === 200 && spmRes.data?.authenticated === true, 'SPM LOGIN: HTTP 200 & Authenticated');
  assert(spmUser?.role === 'KEPALA_SPM', 'SPM ROLE: Role adalah KEPALA_SPM');
  assert(spmUser?.sub === 'danny_spm', 'SPM SUB: Identity sub adalah danny_spm');
  assert(Array.isArray(spmUser?.permissions) && spmUser.permissions.includes('spm.review'), 'SPM PERMISSION: Memiliki kewenangan spm.review');
  assert(!spmUser?.isSuperAdmin && !spmUser?.isKing && spmUser?.role !== 'ADMIN_PUSAT', 'SPM ISOLATION: Tidak memiliki hak Super Admin / King / Admin Pusat');

  // 2. DIVTEK LOGIN TEST
  console.log('\n[2/6] Menguji Autentikasi Login Kepala DIVTEK...');
  const divtekRes = await request('/auth-handler.php?action=login', {
    method: 'POST',
    body: { token: DENI_TOKEN }
  });
  const divtekCookie = divtekRes.headers['set-cookie'] ? divtekRes.headers['set-cookie'][0].split(';')[0] : '';
  const divtekUser = divtekRes.data?.user;

  assert(divtekRes.status === 200 && divtekRes.data?.authenticated === true, 'DIVTEK LOGIN: HTTP 200 & Authenticated');
  assert(divtekUser?.role === 'KEPALA_DIVTEK', 'DIVTEK ROLE: Role adalah KEPALA_DIVTEK');
  assert(Array.isArray(divtekUser?.permissions) && divtekUser.permissions.includes('APPROVE_TEKNIK'), 'DIVTEK PERMISSION: Memiliki kewenangan APPROVE_TEKNIK');
  assert(!divtekUser?.isSuperAdmin && !divtekUser?.isKing && divtekUser?.role !== 'ADMIN_PUSAT', 'DIVTEK ISOLATION: Tidak memiliki hak Super Admin / King / Admin Pusat');

  // 3. WORKFLOW TEST: INTAKE & REVIEW GERBANG 1
  console.log('\n[3/6] Menguji Alur Kerja & Review Gerbang 1...');
  const testId = `NSR-TEST-FT-${Date.now().toString().slice(-4)}`;
  const submitG1 = await request('/nolap-data-handler.php?action=submitGerbang1Awal', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN },
    body: {
      idPenugasan: testId,
      kodeIndustri: '07',
      npwp: '01.234.567.8-901.000',
      statusNpwp: 'VALID_NPWP',
      tujuanPenilaian: 'Agunan Perbankan',
      namaKlien: 'PT Bank Mandiri UAT Fast Track',
      jenisObjek: 'Gedung Kantor 4 Lantai',
      penilaiPublikId: 'deni_penilai',
      penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI',
      nama_pengaju: 'Staf Cabang Bandung',
      email_pengaju: 'staf.bdg@kjppnanangrahayu.com',
      wa_pengaju: '081234567890',
      checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
    }
  });
  assert(submitG1.status === 200 && submitG1.data?.status === 'MENUNGGU_SPM_AWAL', `Submit Gerbang 1 berhasil didaftarkan -> status: ${submitG1.data?.status}`);

  // Divtek tidak boleh review sebelum SPM
  const divtekPreReview = await request('/nolap-data-handler.php?action=reviewDeniGerbang1', {
    method: 'POST',
    headers: { 'X-NSR-Token': DENI_TOKEN },
    body: { idPenugasan: testId, keputusan: 'SETUJU', catatan: 'Mencoba review sebelum Danny' }
  });
  assert(divtekPreReview.status === 403 && divtekPreReview.data?.violation === 'OUT_OF_ORDER_APPROVAL_ATTEMPT', 'Workflow Guard: Divtek ditolak review sebelum SPM (403)');

  // SPM Review Gerbang 1
  const spmReviewG1 = await request('/nolap-data-handler.php?action=reviewDannyGerbang1', {
    method: 'POST',
    headers: { 'X-NSR-Token': DANNY_TOKEN },
    body: { idPenugasan: testId, keputusan: 'SETUJU', catatan: 'Verifikasi independensi dan ketiadaan konflik selesai.' }
  });
  assert(spmReviewG1.status === 200 && spmReviewG1.data?.newStatus === 'MENUNGGU_DIVTEK_AWAL', `SPM REVIEW: Gerbang 1 berhasil disetujui -> newStatus: ${spmReviewG1.data?.newStatus}`);

  // DIVTEK Approval Gerbang 1
  const divtekReviewG1 = await request('/nolap-data-handler.php?action=reviewDeniGerbang1', {
    method: 'POST',
    headers: { 'X-NSR-Token': DENI_TOKEN },
    body: { idPenugasan: testId, keputusan: 'SETUJU', catatan: 'Metodologi dan kelengkapan data pasar disetujui.' }
  });
  assert(divtekReviewG1.status === 200 && divtekReviewG1.data?.newStatus === 'SIAP_TERBIT_LP', `DIVTEK APPROVAL: Gerbang 1 berhasil disetujui -> newStatus: ${divtekReviewG1.data?.newStatus}`);

  // Admin Pusat terbitkan LP
  const lpRes = await request('/nolap-data-handler.php?action=publishOfficialLP', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_PUSAT_TOKEN },
    body: { idPenugasan: testId, nomorLpResmi: `04${Date.now().toString().slice(-2)}/2.0160-00/LP/X/2026` }
  });
  assert(lpRes.status === 200 && lpRes.data?.status === 'LP_DITERBITKAN', 'Penerbitan LP Resmi oleh Admin Pusat');

  // Submit Gerbang 2
  const submitG2 = await request('/nolap-data-handler.php?action=submitGerbang2Akhir', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN },
    body: {
      idPenugasan: testId,
      drafLaporanUrl: 'https://drive.google.com/draf_laporan_test.pdf',
      baiUrl: 'https://drive.google.com/bai_test.pdf',
      checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
      deltaAnalysis: { deviasiMaterialTanpaJustifikasi: false, keterangan: 'Luas fisik sesuai yuridis.' }
    }
  });
  assert(submitG2.status === 200 && submitG2.data?.status === 'MENUNGGU_SPM_AKHIR', `Submit Gerbang 2 berhasil didaftarkan -> status: ${submitG2.data?.status}`);

  // SPM Review Gerbang 2
  const spmReviewG2 = await request('/nolap-data-handler.php?action=reviewDannyGerbang2', {
    method: 'POST',
    headers: { 'X-NSR-Token': DANNY_TOKEN },
    body: { idPenugasan: testId, keputusan: 'SETUJU', catatan: 'QC draf laporan dan kelengkapan lampiran telah diperiksa memadai.' }
  });
  assert(spmReviewG2.status === 200 && spmReviewG2.data?.newStatus === 'MENUNGGU_DIVTEK_AKHIR', `SPM REVIEW: Gerbang 2 berhasil disetujui -> newStatus: ${spmReviewG2.data?.newStatus}`);

  // DIVTEK Approval Gerbang 2
  const divtekReviewG2 = await request('/nolap-data-handler.php?action=reviewDeniGerbang2', {
    method: 'POST',
    headers: { 'X-NSR-Token': DENI_TOKEN },
    body: { idPenugasan: testId, keputusan: 'SETUJU', catatan: 'Kalkulasi nilai pasar telah diverifikasi akurat dan sesuai SPI 2024.' }
  });
  assert(divtekReviewG2.status === 200 && divtekReviewG2.data?.newStatus === 'SIAP_TERBIT_NOLAP', `DIVTEK APPROVAL: Gerbang 2 berhasil disetujui -> newStatus: ${divtekReviewG2.data?.newStatus}`);

  // 4. RBAC ISOLATION TEST
  console.log('\n[4/6] Menguji Isolasi RBAC Ketat (Pemisahan Tugas)...');
  // SPM dilarang terbitkan LP
  const spmLpAttempt = await request('/nolap-data-handler.php?action=publishOfficialLP', {
    method: 'POST',
    headers: { 'X-NSR-Token': DANNY_TOKEN },
    body: { idPenugasan: testId, nomorLpResmi: 'ILLEGAL-LP' }
  });
  assert(spmLpAttempt.status === 403, 'RBAC ISOLATION: SPM dilarang keras menerbitkan nomor LP resmi (403)');

  // SPM dilarang terbitkan NoLap
  const spmNolapAttempt = await request('/nolap-data-handler.php?action=issueDefinitiveNoLap', {
    method: 'POST',
    headers: { 'X-NSR-Token': DANNY_TOKEN },
    body: { idPenugasan: testId }
  });
  assert(spmNolapAttempt.status === 403, 'RBAC ISOLATION: SPM dilarang keras menerbitkan NoLap definitif (403)');

  // DIVTEK dilarang terbitkan NoLap
  const divtekNolapAttempt = await request('/nolap-data-handler.php?action=issueDefinitiveNoLap', {
    method: 'POST',
    headers: { 'X-NSR-Token': DENI_TOKEN },
    body: { idPenugasan: testId }
  });
  assert(divtekNolapAttempt.status === 403, 'RBAC ISOLATION: DIVTEK dilarang keras menerbitkan NoLap definitif (403)');

  // Admin Pusat yang sah terbitkan NoLap
  const issueNoLap = await request('/nolap-data-handler.php?action=issueDefinitiveNoLap', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_PUSAT_TOKEN },
    body: { idPenugasan: testId }
  });
  assert(issueNoLap.status === 200 && issueNoLap.data?.nomorDefinitif, `Admin Pusat terbitkan NoLap definitif sah: ${issueNoLap.data?.nomorDefinitif}`);

  // Token DIVTEK Deni dilarang menandatangani laporan sebagai Penilai Publik
  const divtekSignAttempt = await request('/nolap-data-handler.php?action=signLaporanPenilaiPublik', {
    method: 'POST',
    headers: { 'X-NSR-Token': DENI_TOKEN },
    body: { idPenugasan: testId }
  });
  assert(divtekSignAttempt.status === 403, 'RBAC ISOLATION: Token DIVTEK Deni dilarang menandatangani laporan sebagai Penilai Publik (403)');

  // Token SPM Danny dilarang menandatangani laporan sebagai Penilai Publik
  const spmSignAttempt = await request('/nolap-data-handler.php?action=signLaporanPenilaiPublik', {
    method: 'POST',
    headers: { 'X-NSR-Token': DANNY_TOKEN },
    body: { idPenugasan: testId }
  });
  assert(spmSignAttempt.status === 403, 'RBAC ISOLATION: Token SPM Danny dilarang menandatangani laporan sebagai Penilai Publik (403)');

  // Penilai Publik yang sah menandatangani laporan
  const penilaiSign = await request('/nolap-data-handler.php?action=signLaporanPenilaiPublik', {
    method: 'POST',
    headers: { 'X-NSR-Token': DENI_PENILAI_TOKEN },
    body: { idPenugasan: testId, metodeTandaTangan: 'DIGITAL_VERIFIED' }
  });
  assert(penilaiSign.status === 200 && penilaiSign.data?.statusAkhir === 'LAPORAN_FINAL', `Penilai Publik Sah menandatangani laporan -> status: ${penilaiSign.data?.statusAkhir}`);

  // 5. SESI REVOKED & LOGOUT TEST
  console.log('\n[5/6] Menguji Logout & Pencabutan Sesi Server-Side...');
  const logoutRes = await request('/auth-handler.php?action=logout', {
    method: 'POST',
    headers: { 'Cookie': spmCookie }
  });
  assert(logoutRes.status === 200 && logoutRes.data?.success === true, 'SPM LOGOUT: Pencabutan sesi berhasil (HTTP 200)');

  // Verifikasi sesi setelah dicabut
  const verifyAfterLogout = await request('/auth-handler.php?action=verify', {
    method: 'GET',
    headers: { 'Cookie': spmCookie }
  });
  assert(verifyAfterLogout.status === 401 && verifyAfterLogout.data?.authenticated === false, 'POST-LOGOUT VERIFY: Sesi yang telah dicabut ditolak (401)');

  // 6. INTEGRATED SMART GATEWAY & RBAC PENGAJUAN NOLAP TEST
  console.log('\n[6/6] Menguji Arsitektur Integrated Smart Gateway & Pengetatan RBAC NoLap...');

  // TEST 1: Branch non-admin submission rejected (HTTP 403, BRANCH_NON_ADMIN_FORBIDDEN)
  const branchNonAdminRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': BRANCH_SURVEYOR_TOKEN },
    body: {
      origin_branch_id: 'Bandung',
      namaKlien: 'PT Mitra Sukses Bandung',
      kodeIndustri: '07',
      namaPemohon: 'Ahmad Surveyor BDG',
      emailPemohon: 'ahmad.surveyor@kjppnanangrahayu.com',
      waPemohon: '081299887766',
      modePengajuan: 'REGULER',
      linkLaporan: 'https://drive.google.com/test_lap.pdf',
      linkPembanding: 'https://drive.google.com/test_pem.xlsx',
      linkBai: 'https://drive.google.com/test_bai.pdf',
      smart_mitigasi: { pembandingValid: true, bebasKonflik: true, bebasSengketa: true, deltaAnalysisFisikYuridis: true }
    }
  });
  assert(branchNonAdminRes.status === 403 && branchNonAdminRes.data?.violation === 'BRANCH_NON_ADMIN_FORBIDDEN', 
    'RBAC Guard Cabang: Pengajuan dari staf cabang non-admin ditolak mutlak (HTTP 403, BRANCH_NON_ADMIN_FORBIDDEN)');

  // TEST 2: Booking NoLap with empty links + complete mitigation -> PASS (200 OK, status: BOOKING DIAJUKAN, queued for SPM)
  const bookingValidRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN },
    body: {
      origin_branch_id: 'Bandung',
      namaKlien: 'PT BUMN Infrastruktur Mandiri',
      kodeIndustri: '03',
      namaPemohon: 'Staf Admin Cabang Bandung',
      emailPemohon: 'admin.bdg@kjppnanangrahayu.com',
      waPemohon: '081234567890',
      isBooking: true,
      modePengajuan: 'BOOKING',
      linkLaporan: '',
      linkPembanding: '',
      linkBai: '',
      smart_mitigasi: {
        pembandingValid: true,
        bebasKonflik: true,
        bebasSengketa: true,
        deltaAnalysisFisikYuridis: true,
        keterangan: 'Data pembanding dalam proses kompilasi menjelang BAST termin 100%'
      }
    }
  });
  assert(bookingValidRes.status === 200 && bookingValidRes.data?.success === true && bookingValidRes.data?.record?.status === 'BOOKING DIAJUKAN', 
    'Booking NoLap: 3 link kosong + mitigasi lengkap -> PASS (HTTP 200, Status: BOOKING DIAJUKAN)');

  // TEST 3: Booking NoLap with empty mitigation -> REJECT / Validation Error (HTTP 422, MISSING_SMART_MITIGATION_PAYLOAD)
  const bookingEmptyMitigasiRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN },
    body: {
      origin_branch_id: 'Bandung',
      namaKlien: 'PT BUMN Infrastruktur Mandiri',
      kodeIndustri: '03',
      namaPemohon: 'Staf Admin Cabang Bandung',
      emailPemohon: 'admin.bdg@kjppnanangrahayu.com',
      waPemohon: '081234567890',
      isBooking: true,
      modePengajuan: 'BOOKING',
      linkLaporan: '',
      linkPembanding: '',
      linkBai: '',
      smart_mitigasi: []
    }
  });
  assert(bookingEmptyMitigasiRes.status === 422 && bookingEmptyMitigasiRes.data?.violation === 'MISSING_SMART_MITIGATION_PAYLOAD', 
    'Booking NoLap: Mitigasi kosong ditolak mutlak (HTTP 422, MISSING_SMART_MITIGATION_PAYLOAD)');

  // TEST 4: Reguler NoLap with empty links -> REJECT / Validation Error (HTTP 422, MISSING_MANDATORY_DOCUMENT_LINKS)
  const regulerEmptyLinksRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN },
    body: {
      origin_branch_id: 'Bandung',
      namaKlien: 'PT Bank Central Asia Cabang Bandung',
      kodeIndustri: '07',
      namaPemohon: 'Staf Admin Cabang Bandung',
      emailPemohon: 'admin.bdg@kjppnanangrahayu.com',
      waPemohon: '081234567890',
      isBooking: false,
      modePengajuan: 'REGULER',
      linkLaporan: '',
      linkPembanding: '',
      linkBai: '',
      smart_mitigasi: {
        pembandingValid: true,
        bebasKonflik: true,
        bebasSengketa: true,
        deltaAnalysisFisikYuridis: true
      }
    }
  });
  assert(regulerEmptyLinksRes.status === 422 && regulerEmptyLinksRes.data?.violation === 'MISSING_MANDATORY_DOCUMENT_LINKS', 
    'Reguler NoLap: Tautan berkas kosong ditolak mutlak (HTTP 422, MISSING_MANDATORY_DOCUMENT_LINKS)');

  // TEST 5: Reguler NoLap with complete links + complete mitigation -> PASS (200 OK, queued for SPM / MENUNGGU_SPM_AKHIR)
  const regulerValidRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN },
    body: {
      origin_branch_id: 'Bandung',
      namaKlien: 'PT Bank Central Asia Cabang Bandung',
      kodeIndustri: '07',
      namaPemohon: 'Staf Admin Cabang Bandung',
      emailPemohon: 'admin.bdg@kjppnanangrahayu.com',
      waPemohon: '081234567890',
      isBooking: false,
      modePengajuan: 'REGULER',
      linkLaporan: 'https://drive.google.com/draf_laporan_lengkap.pdf',
      linkPembanding: 'https://drive.google.com/data_pembanding_valid.xlsx',
      linkBai: 'https://drive.google.com/bai_lengkap.pdf',
      smart_mitigasi: {
        pembandingValid: true,
        min3Pembanding: true,
        bebasKonflik: true,
        bebasSengketa: true,
        deltaAnalysisFisikYuridis: true,
        deltaAnalysis: { luasYuridis: 500, luasFisik: 500, keterangan: 'Luas fisik sesuai yuridis.' }
      }
    }
  });
  assert(regulerValidRes.status === 200 && regulerValidRes.data?.success === true && regulerValidRes.data?.record?.status === 'MENUNGGU_SPM_AKHIR', 
    'Reguler NoLap: Berkas lengkap + mitigasi valid -> PASS (HTTP 200, Status: MENUNGGU_SPM_AKHIR)');

  // TEST 6: Central functional staff (Surveyor Pusat) submission -> routed directly to SPM (No Admin Intercept)
  const pusatSurveyorRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': PUSAT_SURVEYOR_TOKEN },
    body: {
      origin_branch_id: 'Pusat',
      namaKlien: 'PT Korporasi Niaga Jakarta',
      kodeIndustri: '05',
      namaPemohon: 'Budi Surveyor Pusat',
      emailPemohon: 'budi.surveyor@kjppnanangrahayu.com',
      waPemohon: '081211223344',
      isBooking: false,
      modePengajuan: 'REGULER',
      linkLaporan: 'https://drive.google.com/lap_jkt.pdf',
      linkPembanding: 'https://drive.google.com/pem_jkt.xlsx',
      linkBai: 'https://drive.google.com/bai_jkt.pdf',
      smart_mitigasi: {
        pembandingValid: true,
        bebasKonflik: true,
        bebasSengketa: true,
        deltaAnalysisFisikYuridis: true
      }
    }
  });
  assert(pusatSurveyorRes.status === 200 && pusatSurveyorRes.data?.record?.status === 'MENUNGGU_SPM_AKHIR', 
    'Staf Pusat Fungsional: Pengajuan NoLap langsung ke antrean telaah Kepala SPM tanpa intersep admin (Status: MENUNGGU_SPM_AKHIR)');

  // TEST 7: Simpan Draf Terpadu (isDraft: true) -> PASS (200 OK, Status: DRAFT, bypass strict links/mitigasi checks)
  const draftRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN },
    body: {
      origin_branch_id: 'Bandung',
      namaKlien: 'PT Progres Draft Konstruksi',
      kodeIndustri: '03',
      namaPemohon: 'Staf Admin Cabang Bandung',
      emailPemohon: 'admin.bdg@kjppnanangrahayu.com',
      waPemohon: '081234567890',
      isDraft: true,
      modePengajuan: 'DRAFT',
      linkLaporan: '',
      linkPembanding: '',
      linkBai: '',
      smart_mitigasi: []
    }
  });
  assert(draftRes.status === 200 && draftRes.data?.success === true && draftRes.data?.record?.status === 'DRAFT',
    'Simpan Draf Terpadu: Simpan progres awal berhasil tanpa blokir berkas/mitigasi (HTTP 200, Status: DRAFT)');

  // TEST 8: Generator Dokumen Ganda (Dual Output: TANDA_TERIMA & QA_CHECKLIST)
  const targetReqId = regulerValidRes.data?.record?.noPermintaan || regulerValidRes.data?.record?.idPenugasan;
  const tandaTerimaRes = await request(`/nolap-data-handler.php?action=renderDocumentTemplate&templateName=TANDA_TERIMA&noReq=${encodeURIComponent(targetReqId)}`, {
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN }
  });
  assert(tandaTerimaRes.status === 200 && tandaTerimaRes.data?.success === true && typeof tandaTerimaRes.data?.html === 'string' && tandaTerimaRes.data.html.length > 100,
    'Dual Output 1: Lembar Registrasi & Tanda Terima NoLap Resmi berhasil di-render (HTTP 200, HTML Content Valid)');

  const qaChecklistRes = await request(`/nolap-data-handler.php?action=renderDocumentTemplate&templateName=QA_CHECKLIST&noReq=${encodeURIComponent(targetReqId)}`, {
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN }
  });
  assert(qaChecklistRes.status === 200 && qaChecklistRes.data?.success === true && typeof qaChecklistRes.data?.html === 'string' && qaChecklistRes.data.html.length > 100,
    'Dual Output 2: Lembar Kertas Kerja Mitigasi SPM Sah Format Cetak A4 berhasil di-render (HTTP 200, HTML Content Valid)');

  console.log(`\n================================================================`);
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Start PHP Server & Run
const phpProcess = spawn('php', ['-S', `127.0.0.1:${PORT}`], { stdio: 'inherit' });
setTimeout(async () => {
  try {
    await runFocusedSuite();
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    phpProcess.kill();
    process.exit(0);
  }
}, 1500);
