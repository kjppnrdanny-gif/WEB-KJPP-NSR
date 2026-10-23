/**
 * KJPP NSR — Production Live Verification Suite
 * Verifikasi Langsung Integritas Data, Kontrol Revisi, Backup, dan Keamanan Produksi
 * Target: https://kjppnanangrahayu.com/
 */

const BASE_URL = 'https://kjppnanangrahayu.com';
const results = [];

function recordTest(id, name, status, details = '') {
  results.push({ id, name, status, details });
  const icon = status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} [${id}] ${name}: ${status}`);
  if (details) console.log(`   └─ ${details}`);
}

class DeviceClient {
  constructor(name) {
    this.name = name;
    this.cookies = new Map();
  }

  getCookieHeader() {
    const list = [];
    for (const [k, v] of this.cookies.entries()) {
      list.push(`${k}=${v}`);
    }
    return list.join('; ');
  }

  saveCookies(res) {
    const rawHeaders = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (!rawHeaders || rawHeaders.length === 0) {
      const single = res.headers.get('set-cookie');
      if (single) rawHeaders.push(single);
    }
    for (const c of rawHeaders) {
      const parts = c.split(';')[0].split('=');
      if (parts.length >= 2) {
        this.cookies.set(parts[0].trim(), parts[1].trim());
      }
    }
  }

  async fetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) headers['cookie'] = cookieHeader;

    const res = await fetch(url, { ...options, headers });
    this.saveCookies(res);
    return res;
  }

  async login(token) {
    const res = await this.fetch(`${BASE_URL}/api/auth-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }
}

async function runProductionLiveVerification() {
  console.log('\n======================================================');
  console.log('FINAL PRODUCTION VERIFICATION — INTEGRITAS DATA & SISTEM');
  console.log(`🌐 Target Server: ${BASE_URL}`);
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: LIVE ENDPOINT CPANEL & FAIL-CLOSED AUTHENTICATION GUARD
  // -------------------------------------------------------------------------
  try {
    const unauthClient = new DeviceClient('UnauthClient');
    const res = await unauthClient.fetch(`${BASE_URL}/api/nolap-data-proxy`);
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && data.authenticated === false) {
      recordTest('PROD-01', 'Live Production Endpoint & Fail-Closed Guard', 'PASSED',
        `Endpoint ${BASE_URL}/api/nolap-data-proxy aktif di cPanel (HTTP 401 unauthenticated ditolak).`);
    } else {
      recordTest('PROD-01', 'Live Production Endpoint & Fail-Closed Guard', 'FAILED',
        `Status=${res.status}, Body=${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordTest('PROD-01', 'Live Production Endpoint & Fail-Closed Guard', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: AUTENTIKASI 5 KANTOR (PUSAT, PADANG, BANDUNG, MAKASSAR, PALEMBANG)
  // -------------------------------------------------------------------------
  const branchClients = {};
  const branchTokens = {
    Pusat: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"),
    Bandung: (process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN"),
    Padang: 'NSR-PDG-2026',
    Makassar: 'NSR-MKS-2026',
    Palembang: 'NSR-PLB-2026'
  };

  try {
    let allBranchLoginSuccess = true;
    for (const [branch, token] of Object.entries(branchTokens)) {
      const client = new DeviceClient(`Client_${branch}`);
      const loginRes = await client.login(token);
      if (loginRes.status === 200 && loginRes.data.authenticated && loginRes.data.user.branch === branch) {
        branchClients[branch] = client;
      } else {
        allBranchLoginSuccess = false;
        console.error(`Login failed for ${branch}:`, loginRes);
      }
    }

    if (allBranchLoginSuccess) {
      recordTest('PROD-02', 'Multi-Branch Authentication (5 Kantor)', 'PASSED',
        'Semua kantor (Pusat, Padang, Bandung, Makassar, Palembang) terautentikasi resmi pada sesi cPanel.');
    } else {
      recordTest('PROD-02', 'Multi-Branch Authentication (5 Kantor)', 'FAILED',
        'Satu atau lebih login cabang gagal.');
    }
  } catch (err) {
    recordTest('PROD-02', 'Multi-Branch Authentication (5 Kantor)', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: AUDIT DATA PENUGASAN ASLI & SANITASI DARI SIMULASI
  // -------------------------------------------------------------------------
  try {
    const pusatClient = branchClients['Pusat'];
    if (!pusatClient) throw new Error('Pusat client not authenticated');

    // Sanitasi data ke baseline bersih
    const resSanitize = await pusatClient.fetch(`${BASE_URL}/api/nolap-data-proxy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'sanitizeProductionData' })
    });
    const dataSanitize = await resSanitize.json();

    // Periksa kebersihan data asli
    let realDataClean = true;
    const checkedRealRecords = [];
    for (const id of ['REQ-000006', 'REQ-000011', 'REQ-000014']) {
      const res = await pusatClient.fetch(`${BASE_URL}/api/nolap-data-proxy?noPermintaan=${id}`);
      const d = await res.json();
      const hasMitigasi = !!d.record?.mitigasi;
      if (hasMitigasi) realDataClean = false;
      checkedRealRecords.push(`${id}: ${d.record?.status || 'NOT_FOUND'} (Mitigasi: ${hasMitigasi ? 'ADA' : 'BERSIH'})`);
    }

    if (resSanitize.status === 200 && realDataClean) {
      recordTest('PROD-03', 'Audit Data Penugasan Asli & Sanitasi', 'PASSED',
        `Penugasan asli steril dari simulasi: ${checkedRealRecords.join(', ')}. Dummy terisolasi aktif.`);
    } else {
      recordTest('PROD-03', 'Audit Data Penugasan Asli & Sanitasi', 'FAILED',
        `SanitizeStatus=${resSanitize.status}, RealClean=${realDataClean}, Records: ${checkedRealRecords.join(', ')}`);
    }
  } catch (err) {
    recordTest('PROD-03', 'Audit Data Penugasan Asli & Sanitasi', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: ISOLASI CABANG SERVER-SIDE (RBAC DATA PARTITIONING PADA DATA DUMMY)
  // -------------------------------------------------------------------------
  try {
    const padangClient = branchClients['Padang'];
    if (!padangClient) throw new Error('Padang client not authenticated');

    // Padang membaca daftar permohonan miliknya: hanya boleh melihat cabang Padang
    const resGetAll = await padangClient.fetch(`${BASE_URL}/api/nolap-data-proxy`);
    const dataGetAll = await resGetAll.json();
    const isScopeIsolated = dataGetAll.scope === 'BRANCH_ISOLATED' && dataGetAll.branch === 'Padang';
    const allRecordsPadangOnly = Array.isArray(dataGetAll.data) && dataGetAll.data.every(r => r.cabang.toLowerCase() === 'padang');

    // Padang membaca data dummy miliknya (REQ-TEST-001): HARUS BISA (200)
    const resGetPadangDummy = await padangClient.fetch(`${BASE_URL}/api/nolap-data-proxy?noPermintaan=REQ-TEST-001`);
    const isPadangDummyAllowed = resGetPadangDummy.status === 200;

    // Padang membaca dummy Bandung (REQ-TEST-002): HARUS DITOLAK (403)
    const resGetBdgDummy = await padangClient.fetch(`${BASE_URL}/api/nolap-data-proxy?noPermintaan=REQ-TEST-002`);
    const dataGetBdgDummy = await resGetBdgDummy.json();
    const isBdgDummyBlocked = resGetBdgDummy.status === 403 && dataGetBdgDummy.violation === 'CROSS_BRANCH_ACCESS_DENIED';

    // Padang mencoba mengubah mitigasi dummy Bandung (REQ-TEST-002): HARUS DITOLAK (403)
    const resTamper = await padangClient.fetch(`${BASE_URL}/api/nolap-data-proxy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-TEST-002',
          tipeMitigasi: 'tanah',
          mitigasiData: { statusDokumen: 'DRAFT', secA: { namaProyek: 'Manipulasi Lintas Cabang' } }
        }
      })
    });
    const dataTamper = await resTamper.json();
    const isTamperBlocked = resTamper.status === 403 && dataTamper.violation === 'CROSS_BRANCH_MITIGASI_TAMPERING_ATTEMPT';

    if (isScopeIsolated && allRecordsPadangOnly && isPadangDummyAllowed && isBdgDummyBlocked && isTamperBlocked) {
      recordTest('PROD-04', 'Server-Side Branch Isolation (RBAC Proteksi)', 'PASSED',
        'Partisi cabang terisolasi (BRANCH_ISOLATED). Akses dan tampering lintas cabang ditolak 403 Forbidden.');
    } else {
      recordTest('PROD-04', 'Server-Side Branch Isolation (RBAC Proteksi)', 'FAILED',
        `isolated=${isScopeIsolated}, padangDummy=${isPadangDummyAllowed}, bdgBlocked=${isBdgDummyBlocked}, tamperBlocked=${isTamperBlocked}`);
    }
  } catch (err) {
    recordTest('PROD-04', 'Server-Side Branch Isolation (RBAC Proteksi)', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: KONTROL APPROVAL RESMI & WEWENANG SERVER-SIDE
  // -------------------------------------------------------------------------
  try {
    const padangClient = branchClients['Padang'];
    const pusatClient = branchClients['Pusat'];

    // Cabang mencoba menetapkan status APPROVED pada dummy Padang: DITOLAK (403)
    const resBranchApproval = await padangClient.fetch(`${BASE_URL}/api/nolap-data-proxy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-TEST-001',
          tipeMitigasi: 'tanah',
          mitigasiData: {
            statusDokumen: 'APPROVED',
            secF_acceptance: { keputusan: 'APPROVED' }
          }
        }
      })
    });
    const dataBranchApproval = await resBranchApproval.json();
    const isBranchApprovalBlocked = resBranchApproval.status === 403 && dataBranchApproval.violation === 'UNAUTHORIZED_MITIGATION_APPROVAL_ATTEMPT';

    // Admin Pusat mengesahkan secara sah mitigasi REQ-TEST-001 (Versi 1)
    const initialMitigasiData = {
      statusDokumen: 'APPROVED',
      linkedNoReq: 'REQ-TEST-001',
      secA: {
        namaProyek: 'Simulasi Pengadaan Tanah Koridor Uji Coba Padang',
        instansi: 'PT. Simulasi Pertanahan Mandiri',
        lokasiObjek: 'Kawasan Bypass Padang'
      },
      secB_redFlags: { rf_01: { val: 'TIDAK' } },
      secF_acceptance: {
        keputusan: 'APPROVED',
        alasan: 'Memenuhi seluruh kriteria SPI 204 dan KEPI'
      }
    };

    const resPusatApproval = await pusatClient.fetch(`${BASE_URL}/api/nolap-data-proxy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-TEST-001',
          tipeMitigasi: 'tanah',
          mitigasiData: initialMitigasiData
        }
      })
    });
    const dataPusatApproval = await resPusatApproval.json();
    const isApprovedVersion1 = resPusatApproval.status === 200 &&
      dataPusatApproval.statusDokumen === 'APPROVED' &&
      dataPusatApproval.activeVersion === 1 &&
      dataPusatApproval.serverAudit?.isApprovedFormal === true;

    if (isBranchApprovalBlocked && isApprovedVersion1) {
      recordTest('PROD-05', 'Server-Side Approval Gate & Versi 1.0 Pengesahan', 'PASSED',
        `Self-approval cabang ditolak (403). Pengesahan Pusat berhasil (v1.0 APPROVED, hash ${dataPusatApproval.serverAudit.contentHash.substring(0, 16)}...).`);
    } else {
      recordTest('PROD-05', 'Server-Side Approval Gate & Versi 1.0 Pengesahan', 'FAILED',
        `branchBlocked=${isBranchApprovalBlocked}, approvedV1=${isApprovedVersion1}`);
    }
  } catch (err) {
    recordTest('PROD-05', 'Server-Side Approval Gate & Versi 1.0 Pengesahan', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: KONTROL REVISI MATERIAL PASCA-APPROVAL (VERSIONING & AUTO DEMOTION)
  // -------------------------------------------------------------------------
  try {
    const padangClient = branchClients['Padang'];
    const pusatClient = branchClients['Pusat'];

    // Cabang Padang melakukan revisi material pada dokumen yang sudah APPROVED:
    const revisedData = {
      statusDokumen: 'DRAFT', // Pengaju mengirim perubahan
      linkedNoReq: 'REQ-TEST-001',
      secA: {
        namaProyek: 'Simulasi Pengadaan Tanah Koridor Uji Coba Padang (REVISI TRASEN JALUR)',
        instansi: 'PT. Simulasi Pertanahan Mandiri',
        lokasiObjek: 'Kawasan Bypass Padang Blok B'
      },
      secB_redFlags: { rf_01: { val: 'YA', clarifyDesc: 'Ada potensi tumpang tindih kepemilikan' } },
      secF_acceptance: {
        keputusan: 'ACCEPT WITH MITIGATION',
        alasan: 'Perubahan trase memerlukan telaah hukum lanjutan'
      }
    };

    const resRevision = await padangClient.fetch(`${BASE_URL}/api/nolap-data-proxy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-TEST-001',
          tipeMitigasi: 'tanah',
          alasanRevisi: 'Perubahan trase jalur pengadaan tanah koridor uji coba',
          mitigasiData: revisedData
        }
      })
    });
    const dataRevision = await resRevision.json();

    // Verifikasi otomatis demosi dan versioning:
    const isVersionIncremented = dataRevision.activeVersion === 2;
    const isDemotedToPending = dataRevision.statusDokumen === 'PENDING_REVIEW' && dataRevision.isDemotedFromApproved === true;
    const record = dataRevision.record?.mitigasi?.tanah;
    const hasArchivedV1 = Array.isArray(record?.archivedVersions) && record.archivedVersions.some(v => v.version === 1 && v.status === 'APPROVED');
    const hasRevisionHistory = Array.isArray(record?.revisionHistory) && record.revisionHistory.length > 0;
    const sheetSyncStatus = record?._sheetSync?.statusSync === 'SYNC_PENDING';

    if (isVersionIncremented && isDemotedToPending && hasArchivedV1 && hasRevisionHistory && sheetSyncStatus) {
      recordTest('PROD-06', 'Kontrol Revisi Material & Demosi Approval (v2.0 PENDING_REVIEW)', 'PASSED',
        'Revisi material memicu arsip v1.0, menaikkan versi ke v2.0, menggugurkan status APPROVED menjadi PENDING_REVIEW, dan mencatat antrean SYNC_PENDING.');
    } else {
      recordTest('PROD-06', 'Kontrol Revisi Material & Demosi Approval (v2.0 PENDING_REVIEW)', 'FAILED',
        `vIncrement=${isVersionIncremented}, demoted=${isDemotedToPending}, archived=${hasArchivedV1}, hist=${hasRevisionHistory}, sync=${sheetSyncStatus}`);
    }
  } catch (err) {
    recordTest('PROD-06', 'Kontrol Revisi Material & Demosi Approval (v2.0 PENDING_REVIEW)', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: SNAPSHOT BACKUP BERPUTAR & RESTORE DATABASE ADMINISTRATIF
  // -------------------------------------------------------------------------
  try {
    const pusatClient = branchClients['Pusat'];

    // Lakukan pemulihan database dari snapshot backup terakhir
    const resRestore = await pusatClient.fetch(`${BASE_URL}/api/nolap-data-proxy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'restoreBackup',
        payload: { backupFileName: 'latest' }
      })
    });
    const dataRestore = await resRestore.json();
    const isRestored = resRestore.status === 200 && dataRestore.success === true && !!dataRestore.restoredFrom;

    if (isRestored) {
      recordTest('PROD-07', 'Automated Rotating Backup & Restore Admin', 'PASSED',
        `Database berhasil dipulihkan dari snapshot ${dataRestore.restoredFrom} (${dataRestore.totalRecords} records).`);
    } else {
      recordTest('PROD-07', 'Automated Rotating Backup & Restore Admin', 'FAILED',
        `Status=${resRestore.status}, Body=${JSON.stringify(dataRestore)}`);
    }
  } catch (err) {
    recordTest('PROD-07', 'Automated Rotating Backup & Restore Admin', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: PROTEKSI WEBSERVER .HTACCESS (403 FORBIDDEN KE DATABASE & DATA/)
  // -------------------------------------------------------------------------
  try {
    const protectedUrls = [
      `${BASE_URL}/data/nolap_database.json`,
      `${BASE_URL}/nolap-data.json`,
      `${BASE_URL}/data/`,
      `${BASE_URL}/data/backups/`
    ];

    let allProtected = true;
    const statuses = [];
    for (const u of protectedUrls) {
      const res = await fetch(u);
      statuses.push(`${u.replace(BASE_URL, '')} -> HTTP ${res.status}`);
      if (res.status !== 403) {
        allProtected = false;
      }
    }

    if (allProtected) {
      recordTest('PROD-08', 'Proteksi File Database & Direktori Data (.htaccess)', 'PASSED',
        `Semua endpoint data sensitif mengembalikan 403 Forbidden: ${statuses.join(', ')}.`);
    } else {
      recordTest('PROD-08', 'Proteksi File Database & Direktori Data (.htaccess)', 'FAILED',
        `Beberapa endpoint tidak 403 Forbidden: ${statuses.join(', ')}`);
    }
  } catch (err) {
    recordTest('PROD-08', 'Proteksi File Database & Direktori Data (.htaccess)', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log('SUMMARY RESULTS — FINAL PRODUCTION VERIFICATION:');
  console.log('======================================================');
  let passCount = 0;
  let failCount = 0;
  results.forEach(r => {
    if (r.status === 'PASSED') passCount++;
    else failCount++;
    console.log(`[${r.status}] ${r.id}: ${r.name}`);
  });
  console.log(`\nTotal: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('======================================================\n');

  if (failCount === 0) {
    console.log('🛡️ SELURUH UJI VERIFIKASI PRODUKSI LIVE LULUS 100%!\n');
    process.exit(0);
  } else {
    console.error('❌ BEBERAPA UJI VERIFIKASI GAGAL!\n');
    process.exit(1);
  }
}

runProductionLiveVerification().catch(err => {
  console.error('Fatal production test runner error:', err);
  process.exit(1);
});
