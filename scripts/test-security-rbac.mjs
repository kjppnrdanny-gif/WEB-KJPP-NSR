import fs from 'fs';

console.log('====================================================');
console.log('TEST SUITE: SECURITY & ROLE-BASED UI VALIDATION');
console.log('====================================================');

let failures = 0;

['portal-nolap.html', 'portal-nolap-dev.html'].forEach(f => {
  console.log(`\n📄 Testing File: ${f}`);
  const content = fs.readFileSync(f, 'utf8');

  // Test 1: Credential exposure check
  const hasPinBadge = content.includes('PIN [REDACTED_SUPER_ADMIN_TOKEN]');
  const hasPinInError = content.includes('Gunakan PIN: [REDACTED_SUPER_ADMIN_TOKEN]');
  if (hasPinBadge) {
    console.error(`  ✗ FAIL: "PIN [REDACTED_SUPER_ADMIN_TOKEN]" still exposed in UI of ${f}`);
    failures++;
  } else {
    console.log(`  ✓ PASS: No "PIN [REDACTED_SUPER_ADMIN_TOKEN]" badge found in ${f}`);
  }

  if (hasPinInError) {
    console.error(`  ✗ FAIL: PIN [REDACTED_SUPER_ADMIN_TOKEN] leaked in error message of ${f}`);
    failures++;
  } else {
    console.log(`  ✓ PASS: Error message is sanitized and does not leak PIN in ${f}`);
  }

  // Test 2: Neutral badge presence
  const hasNeutralBadge = content.includes('🔒 Khusus Admin Pusat');
  if (hasNeutralBadge) {
    console.log(`  ✓ PASS: Neutral badge "🔒 Khusus Admin Pusat" present in ${f}`);
  } else {
    console.error(`  ✗ FAIL: Neutral badge missing in ${f}`);
    failures++;
  }

  // Test 3: CABANG role assignment in resolveUnifiedTokenNoLap
  const hasCabangRole = content.includes("role: 'CABANG'");
  if (hasCabangRole) {
    console.log(`  ✓ PASS: Role "CABANG" correctly defined in ${f}`);
  } else {
    console.error(`  ✗ FAIL: Role "CABANG" missing in ${f}`);
    failures++;
  }

  // Test 4: Tab isolation in applyRBAC
  const hasTabIsolation = content.includes('tabBtnSpm, tabBtnApproval, tabBtnElsa, tabBtnMonitoring') &&
                          content.includes("tab.style.display = 'none'");
  if (hasTabIsolation) {
    console.log(`  ✓ PASS: Strict tab isolation (Tab 3, 4, 5, 6 hidden for Cabang) verified in ${f}`);
  } else {
    console.error(`  ✗ FAIL: Tab isolation logic missing in ${f}`);
    failures++;
  }

  // Test 5: Auto-filter Cabang in filterTabelRiwayat
  const hasAutoFilter = content.includes("targetCabang = activeUser.cabang") &&
                        content.includes("selFilter.disabled = true");
  if (hasAutoFilter) {
    console.log(`  ✓ PASS: Auto-filter by branch on Tab Riwayat verified in ${f}`);
  } else {
    console.error(`  ✗ FAIL: Auto-filter logic missing in ${f}`);
    failures++;
  }
});

console.log('\n====================================================');
if (failures === 0) {
  console.log('✨ ALL SECURITY & ROLE-BASED UI TESTS PASSED 100%!');
} else {
  console.error(`❌ ${failures} TEST(S) FAILED!`);
  process.exit(1);
}
console.log('====================================================');
