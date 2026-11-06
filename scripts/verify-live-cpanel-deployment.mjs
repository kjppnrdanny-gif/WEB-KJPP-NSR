/**
 * scripts/verify-live-cpanel-deployment.mjs
 * Post-Deployment Verification for cPanel Production: Commit d71ff23
 */

const BASE_URL = 'https://kjppnanangrahayu.com';

console.log('=================================================================');
console.log('   VERIFIKASI SERVER PASCA-DEPLOYMENT CPANEL: COMMIT d71ff23      ');
console.log(`   Target Server: ${BASE_URL}                                   `);
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function verifyAll() {
  // -------------------------------------------------------------
  // Test 1: HTTP GET Workload Analytics on Live Server
  // -------------------------------------------------------------
  console.log('--- 1. Uji Endpoint Backend: get_workload_analytics ---');
  try {
    const analyticsUrl = `${BASE_URL}/backend/job-tracking-handler.php?action=get_workload_analytics&v=${Date.now()}`;
    const res = await fetch(analyticsUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VerificationScript/1.0'
      }
    });

    assert(res.status === 200, `HTTP Status Code harus 200 (Aktual: ${res.status})`);

    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Content-Type harus application/json (Aktual: ${contentType})`);

    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
      assert(true, 'Respon server berhasil diparsing sebagai JSON valid (Bebas PHP 500 error)');
    } catch (e) {
      assert(false, `Parsing JSON gagal: ${e.message}\nRaw text: ${text.slice(0, 300)}`);
    }

    if (data) {
      assert(data.status === 'success', `data.status harus 'success' (Aktual: ${data.status})`);
      assert(data.data && typeof data.data.summary === 'object', 'data.data.summary harus berupa objek statistik');
      if (data.data?.summary) {
        console.log(`     -> Total Jobs: ${data.data.summary.total_jobs} | Active: ${data.data.summary.total_active_jobs} | SLA: ${data.data.summary.national_sla_compliance}`);
      }
    }
  } catch (err) {
    assert(false, `Gagal memanggil endpoint backend: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 2: HTTP GET portal-tracking.html & Verifikasi RBAC 7 Peran & SSO
  // -------------------------------------------------------------
  console.log('\n--- 2. Uji Frontend: portal-tracking.html (RBAC 7 Peran & SSO Bridge) ---');
  try {
    const portalUrl = `${BASE_URL}/portal-tracking.html?v=${Date.now()}`;
    const res = await fetch(portalUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VerificationScript/1.0'
      }
    });

    assert(res.status === 200, `HTTP Status Code portal-tracking.html harus 200 (Aktual: ${res.status})`);

    const html = await res.text();
    console.log(`     -> Ukuran Dokumen: ${html.length} bytes`);

    // Invarian Skrip RBAC & SSO
    assert(html.includes('function normalizeRole(role)'), 'Skrip memuat fungsi normalizeRole() 7 peran');
    assert(html.includes('function isFinancialMasked(role)'), 'Skrip memuat fungsi isFinancialMasked()');
    assert(html.includes('function formatFeeDisplay(val, role)'), 'Skrip memuat fungsi formatFeeDisplay()');
    assert(html.includes('function formatKwitansiDisplay(val, role)'), 'Skrip memuat fungsi formatKwitansiDisplay()');
    assert(html.includes('function cekWewenangMilestoneOperasional(job, targetMilestone, currentProfile)'), 'Skrip memuat action guard cekWewenangMilestoneOperasional()');
    assert(html.includes('id="modal-update-readonly-notice"'), 'DOM memuat banner id="modal-update-readonly-notice" (Read-Only Mode)');
    assert(html.includes('tab-btn-register') && html.includes("['ADMIN_OPS', 'PIMPINAN'].includes(normRole)"), 'DOM memuat RBAC button guard untuk "+ Registrasi Job Order Baru"');
    assert(html.includes('SPM 2: Prinsip Independensi KPSPI-MAPPI Dilanggar!'), 'DOM memuat validasi Segregation of Duties (Larangan Self-Review)');
    assert(html.includes('filterKantorEl.disabled = true;'), 'DOM memuat penguncian isolasi kantor cabang (Branch Isolation Guard)');

    // Invarian SSO Bridge
    assert(html.includes('NSR_SESSION_TOKEN') || html.includes('nsr_user_session'), 'Portal terintegrasi dengan Cross-Portal SSO Bridge');
  } catch (err) {
    assert(false, `Gagal memverifikasi portal-tracking.html: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 3: Uji Keamanan Live Backend RBAC (Guard & Financial Masking)
  // -------------------------------------------------------------
  console.log('\n--- 3. Uji Keamanan Live Backend API (RBAC Action Guard & Masking) ---');
  try {
    // 3A. Action CREATE oleh SURVEYOR harus ditolak 403
    const resCreate = await fetch(`${BASE_URL}/backend/job-tracking-handler.php?action=create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        role: 'SURVEYOR',
        auth_role: 'SURVEYOR',
        instansi: 'Test Penetrasi Live'
      })
    });
    assert(resCreate.status === 403, `Live CREATE oleh SURVEYOR harus ditolak HTTP 403 (Aktual: ${resCreate.status})`);
    const createBody = await resCreate.json();
    assert(createBody.code === 'ROLE_FORBIDDEN_REGISTRATION' || createBody.code === 'FORBIDDEN_ROLE', `Error code harus ROLE_FORBIDDEN_REGISTRATION (Aktual: ${createBody.code})`);

    // 3B. Action GET_JOB_DETAIL dengan auth_role=SURVEYOR harus disamarkan fee-nya
    const resDetail = await fetch(`${BASE_URL}/backend/job-tracking-handler.php?action=get_job_detail&jo=JO-JKT-2026-0001&auth_role=SURVEYOR`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (resDetail.status === 200) {
      const detailBody = await resDetail.json();
      const job = detailBody.data || detailBody.job;
      if (job) {
        assert(job.fee_penilaian === 'Rp *******', `Fee penilaian untuk SURVEYOR harus dimasking (Aktual: ${job.fee_penilaian})`);
        assert(job.status_kwitansi === '*******', `Status kwitansi untuk SURVEYOR harus dimasking (Aktual: ${job.status_kwitansi})`);
      }
    }
  } catch (err) {
    assert(false, `Uji live security backend API gagal: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Ringkasan Akhir
  // -------------------------------------------------------------
  console.log('\n=================================================================');
  console.log(`TOTAL PENGUJIAN: ${totalTests} | LULUS: ${passedTests} | GAGAL: ${failedTests}`);
  if (failedTests === 0) {
    console.log('STATUS: VERIFIKASI POST-DEPLOYMENT CPANEL LULUS 100% (SEMPURNA)');
    console.log('=================================================================');
    process.exit(0);
  } else {
    console.error('STATUS: TERDAPAT PENGUJIAN YANG GAGAL');
    console.log('=================================================================');
    process.exit(1);
  }
}

verifyAll();
