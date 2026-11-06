import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 SMOKE TEST: Hard Gating M-06 & M-07 + Cross-Portal SSO Bridge');
console.log('====================================================\n');

const stagingFile = path.resolve('data/job_tracking_staging.json');
const backupFile = path.resolve('data/job_tracking_staging.backup.json');

// Backup original staging data
if (fs.existsSync(stagingFile)) {
  fs.copyFileSync(stagingFile, backupFile);
}

function runPhpTest(setupCode) {
  const tmpFile = path.resolve('tmp_smoke_test.php');
  const codeFile = path.resolve('tmp_http_code.txt');
  const outFile = path.resolve('tmp_out.txt');

  const fullScript = `<?php
register_shutdown_function(function() {
    $code = http_response_code();
    if (!$code) $code = 200;
    file_put_contents('${codeFile.replace(/\\/g, '/')}', (string)$code);
});
ob_start();
${setupCode}
require 'backend/job-tracking-handler.php';
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

let allPassed = true;

try {
  // ----------------------------------------------------
  // TEST 1: Hard Gating M-06 - Missing NoLap Rejected (HTTP 422)
  // ----------------------------------------------------
  console.log('▶ [1/4] Testing Hard Gating M-06 (Tanpa NoLap)...');

  // Modifikasi sementara job agar job['nomor_laporan_resmi'] kosong
  const stagingRaw = JSON.parse(fs.readFileSync(stagingFile, 'utf8'));
  const targetJob = stagingRaw['JO-JKT-2026-0001'];
  if (targetJob) {
    delete targetJob.nomor_laporan_resmi;
    delete targetJob.no_laporan;
    targetJob.current_milestone = 'M-05';
    fs.writeFileSync(stagingFile, JSON.stringify(stagingRaw, null, 2), 'utf8');
  }

  const res1 = runPhpTest(`
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-06';
\$_POST['nik'] = 'NSR-2019-005';
\$_POST['pin'] = '889900';
\$_POST['catatan'] = 'Uji coba otorisasi M-06 tanpa nomor laporan';
\$_POST['nomor_laporan_resmi'] = '';
\$_POST['no_laporan'] = '';
`);

  if (res1.httpCode === 422 && res1.body?.code === 'NOLAP_REQUIRED') {
    console.log('   ✅ PASS: M-06 ditolak dengan HTTP 422 & code NOLAP_REQUIRED.');
    console.log('      Pesan:', res1.body?.message);
  } else {
    console.error('   ❌ FAIL: Respon tidak sesuai:', res1);
    allPassed = false;
  }

  // ----------------------------------------------------
  // TEST 2: Hard Gating M-06 - Valid NoLap Approved (HTTP 200)
  // ----------------------------------------------------
  console.log('\n▶ [2/4] Testing Hard Gating M-06 (Dengan NoLap Valid)...');
  const res2 = runPhpTest(`
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-06';
\$_POST['nik'] = 'NSR-2019-005';
\$_POST['pin'] = '889900';
\$_POST['nomor_laporan_resmi'] = '00192/2.0160-00/PI/03/0192/1/X/2026';
\$_POST['catatan'] = 'Otorisasi M-06 dengan NoLap resmi Kemenkeu RI';
`);

  if (res2.httpCode === 200 && res2.body?.status === 'success' && res2.body?.data?.current_milestone === 'M-06') {
    console.log('   ✅ PASS: M-06 berhasil disahkan dengan NoLap resmi.');
    console.log('      Milestone Aktif:', res2.body?.data?.current_milestone, '| Progress:', res2.body?.data?.progress_percent + '%', '| NoLap:', res2.body?.data?.nomor_laporan_resmi);
  } else {
    console.error('   ❌ FAIL: Respon tidak sesuai:', res2);
    allPassed = false;
  }

  // ----------------------------------------------------
  // TEST 3: Hard Gating M-07 - Kwitansi Unverified Rejected (HTTP 422)
  // ----------------------------------------------------
  console.log('\n▶ [3/4] Testing Hard Gating M-07 (Status Kwitansi Belum Terverifikasi)...');
  const res3 = runPhpTest(`
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-07';
\$_POST['nik'] = 'NSR-2019-005';
\$_POST['pin'] = '889900';
\$_POST['status_kwitansi'] = 'BELUM_LUNAS'; // Invalid
\$_POST['catatan'] = 'Mencoba distribusi final sebelum lunas';
`);

  if (res3.httpCode === 422 && res3.body?.code === 'KWITANSI_UNVERIFIED') {
    console.log('   ✅ PASS: M-07 ditolak dengan HTTP 422 & code KWITANSI_UNVERIFIED.');
    console.log('      Pesan:', res3.body?.message);
  } else {
    console.error('   ❌ FAIL: Respon tidak sesuai:', res3);
    allPassed = false;
  }

  // ----------------------------------------------------
  // TEST 4: Hard Gating M-07 - Kwitansi LUNAS Approved (HTTP 200 & Completed)
  // ----------------------------------------------------
  console.log('\n▶ [4/4] Testing Hard Gating M-07 (Status Kwitansi LUNAS)...');
  const res4 = runPhpTest(`
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-07';
\$_POST['nik'] = 'NSR-2019-005';
\$_POST['pin'] = '889900';
\$_POST['status_kwitansi'] = 'LUNAS';
\$_POST['catatan'] = 'Kwitansi diverifikasi lunas, berkas final didistribusikan.';
`);

  if (res4.httpCode === 200 && res4.body?.status === 'success' && res4.body?.data?.current_milestone === 'M-07' && res4.body?.data?.progress_percent === 100) {
    console.log('   ✅ PASS: M-07 berhasil disahkan 100% completed.');
    console.log('      Milestone:', res4.body?.data?.current_milestone, '| Progress:', res4.body?.data?.progress_percent + '%', '| SLA:', res4.body?.data?.sla_status, '| M-07 Status:', res4.body?.data?.milestones?.['M-07']?.status);
  } else {
    console.error('   ❌ FAIL: Respon tidak sesuai:', res4);
    allPassed = false;
  }

  // ----------------------------------------------------
  // TEST 5: Cross-Portal SSO Bridge Session Verification
  // ----------------------------------------------------
  console.log('\n▶ [5/5] Verifikasi Cross-Portal SSO Bridge (Storage Keys & Readers)...');
  const trackingHtml = fs.readFileSync('portal-tracking.html', 'utf8');
  const keuanganHtml = fs.readFileSync('portal-keuangan.html', 'utf8');
  const nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');

  const ssoKey = 'NSR_USER_SESSION';
  const tokenKey = 'nsr_tracking_auth_token';

  const trackingSavesSSO = trackingHtml.includes(`localStorage.setItem('${ssoKey}'`) && trackingHtml.includes(`sessionStorage.setItem('${ssoKey}'`);
  const trackingReadsSSO = trackingHtml.includes(`localStorage.getItem('${tokenKey}')`) || trackingHtml.includes(`localStorage.getItem('NSR_AUTH_TOKEN')`);
  
  const keuanganReadsSSO = keuanganHtml.includes(`localStorage.getItem('NSR_USER_SESSION')`) || keuanganHtml.includes(`sessionStorage.getItem('NSR_USER_SESSION')`);
  const nolapReadsSSO = nolapHtml.includes(`localStorage.getItem('NSR_USER_SESSION')`) || nolapHtml.includes(`sessionStorage.getItem('NSR_USER_SESSION')`);

  console.log('   - portal-tracking.html menyimpan ke localStorage & sessionStorage:', trackingSavesSSO ? '✅ YES' : '❌ NO');
  console.log('   - portal-tracking.html auto-read token dari localStorage:', trackingReadsSSO ? '✅ YES' : '❌ NO');
  console.log('   - portal-keuangan.html membaca session dari localStorage:', keuanganReadsSSO ? '✅ YES' : '❌ NO');
  console.log('   - portal-nolap.html membaca session dari localStorage:', nolapReadsSSO ? '✅ YES' : '❌ NO');

  if (trackingSavesSSO && trackingReadsSSO && keuanganReadsSSO && nolapReadsSSO) {
    console.log('   ✅ PASS: Cross-Portal SSO Bridge sinkron 100%!');
  } else {
    console.error('   ❌ FAIL: Cross-Portal SSO Bridge key tidak lengkap.');
    allPassed = false;
  }

} finally {
  // Restore staging backup
  if (fs.existsSync(backupFile)) {
    fs.copyFileSync(backupFile, stagingFile);
    fs.unlinkSync(backupFile);
    console.log('\n🔄 Data staging berhasil direstorasi ke kondisi steril.');
  }
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\n🎉 SELURUH SMOKE TEST HARD GATING & SSO BRIDGE BERHASIL DENGAN SEMPURNA!');
}
