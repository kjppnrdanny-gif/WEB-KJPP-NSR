async function runTests() {
  const base = 'http://127.0.0.1:8000/backend/job-tracking-handler.php';

  console.log('--- 1. Testing action=list ---');
  let res = await fetch(`${base}?action=list`);
  let json = await res.json();
  console.log('List status:', json.status, 'Total jobs:', json.data?.length);
  if (json.data && json.data.length > 0) {
    const j = json.data[0];
    console.log('Sample job keys:', Object.keys(j));
    console.log('Pemberi Tugas:', j.pemberi_tugas, '| Pengguna Laporan:', j.pengguna_laporan, '| Client PIC Phone:', j.client_pic_phone);
  }

  console.log('\n--- 2. Testing action=track (PUBLIC endpoint - stripping opinions) ---');
  res = await fetch(`${base}?action=track&jo=JO-JKT-2026-0001&phone=081288997766`);
  json = await res.json();
  console.log('Track status:', json.status);
  if (json.data) {
    console.log('Public tracking data returned:');
    console.log('  JO:', json.data.jo_number);
    console.log('  Pemberi Tugas:', json.data.pemberi_tugas);
    console.log('  Pengguna Laporan:', json.data.pengguna_laporan);
    console.log('  Opini Nilai Pasar is stripped?', json.data.opini_nilai_pasar === undefined ? 'YES (SECURE)' : 'LEAKED!');
    console.log('  Opini Nilai Likuidasi is stripped?', json.data.opini_nilai_likuidasi === undefined ? 'YES (SECURE)' : 'LEAKED!');
  }

  console.log('\n--- 3. Testing action=get_jo_suggestions ---');
  res = await fetch(`${base}?action=get_jo_suggestions`);
  json = await res.json();
  console.log('Suggestions status:', json.status, 'Count:', json.data?.length);
  if (json.data && json.data[0]) {
    console.log('First suggestion:', json.data[0]);
  }

  console.log('\n--- 4. Testing action=verify_auth ---');
  res = await fetch(`${base}?action=verify_auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nik: 'NSR-2019-005', pin: '889900' })
  });
  json = await res.json();
  console.log('Auth status:', json.status, 'User:', json.user?.nama, 'Kantor:', json.user?.kantor);
}

runTests().catch(console.error);
