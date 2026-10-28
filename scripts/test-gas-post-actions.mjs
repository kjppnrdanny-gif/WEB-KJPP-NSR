const url = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';

async function testAction(action, payload = {}) {
  console.log(`\n--- Testing ${action} ---`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    });
    console.log(`Status: ${res.status}, Redirected: ${res.redirected}, Final URL: ${res.url.substring(0, 80)}...`);
    const text = await res.text();
    console.log(`Response length: ${text.length}`);
    if (text.startsWith('{')) {
      console.log('JSON Response:', JSON.parse(text));
    } else {
      console.log('Non-JSON Response (first 200 chars):', text.substring(0, 200));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function run() {
  await testAction('STATUS');
  await testAction('cekKaryawan', { nik: 'NSR-2019-005' });
  await testAction('cekKaryawan', { nik: 'NSR-2020-012' });
}

run();
