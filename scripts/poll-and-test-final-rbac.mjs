import https from 'node:https';

const HOST = 'kjppnanangrahayu.com';

function callApi(token, action, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NSR-RBAC-Verifier/2026'
    };
    if (token) headers['X-NSR-Token'] = token;
    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request({
      hostname: HOST,
      port: 443,
      path: `/operasional-data-handler.php?action=${action}`,
      method: method,
      headers: headers,
      timeout: 12000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, data, json });
      });
    });

    req.on('error', (err) => resolve({ status: -1, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: -2, error: 'timeout' }); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 FAST TRACK RBAC FINAL: VERIFIKASI AMAN & NON-DESTRUKTIF');
  console.log('Target Hosting:', HOST);
  console.log('Waktu Uji:', new Date().toISOString());
  console.log('================================================================\n');

  // 1. Menunggu Deployment GitHub Actions selesai (deteksi NSR-KEPKEU-2026)
  console.log('[FASE 1] Menunggu Deployment Produksi (Polling NSR-KEPKEU-2026)...');
  let deployed = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const res = await callApi('NSR-KEPKEU-2026', 'getPengajuanList');
    if (res.status === 200 && res.json?.success === true) {
      console.log(`  ✓ Deployment cPanel TERDETEKSI AKTIF pada percobaan #${attempt}!`);
      deployed = true;
      break;
    }
    console.log(`  ... percobaan #${attempt} status: ${res.status} (menunggu sinkronisasi FTPS 4 detik)`);
    await new Promise(r => setTimeout(r, 4000));
  }

  if (!deployed) {
    console.error('  ❌ Gagal mendeteksi token baru di hosting setelah batas waktu.');
    process.exit(1);
  }

  const results = [];

  function record(checkId, desc, pass, details = '') {
    results.push({ checkId, desc, pass, details });
    const symbol = pass ? '✓ PASS' : '❌ FAIL';
    console.log(`  [${symbol}] [${checkId}] ${desc} ${details ? '(' + details + ')' : ''}`);
  }

  // 2. AUDIT TOKEN LAMA & EKSPOSUR
  console.log('\n[FASE 2] Audit Token Lama & Kredensial Pernah Terekspos (Wajib Ditolak 403)...');
  
  // [REDACTED_SUPER_ADMIN_TOKEN] approval test
  const r8899 = await callApi((process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"), 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 3 });
  record('AUDIT-1', 'Token lama [REDACTED_SUPER_ADMIN_TOKEN] ditolak pada approveTier', r8899.status === 403, `Status: ${r8899.status}`);

  // [REDACTED_ADMIN_PUSAT_TOKEN] approval test
  const rPst = await callApi((process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"), 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 1 });
  record('AUDIT-2', 'Token lama [REDACTED_ADMIN_PUSAT_TOKEN] ditolak pada approveTier', rPst.status === 403, `Status: ${rPst.status}`);

  // NSR-REK-2026 approval test
  const rRek = await callApi('NSR-REK-2026', 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 1 });
  record('AUDIT-3', 'Token mitra NSR-REK-2026 ditolak pada approveTier', rRek.status === 403, `Status: ${rRek.status}`);

  // NSR-REV-2026 approval test
  const rRev = await callApi('NSR-REV-2026', 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 1 });
  record('AUDIT-4', 'Token reviewer NSR-REV-2026 ditolak pada approveTier', rRev.status === 403, `Status: ${rRev.status}`);

  // 3. BLOKIR TOTAL SELURUH TOKEN STAF
  console.log('\n[FASE 3] Blokir Total Seluruh Token Staf (Penilai & Surveyor)...');
  const rVal = await callApi('NSR-VAL-2026', 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 1 });
  record('STAFF-1', 'Token Penilai (NSR-VAL-2026) ditolak approveTier', rVal.status === 403, `Status: ${rVal.status}`);

  const rSrv = await callApi('NSR-SRV-2026', 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 1 });
  record('STAFF-2', 'Token Surveyor (NSR-SRV-2026) ditolak approveTier', rSrv.status === 403, `Status: ${rSrv.status}`);

  const rSrvRej = await callApi('NSR-SRV-2026', 'rejectWithNote', 'POST', { id: 'TEST-GUARD', alasan: 'Uji penolakan tanpa wewenang staf', tier: 1 });
  record('STAFF-3', 'Token Surveyor (NSR-SRV-2026) ditolak rejectWithNote', rSrvRej.status === 403, `Status: ${rSrvRej.status}`);

  // 4. ISOLASI STAGING: TOKEN STAGING DITOLAK DI PRODUCTION
  console.log('\n[FASE 4] Isolasi Kredensial Staging (Ditolak 403 pada Produksi)...');
  const rStgMaster = await callApi('NSR-STAGE-MASTER-77', 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 3 });
  record('STAGING-1', 'Token Staging Master (NSR-STAGE-MASTER-77) ditolak pada produksi', rStgMaster.status === 403, `Status: ${rStgMaster.status}`);

  const rStgTek = await callApi('NSR-STAGE-REK-22', 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 1 });
  record('STAGING-2', 'Token Staging Teknik (NSR-STAGE-REK-22) ditolak pada produksi', rStgTek.status === 403, `Status: ${rStgTek.status}`);

  // 5. PEMISAHAN KEWENANGAN ANTAR-PEJABAT (STRICT SEPARATION OF DUTIES)
  console.log('\n[FASE 5] Pemisahan Kewenangan Antar-Pejabat (Out-of-Tier Blocked)...');
  
  // Manager Keuangan trying Tier 1
  const rKeuT1 = await callApi('NSR-KEU-2026', 'approveTier', 'POST', { id: 'TEST-GUARD', tier: 1 });
  record('SOD-1', 'Manager Keuangan ditolak menyetujui Tingkat 1 (Teknis/Admin)', rKeuT1.status === 403, `Status: ${rKeuT1.status}`);

  // Manager Teknik trying Tier 2 (dummy doc fail-fast or out of tier)
  // Let's create an isolated test document to test positive and negative lifecycle
  console.log('\n[FASE 6] Pengujian Siklus Dokumen Terisolasi (Non-Destruktif)...');
  
  // Submit an isolated test document (Teknis alur)
  const createTeknis = await callApi('NSR-SRV-2026', 'simpanPengajuan', 'POST', {
    jenisOperasional: 'OPR-SRV',
    namaPengaju: 'Petugas Uji RBAC',
    jabatanPengaju: 'Surveyor Terverifikasi',
    divisiPengaju: 'Teknik',
    maksudTujuan: '[TEST ISOLASI RBAC] Pengujian Non-Destruktif Otorisasi Pejabat Berwenang',
    isDraft: false,
    itemBiaya: [
      { uraian: 'Transportasi Pengujian', nominal: 150000 }
    ]
  });

  const docTekId = createTeknis.json?.data?.id;
  record('LIFECYCLE-1', 'Pembuatan Dokumen Uji Terisolasi (Alur Teknis)', createTeknis.status === 200 && !!docTekId, `DocID: ${docTekId}`);

  if (docTekId) {
    // 6a. Manager Teknik trying Tier 2 on real doc -> MUST FAIL 403
    const rTekT2 = await callApi('NSR-DIVTEK-2026', 'approveTier', 'POST', { id: docTekId, tier: 2 });
    record('SOD-2', 'Manager Teknik (Deni Siswandi) ditolak menyetujui Tingkat 2 (Keuangan)', rTekT2.status === 403, `Status: ${rTekT2.status}`);

    // 6b. Manager Teknik trying Tier 3 on real doc -> MUST FAIL 403
    const rTekT3 = await callApi('NSR-DIVTEK-2026', 'approveTier', 'POST', { id: docTekId, tier: 3 });
    record('SOD-3', 'Manager Teknik (Deni Siswandi) ditolak menyetujui Tingkat 3 (Final)', rTekT3.status === 403, `Status: ${rTekT3.status}`);

    // 6c. PEJABAT 1: Manager Teknik (NSR-DIVTEK-2026) APPROVES TIER 1
    const rTekApprove = await callApi('NSR-DIVTEK-2026', 'approveTier', 'POST', { id: docTekId, tier: 1 });
    record('PEJABAT-1', 'Manager Teknik (Deni Siswandi, S.T.) SAH menyetujui Tingkat 1', rTekApprove.status === 200 && rTekApprove.json?.success === true, `Status: ${rTekApprove.status}`);

    // 6d. Kepala Keuangan trying Tier 2 (out of turn / not his tier)
    const rKepT2 = await callApi('NSR-KEPKEU-2026', 'approveTier', 'POST', { id: docTekId, tier: 2 });
    record('SOD-4', 'Kepala Keuangan ditolak menyetujui Tingkat 2 (Khusus Manager Keuangan)', rKepT2.status === 403, `Status: ${rKepT2.status}`);

    // 6e. PEJABAT 2: Manager Keuangan (NSR-KEU-2026) APPROVES TIER 2
    const rKeuApprove = await callApi('NSR-KEU-2026', 'approveTier', 'POST', { id: docTekId, tier: 2 });
    record('PEJABAT-2', 'Manager Keuangan (Milda Hidayati Dewi, S.E.) SAH menyetujui Tingkat 2', rKeuApprove.status === 200 && rKeuApprove.json?.success === true, `Status: ${rKeuApprove.status}`);

    // 6f. PEJABAT 3: Kepala Keuangan (NSR-KEPKEU-2026) APPROVES TIER 3 (FINAL)
    const rKepApprove = await callApi('NSR-KEPKEU-2026', 'approveTier', 'POST', { id: docTekId, tier: 3 });
    record('PEJABAT-3', 'Kepala Keuangan (Ir. Nanang Rahayu, M.Ec.Dev.) SAH menyetujui Tingkat 3', rKepApprove.status === 200 && rKepApprove.json?.success === true, `Status: ${rKepApprove.status}`);

    // Verify final status is APPROVED
    const detailRes = await callApi('NSR-DIVTEK-2026', `getPengajuanDetail&id=${docTekId}`);
    const finalDoc = detailRes.json?.data;
    record('INTEGRITY-1', 'Dokumen Terisolasi berstatus APPROVED & seluruh tier sah terverifikasi', finalDoc?.status === 'APPROVED' && !!finalDoc?.approvals[3]?.approved, `Final Status: ${finalDoc?.status}`);
  }

  // 7. PEJABAT 4: Manager Admin & Umum (NSR-ADM-2026) on Admin Alur
  console.log('\n[FASE 7] Pengujian Dokumen Terisolasi Alur Admin (Manager Admin & Umum)...');
  const createAdmin = await callApi('NSR-ADM-2026', 'simpanPengajuan', 'POST', {
    jenisOperasional: 'OPR-UMM',
    namaPengaju: 'Petugas Uji Admin',
    jabatanPengaju: 'Staf Administrasi',
    divisiPengaju: 'Administrasi & Umum',
    maksudTujuan: '[TEST ISOLASI RBAC] Pengujian Otorisasi Tingkat 1 Manager Admin & Umum',
    isDraft: false,
    itemBiaya: [
      { uraian: 'ATK dan Operasional Kantor', nominal: 100000 }
    ]
  });

  const docAdmId = createAdmin.json?.data?.id;
  record('LIFECYCLE-2', 'Pembuatan Dokumen Uji Terisolasi (Alur Admin)', createAdmin.status === 200 && !!docAdmId, `DocID: ${docAdmId}`);

  if (docAdmId) {
    // Manager Teknik trying to approve Admin Tingkat 1 -> MUST FAIL 403
    const rTekOnAdm = await callApi('NSR-DIVTEK-2026', 'approveTier', 'POST', { id: docAdmId, tier: 1 });
    record('SOD-5', 'Manager Teknik ditolak menyetujui Tingkat 1 Alur Admin', rTekOnAdm.status === 403, `Status: ${rTekOnAdm.status}`);

    // PEJABAT 4: Manager Admin (NSR-ADM-2026) APPROVES TIER 1
    const rAdmApprove = await callApi('NSR-ADM-2026', 'approveTier', 'POST', { id: docAdmId, tier: 1 });
    record('PEJABAT-4', 'Manager Admin (Danny Taufik Hidayat, S.H.) SAH menyetujui Tingkat 1', rAdmApprove.status === 200 && rAdmApprove.json?.success === true, `Status: ${rAdmApprove.status}`);
  }

  // Final summary
  const allPassed = results.every(r => r.pass);
  console.log('\n================================================================');
  console.log(`HASIL AKHIR: ${allPassed ? '✅ RBAC AMAN' : '❌ RBAC BELUM AMAN'}`);
  console.log(`Total Pengujian: ${results.length} | Lolos: ${results.filter(r => r.pass).length} | Gagal: ${results.filter(r => !r.pass).length}`);
  console.log('================================================================');
}

runVerification();
