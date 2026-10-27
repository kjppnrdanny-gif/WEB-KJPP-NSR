import fs from 'fs';

const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';
const webAppUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

async function testAction(action, payload = {}) {
  const res = await fetch(webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });
  return await res.json();
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 TESTING PIN AUTHENTICATION SUITE');
  console.log('========================================================\n');

  // Test 1: Management NSR-2019-005 with PIN 889900
  console.log('Test 1: Danny Taufik (NSR-2019-005) with Management PIN 889900');
  const t1 = await testAction('verify_pin', { nik: 'NSR-2019-005', pin: '889900', remember_device: true });
  console.log('  Status:', t1.status, '| AdminHR:', t1.isAdminHR, '| Nama:', t1.nama);
  if (!t1.success || !t1.isAdminHR) throw new Error('Test 1 failed: ' + JSON.stringify(t1));

  // Test 2: Pusat Employee Latief Satihi NSR-2019-012 with PIN 123456 (has email)
  console.log('\nTest 2: Latief Satihi (NSR-2019-012) with default PIN 123456 (Email present)');
  const t2 = await testAction('verify_pin', { nik: 'NSR-2019-012', pin: '123456' });
  console.log('  Status:', t2.status, '| NeedsEmailUpdate:', t2.needs_email_update, '| Cabang:', t2.cabang);
  if (!t2.success || t2.needs_email_update !== false) throw new Error('Test 2 failed: ' + JSON.stringify(t2));

  // Test 3: Pusat Employee without email Yanto NSR-2019-014 with PIN 123456 (Auto-prompt email)
  console.log('\nTest 3: Yanto (NSR-2019-014) with default PIN 123456 (No email in DB -> Auto-prompt)');
  const t3 = await testAction('verify_pin', { nik: 'NSR-2019-014', pin: '123456' });
  console.log('  Status:', t3.status, '| NeedsEmailUpdate:', t3.needs_email_update, '| Message:', t3.message);
  if (!t3.success || t3.needs_email_update !== true) throw new Error('Test 3 failed: ' + JSON.stringify(t3));

  // Test 4: Makassar Employee Amin Sade NSR-MKS-2019-30 with PIN 123456
  console.log('\nTest 4: Amin Sade (NSR-MKS-2019-30) Cabang Makassar');
  const t4 = await testAction('verify_pin', { nik: 'NSR-MKS-2019-30', pin: '123456' });
  console.log('  Status:', t4.status, '| Cabang:', t4.cabang, '| NeedsEmailUpdate:', t4.needs_email_update);
  if (!t4.success || t4.cabang !== 'Cabang Makassar') throw new Error('Test 4 failed: ' + JSON.stringify(t4));

  // Test 5: Bandung Employee NSR-BDG-2020-38 with PIN 123456
  console.log('\nTest 5: Cabang Bandung (NSR-BDG-2020-38)');
  const t5 = await testAction('verify_pin', { nik: 'NSR-BDG-2020-38', pin: '123456' });
  console.log('  Status:', t5.status, '| Cabang:', t5.cabang);
  if (!t5.success || t5.cabang !== 'Cabang Bandung') throw new Error('Test 5 failed: ' + JSON.stringify(t5));

  // Test 6: Palembang Employee NSR-PLB-2022-44 with PIN 123456
  console.log('\nTest 6: Cabang Palembang (NSR-PLB-2022-44)');
  const t6 = await testAction('verify_pin', { nik: 'NSR-PLB-2022-44', pin: '123456' });
  console.log('  Status:', t6.status, '| Cabang:', t6.cabang);
  if (!t6.success || t6.cabang !== 'Cabang Palembang') throw new Error('Test 6 failed: ' + JSON.stringify(t6));

  // Test 7: Wrong PIN
  console.log('\nTest 7: Wrong PIN (Expected rejection)');
  const t7 = await testAction('verify_pin', { nik: 'NSR-2019-012', pin: '999999' });
  console.log('  Status:', t7.status, '| Message:', t7.message);
  if (t7.status !== 'error' || !t7.message.includes('PIN Presensi salah')) throw new Error('Test 7 failed: ' + JSON.stringify(t7));

  console.log('\n========================================================');
  console.log('🎉 ALL PIN AUTHENTICATION SUITE TESTS PASSED PERFECTLY!');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
