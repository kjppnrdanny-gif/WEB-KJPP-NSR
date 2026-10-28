import { spawn } from 'child_process';
import fetch from 'node-fetch';

async function main() {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E PIN & WFH LOCK TEST SUITE');
  console.log('========================================================\n');

  // Start temporary PHP server
  const phpProcess = spawn('php', ['-S', '127.0.0.1:8765', 'absensi-data-handler.php'], {
    cwd: process.cwd()
  });

  await new Promise(r => setTimeout(r, 1500));

  try {
    const baseUrl = 'http://127.0.0.1:8765';

    // Test 1: Management Danny Taufik NSR-2019-005 with PIN 889900
    console.log('1. Testing Danny Taufik (NSR-2019-005) with Management PIN 889900...');
    const r1 = await fetch(`${baseUrl}?action=verify_pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'nik=NSR-2019-005&pin=889900'
    }).then(r => r.json());
    console.log('   Result:', r1);
    if (!r1.success || !r1.isAdminHR || r1.force_change_pin || !r1.gps_wfh) {
      throw new Error('Test 1 Failed: Danny Taufik auth unexpected');
    }
    console.log('   ✓ Passed: Admin HR true, WFH locked point present, force_change_pin false\n');

    // Test 2: Latief Satihi NSR-2019-012 with Default PIN 123456 (Has >= 1 attendance record)
    console.log('2. Testing Latief Satihi (NSR-2019-012) with Default PIN 123456 (Attendance count >= 1)...');
    const r2 = await fetch(`${baseUrl}?action=verify_pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'nik=NSR-2019-012&pin=123456'
    }).then(r => r.json());
    console.log('   Result:', r2);
    if (!r2.success || r2.force_change_pin !== true || r2.attendance_count < 1) {
      throw new Error('Test 2 Failed: Latief Satihi should trigger force_change_pin');
    }
    console.log('   ✓ Passed: force_change_pin is TRUE, attendance_count = ' + r2.attendance_count + '\n');

    // Test 3: Deni Siswandi NSR-2019-002 with Default PIN 123456 (0 Attendance record)
    console.log('3. Testing Deni Siswandi (NSR-2019-002) with Default PIN 123456 (Attendance count = 0)...');
    const r3 = await fetch(`${baseUrl}?action=verify_pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'nik=NSR-2019-002&pin=123456'
    }).then(r => r.json());
    console.log('   Result:', r3);
    if (!r3.success || r3.force_change_pin !== false || r3.warning_default_pin !== true || !r3.sessionToken) {
      throw new Error('Test 3 Failed: Deni Siswandi should trigger warning_default_pin and issue sessionToken');
    }
    console.log('   ✓ Passed: warning_default_pin is TRUE, force_change_pin is FALSE, sessionToken issued\n');

    // Test 4: Direct Change PIN validation (Reject 123456, reject letters)
    console.log('4. Testing direct_change_pin validation...');
    const r4a = await fetch(`${baseUrl}?action=direct_change_pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'nik=NSR-2019-002&new_pin=123456'
    }).then(r => r.json());
    console.log('   4a. Reject 123456:', r4a.message);
    if (r4a.success) throw new Error('Test 4a Failed: should reject 123456 as new PIN');

    const r4b = await fetch(`${baseUrl}?action=direct_change_pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'nik=NSR-2019-002&new_pin=12AB56'
    }).then(r => r.json());
    console.log('   4b. Reject alphanumeric:', r4b.message);
    if (r4b.success) throw new Error('Test 4b Failed: should reject alphanumeric new PIN');
    console.log('   ✓ Passed: direct_change_pin validation strictly enforced\n');

    // Test 5: Permanent WFH Lock rejection on registered user
    console.log('5. Testing Permanent WFH Lock on registered user Danny Taufik...');
    const r5 = await fetch(`${baseUrl}?action=simpanWFH`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': r1.sessionToken
      },
      body: JSON.stringify({
        action: 'simpanWFH',
        nik: 'NSR-2019-005',
        sessionToken: r1.sessionToken,
        alamat: 'Alamat Baru',
        gps: '-6.2000,106.8000'
      })
    }).then(r => r.json());
    console.log('   Result:', r5.message);
    if (r5.success || !r5.message.includes('terkunci permanen')) {
      throw new Error('Test 5 Failed: Re-registration of registered WFH should be rejected');
    }
    console.log('   ✓ Passed: Permanent WFH lock strictly prevents overriding registered point\n');

    console.log('========================================================');
    console.log('🎉 ALL 5 E2E TESTS PASSED WITH 100% ACCURACY!');
    console.log('========================================================\n');

  } finally {
    phpProcess.kill();
  }
}

main().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
