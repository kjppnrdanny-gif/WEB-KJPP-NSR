/**
 * scripts/test-rbac-system.mjs
 * Automated Verification Test Suite for KJPP NSR 7-Role RBAC System
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const phpHandler = path.join(projectRoot, 'backend', 'job-tracking-handler.php');
const portalHtml = path.join(projectRoot, 'portal-tracking.html');
const stagingFile = path.join(projectRoot, 'data', 'job_tracking_staging.json');
const stagingBackup = path.join(projectRoot, 'data', 'job_tracking_staging.rbac_backup.json');

// Backup staging data if exists
if (fs.existsSync(stagingFile)) {
  fs.copyFileSync(stagingFile, stagingBackup);
}

console.log('=================================================================');
console.log('   AUTOMATED VERIFICATION: KJPP NSR 7-ROLE RBAC SYSTEM           ');
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

// Helper to run PHP runner with shutdown handler for HTTP code
function runPhpScript(setupCode) {
  const tmpFile = path.resolve('tmp_test_rbac.php');
  const codeFile = path.resolve('tmp_test_rbac_code.txt');

  const fullScript = `<?php
register_shutdown_function(function() {
    $code = http_response_code();
    if (!$code) $code = 200;
    file_put_contents('${codeFile.replace(/\\/g, '/')}', (string)$code);
});
ob_start();
${setupCode}
$out = ob_get_clean();
echo $out;
`;

  fs.writeFileSync(tmpFile, fullScript, 'utf8');
  if (fs.existsSync(codeFile)) fs.unlinkSync(codeFile);

  try {
    const rawOut = execSync(`php "${tmpFile}"`, { encoding: 'utf8' });
    const httpCode = fs.existsSync(codeFile) ? parseInt(fs.readFileSync(codeFile, 'utf8').trim(), 10) : 200;
    let jsonBody = null;
    try {
      jsonBody = JSON.parse(rawOut.trim());
    } catch (_) {}
    return { httpCode, body: jsonBody, raw: rawOut };
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    if (fs.existsSync(codeFile)) fs.unlinkSync(codeFile);
  }
}

try {
  // -------------------------------------------------------------
  // Test Suite 1: Backend PHP Unit Tests (Role Normalization & Masking)
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Backend Role Normalization & Logic via PHP Unit ---');

  const unitTestSetup = `
  $_GET['action'] = 'test_unit_noop';
  require '${phpHandler.replace(/\\/g, '/')}';
  ob_clean();

  $results = [];

  // 1. normalizeOperationalRole tests
  $testsRole = [
    ['role' => 'PIMPINAN', 'expected' => 'PIMPINAN'],
    ['role' => 'KING', 'expected' => 'PIMPINAN'],
    ['role' => 'SUPERADMIN', 'expected' => 'PIMPINAN'],
    ['role' => 'ADMIN_PUSAT', 'expected' => 'ADMIN_OPS'],
    ['role' => 'ADMIN_CABANG', 'expected' => 'ADMIN_OPS'],
    ['role' => 'ADMIN_OPS', 'expected' => 'ADMIN_OPS'],
    ['role' => 'SURVEYOR', 'expected' => 'SURVEYOR'],
    ['role' => 'PENILAI_LAPANGAN', 'expected' => 'SURVEYOR'],
    ['role' => 'ANALIS', 'expected' => 'ANALIS'],
    ['role' => 'PENILAI_PELAKSANA', 'expected' => 'ANALIS'],
    ['role' => 'DRAFTER', 'expected' => 'ANALIS'],
    ['role' => 'REVIEWER_SPM', 'expected' => 'REVIEWER_SPM'],
    ['role' => 'SPM', 'expected' => 'REVIEWER_SPM'],
    ['role' => 'PENILAI_PUBLIK', 'expected' => 'PENILAI_PUBLIK'],
    ['role' => 'PARTNER', 'expected' => 'PENILAI_PUBLIK'],
    ['role' => 'REKAN_NIPP', 'expected' => 'PENILAI_PUBLIK'],
    ['role' => 'KEUANGAN', 'expected' => 'KEUANGAN'],
    ['role' => 'BILLING', 'expected' => 'KEUANGAN'],
    ['role' => 'KEUANGAN_CABANG', 'expected' => 'KEUANGAN']
  ];

  foreach ($testsRole as $t) {
    $norm = normalizeOperationalRole(['role' => $t['role']]);
    $results['norm_' . $t['role']] = ($norm === $t['expected']);
  }

  // 2. Financial fee masking check
  $mockJob = [
    'id' => 'JOB-TEST-001',
    'fee_penilaian' => 25000000,
    'nilai_kontrak' => 25000000,
    'termin_penagihan' => 'Termin 1 (50%), Termin 2 (50%)',
    'status_kwitansi' => 'LUNAS'
  ];

  $jobSurveyor = $mockJob;
  applyFinancialMasking($jobSurveyor, 'SURVEYOR');
  $results['mask_surveyor_fee'] = ($jobSurveyor['fee_penilaian'] === 'Rp *******');
  $results['mask_surveyor_kontrak'] = ($jobSurveyor['nilai_kontrak'] === 'Rp *******');
  $results['mask_surveyor_termin'] = ($jobSurveyor['termin_penagihan'] === '*******');
  $results['mask_surveyor_kwitansi'] = ($jobSurveyor['status_kwitansi'] === '*******');

  $jobAnalis = $mockJob;
  applyFinancialMasking($jobAnalis, 'ANALIS');
  $results['mask_analis_fee'] = ($jobAnalis['fee_penilaian'] === 'Rp *******');

  $jobReviewer = $mockJob;
  applyFinancialMasking($jobReviewer, 'REVIEWER_SPM');
  $results['mask_reviewer_fee'] = ($jobReviewer['fee_penilaian'] === 'Rp *******');

  $jobPimpinan = $mockJob;
  applyFinancialMasking($jobPimpinan, 'PIMPINAN');
  $results['unmask_pimpinan_fee'] = ($jobPimpinan['fee_penilaian'] === 25000000);
  $results['unmask_pimpinan_kwitansi'] = ($jobPimpinan['status_kwitansi'] === 'LUNAS');

  $jobAdmin = $mockJob;
  applyFinancialMasking($jobAdmin, 'ADMIN_OPS');
  $results['unmask_admin_fee'] = ($jobAdmin['fee_penilaian'] === 25000000);

  $jobPenilaiPublik = $mockJob;
  applyFinancialMasking($jobPenilaiPublik, 'PENILAI_PUBLIK');
  $results['unmask_publik_fee'] = ($jobPenilaiPublik['fee_penilaian'] === 25000000);

  $jobKeuangan = $mockJob;
  applyFinancialMasking($jobKeuangan, 'KEUANGAN');
  $results['unmask_keuangan_fee'] = ($jobKeuangan['fee_penilaian'] === 25000000);

  // 3. Authority checks across M-01 to M-07
  $jobAuthority = [
    'id' => 'JOB-AUTH-001',
    'surveyor' => 'Budi Santoso',
    'surveyor_nik' => 'NSR-SVR-01',
    'analis' => 'Siti Rahma',
    'analis_nik' => 'NSR-ANL-01',
    'reviewer' => 'Ir. Hendro Wijaya',
    'reviewer_nik' => 'NSR-SPM-01',
    'penilai_publik' => 'Nanang Rahayu, M.Ec.Dev, MAPPI (Cert.)',
    'penilai_publik_nik' => 'NSR-PP-01'
  ];

  // M-01: ADMIN_OPS & PIMPINAN allowed; others denied
  $results['auth_m01_admin'] = checkMilestoneAuthority(['role' => 'ADMIN_OPS'], 'M-01', $jobAuthority)['allowed'];
  $results['auth_m01_pimpinan'] = checkMilestoneAuthority(['role' => 'PIMPINAN'], 'M-01', $jobAuthority)['allowed'];
  $results['auth_m01_surveyor_denied'] = !checkMilestoneAuthority(['role' => 'SURVEYOR'], 'M-01', $jobAuthority)['allowed'];

  // M-02: PIMPINAN ONLY; ADMIN_OPS denied
  $results['auth_m02_pimpinan'] = checkMilestoneAuthority(['role' => 'PIMPINAN'], 'M-02', $jobAuthority)['allowed'];
  $results['auth_m02_admin_denied'] = !checkMilestoneAuthority(['role' => 'ADMIN_OPS'], 'M-02', $jobAuthority)['allowed'];

  // M-03: Assigned SURVEYOR allowed; non-assigned or ANALIS denied
  $results['auth_m03_assigned_surveyor'] = checkMilestoneAuthority(['role' => 'SURVEYOR', 'nama' => 'Budi Santoso', 'nik' => 'NSR-SVR-01'], 'M-03', $jobAuthority)['allowed'];
  $results['auth_m03_unassigned_surveyor_denied'] = !checkMilestoneAuthority(['role' => 'SURVEYOR', 'nama' => 'Ahmad Dani', 'nik' => 'NSR-SVR-99'], 'M-03', $jobAuthority)['allowed'];
  $results['auth_m03_analis_denied'] = !checkMilestoneAuthority(['role' => 'ANALIS', 'nama' => 'Siti Rahma'], 'M-03', $jobAuthority)['allowed'];

  // M-04: Assigned ANALIS allowed; SURVEYOR denied
  $results['auth_m04_assigned_analis'] = checkMilestoneAuthority(['role' => 'ANALIS', 'nama' => 'Siti Rahma', 'nik' => 'NSR-ANL-01'], 'M-04', $jobAuthority)['allowed'];
  $results['auth_m04_surveyor_denied'] = !checkMilestoneAuthority(['role' => 'SURVEYOR', 'nama' => 'Budi Santoso'], 'M-04', $jobAuthority)['allowed'];

  // M-05: Assigned REVIEWER_SPM allowed; ANALIS denied
  $results['auth_m05_assigned_reviewer'] = checkMilestoneAuthority(['role' => 'REVIEWER_SPM', 'nama' => 'Ir. Hendro Wijaya', 'nik' => 'NSR-SPM-01'], 'M-05', $jobAuthority)['allowed'];
  $results['auth_m05_analis_denied'] = !checkMilestoneAuthority(['role' => 'ANALIS', 'nama' => 'Siti Rahma'], 'M-05', $jobAuthority)['allowed'];

  // M-06: PENILAI_PUBLIK allowed; REVIEWER_SPM denied
  $results['auth_m06_penilai_publik'] = checkMilestoneAuthority(['role' => 'PENILAI_PUBLIK', 'nama' => 'Nanang Rahayu'], 'M-06', $jobAuthority)['allowed'];
  $results['auth_m06_reviewer_denied'] = !checkMilestoneAuthority(['role' => 'REVIEWER_SPM', 'nama' => 'Ir. Hendro Wijaya'], 'M-06', $jobAuthority)['allowed'];

  // M-07: KEUANGAN & ADMIN_OPS allowed; SURVEYOR denied
  $results['auth_m07_keuangan'] = checkMilestoneAuthority(['role' => 'KEUANGAN'], 'M-07', $jobAuthority)['allowed'];
  $results['auth_m07_admin'] = checkMilestoneAuthority(['role' => 'ADMIN_OPS'], 'M-07', $jobAuthority)['allowed'];
  $results['auth_m07_surveyor_denied'] = !checkMilestoneAuthority(['role' => 'SURVEYOR'], 'M-07', $jobAuthority)['allowed'];

  echo json_encode($results);
  `;

  const unitRes = runPhpScript(unitTestSetup);
  if (unitRes.body) {
    for (const [key, val] of Object.entries(unitRes.body)) {
      assert(val === true, `Backend Unit Test [${key}] must pass`);
    }
  } else {
    assert(false, `Failed to parse unit test output: ${unitRes.raw}`);
  }

  // -------------------------------------------------------------
  // Test Suite 2: API Endpoints Execution & Hard-Gated Action Guards
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: API Action Guards & Segregation of Duties ---');

  // Test 2A: Action CREATE with non-authorized role (SURVEYOR) -> 403 ROLE_FORBIDDEN_REGISTRATION
  const resCreateSurveyor = runPhpScript(`
  \$_GET['action'] = 'create';
  \$_POST = [
    'role' => 'SURVEYOR',
    'auth_role' => 'SURVEYOR',
    'instansi' => 'Bank Mandiri',
    'nomor_spk' => 'SPK-SURV-DENIED'
  ];
  require '${phpHandler.replace(/\\/g, '/')}';
  `);

  assert(
    resCreateSurveyor.httpCode === 403 && (resCreateSurveyor.body?.code === 'ROLE_FORBIDDEN_REGISTRATION' || resCreateSurveyor.body?.code === 'FORBIDDEN_ROLE'),
    'Action CREATE by SURVEYOR must return HTTP 403 ROLE_FORBIDDEN_REGISTRATION'
  );

  // Test 2B: Action CREATE with Segregation of Duties violation (Reviewer == Analis) -> 422
  const resCreateSelfReview = runPhpScript(`
  \$_GET['action'] = 'create';
  \$_POST = [
    'role' => 'ADMIN_OPS',
    'auth_role' => 'ADMIN_OPS',
    'instansi' => 'PT Bank Central Asia',
    'nomor_spk' => 'SPK-SOD-TEST',
    'surveyor' => 'Doni Surveyor',
    'analis' => 'Ahmad Fauzi',
    'reviewer' => 'Ahmad Fauzi'
  ];
  require '${phpHandler.replace(/\\/g, '/')}';
  `);

  assert(
    resCreateSelfReview.httpCode === 422 && resCreateSelfReview.body?.code === 'SPM_SELF_REVIEW_PROHIBITED',
    'Action CREATE with same Analis and Reviewer must return HTTP 422 SPM_SELF_REVIEW_PROHIBITED'
  );

  // Test 2C: Action CREATE by ADMIN_OPS with valid segregated team -> 200/201 success
  const resCreateValid = runPhpScript(`
  \$_GET['action'] = 'create';
  \$_POST = [
    'role' => 'ADMIN_OPS',
    'auth_role' => 'ADMIN_OPS',
    'kantor' => 'Kantor Pusat Jakarta',
    'instansi' => 'PT Bank Mandiri (Persero) Tbk',
    'pemberi_tugas' => 'PT Bank Mandiri (Persero) Tbk',
    'pengguna_laporan' => 'PT Bank Mandiri (Persero) Tbk',
    'nomor_spk' => 'SPK-MDR-RBAC-001',
    'spk_number' => 'SPK-MDR-RBAC-001',
    'surveyor' => 'Budi Santoso',
    'penilai_pelaksana' => 'Siti Rahma',
    'reviewer' => 'Ir. Hendro Wijaya',
    'penilai_publik' => 'Nanang Rahayu, M.Ec.Dev, MAPPI (Cert.)',
    'fee_penilaian' => 45000000,
    'nilai_kontrak' => 45000000,
    'termin_penagihan' => 'Termin 1 (50%), Termin 2 (50%)',
    'status_kwitansi' => 'LUNAS'
  ];
  require '${phpHandler.replace(/\\/g, '/')}';
  `);

  assert(
    (resCreateValid.httpCode === 200 || resCreateValid.httpCode === 201) && resCreateValid.body?.status === 'success',
    'Action CREATE by ADMIN_OPS with segregated team must succeed'
  );

  const createdJob = resCreateValid.body?.data;
  const createdJobId = createdJob?.id || 'JO-JKT-2026-0001';

  // Test 2D: Financial Fee Masking on GET_JOB_DETAIL for SURVEYOR
  const resDetailSurveyor = runPhpScript(`
  \$_GET['action'] = 'get_job_detail';
  \$_GET['jo'] = '${createdJobId}';
  \$_GET['auth_role'] = 'SURVEYOR';
  \$_POST['role'] = 'SURVEYOR';
  require '${phpHandler.replace(/\\/g, '/')}';
  `);

  const srvData = resDetailSurveyor.body?.data || resDetailSurveyor.body?.job;
  assert(
    srvData && srvData.fee_penilaian === 'Rp *******' && srvData.status_kwitansi === '*******',
    'Action GET_JOB_DETAIL for SURVEYOR must mask fee_penilaian (Rp *******) & status_kwitansi (*******)'
  );

  // Test 2E: Financial Fee Unmasked on GET_JOB_DETAIL for PIMPINAN
  const resDetailPimpinan = runPhpScript(`
  \$_GET['action'] = 'get_job_detail';
  \$_GET['jo'] = '${createdJobId}';
  \$_GET['auth_role'] = 'PIMPINAN';
  \$_POST['role'] = 'PIMPINAN';
  require '${phpHandler.replace(/\\/g, '/')}';
  `);

  const pimData = resDetailPimpinan.body?.data || resDetailPimpinan.body?.job;
  assert(
    pimData && pimData.fee_penilaian !== 'Rp *******' && pimData.status_kwitansi !== '*******',
    'Action GET_JOB_DETAIL for PIMPINAN must keep unmasked original fee & kwitansi'
  );

  // Test 2F: Advance Milestone M-02 Segregation of Duties check
  const resAdvM02Sod = runPhpScript(`
  \$_GET['action'] = 'advance_milestone';
  \$_POST = [
    'jo' => '${createdJobId}',
    'target_milestone' => 'M-02',
    'nik' => 'NSR-2019-001',
    'pin' => '123456',
    'role' => 'PIMPINAN',
    'reviewer' => 'Ahmad Fauzi',
    'analis' => 'Ahmad Fauzi'
  ];
  require '${phpHandler.replace(/\\/g, '/')}';
  `);

  assert(
    resAdvM02Sod.httpCode === 422 && resAdvM02Sod.body?.code === 'SPM_SELF_REVIEW_PROHIBITED',
    'Advance Milestone M-02 with same Analis and Reviewer must return HTTP 422 SPM_SELF_REVIEW_PROHIBITED'
  );

  // -------------------------------------------------------------
  // Test Suite 3: Client-side UI & DOM Invariants in portal-tracking.html
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Client-Side UI & DOM Invariants (portal-tracking.html) ---');

  const htmlContent = fs.readFileSync(portalHtml, 'utf-8');

  assert(
    htmlContent.includes('function normalizeRole(role)'),
    'portal-tracking.html must include normalizeRole() function'
  );

  assert(
    htmlContent.includes('function isFinancialMasked(role)'),
    'portal-tracking.html must include isFinancialMasked() function'
  );

  assert(
    htmlContent.includes('function formatFeeDisplay(val, role)'),
    'portal-tracking.html must include formatFeeDisplay() function'
  );

  assert(
    htmlContent.includes('function formatKwitansiDisplay(val, role)'),
    'portal-tracking.html must include formatKwitansiDisplay() function'
  );

  assert(
    htmlContent.includes('function cekWewenangMilestoneOperasional(job, targetMilestone, currentProfile)'),
    'portal-tracking.html must include cekWewenangMilestoneOperasional() client-side guard'
  );

  assert(
    htmlContent.includes('id="modal-update-readonly-notice"'),
    'portal-tracking.html must include id="modal-update-readonly-notice" alert banner'
  );

  assert(
    htmlContent.includes('tab-btn-register') && htmlContent.includes("['ADMIN_OPS', 'PIMPINAN'].includes(normRole)"),
    'portal-tracking.html must guard "+ Registrasi Job Order Baru" button display based on RBAC'
  );

  assert(
    htmlContent.includes('SPM 2: Prinsip Independensi KPSPI-MAPPI Dilanggar!'),
    'portal-tracking.html must validate Segregation of Duties on form submission'
  );

  assert(
    htmlContent.includes('filterKantorEl.disabled = true;'),
    'portal-tracking.html must lock branch dropdown for isolated branch admins'
  );

  assert(
    htmlContent.includes('canAccessControlTower') && htmlContent.includes('tab-btn-workload'),
    'portal-tracking.html must hide Control Tower tab for technical staff (ANALIS, SURVEYOR, REVIEWER_SPM)'
  );

  assert(
    htmlContent.includes('tab-queue-all-tasks') && htmlContent.includes('isTechRole'),
    'portal-tracking.html must hide and lock queue tab to Tugas Saya for technical staff'
  );

  assert(
    htmlContent.includes('Penugasan PIC:') && htmlContent.includes('picScopeLabel'),
    'portal-tracking.html must replace Akses Nasional badge with Penugasan PIC scope badge for technical staff'
  );

} finally {
  // Restore original staging file if backed up
  if (fs.existsSync(stagingBackup)) {
    fs.copyFileSync(stagingBackup, stagingFile);
    fs.unlinkSync(stagingBackup);
  }
  // Clean up any test artifacts
  ['tmp_smoke_test.php', 'tmp_http_code.txt', 'tmp_test_rbac.php', 'tmp_test_rbac_code.txt'].forEach(f => {
    const p = path.join(projectRoot, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

// -------------------------------------------------------------
// Final Summary
// -------------------------------------------------------------
console.log('\n=================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
if (failedTests === 0) {
  console.log('STATUS: ALL RBAC 7-ROLE AUTOMATED VERIFICATIONS PASSED (100%)');
  console.log('=================================================================');
  process.exit(0);
} else {
  console.error('STATUS: VERIFICATION FAILED');
  console.log('=================================================================');
  process.exit(1);
}
