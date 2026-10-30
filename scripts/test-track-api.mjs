import { spawn } from 'child_process';
import path from 'path';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PORT = 8199;

async function run() {
  console.log(`Starting PHP test server on port ${PORT}...`);
  const server = spawn(PHP_BIN, [
    '-d', `extension_dir=${PHP_EXT_DIR}`,
    '-d', 'extension=curl',
    '-d', 'extension=openssl',
    '-S', `127.0.0.1:${PORT}`,
    '-t', path.resolve('.')
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    console.log('\n--- TEST 1: Track JO-BDG-2026-0015 dengan phone 081322445566 (Harus Sukses) ---');
    const res1 = await fetch(`http://127.0.0.1:${PORT}/backend/job-tracking-handler.php?action=track&jo=JO-BDG-2026-0015&phone=081322445566`);
    const data1 = await res1.json();
    console.log('Status HTTP:', res1.status, '| Status JSON:', data1.status);
    if (res1.status !== 200 || data1.status !== 'success') {
      throw new Error('Test 1 failed: ' + JSON.stringify(data1));
    }
    console.log('✅ TEST 1 PASSED: Milestone', data1.data.current_milestone, '-', data1.data.current_milestone_title);

    console.log('\n--- TEST 2: Track JO-BDG-2026-0015 dengan format +62 813-2244-5566 (Harus Sukses Identik) ---');
    const res2 = await fetch(`http://127.0.0.1:${PORT}/backend/job-tracking-handler.php?action=track&jo=JO-BDG-2026-0015&phone=${encodeURIComponent('+62 813-2244-5566')}`);
    const data2 = await res2.json();
    console.log('Status HTTP:', res2.status, '| Status JSON:', data2.status);
    if (res2.status !== 200 || data2.status !== 'success') {
      throw new Error('Test 2 failed: ' + JSON.stringify(data2));
    }
    console.log('✅ TEST 2 PASSED: Normalisasi nomor internasional + format strip berhasil.');

    console.log('\n--- TEST 3: Track JO-BDG-2026-0015 dengan nomor WA salah (Harus 403 PHONE_MISMATCH) ---');
    const res3 = await fetch(`http://127.0.0.1:${PORT}/backend/job-tracking-handler.php?action=track&jo=JO-BDG-2026-0015&phone=081299998888`);
    const data3 = await res3.json();
    console.log('Status HTTP:', res3.status, '| Code:', data3.code, '| Message:', data3.message);
    if (res3.status !== 403 || data3.code !== 'PHONE_MISMATCH') {
      throw new Error('Test 3 failed: ' + JSON.stringify(data3));
    }
    console.log('✅ TEST 3 PASSED: PHONE_MISMATCH terdeteksi.');

    console.log('\n--- TEST 4: Track Nomor JO fiktif JO-XYZ-9999 (Harus 404 JO_NOT_FOUND) ---');
    const res4 = await fetch(`http://127.0.0.1:${PORT}/backend/job-tracking-handler.php?action=track&jo=JO-XYZ-9999&phone=081322445566`);
    const data4 = await res4.json();
    console.log('Status HTTP:', res4.status, '| Code:', data4.code, '| Message:', data4.message);
    if (res4.status !== 404 || data4.code !== 'JO_NOT_FOUND') {
      throw new Error('Test 4 failed: ' + JSON.stringify(data4));
    }
    console.log('✅ TEST 4 PASSED: JO_NOT_FOUND terdeteksi.');

  } finally {
    server.kill();
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
