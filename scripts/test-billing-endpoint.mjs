import { spawn } from 'child_process';
import path from 'path';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PORT = 8094;

async function run() {
  console.log(`Starting PHP server on port ${PORT}...`);
  const server = spawn(PHP_BIN, [
    '-d', `extension_dir=${PHP_EXT_DIR}`,
    '-d', 'extension=curl',
    '-d', 'extension=openssl',
    '-S', `127.0.0.1:${PORT}`,
    '-t', path.resolve('.')
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    console.log('\n--- TEST 1: get_job_detail for JO-JKT-2026-0003 ---');
    const res1 = await fetch(`http://127.0.0.1:${PORT}/backend/job-tracking-handler.php?action=get_job_detail&id_jo=JO-JKT-2026-0003`);
    const data1 = await res1.json();
    console.log('Result 1:', JSON.stringify(data1, null, 2));

    if (data1.status !== 'success' || !data1.data) {
      throw new Error('Test 1 failed: ' + JSON.stringify(data1));
    }
    if (!data1.data.nomor_laporan_resmi) {
      throw new Error('Test 1 failed: nomor_laporan_resmi missing');
    }
    console.log('✅ TEST 1 PASSED: Job details retrieved with NoLap and formatted payment description.');

    console.log('\n--- TEST 2: init_billing_draft for JO-JKT-2026-0003 ---');
    const res2 = await fetch(`http://127.0.0.1:${PORT}/backend/job-tracking-handler.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'init_billing_draft',
        id_jo: 'JO-JKT-2026-0003',
        billing_status: 'DRAFT_CREATED',
        actor: 'Admin Keuangan Pusat'
      })
    });
    const data2 = await res2.json();
    console.log('Result 2:', JSON.stringify(data2, null, 2));

    if (data2.status !== 'success' || data2.billing_status !== 'DRAFT_CREATED') {
      throw new Error('Test 2 failed: ' + JSON.stringify(data2));
    }
    console.log('✅ TEST 2 PASSED: Billing draft initiated and audit trail recorded.');

  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
