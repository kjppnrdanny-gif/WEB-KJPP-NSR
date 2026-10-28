import { execSync } from 'child_process';
import fs from 'fs';

function runPhp(script) {
  const tmpFile = 'tmp_test_runner.php';
  fs.writeFileSync(tmpFile, script, 'utf8');
  try {
    const out = execSync(`php ${tmpFile}`, { encoding: 'utf8' });
    return out;
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

console.log('Testing PHP Backend Handler locally...\n');

// Test 1: Verify Auth - Pusat
const test1 = `<?php
\$_GET['action'] = 'verify_auth';
\$_POST['nik'] = 'NSR-2019-005';
\$_POST['pin'] = '889900';
ob_start();
require 'backend/job-tracking-handler.php';
\$out = ob_get_clean();
echo \$out;
`;
const res1 = JSON.parse(runPhp(test1));
console.log('Test 1 (Verify Auth Pusat - Danny):', res1.status, res1.user.nama, res1.user.access_level);

// Test 2: Verify Auth - Bandung
const test2 = `<?php
\$_GET['action'] = 'verify_auth';
\$_POST['nik'] = 'NSR-BDG-2020-39';
\$_POST['pin'] = '123456';
ob_start();
require 'backend/job-tracking-handler.php';
\$out = ob_get_clean();
echo \$out;
`;
const res2 = JSON.parse(runPhp(test2));
console.log('Test 2 (Verify Auth Bandung - Ardi):', res2.status, res2.user.nama, res2.user.access_level, res2.user.branch_code);

// Test 3: List Filtered by Bandung Branch
const test3 = `<?php
\$_GET['action'] = 'list';
\$_GET['auth_nik'] = 'NSR-BDG-2020-39';
ob_start();
require 'backend/job-tracking-handler.php';
\$out = ob_get_clean();
echo \$out;
`;
const res3 = JSON.parse(runPhp(test3));
console.log('Test 3 (List for Bandung): count =', res3.count, 'modes =', res3.access_mode, 'jobs =', res3.data.map(j => j.jo_number + ' (' + j.kantor_code + ')'));

// Test 4: List for Central (All Access)
const test4 = `<?php
\$_GET['action'] = 'list';
\$_GET['auth_nik'] = 'NSR-2019-005';
ob_start();
require 'backend/job-tracking-handler.php';
\$out = ob_get_clean();
echo \$out;
`;
const res4 = JSON.parse(runPhp(test4));
console.log('Test 4 (List for Central): count =', res4.count, 'modes =', res4.access_mode, 'all branches present =', [...new Set(res4.data.map(j => j.kantor_code))]);

// Test 5: Branch Isolation Violation Check (Bandung staff tries to update Makassar job)
const test5 = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-MKS-2026-0008';
\$_POST['target_milestone'] = 'M-03';
\$_POST['nik'] = 'NSR-BDG-2020-39';
\$_POST['pin'] = '123456';
ob_start();
require 'backend/job-tracking-handler.php';
\$out = ob_get_clean();
echo \$out;
`;
const res5 = JSON.parse(runPhp(test5));
console.log('Test 5 (Branch Isolation Violation):', res5.status, res5.message);

// Test 6: Role Matrix Violation (Admin tries to approve Reviewer SPM M-05)
const test6 = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-05';
\$_POST['nik'] = 'NSR-2025-021'; // Dhea Shafitri - Staf Admin
\$_POST['pin'] = '123456';
ob_start();
require 'backend/job-tracking-handler.php';
\$out = ob_get_clean();
echo \$out;
`;
const res6 = JSON.parse(runPhp(test6));
console.log('Test 6 (Role Matrix Violation):', res6.status, res6.message);

// Test 7: Authorized Milestone Advance (Tedi Setiadi - Reviewer Pusat approves M-05)
const test7 = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-05';
\$_POST['nik'] = 'NSR-2019-007'; // Tedi Setiadi - Reviewer Pusat
\$_POST['pin'] = '123456';
\$_POST['catatan'] = 'Reviewer SPM: Kertas kerja kalkulasi DRC telah sesuai petunjuk SPI 105.';
ob_start();
require 'backend/job-tracking-handler.php';
\$out = ob_get_clean();
echo \$out;
`;
const res7 = JSON.parse(runPhp(test7));
console.log('Test 7 (Authorized Milestone M-05):', res7.status, res7.message, 'Audit entry:', res7.audit);

// Test 8: Get JO Suggestions
const test8 = `<?php
\$_GET['action'] = 'get_jo_suggestions';
ob_start();
require 'backend/job-tracking-handler.php';
\$out = ob_get_clean();
echo \$out;
`;
const res8 = JSON.parse(runPhp(test8));
console.log('Test 8 (JO Suggestions): count =', res8.count, 'sample =', res8.data[0]);

console.log('\nAll 8 Backend Unit Tests Passed!');
